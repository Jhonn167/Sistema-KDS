const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const pool = require('../db');
require('dotenv').config();

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const router = express.Router();

// --- RUTA DE REGISTRO (CON VALIDACIÓN MEJORADA) ---
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const query = 'INSERT INTO usuarios (nombre, email, password, rol, telefono) VALUES ($1, $2, $3, $4, $5)';
    const values = [nombre, email, passwordHash, 'cliente', telefono || null];
    await pool.query(query, values);
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error("ERROR DETALLADO EN POST /api/auth/register:", error);
    
    // --- LÓGICA DE ERROR MEJORADA ---
    // Primero, verificamos si es un error de valor único duplicado.
    if (error.code === '23505') { 
      // Si lo es, ahora verificamos QUÉ valor fue el duplicado.
      if (error.constraint === 'usuarios_email_key') {
        return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
      }
      if (error.constraint === 'usuarios_telefono_key') {
        return res.status(409).json({ message: 'El número de teléfono ya está en uso.' });
      }
    }
    // Si es otro tipo de error, enviamos un mensaje genérico.
    res.status(500).json({ message: 'Error en el servidor al registrar el usuario' });
  }
});

// --- RUTA DE LOGIN (se mantiene igual) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const query = 'SELECT * FROM usuarios WHERE email = $1 OR telefono = $1';
    const { rows } = await pool.query(query, [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      message: 'Login exitoso',
      token: token,
      expiresIn: 3600,
      userId: user.id,
      rol: user.rol
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// --- RUTAS DE RECUPERACIÓN DE CONTRASEÑA (se mantienen igual) ---
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(200).json({ message: 'Si existe una cuenta con ese correo, se ha enviado un enlace de recuperación.' });
        }
        const user = rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 3600000);
        await pool.query('UPDATE usuarios SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [resetToken, tokenExpires, user.id]);

        const resetUrl = `http://localhost:4200/restablecer-contrasena/${resetToken}`;
        const msg = {
            to: user.email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'Restablecimiento de Contraseña - Sistema KDS',
            html: `<p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace (válido por 1 hora): <a href="${resetUrl}">${resetUrl}</a></p>`,
        };
        await sgMail.send(msg);
        res.status(200).json({ message: 'Si existe una cuenta con ese correo, se ha enviado un enlace de recuperación.' });
    } catch (error) {
        console.error("Error en forgot-password:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const query = 'SELECT * FROM usuarios WHERE reset_token = $1 AND reset_token_expires > NOW()';
        const { rows } = await pool.query(query, [token]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
        }
        const user = rows[0];
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(password, salt);
        await pool.query('UPDATE usuarios SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [newPasswordHash, user.id]);
        res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
        console.error("Error en reset-password:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;

