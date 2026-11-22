(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const NAK = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वाभाद्रपद","उत्तराभाद्रपद","रेवती"];
  const SIGNS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
  const EN_SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const english = () => (window.AstroLanguage?.get?.() || $("preferredLanguage")?.value) === "en";
  const t = (hi,en) => english() ? en : hi;
  const signName = index => (english() ? EN_SIGNS : SIGNS)[Number(index)] || "—";
  const nakName = name => english() ? (window.AstroLanguage?.translate?.(name) || name) : name;
  const planetName = name => english() ? (window.AstroLanguage?.translate?.(name) || name) : name;
  const SIGN_LORDS = ["मंगल","शुक्र","बुध","चंद्र","सूर्य","बुध","शुक्र","मंगल","गुरु","शनि","शनि","गुरु"];
  const GANA = [0,1,2,1,0,2,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
  const YONI = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
  const VARNA = [1,2,3,0,1,2,3,0,1,2,3,0]; // Brahmin 0, Kshatriya 1, Vaishya 2, Shudra 3
  const NADI = [0,2,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];
  const YONI_SCORE = [
    [4,2,3,2,2,3,3,3,0,1,3,2,2,1],
    [2,4,3,2,2,3,3,3,3,2,2,2,2,0],
    [3,3,4,3,2,3,1,3,3,1,3,0,3,1],
    [2,2,3,4,2,2,1,1,2,2,2,2,0,2],
    [2,2,2,2,4,1,1,2,2,1,0,2,2,1],
    [2,2,3,2,1,4,0,2,2,1,2,2,2,2],
    [2,2,2,1,1,0,4,2,2,2,2,2,2,1],
    [3,2,3,1,2,2,2,4,3,0,3,2,3,1],
    [0,3,3,2,2,2,2,3,4,1,2,2,2,3],
    [1,2,1,2,1,1,2,0,1,4,2,1,2,2],
    [3,2,3,2,0,2,2,3,2,1,4,2,2,2],
    [2,3,0,2,2,2,2,2,2,1,2,4,2,3],
    [2,2,3,0,2,2,2,3,2,2,2,2,4,2],
    [1,0,1,2,1,2,1,1,3,2,2,2,2,4]
  ];
  const FRIENDS = {
    सूर्य:["चंद्र","मंगल","गुरु"],चंद्र:["सूर्य","बुध"],मंगल:["सूर्य","चंद्र","गुरु"],
    बुध:["सूर्य","शुक्र"],गुरु:["सूर्य","चंद्र","मंगल"],शुक्र:["बुध","शनि"],शनि:["बुध","शुक्र"]
  };
  const ENEMIES = {
    सूर्य:["शुक्र","शनि"],चंद्र:[],मंगल:["बुध"],बुध:["चंद्र"],गुरु:["बुध","शुक्र"],
    शुक्र:["सूर्य","चंद्र"],शनि:["सूर्य","चंद्र","मंगल"]
  };
  const VASHYA = [1,1,0,2,1,0,0,2,3,2,2,2]; // Chatushpada, Dvipada, Jalachara, Keeta
  const VASHYA_SCORE = [[2,0.5,0.5,1],[0.5,2,2,2],[0.5,2,2,2],[1,2,2,2]];
  const GANA_SCORE = [[6,5,0],[6,6,0],[0,0,6]];

  function scoreVarna(g,b){return VARNA[g] <= VARNA[b] ? 1 : 0;}
  function scoreVashya(g,b){return VASHYA_SCORE[VASHYA[b]][VASHYA[g]];}
  function taraOne(from,to){const n=((to-from+27)%27)+1;return [3,5,7].includes(n%9)?0:1.5;}
  function scoreTara(g,b){return taraOne(g,b)+taraOne(b,g);}
  function scoreYoni(g,b){return YONI_SCORE[YONI[b]][YONI[g]];}
  function scoreGrahaMaitri(g,b){
    const order=["सूर्य","चंद्र","मंगल","बुध","गुरु","शुक्र","शनि"];
    const table=[
      [5,5,5,4,5,0,0],
      [5,5,4,1,4,0.5,0.5],
      [5,4,5,0.5,5,3,0.5],
      [4,1,0.5,5,0.5,5,4],
      [5,4,5,0.5,5,0.5,3],
      [0,0.5,3,5,0.5,5,5],
      [0,0.5,0.5,4,3,5,5]
    ];
    const brideLord=order.indexOf(SIGN_LORDS[b]),groomLord=order.indexOf(SIGN_LORDS[g]);
    return table[brideLord][groomLord];
  }
  function scoreGana(g,b){return GANA_SCORE[GANA[b]][GANA[g]];}
  function scoreBhakoot(g,b){const d=(b-g+12)%12+1;return [2,5,6,8,9,12].includes(d)?0:7;}
  function scoreNadi(g,b){return NADI[g]===NADI[b]?0:8;}
  function nakInfo(longitude){const n=((Number(longitude)%360)+360)%360;const i=Math.floor(n/(360/27));return {index:i,name:NAK[i],pada:Math.floor((n%(360/27))/(360/108))+1};}
  function mangal(chart){
    const mars=chart?.d1?.planets?.मंगल,moon=chart?.d1?.planets?.चंद्र;
    if(!mars||!moon)return null;
    const fromAsc=Number(mars.house),fromMoon=((Number(mars.rashiIndex)-Number(moon.rashiIndex)+12)%12)+1;
    const bad=[1,2,4,7,8,12];
    return {fromAsc,fromMoon,ascDosha:bad.includes(fromAsc),moonDosha:bad.includes(fromMoon),dosha:bad.includes(fromAsc)||bad.includes(fromMoon)};
  }
  const placeSearchState={};
  const placeLabel=p=>[p.name,p.admin1,p.country].filter(Boolean).join(", ");
  async function searchPlaceSuggestions(prefix,query){
    const input=$(prefix+"Place"),box=$(prefix+"PlaceSuggestions");
    if(!input||!box)return;
    const seq=(placeSearchState[prefix]?.seq||0)+1;
    placeSearchState[prefix]={seq};
    if(query.trim().length<2){box.replaceChildren();box.style.display="none";return;}
    try{
      const url="https://geocoding-api.open-meteo.com/v1/search?"+new URLSearchParams({name:query.trim(),count:"8",language:"en",format:"json"});
      const response=await fetch(url,{headers:{Accept:"application/json"}});
      if(!response.ok)throw new Error("स्थान खोज विफल");
      const data=await response.json();
      if(placeSearchState[prefix]?.seq!==seq)return;
      box.replaceChildren();
      (Array.isArray(data.results)?data.results:[]).forEach(p=>{
        const button=document.createElement("button");
        button.type="button";button.setAttribute("role","option");
        button.textContent=placeLabel(p);
        button.style.cssText="display:block;width:100%;padding:10px 12px;text-align:left;background:#211a32;color:#fff;border:0;border-bottom:1px solid #493568";
        button.addEventListener("click",()=>{
          input.value=placeLabel(p);
          input.dataset.selectedLocation=JSON.stringify({name:p.name,region:p.admin1||"",country:p.country||"",country_code:p.country_code||"",latitude:p.latitude,longitude:p.longitude,elevation:p.elevation||null});
          box.replaceChildren();box.style.display="none";
        });
        box.appendChild(button);
      });
      box.style.display=box.childElementCount?"block":"none";
    }catch(error){if(placeSearchState[prefix]?.seq===seq){box.replaceChildren();box.style.display="none";}}
  }
  function attachPlaceAutocomplete(prefix){
    const input=$(prefix+"Place"),box=$(prefix+"PlaceSuggestions");
    if(!input||!box)return;
    input.addEventListener("input",()=>{
      delete input.dataset.selectedLocation;
      searchPlaceSuggestions(prefix,input.value);
    });
    input.addEventListener("blur",()=>setTimeout(()=>{box.style.display="none";},180));
    input.addEventListener("focus",()=>{if(input.value.trim().length>=2)searchPlaceSuggestions(prefix,input.value);});
  }
  async function locate(place,selected){
    if(selected)return selected;
    const url="https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(place)+"&count=8&language=en&format=json";
    const response=await fetch(url,{headers:{Accept:"application/json"}});
    if(!response.ok)throw new Error("जन्म स्थान खोजा नहीं जा सका: "+place);
    const data=await response.json();const list=data.results||[];
    if(!list.length)throw new Error("यह जन्म स्थान नहीं मिला: "+place);
    const p=list[0];return {name:p.name,region:p.admin1||"",country:p.country||"",country_code:p.country_code||"",latitude:p.latitude,longitude:p.longitude,elevation:p.elevation||null};
  }
  function normalizeBirthDate(value){
    const raw=String(value||"").trim();
    const m=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if(m){
      const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]);
      const d=new Date(Date.UTC(year,month-1,day));
      if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day)throw new Error("कृपया सही जन्म तारीख DD/MM/YYYY में डालें।");
      return year+"-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0");
    }
    if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
      const d=new Date(raw+"T00:00:00Z");
      if(!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===raw)return raw;
    }
    throw new Error("जन्म तारीख DD/MM/YYYY में डालें, जैसे 05/09/2008।");
  }
  async function buildChart(prefix){
    const dateParts=[$(prefix+"Date").value,$(prefix+"Month").value,$(prefix+"Year").value];
    if(dateParts.some(v=>!/^\d+$/.test(String(v||"").trim())))throw new Error("कृपया दिन, महीना और चार अंकों का साल अलग-अलग भरें।");
    const date=normalizeBirthDate(dateParts.join("/"));const hourRaw=String($(prefix+"Hour").value||"").trim(),minuteRaw=String($(prefix+"Minute").value||"").trim(),period=$(prefix+"Period").value;const hour=Number(hourRaw),minute=Number(minuteRaw);if(!/^\d{1,2}$/.test(hourRaw)||hour<1||hour>12||!/^\d{1,2}$/.test(minuteRaw)||minute<0||minute>59)throw new Error("कृपया जन्म समय का घंटा 1 से 12 और मिनट 00 से 59 तक भरें।");const hour24=(hour%12)+(period==="PM"?12:0);const time=String(hour24).padStart(2,"0")+":"+String(minute).padStart(2,"0");const place=$(prefix+"Place").value.trim();
    const selectedLocation=(()=>{try{return JSON.parse($(prefix+"Place").dataset.selectedLocation||"null");}catch(_){return null;}})();
    const location=await locate(place,selectedLocation);
    const response=await fetch("/api/kundli",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({name:prefix==="matchGroom"?"वर":"वधू",gender:prefix==="matchGroom"?"male":"female",birthDate:date,birthTime:time,birthPlace:location,saveToAccount:false,calculationPreferences:{zodiac:"sidereal",ayanamsa:"lahiri",houseSystem:"whole_sign"}})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.success||!data.chart)throw new Error(data.message||"जन्म कुंडली की गणना पूरी नहीं हुई।");
    return {chart:data.chart,place:[location.name,location.region,location.country].filter(Boolean).join(", ")};
  }
  function renderD1Panel(person,title){
    const chart=person.chart.d1,asc=Number(chart?.ascendant?.rashiIndex);
    const wrap=document.createElement("section");wrap.className="match-d1-panel";
    const heading=document.createElement("h4");heading.textContent=english()?title+" Birth Chart":title+" की जन्म कुंडली";wrap.appendChild(heading);
    const meta=document.createElement("p");meta.className="match-d1-meta";meta.textContent=t("जन्म स्थान: ","Birth place: ")+person.place+" · "+t("लग्न: ","Ascendant: ")+signName(asc);wrap.appendChild(meta);
    if(!Number.isInteger(asc)||asc<0||asc>11){const warning=document.createElement("p");warning.textContent=t("लग्न की जानकारी उपलब्ध नहीं है।","Ascendant data is unavailable.");wrap.appendChild(warning);return wrap;}
    const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 400 400");svg.setAttribute("role","img");svg.setAttribute("aria-label",t("उत्तर भारतीय शैली की जन्म कुंडली","North Indian diamond birth chart"));
    svg.style.cssText="display:block;width:100%;max-width:400px;height:auto;margin:10px auto;background:#fffaf0;border-radius:8px";
    const line=(x1,y1,x2,y2)=>{const el=document.createElementNS(ns,"line");for(const [k,v] of Object.entries({x1,y1,x2,y2}))el.setAttribute(k,v);el.setAttribute("stroke","#875b2b");el.setAttribute("stroke-width","2");svg.appendChild(el);};
    const border=document.createElementNS(ns,"rect");for(const [k,v] of Object.entries({x:2,y:2,width:396,height:396,fill:"none",stroke:"#875b2b","stroke-width":3}))border.setAttribute(k,v);svg.appendChild(border);
    line(2,2,398,398);line(398,2,2,398);line(200,2,398,200);line(398,200,200,398);line(200,398,2,200);line(2,200,200,2);
    const positions=[[200,100],[100,34],[34,100],[100,200],[34,300],[100,366],[200,300],[300,366],[366,300],[300,200],[366,100],[300,34]];
    for(let house=1;house<=12;house++){
      const [x,y]=positions[house-1],sign=(asc+house-1)%12;
      const signText=document.createElementNS(ns,"text");signText.setAttribute("x",x);signText.setAttribute("y",y-9);signText.setAttribute("text-anchor","middle");signText.setAttribute("font-size","12");signText.setAttribute("font-weight","bold");signText.setAttribute("fill","#4b2d16");signText.textContent=signName(sign)+" "+(sign+1);
      const planetText=document.createElementNS(ns,"text");planetText.setAttribute("x",x);planetText.setAttribute("y",y+9);planetText.setAttribute("text-anchor","middle");planetText.setAttribute("font-size","10");planetText.setAttribute("font-weight","600");planetText.setAttribute("fill","#9a421d");
      const names=Object.entries(chart.planets||{}).filter(([,p])=>Number(p.house)===house).map(([name])=>planetName(name));
      for(let i=0;i<names.length;i+=2){const span=document.createElementNS(ns,"tspan");span.setAttribute("x",x);span.setAttribute("dy",i===0?"0":"11");span.textContent=names.slice(i,i+2).join(" ");planetText.appendChild(span);}
      svg.append(signText,planetText);
    }
    wrap.appendChild(svg);return wrap;
  }
  function renderResult(groom,bride){
    const gm=groom.chart.d1.planets?.चंद्र,bm=bride.chart.d1.planets?.चंद्र;
    const marsG=mangal(groom.chart),marsB=mangal(bride.chart);
    if(!gm||!bm||!Number.isFinite(Number(gm.longitude))||!Number.isFinite(Number(bm.longitude)))throw new Error("चंद्रमा की गणना उपलब्ध नहीं है; दोनों जन्म समय और स्थान जाँचें।");
    const g=nakInfo(gm.longitude),b=nakInfo(bm.longitude);
    const items=[
      [t("वर्ण","Varna"),scoreVarna(gm.rashiIndex,bm.rashiIndex),1],
      [t("वश्य","Vashya"),scoreVashya(gm.rashiIndex,bm.rashiIndex),2],
      [t("तारा","Tara"),scoreTara(g.index,b.index),3],
      [t("योनि","Yoni"),scoreYoni(g.index,b.index),4],
      [t("ग्रह मैत्री","Graha Maitri"),scoreGrahaMaitri(gm.rashiIndex,bm.rashiIndex),5],
      [t("गण","Gana"),scoreGana(g.index,b.index),6],
      [t("भकूट","Bhakoot"),scoreBhakoot(gm.rashiIndex,bm.rashiIndex),7],
      [t("नाड़ी","Nadi"),scoreNadi(g.index,b.index),8]
    ];
    const total=items.reduce((sum,x)=>sum+x[1],0);
    const root=$("kundliMatchResult");root.replaceChildren();
    const title=document.createElement("h3");title.textContent=t("मिलान का परिणाम","Matching Result");root.appendChild(title);
    const summary=document.createElement("p");summary.textContent=t("वर: ","Groom: ")+signName(gm.rashiIndex)+t(" राशि, "," sign, ")+nakName(g.name)+t(" नक्षत्र (चरण "," Nakshatra (Pada ")+g.pada+") · "+t("वधू: ","Bride: ")+signName(bm.rashiIndex)+t(" राशि, "," sign, ")+nakName(b.name)+t(" नक्षत्र (चरण "," Nakshatra (Pada ")+b.pada+")";root.appendChild(summary);
    const score=document.createElement("p");score.className="match-score";score.textContent=total.toFixed(1)+" / 36 "+t("गुण","Points");root.appendChild(score);
    const table=document.createElement("table");table.className="match-table";
    const head=document.createElement("tr");[t("अष्टकूट","Koota"),t("प्राप्त गुण","Scored"),t("अधिकतम","Maximum")].forEach(t=>{const th=document.createElement("th");th.textContent=t;head.appendChild(th);});table.appendChild(head);
    items.forEach(([name,value,max])=>{const row=document.createElement("tr");[name,value.toFixed(1),String(max)].forEach(t=>{const td=document.createElement("td");td.textContent=t;row.appendChild(td);});table.appendChild(row);});root.appendChild(table);
    const interpretationTitle=document.createElement("h3");interpretationTitle.textContent=t("आठों गुणों का विस्तृत फल","Detailed meaning of all eight Kootas");root.appendChild(interpretationTitle);
    const meanings=[
      ["वर्ण","Varna","यह कूट दोनों की चंद्र राशि के आधार पर स्वभाव, जीवन-दृष्टि और आध्यात्मिक/मानसिक तालमेल का पारंपरिक संकेत देता है। अंक कम होने पर विचारों और प्राथमिकताओं में तालमेल बनाने के लिए अधिक समझ की जरूरत मानी जाती है।","This koota traditionally indicates outlook, temperament and spiritual orientation from the Moon signs. A lower score suggests greater effort may be needed to align values and priorities."],
      ["वश्य","Vashya","यह कूट आपसी आकर्षण, प्रभाव और एक-दूसरे के साथ तालमेल बैठाने की क्षमता से जुड़ा है। अंक कम होने पर आपसी प्रभाव या समायोजन सहज न रहने का संकेत माना जाता है; इसे किसी एक के दूसरे पर नियंत्रण की निश्चित भविष्यवाणी न समझें।","This koota concerns mutual attraction, influence and adjustment. A lower score traditionally suggests that cooperation or mutual influence may take more effort; it does not predict control by either partner."],
      ["तारा","Tara","यह कूट जन्म नक्षत्रों की परस्पर गणना से स्वास्थ्य, मंगल, सौभाग्य और साथ की कुशलता का पारंपरिक संकेत देता है। अंक कम होने पर परंपरा इसे साथ के शुभफल और सहज सहयोग में कमी का संकेत मानती है।","This koota compares the birth stars for wellbeing, auspiciousness and shared fortune. A lower score is traditionally read as less supportive star harmony."],
      ["योनि","Yoni","यह कूट नक्षत्रों से निर्धारित योनि-स्वभाव के आधार पर शारीरिक सहजता, अंतरंगता और प्राकृतिक आकर्षण का संकेत देता है। अंक कम होने पर शारीरिक/अंतरंग तालमेल में भिन्नता या असहजता की आशंका पारंपरिक रूप से मानी जाती है।","This koota compares instinctive and physical compatibility associated with the nakshatra yoni. A lower score traditionally indicates differences that may require sensitivity in intimacy and physical rapport."],
      ["ग्रह मैत्री","Graha Maitri","यह कूट दोनों की चंद्र राशियों के स्वामियों की नैसर्गिक मित्रता से मानसिक तालमेल, विचारों की समानता और परस्पर सद्भाव देखता है। अंक कम होने पर सोच, निर्णय और भावनात्मक समझ में मतभेद की संभावना का संकेत माना जाता है।","This koota compares the natural relationship between the Moon-sign lords and signifies mental rapport, shared thinking and goodwill. A lower score suggests possible differences in views and decision-making."],
      ["गण","Gana","यह कूट जन्म नक्षत्र के देव, मनुष्य या राक्षस गण के आधार पर स्वभाव, व्यवहार और प्रतिक्रिया के ढंग का तालमेल देखता है। अंक कम होने पर आदतों, प्रतिक्रिया और जीवन-शैली में अंतर से टकराव हो सकता है—ऐसा पारंपरिक संकेत माना जाता है।","This koota compares Deva, Manushya and Rakshasa temperaments. A lower score traditionally points to differences in behaviour, reactions and lifestyle that may need patience."],
      ["भकूट","Bhakoot","यह कूट दोनों की चंद्र राशियों के पारस्परिक संबंध से भावनात्मक सामंजस्य, पारिवारिक सुख और साझा समृद्धि का संकेत देता है। शून्य अंक पर परंपरा में भकूट दोष माना जाता है; इसके फलादेश से पहले राशि-स्वामी, अन्य ग्रहयोग और शास्त्रीय दोष-भंग/परिहार अवश्य जाँचना चाहिए।","This koota reads the relationship between the Moon signs for emotional harmony, family wellbeing and shared prosperity. A zero is traditionally called Bhakoot dosha; sign-lord relationships and classical cancellation conditions must be checked before judging it."],
      ["नाड़ी","Nadi","यह कूट जन्म नक्षत्रों की आदि, मध्य या अंत्य नाड़ी के आधार पर पारंपरिक शारीरिक प्रकृति और संतान-संबंधी सामंजस्य से जोड़ा जाता है। शून्य अंक पर नाड़ी दोष कहा जाता है; इसे बांझपन, बीमारी या संतान न होने का निश्चित निष्कर्ष बिल्कुल न मानें। नाड़ी दोष-भंग/परिहार की जाँच जरूरी है।","This koota compares Adi, Madhya and Antya Nadi and is traditionally associated with constitution and progeny-related harmony. A zero is called Nadi dosha; it does not establish infertility, illness or childlessness. Classical cancellation conditions must be checked."]
    ];
    const detailList=document.createElement("div");detailList.className="match-koota-details";
    items.forEach(([name,value,max],i)=>{
      const card=document.createElement("section");card.className="match-koota-detail";
      card.style.cssText="margin:10px 0;padding:12px;border:1px solid rgba(150,130,180,.35);border-radius:10px";
      const heading=document.createElement("h4");heading.textContent=(i+1)+". "+t(meanings[i][0],meanings[i][1])+" — "+value.toFixed(1)+"/"+max+" "+t("गुण","points");card.appendChild(heading);
      const status=document.createElement("p");
      const isZero=value===0;
      status.textContent=isZero?t("इस कूट में शून्य अंक मिले हैं।","This koota received zero points."):value<max?t("इस कूट में पूरे अंक नहीं मिले।","This koota did not receive full points."):t("इस कूट में पूरे अंक मिले हैं।","This koota received full points.");
      status.style.fontWeight="600";card.appendChild(status);
      const desc=document.createElement("p");desc.textContent=t(meanings[i][2],meanings[i][3]);card.appendChild(desc);
      if((i===6||i===7)&&isZero){const caution=document.createElement("p");caution.textContent=t("विशेष सावधानी: केवल इस स्कोर से विवाह का अंतिम निष्कर्ष न निकालें। पारंपरिक परिहार और दोनों की संपूर्ण कुंडली का परीक्षण आवश्यक है।","Important: Do not make a final marriage judgment from this score alone. Check traditional exceptions and both complete charts.");card.appendChild(caution);}
      detailList.appendChild(card);
    });
    root.appendChild(detailList);
    const interpretationNote=document.createElement("p");interpretationNote.className="match-note";interpretationNote.textContent=t("यह अष्टकूट के पारंपरिक संकेतों का अर्थ है, निश्चित घटना या नुकसान की गारंटी नहीं। गुण मिलान चंद्र राशि और जन्म नक्षत्र पर आधारित एक प्रारंभिक विधि है; अंतिम निर्णय से पहले सप्तम भाव, सप्तमेश, शुक्र/गुरु, नवांश, मंगल दोष, दशा तथा भकूट-नाड़ी के परिहार सहित दोनों की पूरी कुंडली देखें।","These are traditional indications, not guaranteed events or harms. Ashtakoota is a preliminary method based on Moon signs and birth nakshatras; review the 7th house and lord, Venus/Jupiter, Navamsa, Manglik factors, dashas and Bhakoot/Nadi exceptions in both complete charts before a final decision.");root.appendChild(interpretationNote);
    const assessment=document.createElement("p");assessment.textContent=total>=18?t("परंपरागत मानक के अनुसार 18 या अधिक गुण का मिलान स्वीकार्य माना जाता है।","Under the traditional benchmark, a score of 18 or more is considered acceptable."):t("परंपरागत 18 गुण के मानक से यह मिलान कम है; विवाह निर्णय से पहले विस्तृत व्यक्तिगत कुंडली परीक्षण करें।","This is below the traditional 18-point benchmark; review both full charts before making a marriage decision.");root.appendChild(assessment);
    const mtitle=document.createElement("h3");mtitle.textContent=t("मंगल दोष","Manglik Dosha");root.appendChild(mtitle);
    const mtext=document.createElement("p");mtext.textContent=t("वर: ","Groom: ")+(marsG?.dosha?t("मंगल दोष के संकेत हैं","Manglik indications present"):t("मंगल दोष नहीं","No Manglik Dosha"))+". "+t("लग्न से भाव ","House from Ascendant ")+marsG?.fromAsc+", "+t("चंद्र से भाव ","from Moon ")+marsG?.fromMoon+"। "+t("वधू: ","Bride: ")+(marsB?.dosha?t("मंगल दोष के संकेत हैं","Manglik indications present"):t("मंगल दोष नहीं","No Manglik Dosha"))+". "+t("लग्न से भाव ","House from Ascendant ")+marsB?.fromAsc+", "+t("चंद्र से भाव ","from Moon ")+marsB?.fromMoon+"।";root.appendChild(mtext);
    const note=document.createElement("p");note.className="match-note";note.textContent=t("यह परिणाम वर्तमान खगोलीय गणना और मुहूर्त चिंतामणि की पारंपरिक अष्टकूट तालिका पर आधारित है। अयनांश में रैखिक सन्निकटन है; पूर्ण विवाह निर्णय से पहले दोनों की संपूर्ण कुंडली भी देखें।","This result uses the traditional Ashtakoota table attributed to Muhurta Chintamani. A linear ayanamsa approximation is used; review both complete charts before making a final marriage decision.");root.appendChild(note);
    root.appendChild(renderD1Panel(groom,t("वर","Groom")));root.appendChild(renderD1Panel(bride,t("वधू","Bride")));
  }
  document.addEventListener("DOMContentLoaded",()=>{
    attachPlaceAutocomplete("matchGroom");
    attachPlaceAutocomplete("matchBride");
    const form=$("kundliMatchForm");if(!form)return;
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const button=$("runKundliMatch"),status=$("kundliMatchStatus"),result=$("kundliMatchResult");
      if(!form.reportValidity())return;
      button.disabled=true;status.textContent=t("दोनों जन्म कुंडलियों की गणना की जा रही है...","Calculating both birth charts...");result.replaceChildren();
      try{const [g,b]=await Promise.all([buildChart("matchGroom"),buildChart("matchBride")]);renderResult(g,b);status.textContent=t("गुण मिलान पूरा हुआ।","Kundli matching complete.")}
      catch(error){status.textContent=error.message||(english()?"Calculation could not be completed.":"गणना पूरी नहीं हो सकी।")}
      finally{button.disabled=false;}
    });
  });
})();