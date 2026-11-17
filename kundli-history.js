"use strict";
(function(){
  const $=id=>document.getElementById(id);
  const list=$("kundliHistoryList"),preview=$("savedKundliPreview");
  const loadButton=$("loadKundliHistory");
  if(!list||!loadButton)return;

  async function api(url){
    const response=await fetch(url,{credentials:"same-origin",headers:{Accept:"application/json"}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.message||"कुंडली जानकारी नहीं मिली।");
    return data;
  }
  function dateText(value){
    if(!value)return "";
    const date=new Date(value);
    return Number.isNaN(date.getTime())?String(value):date.toLocaleDateString("hi-IN");
  }
  function showPreview(record){
    const chart=record.chart;
    window.AstroKundli=chart;
    document.dispatchEvent(new CustomEvent("astro:kundli-ready",{detail:chart}));
    const lines=[
      "नाम: "+(chart.name||"—"),
      "जन्म: "+(chart.birth?.localDate||"")+" "+(chart.birth?.localTime||""),
      "स्थान: "+(chart.birth?.place||"")+" ("+(chart.birth?.timezone||"")+")",
      "D1 लग्न: "+(chart.d1?.ascendant?.rashi||"—"),
      "D9 लग्न: "+(chart.d9?.ascendant?.rashi||"—"),
      "वर्तमान दशा: "+[chart.dasha?.current?.mahadasha,chart.dasha?.current?.antardasha,chart.dasha?.current?.pratyantardasha].filter(Boolean).join(" / ")
    ];
    for(const [name,p] of Object.entries(chart.d1?.planets||{})){
      lines.push(name+": "+p.rashi+" · भाव "+p.house);
    }
    preview.textContent=lines.join("\n");
    const consult=document.createElement("button");
    consult.type="button";consult.textContent="इस कुंडली से परामर्श शुरू करें";
    consult.addEventListener("click",()=>{if(typeof window.openChatBox==="function")window.openChatBox("AI वैदिक ज्योतिष सहायक",5);});
    preview.appendChild(document.createElement("br"));
    preview.appendChild(consult);
  }
  async function openKundli(id){
    preview.textContent="कुंडली लोड हो रही है…";
    try{const data=await api("/api/kundlis/"+encodeURIComponent(id));showPreview(data.kundli);}
    catch(error){preview.textContent=error.message;}
  }
  async function loadHistory(){
    list.textContent="कुंडली इतिहास लोड हो रहा है…";preview.textContent="";
    try{
      const data=await api("/api/kundlis");
      list.replaceChildren();
      if(!data.kundlis?.length){list.textContent="अभी कोई कुंडली सुरक्षित नहीं है। नई कुंडली बनाते समय सुरक्षित करने का विकल्प चुनें।";return;}
      data.kundlis.forEach(item=>{
        const wrapper=document.createElement("div");
        wrapper.style.cssText="border:1px solid #493568;border-radius:9px;padding:10px;margin-top:9px";
        const title=document.createElement("strong");title.textContent=item.title||"जन्म कुंडली";
        const details=document.createElement("p");details.textContent=[
          item.birthDetails?.localDate,
          item.birthDetails?.localTime,
          item.birthDetails?.place
        ].filter(Boolean).join(" · ");
        details.style.margin="7px 0";
        const button=document.createElement("button");button.type="button";button.className="secondary";button.textContent="कुंडली खोलें";
        button.addEventListener("click",()=>openKundli(item.id));
        const remove=document.createElement("button");remove.type="button";remove.className="secondary";remove.textContent="इस कुंडली को हटाएँ";
        remove.addEventListener("click",async()=>{
          if(!window.confirm("क्या आप यह सुरक्षित कुंडली हटाना चाहते हैं?"))return;
          try{
            const response=await fetch("/api/kundlis/"+encodeURIComponent(item.id),{method:"DELETE",credentials:"same-origin",headers:{Accept:"application/json"}});
            const result=await response.json().catch(()=>({}));
            if(!response.ok)throw new Error(result.message||"कुंडली हटाई नहीं जा सकी।");
            wrapper.remove();preview.textContent="कुंडली हटा दी गई।";
          }catch(error){preview.textContent=error.message;}
        });
        wrapper.append(title,details,button,remove);list.appendChild(wrapper);
      });
    }catch(error){list.textContent=error.message;}
  }
  loadButton.addEventListener("click",loadHistory);
  document.addEventListener("astro:auth-changed",event=>{if(event.detail)loadHistory();else{list.textContent="कुंडली इतिहास देखने के लिए लॉगिन करें।";preview.textContent="";}});
  window.loadKundliHistory=loadHistory;
})();