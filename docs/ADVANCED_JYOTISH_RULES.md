# Advanced Jyotish calculations — implementation notes

This document records the calculation conventions used by Astro Bhagya Vidhata. These are computational outputs, not deterministic predictions. Different Jyotish lineages may apply variant rules; the chosen rule is shown with each result.

## 1. Shodashvarga / smaller divisional charts

The engine calculates the 16 classical Shodashvarga charts: D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45 and D60. No 64-varga catalogue is being implemented. The 64th Navamsa below is a distinct Khara Navamsa reference point, not a 64th divisional chart.

## 2. Jaimini Argala and Virodha Argala

For each of the 12 natal houses and each of the nine grahas, counted from its occupied sign:

| Argala source | Obstruction |
|---|---|
| 2nd (primary) | 12th |
| 4th (primary) | 10th |
| 11th (primary) | 3rd |
| 5th (secondary) | 9th |

The result lists the occupants on both sides. More occupants on the Argala side are marked as Argala prevailing; more occupants on the obstruction side are marked as Virodha prevailing. Equal counts are deliberately marked "strength review required" rather than decided by a simplistic score. A separate note identifies two or more natural malefics in the 3rd as an optional lineage-specific Papargala reading. Ketu's reverse counting and sign-aspect based Argala are not mixed into this default whole-sign planetary table.

## 3. Indu Lagna (Dhana Lagna)

The implemented Uttara Kalamrita-style seven-graha Kala method is:

- Find the 9th sign lord from natal Lagna and the 9th sign lord from natal Moon.
- Add the Kala values: Sun 30, Moon 16, Mars 6, Mercury 8, Jupiter 10, Venus 12, Saturn 1.
- Rahu and Ketu are excluded.
- Divide by 12; if the remainder is zero, use 12.
- Count that many signs inclusively from the Moon sign. The reached sign is Indu Lagna.

The output shows both ninth lords, their Kala values, the total, remainder, resulting sign and its house from natal Lagna. Indu Lagna is a wealth-analysis reference, not a guarantee of wealth or a replacement for the 2nd/11th houses, D2 and Dasha.

## 4. 64th Navamsa / Khara Navamsa

For a source longitude, the engine adds 210 degrees (seven signs, i.e. the 8th sign counted inclusively) and calculates the Navamsa at that same degree in the 8th sign. The report computes separate reference points from the natal Ascendant, Moon and Sun. The Moon reference is especially common in Jataka Parijata; texts and lineages differ on whether Lagna and Sun are also included. The result includes the 8th-sign position, its Navamsa sign and the Navamsa lord.

This is a sensitive-point calculation. It must not be used by itself to declare death, illness, accidents or other certain events. Any interpretation requires full chart context, Dasha, transit, and an explicitly selected tradition.

## 5. Graha Drishti

The engine provides sign-based aspects and a fractional Parashari aspect display:

- 3rd and 10th: 25%
- 5th and 9th: 50%
- 4th and 8th: 75%
- 7th: 100%
- Mars has full special aspects on 4th and 8th; Jupiter on 5th and 9th; Saturn on 3rd and 10th.
- Rahu/Ketu 5th, 7th and 9th full-aspect convention is retained from the existing engine and is explicitly identified as lineage-dependent.

The report lists both planet-to-planet aspects and aspects on each natal house. These percentages represent the selected traditional aspect scheme, not a physically measured force or an empirically validated probability.

## Validation status

All these calculations require independent comparison against trusted classical examples and professional Jyotish software before commercial use. The underlying ephemeris and Lahiri ayanamsa in this repository remain approximate. Boundary cases, sign lords, nodes and alternative lineage settings should be reviewed before launch.