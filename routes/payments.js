// routes/payments.js
const express = require('express');
const router = express.Router();
const stripeLib = require('stripe');
const paypalClient = require('../utils/paypalClient');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ORDERS_PATH = path.join(__dirname, '..', 'data', 'orders.json');

function saveOrder(order) {
  let orders = [];
  try {
    orders = JSON.parse(fs.readFileSync(ORDERS_PATH));
  } catch (e) { orders = []; }
  orders.push(order);
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
  return order;
}

function calcAmount(items) {
  return items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 1)), 0);
}

/* ---------- Stripe: crear PaymentIntent ---------- */
router.post('/create-stripe-payment-intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe not configured' });
    const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
    const { items } = req.body;
    const amount = Math.round(calcAmount(items) * 100); // cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'USD',
      automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- PayPal: crear orden ---------- */
router.post('/create-paypal-order', async (req, res) => {
  try {
    const client = paypalClient;
    const { items } = req.body;
    const amount = calcAmount(items).toFixed(2);

    const paypal = require('@paypal/checkout-server-sdk');
    const requestOrder = new paypal.orders.OrdersCreateRequest();
    requestOrder.prefer('return=representation');
    requestOrder.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value: amount } }]
    });

    const response = await client.execute(requestOrder);
    res.json({ id: response.result.id, links: response.result.links });
  } catch (err) {
    console.error('PayPal create order error', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- PayPal: capturar orden ---------- */
router.post('/capture-paypal-order', async (req, res) => {
  try {
    const client = paypalClient;
    const { orderId } = req.body;
    const paypal = require('@paypal/checkout-server-sdk');
    const requestCapture = new paypal.orders.OrdersCaptureRequest(orderId);
    requestCapture.requestBody({});
    const capture = await client.execute(requestCapture);

    // Guardar orden como pagada
    const order = {
      id: uuidv4(),
      provider: 'paypal',
      providerOrderId: orderId,
      status: 'paid',
      capture: capture.result,
      createdAt: new Date().toISOString()
    };
    saveOrder(order);

    res.json({ ok: true, capture: capture.result });
  } catch (err) {
    console.error('PayPal capture error', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- CashApp: crear orden pendente ---------- */
router.post('/create-cashapp-order', (req, res) => {
  try {
    const { items, buyer } = req.body;
    const amount = calcAmount(items);
    const cashAppHandle = (process.env.CASHAPP_HANDLE || '').replace(/^\$?/, '');
    const link = `https://cash.app/$${cashAppHandle}`;
    const order = {
      id: uuidv4(),
      provider: 'cashapp',
      amount,
      items,
      buyer,
      status: 'pending_payment',
      paymentLink: link,
      createdAt: new Date().toISOString()
    };
    saveOrder(order);
    res.json({ ok: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- Venmo: crear orden pendente ---------- */
router.post('/create-venmo-order', (req, res) => {
  try {
    const { items, buyer } = req.body;
    const amount = calcAmount(items);
    const venmoLink = process.env.VENMO_LINK || '';
    const order = {
      id: uuidv4(),
      provider: 'venmo',
      amount,
      items,
      buyer,
      status: 'pending_payment',
      paymentLink: venmoLink,
      createdAt: new Date().toISOString()
    };
    saveOrder(order);
    res.json({ ok: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
