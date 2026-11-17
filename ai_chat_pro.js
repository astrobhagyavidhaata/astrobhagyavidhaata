let activeAstro = "";
let amitAstroRules = localStorage.getItem("adi_ai_rules") || 
"तुम 'एस्ट्रो भाग्य विधाता' के वरिष्ठ वैदिक ज्योतिषाचार्य हो। कस्टमर ने ₹11/मिनट का शुल्क दिया है, इसलिए हर उत्तर अत्यंत गंभीर, सटीक, सम्मानजनक और व्यावहारिक होना चाहिए। नियमों का सख्ती से पालन करें: 1) कभी भी डराने वाली, अंधविश्वासी या अधूरी बात न कहें। 2) उत्तर हमेशा शुद्ध और सरल हिंदी में दें। 3) कस्टमर के जन्म नक्षत्र, चंद्र राशि, लग्न, नवांश (D9) और वक्री ग्रहों के कर्मफल के आधार पर स्पष्ट विश्लेषण करें। 4) हर उत्तर के अंत में एक छोटा, सात्विक और बिना खर्चे वाला वैदिक उपाय (मंत्र या दान) अवश्य बताएं।";

function saveAiSettings() {
    let key = document.getElementById("geminiApiKey").value.trim();
    let rules = document.getElementById("customRulesBox").value.trim();
    if (key) localStorage.setItem("adi_gemini_key", key);
    if (rules) {
        amitAstroRules = rules;
        localStorage.setItem("adi_ai_rules", rules);
    }
    alert("आपका AI कनेक्शन और ज्योतिष ज्ञान सफलतापूर्वक सेव हो गया है!");
}

function openChatBox(astroName, rate) {
    let kInfo = document.getElementById("kTxt").innerText;
    if (!kInfo) {
        alert("कृपया पहले ऊपर अपनी जन्म तारीख, समय और स्थान भरकर 'सभी कुंडली चार्ट बनाएं' पर दबाएं!");
        return;
    }
    if (!deductMoney(rate, astroName)) return;
    activeAstro = astroName;
    document.getElementById("chatModal").style.display = "block";
    document.getElementById("chatTitle").innerText = astroName + " (लाइव वैदिक परामर्श)";
    let uName = document.getElementById("un").value || "जातक";
    document.getElementById("chatMessages").innerHTML = 
        `<div class="msg-bot"><b>${astroName}:</b> नमस्कार ${uName} जी! आपकी जन्म कुंडली (${kInfo}) का सूक्ष्म अध्ययन कर लिया गया है। कृपया अपना मुख्य प्रश्न पूछें।</div>`;
}

async function sendUserMsg() {
    let inp = document.getElementById("userMsgInput");
    let msg = inp.value.trim();
    if (!msg) return;
    let box = document.getElementById("chatMessages");
    box.innerHTML += `<div class="msg-user"><b>आप:</b> ${msg}</div>`;
    inp.value = "";

    let apiKey = localStorage.getItem("adi_gemini_key");
    let kDetails = document.getElementById("kTxt").innerText;

    if (!apiKey) {
        setTimeout(() => {
            box.innerHTML += `<div class="msg-bot"><b>${activeAstro}:</b> [डेमो मोड] आपकी कुंडली (${kDetails}) प्राप्त हो गई है। असली AI उत्तर चालू करने के लिए नीचे एडमिन पैनल में अपनी Google Gemini API Key सेव करें।</div>`;
            box.scrollTop = box.scrollHeight;
        }, 400);
        return;
    }

    let loadId = "msg_" + Date.now();
    box.innerHTML += `<div class="msg-bot" id="${loadId}"><b>${activeAstro}:</b> आपकी कुंडली के ग्रहों और नवांश की गणना की जा रही है...</div>`;
    box.scrollTop = box.scrollHeight;

    try {
        let promptText = `आप 'एस्ट्रो भाग्य विधाता' के मुख्य ज्योतिषाचार्य हैं। नीचे दिए गए गुरु-नियमों का पालन करते हुए उत्तर दें:\n${amitAstroRules}\n\nजातक का कुंडली विवरण: ${kDetails}\nजातक का प्रश्न: ${msg}\n\nउत्तर की संरचना:\n1. ग्रह स्थिति और कारण (2-3 पंक्तियों में)\n2. सटीक मार्गदर्शन (2-3 पंक्तियों में)\n3. एक सरल सात्विक उपाय (1-2 पंक्तियों में)`;
        
        let res = await fetch(`https://googleapis.com{apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        let data = await res.json();
        let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "क्षमा करें, अभी सर्वर व्यस्त है। कृपया एक क्षण बाद पुनः प्रश्न भेजें।";
        document.getElementById(loadId).innerHTML = `<b>${activeAstro}:</b> ${reply.replace(/\n/g, '<br>')}`;
    } catch (e) {
        document.getElementById(loadId).innerHTML = `<b>${activeAstro}:</b> नेटवर्क या API Key में त्रुटि है। कृपया एडमिन पैनल में अपनी चाबी जांचें।`;
    }
    box.scrollTop = box.scrollHeight;
}
