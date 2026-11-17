const nak27 = [
  "अश्विनी (केतु): तेज़ गति, नई शुरुआत और उपचार शक्ति।", "भरणी (शुक्र): रचनात्मकता, धैर्य और गहरी जिम्मेदारी।",
  "कृत्तिका (सूर्य): तेजस्वी, स्पष्टवादी और सत्य का मार्ग।", "रोहिणी (चंद्र): आकर्षण, कला, समृद्धि और स्थिरता।",
  "मृगशिरा (मंगल): जिज्ञासु, खोजबीन और सौम्य स्वभाव।", "आर्द्रा (राहु): गहरा चिंतन, बदलाव और तीव्र बुद्धि।",
  "पुनर्वसु (गुरु): सौभाग्य, पुनरुत्थान और ज्ञान।", "पुष्य (शनि): पोषण, धर्म, सेवा और शुभ फल।",
  "आश्लेषा (बुध): सूक्ष्म दृष्टि, रहस्य और तीव्र अंतर्ज्ञान।", "मघा (केतु): राजसी स्वभाव, पितृ आशीर्वाद और नेतृत्व।",
  "पूर्वाफाल्गुनी (शुक्र): आनंद, कला, प्रेम और विश्राम।", "उत्तराफाल्गुनी (सूर्य): मित्रता, वचनबद्धता और सामाजिक सम्मान।",
  "हस्त (चंद्र): कौशल, हस्तकला और व्यावहारिक बुद्धि।", "चित्रा (मंगल): सुंदरता, वास्तुकला और आकर्षक व्यक्तित्व।",
  "स्वाति (राहु): स्वतंत्रता, व्यापारिक बुद्धि और लचीलापन।", "विशाखा (गुरु): लक्ष्य के प्रति समर्पण और दृढ़ संकल्प।",
  "अनुराधा (शनि): भक्ति, मित्रता और संगठन क्षमता।", "ज्येष्ठा (बुध): वरिष्ठता, संरक्षण और गूढ़ ज्ञान।",
  "मूल (केतु): जड़ तक जाने की क्षमता और आध्यात्मिक खोज।", "पूर्वाषाढ़ा (शुक्र): अजेय उत्साह, प्रभावशाली वाणी।",
  "उत्तराषाढ़ा (सूर्य): स्थायी विजय, धर्म और सिद्धांत।", "श्रवण (चंद्र): सुनने और सीखने की अद्भुत कला।",
  "धनिष्ठा (मंगल): संगीत, समृद्धि और सामूहिक सफलता।", "शतभिषा (राहु): रहस्यमयी उपचार, शोध और एकांतप्रियता।",
  "पूर्वाभाद्रपद (गुरु): तपस्या, आदर्शवाद और गहरी दृष्टि।", "उत्तराभाद्रपद (शनि): स्थिरता, करुणा और आध्यात्मिक गहराई।",
  "रेवती (बुध): कोमलता, मार्गदर्शक और पूर्णता।"
];

const rashiNames = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
let selLat = 30.90, selLon = 75.85, selCity = "Ludhiana";

async function searchCityAPI() {
    let q = document.getElementById("pl").value.trim();
    let list = document.getElementById("cList");
    if (q.length < 3) { list.style.display = "none"; return; }
    try {
        let res = await fetch(`https://open-meteo.com{encodeURIComponent(q)}&count=5&language=hi`);
        let data = await res.json();
        if (!data.results) { list.style.display = "none"; return; }
        list.innerHTML = "";
        data.results.forEach(c => {
            let div = document.createElement("div");
            div.className = "citem";
            div.innerText = `${c.name}, ${c.admin1 || ""} (${c.country || ""})`;
            div.onclick = () => {
                selLat = c.latitude; selLon = c.longitude; selCity = c.name;
                document.getElementById("pl").value = c.name;
                document.getElementById("cInfo").innerText = `स्थान: ${c.name} (${selLat.toFixed(2)}°N, ${selLon.toFixed(2)}°E)`;
                list.style.display = "none";
            };
            list.appendChild(div);
        });
        list.style.display = "block";
    } catch (e) {}
}

