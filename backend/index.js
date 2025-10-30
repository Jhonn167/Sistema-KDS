// backend/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");
const swaggerUi = require('swagger-ui-express'); // --- 1. Importar Swagger
const yaml = require('yamljs'); // --- 2. Importar YAML
const path = require('path'); // --- 3. Importar Path

const app = express();
const server = http.createServer(app);

// --- 4. Cargar el archivo de Swagger ---
const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));

const allowedOrigins = [
  "http://localhost:4200",
  "[https://sistema-kds.vercel.app](https://sistema-kds.vercel.app)", // Tu URL de Vercel
  "[https://spontaneous-selkie-fb61b4.netlify.app](https://spontaneous-selkie-fb61b4.netlify.app)" // Tu URL de Netlify
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

let onlineUsers = {};
io.on('connection', (socket) => { /* ... (tu lógica de socket) ... */ });

const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions));
app.use('/api/payments/webhook', express.raw({type: 'application/json'}));
app.use(express.json());

// --- 5. Configurar la Ruta de la Documentación ---
// Esta es la página interactiva
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- 6. Redirigir la Raíz a la Documentación ---
// Esto soluciona el 'CANNOT GET /'
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

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
