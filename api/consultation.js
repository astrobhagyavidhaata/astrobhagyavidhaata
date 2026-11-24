"use strict";

const {askGemini}=require("../lib/gemini");
const {buildLiveAstrologyContext}=require("../lib/consultation-context");
const {getProfileSpecificSeparationAnswer,getProfilePersonalityReference,getProfileHusbandWorkAnswer,getProfileDivorceAnswer, getProfileNatureAnswer, getProfileHabitsAnswer, getProfileOccultAnswer, getProfileDreamsAnswer, getProfileExternalWomanAnswer, getProfileAngerHealthAnswer, getProfileHiddenMoneyAnswer, areProfilePredictionsLocked}=require("../lib/relationship-reference");
const {getProfileDashaPrediction}=require("../lib/profile-dasha-predictions");
const {getProfileGocharPrediction,getProfileParentsPrediction}=require("../lib/profile-gochar-predictions");
const {getProfileParentsAnswer}=require("../lib/profile-parents-1987");
const {getProfileParents1997Answer}=require("../lib/profile-parents-1997");
const {getProfileCareer1997Answer}=require("../lib/profile-career-1997");
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
    // Birth date is intentionally passed as astrology input; other direct identifiers stay redacted.
    birthDateForAstrology: source.birth?.localDate || null,
    calculation: source.calculation || null,
    ashtakavarga: source.ashtakavarga || null,
    advancedAstrology: source.advancedAstrology || null,
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
      accuracyNote:transit.accuracyNote,signPeriods:transit.signPeriods||null,natalMoonRashi:transit.natalMoonRashi,natalAscendantRashi:transit.natalAscendantRashi,
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
    const wantsDetailedMoonTransit = /विस्तृत.*(?:चंद्र|चन्द्र).*गोचर|चंद्र.*गोचर.*रिपोर्ट|चन्द्र.*गोचर.*रिपोर्ट|detailed.*moon.*transit|moon.*transit.*report/i.test(question);
    const liveChartContext=buildLiveAstrologyContext(body.chartContext, new Date(), {includeTransitDates:wantsDetailedMoonTransit});
    const chartContext=compactChartContext(liveChartContext);
    // Apply the requested relationship-focused interpretation only to this exact birth profile.
    // The chart's calculated placements remain authoritative; this does not force a reconciliation outcome.
    const birthProfile=liveChartContext?.birth||{};
    // Resolve the protected profile from every supported request shape. The Worker
    // independently computes _wifeChartProfileMatched from the submitted birth data.
    const fallbackBirth=body.birthData||body.birthDetails||body.chartContext?.birth||body.chartContext?.birthDetails||body.chartContext||{};
    const birthDate=String(birthProfile.localDate||birthProfile.date||fallbackBirth.localDate||fallbackBirth.birthDate||fallbackBirth.date||body.chartContext?.birthDate||"").trim();
    const placeText=[
      birthProfile.place,birthProfile.name,birthProfile.label,
      fallbackBirth.place,fallbackBirth.birthPlace,fallbackBirth.location,
      body.chartContext?.birthPlace?.name,body.chartContext?.birthPlace?.label
    ].filter(Boolean).join(" ").normalize("NFKC").toLowerCase();
    const latitude=Number(birthProfile.latitude??fallbackBirth.latitude??fallbackBirth.lat??body.chartContext?.birthPlace?.latitude);
    const longitude=Number(birthProfile.longitude??fallbackBirth.longitude??fallbackBirth.lon??fallbackBirth.lng??body.chartContext?.birthPlace?.longitude);
    const isAmravatiByCoordinates=Number.isFinite(latitude)&&Number.isFinite(longitude)&&
      Math.abs(latitude-20.9)<=0.15&&Math.abs(longitude-77.7)<=0.15;
    const rawBirthTime=String(birthProfile.localTime||birthProfile.time||fallbackBirth.localTime||fallbackBirth.birthTime||fallbackBirth.timeOfBirth||fallbackBirth.time||body.chartContext?.birthTime||"").trim().toLowerCase();
    const timeMatch=rawBirthTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/);
    let normalizedBirthTime=null;
    if(timeMatch){
      let hour=Number(timeMatch[1]);
      const minute=Number(timeMatch[2]);
      if(timeMatch[3]==="pm"&&hour<12)hour+=12;
      if(timeMatch[3]==="am"&&hour===12)hour=0;
      if(hour>=0&&hour<=23&&minute>=0&&minute<=59)normalizedBirthTime=String(hour).padStart(2,"0")+":"+String(minute).padStart(2,"0");
    }
    // The protected archive is keyed to birth date, time and place, not gender metadata.
    const normalizedBirthDate = (() => {
      const value = birthDate.normalize("NFKC").trim();
      let match = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|T)/);
      if (match) return match[1] + "-" + String(Number(match[2])).padStart(2,"0") + "-" + String(Number(match[3])).padStart(2,"0");
      match = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (match) return match[3] + "-" + String(Number(match[2])).padStart(2,"0") + "-" + String(Number(match[1])).padStart(2,"0");
      return "";
    })();
    const parents1987ProfileFocus = body._parents1987ProfileMatched === true;
    const specialProfileFocus = parents1987ProfileFocus || body._wifeChartProfileMatched === true ||
      body.lockedProfileRule === "TULA_1997_03_10_AMRAVATI" ||
      (normalizedBirthDate === "1997-03-10" &&
      normalizedBirthTime === "21:15" &&
      (placeText.includes("amravati") || placeText.includes("अमरावती") || isAmravatiByCoordinates));
    // Speech-to-text sometimes converts "divorce" to "device". Treat it as
    // divorce intent only when the same question is explicitly about the husband.
    const divorceIntent = (
      /छोड़|छोड|अलग|तलाक|डाइवोर्स|बदनामी|बदनाम|प्रतिष्ठा|अपमान|हंस रहे|हँस रहे|separat|divorc|devorc|divors|devors|device|break.?up|leave|end relationship|badnaam|badnami|reputation|insult|alag|chhod|chod|separate hona|alag hona|alag rehna|alag rahna|talaq|divorce lena/i.test(question) ||
      /\b(?:se|to)\s+(?:leave|separate|divorce)|\b(?:lena|len[a-z]*)\s+chahti|\b(?:chahti|chahta)\s+hun/i.test(question)
    ) && /पति|पती|\bpati\b|\bpatidev\b|partner|पार्टनर|जीवनसाथी|husband|spouse|marriage|विवाह|शादी|relationship/i.test(question);
    const specialRelationshipFocus = specialProfileFocus && divorceIntent;
    // Never return a stored prediction verbatim; all questions are answered dynamically from relevant retrieved notes and the live chart.
    // The excluded profile keeps its separate reference path; do not attach the new global calculation framework.
    if (specialProfileFocus) { chartContext.advancedAstrology = null; if (chartContext.gochar) chartContext.gochar.signPeriods = null; }
    const personName=String(liveChartContext?.name || body.chartContext?.name || "").trim().slice(0,100);
    // Choose output language from the actual question: Devanagari and Hinglish are Hindi.
    const lowerQuestion=question.toLowerCase();
    const hinglishPattern=/\b(main|mai|mujhe|mera|meri|mere|hum|ham|aap|apka|apki|kab|kahan|kaha|kaise|kyu|kyun|kya|hai|hain|tha|thi|hoga|hogi|jaunga|jaungi|jaoge|milega|batao|bataiye|kundli|shaadi|naukri|videsh|paisa|ghar|)\b/i;
    const hasDevanagari=/[\u0900-\u097F]/.test(question);
    const selectedLanguage=String(body.language||"").toLowerCase().split("-")[0];
    const language=selectedLanguage==="hi"?"hi":selectedLanguage==="en"?"en":((hasDevanagari||hinglishPattern.test(lowerQuestion))?"hi":"en");
    // Owner-only override: the credential is verified by hash on the server; never store the plaintext in source.
    const ownerPasswordHash=String(env?.ASTRO_OWNER_PASSWORD_SHA256||"");
    const suppliedQuestion=question.trim();
    const firstLine=suppliedQuestion.split(/\r?\n/,1)[0].replace(/^(?:owner|मालिक)\s*[:：-]\s*/i,"").trim();
    const remainingQuestion=suppliedQuestion.includes("\n")?suppliedQuestion.slice(suppliedQuestion.indexOf("\n")+1).trim():"";
    const suppliedHash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(firstLine))),b=>b.toString(16).padStart(2,"0")).join("");
    const ownerAuthorized=firstLine.length>0 && suppliedHash===ownerPasswordHash;
    const safeOriginalQuestion=ownerAuthorized?remainingQuestion:suppliedQuestion;
    const ownerInstruction=ownerAuthorized?remainingQuestion:"";
    const privateSafeQuestion=redactQuestion(safeOriginalQuestion,body.chartContext);
    // The owner can later reopen this profile by changing the single lock switch; no archived paragraph is deleted.
    if (specialProfileFocus && areProfilePredictionsLocked() && !ownerAuthorized) {
      return res.status(200).json({
        success: true,
        answer: "यह जन्म कुंडली फिलहाल मालिक द्वारा लॉक की गई है। इस कुंडली की भविष्यवाणियाँ अभी उपलब्ध नहीं हैं।",
        identity: "Astro vidhata AI",
        predictionLocked: true,
        predictionSource: "owner-profile-access-lock",
        sanitizedQuestion: ""
      });
    }
    // HARD LOCK: this exact birth profile may receive ONLY owner-authored text.
    // Dasha records are returned verbatim from the dedicated archive; relationship
    // separation questions use the owner's saved answer. Never fall through to Gemini.
    if (specialProfileFocus) {
      // The 10-Mar-1987 profile has its own parent/maternal-family archive.
      // Do not route it through the separate 1997 relationship/dasha archive.
      if (!parents1987ProfileFocus) {
        const ownerParents1997Answer = getProfileParents1997Answer(true, question);
        if (ownerParents1997Answer) {
          return res.status(200).json({
            success: true,
            answer: ownerParents1997Answer,
            identity: "Astro vidhata AI",
            ownerAuthorized,
            predictionSource: "owner-locked-parents-1997-verbatim",
            predictionLocked: true,
            sanitizedQuestion: privateSafeQuestion
          });
        }
      }
      if (parents1987ProfileFocus) {
        const ownerParentsAnswer = getProfileParentsAnswer(true, question);
        if (!ownerParentsAnswer) {
          return res.status(200).json({
            success: true,
            answer: "इस जन्म-कुंडली के लिए अभी माता-पिता और मायके के परिवार से संबंधित मालिक द्वारा दिया गया विश्लेषण उपलब्ध है।",
            identity: "Astro vidhata AI",
            predictionLocked: true,
            predictionSource: "owner-profile-topic-not-archived",
            sanitizedQuestion: privateSafeQuestion
          });
        }
        const answer = await askGemini({
          question: privateSafeQuestion,
          personName,
          ownerAuthoredSource: ownerParentsAnswer,
          specialProfileFocus: true,
          chartContext,
          conversationHistory: [],
          language,
          apiKey: geminiApiKey,
          model: "gemini-3.8-flash",
          signal: req.signal
        });
        return res.status(200).json({
          success: true,
          answer,
          identity: "Astro vidhata AI",
          ownerAuthorized,
          predictionSource: "owner-authored-parents-1987",
          predictionLocked: true,
          sanitizedQuestion: privateSafeQuestion
        });
      }
      // Career/work questions for the protected 1997 profile return the owner's
      // complete saved career analysis verbatim, before other broad topic matchers.
      const ownerCareerDirectAnswer = getProfileCareer1997Answer(specialProfileFocus && !parents1987ProfileFocus, question);
      if (ownerCareerDirectAnswer) {
        return res.status(200).json({
          success: true,
          answer: ownerCareerDirectAnswer,
          identity: "Astro vidhata AI",
          ownerAuthorized,
          predictionSource: "owner-locked-career-verbatim",
          predictionLocked: true,
          sanitizedQuestion: privateSafeQuestion
        });
      }
      // Nature questions for the protected 1997 profile bypass broad topic/dasha/gochar
      // matchers and return the owner's exact saved text before any Gemini fallback.
      const ownerNatureDirectAnswer = getProfileNatureAnswer(true, question);
      if (ownerNatureDirectAnswer) {
        return res.status(200).json({
          success: true,
          answer: ownerNatureDirectAnswer,
          identity: "Astro vidhata AI",
          ownerAuthorized,
          predictionSource: "owner-locked-nature-verbatim",
          predictionLocked: true,
          sanitizedQuestion: privateSafeQuestion
        });
      }
      // The same historical hard lock applies to marriage, husband/partner,
      // and explicit separation questions. Return the saved full D1/D9 analysis
      // before broad dasha/gochar matchers can execute or Gemini can be called.
      // Exact archived Mahadasha/Antardasha readings must win before relationship
      // intent matchers, so a dasha question cannot be hijacked by the divorce answer.
      const ownerDashaDirectAnswer = getProfileDashaPrediction(specialProfileFocus, question, personName);
      if (ownerDashaDirectAnswer) {
        return res.status(200).json({
          success: true,
          answer: ownerDashaDirectAnswer,
          identity: "Astro vidhata AI",
          ownerAuthorized,
          predictionSource: "owner-locked-dasha-verbatim",
          predictionLocked: true,
          sanitizedQuestion: privateSafeQuestion
        });
      }
      // Exact saved divorce conclusion takes priority for the protected Amravati birth profile.
      const ownerDivorceDirectAnswer = getProfileDivorceAnswer(specialProfileFocus, question);
      if (ownerDivorceDirectAnswer) {
        return res.status(200).json({
          success: true,
          answer: ownerDivorceDirectAnswer,
          identity: "Astro vidhata AI",
          ownerAuthorized,
          predictionSource: "owner-locked-divorce-verbatim",
          predictionLocked: true,
          sanitizedQuestion: privateSafeQuestion
        });
      }
      const lockedMarriageIntent = /पति|पती|पत्नी|जीवनसाथी|पार्टनर|(?:^|[^a-z])(?:pati|patidev|husband|wife|spouse|partner)(?:$|[^a-z])|विवाह|शादी|वैवाहिक|marriage|marital|married life|relationship|रिश्ता|तलाक|डाइवोर्स|डिवोर्स|अलगाव|separation|divorc|break.?up/i.test(question) &&
        !/काम|नौकरी|व्यवसाय|करियर|career|\bjob\b|\bwork\b|profession|business|पेशा/i.test(question);
      if (lockedMarriageIntent) {
        // Use the canonical explicit separation wording to retrieve the full
        // saved marriage conclusion even when the customer asks only "married life"
        // or "what is my husband like?".
        const ownerMarriageDirectAnswer = getProfileSpecificSeparationAnswer("क्या मैं अपने पति को छोड़ सकती हूं या तलाक ले सकती हूं?");
        if (ownerMarriageDirectAnswer) {
          return res.status(200).json({
            success: true,
            answer: ownerMarriageDirectAnswer,
            identity: "Astro vidhata AI",
            ownerAuthorized,
            predictionSource: "owner-locked-relationship-verbatim",
            predictionLocked: true,
            sanitizedQuestion: privateSafeQuestion
          });
        }
      }
      // Direct husband/marriage and divorce questions must bypass broad transit/dasha
      // matchers. These exact owner-authored archives are returned without Gemini.
      const ownerSeparationDirectAnswer = divorceIntent
        ? getProfileSpecificSeparationAnswer(question)
        : "";
      if (ownerSeparationDirectAnswer) {
        return res.status(200).json({
          success: true,
          answer: ownerSeparationDirectAnswer,
          identity: "Astro vidhata AI",
          ownerAuthorized,
          predictionSource: "owner-locked-separation-verbatim",
          predictionLocked: true,
          sanitizedQuestion: privateSafeQuestion
        });
      }
      // An unrelated question must not be sent to Gemini for this profile.
      // It may proceed only if it belongs to one of the explicitly archived topics.
      const hasArchivedTopicIntent = /नेचर|स्वभाव|व्यक्तित्व|nature|personality|आदत|habits?|तंत्र|मंत्र|occult|dream|सपना|स्वप्न|माँ|मां|माता|पिता|परिवार|भाई|बहन|parents|family|health|स्वास्थ्य|बीमारी|गुस्सा|क्रोध|anger|hidden.?money|छुपे? पैसे|गहने|धन|गोचर|transit|शनि|राहु|केतु|दशा|महादशा|अंतर्दशा|antar.?dasha|dasha|पति|पती|pati|husband|पत्नी|जीवनसाथी|partner|विवाह|शादी|marriage|relationship|तलाक|divorce|separation/i.test(question);
      if (!hasArchivedTopicIntent) {
        return res.status(200).json({
          success: true,
          answer: "इस विशेष जन्म-कुंडली के लिए आपके पूछे गए इस विषय का मालिक द्वारा लिखा हुआ विश्लेषण अभी संग्रह में उपलब्ध नहीं है। इसलिए कोई नया या अनुमानित उत्तर नहीं दिया जाएगा।",
          identity: "Astro vidhata AI",
          ownerAuthorized,
          predictionSource: "owner-profile-no-gemini-fallback",
          predictionLocked: true,
          sanitizedQuestion: privateSafeQuestion
        });
      }
      // Dasha questions have their own single-paragraph authored answer and must
      // be checked before topic/personality matching.
      // Gochar/sibling/father transit text must be matched before dasha's broad planet-name matcher.
      const ownerParentsAnswer = getProfileParentsPrediction(true, question);
      const ownerDreamsAnswer = !ownerParentsAnswer ? getProfileDreamsAnswer(true, question) : "";
      const ownerExternalWomanAnswer = !ownerParentsAnswer && !ownerDreamsAnswer ? getProfileExternalWomanAnswer(true, question) : "";
      const ownerAngerHealthAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer ? getProfileAngerHealthAnswer(true, question) : "";
      const ownerHiddenMoneyAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer ? getProfileHiddenMoneyAnswer(true, question) : "";
      const ownerGocharAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer && !ownerHiddenMoneyAnswer ? getProfileGocharPrediction(true, question) : "";
      const ownerDashaAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer && !ownerHiddenMoneyAnswer && !ownerGocharAnswer ? getProfileDashaPrediction(true, question, personName) : "";
      const priorUserQuestions = Array.isArray(body.conversationHistory)
        ? body.conversationHistory.filter(item => item?.role === "user" || item?.role === "human").map(item => String(item?.content || ""))
        : [];
      const lastPriorUserQuestion = priorUserQuestions.at(-1) || "";
      const isNatureFollowUp = /^(?:और|aur|और भी|aur bhi|इसको|isko|इसे|ise|थोड़ा|thoda|ज्यादा|zyada|detail|विस्तार|aur detail|aur gahrai|और गहराई|और विस्तार|समझाओ|samjhao|बताओ|batao)/i.test(question.trim()) &&
        /नेचर|स्वभाव|व्यक्तित्व|nature|personality|mera nature|meri nature|main kaisi|main kaisa|mera swabhav/i.test(lastPriorUserQuestion);
      const natureQuestion = isNatureFollowUp ? lastPriorUserQuestion : question;
      const ownerOccultAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer && !ownerHiddenMoneyAnswer && !ownerGocharAnswer && !ownerDashaAnswer ? getProfileOccultAnswer(true, question) : "";
      const ownerHabitsAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer && !ownerHiddenMoneyAnswer && !ownerGocharAnswer && !ownerDashaAnswer && !ownerOccultAnswer ? getProfileHabitsAnswer(true, question) : "";
      const ownerNatureAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer && !ownerHiddenMoneyAnswer && !ownerGocharAnswer && !ownerDashaAnswer && !ownerOccultAnswer && !ownerHabitsAnswer ? getProfileNatureAnswer(true, natureQuestion) : "";
      // Restore the original exact-profile marriage lock: all husband/partner/
      // marriage-life questions use the saved no-separation analysis verbatim.
      // Career/work questions retain their separate owner-authored husband-work answer.
      const marriageIntent = lockedMarriageIntent;
      const ownerRelationshipAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer && !ownerHiddenMoneyAnswer && !ownerGocharAnswer && !ownerDashaAnswer && !ownerOccultAnswer && !ownerHabitsAnswer && !ownerNatureAnswer && marriageIntent
        ? getProfileSpecificSeparationAnswer(question)
        : "";
      const ownerHusbandWorkAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer && !ownerHiddenMoneyAnswer && !ownerGocharAnswer && !ownerDashaAnswer && !ownerOccultAnswer && !ownerHabitsAnswer && !ownerNatureAnswer && !ownerRelationshipAnswer ? getProfileHusbandWorkAnswer(true, question) : "";
      const ownerPersonalityAnswer = !ownerParentsAnswer && !ownerDreamsAnswer && !ownerExternalWomanAnswer && !ownerAngerHealthAnswer && !ownerHiddenMoneyAnswer && !ownerGocharAnswer && !ownerDashaAnswer && !ownerOccultAnswer && !ownerHabitsAnswer && !ownerNatureAnswer && !ownerRelationshipAnswer && !ownerHusbandWorkAnswer
        ? getProfilePersonalityReference(true, question)
        : "";
      const ownerAuthoredAnswer = ownerParentsAnswer || ownerDreamsAnswer || ownerExternalWomanAnswer || ownerAngerHealthAnswer || ownerHiddenMoneyAnswer || ownerGocharAnswer || ownerDashaAnswer || ownerOccultAnswer || ownerHabitsAnswer || ownerNatureAnswer || ownerHusbandWorkAnswer || ownerRelationshipAnswer || ownerPersonalityAnswer;
      console.info("[PROFILE_PRIORITY] source=owner_archive; owner_answer_found=" + Boolean(ownerAuthoredAnswer) + "; gemini_fallback=" + !ownerAuthoredAnswer + "; type=" + (ownerParentsAnswer ? "parents-family" : ownerDreamsAnswer ? "dreams" : ownerExternalWomanAnswer ? "external-woman" : ownerAngerHealthAnswer ? "anger-health" : ownerHiddenMoneyAnswer ? "hidden-money" : ownerGocharAnswer ? "gochar" : ownerDashaAnswer ? "dasha" : ownerOccultAnswer ? "occult" : ownerHabitsAnswer ? "habits" : ownerNatureAnswer ? "nature" : ownerHusbandWorkAnswer ? "husband-work" : ownerRelationshipAnswer ? "relationship" : ownerPersonalityAnswer ? "topic" : "unmapped"));
      // STRICT OWNER ARCHIVE LOCK:
      // For this exact birth profile Gemini is never allowed to invent, replace,
      // paraphrase, expand, or generate chart interpretations. Return only the
      // exact owner-authored archive text. If no matching archive exists, say so.
      if (ownerAuthoredAnswer) {
        const answer = ownerAuthoredAnswer;
        return res.status(200).json({
          success: true,
          answer,
          identity: "Astro vidhata AI",
          ownerAuthorized,
          predictionSource: ownerNatureAnswer ? "owner-locked-nature-verbatim" :
            ownerDashaAnswer ? "owner-locked-dasha-verbatim" :
            ownerRelationshipAnswer ? "owner-locked-relationship-verbatim" : "owner-authored-verbatim",
          predictionLocked: true,
          sanitizedQuestion: privateSafeQuestion
        });
      }
      return res.status(200).json({
        success: true,
        answer: "इस विशेष जन्म-कुंडली के लिए आपके पूछे गए इस विषय का मालिक द्वारा लिखा हुआ विश्लेषण अभी संग्रह में उपलब्ध नहीं है। इसलिए इस कुंडली के लिए कोई नया या अनुमानित उत्तर नहीं दिया जाएगा।",
        identity: "Astro vidhata AI",
        ownerAuthorized,
        predictionSource: "owner-profile-no-gemini-fallback",
        predictionLocked: true,
        sanitizedQuestion: privateSafeQuestion
      });
    }
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
    const answer=await askGemini({question:privateSafeQuestion,personName,ownerInstruction:ownerAuthorized?ownerInstruction:"",specialRelationshipFocus,specialProfileFocus,chartContext,conversationHistory,language,apiKey:geminiApiKey,model:"gemini-3.8-flash",signal:req.signal});
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
