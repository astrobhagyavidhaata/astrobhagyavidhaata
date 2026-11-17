# Astro Bhagya Vidhata — Astrology Feature Roadmap

This is the implementation checklist for the astrology engine and daily almanac. It is a product specification, not a claim that every feature is already implemented.

## 1. Birth chart and divisional charts

- [ ] D1 Rashi / Lagna chart
- [ ] D2 Hora
- [ ] D3 Drekkana
- [ ] D4 Chaturthamsa
- [ ] D7 Saptamsa
- [ ] D9 Navamsa
- [ ] D10 Dasamsa
- [ ] D12 Dvadasamsa
- [ ] D16 Shodasamsa
- [ ] D20 Vimsamsa
- [ ] D24 Chaturvimsamsa
- [ ] D27 Saptavimsamsa
- [ ] D30 Trimsamsa
- [ ] D40 Khavedamsa
- [ ] D45 Akshavedamsa
- [ ] D60 Shashtiamsa
- [ ] Extend to a clearly documented 64-varga catalogue only after selecting and documenting the tradition and calculation rules.
- [ ] Show planetary sign, degree, house, nakshatra, pada, dignity and retrograde status in each applicable chart.
- [ ] Add chart export/print and clear calculation settings.

Note: Shodashvarga means the 16 classical divisional charts. A 64-varga set is a separate extended scheme; do not label 16 charts as 64 or silently mix traditions.

## 2. Live sky / today's gochar

- [ ] Calculate current sidereal planetary longitudes using the selected ayanamsa.
- [ ] Show sign, exact degree-minute-second, nakshatra, pada, and retrograde/direct status.
- [ ] Show combustion/visibility status only when supported by a documented rule.
- [ ] Show sign-based house from selected ascendant or Moon sign.
- [ ] Show ingress, station, conjunction and aspect events with exact local date/time.
- [ ] Provide general gochar from all 12 Moon signs and a personalized view against a saved birth chart.
- [ ] Display calculation timestamp, timezone, ayanamsa and limitations.

## 3. Panchang and daily calendar

- [ ] Tithi with start/end time
- [ ] Vara (weekday)
- [ ] Nakshatra with start/end time and pada transitions
- [ ] Yoga with start/end time
- [ ] Karana with start/end time
- [ ] Local sunrise, sunset, moonrise and moonset
- [ ] Location and timezone selection
- [ ] Hindu month, paksha and samvat details according to a selected calendar convention

## 4. Daily time periods

- [ ] Hora timetable for day and night, calculated from local sunrise/sunset
- [ ] Current hora and next hora transition
- [ ] Rahu Kaal, Yamaganda and Gulika
- [ ] Abhijit Muhurta
- [ ] Choghadiya
- [ ] Bhadra / Vishti Karana start and end
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
- [ ] Add automated tests for sign/nakshatra/pada boundaries, leap days, timezones, daylight-saving transitions and sunrise/sunset edge cases.
- [ ] Do not publish a feature as accurate until its calculations have passed validation.
- [ ] Show an explicit calculation note wherever the engine uses approximations.

## Current implementation status (known baseline)

- Existing engine calculates D1 and D9-related placement data and basic sidereal planetary positions.
- Existing gochar endpoint currently lists current planetary sign/degree and sign-based house for a selected Rashi.
- Existing gochar output does not yet provide the complete nakshatra/pada/event timeline, Panchang, Hora, Bhadra or Muhurta features above.
- Existing ephemeris uses Astronomy Engine with an approximate Lahiri ayanamsa; it is not Swiss Ephemeris and must be validated before commercial claims.
