"use strict";

const {askGemini}=require("../lib/gemini");
const {buildLiveAstrologyContext}=require("../lib/consultation-context");
const recentRequests=new Map();
const runtimeApiKey=env=>env?.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "") || "";

const PRIVATE_FIELD_KEYS = new Set([
  "name", "fullname", "email", "phone", "mobile", "birthplace", "place",
  "address", "latitude", "longitude", "lat", "lon", "coordinates",
  "birthdate", "birthtime", "localdate", "utc", "timezone"
]);

function stripPersonalFields(value){
  if(Array.isArray(value))return value.map(stripPersonalFields);
  if(!value||typeof value!=="object")return value;
  const clean={};
  for(const [key,item] of Object.entries(value)){
    const normalized=key.replace(/[_\s-]/g,"").toLowerCase();
    if(PRIVATE_FIELD_KEYS.has(normalized))continue;
    clean[key]=stripPersonalFields(item);
  }
  return clean;
}

function collectPrivateValues(value, output=[]){
  if(Array.isArray(value)){for(const item of value)collectPrivateValues(item,output);return output;}
  if(!value||typeof value!=="object")return output;
  for(const [key,item] of Object.entries(value)){
    const normalized=key.replace(/[_\s-]/g,"").toLowerCase();
    if(PRIVATE_FIELD_KEYS.has(normalized)&&typeof item==="string"&&item.trim().length>1)output.push(item.trim());
    else collectPrivateValues(item,output);
  }
  return output;
}

function redactQuestion(question, rawChart){
  let clean=String(question||"");
  const values=[...new Set(collectPrivateValues(rawChart))].sort((a,b)=>b.length-a.length);
  for(const value of values)clean=clean.split(value).join("[निजी जानकारी हटाई गई]");
  clean=clean.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[ईमेल हटाया गया]");
  clean=clean.replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,"[फोन नंबर हटाया गया]");
  return clean;
}

function compactChartContext(source){
  if(!source||typeof source!=="object"||Array.isArray(source))return {};
  const d=source.dasha||{},current=d.current||{};
  const md=(d.mahadashas||[]).find(x=>x.planet===current.mahadasha);
  const ad=(md?.antardashas||[]).find(x=>x.planet===current.antardasha);
  const pickPlanet=(planet)=>({
    rashi:planet?.rashi,rashiIndex:planet?.rashiIndex,longitude:planet?.longitude,
    degreeInRashi:planet?.degreeInRashi,nakshatra:planet?.nakshatra,pada:planet?.pada,
    house:planet?.house,retrograde:planet?.retrograde
  });
  const pickChart=(chart)=>({
    ascendant:chart?.ascendant?{
      rashi:chart.ascendant.rashi,rashiIndex:chart.ascendant.rashiIndex,
      degreeInRashi:chart.ascendant.degreeInRashi,nakshatra:chart.ascendant.nakshatra,
      pada:chart.ascendant.pada,house:chart.ascendant.house
    }:null,
    houses:chart?.houses||undefined,
    planets:Object.fromEntries(Object.entries(chart?.planets||{}).map(([name,planet])=>[name,pickPlanet(planet)]))
  });
  const transit=source.gochar||source.transits||null;
  return stripPersonalFields({
    d1:pickChart(source.d1),
    d9:pickChart(source.d9),
    taraBala:source.currentTaraBala||null,
    mahadasha:md?{planet:md.planet,start:md.start,end:md.end}:{planet:current.mahadasha||null,start:current.mahadashaStart||null,end:current.mahadashaEnd||null},
    antardasha:ad?{planet:ad.planet,start:ad.start,end:ad.end}:{planet:current.antardasha||null,start:current.antardashaStart||null,end:current.antardashaEnd||null},
    dashaDates:{
      mahadashaStart:md?.start||current.mahadashaStart||null,
      mahadashaEnd:md?.end||current.mahadashaEnd||null,
      antardashaStart:ad?.start||current.antardashaStart||null,
      antardashaEnd:ad?.end||current.antardashaEnd||null
    },
    gochar:transit?{
      asOf:transit.asOf,natalMoonRashi:transit.natalMoonRashi,natalAscendantRashi:transit.natalAscendantRashi,
      planets:(transit.planets||[]).map(p=>({
        name:p.name,rashi:p.rashi,degreeInRashi:p.degreeInRashi,nakshatra:p.nakshatra,
        pada:p.pada,houseFromMoon:p.houseFromMoon,houseFromAscendant:p.houseFromAscendant,retrograde:p.retrograde
      }))
    }:null
  });
}

