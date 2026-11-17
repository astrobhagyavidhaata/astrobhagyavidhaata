# Security and production setup

## Non-negotiable rules
- Never put SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, or GEMINI_API_KEY in browser JavaScript, HTML, GitHub, or a public environment variable.
- Browser clients use only the Supabase anon/publishable key and Supabase Auth.
- All balance changes happen on the server through the SQL RPC functions in supabase/schema.sql. The RPCs are executable only by the service_role.
- Never trust a balance, rate, duration, user ID, payment status, or consultation owner sent by the browser. Derive the user ID from a verified Supabase access token.
- Verify Razorpay webhook signatures using the exact raw request body; the webhook endpoint is `/api/payments/webhook` and wallet credit is performed by an idempotent database RPC.
- OTP login uses Supabase Phone Auth. Configure an SMS provider and OTP rate limits in the Supabase dashboard before testing real phone numbers.
- Auth access and refresh tokens are stored in HttpOnly, SameSite=Lax cookies; serve production traffic only over HTTPS.
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

## Implemented server routes (configuration still required)
- `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/me`, `/api/auth/logout`: Supabase phone OTP and HttpOnly session cookies.
- `/api/wallet`: authenticated balance read.
- `/api/payments/create-order` and `/api/payments/verify`: authenticated Razorpay Checkout order and server verification.
- `/api/payments/webhook`: raw-body HMAC verification and idempotent credit.
- `/api/consultations/start|heartbeat|stop`: server-side ₹5/minute billing RPCs.
- `/api/consultation`: AI answers only for an authenticated user with an active paid session.

## Before accepting real payments
The source code is not payment-certified and is not yet live. Run `supabase/schema.sql` in the Supabase SQL Editor, configure Supabase Phone Auth and an SMS provider, set every server-only environment variable, register the exact HTTPS webhook URL in Razorpay, and test with Razorpay test keys. The webhook secret must match the Razorpay dashboard. Run staging tests for OTP, refresh/logout, duplicate webhook delivery, failed/abandoned payments, wallet balance, simultaneous sessions, browser disconnects, and low-balance session stops. Obtain an independent security review before accepting real money.
