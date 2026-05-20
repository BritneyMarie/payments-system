# International Payments System

A full-stack web application for processing international payments via SWIFT, with a customer portal and an internal bank employee verification portal.

## Tech Stack

- **Backend**: Node.js / Express — `backend/`
- **Frontend**: React + Vite + Tailwind CSS — `frontend/`
- **Database**: PostgreSQL

## Quick Start

### 1. Database

Create a PostgreSQL database and run the migration:

```sh
createdb payments
psql -d payments -f backend/src/db/migrations/001_init.sql
```

### 2. Backend

```sh
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, and generate secrets:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm start
```

The API will be available at `http://localhost:5000`.

### 3. Frontend

```sh
cd frontend
cp .env.example .env
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Create a bank employee (one-time seed)

Run this against your database to create a test employee:

```sh
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('YourPassword123!', 12).then(h => console.log(h));
"
# Then insert:
# INSERT INTO employees (username, password_hash) VALUES ('employee1', '<hash>');
```

---

## Flows

### Customer
1. `POST /api/auth/register` — register with full name, ID number, account number, password
2. `POST /api/auth/login` — log in with account number + password
3. If MFA not set up: `POST /api/auth/mfa/setup` → scan QR → `POST /api/auth/mfa/verify`
4. `POST /api/transactions` — submit a payment (amount, currency, SWIFT code, payee details)
5. `GET /api/transactions` — view own transaction history

### Employee
1. `POST /api/auth/employee/login`
2. `GET /api/portal/transactions` — view all pending transactions
3. `POST /api/portal/transactions/:id/submit` — forward to SWIFT
4. `POST /api/portal/transactions/:id/reject` — reject

---

## Security Controls

| Control | Implementation |
|---------|---------------|
| Password hashing | bcrypt, cost factor 12 |
| PII at rest | AES-256-GCM (ID number, account numbers) |
| Session cookies | HttpOnly, Secure, SameSite=Strict, 15-min expiry |
| Input validation | express-validator on all endpoints |
| SQL injection | Parameterized queries (`pg`) — no string concatenation |
| XSS | Helmet CSP + input escaping |
| Clickjacking | X-Frame-Options: DENY + CSP frame-ancestors 'none' |
| HSTS | 1 year, includeSubDomains |
| Rate limiting | 100 req/15 min global; 10 req/15 min on auth endpoints |
| MFA | TOTP via otplib; secret encrypted at rest |
| Role separation | JWT role claim enforced on every protected route |
