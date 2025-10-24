const express = require('express');
const pool = require('../db');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// --- GESTIÓN DE GRUPOS DE MODIFICADORES ----
router.get('/groups', checkAuth, async (req, res) => {
    try {
        const query = `
            SELECT 
                g.id_grupo, g.nombre, g.tipo_seleccion, g.limite_seleccion
            FROM modificador_grupos g
            LEFT JOIN modificador_opciones o ON g.id_grupo = o.id_grupo
            GROUP BY g.id_grupo
            ORDER BY g.nombre ASC;
        `;
        // CORRECCIÓN: Se actualizó la consulta para obtener también 'limite_seleccion'
        // y se optimizó la consulta de opciones para que ocurra en un endpoint separado si es necesario.
        const { rows } = await pool.query(query);
        
        // Obtenemos las opciones por separado para un mejor rendimiento
        for (let group of rows) {
            const optionsQuery = `SELECT * FROM modificador_opciones WHERE id_grupo = $1 ORDER BY id_opcion ASC`;
            const optionsResult = await pool.query(optionsQuery, [group.id_grupo]);
            group.opciones = optionsResult.rows || [];
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener grupos de modificadores:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

router.post('/groups', checkAuth, async (req, res) => {
    try {
        // 1. Extrae el nuevo campo y corrige el tipeo
        const { nombre, tipo_seleccion, limite_seleccion } = req.body;
        // 2. Actualiza la consulta y los valores
        const query = 'INSERT INTO modificador_grupos (nombre, tipo_seleccion, limite_seleccion) VALUES ($1, $2, $3) RETURNING *';
        const values = [nombre, tipo_seleccion, limite_seleccion || null];
        const { rows } = await pool.query(query, values);
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
