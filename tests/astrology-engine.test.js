"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {getVimshottariDasha,getCompleteTaraChart}=require("../lib/astrology-engine");

test("Vimshottari builds all nine Mahadashas and nested periods",()=>{
 const d=getVimshottariDasha(new Date("2000-01-01T00:00:00Z"),0,new Date("2026-01-01T00:00:00Z"));
 assert.equal(d.startingMahadasha,"केतु");
 assert.equal(d.balanceAtBirthYears,7);
 assert.equal(d.mahadashas.length,9);
 for(const md of d.mahadashas){
  assert.equal(md.antardashas.length,9);
  for(const ad of md.antardashas)assert.equal(ad.pratyantardashas.length,9);
 }
 assert.ok(d.current.mahadasha);
 assert.ok(d.current.antardasha);
 assert.ok(d.current.pratyantardasha);
});

test("Nav Tara chart contains all 27 nakshatras in nine Tara groups",()=>{
 const chart=getCompleteTaraChart(0);
 assert.equal(chart.length,27);
 assert.equal(chart[0].name,"जन्म तारा");
 assert.equal(chart[1].name,"संपत तारा");
 assert.equal(chart[8].name,"परम मित्र तारा");
 assert.equal(chart[9].name,"जन्म तारा");
});