/* Astro Bhagya Vidhata — live sidereal Gochar */
(() => {
  "use strict";
  const API="/api/gochar";
  const SIGNS=["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
  const BENEFICS=new Set(["गुरु","शुक्र"]);
  const MALEFICS=new Set(["सूर्य","मंगल","शनि","राहु","केतु"]);
  const $=id=>document.getElementById(id);
  const astroHindiMap = {
    "House":"भाव","Sun":"सूर्य","Moon":"चंद्र","Mars":"मंगल","Mercury":"बुध",
    "Jupiter":"गुरु","Venus":"शुक्र","Saturn":"शनि","Rahu":"राहु","Ketu":"केतु",
    "Aries":"मेष","Taurus":"वृषभ","Gemini":"मिथुन","Cancer":"कर्क",
    "Leo":"सिंह","Virgo":"कन्या","Libra":"तुला","Scorpio":"वृश्चिक",
    "Sagittarius":"धनु","Capricorn":"मकर","Aquarius":"कुंभ","Pisces":"मीन",
    "Pada":"चरण","Vishakha":"विशाखा","Purva Bhadrapada":"पूर्वाभाद्रपद","Magha":"मघा",
    "Ashwini":"अश्विनी","Bharani":"भरणी","Krittika":"कृत्तिका","Rohini":"रोहिणी",
    "Mrigashira":"मृगशिरा","Ardra":"आर्द्रा","Punarvasu":"पुनर्वसु","Pushya":"पुष्य",
    "Ashlesha":"आश्लेषा","Purva Phalguni":"पूर्वाफाल्गुनी","Uttara Phalguni":"उत्तराफाल्गुनी",
    "Hasta":"हस्त","Chitra":"चित्रा","Swati":"स्वाति","Anuradha":"अनुराधा",
    "Jyeshtha":"ज्येष्ठा","Mula":"मूल","Purva Ashadha":"पूर्वाषाढ़ा","Uttara Ashadha":"उत्तराषाढ़ा",
    "Shravana":"श्रवण","Dhanishta":"धनिष्ठा","Shatabhisha":"शतभिषा",
    "Uttara Bhadrapada":"उत्तराभाद्रपद","Revati":"रेवती","Planet":"ग्रह","Sign":"राशि","Nakshatra":"नक्षत्र"
  };
  function localizeAstroText(text, lang) {
    let result=String(text??"");
    for(const [eng,hin] of Object.entries(astroHindiMap).sort((a,b)=>b[0].length-a[0].length)){
      const escaped=eng.replace(/[.*+?^${}()|[\]\\]/g,"\\  const $=id=>document.getElementById(id);");
      result=result.replace(new RegExp("(?<![\\p{L}\\p{N}])"+escaped+"(?![\\p{L}\\p{N}])","giu"),hin);
    }
    if(String(lang||"hi").split("-")[0]==="hi")return result;
    return window.AstroLanguage?.translate?window.AstroLanguage.translate(result):result;
  }
  const translateAstroTerm=(text,lang=window.AstroLanguage?.get?.()||document.documentElement.lang||"hi")=>localizeAstroText(text,lang);

  const tr=value=>translateAstroTerm(value);
  let latest=null;

  async function getJSON(url,options={}) {
    const response=await fetch(url,{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json",...(options.headers||{})},...options});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.message||"गोचर जानकारी प्राप्त नहीं हो सकी।");
    return data;
  }
  function element(tag,text,className) {
    const node=document.createElement(tag);
    if(text!==undefined)node.textContent=text;
    if(className)node.className=className;
    return node;
  }
  function message(title,text,isError=false) {
    const host=$("rashiGocharOut");if(!host)return;
    host.replaceChildren();
    host.append(element("strong",tr(title)),element("p",tr(text)));
    host.style.color=isError?"#a12b20":"";
  }
  function statusNature(name) {
    const hindiName=localizeAstroText(name,"hi");
    if(BENEFICS.has(hindiName))return "शुभ";
    if(MALEFICS.has(hindiName))return "अशुभ";
    return "मिश्रित";
  }
  function drawChart(host,data,lagnaIndex) {
    if(!Number.isInteger(lagnaIndex)||lagnaIndex<0||lagnaIndex>11)return;
    const wrap=element("section",undefined,"gochar-chart-wrap");
    wrap.append(element("h3","उत्तर भारतीय गोचर कुंडली"));
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 400 400");svg.setAttribute("preserveAspectRatio","xMidYMid meet");svg.setAttribute("role","img");
    svg.setAttribute("aria-label","उत्तर भारतीय गोचर कुंडली");
    const add=(tag,attrs,parent=svg)=>{const n=document.createElementNS("http://www.w3.org/2000/svg",tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));parent.appendChild(n);return n;};
    add("rect",{x:2,y:2,width:396,height:396,fill:"#fffaf2",stroke:"#9b6336","stroke-width":3});
    add("line",{x1:2,y1:2,x2:398,y2:398,stroke:"#9b6336","stroke-width":2});
    add("line",{x1:398,y1:2,x2:2,y2:398,stroke:"#9b6336","stroke-width":2});
    add("line",{x1:200,y1:2,x2:398,y2:200,stroke:"#9b6336","stroke-width":2});
    add("line",{x1:398,y1:200,x2:200,y2:398,stroke:"#9b6336","stroke-width":2});
    add("line",{x1:200,y1:398,x2:2,y2:200,stroke:"#9b6336","stroke-width":2});
    add("line",{x1:2,y1:200,x2:200,y2:2,stroke:"#9b6336","stroke-width":2});
    const coords=[[200,100],[100,34],[34,100],[100,200],[34,300],[100,366],[200,300],[300,366],[366,300],[300,200],[366,100],[300,34]];
    const byHouse={};
    for(const p of data.planets||[]){const h=Number(p.lagnaHouse);if(h>=1&&h<=12)(byHouse[h]||=[]).push(p.name);}
    for(let house=1;house<=12;house++){
      const [x,y]=coords[house-1],sign=SIGNS[(lagnaIndex+house-1)%12];
      add("text",{x,y:y-14,"text-anchor":"middle","font-size":10,fill:"#80502b","font-weight":"600"}).textContent=tr("भाव")+" "+house;
      add("text",{x,y:y-1,"text-anchor":"middle","font-size":11,fill:"#3b3028"}).textContent=tr(sign);
      const names=(byHouse[house]||[]).map(n=>tr(n)).join(" ");
      const t=add("text",{x,y:y+15,"text-anchor":"middle","font-size":10,fill:"#c04d0b","font-weight":"700"});
      const chunks=names.match(/.{1,18}/gu)||[];
      chunks.slice(0,2).forEach((part,i)=>{const span=add("tspan",{x,dy:i===0?0:11},t);span.textContent=part;});
    }
    wrap.append(svg);
    const legend=element("p","लग्न स्थिर: "+tr(SIGNS[lagnaIndex])+" | भाव राशि-आधारित Whole Sign पद्धति से।");
    wrap.append(legend);host.append(wrap);
  }
  function renderTable(host,data) {
    const section=element("section",undefined,"gochar-table-wrap");
    section.append(element("h3","आज के गोचर ग्रह"));
    const scroller=element("div",undefined,"gochar-table-scroll");
    const table=element("table");table.className="gochar-table";
    const headers=["ग्रह","गोचर राशि","नक्षत्र (चरण)","जन्म लग्न से भाव","स्थिति (शुभ/अशुभ)","अवस्था"];
    const thead=element("thead"),headRow=element("tr");
    headers.forEach(h=>headRow.append(element("th",tr(h))));
    thead.append(headRow);table.append(thead);
    const tbody=element("tbody");
    (data.planets||[]).forEach(p=>{
      const row=element("tr");
      const values=[
        tr(p.name),
        tr(p.rashi)+" "+p.degree.text,
        tr(p.nakshatra)+" ("+tr("चरण")+" "+p.pada+")",
        p.lagnaHouse==null?"—":String(p.lagnaHouse),
        tr(statusNature(p.name)),
        tr(p.state|| (p.retrograde?"वक्री":"मार्गी"))
      ];
      values.forEach((value,i)=>row.append(element("td",value,i===4?(statusNature(p.name)==="शुभ"?"nature-good":statusNature(p.name)==="अशुभ"?"nature-bad":"nature-mixed"):"")));
      tbody.append(row);
    });
    table.append(tbody);scroller.append(table);section.append(scroller);host.append(section);
  }
  function render(data) {
    latest=data;
    const host=$("rashiGocharOut");if(!host)return;
    host.replaceChildren();
    const title=element("h3","आज के ग्रह गोचर — "+new Date(data.asOf).toLocaleString(window.AstroLanguage?.get?.()||document.documentElement.lang||"hi"));
    host.append(title);
    const meta=element("p","जन्म लग्न: "+(data.basisLagna?tr(data.basisLagna):"उपलब्ध नहीं")+" | चंद्र राशि: "+(data.basisRashi?tr(data.basisRashi):"उपलब्ध नहीं")+" | अयनांश: "+data.ayanamsa+" ("+data.ayanamsaDegrees+"°)");
    meta.className="gochar-meta";host.append(meta);
    const chartHost=element("div");
    const chart=window.AstroKundli;
    const lagnaIndex=Number(chart?.d1?.ascendant?.rashiIndex);
    if(Number.isInteger(lagnaIndex)&&lagnaIndex>=0&&lagnaIndex<12)drawChart(chartHost,data,lagnaIndex);
    else chartHost.append(element("p","उत्तर भारतीय गोचर कुंडली दिखाने के लिए पहले जन्म विवरण भरकर अपनी जन्म कुंडली बनाएं।"));
    host.append(chartHost);
    renderTable(host,data);
    const note=element("p",data.note||"");note.className="gochar-note";host.append(note);
    const ai=$("gocharAiPanel");if(ai)ai.hidden=false;
  }
  async function loadGochar() {
    const select=$("rashiSelect");if(!select)return;
    const chart=window.AstroKundli;
    const lagnaIndex=Number(chart?.d1?.ascendant?.rashiIndex);
    const lagna=Number.isInteger(lagnaIndex)&&lagnaIndex>=0&&lagnaIndex<12?SIGNS[lagnaIndex]:"";
    const rashi=select.value;
    message("आज का गोचर","वर्तमान समय के नौ ग्रहों की गणना हो रही है...");
    try {
      const query=new URLSearchParams();
      if(rashi)query.set("rashi",rashi);
      if(lagna)query.set("lagna",lagna);
      const data=await getJSON(API+"?"+query.toString());
      if(!Array.isArray(data.planets)||data.planets.length!==9)throw new Error("सर्वर से सभी नौ ग्रहों का डेटा नहीं मिला।");
      render(data);
    } catch(error) {message("गोचर उपलब्ध नहीं",error.message,true);}
  }
  async function askPrediction() {
    const button=$("gocharAiButton"),output=$("gocharAiOutput"),language=window.AstroLanguage?.get?.()||document.documentElement.lang||"hi";
    if(!latest||!Array.isArray(latest.planets))return;
    if(!button||!output)return;
    button.disabled=true;button.textContent=tr("AI विश्लेषण तैयार हो रहा है...");
    output.textContent=tr("Gemini से गोचर फलादेश प्राप्त किया जा रहा है...");
    try {
      const chart=window.AstroKundli;
      if(!chart?.d1?.ascendant||!chart?.d1?.planets||!chart?.dasha?.current){
        throw new Error("जन्म कुंडली और वर्तमान दशा का डेटा उपलब्ध नहीं है। पहले जन्म कुंडली दोबारा बनाएं।");
      }
      // Send astrology factors only; exclude name, birth date/time, place, coordinates and account details.
      const kundali={
        d1:{
          ascendant:{rashi:chart.d1.ascendant.rashi,rashiIndex:chart.d1.ascendant.rashiIndex},
          planets:Object.fromEntries(Object.entries(chart.d1.planets||{}).map(([name,p])=>[name,{
            rashi:p.rashi,longitude:p.longitude,house:p.house,nakshatra:p.nakshatra,
            nakshatraIndex:p.nakshatraIndex,pada:p.pada
          }]))
        },
        dasha:{current:{
          mahadasha:chart.dasha.current.mahadasha,
          antardasha:chart.dasha.current.antardasha,
          pratyantardasha:chart.dasha.current.pratyantardasha,
          mahadashaStart:chart.dasha.current.mahadashaStart,
          mahadashaEnd:chart.dasha.current.mahadashaEnd,
          antardashaStart:chart.dasha.current.antardashaStart,
          antardashaEnd:chart.dasha.current.antardashaEnd
        }}
      };
      const result=await getJSON("/api/gochar-prediction",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({gochar:latest,kundali,language})
      });
      output.textContent=result.answer||tr("विश्लेषण उपलब्ध नहीं है।");
    } catch(error) {output.textContent=tr(error.message);}
    finally {button.disabled=false;button.textContent=tr("आज के गोचर का विश्लेषण करें");}
  }
  function init() {
    const select=$("rashiSelect");
    if(select) {
      const chart=window.AstroKundli;
      const moonIndex=Number(chart?.d1?.planets?.चंद्र?.rashiIndex);
      if(Number.isInteger(moonIndex)&&moonIndex>=0&&moonIndex<12)select.value=SIGNS[moonIndex];
      select.addEventListener("change",loadGochar);
    }
    $("gocharAiButton")?.addEventListener("click",askPrediction);
    document.querySelector('[data-app-tab="gochar"]')?.addEventListener("click",()=>{if(window.AstroKundli)setTimeout(loadGochar,120);});
    document.addEventListener("astro:kundli-ready",()=>{const chart=window.AstroKundli;const moonIndex=Number(chart?.d1?.planets?.चंद्र?.rashiIndex);if(select&&Number.isInteger(moonIndex))select.value=SIGNS[moonIndex];loadGochar();});
    if(window.AstroKundli)setTimeout(loadGochar,0);
    else message("गोचर कुंडली","पहले जन्म विवरण भरकर अपनी जन्म कुंडली बनाएं। फिर आपके जन्म लग्न और चंद्र राशि से आज के गोचर भाव अपने-आप निकलेंगे।");
  }
  window.loadRashiGochar=loadGochar;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
