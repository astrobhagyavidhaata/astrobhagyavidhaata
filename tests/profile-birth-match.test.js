"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeDate, normalizeTime, isLocked1997AmravatiProfile } = require("../lib/profile-birth-match");

test("protected profile date parser accepts ISO, numeric DMY, and written month", () => {
  for (const value of ["1997-03-10", "10/03/1997", "10 March 1997", "10 Mar 1997"]) {
    assert.equal(normalizeDate(value), true, value);
  }
  assert.equal(normalizeDate("11/03/1997"), false);
});

test("protected profile time parser accepts 24-hour and AM/PM forms", () => {
  for (const value of ["21:15", "21:15:00", "09:15 PM", "9:15 PM", "09:15 p.m."]) {
    assert.equal(normalizeTime(value), true, value);
  }
  assert.equal(normalizeTime("09:15 AM"), false);
});

test("profile lock matches all requested birth-detail formats by Amravati name or coordinates", () => {
  const variants = [
    { localDate: "1997-03-10", localTime: "21:15", place: "Amravati" },
    { date: "10/03/1997", time: "21:15:00", birthPlace: "Amravati, Maharashtra" },
    { birthDate: "10 March 1997", birthTime: "09:15 PM", location: { latitude: 20.93, longitude: 77.75 } },
    { dob: "10 March 1997", timeOfBirth: "9:15 PM", birthPlace: { latitude: 20.93, longitude: 77.75 } }
  ];
  for (const value of variants) assert.equal(isLocked1997AmravatiProfile(value), true, JSON.stringify(value));
});

test("profile lock rejects wrong date, time, or unrelated city", () => {
  assert.equal(isLocked1997AmravatiProfile({ date: "11/03/1997", time: "21:15", place: "Amravati" }), false);
  assert.equal(isLocked1997AmravatiProfile({ date: "10/03/1997", time: "09:15 AM", place: "Amravati" }), false);
  assert.equal(isLocked1997AmravatiProfile({ date: "10/03/1997", time: "21:15", place: "Nagpur", latitude: 21.15, longitude: 79.09 }), false);
});
