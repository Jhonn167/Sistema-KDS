// backend/db.js - VERSIÓN PARA POSTGRESQL
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('Pool de conexiones a PostgreSQL creado.');

module.exports = pool;