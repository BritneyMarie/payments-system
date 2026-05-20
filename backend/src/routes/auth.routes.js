const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const pool = require('../db/pool');
const { hashPassword, comparePassword, signToken } = require('../services/auth.service');
const { encrypt, decrypt } = require('../services/encryption.service');
const { generateSecret, generateQRCode, verifyToken: verifyOtp } = require('../services/mfa.service');
const { handleValidation } = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 15 * 60 * 1000,
};

const registerRules = [
  body('full_name').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('id_number').trim().matches(/^[A-Za-z0-9]{6,13}$/),
  body('account_number').trim().matches(/^\d{8,16}$/),
  body('password')
    .isLength({ min: 12 })
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/\d/).withMessage('Password must contain a digit')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character'),
];

router.post('/register', registerRules, handleValidation, async (req, res) => {
  const { full_name, id_number, account_number, password } = req.body;

  try {
    const password_hash = await hashPassword(password);
    const id_number_enc = encrypt(id_number);
    const account_number_enc = encrypt(account_number);

    const result = await pool.query(
      `INSERT INTO customers (full_name, id_number_enc, account_number_enc, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, full_name`,
      [full_name, id_number_enc, account_number_enc, password_hash]
    );

    res.status(201).json({ customer: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Account already exists' });
    throw err;
  }
});

const loginRules = [
  body('account_number').trim().matches(/^\d{8,16}$/),
  body('password').notEmpty(),
];

router.post('/login', loginRules, handleValidation, async (req, res) => {
  const { account_number, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM customers',
    []
  );

  const customer = result.rows.find(row => {
    try {
      return decrypt(row.account_number_enc) === account_number;
    } catch {
      return false;
    }
  });

  if (!customer) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await comparePassword(password, customer.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  if (customer.mfa_enabled) {
    const tempToken = signToken({ sub: customer.id, role: 'customer', mfa_pending: true });
    res.cookie('temp_token', tempToken, COOKIE_OPTS);
    return res.json({ mfa_required: true });
  }

  const token = signToken({ sub: customer.id, role: 'customer' });
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ id: customer.id, full_name: customer.full_name });
});

router.post('/mfa/setup', requireAuth('customer'), async (req, res) => {
  const { sub } = req.user;

  const secret = generateSecret();
  const secretEnc = encrypt(secret);

  const result = await pool.query(
    'SELECT full_name FROM customers WHERE id = $1',
    [sub]
  );

  await pool.query(
    'UPDATE customers SET mfa_secret_enc = $1 WHERE id = $2',
    [secretEnc, sub]
  );

  const qrCode = await generateQRCode(secret, result.rows[0].full_name);
  res.json({ qr_code: qrCode });
});

router.post('/mfa/verify', async (req, res) => {
  const tempToken = req.cookies?.temp_token;
  const { otp } = req.body;

  if (!tempToken) return res.status(401).json({ error: 'No pending MFA session' });
  if (!otp) return res.status(400).json({ error: 'OTP required' });

  let payload;
  try {
    const { verifyToken } = require('../services/auth.service');
    payload = verifyToken(tempToken);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (!payload.mfa_pending) return res.status(400).json({ error: 'No pending MFA' });

  const result = await pool.query(
    'SELECT mfa_secret_enc, full_name FROM customers WHERE id = $1',
    [payload.sub]
  );

  if (!result.rows.length) return res.status(401).json({ error: 'User not found' });

  const secret = decrypt(result.rows[0].mfa_secret_enc);
  const valid = verifyOtp(secret, otp);

  if (!valid) return res.status(401).json({ error: 'Invalid OTP' });

  await pool.query('UPDATE customers SET mfa_enabled = TRUE WHERE id = $1', [payload.sub]);

  res.clearCookie('temp_token');
  const token = signToken({ sub: payload.sub, role: 'customer' });
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ id: payload.sub, full_name: result.rows[0].full_name });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.clearCookie('temp_token');
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth('customer'), async (req, res) => {
  const result = await pool.query(
    'SELECT id, full_name, mfa_enabled FROM customers WHERE id = $1',
    [req.user.sub]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

const employeeLoginRules = [
  body('username').trim().notEmpty().isLength({ max: 50 }).escape(),
  body('password').notEmpty(),
];

router.post('/employee/login', employeeLoginRules, handleValidation, async (req, res) => {
  const { username, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM employees WHERE username = $1',
    [username]
  );

  if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

  const employee = result.rows[0];
  const valid = await comparePassword(password, employee.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ sub: employee.id, role: 'employee' });
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ id: employee.id, username: employee.username });
});

router.get('/employee/me', requireAuth('employee'), async (req, res) => {
  const result = await pool.query(
    'SELECT id, username FROM employees WHERE id = $1',
    [req.user.sub]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

module.exports = router;
