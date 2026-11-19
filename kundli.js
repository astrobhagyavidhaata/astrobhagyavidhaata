
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
      for(const [planet,p] of Object.entries(spec.planets)){const house=Number(p.house);if(Number.isInteger(house)&&house>=1&&house<=12)(occupants[house]||=[]).push(planet);}
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
        const names=occupants[house]||[];for(let i=0;i<names.length;i+=2){const span=document.createElementNS(ns,"tspan");span.setAttribute("x",x);span.setAttribute("dy",i===0?"0":"11");span.textContent=names.slice(i,i+2).join(" ");ptext.appendChild(span);}
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
      ["ग्रह","राशि","भाव","अंश","नक्षत्र","चरण","नक्षत्र स्वामी"].forEach(label=>{const th=document.createElement("th");th.textContent=label;trh.appendChild(th);});
      thead.appendChild(trh);table.appendChild(thead);
      const tbody=document.createElement("tbody");
      const nakshatraLords=["केतु","शुक्र","सूर्य","चंद्र","मंगल","राहु","गुरु","शनि","बुध"];
      const rows=[["लग्न",chart.d1.ascendant||{}],...Object.entries(chart.d1.planets||{})];
      for(const [planet,p] of rows){
        const degree=Number(p.degreeInRashi);
        const degreeText=Number.isFinite(degree)?degree.toFixed(2)+"°":"—";
        const pada=Number(p.pada);
        const padaText=Number.isInteger(pada)&&pada>=1&&pada<=4?"चरण "+pada:"—";
        const house=Number(p.house);
        const houseText=Number.isInteger(house)&&house>=1&&house<=12?house+"वाँ":"—";
        const nakshatraIndex=Number(p.nakshatraIndex);
        const nakshatraLord=Number.isInteger(nakshatraIndex)&&nakshatraIndex>=0&&nakshatraIndex<27?nakshatraLords[nakshatraIndex%9]:"—";
        const planetText=planet+(p.retrograde?" ℞":"");
        const values=[planetText,p.rashi||signs[p.rashiIndex]||"—",houseText,degreeText,p.nakshatra||"—",padaText,nakshatraLord];
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
      const p=document.createElement("p");p.className="chat-info";
      p.textContent="वर्तमान दशा: "+(active.mahadasha||"—")+" महादशा / "+(active.antardasha||"—")+" अंतर्दशा / "+(active.pratyantardasha||"—")+" प्रत्यंतरदशा";
      dashaFolder.appendChild(p);
      const dates=document.createElement("p");dates.className="chat-info";
      dates.textContent="महादशा: "+(active.mahadashaStart?new Date(active.mahadashaStart).toLocaleDateString():"—")+" से "+(active.mahadashaEnd?new Date(active.mahadashaEnd).toLocaleDateString():"—")+" | अंतर्दशा: "+(active.antardashaStart?new Date(active.antardashaStart).toLocaleDateString():"—")+" से "+(active.antardashaEnd?new Date(active.antardashaEnd).toLocaleDateString():"—");
      dashaFolder.appendChild(dates);
      const periodDate=value=>value?new Date(value).toLocaleDateString("hi-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
      const periodRange=(item)=>periodDate(item.start)+" से "+periodDate(item.end);
      const activeMD=active.mahadasha, activeAD=active.antardasha, activePD=active.pratyantardasha;
      const activeBox=document.createElement("div");activeBox.className="dasha-current-card";
      activeBox.innerHTML="";
      const activeTitle=document.createElement("h4");activeTitle.textContent="अभी चल रही विंशोत्तरी दशा";activeBox.appendChild(activeTitle);
      const activeGrid=document.createElement("div");activeGrid.className="dasha-current-grid";
      [[ "महादशा",activeMD,active.mahadashaStart,active.mahadashaEnd ],["अंतरदशा",activeAD,active.antardashaStart,active.antardashaEnd],["प्रत्यंतरदशा",activePD,active.pratyantardashaStart,active.pratyantardashaEnd]].forEach(([label,planet,start,end])=>{
        const item=document.createElement("div");item.className="dasha-current-item";
        const name=document.createElement("strong");name.textContent=label;const value=document.createElement("span");value.textContent=planet||"—";
        const range=document.createElement("small");range.textContent=periodDate(start)+" – "+periodDate(end);
        item.append(name,value,range);activeGrid.appendChild(item);
      });
      activeBox.appendChild(activeGrid);dashaFolder.appendChild(activeBox);
      const scheduleTitle=document.createElement("h4");scheduleTitle.textContent="पूरी महादशा एवं अंतरदशा समय-सारणी";dashaFolder.appendChild(scheduleTitle);
      const schedule=Array.isArray(dasha.mahadashas)?dasha.mahadashas:[];
      if(schedule.length){
        schedule.forEach(mdItem=>{
          const mdDetails=document.createElement("details");mdDetails.className="dasha-period";mdDetails.open=false;
          const mdSummary=document.createElement("summary");mdSummary.textContent=mdItem.planet+" महादशा  •  "+periodRange(mdItem)+(mdItem.planet===activeMD?"  |  अभी चल रही":"");
          mdDetails.appendChild(mdSummary);
          const adList=document.createElement("div");adList.className="dasha-subperiod-list";
          (mdItem.antardashas||[]).forEach(adItem=>{
            const adDetails=document.createElement("details");adDetails.className="dasha-subperiod";adDetails.open=false;
            const adSummary=document.createElement("summary");adSummary.textContent=mdItem.planet+" / "+adItem.planet+"  •  "+periodRange(adItem)+(mdItem.planet===activeMD&&adItem.planet===activeAD?"  |  वर्तमान":"");
            adDetails.appendChild(adSummary);
            const pdTable=document.createElement("table");pdTable.className="dasha-date-table";
            const head=document.createElement("tr");["प्रत्यंतरदशा","आरंभ","समाप्ति"].forEach(label=>{const th=document.createElement("th");th.textContent=label;head.appendChild(th);});pdTable.appendChild(head);
            (adItem.pratyantardashas||[]).forEach(pdItem=>{
              const row=document.createElement("tr");
              [pdItem.planet,periodDate(pdItem.start),periodDate(pdItem.end)].forEach((value,index)=>{const cell=document.createElement("td");cell.textContent=value;row.appendChild(cell);});
              if(mdItem.planet===activeMD&&adItem.planet===activeAD&&pdItem.planet===activePD)row.className="dasha-active-row";
              pdTable.appendChild(row);
            });
            adDetails.appendChild(pdTable);adList.appendChild(adDetails);
          });
          mdDetails.appendChild(adList);
          if(mdItem.planet===activeMD){mdDetails.open=true;const currentAd=Array.from(adList.children).find((el)=>el.querySelector("summary")?.textContent.startsWith(activeMD+" / "+activeAD));if(currentAd)currentAd.open=true;}
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
        return {planet,sign:p.rashi||signNames[Number(p.rashiIndex)]||"—",house:Number.isInteger(house)&&house>=1&&house<=12?house:null,nak:p.nakshatra||"—",pada:p.pada||"—",nakLord:lord,retrograde:!!p.retrograde};
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
          return {sign:q.rashi||signNames[Number(q.rashiIndex)]||"—",house:Number.isInteger(qHouse)&&qHouse>=1&&qHouse<=12?qHouse:null,nak:q.nakshatra||"—",pada:q.pada||"—"};
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

      }
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
        if(Number.isInteger(house)&&house>=1&&house<=12)(occupants[house]||(occupants[house]=[])).push(planetName+(position.retrograde?" ℞":""));
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
        const signText=document.createElementNS(ns,"text");signText.setAttribute("x",x);signText.setAttribute("y",y-9);signText.setAttribute("text-anchor","middle");signText.setAttribute("font-size","12");signText.setAttribute("font-weight","bold");signText.setAttribute("fill","#4b2d16");signText.textContent=signNames[sign];
        const planetText=document.createElementNS(ns,"text");planetText.setAttribute("x",x);planetText.setAttribute("y",y+9);planetText.setAttribute("text-anchor","middle");planetText.setAttribute("font-size","10");planetText.setAttribute("font-weight","600");planetText.setAttribute("fill","#9a421d");
        const names=occupants[house]||[];for(let i=0;i<names.length;i+=2){const span=document.createElementNS(ns,"tspan");span.setAttribute("x",x);span.setAttribute("dy",i===0?"0":"11");span.textContent=names.slice(i,i+2).join(" ");planetText.appendChild(span);}
        group.append(signText,planetText);svg.appendChild(group);
      }
      card.appendChild(svg);
      const caption=document.createElement("p");caption.className="chart-asc";caption.textContent="लग्न: "+signNames[Number(varga.ascendant.rashiIndex)];card.appendChild(caption);
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
      language: "en",
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
