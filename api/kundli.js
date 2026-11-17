"use strict";

const { DateTime } = require("luxon");
const tzLookup = require("tz-lookup");
const { calculateSiderealPositions } = require("../lib/ephemeris");
const { buildChart } = require("../lib/chart-engine");
const { getVimshottariDasha, getCompleteTaraChart } = require("../lib/astrology-engine");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success:false, message:"केवल POST अनुरोध स्वीकार है।" });
  }
  try {
    const body = req.body || {};
    const place = body.birthPlace || {};
    const lat = Number(place.latitude);
    const lon = Number(place.longitude);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.birthDate || "")) ||
        !/^\d{2}:\d{2}$/.test(String(body.birthTime || "")) ||
        !Number.isFinite(lat) || !Number.isFinite(lon) ||
        Math.abs(lat)>90 || Math.abs(lon)>180) {
      return res.status(400).json({success:false,message:"जन्म तारीख, समय और सही जन्मस्थान आवश्यक हैं।"});
    }
    const zone = tzLookup(lat, lon);
    const local = DateTime.fromISO(body.birthDate+"T"+body.birthTime, {zone});
    if (!local.isValid) return res.status(400).json({success:false,message:"जन्म तारीख या समय सही नहीं है।"});
    const birthUtc = local.toUTC().toJSDate();
    if (birthUtc.getTime() > Date.now()) return res.status(400).json({success:false,message:"जन्म समय भविष्य का नहीं हो सकता।"});

    const positions = calculateSiderealPositions(birthUtc, lat, lon);
    const chart = buildChart(positions.ascendantLongitude, positions.planets);
    const dasha = getVimshottariDasha(birthUtc, positions.planets.चंद्र.longitude);
    const taraChart = getCompleteTaraChart(
      require("../lib/astrology-engine").getNakshatraFromLongitude(positions.planets.चंद्र.longitude).index
    );
    const result = {
      name: String(body.name || "").trim().slice(0,100),
      birth: {
        localDate: body.birthDate, localTime: body.birthTime,
        timezone: zone, utc: birthUtc.toISOString(),
        place: place.name || "", latitude:lat, longitude:lon
      },
      calculation: {
        zodiac:"sidereal", ayanamsa:"Lahiri (linear approximation)",
        ayanamsaDegrees:positions.ayanamsa,
        houseSystem:"whole_sign",
        ephemeris:"Astronomy Engine",
        accuracyNote:"यह Lahiri अयनांश का रैखिक अनुमान और mean lunar node उपयोग करता है; इसे Swiss Ephemeris-प्रमाणित परिणाम न मानें।"
      },
      ...chart,
      dasha,
      taraChart
    };
    return res.status(200).json({
      success:true,
      message:"जन्म विवरण के आधार पर प्रारंभिक कुंडली गणना पूरी हुई।",
      chart:result
    });
  } catch (error) {
    console.error("Kundli calculation failed:", error);
    return res.status(500).json({success:false,message:"कुंडली गणना में समस्या आई। जन्म विवरण जाँचकर दोबारा प्रयास करें।"});
  }
};
