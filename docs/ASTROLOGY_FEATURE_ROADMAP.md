# Astro Bhagya Vidhata — Astrology Feature Roadmap

This is the implementation checklist for the astrology engine and daily almanac. It is a product specification, not a claim that every feature is already implemented.

## 1. Birth chart and divisional charts

- [x] D1 Rashi / Lagna chart
- [x] D2 Hora
- [x] D3 Drekkana
- [x] D4 Chaturthamsa
- [x] D7 Saptamsa
- [x] D9 Navamsa
- [x] D10 Dasamsa
- [x] D12 Dvadasamsa
- [x] D16 Shodasamsa
- [x] D20 Vimsamsa
- [x] D24 Chaturvimsamsa
- [x] D27 Saptavimsamsa
- [x] D30 Trimsamsa
- [x] D40 Khavedamsa
- [x] D45 Akshavedamsa
- [x] D60 Shashtiamsa
- [ ] Extend to a clearly documented 64-varga catalogue only after selecting and documenting the tradition and calculation rules.
- [ ] Show planetary sign, degree, house, nakshatra, pada, dignity and retrograde status in each applicable chart.
- [ ] Add chart export/print and clear calculation settings.

Note: Shodashvarga means the 16 classical divisional charts. A 64-varga set is a separate extended scheme; do not label 16 charts as 64 or silently mix traditions.

## 2. Live sky / today's gochar

- [x] Calculate current sidereal planetary longitudes using the current approximate Lahiri model.
- [x] Show sign, degree-minute-second, nakshatra, pada, and retrograde/direct status.
- [ ] Show combustion/visibility status only when supported by a documented rule.
- [x] Show sign-based house from selected Moon sign.
- [ ] Show ingress, station, conjunction and aspect events with exact local date/time.
- [ ] Provide general gochar from all 12 Moon signs and a personalized view against a saved birth chart.
- [ ] Display calculation timestamp, timezone, ayanamsa and limitations.

## 3. Panchang and daily calendar

- [ ] Tithi with start/end time
- [x] Vara (weekday at local sunrise)
- [ ] Nakshatra with start/end time and pada transitions
- [ ] Yoga with start/end time
- [ ] Karana with start/end time
- [x] Local sunrise, sunset, moonrise and moonset
- [x] Location search/selection and automatic timezone lookup
- [ ] Hindu month, paksha and samvat details according to a selected calendar convention

## 4. Daily time periods

- [x] Hora timetable for day and night, calculated from local sunrise/sunset
- [ ] Current hora and next hora transition
- [x] Rahu Kaal, Yamaganda and Gulika
- [x] Abhijit Muhurta
- [x] Day and night Choghadiya
- [x] Bhadra / Vishti Karana intervals (initial calculation)
- [ ] Local-time display and next-day handling

## 5. Muhurta

- [ ] Marriage muhurta search by date range and location
- [ ] Griha-pravesh, naming, mundan, vehicle/property purchase, business opening and travel muhurta
- [ ] Filters for weekday, tithi, nakshatra, yoga, karana, Bhadra and other selected rules
- [ ] Show why a time is accepted/rejected and the tradition/rule set used
- [ ] Clearly distinguish general calendar windows from personalized muhurta requiring both parties' birth details

## 6. Dasha, strength and interpretation

- [ ] Vimshottari Mahadasha, Antardasha and Pratyantardasha with exact start/end
- [ ] Dasha balance at birth and timezone-safe date calculations
- [ ] Planetary dignity, house lordship, aspects, conjunctions and yogas
- [ ] Optional Shadbala / other strength systems only after validated implementation
- [ ] Combined dasha + transit interpretation, with source/rule transparency

## 7. Accuracy, testing and release gates

- [ ] Select authoritative ephemeris and document ayanamsa, node type (mean/true), house system and calculation conventions.
- [ ] Validate planetary positions, ascendant, divisional charts, panchang boundaries and muhurta windows against trusted professional references across many dates and locations.
- [ ] Expand automated tests for sign/nakshatra/pada boundaries, leap days, timezone transitions and sunrise/sunset edge cases. (Basic chart-engine and Panchang API tests now run in GitHub Actions.)
- [ ] Do not publish a feature as accurate until its calculations have passed validation.
- [ ] Show an explicit calculation note wherever the engine uses approximations.

## Current implementation status (updated 2026-11-18)

- D1 and D9 are calculated; the current chart engine now also returns all 16 classical Shodashvarga charts (D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60) using documented common Parashari division rules. These rules still require independent reference-chart validation.
- Daily Gochar displays nine grahas with sidereal sign, degree-minute-second, nakshatra/pada, navamsa, house from selected Moon sign and retrograde/direct status.
- Daily Panchang currently shows sunrise-based five limbs, end-time estimates, local sunrise/sunset/moonrise/moonset, Rahu Kaal, Yamaganda, Gulika, Abhijit, Bhadra, day/night Choghadiya and 24 horas.
- Vimshottari output includes the full nine-Mahadasha timeline, current Mahadasha/Antardasha/Pratyantardasha breakdowns and the 27-nakshatra Nav Tara chart.
- Users can opt in to save a generated Kundli to their account, view/delete their own saved charts, and restore the transcript of an active paid consultation.
- GitHub Actions runs JavaScript syntax checks, automated ephemeris/chart/dasha/Panchang tests, HTTP smoke tests and an npm audit (latest successful run: zero dependency vulnerabilities).
- Mobile OTP, wallet, Razorpay and paid consultation server routes have been added, but they require Supabase/Razorpay configuration, SQL migration execution and staging end-to-end tests before use.
- Astronomy Engine positions now use apparent geocentric ecliptic coordinates. Lahiri ayanamsa remains a linear approximation; the system is not Swiss Ephemeris and has not passed independent professional validation.
- The 64-varga extended catalogue, event timelines, festival rules, personalized muhurta, Shadbala and independent ephemeris validation remain future work.
