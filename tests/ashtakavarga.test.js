"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateAshtakavarga, EXPECTED_TOTALS } = require("../lib/ashtakavarga");

const sample = {
  सूर्य:{longitude:12}, चंद्र:{longitude:48}, मंगल:{longitude:77},
  बुध:{longitude:103}, गुरु:{longitude:151}, शुक्र:{longitude:219},
  शनि:{longitude:301}
};

test("Ashtakavarga returns the classical seven BAV totals and 337-point SAV", () => {
  const result = calculateAshtakavarga(sample, 4);
  assert.deepEqual(
    Object.fromEntries(Object.entries(result.bhinna).map(([name, value]) => [name, value.total])),
    EXPECTED_TOTALS
  );
  assert.equal(result.sarva.total, 337);
  assert.equal(result.validation.passed, true);
  for (const planet of Object.keys(EXPECTED_TOTALS)) {
    assert.equal(result.bhinna[planet].signs.length, 12);
    assert.equal(result.bhinna[planet].signs.reduce((sum, sign) => sum + sign.bindus, 0), EXPECTED_TOTALS[planet]);
  }
});

test("Ashtakavarga is rotationally consistent when all longitudes and Lagna move by one sign", () => {
  const shifted = Object.fromEntries(
    Object.entries(sample).map(([name, position]) => [name, { longitude: position.longitude + 30 }])
  );
  const original = calculateAshtakavarga(sample, 4);
  const rotated = calculateAshtakavarga(shifted, 5);
  for (const planet of Object.keys(EXPECTED_TOTALS)) {
    for (let sign = 0; sign < 12; sign++) {
      assert.equal(
        rotated.bhinna[planet].signs[(sign + 1) % 12].bindus,
        original.bhinna[planet].signs[sign].bindus
      );
    }
  }
  for (let sign = 0; sign < 12; sign++) {
    assert.equal(
      rotated.sarva.signs[(sign + 1) % 12].bindus,
      original.sarva.signs[sign].bindus
    );
  }
});
