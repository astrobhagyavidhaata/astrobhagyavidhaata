# Astro Bhagya Vidhata

Hindi-first Vedic astrology consultation web application.

## Implemented in the repository
- Birth chart calculation endpoint with 16 Shodashvarga charts (D1–D60 set), whole-sign houses, nakshatra/pada, retrograde flags, drishti/conjunctions, Vimshottari dasha and Nav Tara.
- Daily nine-planet Gochar display.
- Daily local Panchang endpoint and UI.
- Supabase phone OTP authentication using HttpOnly cookies.
- Optional consent-based saved birth charts.
- Paid consultation messages stored per user/session.
- Database-backed wallet and server-side ₹5/minute consultation billing RPCs.
- Razorpay order creation, Checkout UI, signature verification and raw-body webhook credit.
- AI consultation endpoint restricted to authenticated users with an active paid consultation.
- GitHub Actions syntax checks, tests and HTTP smoke checks.

## Live database status
The connected Supabase project has been configured. The seven public tables (profiles, wallets, wallet_transactions, consultations, payments, kundlis and chat_messages) exist, RLS is enabled on all seven, and the security advisor currently reports no security lints. SMS/Phone Auth provider configuration and real-user end-to-end tests are still pending.

## Astronomy accuracy warning
The current ephemeris adapter uses Astronomy Engine tropical geocentric positions, a linear Lahiri ayanamsa approximation and a mean lunar node. It is **not Swiss Ephemeris**. Validate against the official Rashtriya Panchang and a trusted professional ephemeris across dates and locations before presenting results as exact. Ascendant, combustion, divisional charts and muhurta rules still need independent regression fixtures and review.

## Local development
1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill server-only credentials.
4. Run `npm run check` and `npm test`.
5. Run `npm start` and open the local address printed by the server.

## Supabase setup
The database schema has already been applied to the connected project. For a fresh project, run `supabase/schema.sql` in SQL Editor. Enable Phone Auth and configure an SMS provider, OTP expiry and rate limits. Set the project URL, anon key and service-role key only in the server environment; never expose the service-role key in the browser.

## Razorpay setup
1. Start with Razorpay test mode.
2. Set the key ID and secret only in server environment variables.
3. Enable automatic payment capture.
4. Register `https://YOUR-DOMAIN/api/payments/webhook` as the webhook URL.
5. Subscribe to `payment.captured` and `order.paid`, and set the webhook secret.
6. Test duplicate webhook delivery, failed payments and wallet crediting before switching to live mode.

## Deployment option
A Render Blueprint is included in render.yaml and a Dockerfile is included for container hosting. The Render free service may sleep and is for testing only. Create the service from the repository and enter environment secrets in the hosting dashboard; these files do not deploy automatically.

## Production status
The database and repository checks are in place, but the app is not yet deployed or ready to accept money. Phone/SMS, Gemini, Razorpay, hosting environment variables, real end-to-end tests, professional astrology validation and legal/security review remain. Do not accept real customer payments until these checks pass.

See [SECURITY.md](SECURITY.md), [TERMS.md](TERMS.md), [PRIVACY.md](PRIVACY.md), [the astrology feature roadmap](docs/ASTROLOGY_FEATURE_ROADMAP.md), [the Shodashvarga calculation rules](docs/VARGA_RULES.md) and [the launch checklist](docs/LAUNCH_CHECKLIST.md).
