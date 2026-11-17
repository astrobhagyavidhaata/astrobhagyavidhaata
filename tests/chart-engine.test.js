"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {getVargaPosition,buildDivisionalCharts,buildChart,VARGA_DIVISIONS,getInduLagna,get64thNavamsa,getArgalaRelations,analyzeDrishti}=require("../lib/chart-engine");

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
 assert.equal(getVargaPosition(30,60).rashi,"वृषभ");
 assert.equal(getVargaPosition(30.5,60).rashi,"मिथुन");
});

test("Common Parashari starts are applied for the remaining equal-part vargas",()=>{
 assert.equal(getVargaPosition(10,3).rashi,"सिंह");
 assert.equal(getVargaPosition(7.5,4).rashi,"कर्क");
 assert.equal(getVargaPosition(30,9).rashi,"मकर");
 assert.equal(getVargaPosition(30,16).rashi,"सिंह");
 assert.equal(getVargaPosition(30,20).rashi,"धनु");
 assert.equal(getVargaPosition(0,24).rashi,"सिंह");
 assert.equal(getVargaPosition(30,24).rashi,"कर्क");
 assert.equal(getVargaPosition(30,27).rashi,"कर्क");
 assert.equal(getVargaPosition(30,40).rashi,"तुला");
 assert.equal(getVargaPosition(60,45).rashi,"धनु");
 assert.equal(getVargaPosition(30,60).rashi,"वृषभ");
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

test("Indu Lagna follows the seven-graha kala method",()=>{
 const result=getInduLagna(2,4); // Gemini Lagna, Leo Moon
 assert.equal(result.ninthLordFromLagna,"शनि");
 assert.equal(result.ninthLordFromMoon,"मंगल");
 assert.equal(result.totalKalas,7);
 assert.equal(result.countFromMoon,7);
 assert.equal(result.rashi,"कुंभ");
});

test("64th Navamsa is the same longitude in the eighth sign",()=>{
 const result=get64thNavamsa(8.5); // Aries 8°30'
 assert.equal(result.kharaRashi,"वृश्चिक");
 assert.equal(result.kharaNavamsa,"कन्या");
});


test("Argala reports primary and secondary positions with their obstruction houses",()=>{
 const result=getArgalaRelations(0,{
  गुरु:{longitude:40,rashiIndex:1},
  शनि:{longitude:330,rashiIndex:11}
 });
 assert.deepEqual(result.relations[0].planets,["गुरु"]);
 assert.deepEqual(result.relations[0].obstructingPlanets,["शनि"]);
 assert.equal(result.relations[0].status,"संख्या बराबर — बल जाँच आवश्यक");
 assert.equal(result.relations[3].house,5);
});

test("Drishti includes full Mars special aspects and partial Parashari aspects",()=>{
 const result=analyzeDrishti({
  मंगल:{longitude:0,rashiIndex:0},
  गुरु:{longitude:120,rashiIndex:4}
 },0);
 assert.ok(result.houseAspects.some(x=>x.from==="मंगल"&&x.houseDistance===4&&x.aspectStrength===100));
 assert.ok(result.houseAspects.some(x=>x.from==="मंगल"&&x.houseDistance===3&&x.aspectStrength===25));
 assert.ok(result.planetAspects.some(x=>x.from==="मंगल"&&x.to==="गुरु"&&x.houseDistance===5&&x.aspectStrength===50));
});

test("Full chart returns special Lagnas, Khara points, Argala and Drishti",()=>{
 const planets={
  सूर्य:{longitude:10,retrograde:false},
  चंद्र:{longitude:40,retrograde:false},
  मंगल:{longitude:80,retrograde:false}
 };
 const chart=buildChart(12,planets);
 assert.ok(chart.specialLagnas.indu.rashi);
 assert.ok(chart.kharaPoints.lagna.kharaRashi);
 assert.ok(chart.argala.houses.length===12);
 assert.ok(chart.argala.grahas.length===3);
 assert.ok(chart.drishti.houseAspects.length>0);
});
