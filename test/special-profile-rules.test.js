"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { selectRelevantProfileReference } = require("../lib/gemini");

test("strict profile retrieval includes every matching owner-authored paragraph without a hidden cap", () => {
  const authoredNotes = Array.from(
    { length: 18 },
    (_, index) => `निजी नोट ${index + 1}: पति और तलाक के विषय में मालिक द्वारा लिखा गया विशिष्ट ज्योतिषीय निष्कर्ष।`
  ).join("\n\n");

  const selected = selectRelevantProfileReference("क्या मैं अपने पति को छोड़ सकती हूं या तलाक होगा?", authoredNotes);
  const paragraphs = selected.split(/\n\s*\n/);

  assert.equal(paragraphs.length, 18);
  assert.match(selected, /निजी नोट 1:/);
  assert.match(selected, /निजी नोट 18:/);
});

test("Gemini fallback marker appears only when no owner-authored paragraph matches the question", () => {
  const authoredNotes = "आपके करियर और नौकरी के बारे में मालिक का लिखा हुआ संदर्भ।";
  const selected = selectRelevantProfileReference("क्या मैं अपने पति को छोड़ सकती हूं?", authoredNotes);

  assert.match(selected, /^इस प्रश्न से सीधे मेल खाने वाला विशेष संदर्भ नहीं मिला।/);
});
