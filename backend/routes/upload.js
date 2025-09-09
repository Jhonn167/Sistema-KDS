// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();
const upload = multer({ storage });

router.post('/', checkAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
  }
  res.status(201).json({ imageUrl: req.file.path });
});

module.exports = router;