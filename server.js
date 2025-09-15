require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const productsRouter = require('./routes/products');
const paymentsRouter = require('./routes/payments');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4242;

// Crear carpetas necesarias
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir uploads (comprobantes)
app.use('/uploads', express.static(uploadsDir));

// Rutas
app.use('/products', productsRouter);
app.use('/payments', paymentsRouter);
app.use('/orders', ordersRouter);

// Health
app.get('/', (req, res) => res.json({ ok: true, env: process.env.PAYPAL_MODE || 'sandbox' }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
