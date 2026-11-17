const defaultRashis = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];

let monthlyGocharData = JSON.parse(localStorage.getItem("adi_gochar")) || {
    "मेष": "शनि बारहवें भाव में वक्री है—खर्चों पर नियंत्रण रखें और धैर्य से काम लें।",
    "वृषभ": "लाभ भाव का शनि और पंचम के ग्रह करियर में नए अवसर और ज्ञान देंगे।",
    "मिथुन": "कर्म भाव का शनि मेहनत बढ़ाएगा, वाणी में संयम रखना बेहद ज़रूरी है।",
    "कर्क": "भाग्य स्थान का शनि धर्म-अध्यात्म में रुचि बढ़ाएगा और रुके काम बनाएगा।",
    "सिंह": "अष्टम भाव का वक्री शनि गहरी परीक्षा और आत्म-मंथन का समय दे रहा है।",
    "कन्या": "सप्तम भाव का शनि रिश्तों में गंभीरता और स्पष्ट संवाद की मांग कर रहा है।",
    "तुला": "छठे भाव का शनि विरोधियों पर विजय दिलाएगा, पर मानसिक तनाव से बचें।",
    "वृश्चिक": "पंचम भाव का शनि संतान, शिक्षा और पूर्वपुण्य के कर्मों का फल देगा।",
    "धनु": "चौथे भाव का शनि पारिवारिक जिम्मेदारियां बढ़ाएगा, धैर्य बनाए रखें।",
    "मकर": "तीसरे भाव का शनि पराक्रम और साहस बढ़ाएगा, यात्रा के योग बनेंगे।",
    "कुंभ": "दूसरे भाव का शनि धन संचय और परिवार के साथ वाणी में मधुरता मांगता है।",
    "मीन": "लग्न में वक्री शनि आत्म-सुधार, अनुशासन और जीवन में बड़े बदलाव लाएगा।"
};

function loadRashiGochar() {
    let sel = document.getElementById("rashiSelect");
    let out = document.getElementById("rashiGocharOut");
    if (!sel || !out) return;
    let r = sel.value;
    out.innerHTML = `<b>${r} राशि/लग्न का मासिक गोचर फल:</b><br>${monthlyGocharData[r]}`;
}

function saveAdminGochar() {
    let pin = prompt("एस्ट्रोलॉजर एडमिन पिन डालें (डिफ़ॉल्ट पिन: 1234):");
    if (pin !== "1234") {
        alert("गलत पिन! केवल एडमिन ही गोचर बदल सकते हैं।");
        return;
    }
    let r = document.getElementById("adminRashiSelect").value;
    let txt = document.getElementById("adminGocharInput").value.trim();
    if (!txt) { alert("कृपया गोचर फल लिखें!"); return; }
    monthlyGocharData[r] = txt;
    localStorage.setItem("adi_gochar", JSON.stringify(monthlyGocharData));
    loadRashiGochar();
    alert(r + " राशि का नया गोचर सेव हो गया है!");
}
