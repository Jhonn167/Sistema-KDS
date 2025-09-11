// backend/routes/payments.js
const express = require('express');
const Stripe = require('stripe');
const checkAuth = require('../middleware/check-auth');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/create-checkout-session', checkAuth, async (req, res) => {
  try {
    const { items } = req.body; // Recibimos los items del carrito

    const line_items = items.map(item => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: item.nombre,
          // Opcional: descripción e imágenes
          description: item.selectedOptions.map(opt => opt.nombre).join(', ') || 'Producto base',
        },
        unit_amount: Math.round(item.precioFinal * 100), // Stripe usa centavos
      },
      quantity: item.cantidad,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      // ¡IMPORTANTE! Reemplaza estas URLs con las de tu frontend cuando lo despliegues
      success_url: `http://localhost:4200/orden-exitosa?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:4200/carrito`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error al crear la sesión de Stripe:", error);
    res.status(500).json({ error: { message: error.message } });
  }
});

module.exports = router;