function fillChartSVG(prefix, lagnaIdx, planetMap) {
    for (let h = 1; h <= 12; h++) {
        let rNum = ((lagnaIdx + h - 1) % 12) + 1;
        let rEl = document.getElementById(`${prefix}_r${h}`);
        let pEl = document.getElementById(`${prefix}_p${h}`);
        if (rEl) rEl.innerText = rNum;
        if (pEl) pEl.innerText = (planetMap[h] || []).join(" ");
    }
}

function buildAllKundlis() {
    let name = document.getElementById("un").value.trim() || "जातक";
    let dt = document.getElementById("dt").value;
    let tm = document.getElementById("tm").value;
    if (!dt || !tm) { alert("कृपया जन्म तारीख और समय भरें!"); return; }

    let dObj = new Date(`${dt}T${tm}:00`);
    let jDays = (dObj.getTime() / 86400000) - 10957.5;
    let ayanamsa = 23.85 + (jDays / 365.25) * 0.0139;

    let sunLon = (280.46 + 0.9856474 * jDays - ayanamsa + 3600) % 360;
    let moonLon = (218.32 + 13.176396 * jDays - ayanamsa + 3600) % 360;
    let marsLon = (355.45 + 0.5240207 * jDays - ayanamsa + 3600) % 360;
    let mercLon = (252.25 + 4.0923344 * jDays - ayanamsa + 3600) % 360;
    let jupLon = (34.40 + 0.0830853 * jDays - ayanamsa + 3600) % 360;
    let venLon = (181.98 + 1.6021302 * jDays - ayanamsa + 3600) % 360;
    let satLon = (49.94 + 0.0334442 * jDays - ayanamsa + 3600) % 360;
    let rahuLon = (125.04 - 0.0529538 * jDays - ayanamsa + 3600) % 360;
    let ketuLon = (rahuLon + 180) % 360;

    let hrs = dObj.getHours() + dObj.getMinutes() / 60;
    let lst = (sunLon + (hrs - 6) * 15 + (selLon - 82.5) + 360) % 360;
    let lagnaLon = (lst + (selLat - 23) * 0.25 + 360) % 360;

    let d1Lagna = Math.floor(lagnaLon / 30);
    let moonSign = Math.floor(moonLon / 30);
    let nakIdx = Math.floor(moonLon / (360 / 27));
    let nakName = nak27[nakIdx].split(" (")[0];

    let planets = [
        { n: "सू", lon: sunLon }, { n: "चं", lon: moonLon }, { n: "मं", lon: marsLon },
        { n: "बु", lon: mercLon }, { n: "गु", lon: jupLon }, { n: "शु", lon: venLon },
        { n: "श", lon: satLon }, { n: "रा", lon: rahuLon }, { n: "के", lon: ketuLon }
    ];

    let d1Map = {}, d9Map = {}, d10Map = {};
    let d9Lagna = Math.floor((lagnaLon * 9) / 30) % 12;
    let d10Lagna = Math.floor((lagnaLon * 10) / 30) % 12;

    planets.forEach(p => {
        let h1 = ((Math.floor(p.lon / 30) - d1Lagna + 12) % 12) + 1;
        (d1Map[h1] = d1Map[h1] || []).push(p.n);

        let r9 = Math.floor((p.lon * 9) / 30) % 12;
        let h9 = ((r9 - d9Lagna + 12) % 12) + 1;
        (d9Map[h9] = d9Map[h9] || []).push(p.n);

        let r10 = Math.floor((p.lon * 10) / 30) % 12;
        let h10 = ((r10 - d10Lagna + 12) % 12) + 1;
        (d10Map[h10] = d10Map[h10] || []).push(p.n);
    });

    fillChartSVG("d1", d1Lagna, d1Map);
    fillChartSVG("d9", d9Lagna, d9Map);
    fillChartSVG("d10", d10Lagna, d10Map);

    document.getElementById("kTxt").innerHTML = 
        `<b>नाम:</b> ${name} | <b>स्थान:</b> ${selCity}<br>` +
        `<b>लग्न:</b> ${rashiNames[d1Lagna]} | <b>चंद्र राशि:</b> ${rashiNames[moonSign]} | <b>जन्म नक्षत्र:</b> ${nakName}`;
    document.getElementById("kBox").style.display = "block";
}

