# Shodashvarga calculation rules used in the current engine

This file documents the common Parashari-style division rules implemented in lib/chart-engine.js. It is a calculation specification for review, not a claim that every lineage uses identical conventions. Compare outputs with trusted reference charts before commercial use.

For ordinary divisions, the 30-degree sign is split into equal parts. The longitude inside the selected part is scaled back to a 0–30 degree longitude in the destination sign.

| Varga | Division rule |
|---|---|
| D1 Rashi | Original sidereal sign and degree. |
| D2 Hora | Odd signs: first half Leo, second Cancer. Even signs: first Cancer, second Leo. |
| D3 Drekkana | Three 10-degree parts: own sign, 5th sign, 9th sign. |
| D4 Chaturthamsa | Four 7°30′ parts: own sign, 4th, 7th, 10th. |
| D7 Saptamsa | Seven equal parts; odd signs count from themselves, even signs from the 7th sign. |
| D9 Navamsa | Nine equal parts; movable signs start from themselves, fixed signs from the 9th, dual signs from the 5th. |
| D10 Dasamsa | Ten equal parts; odd signs count from themselves, even signs from the 9th sign. |
| D12 Dvadasamsa | Twelve equal parts counted consecutively from the natal sign. |
| D16 Shodasamsa | Sixteen equal parts; movable signs start Aries, fixed signs Leo, dual signs Sagittarius. |
| D20 Vimsamsa | Twenty equal parts; movable signs start Aries, fixed signs Sagittarius, dual signs Leo. |
| D24 Chaturvimsamsa | Twenty-four equal parts; odd signs start Leo, even signs Cancer. |
| D27 Saptavimsamsa | Twenty-seven equal parts; fire signs start Aries, earth Cancer, air Libra, water Capricorn. |
| D30 Trimsamsa | Unequal parts. Odd signs: 0–5 Mars/Aries, 5–10 Saturn/Aquarius, 10–18 Jupiter/Sagittarius, 18–25 Mercury/Gemini, 25–30 Venus/Libra. Even signs: 0–5 Venus/Taurus, 5–12 Mercury/Virgo, 12–20 Jupiter/Pisces, 20–25 Saturn/Capricorn, 25–30 Mars/Scorpio. |
| D40 Khavedamsa | Forty equal parts; odd signs start Aries, even signs Libra. |
| D45 Akshavedamsa | Forty-five equal parts; movable signs start Aries, fixed signs Leo, dual signs Sagittarius. |
| D60 Shashtiamsa | Sixty half-degree parts counted forward from the occupied sign itself; the traditional amsa-name order reverses in even signs, but names are not yet calculated here. |

## Scope and limitations

- The engine currently calculates D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60.
- D1 and D9 retain the existing response fields for backward compatibility; all 16 charts are also available under chart.vargas.
- The current UI prints sign, degree within the varga sign, whole-sign house and retrograde status for each chart.
- D60 sign mapping counts each half-degree part forward from the occupied sign for both odd and even signs. The traditional sixty amsa names (reversed in even signs) are not currently displayed.
- Planetary dignity, varga-vishama/bala, divisional aspects, varga-specific yogas and interpretive rules are not yet implemented.
- A 64-varga catalogue is not included. It is a separate extended scheme and must not be represented as the classical Shodashvarga.
- Birth-chart accuracy is still limited by the current approximate Lahiri ayanamsa and ephemeris configuration. Validate all divisional placements against a trusted professional reference set before relying on them for paid consultations.