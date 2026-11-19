"use strict";
(function(){
  const KEY="saved_kundalis";
  const $=id=>document.getElementById(id);
  const list=$("kundliHistoryList"),preview=$("savedKundliPreview");
  const loadButton=$("loadKundliHistory");
  if(!list||!loadButton)return;

  function readSaved(){
    try{
      const value=JSON.parse(localStorage.getItem(KEY)||"[]");
      return Array.isArray(value)?value.filter(item=>item&&item.id&&item.chart):[];
    }catch(_){return [];}
  }
  function showPreview(record){
    const chart=record.chart;
    window.AstroKundli=chart;
    document.dispatchEvent(new CustomEvent("astro:kundli-ready",{detail:chart}));
    const lines=[
      "नाम: "+(chart.name||record.birthDetails?.name||"—"),
      "जन्म: "+(chart.birth?.localDate||record.birthDetails?.localDate||"")+" "+(chart.birth?.localTime||record.birthDetails?.localTime||""),
      "स्थान: "+(chart.birth?.place||record.birthDetails?.place||"—"),
      "D1 लग्न: "+(chart.d1?.ascendant?.rashi||"—"),
      "D9 लग्न: "+(chart.d9?.ascendant?.rashi||"—"),
      "वर्तमान दशा: "+[chart.dasha?.current?.mahadasha,chart.dasha?.current?.antardasha,chart.dasha?.current?.pratyantardasha].filter(Boolean).join(" / ")
    ];
    for(const [name,p] of Object.entries(chart.d1?.planets||{})){
      lines.push(name+": "+(p.rashi||"—")+" · भाव "+(p.house??"—"));
    }
    preview.replaceChildren();
    const details=document.createElement("pre");
    details.style.cssText="white-space:pre-wrap;font:inherit;line-height:1.7;margin:0";
    details.textContent=lines.join("\n");
    const consult=document.createElement("button");
    consult.type="button";consult.textContent="इस कुंडली से परामर्श शुरू करें";
    consult.addEventListener("click",()=>{if(typeof window.openChatBox==="function")window.openChatBox("AI वैदिक ज्योतिष सहायक",5);});
    preview.append(details,consult);
  }
  function renderList(){
    const records=readSaved();
    list.replaceChildren();
    if(!records.length){
      list.textContent="अभी कोई कुंडली सुरक्षित नहीं है। नई कुंडली बनाते समय सुरक्षित करने का विकल्प चुनें।";
      preview.textContent="";
      return;
    }
    records.forEach(record=>{
      const wrapper=document.createElement("div");
      wrapper.style.cssText="border:1px solid #dedede;border-radius:9px;padding:10px;margin-top:9px;background:#fff";
      const title=document.createElement("strong");
      title.textContent=record.title||record.chart?.name||"जन्म कुंडली";
      const details=document.createElement("p");
      details.style.margin="7px 0";
      details.textContent=[
        record.birthDetails?.localDate||record.chart?.birth?.localDate,
        record.birthDetails?.localTime||record.chart?.birth?.localTime,
        record.birthDetails?.place||record.chart?.birth?.place
      ].filter(Boolean).join(" · ");
      const open=document.createElement("button");
      open.type="button";open.textContent="कुंडली खोलें";
      open.addEventListener("click",()=>showPreview(record));
      const remove=document.createElement("button");
      remove.type="button";remove.className="secondary";remove.textContent="इस कुंडली को हटाएँ";
      remove.addEventListener("click",()=>{
        if(!window.confirm("क्या आप यह सुरक्षित कुंडली हटाना चाहते हैं?"))return;
        const remaining=readSaved().filter(item=>item.id!==record.id);
        localStorage.setItem(KEY,JSON.stringify(remaining));
        if(window.AstroKundli===record.chart)window.AstroKundli=null;
        preview.textContent="कुंडली हटा दी गई।";
        renderList();
      });
      wrapper.append(title,details,open,remove);
      list.appendChild(wrapper);
    });
  }
  loadButton.addEventListener("click",renderList);
  document.addEventListener("astro:kundli-saved",renderList);
  document.addEventListener("astro:auth-changed",renderList);
  window.addEventListener("storage",event=>{if(event.key===KEY)renderList();});
  window.loadKundliHistory=renderList;
  renderList();
})();