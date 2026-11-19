
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
  const selectedChartLanguage = () => document.getElementById("preferredLanguage")?.value || "en";
  function triggerChartTranslation() {
    const language = selectedChartLanguage();
    if (language === "hi") { document.documentElement.lang = "hi"; return; }
    document.documentElement.lang = language;
    const languageMap = {"en-CA":"en","fr-CA":"fr","pt-BR":"pt","ar-SA":"ar"};
    const target = languageMap[language] || language;
    let attempts = 0;
    function apply() {
      const combo = document.querySelector(".goog-te-combo");
      if (combo) { combo.value = target; combo.dispatchEvent(new Event("change")); return; }
      if (++attempts < 30) setTimeout(apply, 250);
    }
    if (window.applyAstroGoogleTranslation) window.applyAstroGoogleTranslation(); else apply();
  }

  function showMessage(message, error = false) {
    const box = $("message");
    if (!box) return;

    box.style.display = "block";
    box.style.color = error ? "#ffb4ab" : "#f5d994";
    box.textContent = message;
  }

  function renderMainKundliChart(chart) {
    const host=$("chartCards"), nav=$("mainChartSlot");
    if(!host||!nav||!chart?.d1?.ascendant||!chart?.d9?.ascendant)return;
    host.replaceChildren();
    const signs=["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
    const moon=chart.d1.planets?.चंद्र || chart.d1.planets?.Moon || Object.entries(chart.d1.planets||{}).find(([name])=>/moon|चंद्र/i.test(name))?.[1];
    const moonAsc=Number(moon?.rashiIndex);
    const ascendantIndex=Number(chart.d1.ascendant.rashiIndex);
    const summary=$("chartBirthSummary")||document.createElement("p");
    summary.id="chartBirthSummary";summary.className="chart-birth-summary";
    summary.textContent="जन्म लग्न: "+(Number.isInteger(ascendantIndex)?signs[ascendantIndex]:"—")+" | चंद्र राशि: "+(Number.isInteger(moonAsc)?signs[moonAsc]:"—");
    if(host.parentNode)host.parentNode.insertBefore(summary,host);
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
      const hindiPlanets={Sun:"सूर्य",Moon:"चंद्र",Mars:"मंगल",Mercury:"बुध",Jupiter:"गुरु",Venus:"शुक्र",Saturn:"शनि",Rahu:"राहु",Ketu:"केतु"};
      for(const [planet,p] of Object.entries(spec.planets)){const house=Number(p.house);if(Number.isInteger(house)&&house>=1&&house<=12)(occupants[house]||=[]).push(selectedChartLanguage()==="hi"?(hindiPlanets[planet]||planet):planet);}
      const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
      svg.setAttribute("viewBox","0 0 400 400");svg.setAttribute("role","img");svg.setAttribute("aria-label",spec.title);
      const line=(x1,y1,x2,y2)=>{const el=document.createElementNS(ns,"line");for(const [k,v] of Object.entries({x1,y1,x2,y2}))el.setAttribute(k,v);el.setAttribute("stroke","#875b2b");el.setAttribute("stroke-width","2");svg.appendChild(el);};
      const border=document.createElementNS(ns,"rect");for(const [k,v] of Object.entries({x:2,y:2,width:396,height:396,fill:"none",stroke:"#875b2b","stroke-width":3}))border.setAttribute(k,v);svg.appendChild(border);
      line(2,2,398,398);line(398,2,2,398);line(200,2,398,200);line(398,200,200,398);line(200,398,2,200);line(2,200,200,2);
      const pos=[[200,100],[100,34],[34,100],[100,200],[34,300],[100,366],[200,300],[300,366],[366,300],[300,200],[366,100],[300,34]];
      for(let house=1;house<=12;house++){
        const [x,y]=pos[house-1],sign=(spec.asc+house-1)%12,g=document.createElementNS(ns,"g");
        const s=document.createElementNS(ns,"text");s.setAttribute("x",x);s.setAttribute("y",y-9);s.setAttribute("text-anchor","middle");s.setAttribute("font-size","12");s.setAttribute("font-weight","bold");s.setAttribute("fill","#4b2d16");s.textContent=signs[sign]+" "+(sign+1);
        const ptext=document.createElementNS(ns,"text");ptext.setAttribute("x",x);ptext.setAttribute("y",y+9);ptext.setAttribute("text-anchor","middle");ptext.setAttribute("font-size","10");ptext.setAttribute("font-weight","600");ptext.setAttribute("fill","#9a421d");
        const names=occupants[house]||[];for(let i=0;i<names.length;i+=2){const span=document.createElementNS(ns,"tspan");span.setAttribute("x",x);span.setAttribute("dy",i===0?"0":"11");const hindiPlanets={Sun:"सूर्य",Moon:"चंद्र",Mars:"मंगल",Mercury:"बुध",Jupiter:"गुरु",Venus:"शुक्र",Saturn:"शनि",Rahu:"राहु",Ketu:"केतु"};const shownNames=names.slice(i,i+2).map(name=>selectedChartLanguage()==="hi"?(hindiPlanets[name]||name):name);span.textContent=shownNames.join(" ");ptext.appendChild(span);}
        g.append(s,ptext);svg.appendChild(g);
      }
      card.appendChild(svg);const asc=document.createElement("p");asc.className="chart-asc";asc.textContent="लग्न: "+signs[spec.asc]+" ("+(spec.asc+1)+")";card.appendChild(asc);host.appendChild(card);
    }
    const panel=$("planetNakshatra");
    if(panel){
      panel.replaceChildren();
      const heading=document.createElement("h3");
      heading.textContent="ग्रहों का नक्षत्र एवं भाव विवरण";
      heading.style.cssText="margin:2px 0 6px;color:#f5c66b;font-size:16px";
      const note=document.createElement("p");
      note.textContent="D1 जन्म कुंडली के अनुसार ग्रह किस राशि, भाव, नक्षत्र और चरण में स्थित हैं।";
      note.style.cssText="margin:0 0 10px;color:#d4c9e5;font-size:12px;line-height:1.5";
      panel.append(heading,note);
      const table=document.createElement("table"),thead=document.createElement("thead"),trh=document.createElement("tr");
      ["ग्रह","राशि","राशि स्वामी","भाव","अंश","नक्षत्र","चरण","नक्षत्र स्वामी"].forEach(label=>{const th=document.createElement("th");th.textContent=label;trh.appendChild(th);});
      thead.appendChild(trh);table.appendChild(thead);
      const tbody=document.createElement("tbody");
      const nakshatraLords=["केतु","शुक्र","सूर्य","चंद्र","मंगल","राहु","गुरु","शनि","बुध"];
      const rashiLords=["मंगल","शुक्र","बुध","चंद्र","सूर्य","बुध","शुक्र","मंगल","गुरु","शनि","शनि","गुरु"];
      const rows=[["लग्न",chart.d1.ascendant||{}],...Object.entries(chart.d1.planets||{})];
      for(const [planet,p] of rows){
        const degree=Number(p.degreeInRashi);
        const degreeText=Number.isFinite(degree)?degree.toFixed(2)+"°":"—";
        const pada=Number(p.pada);
        const padaText=Number.isInteger(pada)&&pada>=1&&pada<=4?"चरण "+pada:"—";
        const house=Number(p.house);
        const houseText=Number.isInteger(house)&&house>=1&&house<=12?house+"वाँ":"—";
        const rashiIndex=Number(p.rashiIndex);
        const rashiLord=Number.isInteger(rashiIndex)&&rashiIndex>=0&&rashiIndex<12?rashiLords[rashiIndex]:"—";
        const nakshatraIndex=Number(p.nakshatraIndex);
        const nakshatraLord=Number.isInteger(nakshatraIndex)&&nakshatraIndex>=0&&nakshatraIndex<27?nakshatraLords[nakshatraIndex%9]:"—";
        const hindiPlanets={Sun:"सूर्य",Moon:"चंद्र",Mars:"मंगल",Mercury:"बुध",Jupiter:"गुरु",Venus:"शुक्र",Saturn:"शनि",Rahu:"राहु",Ketu:"केतु"};
        const planetText=(selectedChartLanguage()==="hi"?(hindiPlanets[planet]||planet):planet)+(p.retrograde?" ℞":"");
        const values=[planetText,p.rashi||signs[p.rashiIndex]||"—",rashiLord,houseText,degreeText,p.nakshatra||"—",padaText,nakshatraLord];
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
    const root=$("jyotishCalculations");
    if(!root)return;
    root.replaceChildren();
    const layout=document.createElement("div");layout.className="calculation-slider-layout";root.appendChild(layout);
    const main=document.createElement("div");main.className="calculation-main";layout.appendChild(main);
    const side=document.createElement("aside");side.className="calculation-side-slider";side.setAttribute("aria-label","वर्तमान दशा स्वामियों की कुंडली स्थिति");layout.appendChild(side);
    const makeFolder=(title,id)=>{const d=document.createElement("details");d.className="chart-item";const s=document.createElement("summary");s.textContent=title;d.id=id;d.appendChild(s);main.appendChild(d);return d;};
    const addNote=(host,message)=>{const p=document.createElement("p");p.className="chat-info";p.textContent=message;host.appendChild(p);};
    const dashaFolder=makeFolder("1. महादशा – अंतर्दशा – प्रत्यंतर दशा","vimshottariFolder");
    const tara=makeFolder("2. नवतारा चक्र (तारा बल)","navtaraFolder");
    const strength=makeFolder("3. षड्बल और भाव बल","shadbalaFolder");
    const ashtak=makeFolder("4. अष्टकवर्ग — भिन्नाष्टकवर्ग और सर्वाष्टकवर्ग","ashtakavargaFolder");
    const currentDasha=chart.dasha?.current||{},positions=chart.d1?.planets||{};
    const meanings={"सूर्य":"आत्मविश्वास, नेतृत्व और प्रतिष्ठा","चंद्र":"मन, भावनाएँ और जनसंपर्क","मंगल":"ऊर्जा, साहस और प्रतिस्पर्धा","बुध":"बुद्धि, संवाद और व्यापार","गुरु":"ज्ञान, शिक्षा और विस्तार","शुक्र":"संबंध, कला और सुख-सुविधा","शनि":"अनुशासन, श्रम और जिम्मेदारी","राहु":"महत्वाकांक्षा, तकनीक और असामान्य अवसर","केतु":"शोध, वैराग्य और आध्यात्मिकता"};
    const sideTitle=document.createElement("h4");sideTitle.textContent="वर्तमान दशा स्वामी — स्थिति व संकेत";side.appendChild(sideTitle);
    const addInsight=(planet,label)=>{
      const p=positions[planet],card=document.createElement("section");card.className="dasha-insight-card";
      const title=document.createElement("strong");title.textContent=label+" : "+planet;card.appendChild(title);
      if(!p){addNote(card,"इस ग्रह की D1 स्थिति उपलब्ध नहीं है।");side.appendChild(card);return;}
      const detail=document.createElement("p");detail.textContent="भाव "+(p.house||"—")+" | राशि "+(p.rashi||"—")+" | नक्षत्र "+(p.nakshatra||"—")+" | चरण "+(p.pada||"—")+(p.retrograde?" | वक्री":"");card.appendChild(detail);
      const factor=document.createElement("p");factor.textContent="मुख्य कारकत्व: "+(meanings[planet]||"ग्रह के स्वाभाविक कारकत्व");card.appendChild(factor);
      const reading=document.createElement("p");reading.textContent="संक्षिप्त संकेत: इस दशा में भाव "+(p.house||"—")+" से जुड़े विषय सक्रिय होंगे। राशि और नक्षत्र के स्वामी परिणामों का स्वर तय करेंगे। अंतिम फलादेश के लिए भावेशत्व, दृष्टि, युति, नवांश और संयुक्त दशा भी देखना आवश्यक है; इसे अकेले निश्चित शुभ-अशुभ न मानें।";card.appendChild(reading);side.appendChild(card);
    };
    if(currentDasha.mahadasha)addInsight(currentDasha.mahadasha,"महादशा स्वामी");
    if(currentDasha.antardasha&&currentDasha.antardasha!==currentDasha.mahadasha)addInsight(currentDasha.antardasha,"अंतर्दशा स्वामी");
    if(!currentDasha.mahadasha)addNote(side,"कुंडली बनने पर वर्तमान महादशा व अंतर्दशा स्वामी यहाँ दिखेंगे।");
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

    const dasha=chart.dasha;
    if(dasha){
      const active=dasha.current||{};
      const p=document.createElement("p");p.className="chat-info";
      p.textContent="वर्तमान दशा: "+(active.mahadasha||"—")+" महादशा / "+(active.antardasha||"—")+" अंतर्दशा / "+(active.pratyantardasha||"—")+" प्रत्यंतरदशा";
      dashaFolder.appendChild(p);
      const dates=document.createElement("p");dates.className="chat-info";
      dates.textContent="महादशा: "+(active.mahadashaStart?new Date(active.mahadashaStart).toLocaleDateString():"—")+" से "+(active.mahadashaEnd?new Date(active.mahadashaEnd).toLocaleDateString():"—")+" | अंतर्दशा: "+(active.antardashaStart?new Date(active.antardashaStart).toLocaleDateString():"—")+" से "+(active.antardashaEnd?new Date(active.antardashaEnd).toLocaleDateString():"—");
      dashaFolder.appendChild(dates);
      const timeline=document.createElement("div");timeline.className="nakshatra-panel";
      const timelineTitle=document.createElement("h4");timelineTitle.textContent="विंशोत्तरी महादशा समय-रेखा";timelineTitle.style.cssText="color:#f5c66b;margin:4px 0 8px";timeline.appendChild(timelineTitle);
      const table=document.createElement("table");table.style.cssText="width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap";
      const header=document.createElement("tr");["महादशा","आरंभ","समाप्ति","अंतर्दशाएँ"].forEach(v=>{const th=document.createElement("th");th.textContent=v;th.style.cssText="text-align:left;padding:7px;color:#f5d994";header.appendChild(th);});table.appendChild(header);
      const fmt=v=>v?new Date(v).toLocaleDateString("hi-IN"):"—";
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
          const planet=document.createElement("strong");planet.textContent=period.planet||"—";planet.style.cssText="display:block;color:#f5d994;font-size:11px";
          const dates=document.createElement("small");dates.textContent=fmt(period.start)+" – "+fmt(period.end);dates.style.cssText="display:block;color:#d4c9e5;font-size:9px;margin-top:3px";
          segment.append(planet,dates);track.appendChild(segment);
        });
        wrap.appendChild(track);host.appendChild(wrap);
      };
      appendPeriodBar(timeline,dasha.mahadashas||[],"महादशाओं की दृश्य समय-रेखा");
      (dasha.mahadashas||[]).forEach(md=>{
        const row=document.createElement("tr");
        [md.planet,fmt(md.start),fmt(md.end),(md.antardashas||[]).length+" अवधि"].forEach(v=>{const td=document.createElement("td");td.textContent=String(v);td.style.cssText="padding:7px;border-top:1px solid #493568";row.appendChild(td);});table.appendChild(row);
        const item=document.createElement("details");item.className="chart-item";
        const sum=document.createElement("summary");sum.textContent=md.planet+" महादशा की अंतर्दशा और प्रत्यंतरदशा";item.appendChild(sum);
        const sub=document.createElement("div");sub.style.cssText="overflow-x:auto";
        appendPeriodBar(sub,md.antardashas||[],"इस महादशा की अंतर्दशाएँ");
        const subTable=document.createElement("table");subTable.style.cssText="width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap";
        const subHead=document.createElement("tr");["अंतर्दशा","आरंभ","समाप्ति","प्रत्यंतरदशाएँ"].forEach(v=>{const th=document.createElement("th");th.textContent=v;th.style.cssText="text-align:left;padding:6px;color:#f5d994";subHead.appendChild(th);});subTable.appendChild(subHead);
        (md.antardashas||[]).forEach(ad=>{const ar=document.createElement("tr");[ad.planet,fmt(ad.start),fmt(ad.end),(ad.pratyantardashas||[]).length+" अवधि"].forEach(v=>{const td=document.createElement("td");td.textContent=String(v);td.style.cssText="padding:6px;border-top:1px solid #493568";ar.appendChild(td);});subTable.appendChild(ar);
          const pd=document.createElement("tr");const cell=document.createElement("td");cell.colSpan=4;cell.style.cssText="padding:6px 10px;color:#d4c9e5;white-space:normal";
          const pdLabel=document.createElement("p");pdLabel.textContent="प्रत्यंतरदशाएँ";pdLabel.style.cssText="margin:2px 0;color:#f5d994;font-weight:700";cell.appendChild(pdLabel);
          appendPeriodBar(cell,ad.pratyantardashas||[],"प्रत्यंतरदशा क्रम");
          pd.appendChild(cell);subTable.appendChild(pd);
        });
        sub.appendChild(subTable);item.appendChild(sub);dashaFolder.appendChild(item);
      });
      timeline.appendChild(table);dashaFolder.appendChild(timeline);
    } else addNote(dashaFolder,"विंशोत्तरी दशा डेटा उपलब्ध नहीं है।");

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
    addNote(strength,"षड्बल और भावबल की शास्त्रीय गणना अभी पूरी तरह लागू नहीं है। सत्यापित गणना जुड़ने के बाद ही ग्रहों और भावों के बल दिखाए जाएँगे।");
    const toolbar=document.createElement("div");
    toolbar.className="calculation-tabs calculation-tabs-with-arrows";
    toolbar.setAttribute("role","tablist");
    toolbar.setAttribute("aria-label","ज्योतिषीय गणनाएँ");
    const makeArrow=(label,direction)=>{
      const button=document.createElement("button");button.type="button";button.className="calculation-tab-arrow";
      button.textContent=label;button.setAttribute("aria-label",direction<0?"टैब बाएँ करें":"टैब दाएँ करें");
      button.addEventListener("click",()=>toolbar.scrollBy({left:direction*180,behavior:"smooth"}));return button;
    };
    const panelHost=document.createElement("div");panelHost.className="calculation-panels";
    const specs=[["महादशा व फलादेश","dasha",dashaFolder],["नवतारा चक्र (तारा बल)","tara",tara],["षड्बल (Shadbala)","shadbala",null],["भाव बल (Bhava Bala)","bhava",null],["अष्टकवर्ग (Ashtakvarga)","ashtak",ashtak],["षोडश वर्ग (D2 से D60)","varga",null]];
    const pages=[];
    specs.forEach(([label,key,content],index)=>{
      const page=document.createElement("section");page.className="calculation-page"+(index===0?" active":"");
      page.dataset.calculationPage=key;page.setAttribute("role","tabpanel");
      if(content)page.appendChild(content);
      pages.push(page);panelHost.appendChild(page);
      const button=document.createElement("button");button.type="button";button.textContent=label;
      button.setAttribute("role","tab");button.setAttribute("aria-selected",String(index===0));
      button.addEventListener("click",()=>{
        pages.forEach((item,i)=>item.classList.toggle("active",i===index));
        toolbar.querySelectorAll('[role="tab"]').forEach((tab,i)=>tab.setAttribute("aria-selected",String(i===index)));
        button.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
      });
      toolbar.appendChild(button);
    });
    toolbar.insertBefore(makeArrow("‹",-1),toolbar.firstChild);
    toolbar.appendChild(makeArrow("›",1));
    const strengthSections=Array.from(strength.children).filter(node=>node.tagName==="SECTION");
    if(strengthSections[0])pages[2].appendChild(strengthSections[0]);
    if(strengthSections[1])pages[3].appendChild(strengthSections[1]);
    Array.from(strength.children).filter(node=>node.tagName!=="SECTION").forEach(node=>pages[2].appendChild(node));
    const vargaFolder=$("kundliChartsFolder");
    if(vargaFolder)pages[5].appendChild(vargaFolder);
    if(side)pages[0].appendChild(side);
    root.replaceChildren(toolbar,panelHost);
  }


  function renderVargaCharts(chart) {
    const root=$("vargaCharts");
    if(!root)return;
    root.replaceChildren();
    const heading=document.createElement("h3");
    heading.textContent="Other Divisional Charts — D2 to D60";
    root.appendChild(heading);
    const note=document.createElement("p");
    note.textContent="Open any divisional chart to view its twelve signs and planetary placements. D1 (Rashi) is shown above.";
    root.appendChild(note);
    const wrap=document.createElement("div");
    wrap.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px";
    const charts=chart.vargas||{};
    for(const [key,varga] of Object.entries(charts)){
      if(key==="D1" || key==="D9") continue;
      const card=document.createElement("details");
      card.className="chart-item";
      card.style.cssText="border:1px solid rgba(220,190,130,.35);border-radius:12px;padding:12px;min-width:0;background:rgba(20,16,32,.45)";
      const title=document.createElement("summary");
      title.textContent=key+" — "+varga.name+" | Ascendant "+signNames[varga.ascendant.rashiIndex];
      const grid=document.createElement("div");
      grid.style.cssText="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px";
      const occupants={};
      for(const [planetName,position] of Object.entries(varga.planets||{})){
        (occupants[position.house]||(occupants[position.house]=[])).push((selectedChartLanguage()==="hi"?({Sun:"सूर्य",Moon:"चंद्र",Mars:"मंगल",Mercury:"बुध",Jupiter:"गुरु",Venus:"शुक्र",Saturn:"शनि",Rahu:"राहु",Ketu:"केतु"}[planetName]||planetName):planetName)+(position.retrograde?" ℞":""));
      }
      for(let house=1;house<=12;house++){
        const signIndex=(varga.ascendant.rashiIndex+house-1)%12;
        const cell=document.createElement("div");
        cell.style.cssText="min-height:72px;padding:6px;border-radius:7px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);font-size:12px;overflow-wrap:anywhere";
        const signLabel=document.createElement("div");
        signLabel.textContent=signNames[signIndex];
        const planetLabel=document.createElement("div");
        planetLabel.style.cssText="margin-top:4px;color:#f5d994";
        planetLabel.textContent=(occupants[house]||[]).join(", ")||"—";
        if(house===1)cell.style.borderColor="rgba(245,217,148,.75)";
        cell.append(signLabel,planetLabel);
        grid.appendChild(cell);
      }
      card.append(title,grid);
      wrap.appendChild(card);
    }
    root.appendChild(wrap);
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

  async function findBirthPlace(place, options = {}) {
    const openMeteoUrl = new URL(GEOCODING_URL);
    openMeteoUrl.search = new URLSearchParams({
      name: place,
      count: "8",
      language: "en",
      format: "json"
    });

    let openMeteoError = null;
    try {
      const response = await fetch(openMeteoUrl, { headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error("Open-Meteo geocoding returned HTTP " + response.status);
      const data = await response.json();
      if (Array.isArray(data.results) && data.results.length) return data.results;
    } catch (error) {
      openMeteoError = error;
    }

    // Nominatim is used only for an explicit form submission, not autocomplete.
    // The backend applies an identifying User-Agent and Nominatim's 1 req/sec policy.
    if (options.allowOsmFallback) {
      try {
        const response = await fetch("/api/geocode?q=" + encodeURIComponent(place), {
          headers: { "Accept": "application/json" }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || "OpenStreetMap lookup failed");
        return Array.isArray(data.results) ? data.results : [];
      } catch (osmError) {
        console.error("Global geocoding failed:", openMeteoError?.message, osmError?.message);
        throw new Error("जन्मस्थान नहीं मिल सका। शहर के साथ राज्य और देश का नाम लिखकर दोबारा प्रयास करें।");
      }
    }
    return [];

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

  async function generateKundli(details, location) {
    const payload = {
      name: details.name,

      birthDate: details.date,

      birthTime: details.time,
      saveToAccount: details.saveToAccount,

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

      let result;
      try {
        result = await response.json();
      } catch (_) {
        result = null;
      }

      if (!response.ok) {
        throw new Error(result?.message || ("Chart server returned HTTP " + response.status + "."));
      }

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

      showMessage((result.message || "Birth chart calculation completed.") + (result.savedKundliId ? " Your birth chart has been saved to your account." : (details.saveToAccount ? " The birth chart could not be saved. Check login and server settings." : "")));
      document.dispatchEvent(new CustomEvent("astro:kundli-ready", { detail: chart }));
      if (result.savedKundliId && window.loadKundliHistory) window.loadKundliHistory();

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

      if (button) {
        button.disabled = true;
        button.textContent = "जाँच हो रही है...";
      }

      showMessage("Searching birth place...");

      const cached = selectedBirthPlace && selectedBirthPlace.label === details.place
        ? selectedBirthPlace
        : null;
      const results = cached ? [cached] : await findBirthPlace(details.place, { allowOsmFallback: true });

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

  function initialize() {
    const form = $("kundliForm");

    if (!form) {
      console.warn(
        "Kundli form नहीं मिला। index.html की जाँच करें।"
      );
      return;
    }

    form.addEventListener("submit", handleSubmit);
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
