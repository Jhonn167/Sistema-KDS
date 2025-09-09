// backend/index.js - VERSIÓN CON SOCKET.IO

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http'); // 1. Requerimos el módulo http de Node
const { Server } = require("socket.io"); // 2. Importamos el Servidor de socket.io

const app = express();
const server = http.createServer(app); // 3. Creamos un servidor http usando nuestra app de express

// 4. Creamos una instancia de Socket.IO y la conectamos a nuestro servidor http
//    Configuramos CORS para permitir la conexión desde nuestra app de Angular.
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200", // La URL de tu frontend
    methods: ["GET", "POST"]
  }
});

// Un objeto simple para rastrear qué usuario está conectado a qué socket
let onlineUsers = {};

// 5. Lógica de Socket.IO: qué hacer cuando un cliente se conecta
// backend/index.js

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Un usuario se ha conectado con ID: ${socket.id}`);

  socket.on('join', (userId) => {
    console.log(`[Socket.IO] Usuario con ID ${userId} intenta unirse.`);
    onlineUsers[userId] = socket.id;
    // Imprimimos el estado actual de los usuarios en línea
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

// Middlewares (esto se queda igual)
app.use(cors());
app.use(express.json());

// Importar rutas (esto se queda igual)
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const pedidoRoutes = require('./routes/pedidos');
const uploadRoutes = require('./routes/upload'); 

// Usar las rutas (esto se queda igual)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pedidos', pedidoRoutes(io, () => onlineUsers)); // 6. Pasamos 'io' y 'onlineUsers' a las rutas de pedidos
app.use('/api/upload', uploadRoutes);

// 7. En lugar de app.listen, ahora iniciamos el servidor http
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
