"use strict";

const {askGemini}=require("../lib/gemini");
const {buildLiveAstrologyContext}=require("../lib/consultation-context");
const runtimeApiKey=env=>env?.GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "") || "";

const PRIVATE_FIELD_KEYS = new Set([
  "name", "fullname", "email", "phone", "mobile", "birthplace", "place",
  "address", "latitude", "lat", "lon", "coordinates",
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
  // Only redact common phone formats; do not mistake dates or date/time strings for numbers.
  clean=clean.replace(/\\+?\\d[\\d\\s().-]{7,}\\d/g,match=>{
    const compact=match.replace(/[\\s().-]/g,"");
    const indianMobile=/^(?:\\+?91)?[6-9]\\d{9}$/.test(compact);
    const groupedMobile=/^(?:\\+?91)?[6-9]\\d{4}[\\s-]?[6-9]\\d{4}$/.test(match.trim());
    const internationalMobile=/^\\+\\d{10,14}$/.test(compact);
    return indianMobile||groupedMobile||internationalMobile ? "[निजी नंबर हटाया गया]" : match;
  });
  return clean;
}

function compactChartContext(source){
  if(!source||typeof source!=="object"||Array.isArray(source))return {};
  const d=source.dasha||{},current=d.current||{};
  const md=(d.mahadashas||[]).find(x=>x.planet===current.mahadasha);
  const ad=(md?.antardashas||[]).find(x=>x.planet===current.antardasha);
  const pd=(ad?.pratyantardashas||[]).find(x=>x.planet===current.pratyantardasha);
  const pickPlanet=(planet)=>({
    rashi:planet?.rashi,rashiIndex:planet?.rashiIndex,longitude:planet?.longitude,
    degreeInRashi:planet?.degreeInRashi,nakshatra:planet?.nakshatra,pada:planet?.pada,
    house:planet?.house,retrograde:planet?.retrograde,navamsa:planet?.navamsa,
    aspects:planet?.aspects,dignity:planet?.dignity
  });
  const numericDate=(value)=>{if(!value)return null;const date=new Date(value);return Number.isFinite(date.getTime())?`${String(date.getUTCDate()).padStart(2,"0")}-${String(date.getUTCMonth()+1).padStart(2,"0")}-${date.getUTCFullYear()}`:String(value)};
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
    gender: source.gender || null,
    calculation: source.calculation || null,
    d1:pickChart(source.d1),
    d9:pickChart(source.d9),
    natalPlanetaryPositions: Object.fromEntries(Object.entries(source.d1?.planets||{}).map(([name,planet])=>[name,pickPlanet(planet)])),
    birthNakshatra: d.birthMoon || null,
    taraChart: source.taraChart || null,
    taraBala:source.currentTaraBala||null,
    mahadasha:md?{planet:md.planet,start:numericDate(md.start),end:numericDate(md.end)}:{planet:current.mahadasha||null,start:numericDate(current.mahadashaStart),end:numericDate(current.mahadashaEnd)},
    antardasha:ad?{planet:ad.planet,start:numericDate(ad.start),end:numericDate(ad.end)}:{planet:current.antardasha||null,start:numericDate(current.antardashaStart),end:numericDate(current.antardashaEnd)},
    pratyantardasha:pd?{planet:pd.planet,start:numericDate(pd.start),end:numericDate(pd.end)}:{planet:current.pratyantardasha||null,start:numericDate(current.pratyantardashaStart),end:numericDate(current.pratyantardashaEnd)},
    vimshottariCurrent:{
      mahadasha:current.mahadasha||null,antardasha:current.antardasha||null,pratyantardasha:current.pratyantardasha||null,
      mahadashaStart:numericDate(current.mahadashaStart),mahadashaEnd:numericDate(current.mahadashaEnd),
      antardashaStart:numericDate(current.antardashaStart),antardashaEnd:numericDate(current.antardashaEnd),
      pratyantardashaStart:numericDate(current.pratyantardashaStart),pratyantardashaEnd:numericDate(current.pratyantardashaEnd)
    },
    currentTaraBalaByPlanet:source.currentTaraBalaByPlanet||null,
    dashaDates:{
      mahadashaStart:numericDate(md?.start||current.mahadashaStart),
      mahadashaEnd:numericDate(md?.end||current.mahadashaEnd),
      antardashaStart:numericDate(ad?.start||current.antardashaStart),
      antardashaEnd:numericDate(ad?.end||current.antardashaEnd),
      pratyantardashaStart:numericDate(pd?.start||current.pratyantardashaStart),
      pratyantardashaEnd:numericDate(pd?.end||current.pratyantardashaEnd)
    },
    gochar:transit?{
      asOf:transit.asOf,ayanamsa:transit.ayanamsa,houseSystem:transit.houseSystem,
      accuracyNote:transit.accuracyNote,natalMoonRashi:transit.natalMoonRashi,natalAscendantRashi:transit.natalAscendantRashi,
      planets:(transit.planets||[]).map(p=>({
        name:p.name,longitude:p.longitude,rashi:p.rashi,rashiIndex:p.rashiIndex,degreeInRashi:p.degreeInRashi,
        nakshatra:p.nakshatra,pada:p.pada,navamsa:p.navamsa,houseFromMoon:p.houseFromMoon,houseFromAscendant:p.houseFromAscendant,retrograde:p.retrograde,taraBala:p.taraBala
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
    const liveChartContext=buildLiveAstrologyContext(body.chartContext, new Date());
    const chartContext=compactChartContext(liveChartContext);
    // Choose output language from the actual question: Devanagari and Hinglish are Hindi.
    const lowerQuestion=question.toLowerCase();
    const hinglishPattern=/\b(main|mai|mujhe|mera|meri|mere|hum|ham|aap|apka|apki|kab|kahan|kaha|kaise|kyu|kyun|kya|hai|hain|tha|thi|hoga|hogi|jaunga|jaungi|jaoge|milega|batao|bataiye|kundli|shaadi|naukri|videsh|paisa|ghar|)\b/i;
    const hasDevanagari=/[\u0900-\u097F]/.test(question);
    const selectedLanguage=String(body.language||"").toLowerCase().split("-")[0];
    const language=selectedLanguage==="hi"?"hi":selectedLanguage==="en"?"en":((hasDevanagari||hinglishPattern.test(lowerQuestion))?"hi":"en");
    // Owner-only override: the credential is verified by hash on the server; never store the plaintext in source.
    const ownerPasswordHash="2b5c3317a71a166ba40ac789cfbd246c7ea51ac1db6a603181edebc5738c788a";
    const suppliedQuestion=question.trim();
    const firstLine=suppliedQuestion.split(/\r?\n/,1)[0].replace(/^(?:owner|मालिक)\s*[:：-]\s*/i,"").trim();
    const remainingQuestion=suppliedQuestion.includes("\n")?suppliedQuestion.slice(suppliedQuestion.indexOf("\n")+1).trim():"";
    const suppliedHash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(firstLine))),b=>b.toString(16).padStart(2,"0")).join("");
    const ownerAuthorized=firstLine.length>0 && suppliedHash===ownerPasswordHash;
    const safeOriginalQuestion=ownerAuthorized?remainingQuestion:suppliedQuestion;
    const ownerInstruction=ownerAuthorized?remainingQuestion:"";
    const privateSafeQuestion=redactQuestion(safeOriginalQuestion,body.chartContext);
    if(ownerAuthorized && !privateSafeQuestion){
      return res.status(200).json({success:true,answer:"Owner Mode प्रमाणित है। अब अगली पंक्ति में अपना निर्देश और जिस प्रश्न की भविष्यवाणी बदलनी है, उसे लिखें।",identity:"Astro vidhata AI",ownerAuthorized:true,sanitizedQuestion:""});
    }
    const conversationHistory=Array.isArray(body.conversationHistory)
      ? body.conversationHistory.slice(-12).map(item=>({
          role:item?.role==="assistant"||item?.role==="model"?"assistant":"user",
          content:redactQuestion(String(item?.content||"").slice(0,2500),body.chartContext)
        })).filter(item=>item.content.trim())
      : [];
    // Use Gemini 3.8 Flash for chart-based reasoning; keep a bounded recent dialogue for follow-ups.
    const answer=await askGemini({question:privateSafeQuestion,ownerInstruction:ownerAuthorized?ownerInstruction:"",chartContext,conversationHistory,language,apiKey:geminiApiKey,model:"gemini-3.8-flash",signal:req.signal});
    return res.status(200).json({success:true,answer,identity:"Astro vidhata AI",ownerAuthorized,sanitizedQuestion:privateSafeQuestion});
  }catch(error){
    const message=String(error?.message||"Consultation failed");
    console.error("Consultation API error:",message);
    if(!geminiApiKey){
      return res.status(503).json({success:false,message:"Gemini API key Cloudflare Worker binding में उपलब्ध नहीं है।"});
    }
    if(/GEMINI_API_KEY/.test(message)){
      return res.status(503).json({success:false,message:"Gemini API key उपलब्ध नहीं है या अमान्य है।"});
    }
    if(error?.status===429||error?.status===503||/quota|rate.?limit|resource.?exhausted|high demand|overload|temporarily unavailable|HTTP 503|HTTP 429|too many requests|timed?\s*out|timeout|fetch failed|network|socket|ECONN/i.test(message)){
      return res.status(503).json({success:false,retryable:true,retryAfterSeconds:3,message:"AI सेवा पर अभी अधिक भार है। सिस्टम अपने आप दोबारा प्रयास करेगा।"});
    }
    if(error?.status===400||error?.status===401||error?.status===403||/API_KEY_INVALID|invalid api key|API key not valid|permission denied|billing/i.test(message)){
      return res.status(502).json({success:false,retryable:false,message:"AI API की सेटिंग या अनुमति में समस्या है। प्रशासक को API key और billing जाँचनी होगी।"});
    }
    return res.status(502).json({success:false,retryable:false,message:"AI अनुरोध में स्थायी तकनीकी त्रुटि है।"});
  }
};
