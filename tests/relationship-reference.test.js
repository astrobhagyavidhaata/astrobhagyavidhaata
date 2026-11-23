"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { getProfilePersonalityReference } = require("../lib/relationship-reference");

test("combined Hinglish capability and husband question returns both topics", () => {
  const answer = getProfilePersonalityReference(true, "Main kya kya kar sakti hun aur Mera Pati kaisa hai");
  assert.match(answer, /CA, फाइनेंस, सॉफ्टवेयर/);
  assert.match(answer, /आपके पति का स्वभाव/);
  assert.match(answer, /आर्मी, पुलिस, मशीनरी/);
  assert.equal(answer.split("\n").length, 4);
  assert.ok(!answer.includes("\\n"));
});

test("Hinglish capability-only question is recognized", () => {
  const answer = getProfilePersonalityReference(true, "Main kya kya kar sakti hun");
  assert.match(answer, /CA, फाइनेंस, सॉफ्टवेयर/);
});

test("Roman Hindi husband-only question is recognized", () => {
  const answer = getProfilePersonalityReference(true, "Mera Pati kaisa hai");
  assert.match(answer, /जीवनसाथी साहसी/);
});

test("Hindi combined capability and husband question returns both topics", () => {
  const answer = getProfilePersonalityReference(true, "मैं क्या-क्या कर सकती हूँ और मेरे पति कैसे हैं?");
  assert.match(answer, /CA, फाइनेंस, सॉफ्टवेयर/);
  assert.match(answer, /आपके पति का स्वभाव/);
});

test("disabled profile does not expose owner-authored profile answer", () => {
  assert.equal(getProfilePersonalityReference(false, "Mera Pati kaisa hai"), "");
});
