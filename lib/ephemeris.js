"use strict";

// Astronomy Engine tropical geocentric positions converted to Lahiri sidereal.
// This is an open astronomy implementation, not Swiss Ephemeris.
// Lahiri ayanamsa uses a documented linear approximation; validate against a
// professional ephemeris before commercial production.

const Astronomy = require("astronomy-engine");

const PLANETS = {
  सूर्य: Astronomy.Body.Sun,
  चंद्र: Astronomy.Body.Moon,
  मंगल: Astronomy.Body.Mars,
  बुध: Astronomy.Body.Mercury,
  गुरु: Astronomy.Body.Jupiter,
  शुक्र: Astronomy.Body.Venus,
  शनि: Astronomy.Body.Saturn
};

function norm(x) { return ((x % 360) + 360) % 360; }

function lahiriAyanamsa(date) {
  const y = date.getUTCFullYear() +
    (date.getUTCMonth() + date.getUTCDate() / 31) / 12;
  return 23.85675 + (y - 2000) * (50.290966 / 3600);
}

function tropicalLongitude(body, date) {
  if (body === Astronomy.Body.Sun) {
    return Astronomy.SunPosition(date).elon;
  }
  const geocentric = Astronomy.GeoVector(body, date, true);
  return Astronomy.Ecliptic(geocentric).elon;
}

function meanNodeLongitude(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  return norm(125.04452 - 1934.136261*T + 0.0020708*T*T + T*T*T/450000);
}

function ascendantLongitude(date, latitude, longitude) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  const gmst = norm(280.46061837 + 360.98564736629*(jd-2451545) +
    0.000387933*T*T - T*T*T/38710000);
  const theta = norm(gmst + longitude) * Math.PI / 180;
  const eps = (23.439291 - 0.0130042*T) * Math.PI / 180;
  const phi = Math.max(-89.999, Math.min(89.999, latitude)) * Math.PI / 180;
  // Select the EASTERN (rising) ecliptic-horizon intersection.
  // The previous implementation selected the opposite intersection
  // (Descendant), producing a 180-degree / six-sign error.
  const y = Math.cos(theta);
  const x = -(
    Math.sin(theta) * Math.cos(eps) +
    Math.tan(phi) * Math.sin(eps)
  );
  return norm(Math.atan2(y, x) * 180 / Math.PI);
}

function calculateSiderealPositions(date, latitude, longitude) {
  const ayanamsa = lahiriAyanamsa(date);
  const planets = {};
  for (const [name, body] of Object.entries(PLANETS)) {
    const tropical = tropicalLongitude(body, date);
    const before = tropicalLongitude(body, new Date(date.getTime() - 12*3600000));
    const after = tropicalLongitude(body, new Date(date.getTime() + 12*3600000));
    const delta = norm(after - before);
    const signedDelta = delta > 180 ? delta - 360 : delta;
    planets[name] = {
      longitude: norm(tropical - ayanamsa),
      retrograde: signedDelta < 0
    };
  }
  const rahu = norm(meanNodeLongitude(date) - ayanamsa);
  planets.राहु = { longitude: rahu, retrograde: true };
  planets.केतु = { longitude: norm(rahu + 180), retrograde: true };
  const tropicalAsc = ascendantLongitude(date, latitude, longitude);
  return {
    ayanamsa,
    ascendantLongitude: norm(tropicalAsc - ayanamsa),
    planets
  };
}

module.exports = { calculateSiderealPositions, lahiriAyanamsa };
