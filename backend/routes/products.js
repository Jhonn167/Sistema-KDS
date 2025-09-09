// backend/routes/products.js - VERSIÓN PARA POSTGRESQL

const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// OBTENER TODOS LOS PRODUCTOS
router.get('/', async (req, res) => {
  try {
    // CAMBIO: No se necesita checkAuth para ver el menú
    const { rows } = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
    res.status(200).json(rows);
  } catch (error) {
    console.error("ERROR DETALLADO EN GET /api/products:", error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// OBTENER UN PRODUCTO POR ID (para el formulario de edición)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("ERROR DETALLADO EN GET /api/products/:id:", error);
        res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
    }
});


// CREAR UN PRODUCTO
router.post('/', checkAuth, async (req, res) => {
  if (req.userData.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  try {
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    // CAMBIO: Sintaxis de PostgreSQL
    const { rows } = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES ($1, $2, $3, $4, $5) RETURNING id_producto',
      [nombre, descripcion, precio, stock, categoria_id]
    );
    res.status(201).json({ message: 'Producto creado', productId: rows[0].id_producto });
  } catch (error) {
    console.error("ERROR DETALLADO EN POST /api/products:", error);
    res.status(500).json({ message: 'Error al crear el producto', error: error.message });
  }
});

// ACTUALIZAR UN PRODUCTO
router.put('/:id', checkAuth, async (req, res) => {
   if (req.userData.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  try {
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const { id } = req.params;
    // CAMBIO: Sintaxis de PostgreSQL
    await pool.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria_id = $5 WHERE id_producto = $6',
      [nombre, descripcion, precio, stock, categoria_id, id]
    );
    res.status(200).json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error("ERROR DETALLADO EN PUT /api/products/:id:", error);
    res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
  }
});

module.exports = router;