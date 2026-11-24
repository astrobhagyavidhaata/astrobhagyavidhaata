"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const workerModule = import("../worker.mjs");

test("Worker locks the protected profile from birth details before consultation", async () => {
  const { default: worker } = await workerModule;
  const variants = [
    { localDate: "1997-03-10", localTime: "21:15:00", place: "Amravati" },
    { date: "10 March 1997", time: "09:15 PM", location: { latitude: 20.9, longitude: 77.7 } },
    { birthDate: "1997-03-10", birthTime: "9:15 PM", birthPlace: "Amravati, Maharashtra" }
  ];
  for (const birthData of variants) {
    const request = new Request("https://astrobhagyavidhaata.in/api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://astrobhagyavidhaata.in" },
      body: JSON.stringify({
        question: "Mera nature Kaisa hoga",
        chartContext: { birth: birthData },
        birthData,
        conversationHistory: []
      })
    });
    const response = await worker.fetch(request, {});
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.predictionSource, "owner-locked-nature-verbatim");
    assert.match(payload.answer, /^आपकी जन्म कुंडली के अनुसार आपका स्वभाव/);
    assert.doesNotMatch(payload.answer, /दीक्षा जी, आपका स्वभाव स्वाभाविक रूप से संवेदनशील/);
  }
});
