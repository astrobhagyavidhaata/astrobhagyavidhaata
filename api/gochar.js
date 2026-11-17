"use strict";

const { calculateSiderealPositions } = require("../lib/ephemeris");
const { getPosition } = require("../lib/chart-engine");

const RASHIS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({success:false,message:"केवल GET अनुरोध स्वीकार है।"});
  }
  const rashi = String(req.query?.rashi || "");
  if (!RASHIS.includes(rashi)) {
    return res.status(400).json({success:false,message:"मान्य राशि चुनें।"});
  }
  try {
    const now = new Date();
    const positions = calculateSiderealPositions(now, 0, 0);
    const ascIndex = RASHIS.indexOf(rashi);
    const lines = ["गणना समय (UTC): " + now.toISOString(), "आधार राशि: " + rashi, ""];
    for (const [name, p] of Object.entries(positions.planets)) {
      const pos = getPosition(p.longitude);
      const house = ((pos.rashiIndex - ascIndex + 12) % 12) + 1;
      lines.push(name + ": " + pos.rashi + " " + pos.degreeInRashi.toFixed(2) +
        "° — " + house + "वाँ भाव" + (p.retrograde ? " (वक्री)" : ""));
    }
    return res.status(200).json({
      success:true,
      asOf:now.toISOString(),
      transit:lines.join("\n"),
      note:"यह वर्तमान ग्रह-स्थिति आधारित सामान्य गोचर डेटा है; व्यक्तिगत फलादेश के लिए जन्मकुंडली और दशा के साथ विश्लेषण आवश्यक है।"
    });
  } catch (error) {
    console.error("Gochar API failed:", error);
    return res.status(500).json({success:false,message:"गोचर गणना उपलब्ध नहीं है।"});
  }
};
