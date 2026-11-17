"use strict";

const Astronomy = require("astronomy-engine");
const { DateTime } = require("luxon");
const tzLookup = require("tz-lookup");
const { calculateSiderealPositions, lahiriAyanamsa } = require("../lib/ephemeris");

const TITHIS = ["प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पंचमी","षष्ठी","सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी","पूर्णिमा"];
const NAKSHATRAS = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वा भाद्रपद","उत्तरा भाद्रपद","रेवती"];
const YOGAS = ["विष्कम्भ","प्रीति","आयुष्मान","सौभाग्य","शोभन","अतिगण्ड","सुकर्मा","धृति","शूल","गण्ड","वृद्धि","ध्रुव","व्याघात","हर्षण","वज्र","सिद्धि","व्यतीपात","वरीयान","परिघ","शिव","सिद्ध","साध्य","शुभ","शुक्ल","ब्रह्म","इन्द्र","वैधृति"];
const KARANAS = ["बव","बालव","कौलव","तैतिल","गर","वणिज","विष्टि"];
const FIXED_KARANAS = ["शकुनि","चतुष्पद","नाग"];
const WEEKDAYS = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
const HORA_LORDS = ["शनि","गुरु","मंगल","सूर्य","शुक्र","बुध","चंद्र"];
const WEEKDAY_LORD_INDEX = [3,6,2,5,1,4,0];
const RAHU_SLOT = [8,2,7,5,6,4,3];
const YAMA_SLOT = [5,4,3,2,1,7,6];
const GULIKA_SLOT = [7,6,5,4,3,2,1];

function norm(x) { return ((x % 360) + 360) % 360; }
function karanaName(index) {
  if (index === 0) return "किंस्तुघ्न";
  if (index >= 57) return FIXED_KARANAS[index - 57];
  return KARANAS[(index - 1) % 7];
}
function fmt(date, zone) {
  return DateTime.fromJSDate(date, { zone:"utc" }).setZone(zone).toFormat("hh:mm a");
}
function plusMinutes(date, minutes) { return new Date(date.getTime() + minutes * 60000); }
function periodLabel(a,b,zone) { return fmt(a,zone) + " – " + fmt(b,zone); }

function panchangMetrics(date) {
  const sun = Astronomy.EclipticLongitude(Astronomy.Body.Sun, date);
  const moon = Astronomy.EclipticLongitude(Astronomy.Body.Moon, date);
  const ayan = lahiriAyanamsa(date);
  return {
    elongation:norm(moon-sun),
    moonSidereal:norm(moon-ayan),
    yogaAngle:norm(sun+moon-2*ayan)
  };
}
function findBoundary(start, metric, width) {
  const base = metric(start);
  const needed = width - (base % width);
  let left = start, right = null;
  for (let m=10; m<=2160; m+=10) {
    const candidate = plusMinutes(start,m);
    if (norm(metric(candidate)-base) >= needed) { right=candidate; break; }
  }
  if (!right) return null;
  for (let i=0; i<32; i++) {
    const mid = new Date((left.getTime()+right.getTime())/2);
    if (norm(metric(mid)-base) >= needed) right=mid; else left=mid;
  }
  return fmt(right, "UTC");
}
function segment(start,end,slot,total) {
  const unit=(end.getTime()-start.getTime())/total;
  return {
    start:new Date(start.getTime()+(slot-1)*unit),
    end:new Date(start.getTime()+slot*unit)
  };
}

