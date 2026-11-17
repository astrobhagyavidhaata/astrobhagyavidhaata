"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildLiveAstrologyContext, houseFrom } = require("../lib/consultation-context");

test("whole-sign transit houses are counted inclusively from the reference sign", () => {
  assert.equal(houseFrom(0, 0), 1);
  assert.equal(houseFrom(11, 0), 12);
  assert.equal(houseFrom(2, 10), 5);
});

test("consultation context refreshes dasha and calculates nine current transits", () => {
  const birth = new Date("1990-01-01T00:00:00.000Z");
  const now = new Date("2026-11-18T00:00:00.000Z");
  const source = {
    birth: { utc: birth.toISOString() },
    d1: {
      ascendant: { rashiIndex: 0, longitude: 5 },
      planets: { चंद्र: { longitude: 45 } }
    }
  };
  const result = buildLiveAstrologyContext(source, now);
  assert.equal(result.gochar.asOf, now.toISOString());
  assert.equal(result.gochar.natalMoonRashi, "वृषभ");
  assert.equal(result.gochar.natalAscendantRashi, "मेष");
  assert.equal(result.gochar.planets.length, 9);
  assert.ok(result.gochar.planets.every(p =>
    Number.isInteger(p.houseFromMoon) &&
    p.houseFromMoon >= 1 && p.houseFromMoon <= 12 &&
    Number.isFinite(p.longitude)
  ));
  assert.ok(result.dasha.current);
  assert.notEqual(result.dasha, source.dasha);
});
