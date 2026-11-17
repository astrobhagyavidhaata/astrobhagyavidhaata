
const { askGemini } = require("../lib/gemini");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "केवल POST अनुरोध स्वीकार है।"
    });
  }

  try {
    const body = req.body || {};

    const question = body.question || body.content;
    const chartContext = body.chartContext || {};
    const conversationHistory = Array.isArray(body.conversationHistory)
      ? body.conversationHistory
      : [];

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        message: "कृपया अपना प्रश्न लिखें।"
      });
    }

    if (question.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "प्रश्न बहुत लंबा है।"
      });
    }

    const answer = await askGemini({
      question,
      chartContext,
      conversationHistory
    });

    return res.status(200).json({
      success: true,
      answer
    });

  } catch (error) {
    console.error("Consultation API error:", error.message);

    return res.status(500).json({
      success: false,
      message: "अभी उत्तर प्राप्त नहीं हो पाया। कृपया दोबारा प्रयास करें।"
    });
  }
};
