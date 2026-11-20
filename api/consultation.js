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
  const pd=(ad?.pratyantardashas||[]).find(x=>x.planet===current.pratyantardasha);
  return stripPersonalFields({
    // Only calculated astrology data is sent to the answer engine.
    d1:source.d1||null,
    d9:source.d9||null,
    planets:source.planets||source.d1?.planets||{},
    shadbala:source.shadbala||null,
    shadbalaMethod:source.shadbalaMethod||null,
    ashtakavarga:source.ashtakavarga||null,
    vargas:source.vargas||{},
    relationships:source.relationships||{},
    specialLagnas:source.specialLagnas||{},
    kharaPoints:source.kharaPoints||{},
    argala:source.argala||null,
    drishti:source.drishti||null,
    gochar:source.gochar||source.transits||null,
    dasha:{
      birthMoon:d.birthMoon||{},
      startingMahadasha:d.startingMahadasha||null,
      balanceAtBirthYears:d.balanceAtBirthYears||null,
      current,
      currentMahadasha:md?{planet:md.planet,start:md.start,end:md.end}:null,
      currentAntardasha:ad?{planet:ad.planet,start:ad.start,end:ad.end}:null,
      currentPratyantardasha:pd?{planet:pd.planet,start:pd.start,end:pd.end}:null,
      currentMahadashaAntardashas:(md?.antardashas||[]).map(x=>({planet:x.planet,start:x.start,end:x.end})),
      currentAntardashaPratyantardashas:(ad?.pratyantardashas||[]).map(x=>({planet:x.planet,start:x.start,end:x.end}))
    },
    taraChart:source.taraChart||[],
    currentTaraBala:source.currentTaraBala||null
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
    const history=Array.isArray(body.conversationHistory)?body.conversationHistory.slice(-10):[];
    const supportedLanguages=new Set(["en","en-CA","hi","mr","pa","ur","fr","fr-CA","de","es","pt","pt-BR","ar","ar-SA","bn","gu","ta","te","kn","ml","or","as"]);
    const language=supportedLanguages.has(body.language)?body.language:"en";
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
