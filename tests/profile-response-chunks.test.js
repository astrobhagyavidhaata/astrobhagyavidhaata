"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { getNextOwnerChunk, splitOwnerParagraphs } = require("../lib/profile-response-chunks");

const archive = [
  "नेचर का पहला पैराग्राफ।",
  "नेचर का दूसरा पैराग्राफ।",
  "नेचर का तीसरा पैराग्राफ।",
  "नेचर का चौथा पैराग्राफ।",
  "नेचर का पांचवां पैराग्राफ।",
  "नेचर का छठा पैराग्राफ।",
  "नेचर का सातवां पैराग्राफ।"
].join("\n\n");

test("owner-authored answers are split into at most three complete paragraphs", () => {
  const first = getNextOwnerChunk(archive, "Mujhe mere nature ke bare mein batao", []);
  assert.equal(splitOwnerParagraphs(first.answer).length, 3);
  assert.equal(first.paragraphStart, 0);
  assert.equal(first.hasMore, true);
  assert.match(first.answer, /पहला पैराग्राफ/);
  assert.match(first.answer, /तीसरा पैराग्राफ/);
});

test("repeating the same topic returns the next three paragraphs using chat history", () => {
  const history = [
    { role: "user", content: "Mujhe mere nature ke bare mein batao" },
    { role: "assistant", content: archive.split("\n\n").slice(0, 3).join("\n\n") }
  ];
  const next = getNextOwnerChunk(archive, "मेरा नेचर कैसा है?", history);
  assert.equal(splitOwnerParagraphs(next.answer).length, 3);
  assert.equal(next.paragraphStart, 3);
  assert.match(next.answer, /चौथा पैराग्राफ/);
  assert.match(next.answer, /छठा पैराग्राफ/);
});

test("aur batao continues the last topic and the final chunk contains the remaining paragraph", () => {
  const history = [
    { role: "user", content: "Mujhe mere nature ke bare mein batao" },
    { role: "assistant", content: archive.split("\n\n").slice(0, 3).join("\n\n") },
    { role: "user", content: "aur batao" },
    { role: "assistant", content: archive.split("\n\n").slice(3, 6).join("\n\n") }
  ];
  const last = getNextOwnerChunk(archive, "aage batao", history);
  assert.equal(splitOwnerParagraphs(last.answer).length, 1);
  assert.equal(last.paragraphStart, 6);
  assert.equal(last.hasMore, false);
  assert.match(last.answer, /सातवां पैराग्राफ/);
});

test("history from another topic does not advance the current topic archive", () => {
  const history = [
    { role: "user", content: "मेरे माता-पिता के साथ रिश्ते कैसे रहेंगे?" },
    { role: "assistant", content: "माता-पिता का पहला पैराग्राफ।\n\nमाता-पिता का दूसरा पैराग्राफ।" }
  ];
  const first = getNextOwnerChunk(archive, "मेरा नेचर कैसा है?", history);
  assert.equal(first.paragraphStart, 0);
  assert.equal(splitOwnerParagraphs(first.answer).length, 3);
});


test("long single-paragraph archives are reflowed into readable paragraph chunks", () => {
  const longAnswer = Array.from({ length: 10 }, (_, index) => `यह एक लंबा वाक्य क्रमांक ${index + 1} है जो मूल मालिक-लिखित उत्तर का हिस्सा है।`).join(" ");
  const first = getNextOwnerChunk(longAnswer, "मेरा पार्टनर कैसा होगा?", []);
  assert.equal(splitOwnerParagraphs(first.answer).length, 3);
  assert.equal(first.hasMore, true);
  const history = [
    { role: "user", content: "मेरा पार्टनर कैसा होगा?" },
    { role: "assistant", content: first.answer }
  ];
  const second = getNextOwnerChunk(longAnswer, "aur batao", history);
  assert.equal(splitOwnerParagraphs(second.answer).length, 1);
  assert.equal(second.hasMore, false);
});

test("locked 1997 nature consultation returns authored chunks without a Gemini key", async () => {
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
      lockedProfileRule: "TULA_1997_03_10_AMRAVATI",
      conversationHistory: []
    }
  }, response, {});
  assert.equal(response.statusCode, 200);
  assert.equal(payload.predictionSource, "owner-locked-nature-verbatim");
  assert.equal(splitOwnerParagraphs(payload.answer).length, 3);
  assert.doesNotMatch(payload.answer, /दीक्षा जी, आपका स्वभाव मुख्य रूप से संतुलित/);
});
