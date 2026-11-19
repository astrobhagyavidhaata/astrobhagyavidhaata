"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const handler=require("../api/kundli");
function response(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(value){this.body=value;return this;}};}

test("Kundli API returns D1, D9, all 16 vargas, Dasha and Nav Tara",async()=>{
 const res=response();
 await handler({method:"POST",body:{
  name:"Test",birthDate:"2000-01-01",birthTime:"12:00",
  birthPlace:{name:"Warud",latitude:21.47,longitude:78.27},
  saveToAccount:false
 }},res);
 assert.equal(res.statusCode,200);
 assert.equal(res.body.success,true);
 const chart=res.body.chart;
 assert.ok(chart.d1.ascendant.rashi);
 assert.ok(chart.d9.ascendant.rashi);
 assert.equal(Object.keys(chart.vargas).length,16);
 assert.equal(chart.dasha.mahadashas.length,9);
 assert.equal(chart.taraChart.length,27);
 assert.equal(chart.birth.timezone,"Asia/Kolkata");
});

test("Kundli API rejects future birth date",async()=>{
 const res=response();
 await handler({method:"POST",body:{
  birthDate:"2099-01-01",birthTime:"12:00",
  birthPlace:{latitude:21.47,longitude:78.27}
 }},res);
 assert.equal(res.statusCode,400);
});
for (const sample of [
 {name:"Warri, Delta, Nigeria",latitude:5.5167,longitude:5.75,zone:"Africa/Lagos",offset:60},
 {name:"London, United Kingdom",latitude:51.5072,longitude:-0.1276,zone:"Europe/London",offset:0},
 {name:"New York, USA",latitude:40.7128,longitude:-74.0060,zone:"America/New_York",offset:-300},
 {name:"Dubai, UAE",latitude:25.2048,longitude:55.2708,zone:"Asia/Dubai",offset:240}
]) {
 test("Kundli API resolves local timezone for "+sample.name,async()=>{
  const res=response();
  await handler({method:"POST",body:{
   name:"Timezone Test",birthDate:"2000-01-01",birthTime:"12:00",
   birthPlace:{name:sample.name,latitude:sample.latitude,longitude:sample.longitude},
   saveToAccount:false
  }},res);
  assert.equal(res.statusCode,200,JSON.stringify(res.body));
  assert.equal(res.body.chart.birth.timezone,sample.zone);
  assert.equal(res.body.chart.birth.timezoneOffsetMinutes,sample.offset);
  assert.equal(res.body.chart.birth.timezoneOffsetHours,sample.offset/60);
 });
}
