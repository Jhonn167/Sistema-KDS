// backend/routes/payments.js
const express = require('express');
const Stripe = require('stripe');
const checkAuth = require('../middleware/check-auth');
const pool = require('../db');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = function(io) {
    const router = express.Router();

    router.post('/create-checkout-session', checkAuth, async (req, res) => {
      try {
        const { items, orderId } = req.body;
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

        const line_items = items.map(item => ({
          price_data: {
            currency: 'mxn',
            product_data: {
              name: item.nombre,
              description: (item.selectedOptions || []).map(opt => opt.nombre).join(', ') || undefined,
            },
            unit_amount: Math.round(parseFloat(item.precioFinal) * 100),
          },
          quantity: item.cantidad,
        }));

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items,
          mode: 'payment',
          success_url: `${frontendUrl}/orden-exitosa`,
          cancel_url: `${frontendUrl}/carrito`,
          metadata: {
            orderId: orderId
          }
        });

        res.json({ id: session.id });
      } catch (error) {
        console.error("[Stripe] ERROR al crear la sesión:", error);
        res.status(500).json({ error: { message: error.message } });
      }
    });

    router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!endpointSecret) {
        return res.status(400).send('Webhook secret no configurado.');
      }
      
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata.orderId;
        
        console.log(`✅ Webhook recibido para el pedido #${orderId}`);

        if (orderId) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const detailsResult = await client.query('SELECT producto_id, cantidad FROM detalles_pedido WHERE pedido_id = $1', [orderId]);
                const orderDetails = detailsResult.rows;

                for (const item of orderDetails) {
                    await client.query('UPDATE productos SET stock = stock - $1 WHERE id_producto = $2', [item.cantidad, item.producto_id]);
                }
                
                await client.query("UPDATE pedidos SET estatus = 'Pendiente', payment_intent_id = $1 WHERE id_pedido = $2", [session.payment_intent, orderId]);
                
                await client.query('COMMIT');
                
                console.log(`Pedido #${orderId} pagado. Stock actualizado y estatus cambiado a Pendiente.`);
                
                io.emit('nuevo_pedido_cocina');
                console.log('Notificación de nuevo pedido enviada al KDS.');

            } catch(dbError) {
                await client.query('ROLLBACK');
                console.error("Error al procesar el webhook en la base de datos:", dbError);
            } finally {
                client.release();
            }
        }
      }

      res.json({received: true});
    });

    return router;
};
