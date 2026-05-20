const express = require('express');
const router = express.Router();

const pool = require('../db/pool');
const { decrypt } = require('../services/encryption.service');
const { requireAuth } = require('../middleware/auth.middleware');

async function logAudit(employeeId, username, action, entityType, entityId, details = {}) {
  await pool.query(
    `INSERT INTO audit_log (employee_id, employee_username, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [employeeId, username, action, entityType, entityId, JSON.stringify(details)]
  );
}

// ── Stats overview ──────────────────────────────────────────────────────────
router.get('/stats', requireAuth('employee'), async (req, res) => {
  const [cust, pending, volume, flagged] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM customers'),
    pool.query("SELECT COUNT(*) FROM transactions WHERE status = 'pending'"),
    pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE created_at >= CURRENT_DATE"),
    pool.query("SELECT COUNT(*) FROM transactions WHERE flagged = TRUE AND status = 'pending'"),
  ]);
  res.json({
    total_customers: parseInt(cust.rows[0].count),
    pending_count:   parseInt(pending.rows[0].count),
    today_volume:    parseFloat(volume.rows[0].total),
    flagged_count:   parseInt(flagged.rows[0].count),
  });
});

// ── Pending transactions (existing endpoint kept for compat) ─────────────────
router.get('/transactions', requireAuth('employee'), async (req, res) => {
  const result = await pool.query(
    `SELECT t.id, t.amount, t.currency, t.payee_name,
            t.payee_account_enc, t.payee_bank_name, t.payee_branch_code,
            t.payee_country, t.sender_reference, t.receiver_reference,
            t.status, t.flagged, t.created_at,
            c.full_name AS customer_name, c.id AS customer_id
     FROM transactions t
     JOIN customers c ON c.id = t.customer_id
     WHERE t.status = 'pending'
     ORDER BY t.flagged DESC, t.created_at ASC`
  );
  const transactions = result.rows.map(row => ({
    ...row,
    payee_account: decrypt(row.payee_account_enc),
    payee_account_enc: undefined,
  }));
  res.json({ transactions });
});

// ── All transactions with optional status filter ─────────────────────────────
router.get('/all-transactions', requireAuth('employee'), async (req, res) => {
  const { status } = req.query;
  const allowed = ['pending', 'submitted', 'rejected'];
  const useFilter = status && allowed.includes(status);
  const query = `
    SELECT t.id, t.amount, t.currency, t.payee_name,
           t.payee_account_enc, t.payee_bank_name, t.payee_branch_code,
           t.payee_country, t.sender_reference, t.status, t.flagged, t.created_at,
           c.full_name AS customer_name, c.id AS customer_id
    FROM transactions t
    JOIN customers c ON c.id = t.customer_id
    ${useFilter ? 'WHERE t.status = $1' : ''}
    ORDER BY t.flagged DESC, t.created_at DESC
    LIMIT 300`;
  const result = useFilter
    ? await pool.query(query, [status])
    : await pool.query(query);
  const transactions = result.rows.map(row => ({
    ...row,
    payee_account: decrypt(row.payee_account_enc),
    payee_account_enc: undefined,
  }));
  res.json({ transactions });
});

// ── Customer list with optional search ──────────────────────────────────────
router.get('/customers', requireAuth('employee'), async (req, res) => {
  const { q } = req.query;
  const result = await pool.query(
    `SELECT id, full_name, account_number_enc, account_status, balance, created_at
     FROM customers ORDER BY created_at DESC`
  );
  let customers = result.rows.map(c => ({
    id:             c.id,
    full_name:      c.full_name,
    account_number: decrypt(c.account_number_enc),
    account_status: c.account_status,
    balance:        c.balance,
    created_at:     c.created_at,
  }));
  if (q) {
    const lower = q.toLowerCase();
    customers = customers.filter(c =>
      c.full_name.toLowerCase().includes(lower) ||
      c.account_number.includes(q)
    );
  }
  res.json({ customers });
});

// ── Transactions for a specific customer ────────────────────────────────────
router.get('/customers/:id/transactions', requireAuth('employee'), async (req, res) => {
  const result = await pool.query(
    `SELECT id, amount, currency, payee_name, payee_bank_name,
            payee_country, status, flagged, created_at
     FROM transactions WHERE customer_id = $1 ORDER BY created_at DESC`,
    [req.params.id]
  );
  res.json({ transactions: result.rows });
});

// ── Toggle customer active / suspended ──────────────────────────────────────
router.post('/customers/:id/toggle-status', requireAuth('employee'), async (req, res) => {
  const result = await pool.query(
    `UPDATE customers
     SET account_status = CASE WHEN account_status = 'active' THEN 'suspended' ELSE 'active' END
     WHERE id = $1 RETURNING id, account_status`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Customer not found' });
  await logAudit(
    req.user.sub, req.user.username,
    `status_${result.rows[0].account_status}`, 'customer', null,
    { customer_id: req.params.id, new_status: result.rows[0].account_status }
  );
  res.json(result.rows[0]);
});

// ── Approve transaction ──────────────────────────────────────────────────────
router.post('/transactions/:id/submit', requireAuth('employee'), async (req, res) => {
  const result = await pool.query(
    `UPDATE transactions
     SET status = 'submitted', submitted_by = $1, submitted_at = NOW()
     WHERE id = $2 AND status = 'pending'
     RETURNING id, status, submitted_at`,
    [req.user.sub, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Transaction not found or already processed' });
  await logAudit(req.user.sub, req.user.username, 'approve_transaction', 'transaction', null, { tx_id: req.params.id });
  res.json({ transaction: result.rows[0] });
});

// ── Reject transaction ───────────────────────────────────────────────────────
router.post('/transactions/:id/reject', requireAuth('employee'), async (req, res) => {
  const result = await pool.query(
    `UPDATE transactions SET status = 'rejected'
     WHERE id = $1 AND status = 'pending' RETURNING id, status`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Transaction not found or already processed' });
  await logAudit(req.user.sub, req.user.username, 'reject_transaction', 'transaction', null, { tx_id: req.params.id });
  res.json({ transaction: result.rows[0] });
});

// ── Audit log ────────────────────────────────────────────────────────────────
router.get('/audit-log', requireAuth('employee'), async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100`
  );
  res.json({ logs: result.rows });
});

module.exports = router;

