"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/consultation");
const { splitOwnerParagraphs } = require("../lib/profile-response-chunks");

async function ask(question, history = []) {
  let payload;
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { payload = value; return this; },
    setHeader() {}
  };
  await handler({ method: "POST", body: {
    question, language: "hi", lockedProfileRule: "TULA_1997_03_10_AMRAVATI",
    conversationHistory: history
  } }, response, {});
  return { status: response.statusCode, payload };
}

test("all requested nature aliases route to the authored nature archive without Gemini", async () => {
  for (const q of ["Mera nature Kaisa hoga", "nature", "swabhav", "स्वभाव", "व्यक्तित्व", "mere bare me batao"]) {
    const { status, payload } = await ask(q);
    assert.equal(status, 200, q);
    assert.equal(payload.predictionSource, "owner-locked-nature-verbatim", q);
    assert.match(payload.answer, /^आपकी जन्म कुंडली के अनुसार आपका स्वभाव/, q);
    assert.ok(splitOwnerParagraphs(payload.answer).length <= 3, q);
    assert.doesNotMatch(payload.answer, /दीक्षा जी, आपका स्वभाव स्वाभाविक रूप से संवेदनशील/, q);
  }
});

test("parents, partner, marriage, career and dasha prompts select their own authored archives", async () => {
  const cases = [
    ["mata pita", "owner-locked-parents-verbatim"],
    ["parents", "owner-locked-parents-verbatim"],
    ["माता-पिता और परिवार", "owner-locked-parents-verbatim"],
    ["Mera pati kaisa hai", "owner-locked-relationship-verbatim"],
    ["Mera partner kaisa hoga", "owner-locked-husband-work-verbatim"],
    ["Mera married life kaisa rahega", "owner-locked-relationship-verbatim"],
    ["Mujhe talaq ke bare mein batao", "owner-locked-relationship-verbatim"],
    ["career", "owner-locked-career-verbatim"],
    ["job", "owner-locked-career-verbatim"],
    ["business", "owner-locked-career-verbatim"],
    ["dasha", "owner-locked-dasha-verbatim"],
    ["mahadasha", "owner-locked-dasha-verbatim"],
    ["antardasha", "owner-locked-dasha-verbatim"],
    ["भविष्य", "owner-locked-dasha-verbatim"],
    ["आने वाला समय", "owner-locked-dasha-verbatim"]
  ];
  for (const [q, source] of cases) {
    const { status, payload } = await ask(q);
    assert.equal(status, 200, q);
    assert.equal(payload.predictionSource, source, q);
    assert.ok(payload.answer.length > 0, q);
    assert.ok(splitOwnerParagraphs(payload.answer).length <= 3, q);
  }
});

test("aur batao and repeating the topic return the next owner-authored paragraphs", async () => {
  const first = await ask("Mera nature Kaisa hoga");
  const second = await ask("aur batao", [
    { role: "user", content: "Mera nature Kaisa hoga" },
    { role: "assistant", content: first.payload.answer }
  ]);
  assert.equal(second.payload.predictionSource, "owner-locked-nature-verbatim");
  assert.notEqual(second.payload.answer, first.payload.answer);
  const repeated = await ask("Mera nature Kaisa hoga", [
    { role: "user", content: "Mera nature Kaisa hoga" },
    { role: "assistant", content: first.payload.answer },
    { role: "user", content: "Mera nature Kaisa hoga" },
    { role: "assistant", content: second.payload.answer }
  ]);
  assert.notEqual(repeated.payload.answer, first.payload.answer);
  assert.notEqual(repeated.payload.answer, second.payload.answer);
});

test("generic dasha and future requests return the full saved sequence in chunks", async () => {
  const { payload } = await ask("dasha");
  assert.equal(payload.predictionSource, "owner-locked-dasha-verbatim");
  assert.match(payload.answer, /शुक्र की महादशा/);
  const history = [
    { role: "user", content: "dasha" },
    { role: "assistant", content: payload.answer }
  ];
  const next = await ask("aage batao", history);
  assert.equal(next.payload.predictionSource, "owner-locked-dasha-verbatim");
  assert.notEqual(next.payload.answer, payload.answer);
});
