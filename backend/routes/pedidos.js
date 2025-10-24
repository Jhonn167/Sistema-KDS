// backend/routes/pedidos.js

const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth');
const checkRole = require('../middleware/checkRole');

module.exports = function (io, getOnlineUsers) {
  const router = express.Router();

  // --- RUTA PARA CREAR UN NUEVO PEDIDO (UNIFICADA) ---
  router.post('/', checkAuth, async (req, res) => {
    // CORRECCIÓN: Tu archivo tenía 'fecha_recogida' pero también 'hora_recogida'. Se estandariza a 'fecha_recogida' y se añade 'telefono_contacto'.
    const { items, fecha_recogida, estatus, tipo_pedido = 'inmediato', telefono_contacto } = req.body;
    const usuario_id = req.userData.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'El pedido debe contener al menos un producto.' });
    }

    // Validación de cantidad para pedidos futuros
    if (tipo_pedido === 'futuro') {
      for (const item of items) {
        if (item.cantidad > 50) {
          return res.status(400).json({ message: `Para pedidos programados, la cantidad máxima por producto es de 50 unidades.` });
        }
      }
    }

    const connection = await pool.connect();
    try {
      await connection.query('BEGIN');

      let calculatedTotal = 0;
      for (const item of items) {
        // Usamos el precio final que ya incluye modificadores, enviado desde el frontend
        calculatedTotal += parseFloat(item.precioFinal) * item.cantidad;
      }

      const estatusPedido = estatus || (tipo_pedido === 'futuro' ? 'Programado' : 'Pendiente');
      
      const pedidoQuery = 'INSERT INTO pedidos (usuario_id, total, estatus, fecha_recogida, tipo_pedido, telefono_contacto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_pedido';
      const pedidoResult = await connection.query(pedidoQuery, [usuario_id, calculatedTotal, estatusPedido, fecha_recogida || null, tipo_pedido, telefono_contacto || null]);
      const nuevoPedidoId = pedidoResult.rows[0].id_pedido;

      const shouldUpdateStockNow = (tipo_pedido === 'inmediato' && estatusPedido !== 'Esperando Pago' && estatusPedido !== 'Esperando Comprobante');

      for (const item of items) {
        if (shouldUpdateStockNow) {
          const stockResult = await connection.query('SELECT stock FROM productos WHERE id_producto = $1', [item.producto_id]);
          if (stockResult.rows.length === 0 || stockResult.rows[0].stock < item.cantidad) {
            await connection.query('ROLLBACK');
            return res.status(409).json({ message: `Stock insuficiente para el producto ID ${item.producto_id}` });
          }
          await connection.query('UPDATE productos SET stock = stock - $1 WHERE id_producto = $2', [item.cantidad, item.producto_id]);
        }
        // Esta lógica ya es correcta para guardar el JSON de opciones, sea simple o complejo (con cantidad)
        const detalleQuery = 'INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, opciones_seleccionadas) VALUES ($1, $2, $3, $4)';
        await connection.query(detalleQuery, [nuevoPedidoId, item.producto_id, item.cantidad, JSON.stringify(item.selectedOptions || [])]);
      }

      await connection.query('COMMIT');
      
      if (estatusPedido === 'Pendiente' || estatusPedido === 'Programado') {
        io.emit('nuevo_pedido_cocina');
      }
      
      res.status(201).json({ message: 'Pedido creado exitosamente', pedidoId: nuevoPedidoId });
    
    } catch (error) {
      await connection.query('ROLLBACK');
      console.error("ERROR DETALLADO EN POST /api/pedidos:", error);
      res.status(500).json({ message: 'Error en el servidor al procesar el pedido' });
    } finally {
      connection.release();
    }
  });

  // --- RUTA KDS (CON NOMBRE DE CLIENTE) ---
  router.get('/cocina', checkRole(['admin', 'cocinero']), async (req, res) => {
    try {
      const query = `
        SELECT 
          p.id_pedido, p.fecha, p.estatus, p.fecha_recogida, p.preparacion_iniciada_en,
          u.nombre AS nombre_cliente,
          json_agg(json_build_object('producto', pr.nombre, 'cantidad', dp.cantidad, 'opciones', dp.opciones_seleccionadas)) AS items
        FROM pedidos p
        JOIN detalles_pedido dp ON p.id_pedido = dp.pedido_id
        JOIN productos pr ON dp.producto_id = pr.id_producto
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.estatus IN ('Pendiente', 'En Preparación', 'Programado')
        GROUP BY p.id_pedido, u.nombre
        ORDER BY p.fecha ASC;
      `;
      const { rows } = await pool.query(query);
      res.status(200).json(rows);
    } catch (error) {
      console.error("ERROR DETALLADO EN GET /cocina:", error);
      res.status(500).json({ message: 'Error en el servidor.' });
    }
  });

  // --- ACTUALIZAR ESTATUS (LÓGICA MEJORADA) ---
  router.put('/cocina/:id', checkRole(['admin', 'cocinero']), async (req, res) => {
    try {
      const { id } = req.params;
      const { estatus } = req.body;

      let query = 'UPDATE pedidos SET estatus = $1 WHERE id_pedido = $2';
      const values = [estatus, id];

      if (estatus === 'En Preparación') {
        query = 'UPDATE pedidos SET estatus = $1, preparacion_iniciada_en = NOW() WHERE id_pedido = $2';
      }

      await pool.query(query, values);
      
      // Notificar al cliente si está conectado
      const userResult = await pool.query('SELECT usuario_id FROM pedidos WHERE id_pedido = $1', [id]);
      if (userResult.rows.length > 0) {
        const targetUserId = userResult.rows[0].usuario_id;
        const onlineUsers = getOnlineUsers();
        const targetSocketId = onlineUsers[targetUserId];
        if (targetSocketId) {
          io.to(targetSocketId).emit('estatus_actualizado', { pedidoId: id, nuevoEstatus: estatus });
        }
      }

      io.emit('pedido_actualizado_cocina'); 
      res.status(200).json({ message: `Pedido #${id} actualizado a ${estatus}` });
    } catch (error) {
      console.error("ERROR DETALLADO EN PUT /cocina/:id:", error);
      res.status(500).json({ message: 'Error al actualizar el estatus del pedido' });
    }
  });

  // --- RUTA PARA PEDIDOS PENDIENTES DE CONFIRMACIÓN ---
  router.get('/pending-confirmation', checkRole(['admin', 'empleado']), async (req, res) => {
    try {
      const query = `
        SELECT p.id_pedido, p.fecha, p.total, u.nombre AS nombre_cliente, p.comprobante_url
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE p.estatus = 'Esperando Comprobante'
        ORDER BY p.fecha ASC;
      `;
      const { rows } = await pool.query(query);
      res.status(200).json(rows);
    } catch (error) {
      console.error("Error al obtener pedidos pendientes:", error);
      res.status(500).json({ message: 'Error en el servidor.' });
    }
  });

  // --- OBTENER LOS PEDIDOS DE UN USUARIO ---
  router.get('/mis-pedidos', checkAuth, async (req, res) => {
    const usuario_id = req.userData.userId;
    try {
      const query = `
        SELECT p.id_pedido, p.fecha, p.total, p.estatus, p.fecha_recogida 
        FROM pedidos p 
        WHERE p.usuario_id = $1 
        ORDER BY p.fecha DESC
      `;
      const { rows } = await pool.query(query, [usuario_id]);
      res.status(200).json(rows);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los pedidos del usuario.' });
    }
  });

  // --- CONFIRMAR PAGO POR TRANSFERENCIA ---
  router.post('/confirm-transfer/:orderId', checkRole(['admin', 'empleado']), async (req, res) => {
    const { orderId } = req.params;
    const connection = await pool.connect();
    try {
      await connection.query('BEGIN');
      const detailsResult = await connection.query('SELECT * FROM detalles_pedido WHERE pedido_id = $1', [orderId]);
      for (const item of detailsResult.rows) {
        await connection.query('UPDATE productos SET stock = stock - $1 WHERE id_producto = $2', [item.cantidad, item.producto_id]);
      }
      await connection.query("UPDATE pedidos SET estatus = 'Pendiente' WHERE id_pedido = $1", [orderId]);
      await connection.query('COMMIT');
      io.emit('nuevo_pedido_cocina');
      res.status(200).json({ message: 'Pago por transferencia confirmado.' });
    } catch (error) {
      await connection.query('ROLLBACK');
      res.status(500).json({ message: 'Error al confirmar el pago.' });
    } finally {
      connection.release();
    }
  });

  return router;
};