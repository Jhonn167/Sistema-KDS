// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite peticiones desde Angular
app.use(express.json()); // Permite al servidor entender JSON

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products'); 

// Usar las rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// index.js

// ... otros imports

const pedidoRoutes = require('./routes/pedidos'); // <-- 1. IMPORTA LAS NUEVAS RUTAS

// ... app.use(cors()), app.use(express.json()) ...

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pedidos', pedidoRoutes); // <-- 2. USA LAS NUEVAS RUTAS

// ... app.listen(...)