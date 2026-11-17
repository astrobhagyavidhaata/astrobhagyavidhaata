"use strict";
(function(){
  const $=id=>document.getElementById(id);
  const form=$("panchangForm");
  if(!form)return;
  $("panchangDate").value=new Date().toISOString().slice(0,10);
  const out=$("panchangOutput"), status=$("panchangMessage");
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function render(d){
    const p=d.panchang,k=d.kaal;
    const rows=d.hora.map(h=>"<tr><td>"+h.number+"</td><td>"+esc(h.lord)+"</td><td>"+esc(h.time)+"</td></tr>").join("");
    out.innerHTML=[
      "<div class='chat-info'><strong>"+esc(d.weekday)+" · "+esc(d.date)+"</strong> ("+esc(d.timezone)+")</div>",
      "<h3>पंचांग के पाँच अंग</h3><div class='chat-info'>",
      "<p><strong>तिथि:</strong> "+esc(p.tithi)+" ("+esc(p.paksha)+") · समाप्ति "+esc(p.tithiEnds||"उपलब्ध नहीं")+"</p>",
      "<p><strong>नक्षत्र:</strong> "+esc(p.nakshatra)+", चरण "+p.pada+" · समाप्ति "+esc(p.nakshatraEnds||"उपलब्ध नहीं")+"</p>",
      "<p><strong>योग:</strong> "+esc(p.yoga)+" · समाप्ति "+esc(p.yogaEnds||"उपलब्ध नहीं")+"</p>",
      "<p><strong>करण:</strong> "+esc(p.karana)+" · समाप्ति "+esc(p.karanaEnds||"उपलब्ध नहीं")+"</p></div>",
      "<h3>सूर्य और चंद्र समय</h3><div class='chat-info'><p>सूर्योदय: "+esc(d.sunrise)+" · सूर्यास्त: "+esc(d.sunset)+"</p>",
      "<p>चंद्रोदय: "+esc(d.moonrise||"नहीं मिला")+" · चंद्रास्त: "+esc(d.moonset||"नहीं मिला")+"</p></div>",
      "<h3>दैनिक काल</h3><div class='chat-info'><p>राहुकाल: "+esc(k.rahuKaal)+"</p><p>यमगण्ड: "+esc(k.yamagand)+"</p>",
      "<p>गुलिक काल: "+esc(k.gulika)+"</p><p>अभिजित मुहूर्त: "+esc(k.abhijit)+"</p></div>",
      "<h3>आज की 24 होरा</h3><div style='overflow-x:auto'><table style='width:100%;border-collapse:collapse;font-size:13px'><thead><tr><th>होरा</th><th>ग्रह</th><th>समय</th></tr></thead><tbody>"+rows+"</tbody></table></div>",
      "<p class='chat-info'>"+esc(d.note)+"</p>"
    ].join("");
    out.style.display="block";
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const lat=Number($("panchangLat").value),lon=Number($("panchangLon").value);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -90||lat > 90||lon < -180||lon > 180){
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