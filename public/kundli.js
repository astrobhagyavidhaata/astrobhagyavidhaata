
/*
 Astro Bhagya Vidhata
 Birth Details & Location Engine
 Vedic settings: Sidereal / Lahiri
*/

(() => {
  "use strict";

  const GEOCODING_URL =
    "https://geocoding-api.open-meteo.com/v1/search";

  const API_ENDPOINT = "/api/kundli";
  const signNames = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];

  const $ = (id) => document.getElementById(id);

  const CHART_TRANSLATIONS = {
    en:{labels:["Birth ascendant","Moon sign","House","Planet","Sign","Nakshatra","Pada","Ascendant","Nakshatra lord"],planets:["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"],signs:["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]},
    hi:{labels:["जन्म लग्न","चंद्र राशि","भाव","ग्रह","राशि","नक्षत्र","चरण","लग्न","नक्षत्र स्वामी"],planets:["सूर्य","चंद्र","मंगल","बुध","गुरु","शुक्र","शनि","राहु","केतु"],signs:["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]},
    pa:{labels:["ਜਨਮ ਲਗਨ","ਚੰਦਰ ਰਾਸ਼ੀ","ਭਾਵ","ਗ੍ਰਹਿ","ਰਾਸ਼ੀ","ਨਕਸ਼ਤਰ","ਚਰਨ","ਲਗਨ","ਨਕਸ਼ਤਰ ਸਵਾਮੀ"],planets:["ਸੂਰਜ","ਚੰਦਰਮਾ","ਮੰਗਲ","ਬੁੱਧ","ਗੁਰੂ","ਸ਼ੁੱਕਰ","ਸ਼ਨੀ","ਰਾਹੂ","ਕੇਤੂ"],signs:["ਮੇਖ","ਬ੍ਰਿਖ","ਮਿਥੁਨ","ਕਰਕ","ਸਿੰਘ","ਕੰਨਿਆ","ਤੁਲਾ","ਬ੍ਰਿਸ਼ਚਕ","ਧਨੁ","ਮਕਰ","ਕੁੰਭ","ਮੀਨ"]},
    mr:{labels:["जन्म लग्न","चंद्र राशी","भाव","ग्रह","राशी","नक्षत्र","चरण","लग्न","नक्षत्र स्वामी"],planets:["सूर्य","चंद्र","मंगळ","बुध","गुरू","शुक्र","शनी","राहू","केतू"],signs:["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तूळ","वृश्चिक","धनु","मकर","कुंभ","मीन"]},
    gu:{labels:["જન્મ લગ્ન","ચંદ્ર રાશિ","ભાવ","ગ્રહ","રાશિ","નક્ષત્ર","ચરણ","લગ્ન","નક્ષત્ર સ્વામી"],planets:["સૂર્ય","ચંદ્ર","મંગળ","બુધ","ગુરુ","શુક્ર","શનિ","રાહુ","કેતુ"],signs:["મેષ","વૃષભ","મિથુન","કર્ક","સિંહ","કન્યા","તુલા","વૃશ્ચિક","ધનુ","મકર","કુંભ","મીન"]},
    bn:{labels:["জন্মলগ্ন","চন্দ্ররাশি","ভাব","গ্রহ","রাশি","নক্ষত্র","পদ","লগ্ন","নক্ষত্র অধিপতি"],planets:["সূর্য","চন্দ্র","মঙ্গল","বুধ","বৃহস্পতি","শুক্র","শনি","রাহু","কেতু"],signs:["মেষ","বৃষ","মিথুন","কর্কট","সিংহ","কন্যা","তুলা","বৃশ্চিক","ধনু","মকর","কুম্ভ","মীন"]},
    ta:{labels:["பிறப்பு லக்னம்","சந்திர ராசி","பாவம்","கிரகம்","ராசி","நட்சத்திரம்","பாதம்","லக்னம்","நட்சத்திர அதிபதி"],planets:["சூரியன்","சந்திரன்","செவ்வாய்","புதன்","குரு","சுக்கிரன்","சனி","ராகு","கேது"],signs:["மேஷம்","ரிஷபம்","மிதுனம்","கடகம்","சிம்மம்","கன்னி","துலாம்","விருச்சிகம்","தனுசு","மகரம்","கும்பம்","மீனம்"]},
    te:{labels:["జన్మ లగ్నం","చంద్ర రాశి","భావం","గ్రహం","రాశి","నక్షత్రం","పాదం","లగ్నం","నక్షత్ర అధిపతి"],planets:["సూర్యుడు","చంద్రుడు","కుజుడు","బుధుడు","గురుడు","శుక్రుడు","శని","రాహు","కేతు"],signs:["మేషం","వృషభం","మిథునం","కర్కాటకం","సింహం","కన్య","తుల","వృశ్చికం","ధనుస్సు","మకరం","కుంభం","మీనం"]},
    kn:{labels:["ಜನ್ಮ ಲಗ್ನ","ಚಂದ್ರ ರಾಶಿ","ಭಾವ","ಗ್ರಹ","ರಾಶಿ","ನಕ್ಷತ್ರ","ಪಾದ","ಲಗ್ನ","ನಕ್ಷತ್ರ ಅಧಿಪತಿ"],planets:["ಸೂರ್ಯ","ಚಂದ್ರ","ಮಂಗಳ","ಬುಧ","ಗುರು","ಶುಕ್ರ","ಶನಿ","ರಾಹು","ಕೇತು"],signs:["ಮೇಷ","ವೃಷಭ","ಮಿಥುನ","ಕರ್ಕಾಟಕ","ಸಿಂಹ","ಕನ್ಯಾ","ತುಲಾ","ವೃಶ್ಚಿಕ","ಧನು","ಮಕರ","ಕುಂಭ","ಮೀನ"]},
    ml:{labels:["ജന്മ ലഗ്നം","ചന്ദ്ര രാശി","ഭാവം","ഗ്രഹം","രാശി","നക്ഷത്രം","പാദം","ലഗ്നം","നക്ഷത്രാധിപൻ"],planets:["സൂര്യൻ","ചന്ദ്രൻ","ചൊവ്വ","ബുധൻ","വ്യാഴം","ശുക്രൻ","ശനി","രാഹു","കേതു"],signs:["മേടം","ഇടവം","മിഥുനം","കർക്കടകം","ചിങ്ങം","കന്നി","തുലാം","വൃശ്ചികം","ധനു","മകരം","കുംഭം","മീനം"]},
    ur:{labels:["پیدائشی لگن","قمری برج","بھاؤ","سیارہ","برج","نکشتر","پد","لگن","نکشتر کا حاکم"],planets:["سورج","چاند","مریخ","عطارد","مشتری","زہرہ","زحل","راہو","کیتو"],signs:["حمل","ثور","جوزا","سرطان","اسد","سنبلہ","میزان","عقرب","قوس","جدی","دلو","حوت"]},
    fr:{labels:["Ascendant natal","Signe lunaire","Maison","Planète","Signe","Nakshatra","Pada","Ascendant","Maître du nakshatra"],planets:["Soleil","Lune","Mars","Mercure","Jupiter","Vénus","Saturne","Rahu","Ketu"],signs:["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"]},
    "fr-CA":{labels:["Ascendant natal","Signe lunaire","Maison","Planète","Signe","Nakshatra","Pada","Ascendant","Maître du nakshatra"],planets:["Soleil","Lune","Mars","Mercure","Jupiter","Vénus","Saturne","Rahu","Ketu"],signs:["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"]},
    de:{labels:["Geburtsaszendent","Mondzeichen","Haus","Planet","Zeichen","Nakshatra","Pada","Aszendent","Nakshatra-Herrscher"],planets:["Sonne","Mond","Mars","Merkur","Jupiter","Venus","Saturn","Rahu","Ketu"],signs:["Widder","Stier","Zwillinge","Krebs","Löwe","Jungfrau","Waage","Skorpion","Schütze","Steinbock","Wassermann","Fische"]},
    es:{labels:["Ascendente natal","Signo lunar","Casa","Planeta","Signo","Nakshatra","Pada","Ascendente","Regente del nakshatra"],planets:["Sol","Luna","Marte","Mercurio","Júpiter","Venus","Saturno","Rahu","Ketu"],signs:["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"]},
    "pt-BR":{labels:["Ascendente natal","Signo lunar","Casa","Planeta","Signo","Nakshatra","Pada","Ascendente","Regente do nakshatra"],planets:["Sol","Lua","Marte","Mercúrio","Júpiter","Vênus","Saturno","Rahu","Ketu"],signs:["Áries","Touro","Gêmeos","Câncer","Leão","Virgem","Libra","Escorpião","Sagitário","Capricórnio","Aquário","Peixes"]},
    "ar-SA":{labels:["الطالع الأصلي","البرج القمري","البيت","الكوكب","البرج","الناكشاترا","بادا","الطالع","حاكم الناكشاترا"],planets:["الشمس","القمر","المريخ","عطارد","المشتري","الزهرة","زحل","راهو","كيتو"],signs:["الحمل","الثور","الجوزاء","السرطان","الأسد","العذراء","الميزان","العقرب","القوس","الجدي","الدلو","الحوت"]},
    or:{labels:["ଜନ୍ମ ଲଗ୍ନ","ଚନ୍ଦ୍ର ରାଶି","ଭାବ","ଗ୍ରହ","ରାଶି","ନକ୍ଷତ୍ର","ପାଦ","ଲଗ୍ନ","ନକ୍ଷତ୍ର ଅଧିପତି"],planets:["ସୂର୍ଯ୍ୟ","ଚନ୍ଦ୍ର","ମଙ୍ଗଳ","ବୁଧ","ବୃହସ୍ପତି","ଶୁକ୍ର","ଶନି","ରାହୁ","କେତୁ"],signs:["ମେଷ","ବୃଷ","ମିଥୁନ","କର୍କଟ","ସିଂହ","କନ୍ୟା","ତୁଳା","ବିଛା","ଧନୁ","ମକର","କୁମ୍ଭ","ମୀନ"]},
    as:{labels:["জন্ম লগ্ন","চন্দ্ৰ ৰাশি","ভাৱ","গ্ৰহ","ৰাশি","নক্ষত্ৰ","পদ","লগ্ন","নক্ষত্ৰৰ অধিপতি"],planets:["সূৰ্য","চন্দ্ৰ","মঙ্গল","বুধ","বৃহস্পতি","শুক্ৰ","শনি","ৰাহু","কেতু"],signs:["মেষ","বৃষ","মিথুন","কৰ্কট","সিংহ","কন্যা","তুলা","বৃশ্চিক","ধনু","মকৰ","কুম্ভ","মীন"]},
    "en-CA":{labels:["Birth ascendant","Moon sign","House","Planet","Sign","Nakshatra","Pada","Ascendant","Nakshatra lord"],planets:["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"],signs:["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]}
  };
  const I18N_DICT = {
    en: {
      nakshatras: {"अश्विनी":"Ashwini","भरणी":"Bharani","कृत्तिका":"Krittika","रोहिणी":"Rohini","मृगशिरा":"Mrigashira","मृगशीर्ष":"Mrigashira","आर्द्रा":"Ardra","पुनर्वसु":"Punarvasu","पुष्य":"Pushya","आश्लेषा":"Ashlesha","मघा":"Magha","पूर्वा फाल्गुनी":"Purva Phalguni","पूर्वाफाल्गुनी":"Purva Phalguni","उत्तरा फाल्गुनी":"Uttara Phalguni","उत्तराफाल्गुनी":"Uttara Phalguni","हस्त":"Hasta","चित्रा":"Chitra","स्वाति":"Swati","स्वाती":"Swati","विशाखा":"Vishakha","अनुराधा":"Anuradha","ज्येष्ठा":"Jyeshtha","मूल":"Mula","पूर्वाषाढ़ा":"Purva Ashadha","उत्तराषाढ़ा":"Uttara Ashadha","श्रवण":"Shravana","धनिष्ठा":"Dhanishta","शतभिषा":"Shatabhisha","पूर्वाभाद्रपद":"Purva Bhadrapada","उत्तराभाद्रपद":"Uttara Bhadrapada","रेवती":"Revati"},
      words: {"लग्न":"Ascendant","नक्षत्र":"Nakshatra","चरण":"Pada","महादशा":"Mahadasha","अंतर्दशा":"Antardasha","अंतरदशा":"Antardasha","प्रत्यंतरदशा":"Pratyantardasha","भाव":"House","राशि":"Sign","ग्रह":"Planet","वर्तमान":"Current","आरंभ":"Start","समाप्ति":"End","से":"to"}
    }
  };

  const PLANET_KEYS=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
  const PLANET_HINDI=["सूर्य","चंद्र","मंगल","बुध","गुरु","शुक्र","शनि","राहु","केतु"];
  const SIGN_KEYS=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const SIGN_HINDI=["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
  function selectedChartLanguage() {
    return String(window.AstroLanguage?.get?.() || $("preferredLanguage")?.value || document.documentElement.lang || "en");
  }
  function chartLocale() {
    const language=selectedChartLanguage();
    return CHART_TRANSLATIONS[language] || CHART_TRANSLATIONS[language.split("-")[0]] || CHART_TRANSLATIONS.en;
  }
  // Escape translation keys before building dynamic word-boundary regexes.
  function chartWordPattern(word) {
    const escaped=String(word).replace(/[|\\{}()[\]^$+*?.]/g,"\\$&");
    return new RegExp("\\b"+escaped+"\\b","gi");
  }
  function localizeChartText(value) {");\n    return new RegExp("\\\\b"+escaped+"\\\\b","gi");\n  }\n  function localizeChartText(value) {
    const locale=chartLocale();
    const language=selectedChartLanguage().split("-")[0];
    let result=String(value ?? "");
    for(let i=0;i<PLANET_KEYS.length;i++) {
      result=result.replace(chartWordPattern(PLANET_KEYS[i]),locale.planets[i]);
      result=result.split(PLANET_HINDI[i]).join(locale.planets[i]);
    }
    for(let i=0;i<SIGN_KEYS.length;i++) {
      result=result.replace(chartWordPattern(SIGN_KEYS[i]),locale.signs[i]);
      result=result.split(SIGN_HINDI[i]).join(locale.signs[i]);
    }
    if(language==="en") {
      for(const [source,target] of Object.entries(I18N_DICT.en.nakshatras)) result=result.split(source).join(target);
      for(const [source,target] of Object.entries(I18N_DICT.en.words)) result=result.split(source).join(target);
      result=result.replace(/चरण\s*(\d+)/g,"Pada $1");
      result=result.replace(/(\d+)वाँ/g,(_,n)=>{const v=Number(n),suffix=v%100>=11&&v%100<=13?"th":v%10===1?"st":v%10===2?"nd":v%10===3?"rd":"th";return v+suffix;});
    } else if(window.AstroLanguage?.translate) {
      result=window.AstroLanguage.translate(result);
    }
    const common={House:locale.labels[2],Planet:locale.labels[3],Sign:locale.labels[4],Nakshatra:locale.labels[5],Pada:locale.labels[6],Ascendant:locale.labels[7]};
    for(const [word,translation] of Object.entries(common)) result=result.replace(chartWordPattern(word),translation);
    return result;
  }


  function showMessage(message, error = false) {
    const box = $("message");
    if (!box) return;

    box.style.display = "block";
    box.classList.remove("message-success");
    box.style.color = error ? "#ffb4ab" : "#f5d994";
    box.textContent = message;
  }

  function renderMainKundliChart(chart) {
    const host=$("chartCards"), nav=$("mainChartSlot");
    if(!host||!nav||!chart?.d1?.ascendant||!chart?.d9?.ascendant)return;
    host.replaceChildren();
    const signs=chartLocale().signs;
    const ascendantIndex=Number(chart.d1.ascendant.rashiIndex);
    const moonIndex=Number(chart.d1.planets?.चंद्र?.rashiIndex);
    let summary=$("chartBirthSummary");
    if(!summary){summary=document.createElement("p");summary.id="chartBirthSummary";summary.className="chart-asc";nav.insertBefore(summary,host);}
    const ascendantName=Number.isInteger(ascendantIndex)&&ascendantIndex>=0&&ascendantIndex<12?signs[ascendantIndex]:"राशि उपलब्ध नहीं";
    const moonName=Number.isInteger(moonIndex)&&moonIndex>=0&&moonIndex<12?signs[moonIndex]:"राशि उपलब्ध नहीं";
    summary.textContent=chartLocale().labels[0]+": "+localizeChartText(SIGN_KEYS[ascendantIndex]||ascendantName)+" | "+chartLocale().labels[1]+": "+localizeChartText(SIGN_KEYS[moonIndex]||moonName);
    const moon=chart.d1.planets?.चंद्र;
    const moonAsc=Number(moon?.rashiIndex);
    const moonPlanets=Object.fromEntries(Object.entries(chart.d1.planets||{}).map(([name,p])=>[name,{...p,house:((Number(p.rashiIndex)-moonAsc+12)%12)+1}]));
    const specs=[
      {id:"chartD1",title:"D1 — जन्म कुंडली",asc:Number(chart.d1.ascendant.rashiIndex),planets:chart.d1.planets||{}},
      {id:"chartD9",title:"D9 — नवांश कुंडली",asc:Number(chart.d9.ascendant.rashiIndex),planets:chart.d9.planets||{}},
      {id:"chartMoon",title:"चंद्र कुंडली",asc:moonAsc,planets:moonPlanets}
    ];
    for(const spec of specs){
      if(!Number.isInteger(spec.asc)||spec.asc<0||spec.asc>11)continue;
      const card=document.createElement("section");card.className="chart-card";card.id=spec.id;
      const heading=document.createElement("h3");heading.textContent=spec.title;card.appendChild(heading);
      const occupants={};
      for(const [planet,p] of Object.entries(spec.planets)){const house=Number(p.house);if(Number.isInteger(house)&&house>=1&&house<=12)(occupants[house]||=[]).push(localizeChartText(planet));}
      const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
      svg.setAttribute("viewBox","0 0 400 400");svg.setAttribute("role","img");svg.setAttribute("aria-label",spec.title);
      const line=(x1,y1,x2,y2)=>{const el=document.createElementNS(ns,"line");for(const [k,v] of Object.entries({x1,y1,x2,y2}))el.setAttribute(k,v);el.setAttribute("stroke","#875b2b");el.setAttribute("stroke-width","2");svg.appendChild(el);};
      const border=document.createElementNS(ns,"rect");for(const [k,v] of Object.entries({x:2,y:2,width:396,height:396,fill:"none",stroke:"#875b2b","stroke-width":3}))border.setAttribute(k,v);svg.appendChild(border);
      line(2,2,398,398);line(398,2,2,398);line(200,2,398,200);line(398,200,200,398);line(200,398,2,200);line(2,200,200,2);
      const pos=[[200,100],[100,34],[34,100],[100,200],[34,300],[100,366],[200,300],[300,366],[366,300],[300,200],[366,100],[300,34]];
      for(let house=1;house<=12;house++){
        const [x,y]=pos[house-1],sign=(spec.asc+house-1)%12,g=document.createElementNS(ns,"g");
        const s=document.createElementNS(ns,"text");s.setAttribute("x",x);s.setAttribute("y",y-9);s.setAttribute("text-anchor","middle");s.setAttribute("font-size","12");s.setAttribute("font-weight","bold");s.setAttribute("fill","#4b2d16");s.textContent=localizeChartText(signs[sign])+" "+(sign+1);
        const ptext=document.createElementNS(ns,"text");ptext.setAttribute("x",x);ptext.setAttribute("y",y+9);ptext.setAttribute("text-anchor","middle");ptext.setAttribute("font-size","10");ptext.setAttribute("font-weight","600");ptext.setAttribute("fill","#9a421d");
        const names=occupants[house]||[];for(let i=0;i<names.length;i+=2){const span=document.createElementNS(ns,"tspan");span.setAttribute("x",x);span.setAttribute("dy",i===0?"0":"11");span.textContent=localizeChartText(names.slice(i,i+2).join(" "));ptext.appendChild(span);}
        g.append(s,ptext);svg.appendChild(g);
      }
      card.appendChild(svg);const asc=document.createElement("p");asc.className="chart-asc";asc.textContent="लग्न: "+localizeChartText(signs[spec.asc])+" ("+(spec.asc+1)+")";card.appendChild(asc);host.appendChild(card);
    }
    const panel=$("planetNakshatra");
    if(panel){
      panel.replaceChildren();
      const heading=document.createElement("h3");
      heading.textContent=chartLocale().labels[3]+" — "+chartLocale().labels[5]+" / "+chartLocale().labels[2];
      heading.style.cssText="margin:2px 0 6px;color:#f5c66b;font-size:16px";
      const note=document.createElement("p");
      note.textContent="D1 · "+chartLocale().labels[3]+", "+chartLocale().labels[4]+", "+chartLocale().labels[2]+", "+chartLocale().labels[5]+", "+chartLocale().labels[6];
      note.style.cssText="margin:0 0 10px;color:#d4c9e5;font-size:12px;line-height:1.5";
      panel.append(heading,note);
      const table=document.createElement("table"),thead=document.createElement("thead"),trh=document.createElement("tr");
      [chartLocale().labels[3],chartLocale().labels[4],chartLocale().labels[2],"°",chartLocale().labels[5],chartLocale().labels[6],chartLocale().labels[8]].forEach(label=>{const th=document.createElement("th");th.textContent=label;trh.appendChild(th);});
      thead.appendChild(trh);table.appendChild(thead);
      const tbody=document.createElement("tbody");
      const nakshatraLords=["केतु","शुक्र","सूर्य","चंद्र","मंगल","राहु","गुरु","शनि","बुध"];
      const rows=[["लग्न",chart.d1.ascendant||{}],...Object.entries(chart.d1.planets||{})];
      for(const [planet,p] of rows){
        const degree=Number(p.degreeInRashi);
        const degreeText=Number.isFinite(degree)?degree.toFixed(2)+"°":"—";
        const pada=Number(p.pada);
        const padaText=Number.isInteger(pada)&&pada>=1&&pada<=4?localizeChartText("चरण "+pada):"—";
        const house=Number(p.house);
        const houseText=Number.isInteger(house)&&house>=1&&house<=12?localizeChartText(house+"वाँ"):"—";
        const nakshatraIndex=Number(p.nakshatraIndex);
        const nakshatraLord=Number.isInteger(nakshatraIndex)&&nakshatraIndex>=0&&nakshatraIndex<27?nakshatraLords[nakshatraIndex%9]:"—";
        const planetText=localizeChartText(planet)+(p.retrograde?" ℞":"");
        const values=[planetText,localizeChartText(p.rashi||signs[p.rashiIndex]||"—"),houseText,degreeText,localizeChartText(p.nakshatra||"—"),padaText,localizeChartText(nakshatraLord)];
        const tr=document.createElement("tr");
        values.forEach(value=>{const td=document.createElement("td");td.textContent=String(value);tr.appendChild(td);});
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);panel.appendChild(table);
    }
    nav.querySelectorAll("[data-chart-target]").forEach(button=>{
      button.onclick=()=>{
        nav.querySelectorAll("[data-chart-target]").forEach(item=>item.classList.toggle("active",item===button));
        const target=button.dataset.chartTarget;
        if(target==="planetNakshatra"){const panel=$("planetNakshatra");panel.hidden=!panel.hidden;if(!panel.hidden)panel.scrollIntoView({behavior:"smooth",block:"nearest"});return;}
        const card=$(target);if(card)card.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});
      };
    });
  }

  function renderAstrologyCalculations(chart) {
    let activeMD = null;
    let activeAD = null;
    let activePD = null;
    const root=$("jyotishCalculations");
    if(!root)return;
    root.replaceChildren();
    const tabs=$("kundliDetailTabs");
    if(tabs)tabs.replaceChildren();
    let firstPage=true;
    const makeFolder=(title,id)=>{
      const d=document.createElement("section");
      d.className="calculation-page"+(firstPage?" active":"");
      d.id=id;
      const heading=document.createElement("h3");heading.textContent=title;d.appendChild(heading);
      if(tabs){
        const button=document.createElement("button");button.type="button";button.textContent=title.replace(/^[0-9]+[.]/,"").trim();
        button.setAttribute("role","tab");button.setAttribute("aria-selected",String(firstPage));
        button.addEventListener("click",()=>{
          root.querySelectorAll(".calculation-page").forEach(page=>page.classList.toggle("active",page===d));
          tabs.querySelectorAll("button").forEach(tab=>tab.setAttribute("aria-selected",String(tab===button)));
          button.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
        });
        tabs.appendChild(button);
      }
      root.appendChild(d);firstPage=false;return d;
    };
    const addNote=(host,message)=>{const p=document.createElement("p");p.className="chat-info";p.textContent=message;host.appendChild(p);};
    const tara=makeFolder("1. नवतारा चक्र और वर्तमान तारा बल","navtaraFolder");
    tara.open=true;
    const current=chart.currentTaraBala;
    if(current){
      const p=document.createElement("p");p.className="chat-info";
      p.textContent="जन्म नक्षत्र: "+current.birthNakshatra+" | वर्तमान चंद्र नक्षत्र: "+current.transitNakshatra+" | गिनती: "+current.countFromBirth+" | "+current.name+" ("+current.nature+")";
      tara.appendChild(p);
    } else addNote(tara,"वर्तमान गोचर तारा-बल का डेटा उपलब्ध नहीं है।");
    const taraRows=Array.isArray(chart.taraChart)?chart.taraChart:[];
    if(taraRows.length){
      const table=document.createElement("div");table.className="nakshatra-panel";
      const title=document.createElement("h4");title.textContent="27 नक्षत्रों का नवतारा चक्र";title.style.cssText="margin:4px 0 10px;color:#f5c66b";table.appendChild(title);
      const grid=document.createElement("div");grid.style.cssText="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px";
      const groups=new Map();
      taraRows.forEach(row=>{const key=row.name||"अन्य";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);});
      for(const [name,rows] of groups){
        rows.sort((a,b)=>Number(a.countFromBirth)-Number(b.countFromBirth));
        const active=current?.name===name;
        const cell=document.createElement("div");
        cell.style.cssText="padding:9px 6px;border:1px solid "+(active?"#e7b84e":"#66547f")+";border-radius:8px;background:"+(active?"#49351d":"#181326")+";text-align:center;min-width:0";
        const heading=document.createElement("strong");heading.textContent=name;heading.style.cssText="display:block;color:#f5d994;font-size:12px";
        const nature=document.createElement("small");nature.textContent=rows[0]?.nature||"—";nature.style.cssText="display:block;color:#f5c66b;font-size:10px;margin:4px 0";
        const nak=document.createElement("span");nak.textContent=rows.map(row=>row.nakshatra).join(" · ");nak.style.cssText="display:block;color:#d4c9e5;font-size:10px;line-height:1.5;overflow-wrap:anywhere";
        cell.append(heading,nature,nak);grid.appendChild(cell);
      }
      table.appendChild(grid);tara.appendChild(table);
    } else addNote(tara,"नवतारा तालिका की गणना उपलब्ध नहीं है।");

    const dashaFolder=makeFolder("2. महादशा – अंतर्दशा – प्रत्यंतरदशा","vimshottariFolder");
    const dasha=chart.dasha;
    if(dasha){
      const active=dasha.current||{};
      activeMD=active.mahadasha||null;
      activeAD=active.antardasha||null;
      activePD=active.pratyantardasha||null;
      const p=document.createElement("p");p.className="chat-info";
      p.textContent="वर्तमान दशा: "+(active.mahadasha||"—")+" महादशा / "+(active.antardasha||"—")+" अंतर्दशा / "+(active.pratyantardasha||"—")+" प्रत्यंतरदशा";
      dashaFolder.appendChild(p);
      const dates=document.createElement("p");dates.className="chat-info";
      dates.textContent="महादशा: "+(active.mahadashaStart?new Date(active.mahadashaStart).toLocaleDateString(window.AstroLanguage?.get?.() || document.documentElement.lang || "en"):"—")+" से "+(active.mahadashaEnd?new Date(active.mahadashaEnd).toLocaleDateString(window.AstroLanguage?.get?.() || document.documentElement.lang || "en"):"—")+" | अंतर्दशा: "+(active.antardashaStart?new Date(active.antardashaStart).toLocaleDateString(window.AstroLanguage?.get?.() || document.documentElement.lang || "en"):"—")+" से "+(active.antardashaEnd?new Date(active.antardashaEnd).toLocaleDateString(window.AstroLanguage?.get?.() || document.documentElement.lang || "en"):"—");
      dashaFolder.appendChild(dates);
      const periodDate=value=>value?new Date(value).toLocaleDateString(window.AstroLanguage?.get?.() || document.documentElement.lang || "en",{day:"2-digit",month:"short",year:"numeric"}):"—";
      const periodRange=(item)=>periodDate(item.start)+" से "+periodDate(item.end);
      const activeBox=document.createElement("div");activeBox.className="dasha-current-card";
      activeBox.innerHTML="";
      const activeTitle=document.createElement("h4");activeTitle.textContent="अभी चल रही विंशोत्तरी दशा";activeBox.appendChild(activeTitle);
      const activeGrid=document.createElement("div");activeGrid.className="dasha-current-grid";
      [[ "महादशा",activeMD,active.mahadashaStart,active.mahadashaEnd ],["अंतरदशा",activeAD,active.antardashaStart,active.antardashaEnd],["प्रत्यंतरदशा",activePD,active.pratyantardashaStart,active.pratyantardashaEnd]].forEach(([label,planet,start,end])=>{
        const item=document.createElement("div");item.className="dasha-current-item";
        const name=document.createElement("strong");name.textContent=label;const value=document.createElement("span");value.textContent=localizeChartText(planet||"—");
        const range=document.createElement("small");range.textContent=periodDate(start)+" – "+periodDate(end);
        item.append(name,value,range);activeGrid.appendChild(item);
      });
      activeBox.appendChild(activeGrid);dashaFolder.appendChild(activeBox);
      const scheduleTitle=document.createElement("h4");scheduleTitle.textContent="पूरी महादशा एवं अंतरदशा समय-सारणी";dashaFolder.appendChild(scheduleTitle);
      const schedule=Array.isArray(dasha.mahadashas)?dasha.mahadashas:[];
      if(schedule.length){
        schedule.forEach(mdItem=>{
          const mdDetails=document.createElement("details");mdDetails.className="dasha-period";
          const mdSummary=document.createElement("summary");mdSummary.textContent=localizeChartText(mdItem.planet)+" महादशा  •  "+periodRange(mdItem)+(mdItem.planet===activeMD?"  |  अभी चल रही":"");
          mdDetails.appendChild(mdSummary);
          const adList=document.createElement("div");adList.className="dasha-subperiod-list";
          (mdItem.antardashas||[]).forEach(adItem=>{
            const adDetails=document.createElement("details");adDetails.className="dasha-subperiod";
            const adSummary=document.createElement("summary");adSummary.textContent=localizeChartText(mdItem.planet)+" / "+localizeChartText(adItem.planet)+"  •  "+periodRange(adItem)+(mdItem.planet===activeMD&&adItem.planet===activeAD?"  |  वर्तमान":"");
            adDetails.appendChild(adSummary);
            const pdTable=document.createElement("table");pdTable.className="dasha-date-table";
            const head=document.createElement("tr");["प्रत्यंतरदशा","आरंभ","समाप्ति"].forEach(label=>{const th=document.createElement("th");th.textContent=label;head.appendChild(th);});pdTable.appendChild(head);
            (adItem.pratyantardashas||[]).forEach(pdItem=>{
              const row=document.createElement("tr");
              [localizeChartText(pdItem.planet),periodDate(pdItem.start),periodDate(pdItem.end)].forEach((value,index)=>{const cell=document.createElement("td");cell.textContent=value;row.appendChild(cell);});
              if(mdItem.planet===activeMD&&adItem.planet===activeAD&&pdItem.planet===activePD)row.className="dasha-active-row";
              pdTable.appendChild(row);
            });
            adDetails.appendChild(pdTable);adList.appendChild(adDetails);
          });
          mdDetails.appendChild(adList);
          mdDetails.open=false;
          adList.querySelectorAll("details").forEach(adDetails=>{adDetails.open=false;});
          dashaFolder.appendChild(mdDetails);
        });
      } else addNote(dashaFolder,"विंशोत्तरी दशा की पूरी समय-सारणी उपलब्ध नहीं है।");
      const nakNames=["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वाभाद्रपद","उत्तराभाद्रपद","रेवती"];
      const nakLords=["केतु","शुक्र","सूर्य","चंद्र","मंगल","राहु","गुरु","शनि","बुध"];
      const houseThemes=["स्वभाव, शरीर और जीवन-दिशा","धन, वाणी और परिवार","साहस, प्रयास और छोटे भाई-बहन","माता, घर, सुख और संपत्ति","संतान, शिक्षा, बुद्धि और रचनात्मकता","ऋण, रोग, प्रतियोगिता और सेवा","विवाह, साझेदारी और सार्वजनिक संबंध","परिवर्तन, शोध, गोपनीयता और साझा संसाधन","भाग्य, धर्म, गुरु और उच्च शिक्षा","कर्म, पेशा, प्रतिष्ठा और जिम्मेदारी","लाभ, आय, मित्र और इच्छापूर्ति","व्यय, विदेश, एकांत और आध्यात्मिकता"];
      const planetThemes={सूर्य:"आत्मविश्वास, पिता, नेतृत्व और अधिकार",चंद्र:"मन, माता, भावनाएँ और जनसंपर्क",मंगल:"ऊर्जा, साहस, भूमि और प्रतिस्पर्धा",बुध:"बुद्धि, संवाद, व्यापार और विश्लेषण",गुरु:"ज्ञान, गुरु, संतान, विस्तार और मार्गदर्शन",शुक्र:"प्रेम, विवाह, कला, सुख और सुविधा",शनि:"अनुशासन, श्रम, देरी, जिम्मेदारी और स्थायित्व",राहु:"महत्वाकांक्षा, असामान्य अनुभव, तकनीक और विदेशी संपर्क",केतु:"वैराग्य, शोध, आध्यात्मिकता और अलगाव"};
      const planetData=chart.d1?.planets||{};
      const describeLord=(planet)=>{
        const p=planetData[planet]||{};
        const ni=Number.isInteger(Number(p.nakshatraIndex))?Number(p.nakshatraIndex):nakNames.indexOf(p.nakshatra);
        const lord=ni>=0?nakLords[ni%9]:"—";
        const house=Number(p.house);
        return {planet,sign:localizeChartText(p.rashi||signNames[Number(p.rashiIndex)]||"—"),house:Number.isInteger(house)&&house>=1&&house<=12?house:null,nak:localizeChartText(p.nakshatra||"—"),pada:localizeChartText(p.pada||"—"),nakLord:lord,retrograde:!!p.retrograde};
      };
      const currentLords=[describeLord(active.mahadasha),describeLord(active.antardasha),describeLord(active.pratyantardasha)].filter(x=>x.planet&&x.planet!=="null");
      if(currentLords.length){
        const info=document.createElement("div");info.className="nakshatra-panel";
        const infoTitle=document.createElement("h4");infoTitle.textContent="वर्तमान दशा-स्वामियों की जन्म-कुंडली स्थिति";info.appendChild(infoTitle);
        const infoTable=document.createElement("table");
        const infoHead=document.createElement("tr");["दशा स्तर","ग्रह","राशि / भाव","नक्षत्र / चरण","नक्षत्र स्वामी","स्वामी की स्थिति"].forEach(v=>{const th=document.createElement("th");th.textContent=v;infoHead.appendChild(th);});infoTable.appendChild(infoHead);
        const lordPlacement=(name)=>{
          const q=planetData[name]||{};
          const qHouse=Number(q.house);
          return {sign:localizeChartText(q.rashi||signNames[Number(q.rashiIndex)]||"—"),house:Number.isInteger(qHouse)&&qHouse>=1&&qHouse<=12?qHouse:null,nak:localizeChartText(q.nakshatra||"—"),pada:localizeChartText(q.pada||"—")};
        };
        currentLords.forEach((x,index)=>{
          const nakLordInfo=lordPlacement(x.nakLord);
          const tr=document.createElement("tr");
          const vals=[["महादशा","अंतरदशा","प्रत्यंतरदशा"][index]||"दशा",x.planet+(x.retrograde?" ℞":""),x.sign+(x.house?" / "+x.house+"वाँ भाव":""),x.nak+" / "+(x.pada||"—"),x.nakLord,nakLordInfo.sign+(nakLordInfo.house?" / "+nakLordInfo.house+"वाँ भाव":"")+" • "+nakLordInfo.nak+" "+nakLordInfo.pada];
          vals.forEach(v=>{const td=document.createElement("td");td.textContent=String(v);tr.appendChild(td);});infoTable.appendChild(tr);
        });
        info.appendChild(infoTable);
        const chainNote=document.createElement("p");chainNote.className="chat-info";chainNote.textContent="ऊपर प्रत्येक दशा-स्वामी के जन्म नक्षत्र के स्वामी की राशि, भाव और नक्षत्र भी दिखाए गए हैं।";info.appendChild(chainNote);
        dashaFolder.appendChild(info);
        const md= currentLords[0], ad=currentLords[1];
      }

      const timeline=document.createElement("div");timeline.className="nakshatra-panel";
      const timelineTitle=document.createElement("h4");timelineTitle.textContent="विंशोत्तरी महादशा समय-रेखा";timelineTitle.style.cssText="color:#f5c66b;margin:4px 0 8px";timeline.appendChild(timelineTitle);
      const table=document.createElement("table");table.style.cssText="width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap";
      const header=document.createElement("tr");["महादशा","आरंभ","समाप्ति","अंतर्दशाएँ"].forEach(v=>{const th=document.createElement("th");th.textContent=v;th.style.cssText="text-align:left;padding:7px;color:#f5d994";header.appendChild(th);});table.appendChild(header);
      const fmt=v=>v?new Date(v).toLocaleDateString(window.AstroLanguage?.get?.() || document.documentElement.lang || "en"):"—";
      const appendPeriodBar=(host,periods,label)=>{
        const valid=(periods||[]).map(period=>({...period,startMs:new Date(period.start).getTime(),endMs:new Date(period.end).getTime()}))
          .filter(period=>Number.isFinite(period.startMs)&&Number.isFinite(period.endMs)&&period.endMs>period.startMs);
        if(!valid.length)return;
        const wrap=document.createElement("div");wrap.style.cssText="margin:10px 0 14px;overflow-x:auto";
        const caption=document.createElement("p");caption.textContent=label;caption.style.cssText="margin:0 0 6px;color:#f5d994;font-size:12px;font-weight:700";wrap.appendChild(caption);
        const track=document.createElement("div");track.style.cssText="display:flex;gap:3px;min-width:max-content;align-items:stretch";
        const total=valid[valid.length-1].endMs-valid[0].startMs;
        valid.forEach(period=>{
          const segment=document.createElement("div");
          const share=Math.max(5,((period.endMs-period.startMs)/total)*100);
          segment.style.cssText="flex:0 0 "+share+"%;min-width:64px;max-width:220px;box-sizing:border-box;padding:7px 5px;border:1px solid #80633d;border-radius:6px;background:#30243e;text-align:center;white-space:normal";
          const planet=document.createElement("strong");planet.textContent=localizeChartText(period.planet||"—");planet.style.cssText="display:block;color:#f5d994;font-size:11px";
          const dates=document.createElement("small");dates.textContent=fmt(period.start)+" – "+fmt(period.end);dates.style.cssText="display:block;color:#d4c9e5;font-size:9px;margin-top:3px";
          segment.append(planet,dates);track.appendChild(segment);
        });
        wrap.appendChild(track);host.appendChild(wrap);
      };
      appendPeriodBar(timeline,dasha.mahadashas||[],"महादशाओं की दृश्य समय-रेखा");
      (dasha.mahadashas||[]).forEach(md=>{
        const row=document.createElement("tr");
        [localizeChartText(md.planet),fmt(md.start),fmt(md.end),(md.antardashas||[]).length+" अवधि"].forEach(v=>{const td=document.createElement("td");td.textContent=String(v);td.style.cssText="padding:7px;border-top:1px solid #493568";row.appendChild(td);});table.appendChild(row);
        const item=document.createElement("details");item.className="chart-item";
        const sum=document.createElement("summary");sum.textContent=localizeChartText(md.planet)+" महादशा की अंतर्दशा और प्रत्यंतरदशा";item.appendChild(sum);
        const sub=document.createElement("div");sub.style.cssText="overflow-x:auto";
        appendPeriodBar(sub,md.antardashas||[],"इस महादशा की अंतर्दशाएँ");
        const subTable=document.createElement("table");subTable.style.cssText="width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap";
        const subHead=document.createElement("tr");["अंतर्दशा","आरंभ","समाप्ति","प्रत्यंतरदशाएँ"].forEach(v=>{const th=document.createElement("th");th.textContent=v;th.style.cssText="text-align:left;padding:6px;color:#f5d994";subHead.appendChild(th);});subTable.appendChild(subHead);
        (md.antardashas||[]).forEach(ad=>{const ar=document.createElement("tr");[localizeChartText(ad.planet),fmt(ad.start),fmt(ad.end),(ad.pratyantardashas||[]).length+" अवधि"].forEach(v=>{const td=document.createElement("td");td.textContent=String(v);td.style.cssText="padding:6px;border-top:1px solid #493568";ar.appendChild(td);});subTable.appendChild(ar);
          const pd=document.createElement("tr");const cell=document.createElement("td");cell.colSpan=4;cell.style.cssText="padding:6px 10px;color:#d4c9e5;white-space:normal";
          const pdLabel=document.createElement("p");pdLabel.textContent="प्रत्यंतरदशाएँ";pdLabel.style.cssText="margin:2px 0;color:#f5d994;font-weight:700";cell.appendChild(pdLabel);
          appendPeriodBar(cell,ad.pratyantardashas||[],"प्रत्यंतरदशा क्रम");
          pd.appendChild(cell);subTable.appendChild(pd);
        });
        sub.appendChild(subTable);item.appendChild(sub);dashaFolder.appendChild(item);
      });
      timeline.appendChild(table);dashaFolder.appendChild(timeline);
    } else addNote(dashaFolder,"विंशोत्तरी दशा डेटा उपलब्ध नहीं है।");

    // Keep current dasha details first and move the period schedule into touch/swipe slides.
    if(dashaFolder && dasha){
      const heading=dashaFolder.querySelector(":scope > h3");
      const nodes=Array.from(dashaFolder.children).filter(node=>node!==heading);
      const summaryNodes=nodes.slice(0,3);
      const activeBox=nodes.find(node=>node.classList.contains("dasha-current-card") && node!==summaryNodes[2]);
      const scheduleTitle=nodes.find(node=>node.tagName==="H4" && /पूरी महादशा/.test(node.textContent));
      const mahadashaNodes=nodes.filter(node=>node.classList.contains("dasha-period"));
      const timeline=nodes.find(node=>node.classList.contains("nakshatra-panel") && /विंशोत्तरी महादशा समय-रेखा/.test(node.textContent));
      const extras=nodes.filter(node=>!summaryNodes.includes(node)&&node!==activeBox&&node!==scheduleTitle&&!mahadashaNodes.includes(node)&&node!==timeline);

      const deckStyle=document.getElementById("dashaSlideStyle")||document.createElement("style");
      deckStyle.id="dashaSlideStyle";
      deckStyle.textContent=".dasha-slide-tabs{margin:8px 0 10px}.dasha-slide-viewport{display:flex;gap:9px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;padding:2px 1px 10px}.dasha-slide-card{flex:0 0 100%;min-width:0;scroll-snap-align:start;border:1px solid #66547f;border-radius:10px;background:#181326;padding:10px;box-sizing:border-box;overflow-wrap:anywhere}.dasha-slide-card h4{margin:4px 0 9px}.dasha-slide-card .dasha-current-card{margin:7px 0;padding:9px}.dasha-slide-card .dasha-current-card p{font-size:12px;line-height:1.45;margin:5px 0}.dasha-slide-card .dasha-period{margin:6px 0}.dasha-slide-card .dasha-period>summary,.dasha-slide-card .dasha-subperiod>summary{padding:9px;font-size:13px}.dasha-slide-card .nakshatra-panel{margin:7px 0}.dasha-slide-card .dasha-subperiod-list{padding:0 7px 7px}";
      if(!deckStyle.isConnected)document.head.appendChild(deckStyle);

      const summarySlide=document.createElement("section");summarySlide.className="dasha-slide-card";
      const mahadashaSlide=document.createElement("section");mahadashaSlide.className="dasha-slide-card";
      const antardashaSlide=document.createElement("section");antardashaSlide.className="dasha-slide-card";
      const adHeading=document.createElement("h4");adHeading.textContent="महादशा के अनुसार अंतर्दशाएँ";antardashaSlide.appendChild(adHeading);
      summaryNodes.forEach(node=>summarySlide.appendChild(node));
      if(extras.length){
        const detail=document.createElement("details");detail.className="chart-item";
        const summary=document.createElement("summary");summary.textContent="ग्रह स्थिति का विस्तृत आधार देखने के लिए स्पर्श करें";
        detail.appendChild(summary);extras.forEach(node=>detail.appendChild(node));summarySlide.appendChild(detail);
      }
      if(activeBox)mahadashaSlide.appendChild(activeBox);
      if(scheduleTitle)mahadashaSlide.appendChild(scheduleTitle);
      mahadashaNodes.forEach(mdNode=>{
        const adList=mdNode.querySelector(":scope > .dasha-subperiod-list");
        if(adList){
          const group=document.createElement("details");group.className="dasha-period";
          const groupTitle=document.createElement("summary");
          groupTitle.textContent=mdNode.querySelector(":scope > summary")?.textContent||"महादशा";
          group.appendChild(groupTitle);group.appendChild(adList);antardashaSlide.appendChild(group);
        }
        mahadashaSlide.appendChild(mdNode);
      });
      if(timeline)mahadashaSlide.appendChild(timeline);

      const tabs=document.createElement("div");tabs.className="chart-view-toolbar dasha-slide-tabs";tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","दशा विवरण चुनें");
      const viewport=document.createElement("div");viewport.className="dasha-slide-viewport";
      const slides=[{label:"वर्तमान दशा",node:summarySlide},{label:"महादशा",node:mahadashaSlide},{label:"अंतर्दशा",node:antardashaSlide}];
      slides.forEach((item,index)=>{
        const button=document.createElement("button");button.type="button";button.className="chart-view-btn"+(index===0?" active":"");button.setAttribute("role","tab");button.setAttribute("aria-selected",String(index===0));button.textContent=item.label;
        button.addEventListener("click",()=>{viewport.scrollTo({left:viewport.clientWidth*index,behavior:"smooth"});tabs.querySelectorAll("button").forEach((tab,i)=>{tab.classList.toggle("active",i===index);tab.setAttribute("aria-selected",String(i===index));});});
        tabs.appendChild(button);viewport.appendChild(item.node);
      });
      let slideFrame=0;
      viewport.addEventListener("scroll",()=>{if(slideFrame)return;slideFrame=requestAnimationFrame(()=>{slideFrame=0;const index=Math.max(0,Math.min(2,Math.round(viewport.scrollLeft/Math.max(1,viewport.clientWidth))));tabs.querySelectorAll("button").forEach((tab,i)=>{tab.classList.toggle("active",i===index);tab.setAttribute("aria-selected",String(i===index));});});},{passive:true});
      dashaFolder.replaceChildren();
      if(heading)dashaFolder.appendChild(heading);
      dashaFolder.append(tabs,viewport);
    }

    const ashtak=makeFolder("3. अष्टकवर्ग — भिन्नाष्टकवर्ग और सर्वाष्टकवर्ग","ashtakavargaFolder");
    const av=chart.ashtakavarga;
    if(av?.validation?.passed && av.bhinna && av.sarva){
      const method=document.createElement("p");method.className="chat-info";
      method.textContent="पराशरी अष्टकवर्ग | सात ग्रहों के BAV और उनका 337-बिंदु SAV योग। राहु-केतु शामिल नहीं हैं।";
      ashtak.appendChild(method);
      const savTitle=document.createElement("h4");savTitle.textContent="सर्वाष्टकवर्ग (SAV) — कुल "+av.sarva.total+" बिंदु";savTitle.style.cssText="margin:10px 0;color:#f5c66b";ashtak.appendChild(savTitle);
      const makeSignGrid=(host,rows)=>{
        const asc=Number(chart.d1?.ascendant?.rashiIndex);
        const rashis=["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
        if(!Number.isInteger(asc)||asc<0||asc>11){addNote(host,"लग्न राशि उपलब्ध नहीं है, इसलिए उत्तर भारतीय अष्टकवर्ग चार्ट नहीं बन सका।");return;}
        const bySign=new Map(rows.map(item=>[Number(item.rashiIndex),item]));
        const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
        svg.setAttribute("viewBox","0 0 400 400");svg.setAttribute("role","img");
        svg.setAttribute("aria-label","उत्तर भारतीय अष्टकवर्ग राशि चार्ट");
        svg.style.cssText="display:block;width:100%;max-width:400px;height:auto;margin:10px auto 16px;background:#f7e9c9;border-radius:8px";
        const line=(x1,y1,x2,y2)=>{const el=document.createElementNS(ns,"line");for(const [k,v] of Object.entries({x1,y1,x2,y2}))el.setAttribute(k,v);el.setAttribute("stroke","#875b2b");el.setAttribute("stroke-width","2");svg.appendChild(el);};
        const border=document.createElementNS(ns,"rect");
        for(const [k,v] of Object.entries({x:2,y:2,width:396,height:396,fill:"none",stroke:"#875b2b","stroke-width":3}))border.setAttribute(k,v);
        svg.appendChild(border);
        line(2,2,398,398);line(398,2,2,398);line(200,2,398,200);line(398,200,200,398);line(200,398,2,200);line(2,200,200,2);
        const pos=[[200,100],[100,34],[34,100],[100,200],[34,300],[100,366],[200,300],[300,366],[366,300],[300,200],[366,100],[300,34]];
        for(let house=1;house<=12;house++){
          const signIndex=(asc+house-1)%12,item=bySign.get(signIndex),[x,y]=pos[house-1];
          const sign=document.createElementNS(ns,"text");sign.setAttribute("x",x);sign.setAttribute("y",y-10);
          sign.setAttribute("text-anchor","middle");sign.setAttribute("font-size","12");sign.setAttribute("font-weight","bold");
          sign.setAttribute("fill","#4b2d16");sign.textContent=rashis[signIndex];
          const score=document.createElementNS(ns,"text");score.setAttribute("x",x);score.setAttribute("y",y+13);
          score.setAttribute("text-anchor","middle");score.setAttribute("font-size","14");score.setAttribute("font-weight","700");
          score.setAttribute("fill","#9a421d");score.textContent=item?String(item.bindus)+" बिंदु":"—";
          svg.append(sign,score);
        }
        host.appendChild(svg);
      };
      makeSignGrid(ashtak,av.sarva.signs);
      const bavTitle=document.createElement("h4");bavTitle.textContent="सात ग्रहों का भिन्नाष्टकवर्ग (BAV)";bavTitle.style.cssText="margin:14px 0 8px;color:#f5c66b";ashtak.appendChild(bavTitle);
      ["सूर्य","चंद्र","मंगल","बुध","गुरु","शुक्र","शनि"].forEach(planet=>{
        const data=av.bhinna[planet];if(!data)return;
        const folder=document.createElement("details");folder.className="chart-item";
        const summary=document.createElement("summary");summary.textContent=planet+" BAV — "+data.total+" बिंदु";folder.appendChild(summary);
        makeSignGrid(folder,data.signs);ashtak.appendChild(folder);
      });
      const check=document.createElement("p");check.className="chat-info";
      check.textContent="गणना जाँच सफल: सूर्य 48, चंद्र 49, मंगल 39, बुध 54, गुरु 56, शुक्र 52, शनि 39; SAV 337।";
      ashtak.appendChild(check);
      (av.notes||[]).forEach(note=>addNote(ashtak,note));
    } else addNote(ashtak,"इस जन्म-कुंडली के लिए सत्यापित अष्टकवर्ग डेटा उपलब्ध नहीं है।");
    const strength=makeFolder("4. षड्बल और भावबल — खोलने के लिए स्पर्श करें","shadbalaFolder");
    strength.open=true;
    const strengthIntro=document.createElement("p");
    strengthIntro.className="chat-info";
    strengthIntro.textContent="यहाँ ग्रहों का षड्बल और 12 भावों का भावबल अलग-अलग दिखेगा। अभी इस जन्म-कुंडली के लिए प्रमाणित संख्यात्मक परिणाम इंजन से उपलब्ध नहीं हैं; इसलिए गलत अंक नहीं दिखाए जा रहे हैं।";
    strength.appendChild(strengthIntro);
    const balaGroups=[
      ["षड्बल — छह अंग",["स्थान बल (Sthana Bala)","दिक् बल (Dig Bala)","काल बल (Kala Bala)","चेष्टा बल (Cheshta Bala)","नैसर्गिक बल (Naisargika Bala)","दृक् बल (Drik Bala)"]],
      ["भावबल — 12 भाव",["प्रथम भाव","द्वितीय भाव","तृतीय भाव","चतुर्थ भाव","पंचम भाव","षष्ठ भाव","सप्तम भाव","अष्टम भाव","नवम भाव","दशम भाव","एकादश भाव","द्वादश भाव"]]
    ];
    for(const [groupName,items] of balaGroups){
      const section=document.createElement("section");
      const heading=document.createElement("h4");
      heading.textContent=groupName;
      heading.style.cssText="margin:14px 0 8px;color:#f5c66b";
      section.appendChild(heading);
      const list=document.createElement("ul");
      list.style.cssText="margin:0;padding-inline-start:22px;line-height:1.8";
      for(const item of items){const li=document.createElement("li");li.textContent=item+" — गणना जोड़नी बाकी";list.appendChild(li);}
      section.appendChild(list);strength.appendChild(section);
    }
    const note=document.createElement("p");
    note.className="chat-info";
    note.textContent="ध्यान दें: षड्बल में प्रत्येक ग्रह के लिए रूप (Virupa) और आवश्यक न्यूनतम बल की तुलना भी दी जाएगी। भावबल में प्रत्येक भाव का कुल बल और उसके घटक दिखेंगे।";
    strength.appendChild(note);

    // Route each calculation section into the six horizontal slide cards.
    const dashaPage=$("vimshottariFolder"),taraPage=$("navtaraFolder"),ashtakPage=$("ashtakavargaFolder"),strengthPage=$("shadbalaFolder");
    const vargaFolder=$("kundliChartsFolder");
    const slide=id=>$(id);
    const shadbalaPage=document.createElement("section");shadbalaPage.className="calculation-page";shadbalaPage.id="shadbalaSlideContent";
    const bhavaPage=document.createElement("section");bhavaPage.className="calculation-page";bhavaPage.id="bhavaSlideContent";
    const strengthParts=Array.from(strengthPage?.children||[]).filter(node=>node.tagName==="SECTION");
    if(strengthParts[0])shadbalaPage.appendChild(strengthParts[0]);
    if(strengthParts[1])bhavaPage.appendChild(strengthParts[1]);
    Array.from(strengthPage?.children||[]).forEach(node=>{if(node.tagName!=="SECTION")shadbalaPage.appendChild(node);});
    [[dashaPage,slide("slide-dasha")],[taraPage,slide("slide-navtara")],[shadbalaPage,slide("slide-shadbala")],[bhavaPage,slide("slide-bhavabala")],[ashtakPage,slide("slide-ashtakvarga")]].forEach(([page,host])=>{
      if(host&&page){host.replaceChildren();host.appendChild(page);page.classList.add("active");}
    });
    if(vargaFolder&&slide("slide-shodashvarga"))slide("slide-shodashvarga").appendChild(vargaFolder);
    if(strengthPage)strengthPage.remove();
    root.replaceChildren();
    const detailTabs=$("kundliDetailTabs");if(detailTabs)detailTabs.replaceChildren();
    const heading=(host,label)=>{if(!host)return;const h=document.createElement("h3");h.textContent=label;host.appendChild(h);};
    if(!dashaPage)heading(slide("slide-dasha"),"महादशा");
    if(!taraPage)heading(slide("slide-navtara"),"नवतारा चक्र (तारा बल)");
    if(!ashtakPage)heading(slide("slide-ashtakvarga"),"अष्टकवर्ग");
    if(!vargaFolder)heading(slide("slide-shodashvarga"),"षोडश वर्ग कुंडलियाँ (D2–D60)");
    const viewport=$("astroSlideViewport"),slideTabs=$("astroSlideTabs");
    if(viewport&&slideTabs){
      const buttons=Array.from(slideTabs.querySelectorAll("[data-astro-slide-tab]"));
      const syncAstroTabOnScroll=()=>{const index=Math.max(0,Math.min(buttons.length-1,Math.round(viewport.scrollLeft/Math.max(1,viewport.clientWidth))));buttons.forEach((button,i)=>button.setAttribute("aria-selected",String(i===index)));buttons[index]?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});};
      buttons.forEach((button,index)=>{button.onclick=()=>viewport.scrollTo({left:viewport.clientWidth*index,behavior:"smooth"});});
      viewport.onscroll=()=>{if(viewport._astroSlideFrame)return;viewport._astroSlideFrame=requestAnimationFrame(()=>{viewport._astroSlideFrame=0;syncAstroTabOnScroll();});};
      viewport.scrollLeft=0;syncAstroTabOnScroll();
    }
  }

  function renderVargaCharts(chart) {
    const root=$("vargaCharts");
    if(!root)return;
    root.replaceChildren();
    const charts=chart.vargas||{};
    const entries=Object.entries(charts).filter(([,v])=>v?.ascendant&&Number.isInteger(Number(v.ascendant.rashiIndex)));
    if(!entries.length){
      const p=document.createElement("p");p.className="chat-info";
      p.textContent="इस जन्म विवरण के लिए विभाजित कुंडली डेटा उपलब्ध नहीं है।";
      root.appendChild(p);return;
    }
    const toolbar=document.createElement("div");toolbar.className="calculation-tabs varga-tabs";toolbar.setAttribute("role","tablist");toolbar.setAttribute("aria-label","विभाजित कुंडलियाँ");
    const pages=document.createElement("div");pages.className="varga-pages";
    entries.forEach(([key,varga],index)=>{
      const button=document.createElement("button");button.type="button";button.textContent=key;button.setAttribute("role","tab");button.setAttribute("aria-selected",String(index===0));
      const card=document.createElement("section");card.className="chart-card varga-page"+(index===0?" active":"");card.setAttribute("role","tabpanel");card.setAttribute("aria-label",key+" "+(varga.name||"वर्ग कुंडली"));
      const title=document.createElement("h4");title.textContent=key+" — "+(varga.name||"वर्ग कुंडली");card.appendChild(title);
      const occupants={};
      for(const [planetName,position] of Object.entries(varga.planets||{})){
        const house=Number(position.house);
        if(Number.isInteger(house)&&house>=1&&house<=12)(occupants[house]||(occupants[house]=[])).push(localizeChartText(planetName)+(position.retrograde?" ℞":""));
      }
      const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
      svg.setAttribute("viewBox","0 0 400 400");svg.setAttribute("role","img");svg.setAttribute("aria-label",key+" उत्तर भारतीय शैली की 12 भाव वाली कुंडली");svg.setAttribute("data-chart-layout","north-indian");
      svg.style.cssText="display:block;width:100%;max-width:400px;height:auto;aspect-ratio:1/1;margin:12px auto 0;background:#f7e9c9;border-radius:8px";
      const line=(x1,y1,x2,y2)=>{const el=document.createElementNS(ns,"line");for(const [k,val] of Object.entries({x1,y1,x2,y2}))el.setAttribute(k,val);el.setAttribute("stroke","#875b2b");el.setAttribute("stroke-width","2");svg.appendChild(el);};
      const border=document.createElementNS(ns,"rect");for(const [k,val] of Object.entries({x:2,y:2,width:396,height:396,fill:"none",stroke:"#875b2b","stroke-width":3}))border.setAttribute(k,val);svg.appendChild(border);
      line(2,2,398,398);line(398,2,2,398);line(200,2,398,200);line(398,200,200,398);line(200,398,2,200);line(2,200,200,2);
      const pos=[[200,100],[100,34],[34,100],[100,200],[34,300],[100,366],[200,300],[300,366],[366,300],[300,200],[366,100],[300,34]];
      for(let house=1;house<=12;house++){
        const [x,y]=pos[house-1],sign=(Number(varga.ascendant.rashiIndex)+house-1)%12,group=document.createElementNS(ns,"g");
        const signText=document.createElementNS(ns,"text");signText.setAttribute("x",x);signText.setAttribute("y",y-9);signText.setAttribute("text-anchor","middle");signText.setAttribute("font-size","12");signText.setAttribute("font-weight","bold");signText.setAttribute("fill","#4b2d16");signText.textContent=localizeChartText(signNames[sign]);
        const planetText=document.createElementNS(ns,"text");planetText.setAttribute("x",x);planetText.setAttribute("y",y+9);planetText.setAttribute("text-anchor","middle");planetText.setAttribute("font-size","10");planetText.setAttribute("font-weight","600");planetText.setAttribute("fill","#9a421d");
        const names=occupants[house]||[];for(let i=0;i<names.length;i+=2){const span=document.createElementNS(ns,"tspan");span.setAttribute("x",x);span.setAttribute("dy",i===0?"0":"11");span.textContent=localizeChartText(names.slice(i,i+2).join(" "));planetText.appendChild(span);}
        group.append(signText,planetText);svg.appendChild(group);
      }
      card.appendChild(svg);
      const caption=document.createElement("p");caption.className="chart-asc";caption.textContent="लग्न: "+localizeChartText(signNames[Number(varga.ascendant.rashiIndex)]);card.appendChild(caption);
      button.addEventListener("click",()=>{pages.querySelectorAll(".varga-page").forEach(page=>page.classList.toggle("active",page===card));toolbar.querySelectorAll("button").forEach(tab=>tab.setAttribute("aria-selected",String(tab===button)));button.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});});
      toolbar.appendChild(button);pages.appendChild(card);
    });
    root.append(toolbar,pages);
  }

  let selectedBirthPlace = null;
  let placeSearchSequence = 0;

  function placeLabel(place) {
    return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  }

  async function updateBirthPlaceSuggestions(query) {
    const box = $("birthPlaceSuggestions");
    if (!box) return;
    const sequence = ++placeSearchSequence;
    if (query.trim().length < 2) {
      box.replaceChildren();
      box.style.display = "none";
      return;
    }
    try {
      const results = await findBirthPlace(query.trim());
      if (sequence !== placeSearchSequence) return;
      box.replaceChildren();
      results.forEach(place => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "option");
        button.textContent = placeLabel(place);
        button.addEventListener("click", () => {
          selectedBirthPlace = { ...place, label: placeLabel(place) };
          $("birthPlace").value = selectedBirthPlace.label;
          box.replaceChildren();
          box.style.display = "none";
        });
        box.appendChild(button);
      });
      box.style.display = results.length ? "block" : "none";
    } catch (error) {
      if (sequence === placeSearchSequence) {
        box.replaceChildren();
        box.style.display = "none";
      }
    }
  }

  function validateBirthDetails(data) {
    const details = {
      name: String(data.get("name") || "").trim(),
      date: String(data.get("dob") || ""),
      time: String(data.get("birthTime") || ""),
      place: String(data.get("birthPlace") || "").trim(),
      saveToAccount: data.get("saveToAccount") === "on"
    };

    if (
      !details.name ||
      !details.date ||
      !details.time ||
      !details.place
    ) {
      throw new Error("Please enter all birth details.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.date)) {
      throw new Error("Please select a valid birth date.");
    }
    const [year, month, day] = details.date.split("-").map(Number);
    const birthDate = new Date(Date.UTC(year, month - 1, day));
    if (birthDate.getUTCFullYear() !== year || birthDate.getUTCMonth() !== month - 1 || birthDate.getUTCDate() !== day) {
      throw new Error("Please enter a valid birth date.");
    }
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    if (birthDate.getTime() > todayUtc) {
      throw new Error("Birth date cannot be in the future.");
    }

    return details;
  }

  async function findBirthPlace(place) {
    const url = new URL(GEOCODING_URL);

    url.search = new URLSearchParams({
      name: place,
      count: "8",
      language: (window.AstroLanguage?.get?.() || document.documentElement.lang || "en").split("-")[0],
      format: "json"
    });

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unable to search for the birth place.");
    }

    const data = await response.json();

    return Array.isArray(data.results)
      ? data.results
      : [];
  }

  function showLocationChoices(results, callback) {
    const box = $("message");
    if (!box) return;

    box.replaceChildren();

    const heading = document.createElement("p");
    heading.textContent =
      "Please select the correct birth place:";

    const select = document.createElement("select");

    select.style.cssText =
      "width:100%;padding:12px;background:#151020;color:white;border-radius:8px";

    results.forEach((place, index) => {
      const option = document.createElement("option");

      option.value = index;

      option.textContent = [
        place.name,
        place.admin1,
        place.country
      ].filter(Boolean).join(", ");

      select.appendChild(option);
    });

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = "Select birth place";

    button.addEventListener("click", () => {
      callback(results[Number(select.value)]);
    });

    box.append(heading, select, button);
  }

  const SAVED_KUNDALIS_KEY = "saved_kundalis";

  const ASTRO_SAVED_SESSION_KEY = "astro_saved_session";
  const ASTRO_SESSION_DB_NAME = "astro_bhagya_v1";
  const ASTRO_SESSION_STORE = "sessions";

  function openAstroSessionDB(){
    return new Promise((resolve,reject)=>{
      if(!("indexedDB" in window)){reject(new Error("इस डिवाइस में IndexedDB उपलब्ध नहीं है।"));return;}
      const request=indexedDB.open(ASTRO_SESSION_DB_NAME,1);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(ASTRO_SESSION_STORE))db.createObjectStore(ASTRO_SESSION_STORE);};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error("कुंडली स्टोरेज नहीं खुल सका।"));
      request.onblocked=()=>reject(new Error("कुंडली स्टोरेज किसी दूसरे टैब में व्यस्त है।"));
    });
  }
  async function writeAstroSessionDB(record){
    const db=await openAstroSessionDB();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(ASTRO_SESSION_STORE,"readwrite");
        tx.objectStore(ASTRO_SESSION_STORE).put(record,"latest");
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error("कुंडली सुरक्षित नहीं हो सकी।"));
        tx.onabort=()=>reject(tx.error||new Error("कुंडली सेविंग रद्द हो गई।"));
      });
    }finally{db.close();}
  }
  async function readAstroSessionDB(){
    const db=await openAstroSessionDB();
    try{
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(ASTRO_SESSION_STORE,"readonly");
        const request=tx.objectStore(ASTRO_SESSION_STORE).get("latest");
        request.onsuccess=()=>resolve(request.result||null);
        request.onerror=()=>reject(request.error||new Error("सेव कुंडली पढ़ी नहीं जा सकी।"));
      });
    }finally{db.close();}
  }
  function readAstroSession(){
    try{return JSON.parse(localStorage.getItem(ASTRO_SAVED_SESSION_KEY)||"null");}catch(_){return null;}
  }
  async function saveAstroSession(details, chart, location, preserveExistingChart=false){
    const old=readAstroSession();
    const same=old?.birthDetails&&old.birthDetails.name===details.name&&old.birthDetails.date===details.date&&old.birthDetails.time===details.time&&old.birthDetails.place===details.place;
    const savedLocation=location?{
      name:location.name||details.place,admin1:location.admin1||"",country:location.country||"",
      country_code:location.country_code||"",latitude:location.latitude,longitude:location.longitude,elevation:location.elevation
    }:(same?old.location:null);
    const record={
      version:2,savedAt:new Date().toISOString(),
      birthDetails:{name:details.name||"",date:details.date||"",time:details.time||"",place:details.place||""},
      location:savedLocation,
      chart:chart|| ((same||preserveExistingChart)?old.chart:null)
    };
    let localSaved=false;
    try{localStorage.setItem(ASTRO_SAVED_SESSION_KEY,JSON.stringify(record));localSaved=true;}
    catch(error){console.warn("स्थानीय कुंडली कॉपी सेव नहीं हो सकी; सुरक्षित स्टोरेज का उपयोग किया जा रहा है:",error);}
    if(record.chart){
      try{await writeAstroSessionDB(record);}
      catch(error){
        console.error("कुंडली का सुरक्षित IndexedDB बैकअप असफल:",error);
        if(!localSaved)throw new Error("कुंडली बन गई, लेकिन इस डिवाइस में सुरक्षित नहीं हो सकी। कृपया स्टोरेज की अनुमति जाँचें।");
      }
    }
    return record;
  }
  function saveFormDraft(form){
    const data=new FormData(form);
    saveAstroSession({
      name:String(data.get("name")||"").trim(),
      date:String(data.get("dob")||""),
      time:String(data.get("birthTime")||""),
      place:String(data.get("birthPlace")||"").trim()
    },null,null,true).catch(error=>console.warn("जन्म विवरण ड्राफ्ट सेव नहीं हुआ:",error));
  }
  async function restoreAstroSession(form){
    // A chart is shown only after the user submits fresh birth details.
    window.AstroKundli=null;
    selectedBirthPlace=null;
    const panel=$("kBox");if(panel)panel.style.display="none";
    const launch=$("aiAstrologerLaunch");if(launch)launch.hidden=true;
    const aiPanel=$("aiAstrologer");if(aiPanel)aiPanel.hidden=true;
    if(form){
      for(const id of ["name","dob","birthTime","birthPlace"]){
        const field=$(id);if(field)field.value="";
      }
    }
  }
  async function requestInitialConsultation(chart){
    const status=$("aiInitialSummary");
    if(status)status.textContent="एस्ट्रो भाग्य विधाता ऐप AI आपकी कुंडली का प्रारंभिक विश्लेषण तैयार कर रहा है…";
    const chartContext={
      d1:chart.d1||null,d9:chart.d9||null,vargas:chart.vargas||{},
      taraChart:chart.taraChart||[],currentTaraBala:chart.currentTaraBala||null,
      gochar:chart.gochar||chart.transits||null,dasha:chart.dasha||{}
    };
    try{
      const response=await fetch("/api/consultation",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({
          question:"मेरी अभी बनी जन्म कुंडली का संक्षिप्त प्रारंभिक समन्वित परिचय दें। D1, D9, ग्रहों के नक्षत्र-पाद, नवतारा/तारा बल, उपलब्ध गोचर और वर्तमान महादशा-अंतर्दशा को साथ पढ़ें। केवल उपलब्ध गणना डेटा का उपयोग करें।",
          chartContext,language:window.AstroLanguage?.get?.()||$("preferredLanguage")?.value||"hi"
        })
      });
      const data=await response.json();
      if(!response.ok||!data.success||!data.answer)throw new Error(data.message||"AI उत्तर उपलब्ध नहीं है।");
      window.AstroInitialConsultation=data.answer;
      if(status)status.textContent=data.answer;
      const host=$("ai-response-box");
      if(host&&!host.dataset.initialConsultation){const item=document.createElement("div");item.className="ai-chat-message assistant";item.textContent=data.answer;host.appendChild(item);host.dataset.initialConsultation="true";}
      document.dispatchEvent(new CustomEvent("astro:ai-consultation-ready",{detail:{answer:data.answer,chartContext}}));
    }catch(error){if(status)status.textContent="AI कनेक्शन: "+(error.message||"अभी उपलब्ध नहीं है।");}
  }

  function saveKundliLocally(chart, details, location) {
    const existing = JSON.parse(localStorage.getItem(SAVED_KUNDALIS_KEY) || "[]");
    if (!Array.isArray(existing)) throw new Error("सेव की गई कुंडलियों की सूची सही नहीं है।");
    const id = (window.crypto && typeof window.crypto.randomUUID === "function")
      ? window.crypto.randomUUID()
      : "kundli-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
    const record = {
      id,
      title: (details.name || "जन्म कुंडली") + " — " + details.date,
      createdAt: new Date().toISOString(),
      birthDetails: {
        name: details.name, localDate: details.date, localTime: details.time,
        place: [location.name, location.admin1, location.country].filter(Boolean).join(", "),
        latitude: location.latitude, longitude: location.longitude
      },
      chart
    };
    existing.unshift(record);
    localStorage.setItem(SAVED_KUNDALIS_KEY, JSON.stringify(existing));
    document.dispatchEvent(new CustomEvent("astro:kundli-saved", { detail: record }));
    return record;
  }

  async function generateKundli(details, location) {
    const payload = {
      name: details.name,

      birthDate: details.date,

      birthTime: details.time,
      saveToAccount: false, // Chart persistence is handled locally in saved_kundalis.

      birthPlace: {
        name: location.name,
        region: location.admin1 || null,
        country: location.country || null,
        countryCode: location.country_code || null,
        latitude: location.latitude,
        longitude: location.longitude,
        elevation: location.elevation || null
      },

      calculationPreferences: {
        zodiac: "sidereal",
        ayanamsa: "lahiri",
        houseSystem: "whole_sign",
        language: "en"
      }
    };

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        body: JSON.stringify(payload)
      });

      if (response.status === 404 || response.status === 405) {
        showMessage(
          "जन्म विवरण और जन्मस्थान के निर्देशांक मिल गए हैं। " +
          "अब प्रमाणित Swiss Ephemeris गणना इंजन और बैकएंड जोड़ना बाकी है।"
        );

        return;
      }

      if (!response.ok) {
        throw new Error("Unable to contact the chart server.");
      }

      const result = await response.json();

      if (!result || result.success !== true || !result.chart) {
        throw new Error("The server did not return a valid birth chart.");
      }

      const chart = result.chart;
      window.AstroKundli = chart;
      renderMainKundliChart(chart);
      renderVargaCharts(chart);
      renderAstrologyCalculations(chart);
      const hiddenText = $('kTxt');
      if (hiddenText) hiddenText.textContent = '';

      const panel = $("kBox");
      if (panel) panel.style.display = "block";
      const aiPanel = $("aiAstrologer");
      if (aiPanel) aiPanel.hidden = false;
      const aiLaunch = $("aiAstrologerLaunch");
      if (aiLaunch) aiLaunch.hidden = false;
      const aiPanel = $("aiAstrologer");
      if (aiPanel) aiPanel.hidden = false;

      await saveAstroSession(details,chart,location);
      document.dispatchEvent(new CustomEvent("astro:kundli-ready", { detail: chart }));
      requestInitialConsultation(chart);
      if (details.saveToAccount) {
        try {
          saveKundliLocally(chart, details, location);
          showMessage("आपकी कुंडली सफलतापूर्वक 'मेरी कुंडलियाँ' में सुरक्षित कर दी गई है!");
          const successBox = $("message");
          if (successBox) successBox.classList.add("message-success");
          if (window.loadKundliHistory) window.loadKundliHistory();
        } catch (saveError) {
          showMessage("कुंडली बन गई, लेकिन इस ब्राउज़र में सेव नहीं हो सकी। डिवाइस की स्टोरेज खाली करके दोबारा प्रयास करें।", true);
        }
      } else {
        showMessage(result.message || "जन्म कुंडली सफलतापूर्वक तैयार हो गई है।");
      }

    } catch (error) {
      if (error instanceof TypeError) {
        showMessage(
          "जन्मस्थान मिल गया है। सटीक कुंडली के लिए " +
          "सर्वर और गणना इंजन जोड़ना बाकी है।"
        );
        return;
      }

      throw error;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const button = form.querySelector(
      'button[type="submit"]'
    );

    const oldText = button
      ? button.textContent
      : "";

    try {
      const details = validateBirthDetails(
        new FormData(form)
      );
      await saveAstroSession(details,null,null);

      if (button) {
        button.disabled = true;
        button.textContent = "जाँच हो रही है...";
      }

      showMessage("Searching birth place...");

      const cached = selectedBirthPlace && selectedBirthPlace.label === details.place
        ? selectedBirthPlace
        : null;
      const results = cached ? [cached] : await findBirthPlace(details.place);

      if (!results.length) {
        throw new Error(
          "जन्मस्थान नहीं मिला। सही शहर या गाँव लिखें।"
        );
      }

      const exact = results.filter(
        item =>
          item.name.toLowerCase() ===
          details.place.toLowerCase()
      );

      if (results.length > 1 && exact.length === 0) {
        if (button) {
          button.disabled = false;
          button.textContent = oldText;
        }

        showLocationChoices(results, async selected => {
          try {
            showMessage("Confirming birth place...");

            await generateKundli(details, selected);

          } catch (error) {
            showMessage(error.message, true);
          }
        });

        return;
      }

      await generateKundli(
        details,
        exact[0] || results[0]
      );

    } catch (error) {
      showMessage(
        error.message || "कृपया दोबारा प्रयास करें।",
        true
      );

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent =
          oldText || "मेरी कुंडली बनाएं";
      }
    }
  }

  window.changeAppLanguage = function(language) {
    if(window.AstroLanguage?.set) window.AstroLanguage.set(language);
    else { document.documentElement.lang=language; try{localStorage.setItem("astro_language",language);}catch(_){} }
    const chart=window.AstroKundli;
    if(chart){renderMainKundliChart(chart);renderVargaCharts(chart);renderAstrologyCalculations(chart);}
  };

  function initialize() {
    const form = $("kundliForm");

    if (!form) {
      console.warn(
        "Kundli form नहीं मिला। index.html की जाँच करें।"
      );
      return;
    }

    form.addEventListener("submit", handleSubmit);
    form.addEventListener("input",()=>saveFormDraft(form));
    form.addEventListener("change",()=>saveFormDraft(form));
    restoreAstroSession(form).catch(error=>console.warn("पिछली कुंडली वापस लोड नहीं हुई:",error));
    const languagePicker = $("preferredLanguage");
    if (languagePicker) {
      languagePicker.addEventListener("change", () => {
        const chart = window.AstroKundli;
        if (!chart) return;
        // Rebuild SVG charts immediately so Hindi is applied even when language changes after calculation.
        renderMainKundliChart(chart);
        renderVargaCharts(chart);
        renderAstrologyCalculations(chart);
      });
    }
    const placeInput = $("birthPlace");
    if (placeInput) {
      placeInput.addEventListener("input", () => {
        selectedBirthPlace = null;
        updateBirthPlaceSuggestions(placeInput.value);
      });
      placeInput.addEventListener("focus", () => {
        if (placeInput.value.trim().length >= 2 && !selectedBirthPlace) {
          updateBirthPlaceSuggestions(placeInput.value);
        }
      });
      document.addEventListener("click", event => {
        const box = $("birthPlaceSuggestions");
        if (box && !box.contains(event.target) && event.target !== placeInput) {
          box.style.display = "none";
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }

})();
