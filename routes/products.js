// routes/products.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const dataPath = path.join(__dirname, '..', 'data', 'products.json');

function readProducts() {
  const raw = fs.readFileSync(dataPath);
  return JSON.parse(raw);
}

router.get('/', (req, res) => {
  const products = readProducts();
  res.json(products);
});

router.get('/:id', (req, res) => {
  const products = readProducts();
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(p);
});

module.exports = router;