module.exports = async function handler(req,res) {
  if (req.method !== "GET") {
    res.setHeader("Allow","GET");
    return res.status(405).json({success:false,message:"केवल GET अनुरोध स्वीकार है।"});
  }
  const dateText=String(req.query?.date||"");
  const lat=Number(req.query?.lat), lon=Number(req.query?.lon);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || !Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({success:false,message:"सही तारीख, अक्षांश और देशांतर भरें।"});
  }
  try {
    const zone=tzLookup(lat,lon);
    const localStart=DateTime.fromISO(dateText,{zone}).startOf("day");
    if (!localStart.isValid || localStart.toFormat("yyyy-MM-dd") !== dateText)
      return res.status(400).json({success:false,message:"तारीख मान्य नहीं है।"});
    const utcStart=localStart.toUTC().toJSDate();
    const observer=new Astronomy.Observer(lat,lon,0);
    const rise=Astronomy.SearchRiseSet("Sun",observer,+1,utcStart,2);
    const set=Astronomy.SearchRiseSet("Sun",observer,-1,utcStart,2);
    if (!rise || !set) return res.status(422).json({success:false,message:"इस स्थान और तारीख के लिए सूर्योदय/सूर्यास्त नहीं मिला।"});
    const sunrise=rise.date, sunset=set.date;
    if (sunset <= sunrise) return res.status(422).json({success:false,message:"सूर्योदय/सूर्यास्त का क्रम निर्धारित नहीं हुआ।"});
    const m=panchangMetrics(sunrise);
    const tithiIndex=Math.floor(m.elongation/12);
    const nakIndex=Math.floor(m.moonSidereal/(360/27));
    const yogaIndex=Math.floor(m.yogaAngle/(360/27));
    const karanaIndex=Math.floor(m.elongation/6);
    const weekday=localStart.weekday%7;
    const paksha=tithiIndex<15?"शुक्ल पक्ष":"कृष्ण पक्ष";
    const tithiName=tithiIndex===14?"पूर्णिमा":tithiIndex===29?"अमावस्या":TITHIS[tithiIndex%15];
    const pada=Math.floor((m.moonSidereal%(360/27))/(360/108))+1;
    const tithiEnd=findBoundary(sunrise,d=>panchangMetrics(d).elongation,12);
    const nakEnd=findBoundary(sunrise,d=>panchangMetrics(d).moonSidereal,360/27);
    const yogaEnd=findBoundary(sunrise,d=>panchangMetrics(d).yogaAngle,360/27);
    const karanaEnd=findBoundary(sunrise,d=>panchangMetrics(d).elongation,6);
    const dayMinutes=Math.round((sunset-sunrise)/60000);
    const rahu=segment(sunrise,sunset,RAHU_SLOT[weekday],8);
    const yama=segment(sunrise,sunset,YAMA_SLOT[weekday],8);
    const gulika=segment(sunrise,sunset,GULIKA_SLOT[weekday],8);
    const abhijit=segment(sunrise,sunset,8,15);
    const nextRise=Astronomy.SearchRiseSet("Sun",observer,+1,plusMinutes(sunset,1),2);
    const nightEnd=nextRise?nextRise.date:plusMinutes(sunset,dayMinutes);
    const dayUnit=(sunset-sunrise)/12, nightUnit=(nightEnd-sunset)/12;
    const firstLord=WEEKDAY_LORD_INDEX[weekday], hora=[];
    for(let i=0;i<24;i++){
      const a=i<12?new Date(sunrise.getTime()+i*dayUnit):new Date(sunset.getTime()+(i-12)*nightUnit);
      const b=i<12?new Date(sunrise.getTime()+(i+1)*dayUnit):new Date(sunset.getTime()+(i-11)*nightUnit);
      hora.push({number:i+1,lord:HORA_LORDS[(firstLord+i)%7],time:periodLabel(a,b,zone)});
    }
    const positions=calculateSiderealPositions(sunrise,lat,lon);
    const moonrise=Astronomy.SearchRiseSet("Moon",observer,+1,utcStart,2);
    const moonset=Astronomy.SearchRiseSet("Moon",observer,-1,utcStart,2);
    return res.status(200).json({
      success:true,date:dateText,timezone:zone,weekday:WEEKDAYS[weekday],
      sunrise:fmt(sunrise,zone),sunset:fmt(sunset,zone),
      moonrise:moonrise?fmt(moonrise.date,zone):null,moonset:moonset?fmt(moonset.date,zone):null,
      panchang:{
        paksha,tithi:tithiName,tithiNumber:tithiIndex+1,tithiEnds:tithiEnd,
        nakshatra:NAKSHATRAS[nakIndex],pada,nakshatraEnds:nakEnd,
        yoga:YOGAS[yogaIndex],yogaEnds:yogaEnd,
        karana:karanaName(karanaIndex),karanaEnds:karanaEnd,
        sunSiderealLongitude:Number(positions.planets["सूर्य"].longitude.toFixed(6)),
        moonSiderealLongitude:Number(positions.planets["चंद्र"].longitude.toFixed(6))
      },
      kaal:{
        rahuKaal:periodLabel(rahu.start,rahu.end,zone),
        yamagand:periodLabel(yama.start,yama.end,zone),
        gulika:periodLabel(gulika.start,gulika.end,zone),
        abhijit:periodLabel(abhijit.start,abhijit.end,zone)
      },
      hora,
      calculation:{method:"Drik-style geocentric Sun/Moon longitude + local sunrise",ayanamsa:"Lahiri linear approximation",dayLengthMinutes:dayMinutes},
      note:"यह प्रारंभिक गणना इंजन है। अयनांश और ग्रह-स्थिति वर्तमान अनुमानित मॉडल पर आधारित हैं; पर्व/व्रत/विवाह जैसे महत्वपूर्ण निर्णय से पहले प्रमाणित पंचांग से मिलान आवश्यक है।"
    });
  } catch(error) {
    console.error("Panchang API failed:",error);
    return res.status(500).json({success:false,message:"पंचांग गणना में समस्या आई।"});
  }
};