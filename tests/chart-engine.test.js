"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {getVargaPosition,buildDivisionalCharts,buildChart,VARGA_DIVISIONS}=require("../lib/chart-engine");

test("Shodashvarga engine returns all 16 classical charts",()=>{
 const charts=buildDivisionalCharts(12.5,{सूर्य:{longitude:0},चंद्र:{longitude:30}});
 assert.equal(VARGA_DIVISIONS.length,16);
 assert.equal(Object.keys(charts).length,16);
 for(const key of ["D1","D2","D3","D4","D7","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60"]){
  assert.ok(charts[key],key+" missing");
  assert.ok(charts[key].ascendant.rashi);
  assert.ok(charts[key].planets.सूर्य.rashi);
  assert.ok(charts[key].planets.चंद्र.house>=1);
 }
});

test("D2, D7 and D10 follow the odd/even sign starts",()=>{
 assert.equal(getVargaPosition(0,2).rashi,"सिंह");
 assert.equal(getVargaPosition(15,2).rashi,"कर्क");
 assert.equal(getVargaPosition(30,7).rashi,"वृश्चिक");
 assert.equal(getVargaPosition(30,10).rashi,"मकर");
});

test("D30 switches at its unequal classical segment boundaries",()=>{
 assert.equal(getVargaPosition(4.999,30).rashi,"मेष");
 assert.equal(getVargaPosition(5,30).rashi,"कुंभ");
 assert.equal(getVargaPosition(30,30).rashi,"वृषभ");
});

test("Full chart retains D1 and D9 and includes divisional chart catalogue",()=>{
 const planets={सूर्य:{longitude:10,retrograde:false},चंद्र:{longitude:40,retrograde:false}};
 const chart=buildChart(12,planets);
 assert.equal(chart.d1.ascendant.rashi,"मेष");
 assert.ok(chart.d9.ascendant.rashi);
 assert.ok(chart.vargas.D60);
});