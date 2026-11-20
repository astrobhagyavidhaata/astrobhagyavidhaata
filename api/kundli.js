"use strict";

const { DateTime, FixedOffsetZone } = require("luxon");
const tzLookup = require("tz-lookup");
const { calculateSiderealPositions } = require("../lib/ephemeris");
const { buildChart } = require("../lib/chart-engine");
const { getVimshottariDasha, getCompleteTaraChart, getTaraFromMoonLongitudes } = require("../lib/astrology-engine");
const { getAuthenticatedUser, serviceFetch } = require("../lib/supabase");
const { calculateAshtakavarga } = require("../lib/ashtakavarga");
const { calculateShadbala } = require("../lib/shadbala");

function resolveBirthTimeZone(latitude, longitude) {
  // Prefer the coordinate-based IANA zone: it includes country borders and DST rules.
  try {
    const zone = tzLookup(latitude, longitude);
    const probe = DateTime.now().setZone(zone);
    if (probe.isValid) return { zone, source: "tz-lookup" };
  } catch (error) {
    console.warn("IANA timezone lookup failed; using longitude fallback:", error.message);
  }

  // Last-resort approximation only. This cannot model historical/DST changes.
  const offsetHours = Math.max(-12, Math.min(14, Math.round(longitude / 15)));
  const fixedZone = FixedOffsetZone.instance(offsetHours * 60);
  return { zone: fixedZone, source: "longitude-estimate" };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success:false, message:"Only POST requests are accepted." });
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
    const timezone = resolveBirthTimeZone(lat, lon);
    const local = DateTime.fromISO(body.birthDate+"T"+body.birthTime, {zone:timezone.zone});
    if (!local.isValid) return res.status(400).json({success:false,message:"Birth date or time is invalid."});
    const birthUtc = local.toUTC().toJSDate();
    if (birthUtc.getTime() > Date.now()) return res.status(400).json({success:false,message:"Birth time cannot be in the future."});

    const positions = calculateSiderealPositions(birthUtc, lat, lon);
    const chart = buildChart(positions.ascendantLongitude, positions.planets);
    const shadbalaPlanets = {};
    const planetNames = { सूर्य:"Sun", चंद्र:"Moon", मंगल:"Mars", बुध:"Mercury", गुरु:"Jupiter", शुक्र:"Venus", शनि:"Saturn" };
    for (const [nativeName, englishName] of Object.entries(planetNames)) {
      const source = positions.planets[nativeName] || {};
      const d1Planet = chart.d1?.planets?.[nativeName] || {};
      shadbalaPlanets[englishName] = {
        longitude: source.longitude,
        retrograde: Boolean(source.retrograde),
        house: d1Planet.house
      };
    }
    const shadbala = calculateShadbala(shadbalaPlanets, positions.ascendantLongitude);
    const ashtakavarga = calculateAshtakavarga(positions.planets, chart.d1.ascendant.rashiIndex);
    const dasha = getVimshottariDasha(birthUtc, positions.planets.चंद्र.longitude);
    const taraChart = getCompleteTaraChart(
      require("../lib/astrology-engine").getNakshatraFromLongitude(positions.planets.चंद्र.longitude).index
    );
    const currentPositions = calculateSiderealPositions(new Date(), lat, lon);
    const currentTaraBala = getTaraFromMoonLongitudes(
      positions.planets.चंद्र.longitude,
      currentPositions.planets.चंद्र.longitude
    );
    const result = {
      name: String(body.name || "").trim().slice(0,100),
      gender: ["male","female"].includes(String(body.gender||"").toLowerCase()) ? String(body.gender).toLowerCase() : null,
      birth: {
        localDate: body.birthDate, localTime: body.birthTime,
        timezone: timezone.zone.name || timezone.zone,
        timezoneSource: timezone.source,
        timezoneOffsetMinutes: local.offset,
        timezoneOffsetHours: Number((local.offset / 60).toFixed(2)),
        utc: birthUtc.toISOString(),
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
      shadbala,
      shadbalaMethod: "heuristic approximation; not complete classical BPHS Shadbala",
      ashtakavarga,
      dasha,
      taraChart,
      currentTaraBala
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
