// backend/routes/users.js
const express = require('express');
const pool = require('../db');
const checkRole = require('../middleware/checkRole');

const router = express.Router();

// OBTENER TODOS LOS USUARIOS (Solo para Admins)
router.get('/', checkRole(['admin']), async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, nombre, email, rol, telefono FROM usuarios ORDER BY nombre ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// ACTUALIZAR EL ROL DE UN USUARIO (Solo para Admins)
router.put('/:id/role', checkRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;

        // Validar que el rol sea uno de los permitidos
        const a_roles = ['admin', 'empleado', 'cocinero', 'cliente'];
        if (!a_roles.includes(rol)) {
            return res.status(400).json({ message: 'Rol no válido.' });
        }

        const { rowCount } = await pool.query(
            'UPDATE usuarios SET rol = $1 WHERE id = $2',
            [rol, id]
        );

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ message: `Rol del usuario actualizado a ${rol}.` });
    } catch (error) {
        console.error("Error al actualizar rol:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;
