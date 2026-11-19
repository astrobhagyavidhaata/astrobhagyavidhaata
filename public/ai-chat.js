(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const history=[];
 function addMessage(role,text){
   const host=$("ai-response-box");if(!host)return;\n   host.contentEditable="false";
   const node=document.createElement("div");node.className="ai-chat-message "+role;node.textContent=text;
   host.appendChild(node);host.scrollTop=host.scrollHeight;
 }
 async function send(){
   const input=$("aiAstrologerQuestion"),button=$("aiAstrologerSend"),status=$("aiAstrologerStatus");
   const question=(input?.value||"").trim();
   if(!question){if(status)status.textContent="कृपया अपना सवाल लिखें।";return;}
   const chart=window.AstroKundli;
   if(!chart){if(status)status.textContent="पहले अपनी जन्म कुंडली बनाएं।";return;}
   if(button)button.disabled=true;
   if(status)status.textContent="आपकी कुंडली का विश्लेषण किया जा रहा है…";
   addMessage("user",question);input.value="";
   try{
     const language=window.AstroLanguage?.get?.()||$("preferredLanguage")?.value||"en";
     const response=await fetch("/api/consultation",{
       method:"POST",
       headers:{"Content-Type":"application/json","Accept":"application/json"},
       credentials:"same-origin",
       body:JSON.stringify({question,chartContext:chart,language,conversationHistory:history})
     });
     const data=await response.json().catch(()=>({}));
     if(!response.ok||!data.success)throw new Error(data.message||"अभी जवाब नहीं मिल पाया।");
     addMessage("assistant",data.answer);
     history.push({role:"user",content:question},{role:"assistant",content:data.answer});
     while(history.length>12)history.shift();
     if(status)status.textContent="जवाब मिल गया।";
   }catch(error){if(status)status.textContent=error.message||"तकनीकी समस्या आई।";}
   finally{if(button)button.disabled=false;}
 }
 document.addEventListener("DOMContentLoaded",()=>{
   $("aiAstrologerSend")?.addEventListener("click",send);
   $("aiAstrologerQuestion")?.addEventListener("keydown",event=>{
     if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();send();}
   });
 });
})();
