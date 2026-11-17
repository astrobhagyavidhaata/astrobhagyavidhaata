# Astro Bhagya Vidhata

Hindi-first Vedic astrology web application.

## Current implementation
- Birth details and place selection using Open-Meteo geocoding.
- Server-side birth chart endpoint: D1, D9, whole-sign houses, nakshatra/pada, retrograde flags, basic graha drishti, conjunctions, combustion estimates, Vimshottari dasha and Nav Tara list.
- Gemini consultation endpoint (server-side API key only).
- Local Express server for development.

## Important calculation note
The current ephemeris adapter uses Astronomy Engine tropical geocentric positions, a linear Lahiri ayanamsa approximation and a mean lunar node. It is **not Swiss Ephemeris** and must be validated against a trusted Panchang/ephemeris for the supported historical date range before being sold as an exact professional kundli. Ascendant and combustion calculations also need independent test fixtures. Do not advertise guaranteed precision yet.

## Run locally
1. Install Node.js 20 or later.
2. Run `npm install`.
3. Set `GEMINI_API_KEY` in the server environment for AI consultations.
4. Run `npm start` and open the local address printed by the server.

Never put Gemini, payment-provider, or database service-role secrets in browser JavaScript or commit them to GitHub.

## Not production-ready yet
- Secure customer login and persistent account identity.
- Database-backed wallet ledger and payment verification/webhooks.
- Server-authoritative ₹5/minute billing and consultation session lifecycle.
- Admin authentication and persistent Gochar content management.
- Automated astronomical regression tests and independent ephemeris validation.
- Production hosting configuration and environment variables.

The wallet UI intentionally depends on server endpoints; do not accept real customer payments until authentication, database transactions, and payment webhooks are implemented and tested.
