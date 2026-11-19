"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const gocharHandler = require("../api/gochar");

const RASHIS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test("Gochar API returns nine grahas, both house references and transit drishti", async () => {
  const before = Date.now();
  const req = { method: "GET", query: { rashi: "तुला", lagna: "मेष" } };
  const res = mockResponse();

  await gocharHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  const calculatedAt = Date.parse(res.body.asOf);
  assert.ok(Number.isFinite(calculatedAt));
  assert.ok(calculatedAt >= before && calculatedAt <= Date.now());
  assert.equal(res.body.basisRashi, "तुला");
  assert.equal(res.body.basisLagna, "मेष");
  assert.equal(res.body.planets.length, 9);

  for (const planet of res.body.planets) {
    const signIndex = RASHIS.indexOf(planet.rashi);
    assert.notEqual(signIndex, -1, planet.name + " has an unknown sign");
    assert.equal(planet.moonHouse, ((signIndex - 6 + 12) % 12) + 1,
      planet.name + " Moon-sign house is incorrect");
    assert.equal(planet.lagnaHouse, (signIndex % 12) + 1,
      planet.name + " Aries-ascendant house is incorrect");
    assert.ok(Number.isFinite(planet.longitude), planet.name + " longitude is invalid");
    assert.ok(planet.degree && typeof planet.degree.text === "string");
    assert.ok(typeof planet.nakshatra === "string" && planet.nakshatra.length > 0);
    assert.ok(planet.pada >= 1 && planet.pada <= 4);
  }

  assert.ok(res.body.drishti.fromMoon.houseAspects.length > 0);
  assert.ok(res.body.drishti.fromMoon.planetAspects.length >= 0);
  assert.ok(res.body.drishti.fromLagna.houseAspects.length > 0);
  assert.match(res.body.drishti.scheme, /Parashari/);
});

test("Gochar API rejects an invalid Moon sign", async () => {
  const req = { method: "GET", query: { rashi: "गलत", lagna: "मेष" } };
  const res = mockResponse();

  await gocharHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("Gochar API rejects an invalid ascendant when supplied", async () => {
  const req = { method: "GET", query: { rashi: "तुला", lagna: "गलत" } };
  const res = mockResponse();

  await gocharHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test("Gochar API rejects malformed dates", async () => {
  const req = { method: "GET", query: { rashi: "तुला", lagna: "मेष", date:"18-11-2026" } };
  const res = mockResponse();

  await gocharHandler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});
