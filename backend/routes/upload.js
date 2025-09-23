// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const pool = require('../db');
const { storage } = require('../config/cloudinary');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();
const upload = multer({ storage });

// Ruta para subir imágenes de productos
router.post('/', checkAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
  }
  res.status(201).json({ imageUrl: req.file.path });
});

// Ruta nueva para subir comprobantes de pago
router.post('/receipt/:orderId', checkAuth, upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
        }
        const { orderId } = req.params;
        const imageUrl = req.file.path;

        // Guardamos la URL del comprobante en el pedido correspondiente
        await pool.query('UPDATE pedidos SET comprobante_url = $1 WHERE id_pedido = $2', [imageUrl, orderId]);

        res.status(200).json({ message: 'Comprobante subido exitosamente.' });
    } catch (error) {
        console.error("Error al subir comprobante:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;