module.exports=async function(req,res,env={}){
  const geminiApiKey=runtimeApiKey(env);
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({success:false,message:"केवल POST अनुरोध स्वीकार है।"});}
  try{
    const body=req.body||{};
    const question=body.question||body.content;
    if(typeof question!=="string"||!question.trim())return res.status(400).json({success:false,message:"कृपया अपना प्रश्न लिखें।"});
    if(question.length>4000)return res.status(400).json({success:false,message:"प्रश्न 4000 अक्षरों से छोटा रखें।"});
    const forwarded=req.headers?.["x-forwarded-for"]||req.headers?.["x-real-ip"]||req.socket?.remoteAddress||"anonymous";
    const clientKey=String(forwarded).split(",")[0].trim().slice(0,100)||"anonymous";
    const now=Date.now(),last=recentRequests.get(clientKey)||0;
    if(now-last<3000)return res.status(429).json({success:false,message:"अगला प्रश्न भेजने से पहले कुछ सेकंड रुकें।"});
    recentRequests.set(clientKey,now);
    if(recentRequests.size>5000){for(const [key,time] of recentRequests){if(now-time>60000)recentRequests.delete(key);}}
    const liveChartContext=buildLiveAstrologyContext(body.chartContext, new Date());
    const chartContext=compactChartContext(liveChartContext);
    // Choose output language from the actual question: Devanagari and Hinglish are Hindi.
    const lowerQuestion=question.toLowerCase();
    const hinglishPattern=/\b(main|mai|mujhe|mera|meri|mere|hum|ham|aap|apka|apki|kab|kahan|kaha|kaise|kyu|kyun|kya|hai|hain|tha|thi|hoga|hogi|jaunga|jaungi|jaoge|milega|milega|batao|bataiye|kundli|shaadi|naukri|videsh|paisa|ghar|mera)\b/i;
    const hasDevanagari=/[\u0900-\u097F]/.test(question);
    const language=(hasDevanagari||hinglishPattern.test(lowerQuestion))?"hi":"en";
    const privateSafeQuestion=redactQuestion(question.trim(),body.chartContext);
    // gemini.js tries gemini-2.5-flash-lite, then gemini-2.0-flash, then discovers supported Flash models.
    const answer=await askGemini({question:privateSafeQuestion,chartContext,conversationHistory:[],language,apiKey:geminiApiKey,model:"gemini-2.5-flash-lite",signal:req.signal});
    return res.status(200).json({success:true,answer,identity:"Astro vidhata AI"});
  }catch(error){
    const message=String(error?.message||"Consultation failed");
    console.error("Consultation API error:",message);
    if(!geminiApiKey){
      return res.status(503).json({success:false,message:"Gemini API key Cloudflare Worker binding में उपलब्ध नहीं है।"});
    }
    if(/GEMINI_API_KEY/.test(message)){
      return res.status(503).json({success:false,message:"Gemini API key उपलब्ध नहीं है या अमान्य है।"});
    }
    if(/quota|rate.?limit|resource.?exhausted/i.test(message)){
      return res.status(429).json({success:false,message:"AI सेवा की अनुरोध सीमा पूरी हुई है। थोड़ी देर बाद पुनः प्रयास करें।"});
    }
    return res.status(502).json({success:false,message});
  }
};
