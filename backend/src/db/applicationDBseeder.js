'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const path = require('path');
const fs = require('fs');
const pool = require('./pool');
const bcrypt = require('bcrypt');
const { encrypt } = require('../services/encryption.service');

async function seed() {
  // Apply migration 002 (idempotent — uses IF NOT EXISTS / IF EXISTS guards)
  console.log('[seeder] Applying migration 002...');
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations/002_update_transactions.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('[seeder] Migration 002 done.');

  // ── Seed employee ─────────────────────────────────────────────────────────
  const { rows: empRows } = await pool.query(
    'SELECT id FROM employees WHERE username = $1',
    ['employee1']
  );
  if (!empRows.length) {
    const hash = await bcrypt.hash('Password123!', 12);
    await pool.query(
      'INSERT INTO employees (username, password_hash) VALUES ($1, $2)',
      ['employee1', hash]
    );
    console.log('[seeder] Seeded employee: employee1 / Password123!');
  } else {
    console.log('[seeder] employee1 already exists — skipping.');
  }

  // ── Seed customers ────────────────────────────────────────────────────────
  const customerDefs = [
    {
      full_name: 'Alice Johnson',
      id_number: '8501015026082',
      account_number: '1234567890',
      password: 'Password123!',
    },
    {
      full_name: 'Bob Smith',
      id_number: '9001014800088',
      account_number: '0987654321',
      password: 'Password123!',
    },
  ];

  const customerIds = {};
  for (const c of customerDefs) {
    const { rows } = await pool.query(
      'SELECT id FROM customers WHERE full_name = $1',
      [c.full_name]
    );
    if (!rows.length) {
      const hash = await bcrypt.hash(c.password, 12);
      const { rows: inserted } = await pool.query(
        `INSERT INTO customers (full_name, id_number_enc, account_number_enc, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [c.full_name, encrypt(c.id_number), encrypt(c.account_number), hash]
      );
      customerIds[c.full_name] = inserted[0].id;
      console.log(`[seeder] Seeded customer: ${c.full_name}  account: ${c.account_number}  password: ${c.password}`);
    } else {
      customerIds[c.full_name] = rows[0].id;
      console.log(`[seeder] ${c.full_name} already exists — skipping.`);
    }
  }

  // ── Seed sample transactions ──────────────────────────────────────────────
  const { rows: txRows } = await pool.query('SELECT COUNT(*) AS cnt FROM transactions');
  if (parseInt(txRows[0].cnt) === 0) {
    const aliceId = customerIds['Alice Johnson'];
    const bobId   = customerIds['Bob Smith'];

    const samples = [
      {
        customer_id: aliceId, amount: 1500.00, currency: 'USD',
        payee_name: 'John Doe', payee_account: '12345678',
        payee_bank_name: 'Chase Bank', payee_branch_code: '021000021', payee_country: 'US',
        sender_reference: 'INV-001', receiver_reference: 'ORD-2024-01', status: 'pending',
      },
      {
        customer_id: aliceId, amount: 500.00, currency: 'EUR',
        payee_name: 'Marie Dupont', payee_account: '87654321',
        payee_bank_name: 'BNP Paribas', payee_branch_code: '30004006', payee_country: 'FR',
        sender_reference: 'INV-002', receiver_reference: 'TRF-EU-01', status: 'submitted',
      },
      {
        customer_id: bobId, amount: 750.00, currency: 'GBP',
        payee_name: 'James Wilson', payee_account: '11223344',
        payee_bank_name: 'Barclays Bank', payee_branch_code: '20325323', payee_country: 'GB',
        sender_reference: 'PAY-001', receiver_reference: 'REC-001', status: 'rejected',
      },
    ];

    for (const tx of samples) {
      await pool.query(
        `INSERT INTO transactions
           (customer_id, amount, currency, payee_name, payee_account_enc,
            payee_bank_name, payee_branch_code, payee_country,
            sender_reference, receiver_reference, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          tx.customer_id, tx.amount, tx.currency, tx.payee_name, encrypt(tx.payee_account),
          tx.payee_bank_name, tx.payee_branch_code, tx.payee_country,
          tx.sender_reference, tx.receiver_reference, tx.status,
        ]
      );
    }
    console.log('[seeder] Seeded 3 sample transactions.');
  } else {
    console.log('[seeder] Transactions already exist — skipping.');
  }

  await pool.end();
  console.log('[seeder] Done.');
}

seed().catch(err => {
  console.error('[seeder] Failed:', err.message);
  process.exit(1);
});
