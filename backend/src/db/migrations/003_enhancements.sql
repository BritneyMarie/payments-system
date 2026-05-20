-- Migration 003: Customer status/balance, transaction flags, audit log

ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance NUMERIC(15,2) NOT NULL DEFAULT 50000.00;

-- Set realistic seed balances
UPDATE customers SET balance = 142350.00 WHERE full_name = 'Alice Johnson';
UPDATE customers SET balance = 87920.50  WHERE full_name = 'Bob Smith';

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE transactions SET flagged = TRUE WHERE amount > 10000;

CREATE TABLE IF NOT EXISTS audit_log (
  id               SERIAL PRIMARY KEY,
  employee_id      UUID REFERENCES employees(id),
  employee_username TEXT NOT NULL,
  action           TEXT NOT NULL,
  entity_type      TEXT NOT NULL,
  entity_id        INTEGER,
  details          JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
