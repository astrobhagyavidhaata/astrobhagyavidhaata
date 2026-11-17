# Launch checklist — Astro Bhagya Vidhata

This checklist separates completed repository/database work from external account setup and real-world checks.

## A. Database and login

- [x] Live Supabase project connected: Astro Bhagya Vidhata.
- [x] Seven public tables exist: profiles, wallets, wallet_transactions, consultations, payments, kundlis and chat_messages.
- [x] Row Level Security is enabled on all seven tables.
- [x] Server-only access to money-changing RPC functions is restricted to service_role.
- [x] Supporting indexes and optimized own-row RLS checks are applied.
- [x] Latest Supabase security advisor check returned no security lints.

Still required:
1. Enable Supabase Phone Auth and configure an SMS provider, OTP expiry and rate limits.
2. Add the Supabase project URL, anon key and service-role key to the hosting service's server environment. Never put the service-role key in browser code or GitHub.
3. Test a new phone number: OTP verification should create a profile and zero-balance wallet.
4. Test logout, page reload and access-token refresh.

## B. AI consultation

1. Create an AI provider API key.
2. Add GEMINI_API_KEY and GEMINI_MODEL to the hosting service's server environment.
3. Test a short answer using a generated chart.
4. Confirm AI requests fail when logged out or without an active paid consultation.
5. Confirm the chat transcript is stored against the correct user and consultation.

## C. Wallet and payments

1. Create a Razorpay account and use test mode first.
2. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET to server environment variables.
3. Enable automatic payment capture.
4. Register the HTTPS webhook URL: https://YOUR-DOMAIN/api/payments/webhook
5. Subscribe to payment.captured and order.paid.
6. Test successful recharge, failed payment, abandoned checkout, duplicate webhook delivery and amount mismatch.
7. Confirm ₹100 credits exactly 10,000 paise once, never twice.
8. Confirm consultation start charges ₹5 and later complete minutes charge ₹5, with low-balance/disconnect handling.

## D. Hosting

1. Create a Render web service from this GitHub repository using render.yaml, or use another Node.js 22 host.
2. Enter all server-only environment variables in the hosting dashboard. Do not commit real keys to GitHub.
3. Wait for deployment and open the HTTPS website.
4. Confirm /healthz, /api/kundli, /api/panchang and /api/gochar work.
5. Configure the exact public HTTPS webhook URL in Razorpay.

## E. Astrology validation

1. Compare Sun, Moon, planets, nodes and Ascendant against a trusted professional ephemeris for multiple dates, times and locations.
2. Compare tithi, nakshatra, yoga, karana, sunrise, sunset, Rahu Kaal, Yamaganda, Gulika, Bhadra and Choghadiya against a trusted local Panchang.
3. Validate all 16 Shodashvarga placements against reference charts, including segment boundaries.
4. Verify Vimshottari Mahadasha, Antardasha, Pratyantardasha and Nav Tara with independent test cases.
5. Do not advertise a 64-varga system until its tradition and calculation rules are specified and independently validated.
6. Have a qualified astrologer review muhurta rules before publishing recommendations.

## F. Legal and privacy readiness

1. Support contact details supplied and added to the app and policy drafts: vipank01509@gmail.com and +91 82080 91073 (phone/WhatsApp).
2. Operator and Grievance Officer details added to Terms and Privacy drafts: Vipin Kumar (individual operator), the postal/correspondence address supplied by him, and the same support email/phone for grievance contact. Confirm whether any additional registered/business address disclosure applies and ensure complaints are monitored and handled within applicable timelines.
3. Confirm provider disclosures, retention periods, refund process and data-deletion workflow.
4. Obtain Indian legal review of Terms and Privacy Policy.
4. Obtain an independent security review before accepting real customer money.

## Verified status on 18 November 2026

- Live database: configured; seven tables and RLS verified.
- Supabase security advisor: no security lints.
- GitHub CI: latest OTP consent changes passed; CI runs for the new support-contact and policy edits are currently in progress (verify before launch).
- Not yet deployed to public hosting.
- SMS provider, Gemini and Razorpay credentials are not configured in hosting.
- Real end-to-end OTP, AI and payment tests remain pending.
- Astronomy engine is an approximation, not Swiss Ephemeris; professional reference validation remains pending.

Do not accept real customer payments until sections B–F and the remaining A steps are completed.
