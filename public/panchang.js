"use strict";
(function(){
  const $=id=>document.getElementById(id);
  const tr=value=>window.AstroLanguage?.translate?window.AstroLanguage.translate(value):String(value??"");
  const form=$("panchangForm");
  if(!form)return;
  const today=new Date();
  $("panchangDate").value=today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");
  const out=$("panchangOutput"), status=$("panchangMessage");
  const placeButton=$("panchangFindPlace"), placeSelect=$("panchangPlaceResults");
  let foundPlaces=[];
  function applyPlace(){
    const place=foundPlaces[Number(placeSelect.value)];
    if(!place)return;
    $("panchangLat").value=String(place.latitude);
    $("panchangLon").value=String(place.longitude);
    status.textContent=tr("स्थान चुना गया: ")+[place.name,place.admin1,place.country].filter(Boolean).join(", ");
    status.style.display="block";
  }
  placeButton.addEventListener("click",async()=>{
    const query=$("panchangPlace").value.trim();
    if(!query){status.textContent="पहले शहर या गाँव का नाम लिखें।";status.style.display="block";return;}
    placeButton.disabled=true;status.textContent="स्थान खोजा जा रहा है…";status.style.display="block";
    try{
      const url="https://geocoding-api.open-meteo.com/v1/search?"+new URLSearchParams({name:query,count:"8",language:(window.AstroLanguage?.get?.() || document.documentElement.lang || "en").split("-")[0],format:"json"});
      const response=await fetch(url);
      if(!response.ok)throw new Error("स्थान खोजने में समस्या आई।");
      const data=await response.json();foundPlaces=Array.isArray(data.results)?data.results:[];
      if(!foundPlaces.length)throw new Error("स्थान नहीं मिला। शहर या गाँव का नाम जाँचें।");
      placeSelect.replaceChildren();
      foundPlaces.forEach((place,index)=>{
        const option=document.createElement("option");
        option.value=String(index);
        option.textContent=[place.name,place.admin1,place.country].filter(Boolean).join(", ");
        placeSelect.appendChild(option);
      });
      placeSelect.style.display="block";placeSelect.value="0";applyPlace();
    }catch(error){status.textContent=error.message;status.style.display="block";}
    finally{placeButton.disabled=false;}
  });
  placeSelect.addEventListener("change",applyPlace);
  $("panchangPlace").addEventListener("input",()=>{
    $("panchangLat").value="";$("panchangLon").value="";placeSelect.style.display="none";
  });
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function render(d){
    const p=d.panchang,k=d.kaal;
    const dayChoghadiya=d.choghadiya.day.map(x=>"<tr><td>"+x.number+"</td><td>"+esc(tr(x.name))+"</td><td>"+esc(tr(x.time))+"</td></tr>").join("");
    const nightChoghadiya=d.choghadiya.night.map(x=>"<tr><td>"+x.number+"</td><td>"+esc(x.name)+"</td><td>"+esc(x.time)+"</td></tr>").join("");
    const bhadra=(k.bhadraIntervals&&k.bhadraIntervals.length)?k.bhadraIntervals.map(v=>esc(tr(v))).join("<br>"):tr("इस दिन सूर्योदय से अगले सूर्योदय तक भद्रा नहीं।");
    const rows=d.hora.map(h=>"<tr><td>"+h.number+"</td><td>"+esc(tr(h.lord))+"</td><td>"+esc(tr(h.time))+"</td></tr>").join("");
    out.innerHTML=[
      "<div class='chat-info'><strong>"+esc(tr(d.weekday))+" · "+esc(d.date)+"</strong> ("+esc(d.timezone)+")</div>",
      "<h3>पंचांग के पाँच अंग</h3><div class='chat-info'>",
      "<p><strong>तिथि:</strong> "+esc(tr(p.tithi))+" ("+esc(tr(p.paksha))+") · समाप्ति "+esc(p.tithiEnds||"उपलब्ध नहीं")+"</p>",
      "<p><strong>नक्षत्र:</strong> "+esc(tr(p.nakshatra))+", चरण "+p.pada+" · समाप्ति "+esc(p.nakshatraEnds||"उपलब्ध नहीं")+"</p>",
      "<p><strong>योग:</strong> "+esc(tr(p.yoga))+" · समाप्ति "+esc(p.yogaEnds||"उपलब्ध नहीं")+"</p>",
      "<p><strong>करण:</strong> "+esc(tr(p.karana))+" · समाप्ति "+esc(p.karanaEnds||"उपलब्ध नहीं")+"</p></div>",
      "<h3>सूर्य और चंद्र समय</h3><div class='chat-info'><p>सूर्योदय: "+esc(d.sunrise)+" · सूर्यास्त: "+esc(d.sunset)+"</p>",
      "<p>चंद्रोदय: "+esc(d.moonrise||"नहीं मिला")+" · चंद्रास्त: "+esc(d.moonset||"नहीं मिला")+"</p></div>",
      "<h3>दैनिक काल</h3><div class='chat-info'><p>राहुकाल: "+esc(k.rahuKaal)+"</p><p>यमगण्ड: "+esc(k.yamagand)+"</p>",
      "<p>गुलिक काल: "+esc(k.gulika)+"</p><p>अभिजित मुहूर्त: "+esc(k.abhijit)+"</p><p><strong>भद्रा:</strong><br>"+bhadra+"</p></div>",
      "<h3>दिन का चौघड़िया</h3><div style='overflow-x:auto'><table style='width:100%;border-collapse:collapse;font-size:13px'><thead><tr><th>भाग</th><th>चौघड़िया</th><th>समय</th></tr></thead><tbody>"+dayChoghadiya+"</tbody></table></div>",
      "<h3>रात्रि का चौघड़िया</h3><div style='overflow-x:auto'><table style='width:100%;border-collapse:collapse;font-size:13px'><thead><tr><th>भाग</th><th>चौघड़िया</th><th>समय</th></tr></thead><tbody>"+nightChoghadiya+"</tbody></table></div>",
      "<h3>आज की 24 होरा</h3><div style='overflow-x:auto'><table style='width:100%;border-collapse:collapse;font-size:13px'><thead><tr><th>होरा</th><th>ग्रह</th><th>समय</th></tr></thead><tbody>"+rows+"</tbody></table></div>",
      "<p class='chat-info'>"+esc(tr(d.note))+"</p>"
    ].join("");
    out.style.display="block";
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const latText=$("panchangLat").value,lonText=$("panchangLon").value;
    const lat=Number(latText),lon=Number(lonText);
    if(!latText||!lonText||!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180){
      status.textContent="कृपया सही अक्षांश और देशांतर भरें।";status.style.display="block";return;
    }
    status.textContent="पंचांग की गणना हो रही है…";status.style.display="block";out.style.display="none";
    try{
      const q=new URLSearchParams({date:$("panchangDate").value,lat:String(lat),lon:String(lon)});
      const response=await fetch("/api/panchang?"+q.toString()),data=await response.json();
      if(!response.ok||!data.success)throw new Error(data.message||"गणना उपलब्ध नहीं है।");
      render(data);status.style.display="none";
    }catch(err){status.textContent=err.message||"पंचांग लोड नहीं हो पाया।";}
  });
})();