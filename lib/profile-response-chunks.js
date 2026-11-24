"use strict";

function splitOwnerParagraphs(value) {
  const normalized = String(value || "").replace(/\\\\n/g, "\n").replace(/\r/g, "").trim();
  if (!normalized) return [];
  let paragraphs = normalized.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
  if (paragraphs.length === 1 && normalized.includes("\n")) {
    paragraphs = normalized.split(/\n+/).map(part => part.trim()).filter(Boolean);
  }
  // Some archived answers were saved as one very long paragraph. Preserve every
  // word but introduce readable paragraph boundaries after groups of sentences.
  paragraphs = paragraphs.flatMap(paragraph => {
    if (paragraph.length < 500) return [paragraph];
    const sentences = paragraph.split(/(?<=[।!?])\s+/u).map(part => part.trim()).filter(Boolean);
    if (sentences.length < 4) return [paragraph];
    const expanded = [];
    for (let index = 0; index < sentences.length; index += 3) {
      expanded.push(sentences.slice(index, index + 3).join(" "));
    }
    return expanded;
  });
  return paragraphs;
}

function profileTopic(question) {
  const q = String(question || "").normalize("NFKC").toLowerCase();
  if (/महादशा|अंतर्दशा|अन्तर्दशा|दशा|विंशोत्तरी|antar.?dasha|maha.?dasha|vimshottari|dasha|भविष्य|आने वाला समय|future/.test(q)) return "dasha";
  if (/माता.?पिता|माता|मां|माँ|पिता|मायका|parents?|mother|father|family|परिवार|mata.?pita|maa|maata|pita|parivaar/.test(q)) return "parents";
  if (/करियर|काम|नौकरी|व्यवसाय|बिजनेस|आजीविका|पेशा|career|job|work|business|profession/.test(q)) return "career";
  if (/पार्टनर|पति|पती|पत्नी|जीवनसाथी|pati|patidev|partner|husband|wife|spouse|marriage|विवाह|शादी|divorce|talaq|separation|छोड़ना|छोडना/.test(q)) return "partner";
  if (/नेचर|स्वभाव|व्यक्तित्व|पर्सनैलिटी|पर्सनालिटी|nature|personality|swabhav|swabhaav|vyaktitva|myself|mere bare|mere baare|about me/.test(q)) return "nature";
  if (/और बताओ|aur batao|aage batao|आगे बताओ|और बताइए|continue|more|next/.test(q)) return "continuation";
  return "other";
}

function getNextOwnerChunk(answer, question, history = [], chunkSize = 3) {
  const paragraphs = splitOwnerParagraphs(answer);
  if (!paragraphs.length) return { answer: "", hasMore: false, chunkIndex: 0, totalChunks: 0 };
  const turns = Array.isArray(history) ? history : [];
  const currentTopic = profileTopic(question);
  let topic = currentTopic;
  if (topic === "continuation" || topic === "other") {
    for (let i = turns.length - 1; i >= 0; i--) {
      const item = turns[i];
      if (item && (item.role === "user" || item.role === "human")) {
        const candidate = profileTopic(item.content);
        if (candidate !== "continuation" && candidate !== "other") { topic = candidate; break; }
      }
    }
  }
  let lastUserTopic = "";
  let usedParagraphs = 0;
  for (const item of turns) {
    if (!item || typeof item !== "object") continue;
    if (item.role === "user" || item.role === "human") {
      const candidate = profileTopic(item.content);
      if (candidate === "continuation") lastUserTopic = topic;
      else if (candidate !== "other") lastUserTopic = candidate;
      else lastUserTopic = "";
    } else if (item.role === "assistant" || item.role === "model") {
      if (lastUserTopic === topic) usedParagraphs += splitOwnerParagraphs(item.content).length;
      lastUserTopic = "";
    }
  }
  const start = Math.min(usedParagraphs, paragraphs.length);
  const end = Math.min(start + Math.max(2, Math.min(3, Number(chunkSize) || 3)), paragraphs.length);
  return {
    answer: paragraphs.slice(start, end).join("\n\n"),
    hasMore: end < paragraphs.length,
    chunkIndex: Math.floor(start / 3),
    totalChunks: Math.ceil(paragraphs.length / 3),
    paragraphStart: start,
    paragraphEnd: end,
    topic
  };
}

module.exports = { splitOwnerParagraphs, profileTopic, getNextOwnerChunk };
