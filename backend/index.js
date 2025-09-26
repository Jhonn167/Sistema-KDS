// backend/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// --- CONFIGURACIÓN DE CORS FINAL Y ROBUSTA ---
const allowedOrigins = [
  "http://localhost:4200",
  "https://sistema-kds.vercel.app" // URL de Vercel
];
const corsOptions = {
  origin: function (origin, callback) {
    // Permite las peticiones si el origen está en la lista o si no hay origen (como en Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
};

const io = new Server(server, {
  cors: corsOptions // Usamos la misma configuración para Socket.IO
});
// ---------------------------------------------

let onlineUsers = {};
io.on('connection', (socket) => {
  socket.on('join', (userId) => { onlineUsers[userId] = socket.id; });
  socket.on('disconnect', () => {
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) { delete onlineUsers[userId]; break; }
    }
  });
});

const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions)); // Usamos la configuración de CORS para Express
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
