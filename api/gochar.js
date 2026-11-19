"use strict";

const { calculateSiderealPositions } = require("../lib/ephemeris");
const { getPosition, analyzeDrishti } = require("../lib/chart-engine");

const RASHIS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
const COMBUSTION_LIMITS = { चंद्र:12, मंगल:17, बुध:14, गुरु:11, शुक्र:10, शनि:15 };
function norm(value) { return ((value % 360) + 360) % 360; }
function angularDistance(a,b) {
  const d=Math.abs(norm(a)-norm(b));
  return Math.min(d,360-d);
}
function dms(value) {
  const totalSeconds=Math.round(value*3600);
  const degrees=Math.floor(totalSeconds/3600);
  const minutes=Math.floor((totalSeconds%3600)/60);
  const seconds=totalSeconds%60;
  return {degrees,minutes,seconds,text:degrees+"° "+minutes+"' "+seconds+'"'};
}
function getState(name, planet, sunLongitude) {
  const distance=angularDistance(planet.longitude,sunLongitude);
  const adjustment=name==="बुध" && planet.retrograde ? 2 : 0;
  const combust=Boolean(COMBUSTION_LIMITS[name] && distance <= COMBUSTION_LIMITS[name]-adjustment);
  const labels=[];
  if(planet.retrograde) labels.push("वक्री");
  else labels.push("मार्गी");
  if(combust) labels.push("अस्त");
  return {combust,sunDistance:Number(distance.toFixed(3)),state:labels.join(" एवं ")};
}

module.exports = async function handler(req,res) {
  if(req.method!=="GET") {
    res.setHeader("Allow","GET");
    return res.status(405).json({success:false,message:"केवल GET अनुरोध स्वीकार है।"});
  }
  const rashi=String(req.query?.rashi||"");
  const lagna=String(req.query?.lagna||"");
  if((rashi&&!RASHIS.includes(rashi))||(lagna&&!RASHIS.includes(lagna))||(!rashi&&!lagna)) {
    return res.status(400).json({success:false,message:"जन्म लग्न या चंद्र राशि में से कम-से-कम एक मान्य राशि चुनें।"});
  }

  try {
    // Calculate at the actual instant of this request, not at noon or a date-only timestamp.
    const asOf=new Date();
    const positions=calculateSiderealPositions(asOf,0,0);
    const moonIndex=rashi?RASHIS.indexOf(rashi):null;
    const lagnaIndex=lagna?RASHIS.indexOf(lagna):null;
    const sunLongitude=positions.planets.सूर्य.longitude;

    const planets=Object.entries(positions.planets).map(([name,planet])=>{
      const pos=getPosition(planet.longitude);
      const moonHouse=moonIndex===null?null:((pos.rashiIndex-moonIndex+12)%12)+1;
      const lagnaHouse=lagnaIndex===null?null:((pos.rashiIndex-lagnaIndex+12)%12)+1;
      const state=getState(name,planet,sunLongitude);
      return {
        name,rashi:pos.rashi,rashiIndex:pos.rashiIndex,
        degree:dms(pos.degreeInRashi),
        longitude:Number(pos.longitude.toFixed(6)),
        nakshatra:pos.nakshatra,pada:pos.pada,navamsa:pos.navamsa,
        house:lagnaHouse||moonHouse,moonHouse,lagnaHouse,
        retrograde:Boolean(planet.retrograde),combust:state.combust,
        sunDistance:state.sunDistance,state:state.state
      };
    });

    const transitChart=Object.fromEntries(Object.entries(positions.planets).map(([name,planet])=>[
      name,{...getPosition(planet.longitude),longitude:planet.longitude,retrograde:Boolean(planet.retrograde)}
    ]));
    const moonDrishti=moonIndex===null?null:analyzeDrishti(transitChart,moonIndex);
    const lagnaDrishti=lagnaIndex===null?null:analyzeDrishti(transitChart,lagnaIndex);

    return res.status(200).json({
      success:true,asOf:asOf.toISOString(),
      basisRashi:rashi||null,basisLagna:lagna||null,
      ayanamsa:"लाहिड़ी (रेखीय अनुमान)",
      ayanamsaDegrees:Number(positions.ayanamsa.toFixed(6)),
      houseSystem:"Whole Sign / राशि आधारित",
      ephemeris:"Astronomy Engine",
      planets,
      drishti:{
        scheme:moonDrishti?.scheme||lagnaDrishti?.scheme||"पराशरी",
        fromMoon:moonDrishti?{planetAspects:moonDrishti.planetAspects,houseAspects:moonDrishti.houseAspects}:null,
        fromLagna:lagnaDrishti?{planetAspects:lagnaDrishti.planetAspects,houseAspects:lagnaDrishti.houseAspects}:null
      },
      note:"गोचर समय सर्वर अनुरोध के वास्तविक UTC समय पर निकाला गया है। ग्रहों की स्थिति Astronomy Engine और रेखीय लाहिड़ी अयनांश पर आधारित है; राहु-केतु mean node हैं। यह Swiss Ephemeris प्रमाणित गणना नहीं है। 'शुभ/अशुभ' ग्रह का प्राकृतिक स्वभाव है, पूर्ण फलादेश नहीं; वास्तविक फल जन्मकुंडली, भावेश, दृष्टि और दशा से बदलता है।"
    });
  } catch(error) {
    console.error("Gochar API failed:",error);
    return res.status(500).json({success:false,message:"गोचर गणना उपलब्ध नहीं है।"});
  }
};
