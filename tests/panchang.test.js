"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const handler=require("../api/panchang");
function response(){return {statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(value){this.body=value;return this;}};}
test("Panchang API returns local daily elements and time periods",async()=>{
 const res=response();
 await handler({method:"GET",query:{date:"2026-11-18",lat:"21.47",lon:"78.27"}},res);
 assert.equal(res.statusCode,200);assert.equal(res.body.success,true);
 assert.equal(res.body.timezone,"Asia/Kolkata");assert.ok(res.body.sunrise);assert.ok(res.body.sunset);
 assert.ok(res.body.panchang.tithi);assert.ok(res.body.panchang.nakshatra);
 assert.ok(res.body.panchang.yoga);assert.ok(res.body.panchang.karana);
 assert.equal(res.body.hora.length,24);assert.equal(res.body.choghadiya.day.length,8);
 assert.equal(res.body.choghadiya.night.length,8);assert.ok(Array.isArray(res.body.kaal.bhadraIntervals));
 assert.equal(res.body.weekday,"बुधवार");assert.equal(res.body.choghadiya.day[0].name,"लाभ");
 assert.equal(res.body.choghadiya.night[0].name,"उद्वेग");assert.equal(res.body.hora[0].lord,"बुध");
 assert.ok(res.body.panchang.tithiEnds);assert.ok(res.body.panchang.nakshatraEnds);
});
test("Panchang API rejects invalid coordinates",async()=>{
 const res=response();await handler({method:"GET",query:{date:"2026-11-18",lat:"200",lon:"78"}},res);
 assert.equal(res.statusCode,400);assert.equal(res.body.success,false);
});
test("Panchang API rejects unsupported methods",async()=>{
 const res=response();await handler({method:"POST",query:{}},res);
 assert.equal(res.statusCode,405);assert.equal(res.headers.Allow,"GET");
});