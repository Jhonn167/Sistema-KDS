// backend/routes/categories.js
const express = require('express');
const pool = require('../db');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// OBTENER TODAS LAS CATEGORÍAS
router.get('/', checkRole(['admin', 'empleado', 'cocinero']), async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM categorias ORDER BY nombre ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// CREAR UNA NUEVA CATEGORÍA
router.post('/', checkRole(['admin']), async (req, res) => {
    try {   
        const { nombre, descripcion } = req.body;
        const query = 'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *';
        const { rows } = await pool.query(query, [nombre, descripcion || null]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// ELIMINAR UNA CATEGORÍA
router.delete('/:id', checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        // Por seguridad, antes de borrar, desvinculamos los productos de esta categoría
        await pool.query('UPDATE productos SET categoria_id = NULL WHERE categoria_id = $1', [id]);
        await pool.query('DELETE FROM categorias WHERE id_categoria = $1', [id]);
        res.status(200).json({ message: 'Categoría eliminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;
