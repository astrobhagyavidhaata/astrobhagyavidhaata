"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const workerModule = import("../worker.mjs");

test("Worker locks the protected profile from birth details before consultation", async () => {
  const { default: worker } = await workerModule;
  const variants = [
    { localDate: "1997-03-10", localTime: "21:15:00", place: "Amravati" },
    { date: "10 March 1997", time: "09:15 PM", location: { latitude: 20.9, longitude: 77.7 } },
    { birthDate: "1997-03-10", birthTime: "9:15 PM", birthPlace: "Amravati, Maharashtra" },
    { date: "10/03/1997", time: "09:15 PM", location: { name: "Amravati" } },
    { date: "10 March 1997", time: "21:15:00", location: { latitude: 20.93, longitude: 77.75 } }
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


test("Worker recognizes all requested date, time, and Amravati coordinate formats", async () => {
  const { default: worker } = await workerModule;
  const variants = [
    { birthDetails: { date: "10/03/1997", time: "21:15", place: "Amravati" } },
    { birthData: { dateOfBirth: "10 March 1997", timeOfBirth: "9:15 PM", location: { name: "Amravati" } } },
    { chartContext: { birth: { localDate: "1997-03-10", localTime: "09:15 PM", latitude: 20.93, longitude: 77.75 } } },
    { chart: { birthDetails: { dob: "10/03/1997", birthTime: "21:15:00", coordinates: { latitude: 20.93, longitude: 77.75 } } } }
  ];
  for (const details of variants) {
    const request = new Request("https://astrobhagyavidhaata.in/api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "nature",
        ...details,
        conversationHistory: []
      })
    });
    const response = await worker.fetch(request, {}, { waitUntil() {} });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.predictionSource, "owner-locked-nature-verbatim");
    assert.match(payload.answer, /^आपकी जन्म कुंडली के अनुसार आपका स्वभाव/);
  }
});

test("Protected profile topics always return the matching owner-authored archive", async () => {
  const { default: worker } = await workerModule;
  const birthData = { localDate: "10/03/1997", localTime: "09:15 PM", place: "Amravati" };
  const cases = [
    ["swabhav", "owner-locked-nature-verbatim", /आपकी जन्म कुंडली के अनुसार आपका स्वभाव/],
    ["parents", "owner-locked-parents-verbatim", /आपकी कुंडली में माता-पिता/],
    ["career", "owner-locked-career-verbatim", /आपकी तुला लग्न और मीन राशि/],
    ["Mera pati kaisa hoga", "owner-locked-relationship-verbatim", /कानूनी अलगाव या तलाक/],
    ["future", "owner-locked-dasha-verbatim", /शुक्र की महादशा में राहु की अंतर्दशा/],
    ["rahu ki mhadsha kaisi rahegi", "owner-locked-dasha-verbatim", /शुक्र की महादशा में राहु की अंतर्दशा/],
    ["rahu", "owner-locked-dasha-verbatim", /शुक्र की महादशा में राहु की अंतर्दशा/],
    ["shukra rahu", "owner-locked-dasha-verbatim", /शुक्र की महादशा में राहु की अंतर्दशा/],
    ["mhadsha", "owner-locked-dasha-verbatim", /शुक्र की महादशा में राहु की अंतर्दशा/],
    ["Shani dhaiya", "owner-locked-dasha-verbatim", /अष्टम ढैया/]
  ];
  for (const [question, source, answerPattern] of cases) {
    const request = new Request("https://astrobhagyavidhaata.in/api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, birthData, conversationHistory: [] })
    });
    const response = await worker.fetch(request, {}, { waitUntil() {} });
    const payload = await response.json();
    assert.equal(response.status, 200, question);
    assert.equal(payload.predictionSource, source, question);
    assert.match(payload.answer, answerPattern, question);
    assert.doesNotMatch(payload.answer, /दीक्षा जी, आपका स्वभाव स्वाभाविक रूप से संवेदनशील/);
  }
});
