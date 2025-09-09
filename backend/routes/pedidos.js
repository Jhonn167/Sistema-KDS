// backend/routes/pedidos.js - VERSIÓN FINAL Y COMPLETA

const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth');

module.exports = function(io, getOnlineUsers) {
  const router = express.Router();

  // --- RUTA PARA CREAR UN NUEVO PEDIDO (Desde el POS o el Cliente) ---
  router.post('/', checkAuth, async (req, res) => {
    const { items, total } = req.body;
    const usuario_id = req.userData.userId;

    if (!items || items.length === 0 || total === undefined) {
      return res.status(400).json({ message: 'Datos del pedido incompletos.' });
    }

    const connection = await pool.connect();

    try {
      await connection.query('BEGIN');

      // TODOS los pedidos nuevos, sin importar el rol, entran como 'Pendiente'
      const estatusPedido = 'Pendiente';

      const pedidoQuery = 'INSERT INTO pedidos (usuario_id, total, estatus) VALUES ($1, $2, $3) RETURNING id_pedido';
      const pedidoResult = await connection.query(pedidoQuery, [usuario_id, total, estatusPedido]);
      const nuevoPedidoId = pedidoResult.rows[0].id_pedido;

      for (const item of items) {
        const stockResult = await connection.query('SELECT stock FROM productos WHERE id_producto = $1', [item.producto_id]);
        
        if (stockResult.rows.length === 0 || stockResult.rows[0].stock < item.cantidad) {
          await connection.query('ROLLBACK');
          return res.status(409).json({ message: `Stock insuficiente para el producto ID ${item.producto_id}` });
        }

        const detalleQuery = 'INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad) VALUES ($1, $2, $3)';
        await connection.query(detalleQuery, [nuevoPedidoId, item.producto_id, item.cantidad]);
        
        const updateStockQuery = 'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2';
        await connection.query(updateStockQuery, [item.cantidad, item.producto_id]);
      }

      await connection.query('COMMIT');

      // Después de confirmar el pedido, enviamos una notificación a todas las pantallas KDS
      io.emit('nuevo_pedido_cocina');
      console.log('Notificación de nuevo pedido enviada al KDS.');

      res.status(201).json({ message: 'Pedido creado exitosamente', pedidoId: nuevoPedidoId });

    } catch (error) {
      await connection.query('ROLLBACK');
      console.error("ERROR DETALLADO EN POST /api/pedidos:", error);
      res.status(500).json({ message: 'Error en el servidor al procesar el pedido', error: error.message });
    } finally {
      connection.release();
    }
  });


  // --- OBTENER LOS PEDIDOS DE UN USUARIO ESPECÍFICO (CLIENTE) ---
  router.get('/mis-pedidos', checkAuth, async (req, res) => {
    const usuario_id = req.userData.userId;
    try {
      const query = `
        SELECT p.id_pedido, p.fecha, p.total, p.estatus 
        FROM pedidos p 
        WHERE p.usuario_id = $1 
        ORDER BY p.fecha DESC
      `;
      const { rows } = await pool.query(query, [usuario_id]);
      res.status(200).json(rows);
    } catch (error) {
      console.error("ERROR DETALLADO EN GET /mis-pedidos:", error);
      res.status(500).json({ message: 'Error al obtener los pedidos del usuario.', error: error.message });
    }
  });


  // --- OBTENER PEDIDOS PARA LA COCINA (KDS) ---
  router.get('/cocina', checkAuth, async (req, res) => {
    if (req.userData.rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado.' });
    }
    try {
      const query = `
        SELECT 
          p.id_pedido, p.fecha, p.estatus,
          json_agg(json_build_object('producto', pr.nombre, 'cantidad', dp.cantidad)) AS items
        FROM pedidos p
        JOIN detalles_pedido dp ON p.id_pedido = dp.pedido_id
        JOIN productos pr ON dp.producto_id = pr.id_producto
        WHERE p.estatus = 'Pendiente' OR p.estatus = 'En Preparación'
        GROUP BY p.id_pedido
        ORDER BY p.fecha ASC;
      `;
      const { rows } = await pool.query(query);
      res.status(200).json(rows);
    } catch (error) {
      console.error("ERROR DETALLADO EN GET /cocina:", error);
      res.status(500).json({ message: 'Error al obtener los pedidos para la cocina', error: error.message });
    }
  });


  // --- ACTUALIZAR EL ESTATUS DE UN PEDIDO Y NOTIFICAR AL CLIENTE ---
  // backend/routes/pedidos.js

// ... (dentro de la función que exportas) ...
router.put('/cocina/:id', checkAuth, async (req, res) => {
  // ... (lógica para verificar el rol de admin)
  try {
    const { id } = req.params;
    const { estatus } = req.body;

    const userResult = await pool.query('SELECT usuario_id FROM pedidos WHERE id_pedido = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }
    const targetUserId = userResult.rows[0].usuario_id;

    await pool.query('UPDATE pedidos SET estatus = $1 WHERE id_pedido = $2', [estatus, id]);

    // --- ESPÍAS AÑADIDOS ---
    const onlineUsers = getOnlineUsers();
    const targetSocketId = onlineUsers[targetUserId];
    console.log(`[Notificación] Intentando notificar al usuario con ID: ${targetUserId}`);
    console.log('[Notificación] Estado de onlineUsers:', onlineUsers);
    console.log(`[Notificación] Socket ID encontrado para el usuario: ${targetSocketId}`);
    // --- FIN DE ESPÍAS ---

    if (targetSocketId) {
      io.to(targetSocketId).emit('estatus_actualizado', { 
        pedidoId: id, 
        nuevoEstatus: estatus 
      });
      console.log(`[Notificación] Mensaje enviado al socket ${targetSocketId}`);
    }

    io.emit('pedido_actualizado_cocina');
    res.status(200).json({ message: `Pedido #${id} actualizado a ${estatus}` });
  } catch (error) {
    // ...
  }
});
// ...

  return router;
};