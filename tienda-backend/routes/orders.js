// routes/orders.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const ORDERS_PATH = path.join(__dirname, '..', 'data', 'orders.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}_${file.originalname}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_PATH));
  } catch (e) {
    return [];
  }
}
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
}

router.get('/', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

router.get('/pending', (req, res) => {
  const orders = readOrders();
  res.json(orders.filter(o => o.status && o.status !== 'paid'));
});

// Crear orden (general)
router.post('/', (req, res) => {
  const { items, buyer, paymentMethod } = req.body;
  const total = (items || []).reduce((s, it) => s + (it.price * (it.qty || 1)), 0);
  const order = {
    id: uuidv4(),
    items,
    buyer,
    paymentMethod,
    total,
    status: paymentMethod === 'stripe' || paymentMethod === 'paypal' ? 'waiting_payment' : 'pending_payment',
    createdAt: new Date().toISOString()
  };
  const orders = readOrders();
  orders.push(order);
  writeOrders(orders);
  res.json({ ok: true, order });
});

// Subir comprobante (CashApp / Venmo)
router.post('/:id/upload', upload.single('receipt'), (req, res) => {
  const { id } = req.params;
  const orders = readOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

  order.receiptUrl = `/uploads/${req.file.filename}`;
  order.status = 'awaiting_verification';
  order.receiptUploadedAt = new Date().toISOString();
  writeOrders(orders);

  res.json({ ok: true, order });
});

// Admin: aprobar orden (marcar pagada)
router.post('/:id/approve', (req, res) => {
  const { id } = req.params;
  const orders = readOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

  order.status = 'paid';
  order.approvedAt = new Date().toISOString();
  writeOrders(orders);

  res.json({ ok: true, order });
});

module.exports = router;
