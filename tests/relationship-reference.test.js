"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { getProfilePersonalityReference, getProfileSpecificSeparationAnswer, getProfileNatureAnswer, getProfileHabitsAnswer, getProfileOccultAnswer, getProfileHusbandWorkAnswer, areProfilePredictionsLocked } = require("../lib/relationship-reference");

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


test("partner habits question gets a distinct habit-focused answer", () => {
  const answer = getProfilePersonalityReference(true, "मेरे पार्टनर में क्या-क्या आदतें होंगी");
  assert.match(answer, /जिम्मेदारी लेना/);
  assert.match(answer, /ध्यान रखना/);
  assert.match(answer, /जिद/);
  assert.ok(!answer.startsWith("आपका जीवनसाथी साहसी"));
});

test("partner personality question keeps the general personality answer", () => {
  const answer = getProfilePersonalityReference(true, "मेरा पार्टनर कैसा होगा");
  assert.match(answer, /^आपका जीवनसाथी साहसी/);
});

test("disabled profile does not expose owner-authored profile answer", () => {
  assert.equal(getProfilePersonalityReference(false, "Mera Pati kaisa hai"), "");
});


test("direct Roman Hindi husband divorce question gets the detailed saved separation analysis", () => {
  const answer = getProfileSpecificSeparationAnswer("Kya Main Apne Pati se Devorce le sakti hun");
  assert.match(answer, /वर्तमान में आपके लिए पति से कानूनी अलगाव या तलाक का योग नहीं बनता है/);
  assert.match(answer, /तारा बल/);
  assert.match(answer, /नवांश कुंडली में/);
  assert.ok(!answer.includes("नवांश नवांश में"));
});

test("direct Roman Hindi question asking whether she can give divorce gets the same dedicated answer", () => {
  const answer = getProfileSpecificSeparationAnswer("Maine poochha Main Apne pati ko divorce de sakti hun nahin de sakti");
  assert.match(answer, /कानूनी अलगाव या तलाक का योग नहीं बनता/);
  assert.match(answer, /दशा प्रभाव/);
});


test("owner-written exact paragraph is returned for husband personality and work questions", () => {
  const { getProfileHusbandWorkAnswer } = require("../lib/relationship-reference");
  const answer = getProfileHusbandWorkAnswer(true, "Mera pati kaisa hoga aur kya kaam karta hoga?");
  assert.match(answer, /^आपकी जन्म कुंडली के सप्तम भाव/);
  assert.match(answer, /अत्यंत निडर, स्वाभिमानी, तेज बुद्धि वाला/);
  assert.match(answer, /आपके सामने बार-बार झुक जाएगा और रिश्ते को बचाने के लिए आपसे माफियां भी मांगेगा/);
  assert.match(answer, /बाहरी दुनिया व कार्यक्षेत्र में भी बड़ा लाभ और तरक्की प्राप्त होगी/);
  assert.equal(getProfileHusbandWorkAnswer(false, "Mera pati kaisa hoga"), "");
});


test("owner-written two-paragraph nature answer is returned for locked profile nature questions", () => {
  const answer = getProfileNatureAnswer(true, "मेरा नेचर कैसा है?");
  assert.match(answer, /^आपकी जन्म कुंडली के अनुसार आपका स्वभाव/);
  assert.match(answer, /आपकी जन्म कुंडली में मन, भावनाओं और सोच के स्तर पर/);
  assert.equal(answer.split(/\n\n/).length, 8);
  for (const heading of ["पल-पल बदलने वाला अस्थिर स्वभाव", "बातों को लंबे समय तक छिपाना", "अत्यधिक ओवरथिंकिंग", "जिद्दी, अड़ियल", "वाद-विवाद में आनंद लेना", "अचानक मूड बदलना"]) {
    assert.ok(answer.includes(heading), `missing owner-authored nature section: ${heading}`);
  }
  assert.equal(getProfileNatureAnswer(false, "मेरा नेचर कैसा है?"), "");
});


test("owner-written exact habits paragraph is returned for locked profile habits questions", () => {
  const answer = getProfileHabitsAnswer(true, "मेरी आदतें कैसी हैं?");
  assert.match(answer, /^आपकी जन्म कुंडली के अनुसार आपके व्यक्तित्व और दैनिक व्यवहार/);
  assert.match(answer, /आपका मूड किसी मौसम की तरह बहुत तेजी से बदलता है/);
  assert.match(answer, /रचनात्मक कार्य, सजने-संवरने/);
  assert.equal(getProfileHabitsAnswer(false, "मेरी आदतें कैसी हैं?"), "");
});

test("all locked profile topics return only their matching owner-authored paragraph", () => {
  const occult = getProfileOccultAnswer(true, "मुझे तंत्र-मंत्र और गूढ़ विद्याओं का शौक है?");
  assert.match(occult, /^आपकी जन्म कुंडली के अनुसार आपके भीतर सामान्य लोगों/);
  assert.match(occult, /Sixth Sense/);
  assert.equal(getProfileOccultAnswer(true, "मेरी आदतें कैसी हैं?"), "");

  const husband = getProfileHusbandWorkAnswer(true, "Mera pati kaisa hoga aur kya kaam karega?");
  assert.match(husband, /^आपकी जन्म कुंडली के सप्तम भाव/);
  assert.equal(getProfileHusbandWorkAnswer(true, "मेरा स्वभाव कैसा है?"), "");
});


test("locked birth profile serves its saved owner answers instead of globally blocking predictions", () => {
  assert.equal(areProfilePredictionsLocked(), false);
  const answer = getProfileNatureAnswer(true, "Mera nature kaisa hai?");
  assert.match(answer, /^आपकी जन्म कुंडली के अनुसार आपका स्वभाव/);
  assert.equal(answer.split(/\n\n/).length, 8);
  for (const heading of ["पल-पल बदलने वाला अस्थिर स्वभाव", "बातों को लंबे समय तक छिपाना", "अत्यधिक ओवरथिंकिंग", "जिद्दी, अड़ियल", "वाद-विवाद में आनंद लेना", "अचानक मूड बदलना"]) {
    assert.ok(answer.includes(heading), `missing owner-authored nature section: ${heading}`);
  }
});


test("consultation honors the explicit locked birth profile rule and returns the owner's exact nature archive", async () => {
  const consultationHandler = require("../api/consultation");
  let payload;
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { payload = value; return this; },
    setHeader() {}
  };
  await consultationHandler({
    method: "POST",
    body: {
      question: "Mujhe mere nature ke bare mein batao",
      language: "hi",
      lockedProfileRule: "TULA_1997_03_10_AMRAVATI"
    }
  }, response, {});
  assert.equal(response.statusCode, 200);
  assert.equal(payload.predictionSource, "owner-locked-nature-verbatim");
  assert.match(payload.answer, /^आपकी जन्म कुंडली के अनुसार आपका स्वभाव बाहर से देखने में बेहद शांत/);
  assert.match(payload.answer, /पल-पल बदलने वाला अस्थिर स्वभाव/);
  assert.doesNotMatch(payload.answer, /तुला लग्न.*न्यायप्रिय.*मीन राशि/);
});
