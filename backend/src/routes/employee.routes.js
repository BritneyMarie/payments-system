const express = require('express');
const router = express.Router();

const pool = require('../db/pool');
const { decrypt } = require('../services/encryption.service');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/transactions', requireAuth('employee'), async (req, res) => {
  const result = await pool.query(
    `SELECT t.id, t.amount, t.currency, t.swift_code, t.payee_name,
            t.payee_account_enc, t.status, t.created_at,
            c.full_name AS customer_name
     FROM transactions t
     JOIN customers c ON c.id = t.customer_id
     WHERE t.status = 'pending'
     ORDER BY t.created_at ASC`
  );

  const transactions = result.rows.map(row => ({
    ...row,
    payee_account: decrypt(row.payee_account_enc),
    payee_account_enc: undefined,
  }));

  res.json({ transactions });
});

router.post('/transactions/:id/submit', requireAuth('employee'), async (req, res) => {
  const { id } = req.params;
  const employee_id = req.user.sub;

  const result = await pool.query(
    `UPDATE transactions
     SET status = 'submitted', submitted_by = $1, submitted_at = NOW()
     WHERE id = $2 AND status = 'pending'
     RETURNING id, status, submitted_at`,
    [employee_id, id]
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Transaction not found or already processed' });

  res.json({ transaction: result.rows[0] });
});

router.post('/transactions/:id/reject', requireAuth('employee'), async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `UPDATE transactions
     SET status = 'rejected'
     WHERE id = $1 AND status = 'pending'
     RETURNING id, status`,
    [id]
  );

  if (!result.rows.length) return res.status(404).json({ error: 'Transaction not found or already processed' });

  res.json({ transaction: result.rows[0] });
});

module.exports = router;
