// backend/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// --- CORRECCIÓN CLAVE: Configuración de CORS para Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200", // Permite explícitamente la conexión desde tu app de Angular
    methods: ["GET", "POST"]
  }
});
// -----------------------------------------------------------

let onlineUsers = {};

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Un usuario se ha conectado con ID: ${socket.id}`);
  socket.on('join', (userId) => {
    console.log(`[Socket.IO] Usuario con ID ${userId} intenta unirse.`);
    onlineUsers[userId] = socket.id;
    console.log('[Socket.IO] Estado actual de onlineUsers:', onlineUsers);
  });
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Socket ${socket.id} se ha desconectado.`);
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
    console.log('[Socket.IO] Estado actual de onlineUsers:', onlineUsers);
  });
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use('/api/payments/webhook', express.raw({type: 'application/json'}));
app.use(express.json());

// Importar y usar todas tus rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const modifierRoutes = require('./routes/modifiers');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/upload');
const pedidoRoutes = require('./routes/pedidos')(io, () => onlineUsers);
const paymentRoutes = require('./routes/payments')(io);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/modifiers', modifierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/payments', paymentRoutes);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

