// backend/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');

const app = express();
const server = http.createServer(app);

const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));

// --- CONFIGURACIÓN DE CORS CORREGIDA (SOLO VERCEL) ---
const allowedOrigins = [
  "http://localhost:4200", // Para tu desarrollo local
  "https://sistema-kds.vercel.app",
  "https://sistema-kds.onrender.com" // Tu URL de Vercel
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
};

const io = new Server(server, { cors: corsOptions });
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

const PORT = process.env.PORT || 10000;

app.use(cors(corsOptions));
app.use('/api/payments/webhook', express.raw({type: 'application/json'}));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => { res.redirect('/api-docs'); });

// Importar y usar todas tus rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const modifierRoutes = require('./routes/modifiers');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/upload');
const pedidoRoutes = require('./routes/pedidos')(io, () => onlineUsers);
const paymentRoutes = require('./routes/payments')(io);
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/modifiers', modifierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

