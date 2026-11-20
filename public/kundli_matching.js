(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const NAK = ["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाती","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वाभाद्रपद","उत्तराभाद्रपद","रेवती"];
  const SIGNS = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
  const SIGN_LORDS = ["मंगल","शुक्र","बुध","चंद्र","सूर्य","बुध","शुक्र","मंगल","गुरु","शनि","शनि","गुरु"];
  const GANA = [0,2,2,1,0,2,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
  const YONI = [0,1,2,3,4,5,6,7,5,8,9,9,10,11,10,11,12,13,4,12,13,6,14,14,14,8,1];
  const VARNA = [2,3,1,0,2,1,3,2,2,1,3,0]; // Brahmin 0, Kshatriya 1, Vaishya 2, Shudra 3
  const NADI = NAK.map((_,i)=>i%3);
  const ANIMAL_ENEMIES = new Set(["0-8","1-7","2-10","3-12","4-13","5-11","6-9","7-14"]);
  const FRIENDS = {
    सूर्य:["चंद्र","मंगल","गुरु"],चंद्र:["सूर्य","बुध"],मंगल:["सूर्य","चंद्र","गुरु"],
    बुध:["सूर्य","शुक्र"],गुरु:["सूर्य","चंद्र","मंगल"],शुक्र:["बुध","शनि"],शनि:["बुध","शुक्र"]
  };
  const ENEMIES = {
    सूर्य:["शुक्र","शनि"],चंद्र:[],मंगल:["बुध"],बुध:["चंद्र"],गुरु:["बुध","शुक्र"],
    शुक्र:["सूर्य","चंद्र"],शनि:["सूर्य","चंद्र","मंगल"]
  };
  const VASHYA = [0,0,1,2,3,1,1,4,1,0,1,2]; // quadruped, human, aquatic, wild, insect
  const VASHYA_SCORE = [[2,1,1,1,0],[1,2,1,1,1],[1,1,2,0,1],[1,1,0,2,0],[0,1,1,0,2]];
  const GANA_SCORE = [[6,5,1],[5,6,0],[1,0,6]];

  function scoreVarna(g,b){return VARNA[g] <= VARNA[b] ? 1 : 0;}
  function scoreVashya(g,b){return VASHYA_SCORE[VASHYA[g]][VASHYA[b]];}
  function taraOne(from,to){const n=((to-from+27)%27)+1;return [2,4,6,8,0].includes(n%9)?1.5:0;}
  function scoreTara(g,b){return taraOne(g,b)+taraOne(b,g);}
  function scoreYoni(g,b){const a=YONI[g],c=YONI[b];if(a===c)return 4;const key=[Math.min(a,c),Math.max(a,c)].join("-");if(ANIMAL_ENEMIES.has(key))return 0;return 3;}
  function scoreGrahaMaitri(g,b){
    const a=SIGN_LORDS[g],c=SIGN_LORDS[b];
    if(a===c)return 5;
    const ab=(FRIENDS[a]||[]).includes(c),ba=(FRIENDS[c]||[]).includes(a);
    const ae=(ENEMIES[a]||[]).includes(c),be=(ENEMIES[c]||[]).includes(a);
    if(ab&&ba)return 5;if((ab&&!be)||(ba&&!ae))return 4;if(ae&&be)return 0;if(ae||be)return 1;return 3;
  }
  function scoreGana(g,b){return GANA_SCORE[GANA[g]][GANA[b]];}
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
  async function locate(place){
    const url="https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(place)+"&count=5&language=hi&format=json";
    const response=await fetch(url,{headers:{Accept:"application/json"}});
    if(!response.ok)throw new Error("जन्म स्थान खोजा नहीं जा सका: "+place);
    const data=await response.json();const list=data.results||[];
    if(!list.length)throw new Error("यह जन्म स्थान नहीं मिला: "+place);
    const p=list[0];return {name:p.name,region:p.admin1||"",country:p.country||"",country_code:p.country_code||"",latitude:p.latitude,longitude:p.longitude,elevation:p.elevation||null};
  }
  async function buildChart(prefix){
    const date=$(prefix+"Date").value,time=$(prefix+"Time").value,place=$(prefix+"Place").value.trim();
    const location=await locate(place);
    const response=await fetch("/api/kundli",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({name:prefix==="matchGroom"?"वर":"वधू",gender:prefix==="matchGroom"?"male":"female",birthDate:date,birthTime:time,birthPlace:location,saveToAccount:false,calculationPreferences:{zodiac:"sidereal",ayanamsa:"lahiri",houseSystem:"whole_sign"}})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.success||!data.chart)throw new Error(data.message||"जन्म कुंडली की गणना पूरी नहीं हुई।");
    return {chart:data.chart,place:[location.name,location.region,location.country].filter(Boolean).join(", ")};
  }
  function renderResult(groom,bride){
    const gm=groom.chart.d1.planets?.चंद्र,bm=bride.chart.d1.planets?.चंद्र;
    const marsG=mangal(groom.chart),marsB=mangal(bride.chart);
    if(!gm||!bm||!Number.isFinite(Number(gm.longitude))||!Number.isFinite(Number(bm.longitude)))throw new Error("चंद्रमा की गणना उपलब्ध नहीं है; दोनों जन्म समय और स्थान जाँचें।");
    const g=nakInfo(gm.longitude),b=nakInfo(bm.longitude);
    const items=[
      ["वर्ण",scoreVarna(gm.rashiIndex,bm.rashiIndex),1],
      ["वश्य",scoreVashya(gm.rashiIndex,bm.rashiIndex),2],
      ["तारा",scoreTara(g.index,b.index),3],
      ["योनि",scoreYoni(g.index,b.index),4],
      ["ग्रह मैत्री",scoreGrahaMaitri(gm.rashiIndex,bm.rashiIndex),5],
      ["गण",scoreGana(g.index,b.index),6],
      ["भकूट",scoreBhakoot(gm.rashiIndex,bm.rashiIndex),7],
      ["नाड़ी",scoreNadi(g.index,b.index),8]
    ];
    const total=items.reduce((sum,x)=>sum+x[1],0);
    const root=$("kundliMatchResult");root.replaceChildren();
    const title=document.createElement("h3");title.textContent="मिलान का परिणाम";root.appendChild(title);
    const summary=document.createElement("p");summary.textContent="वर: "+SIGNS[gm.rashiIndex]+" राशि, "+g.name+" नक्षत्र (चरण "+g.pada+") · वधू: "+SIGNS[bm.rashiIndex]+" राशि, "+b.name+" नक्षत्र (चरण "+b.pada+")";root.appendChild(summary);
    const score=document.createElement("p");score.className="match-score";score.textContent=total.toFixed(1)+" / 36 गुण";root.appendChild(score);
    const table=document.createElement("table");table.className="match-table";
    const head=document.createElement("tr");["अष्टकूट","प्राप्त गुण","अधिकतम"].forEach(t=>{const th=document.createElement("th");th.textContent=t;head.appendChild(th);});table.appendChild(head);
    items.forEach(([name,value,max])=>{const row=document.createElement("tr");[name,value.toFixed(1),String(max)].forEach(t=>{const td=document.createElement("td");td.textContent=t;row.appendChild(td);});table.appendChild(row);});root.appendChild(table);
    const assessment=document.createElement("p");assessment.textContent=total>=18?"परंपरागत मानक के अनुसार 18 या अधिक गुण का मिलान स्वीकार्य माना जाता है।": "परंपरागत 18 गुण के मानक से यह मिलान कम है; विवाह निर्णय से पहले विस्तृत व्यक्तिगत कुंडली परीक्षण करें।";root.appendChild(assessment);
    const mtitle=document.createElement("h3");mtitle.textContent="मंगल दोष";root.appendChild(mtitle);
    const mtext=document.createElement("p");mtext.textContent="वर: "+(marsG?.dosha?"मंगल दोष के संकेत हैं":"मंगल दोष नहीं")+". लग्न से भाव "+marsG?.fromAsc+", चंद्र से भाव "+marsG?.fromMoon+"। वधू: "+(marsB?.dosha?"मंगल दोष के संकेत हैं":"मंगल दोष नहीं")+". लग्न से भाव "+marsB?.fromAsc+", चंद्र से भाव "+marsB?.fromMoon+"।";root.appendChild(mtext);
    const note=document.createElement("p");note.className="chat-info";note.textContent="गणना में वर्तमान ऐप का खगोलीय इंजन, लाहिड़ी अयनांश का रैखिक सन्निकटन और पारंपरिक अष्टकूट तालिकाएँ उपयोग हुई हैं। विभिन्न ज्योतिषीय परंपराओं में कुछ गुणों तथा मंगल दोष के नियमों में अंतर हो सकता है; इसे अकेले विवाह निर्णय का आधार न बनाएं।";root.appendChild(note);
  }
  document.addEventListener("DOMContentLoaded",()=>{
    const form=$("kundliMatchForm");if(!form)return;
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const button=$("runKundliMatch"),status=$("kundliMatchStatus"),result=$("kundliMatchResult");
      if(!form.reportValidity())return;
      button.disabled=true;status.textContent="दोनों जन्म कुंडलियों की गणना की जा रही है...";result.replaceChildren();
      try{const [g,b]=await Promise.all([buildChart("matchGroom"),buildChart("matchBride")]);renderResult(g,b);status.textContent="गुण मिलान पूरा हुआ।"}
      catch(error){status.textContent=error.message||"गणना पूरी नहीं हो सकी।"}
      finally{button.disabled=false;}
    });
  });
})();