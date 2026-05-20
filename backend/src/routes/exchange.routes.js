'use strict';
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');

// Currencies supported by frankfurter.app
const ALLOWED = new Set([
  'AUD', 'BGN', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK',
  'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK',
  'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN',
  'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR',
]);

// GET /api/exchange-rates?from=USD
router.get('/', requireAuth('customer'), async (req, res) => {
  const from = (typeof req.query.from === 'string' ? req.query.from : '').toUpperCase();
  if (!ALLOWED.has(from)) {
    return res.status(400).json({ error: 'Unsupported currency' });
  }

  const upstream = await fetch(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}`
  );
  if (!upstream.ok) {
    return res.status(502).json({ error: 'Exchange rate service unavailable' });
  }

  const data = await upstream.json();
  res.json(data);
});

module.exports = router;
