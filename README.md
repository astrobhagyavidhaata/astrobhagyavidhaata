# Astro Bhagya Vidhata

Hindi-first Vedic astrology consultation web application.

## Implemented in the repository
- Birth chart calculation endpoint with all 16 classical Shodashvarga charts (D1–D60 set), whole-sign houses, nakshatra/pada, retrograde flags, basic drishti/conjunctions, Vimshottari dasha and Nav Tara.
- Daily nine-planet Gochar display with sign, degrees, nakshatra/pada, navamsa and house from the selected Moon sign.
- Daily local Panchang endpoint and UI: tithi, paksha, nakshatra/pada, yoga, karana, sunrise/sunset, moonrise/moonset, Rahu Kaal, Yamaganda, Gulika, Abhijit, Bhadra intervals, day/night Choghadiya and 24 horas.
- Supabase phone OTP authentication using HttpOnly cookies.
- Optional consent-based saving, browsing and deletion of a user's own saved birth charts.
- Paid consultation messages are stored per user/session and restored when an active session is reopened.
- Database-backed wallet and server-side ₹5/minute consultation billing RPCs.
- Razorpay order creation, Checkout UI, signature verification and raw-body webhook credit.
- AI consultation endpoint requires an authenticated user and active paid consultation.
- GitHub Actions syntax checks and Panchang API tests.

## Astronomy accuracy warning
The current ephemeris adapter uses Astronomy Engine tropical geocentric positions, a linear Lahiri ayanamsa approximation and a mean lunar node. It is **not Swiss Ephemeris**. Validate against the official Rashtriya Panchang and a trusted professional ephemeris across dates and locations before presenting results as exact. Ascendant, combustion, divisional charts and muhurta rules still need independent regression fixtures and review.

## Local development
1. Install Node.js 20 or later.
2. Run \`npm install\`.
3. Copy \`.env.example\` to \`.env\` and fill server-only credentials.
4. Run \`npm run check\` and \`npm test\`.
5. Run \`npm start\` and open the local address printed by the server.

## Supabase setup
1. Create a Supabase project.
2. Run \`supabase/schema.sql\` in the SQL Editor.
3. Enable Phone Auth and configure an SMS provider, OTP expiry and rate limits.
4. Copy the project URL, anon key and service-role key into the server environment. Never expose the service-role key in the browser.

## Razorpay setup
1. Start with Razorpay test mode.
2. Set the key ID and secret only in server environment variables.
3. Enable automatic payment capture in Razorpay, because wallet credit is granted only for captured payments.
4. Register \`https://YOUR-DOMAIN/api/payments/webhook\` as the webhook URL.
4. Subscribe to \`payment.captured\` and \`order.paid\`, and set the webhook secret.
5. Test duplicate webhook delivery, failed payments and wallet crediting before switching to live mode.

## Deployment option
A Render Blueprint is included in render.yaml, and a Dockerfile is included for container hosting. These files do not deploy the app automatically; create the service from the repository and enter the environment secrets in the hosting dashboard.

## Production status
Source code being committed does not mean the app is deployed or ready to accept money. A Supabase project, SMS provider, Razorpay account/webhook, Gemini API key, hosting environment, environment variables, SQL migration, end-to-end tests and independent security/astrology review are still required. Do not accept real customer payments until these checks pass.

See [SECURITY.md](SECURITY.md), [TERMS.md](TERMS.md), [PRIVACY.md](PRIVACY.md), [the astrology feature roadmap](docs/ASTROLOGY_FEATURE_ROADMAP.md) and [the Shodashvarga calculation rules](docs/VARGA_RULES.md).