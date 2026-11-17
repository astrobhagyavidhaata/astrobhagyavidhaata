# Launch checklist — Astro Bhagya Vidhata

This checklist separates repository code from the external accounts and real-world checks required to launch.

## A. Database and login

1. Create a Supabase project.
2. Open SQL Editor and run supabase/schema.sql once.
3. Confirm the profiles, wallets, wallet_transactions, consultations, payments, kundlis and chat_messages tables exist.
4. Enable Phone Auth and configure an SMS provider, OTP expiry and rate limits.
5. Test a new phone number: OTP verification should create a profile and a zero-balance wallet.
6. Test logout, page reload and access-token refresh.

## B. AI consultation

1. Create an AI provider API key.
2. Add GEMINI_API_KEY and GEMINI_MODEL to the hosting service's server environment.
3. Test one short answer with a generated D1/D9 and Shodashvarga chart.
4. Confirm that AI requests fail when the user is logged out or has no active paid consultation.
5. Confirm the chat transcript is stored against the correct user and consultation.

## C. Wallet and payments

1. Create a Razorpay account and use test mode first.
2. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET to server environment variables.
3. Enable automatic payment capture in Razorpay.
4. Register the HTTPS webhook URL: https://YOUR-DOMAIN/api/payments/webhook
5. Subscribe to payment.captured and order.paid.
6. Test a successful recharge, failed payment, abandoned checkout, duplicate webhook delivery and amount mismatch.
7. Confirm that a ₹100 payment credits exactly 10,000 paise once, never twice.
8. Confirm consultation start charges ₹5, each completed additional minute charges ₹5, and low balance or a disconnected session stops billing at the paid boundary.

## D. Hosting

1. Create a Render web service from this GitHub repository using render.yaml, or build the Dockerfile on another Node.js 22 host.
2. Enter all secret environment variables in the hosting dashboard. Do not commit real keys to GitHub.
3. Wait for deployment and open the HTTPS website.
4. Confirm /api/kundli, /api/panchang, /api/gochar and authenticated routes respond as expected.
5. Configure the exact public HTTPS webhook URL in Razorpay.

## E. Astrology validation

1. Compare Sun, Moon, planets, nodes and Ascendant against a trusted professional ephemeris for multiple dates, times and locations.
2. Compare tithi, nakshatra, yoga, karana, sunrise, sunset, Rahu Kaal, Yamaganda, Gulika, Bhadra and Choghadiya against a trusted local Panchang.
3. Validate all 16 Shodashvarga placements against reference charts, including exact segment boundaries.
4. Verify Vimshottari Mahadasha, Antardasha, Pratyantardasha and Nav Tara with independent test cases.
5. Do not advertise a 64-varga system until its exact tradition and calculation rules are specified and independently validated.
6. Build and review the marriage and other Muhurta rules with a qualified astrologer before publishing candidate dates as recommendations.

## F. Legal and privacy readiness

1. Replace the operator, registered address, privacy email and grievance officer placeholders in TERMS.md and PRIVACY.md.
2. Confirm real provider disclosures, retention periods, refund process and data-deletion workflow.
3. Obtain Indian legal review of the Terms and Privacy Policy.
4. Obtain an independent security review before accepting real customer money.

## Current status

The repository contains code and automated checks. It is not deployed, Supabase SQL has not been executed in a live project, SMS/payment/AI credentials have not been configured, and the astronomy calculations have not passed professional reference validation. Do not accept real payments until sections A–F have been completed.