# Security and production setup

## Non-negotiable rules
- Never put SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, or GEMINI_API_KEY in browser JavaScript, HTML, GitHub, or a public environment variable.
- Browser clients use only the Supabase anon/publishable key and Supabase Auth.
- All balance changes happen on the server through the SQL RPC functions in supabase/schema.sql. The RPCs are executable only by the service_role.
- Never trust a balance, rate, duration, user ID, payment status, or consultation owner sent by the browser. Derive the user ID from a verified Supabase access token.
- Verify Razorpay webhook signatures using the exact raw request body; make payment credit idempotent using unique order/payment IDs.
- Keep HTTPS enabled. Rotate any secret that is ever exposed.
- Enable Supabase Auth email confirmation or phone OTP, configure rate limits, backups, and audit logs before launch.

## Database
Run supabase/schema.sql in the Supabase SQL Editor. It creates customer profiles, wallets, transactions, consultations, payments, kundlis and chat history with row-level security. Customers cannot write wallet balances or payment states.

## Environment variables (server only)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET
- GEMINI_API_KEY

## Billing model
The database charges ₹5 at consultation start for the first minute, then ₹5 for each complete additional minute. The database row locks and constraints prevent concurrent duplicate debits and negative balances. A consultation automatically stops when another complete minute cannot be paid. A server heartbeat must run during the session; the client timer is only a request trigger, never the source of truth.

## Before accepting real payments
This repository is not payment-certified. Add and test authenticated API handlers, Razorpay order creation, raw-body webhook verification, idempotent payment crediting, abuse rate limits, and deployment environment variables. Perform security review and end-to-end tests in a staging project first. Do not accept real money until those steps pass.
