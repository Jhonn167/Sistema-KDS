// db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Carga las variables de .env

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // ej. 'localhost'
  user: process.env.DB_USER,       // ej. 'root'
  password: process.env.DB_PASSWORD, // tu contraseña
  database: process.env.DB_NAME,   // ej. 'kds_db'
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Pool de conexiones a MySQL creado.');

module.exports = pool;