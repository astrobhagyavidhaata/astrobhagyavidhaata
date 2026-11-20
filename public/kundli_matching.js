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
  const GANA_SCORE = [[6,5,1],[6,6,0],[0,0,6]];

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
  function renderD1Panel(person,title){
    const chart=person.chart.d1,asc=Number(chart?.ascendant?.rashiIndex);
    const wrap=document.createElement("section");wrap.className="match-d1-panel";
    const heading=document.createElement("h4");heading.textContent=english() ? title+" Birth Chart" : title+" की जन्म कुंडली";wrap.appendChild(heading);
    const meta=document.createElement("p");meta.className="match-d1-meta";
    meta.textContent=t("जन्म स्थान: ","Birth place: ")+person.place+" · "+t("लग्न: ","Ascendant: ")+signName(asc);wrap.appendChild(meta);
    const grid=document.createElement("div");grid.className="match-d1-grid";
    const positions=[[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[3,0],[2,0],[1,0]];
    const cells=new Map();
    positions.forEach(([r,c],house)=>cells.set((r*4+c),house+1));
    for(let i=0;i<16;i++){
      const cell=document.createElement("div");cell.className="match-d1-cell";
      const house=cells.get(i);
      if(house){
        const sign=(asc+house-1)%12;
        const h=document.createElement("strong");h.textContent=t("भाव ","House ")+house;cell.appendChild(h);
        const signLabel=document.createElement("span");signLabel.textContent=signName(sign);cell.appendChild(signLabel);
        const occupants=Object.entries(chart.planets||{}).filter(([,p])=>Number(p.house)===house).map(([name])=>planetName(name));
        const planets=document.createElement("small");planets.textContent=occupants.join(" · ")||"—";cell.appendChild(planets);
      }
      grid.appendChild(cell);
    }
    wrap.appendChild(grid);return wrap;
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
    const title=document.createElement("h3");title.textContent=t("मिलान का परिणाम","Matching Result");root.appendChild(title);
    const summary=document.createElement("p");summary.textContent=t("वर: ","Groom: ")+signName(gm.rashiIndex)+t(" राशि, "," sign, ")+nakName(g.name)+t(" नक्षत्र (चरण "," Nakshatra (Pada ")+g.pada+") · "+t("वधू: ","Bride: ")+signName(bm.rashiIndex)+t(" राशि, "," sign, ")+nakName(b.name)+t(" नक्षत्र (चरण "," Nakshatra (Pada ")+b.pada+")";root.appendChild(summary);
    const score=document.createElement("p");score.className="match-score";score.textContent=total.toFixed(1)+" / 36 "+t("गुण","Points");root.appendChild(score);
    const table=document.createElement("table");table.className="match-table";
    const head=document.createElement("tr");[t("अष्टकूट","Koota"),t("प्राप्त गुण","Scored"),t("अधिकतम","Maximum")].forEach(t=>{const th=document.createElement("th");th.textContent=t;head.appendChild(th);});table.appendChild(head);
    items.forEach(([name,value,max])=>{const row=document.createElement("tr");[name,value.toFixed(1),String(max)].forEach(t=>{const td=document.createElement("td");td.textContent=t;row.appendChild(td);});table.appendChild(row);});root.appendChild(table);
    const assessment=document.createElement("p");assessment.textContent=total>=18?t("परंपरागत मानक के अनुसार 18 या अधिक गुण का मिलान स्वीकार्य माना जाता है।","Under the traditional benchmark, a score of 18 or more is considered acceptable."):t("परंपरागत 18 गुण के मानक से यह मिलान कम है; विवाह निर्णय से पहले विस्तृत व्यक्तिगत कुंडली परीक्षण करें।","This is below the traditional 18-point benchmark; review both full charts before making a marriage decision.");root.appendChild(assessment);
    const mtitle=document.createElement("h3");mtitle.textContent=t("मंगल दोष","Manglik Dosha");root.appendChild(mtitle);
    const mtext=document.createElement("p");mtext.textContent=t("वर: ","Groom: ")+(marsG?.dosha?t("मंगल दोष के संकेत हैं","Manglik indications present"):t("मंगल दोष नहीं","No Manglik Dosha"))+". "+t("लग्न से भाव ","House from Ascendant ")+marsG?.fromAsc+", "+t("चंद्र से भाव ","from Moon ")+marsG?.fromMoon+"। "+t("वधू: ","Bride: ")+(marsB?.dosha?t("मंगल दोष के संकेत हैं","Manglik indications present"):t("मंगल दोष नहीं","No Manglik Dosha"))+". "+t("लग्न से भाव ","House from Ascendant ")+marsB?.fromAsc+", "+t("चंद्र से भाव ","from Moon ")+marsB?.fromMoon+"।";root.appendChild(mtext);
    const note=document.createElement("p");note.className="match-note";note.textContent=t("यह परिणाम वर्तमान खगोलीय गणना और मुहूर्त चिंतामणि की पारंपरिक अष्टकूट तालिका पर आधारित है। अयनांश में रैखिक सन्निकटन है; पूर्ण विवाह निर्णय से पहले दोनों की संपूर्ण कुंडली भी देखें।","This result uses the traditional Ashtakoota table attributed to Muhurta Chintamani. A linear ayanamsa approximation is used; review both complete charts before making a final marriage decision.");root.appendChild(note);
    root.appendChild(renderD1Panel(groom,t("वर","Groom")));root.appendChild(renderD1Panel(bride,t("वधू","Bride")));
  }
  document.addEventListener("DOMContentLoaded",()=>{
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