-- Migration 002: Replace swift_code with structured payment routing fields
ALTER TABLE transactions DROP COLUMN IF EXISTS swift_code;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payee_bank_name TEXT NOT NULL DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payee_branch_code TEXT NOT NULL DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payee_country CHAR(2) NOT NULL DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_reference TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receiver_reference TEXT;
