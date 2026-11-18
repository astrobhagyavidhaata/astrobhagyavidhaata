"use strict";

const { DateTime } = require("luxon");
const tzLookup = require("tz-lookup");
const { calculateSiderealPositions } = require("../lib/ephemeris");
const { buildChart } = require("../lib/chart-engine");
const { getVimshottariDasha, getCompleteTaraChart } = require("../lib/astrology-engine");
const { getAuthenticatedUser, serviceFetch } = require("../lib/supabase");

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
      return res.status(400).json({success:false,message:"Birth date, time, and a valid birth place are required."});
    }
    const zone = tzLookup(lat, lon);
    const local = DateTime.fromISO(body.birthDate+"T"+body.birthTime, {zone});
    if (!local.isValid) return res.status(400).json({success:false,message:"Birth date or time is invalid."});
    const birthUtc = local.toUTC().toJSDate();
    if (birthUtc.getTime() > Date.now()) return res.status(400).json({success:false,message:"Birth time cannot be in the future."});

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
        accuracyNote:"Uses a linear Lahiri ayanamsa approximation and mean lunar node; this is not a Swiss Ephemeris-certified result."
      },
      ...chart,
      dasha,
      taraChart
    };
    let savedKundliId=null;
    if(body.saveToAccount===true){
      try{
        const user=await getAuthenticatedUser(req,res);
        if(user){
          const rows=await serviceFetch("/kundlis",{
            method:"POST",
            headers:{Prefer:"return=representation"},
            body:JSON.stringify({
              user_id:user.id,
              title:(result.name||"Birth Chart")+" - "+result.birth.localDate,
              birth_details:{name:result.name,...result.birth},
              chart_data:result
            })
          });
          savedKundliId=rows?.[0]?.id||null;
        }
      }catch(saveError){
        console.warn("Kundli save skipped:",saveError.message);
      }
    }
    return res.status(200).json({
      success:true,
      message:"Initial birth chart calculation completed.",
      savedKundliId,
      chart:result
    });
  } catch (error) {
    console.error("Kundli calculation failed:", error);
    return res.status(500).json({success:false,message:"Kundli calculation failed. Check the birth details and try again."});
  }
};
