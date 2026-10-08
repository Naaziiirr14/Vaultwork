# Vaultwork: freelancer payment escrow (MERN + Razorpay)

Client job post pannuvaar, budget-a milestones ah pirippaar. Freelancer apply panni hire aanadhum, client ovvoru milestone-um Razorpay (test mode) la escrow la fund pannuvaar. Freelancer work submit pannuvaar, client approve pannaa payment release aagum.

## Status flow

```
pending -> funded -> submitted -> released
                        |
                        +-> disputed -> released (admin) | refunded (admin)
```

Client 7 naal respond pannala na `submitted` milestone auto-release aagum (`AUTO_RELEASE_DAYS`).

## Run panradhu

### Server
```bash
cd server
npm install
cp .env.example .env      # apram .env la values fill pannunga
npm run seed              # demo data (ellaa data-vum delete aagum!)
npm run dev
```

### Client
```bash
cd client
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

## Demo logins (seed script create pannum)

| Role       | Email                     | Password  |
|------------|---------------------------|-----------|
| Admin      | admin@vaultwork.com       | admin123  |
| Client     | client@vaultwork.com      | client123 |
| Freelancer | freelancer@vaultwork.com  | free123   |
| Freelancer | karthik@vaultwork.com     | free123   |

## Razorpay test payment

Checkout la: card `4111 1111 1111 1111`, ethavadhu future expiry, ethavadhu CVV, OTP `1234` (illana UPI `success@razorpay`).
Razorpay keys illana `ALLOW_MOCK_PAYMENT=true` vachu "Simulate payment" button use pannalam.

## API (viva ku)

| Method | Route | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | any |
| GET | /api/jobs, /api/jobs/mine, /api/jobs/:id | any |
| POST | /api/jobs | client |
| POST | /api/jobs/:id/apply | freelancer |
| POST | /api/jobs/:id/hire | client |
| POST | /api/milestones/:id/fund-order, /verify, /mock-fund | client |
| POST | /api/milestones/:id/submit | freelancer |
| POST | /api/milestones/:id/approve, /reject | client |
| GET | /api/disputes | any (own), admin (all) |
| PUT | /api/disputes/:id/resolve | admin |
| GET | /api/stats/me | any |
| POST | /api/milestones/auto-release/run | admin |

## Important note (viva la solla vendiyadhu)

Razorpay standard checkout paisa-va hold panradhu illa. Athanala escrow status-a database la maintain panrom (`funded`, `released`...). "Released" nu maarumbodhu freelancer ku payout real ah pogadhu; production la inga RazorpayX Payouts API call pannanum.

## Deploy

- Server: Render. Env vars ellam add pannunga, `CLIENT_URL` la Vercel URL kudunga.
- Client: Vercel. `VITE_API_URL=https://<render-url>/api`. `vercel.json` already irukku (SPA rewrite).
