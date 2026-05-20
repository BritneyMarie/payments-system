const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const pool = require('../db/pool');
const { encrypt, decrypt } = require('../services/encryption.service');
const { requireAuth } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validate.middleware');

const transactionRules = [
  body('amount').isFloat({ min: 0.01, max: 1000000 }),
  body('currency').matches(/^[A-Z]{3}$/),
  body('payee_name').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('payee_account').trim().matches(/^\d{8,34}$/),
  body('payee_bank_name').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('payee_branch_code').trim().matches(/^\d{4,11}$/),
  body('payee_country').trim().matches(/^[A-Z]{2}$/),
  body('sender_reference').optional().trim().isLength({ max: 35 }).escape(),
  body('receiver_reference').optional().trim().isLength({ max: 35 }).escape(),
];

router.post('/', requireAuth('customer'), transactionRules, handleValidation, async (req, res) => {
  const {
    amount, currency, payee_name, payee_account,
    payee_bank_name, payee_branch_code, payee_country,
    sender_reference, receiver_reference,
  } = req.body;
  const customer_id = req.user.sub;

  const result = await pool.query(
    `INSERT INTO transactions
       (customer_id, amount, currency, payee_name, payee_account_enc,
        payee_bank_name, payee_branch_code, payee_country,
        sender_reference, receiver_reference)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, amount, currency, payee_name, payee_bank_name,
               payee_branch_code, payee_country, sender_reference,
               receiver_reference, status, created_at`,
    [
      customer_id, amount, currency, payee_name, encrypt(payee_account),
      payee_bank_name, payee_branch_code, payee_country,
      sender_reference || null, receiver_reference || null,
    ]
  );

  res.status(201).json({ transaction: result.rows[0] });
});

router.get('/export', requireAuth('customer'), async (req, res) => {
  const result = await pool.query(
    `SELECT created_at, payee_name, payee_bank_name, payee_country, amount, currency, status, sender_reference
     FROM transactions WHERE customer_id = $1 ORDER BY created_at DESC`,
    [req.user.sub]
  );
  const header = 'Date,Payee,Bank,Country,Amount,Currency,Status,Reference';
  const lines = result.rows.map(r => [
    new Date(r.created_at).toLocaleDateString('en-ZA'),
    `"${String(r.payee_name).replace(/"/g, '""')}"`,
    `"${String(r.payee_bank_name || '').replace(/"/g, '""')}"`,
    r.payee_country || '',
    r.amount,
    r.currency,
    r.status,
    r.sender_reference || '',
  ].join(','));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="saiint-bank-statement.csv"');
  res.send([header, ...lines].join('\n'));
});

router.get('/', requireAuth('customer'), async (req, res) => {
  const result = await pool.query(
    `SELECT id, amount, currency, payee_name, payee_account_enc,
            payee_bank_name, payee_branch_code, payee_country,
            sender_reference, receiver_reference, status, created_at
     FROM transactions
     WHERE customer_id = $1
     ORDER BY created_at DESC`,
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
