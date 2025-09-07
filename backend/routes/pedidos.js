// backend/routes/pedidos.js

const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// --- RUTA PARA CREAR UN NUEVO PEDIDO (Desde el POS o el Cliente) ---
// Esta ruta ya la habías implementado, ahora vivirá en este archivo.
router.post('/', checkAuth, async (req, res) => {
  const { items, total } = req.body;
  const usuario_id = req.userData.userId;

  if (!items || items.length === 0 || total === undefined) {
    return res.status(400).json({ message: 'Datos del pedido incompletos.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const estatusPedido = req.userData.rol === 'admin' ? 'Completado' : 'Pendiente';

    const pedidoQuery = 'INSERT INTO pedidos (usuario_id, total, estatus) VALUES (?, ?, ?)';
    const [pedidoResult] = await connection.query(pedidoQuery, [usuario_id, total, estatusPedido]);
    const nuevoPedidoId = pedidoResult.insertId;

    for (const item of items) {
      const [stockRows] = await connection.query('SELECT stock FROM productos WHERE id_producto = ? FOR UPDATE', [item.producto_id]);
      
      if (stockRows.length === 0 || stockRows[0].stock < item.cantidad) {
        await connection.rollback();
        return res.status(409).json({ message: `Stock insuficiente para el producto ID ${item.producto_id}` });
      }

      const detalleQuery = 'INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad) VALUES (?, ?, ?)';
      await connection.query(detalleQuery, [nuevoPedidoId, item.producto_id, item.cantidad]);
      
      const updateStockQuery = 'UPDATE productos SET stock = stock - ? WHERE id_producto = ?';
      await connection.query(updateStockQuery, [item.cantidad, item.producto_id]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Pedido creado exitosamente', pedidoId: nuevoPedidoId });

  } catch (error) {
    await connection.rollback();
    console.error("ERROR DETALLADO EN POST /api/pedidos:", error);
    res.status(500).json({ message: 'Error en el servidor al procesar el pedido', error: error.message });
  } finally {
    connection.release();
  }
});


// --- NUEVA RUTA: OBTENER LOS PEDIDOS DE UN USUARIO ESPECÍFICO (CLIENTE) ---
router.get('/mis-pedidos', checkAuth, async (req, res) => {
  const usuario_id = req.userData.userId;

  try {
    const query = `
      SELECT p.id_pedido, p.fecha, p.total, p.estatus 
      FROM pedidos p 
      WHERE p.usuario_id = ? 
      ORDER BY p.fecha DESC
    `;
    const [pedidos] = await pool.query(query, [usuario_id]);
    
    res.status(200).json(pedidos);
  } catch (error) {
    console.error("ERROR DETALLADO EN GET /mis-pedidos:", error);
    res.status(500).json({ message: 'Error al obtener los pedidos del usuario.', error: error.message });
  }
});


module.exports = router;