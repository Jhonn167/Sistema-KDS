// backend/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:4200",
  "[https://spontaneous-selkie-fb61b4.netlify.app](https://spontaneous-selkie-fb61b4.netlify.app)"
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
};
const io = new Server(server, { cors: corsOptions });

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
app.use(cors(corsOptions));
app.use('/api/payments/webhook', express.raw({type: 'application/json'}));
app.use(express.json());

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
