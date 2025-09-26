// backend/routes/modifiers.js
const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// --- GESTIÓN DE GRUPOS DE MODIFICADORES ----
router.get('/groups', checkAuth, async (req, res) => {
    try {
        const query = `
            SELECT 
                g.id_grupo, g.nombre, g.tipo_seleccion,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id_opcion', o.id_opcion, 'nombre', o.nombre, 'precio_adicional', o.precio_adicional
                        ) ORDER BY o.id_opcion ASC
                    ) FILTER (WHERE o.id_opcion IS NOT NULL), 
                    '[]'
                ) AS opciones
            FROM modificador_grupos g
            LEFT JOIN modificador_opciones o ON g.id_grupo = o.id_grupo
            GROUP BY g.id_grupo
            ORDER BY g.nombre ASC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener grupos de modificadores:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

router.post('/groups', checkAuth, async (req, res) => {
    try {
        const { nombre, tipo_seleccion } = req.body;
        const query = 'INSERT INTO modificador_grupos (nombre, tipo_seleccion) VALUES ($1, $2) RETURNING *';
        const { rows } = await pool.query(query, [nombre, tipo_seleccion]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Error al crear grupo:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- RUTA NUEVA: ELIMINAR UN GRUPO COMPLETO ---
router.delete('/groups/:id', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Gracias a ON DELETE CASCADE, esto eliminará el grupo, sus opciones y sus asignaciones.
        await pool.query('DELETE FROM modificador_grupos WHERE id_grupo = $1', [id]);
        res.status(200).json({ message: 'Grupo de modificadores eliminado exitosamente.' });
    } catch (error) {
        console.error("Error al eliminar grupo:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- GESTIÓN DE OPCIONES DE MODIFICADORES ---
router.post('/options', checkAuth, async (req, res) => {
    try {
        const { id_grupo, nombre, precio_adicional } = req.body;
        const query = 'INSERT INTO modificador_opciones (id_grupo, nombre, precio_adicional) VALUES ($1, $2, $3) RETURNING *';
        const { rows } = await pool.query(query, [id_grupo, nombre, precio_adicional]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error("Error al crear opción:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

router.delete('/options/:id', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM modificador_opciones WHERE id_opcion = $1', [id]);
        res.status(200).json({ message: 'Opción eliminada exitosamente.' });
    } catch (error) {
        console.error("Error al eliminar opción:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;
