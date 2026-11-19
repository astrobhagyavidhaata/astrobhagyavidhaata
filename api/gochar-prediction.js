"use strict";

const { askGemini } = require("../lib/gemini");
const { getAuthenticatedUser, activeConsultation } = require("../lib/supabase");
const { buildGocharSynthesis } = require("../lib/gochar-synthesis");

const windows = new Map();
function sameOrigin(req) {
  const origin=req.headers.origin;
  if(!origin)return true;
  try{return new URL(origin).host===req.headers.host;}catch(_){return false;}
}
function allowRate(req) {
  const ip=String(req.headers["cf-connecting-ip"]||req.headers["x-forwarded-for"]||"unknown").split(",")[0].trim();
  const now=Date.now(),recent=(windows.get(ip)||[]).filter(t=>now-t<60000);
  if(recent.length>=5)return false;
  recent.push(now);if(windows.size>10000)windows.clear();windows.set(ip,recent);return true;
}
function cleanTransit(p) {
  if(!p||typeof p!=="object")return null;
  const house=value=>value!=null&&Number.isInteger(Number(value))&&Number(value)>=1&&Number(value)<=12?Number(value):null;
  return {
    name:String(p.name||"").slice(0,20),
    longitude:Number(p.longitude),
    degree:String(p.degree?.text||"").slice(0,30),
    rashi:String(p.rashi||"").slice(0,30),
    nakshatra:String(p.nakshatra||"").slice(0,40),
    nakshatraIndex:Number(p.nakshatraIndex),
    pada:Number(p.pada),
    lagnaHouse:house(p.lagnaHouse),
    moonHouse:house(p.moonHouse),
    retrograde:Boolean(p.retrograde),combust:Boolean(p.combust),
    state:String(p.state||"").slice(0,40)
  };
}
function cleanBirthChart(chart) {
  if(!chart||typeof chart!=="object"||!chart.d1||!chart.d1.ascendant||!chart.d1.planets)return null;
  const planets={};
  for(const name of ["सूर्य","चंद्र","मंगल","बुध","गुरु","शुक्र","शनि","राहु","केतु"]){
    const p=chart.d1.planets[name];
    if(!p)continue;
    planets[name]={
      rashi:String(p.rashi||"").slice(0,30),
      longitude:Number.isFinite(Number(p.longitude))?Number(p.longitude):null,
      house:Number.isInteger(Number(p.house))?Number(p.house):null,
      nakshatra:String(p.nakshatra||"").slice(0,40),
      nakshatraIndex:Number.isInteger(Number(p.nakshatraIndex))?Number(p.nakshatraIndex):null,
      pada:Number.isInteger(Number(p.pada))?Number(p.pada):null
    };
  }
  const current=chart.dasha?.current||{};
  return {
    d1:{ascendant:{rashi:String(chart.d1.ascendant.rashi||"").slice(0,30),rashiIndex:Number(chart.d1.ascendant.rashiIndex)},planets},
    dasha:{current:{
      mahadasha:String(current.mahadasha||"").slice(0,20),
      antardasha:String(current.antardasha||"").slice(0,20),
      pratyantardasha:String(current.pratyantardasha||"").slice(0,20),
      mahadashaStart:current.mahadashaStart||null,mahadashaEnd:current.mahadashaEnd||null,
      antardashaStart:current.antardashaStart||null,antardashaEnd:current.antardashaEnd||null
    }}
  };
}
module.exports=async function handler(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({success:false,message:"केवल POST अनुरोध स्वीकार है।"});}
  if(!sameOrigin(req))return res.status(403).json({success:false,message:"यह अनुरोध स्वीकार नहीं है।"});
  try{
    const user=await getAuthenticatedUser(req,res);
    if(!user)return res.status(401).json({success:false,message:"AI गोचर विश्लेषण के लिए पहले लॉगिन करें।"});
    const consultation=await activeConsultation(user.id);
    if(!consultation)return res.status(402).json({success:false,message:"Gemini गोचर विश्लेषण के लिए पहले सक्रिय ज्योतिष परामर्श सत्र शुरू करें।"});
    if(!allowRate(req))return res.status(429).json({success:false,message:"कृपया एक मिनट बाद फिर प्रयास करें।"});

    const body=req.body||{},source=body.gochar||{};
    if(!Array.isArray(source.planets)||source.planets.length!==9)return res.status(400).json({success:false,message:"सभी 9 गोचर ग्रहों का डेटा आवश्यक है।"});
    const transit=source.planets.map(cleanTransit);
    if(transit.some(p=>!p||!p.name||!Number.isFinite(p.longitude)||!Number.isInteger(p.nakshatraIndex)||p.nakshatraIndex<0||p.nakshatraIndex>26||!Number.isInteger(p.pada)||p.pada<1||p.pada>4))return res.status(400).json({success:false,message:"गोचर ग्रह डेटा अधूरा या अमान्य है।"});
    const kundaliData=cleanBirthChart(body.kundali);
    if(!kundaliData)return res.status(400).json({success:false,message:"पहले जन्म कुंडली बनाएं; जन्म लग्न, चंद्र राशि, नक्षत्र और दशा का डेटा आवश्यक है।"});
    const language=String(body.language||"hi").slice(0,12);
    const synthesis=buildGocharSynthesis(kundaliData,source);
    // The AI receives only chart factors. No customer name, email, phone, account ID,
    // birth date/time, birth place, latitude, longitude or saved-kundli identifier.
    const chartContext={
      birth:{lagna:synthesis.kundali.lagna,chandraRashi:synthesis.kundali.chandraRashi,
        janmaNakshatra:synthesis.kundali.janmaNakshatra,janmaCharan:synthesis.kundali.janmaCharan,
        janmaNakshatraNumber:synthesis.kundali.janmaNakshatraNumber,
        natalPlanets:synthesis.kundali.d1Planets,balaAvailability:synthesis.kundali.balaAvailability},
      dasha:synthesis.dashaInfo,
      gochar:{asOf:String(source.asOf||""),ayanamsa:String(source.ayanamsa||""),
        calculation:"Astronomy Engine sidereal positions; linear Lahiri ayanamsa approximation; mean lunar nodes; whole-sign houses",
        planets:synthesis.transitPlanets},
      activeTriggers:synthesis.activeTriggers
    };
    const systemInstruction=`
तुम एक अत्यंत विद्वान भारतीय वैदिक ज्योतिषी हो। उपलब्ध जन्म कुंडली, वर्तमान गोचर, तारा बल और दशा को जोड़कर गहरा, स्पष्ट और संवेदनशील विश्लेषण दो।

सख्त नियम:
1. हर निष्कर्ष का कारण जन्म स्थिति + वर्तमान गोचर भाव + राशि + नक्षत्र/चरण + तारा बल + उपलब्ध षड्बल/भावबल + वर्तमान महादशा/अंतर्दशा से समझाओ।
2. करियर, नौकरी, प्रेम/वैवाहिक जीवन, यात्रा/स्थान परिवर्तन, धन, परिवार और सामान्य स्वास्थ्य/मानसिक संतुलन पर अलग-अलग विश्लेषण दो।
3. सक्रिय जीवन संकेत (Detected Triggers) को संभावित ज्योतिषीय संकेत की तरह समझाओ; उन्हें वास्तविक जीवन की पुष्टि या निश्चित घटना मत बताओ।
4. दशा स्वामी का गोचर 6, 8 या 12वें भाव में विपत/प्रत्यरि/नैधन तारा में हो तो सावधानी का कारण और सुरक्षित, वैकल्पिक पारंपरिक उपाय बताओ। डर या अनिवार्यता मत पैदा करो।
5. किसी बीमारी, शरीर के अंग में रोग, चोट, मुकदमे, नौकरी छूटने, तलाक, ब्रेकअप, विवाह, विदेश यात्रा या आर्थिक हानि को निश्चित मत बताओ। चिकित्सा निदान मत करो।
6. षड्बल और भावबल का डेटा अनुपलब्ध हो तो साफ बताओ कि उसका संख्यात्मक मूल्य इस गणना में उपलब्ध नहीं है; उसका अनुमान या काल्पनिक प्रतिशत मत बनाओ।
7. कोई ग्रह स्थिति, योग, दशा अवधि, तारा, जन्म विवरण या घटना मत गढ़ो। गणना की सीमाएं बताओ।
8. उत्तर चुनी हुई भाषा में दो: ${language}। सरल, प्रभावशाली और संवेदनशील शैली रखो। अंत में दो सरल, सुरक्षित और वैकल्पिक उपाय दो।
`;
    const question="नीचे दिए गए जन्म कुंडली, दशा, नौ ग्रहों के गोचर, तारा बल और सक्रिय संकेतों का एकीकृत विश्लेषण करो। हर विषय पर ग्रह/भाव/नक्षत्र/तारा/दशा का कारण दो। जहां पर्याप्त डेटा नहीं है, वहां सीमा स्पष्ट करो।";
    const answer=await askGemini({question,chartContext,conversationHistory:[],language,systemInstruction});
    return res.status(200).json({success:true,answer,analysisMeta:{
      taraBalCalculated:true,activeTriggerCount:synthesis.activeTriggers.length,
      shadbalaAvailable:false,bhavaBalaAvailable:false,
      personalIdentifiersSent:false
    }});
  }catch(error){
    console.error("Gochar synthesis failed:",error.message);
    return res.status(503).json({success:false,message:"AI गोचर विश्लेषण अभी उपलब्ध नहीं है। कृपया बाद में फिर प्रयास करें।"});
  }
};
