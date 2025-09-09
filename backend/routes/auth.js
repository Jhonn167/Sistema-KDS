// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Importamos el pool de conexión

const router = express.Router();

// --- RUTA DE REGISTRO ---
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, rol = 'cliente' } = req.body;

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Ejecutamos la inserción, pero no necesitamos leer la respuesta.
    await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4)',
      [nombre, email, passwordHash, rol]
    );

    // Si la línea anterior no lanzó un error, sabemos que fue exitosa.
    // Enviamos una respuesta de éxito genérica.
    res.status(201).json({ message: 'Usuario registrado exitosamente' });

  } catch (error) {
    // Si hay un error (como email duplicado), lo atrapamos aquí.
    console.error("ERROR DETALLADO EN POST /api/auth/register:", error);
    
    // Verificamos si es un error de email duplicado para dar un mensaje más amigable
    if (error.code === '23505') { // Código de error de PostgreSQL para 'unique_violation'
      return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
    }
    
    res.status(500).json({ message: 'Error en el servidor al registrar el usuario', error: error.message });
  }
});

// --- RUTA DE LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar al usuario por email
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' }); // Usuario no encontrado
    }
    const user = rows[0];

    // 2. Comparar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' }); // Contraseña incorrecta
    }

    // 3. Crear el JSON Web Token (JWT)
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // El token expira en 1 hora
    );

    res.status(200).json({
      message: 'Login exitoso',
      token: token,
      expiresIn: 3600, // 1 hora en segundos
      userId: user.id,
      rol: user.rol
    });

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

module.exports = router;