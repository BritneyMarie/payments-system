const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const pool = require('../db/pool');
const { encrypt, decrypt } = require('../services/encryption.service');
const { requireAuth } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validate.middleware');

const transactionRules = [
  body('amount').isFloat({ min: 0.01, max: 999999999.99 }),
  body('currency').matches(/^[A-Z]{3}$/),
  body('swift_code').matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/),
  body('payee_name').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('payee_account').trim().matches(/^\d{8,34}$/),
];

router.post('/', requireAuth('customer'), transactionRules, handleValidation, async (req, res) => {
  const { amount, currency, swift_code, payee_name, payee_account } = req.body;
  const customer_id = req.user.sub;

  const payee_account_enc = encrypt(payee_account);

  const result = await pool.query(
    `INSERT INTO transactions (customer_id, amount, currency, swift_code, payee_name, payee_account_enc)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, amount, currency, swift_code, payee_name, status, created_at`,
    [customer_id, amount, currency, swift_code, payee_name, payee_account_enc]
  );

  res.status(201).json({ transaction: result.rows[0] });
});

router.get('/', requireAuth('customer'), async (req, res) => {
  const result = await pool.query(
    `SELECT id, amount, currency, swift_code, payee_name, payee_account_enc, status, created_at
     FROM transactions WHERE customer_id = $1 ORDER BY created_at DESC`,
    [req.user.sub]
  );

  const transactions = result.rows.map(row => ({
    ...row,
    payee_account: decrypt(row.payee_account_enc),
    payee_account_enc: undefined,
  }));

  res.json({ transactions });
});

module.exports = router;
