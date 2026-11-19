"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {calculateTaraBal,detectLifeEvents,buildGocharSynthesis}=require("../lib/gochar-synthesis");

test("Tara Bala maps all nine navatara groups and wraps at 27",()=>{
  assert.equal(calculateTaraBal(1,1).name,"जन्म तारा");
  assert.equal(calculateTaraBal(1,2).name,"संपत तारा");
  assert.equal(calculateTaraBal(1,3).score,-2);
  assert.equal(calculateTaraBal(1,27).name,"मित्र तारा");
  assert.equal(calculateTaraBal(27,1).name,"संपत तारा");
  assert.equal(calculateTaraBal(0,1),null);
  assert.equal(calculateTaraBal(1,28),null);
});

test("life-event synthesis does not claim strong career trigger without verified Shadbala",()=>{
  const kundali={janmaNakshatraNumber:1};
  const planets=[{name:"गुरु",transitNakshatraNumber:2,transitHouseFromLagna:10,shadbalaPercent:null}];
  const triggers=detectLifeEvents(kundali,planets,{});
  assert.equal(triggers.some(x=>x.category==="career_positive"),false);
});

test("life-event synthesis includes dasha lord, Tara Bala and natal placements without private identity",()=>{
  const chart={
    d1:{ascendant:{rashi:"मेष",rashiIndex:0},planets:{
      चंद्र:{rashi:"वृषभ",longitude:40,house:2,nakshatra:"रोहिणी",nakshatraIndex:3,pada:2},
      गुरु:{rashi:"कर्क",longitude:100,house:4,nakshatra:"पुष्य",nakshatraIndex:7,pada:1}
    }},
    dasha:{current:{mahadasha:"गुरु",antardasha:"शनि",pratyantardasha:"बुध"}}
  };
  const transit={planets:[{name:"गुरु",longitude:110,rashi:"कर्क",nakshatra:"पुष्य",nakshatraIndex:7,pada:2,lagnaHouse:4,moonHouse:3}]};
  const result=buildGocharSynthesis(chart,transit);
  assert.equal(result.kundali.janmaNakshatraNumber,4);
  assert.equal(result.dashaInfo.mahadashaLord,"गुरु");
  assert.equal(result.transitPlanets[0].natal.house,4);
  assert.equal(result.transitPlanets[0].isCurrentDashaLord,true);
  assert.equal(result.transitPlanets[0].taraBal.taraNumber,4);
  assert.equal(result.transitPlanets[0].shadbalaPercent,null);
  assert.equal("name" in result.kundali,false);
});
