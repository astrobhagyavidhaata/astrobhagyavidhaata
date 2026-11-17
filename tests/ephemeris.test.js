"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {calculateSiderealPositions}=require("../lib/ephemeris");

test("Ephemeris returns finite geocentric sidereal positions for nine grahas",()=>{
 const result=calculateSiderealPositions(new Date("2026-11-18T00:00:00Z"),21.47,78.27);
 assert.ok(Number.isFinite(result.ayanamsa));
 assert.ok(Number.isFinite(result.ascendantLongitude));
 assert.equal(Object.keys(result.planets).length,9);
 for(const [name,p] of Object.entries(result.planets)){
  assert.ok(Number.isFinite(p.longitude),name+" longitude invalid");
  assert.ok(p.longitude>=0&&p.longitude<360,name+" longitude outside zodiac");
  assert.equal(typeof p.retrograde,"boolean",name+" retrograde flag invalid");
 }
 assert.equal(result.planets.सूर्य.retrograde,false);
 assert.equal(result.planets.चंद्र.retrograde,false);
});