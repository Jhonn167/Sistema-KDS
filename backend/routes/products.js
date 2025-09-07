// routes/products.js
const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth'); // Importamos el middleware

const router = express.Router();

// OBTENER TODOS LOS PRODUCTOS (Ruta pública, no necesita checkAuth)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE stock > 0');
    res.status(200).json(rows);
  } catch (error) {
    console.error("ERROR DETALLADO DEL BACKEND:", error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// CREAR UN PRODUCTO (Ruta protegida)
router.post('/', checkAuth, async (req, res) => {
  // Verificamos si el usuario es administrador
  if (req.userData.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  try {
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, precio, stock, categoria_id]
    );
    res.status(201).json({ message: 'Producto creado', productId: result.insertId });
  } catch (error) {
    console.error("ERROR DETALLADO DEL BACKEND:", error);
    res.status(500).json({ message: 'Error al crear el producto', error: error.message });
  }
});

// ACTUALIZAR UN PRODUCTO (Ruta protegida)
router.put('/:id', checkAuth, async (req, res) => {
   if (req.userData.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  try {
    const { nombre, descripcion, precio, stock, categoria_id } = req.body;
    const { id } = req.params;
    await pool.query(
      'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, categoria_id = ? WHERE id_producto = ?',
      [nombre, descripcion, precio, stock, categoria_id, id]
    );
    res.status(200).json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error("ERROR DETALLADO DEL BACKEND:", error);
    res.status(500).json({ message: 'Error al actualizar el producto', error: error.message });
  }
});

// Podrías añadir DELETE de la misma forma

module.exports = router;