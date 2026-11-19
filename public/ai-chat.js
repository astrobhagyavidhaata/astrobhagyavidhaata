(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const history=[];
 const DEFAULT_BUTTON_TEXT="सवाल भेजें";
 function addMessage(role,text){
   const host=$("ai-response-box");
   if(!host)return;
   host.contentEditable="false";
   host.setAttribute("aria-readonly","true");
   const node=document.createElement("div");
   node.className="ai-chat-message "+role;
   node.textContent=String(text??"");
   host.appendChild(node);
   host.scrollTop=host.scrollHeight;
 }
 async function send(){
   const input=$("aiAstrologerQuestion"),button=$("aiAstrologerSend"),status=$("aiAstrologerStatus");
   const question=(input?.value||"").trim();
   if(!question){if(status)status.textContent="कृपया अपना सवाल लिखें।";return;}
   const chart=window.AstroKundli||{};
   if(button){button.disabled=true;button.textContent="विश्लेषण हो रहा है...";}
   if(status)status.textContent="विश्लेषण हो रहा है...";
   addMessage("user",question);
   if(input)input.value="";
   try{
     const language=window.AstroLanguage?.get?.()||$("preferredLanguage")?.value||"hi";
     const response=await fetch("/api/consultation",{
       method:"POST",
       headers:{"Content-Type":"application/json","Accept":"application/json"},
       credentials:"same-origin",
       body:JSON.stringify({question,chartContext:chart,language,conversationHistory:history})
     });
     const raw=await response.text();
     let data={};
     try{data=raw?JSON.parse(raw):{};}catch(_){throw new Error(raw||("सर्वर ने पढ़ने योग्य जवाब नहीं भेजा (HTTP "+response.status+")"));}
     if(!response.ok||!data.success)throw new Error(data.message||data.error?.message||("सर्वर त्रुटि (HTTP "+response.status+")"));
     if(!data.answer)throw new Error("सर्वर से खाली जवाब मिला।");
     addMessage("assistant",data.answer);
     history.push({role:"user",content:question},{role:"assistant",content:data.answer});
     while(history.length>12)history.shift();
     if(status)status.textContent="जवाब मिल गया।";
   }catch(error){
     const message=error?.message||String(error)||"अज्ञात तकनीकी समस्या";
     if(status)status.textContent="त्रुटि: "+message;
     addMessage("assistant","त्रुटि: "+message);
   }finally{
     if(button){button.disabled=false;button.textContent=DEFAULT_BUTTON_TEXT;}
   }
 }
 document.addEventListener("DOMContentLoaded",()=>{
   const host=$("ai-response-box");
   if(host){host.contentEditable="false";host.setAttribute("aria-readonly","true");host.setAttribute("tabindex","0");}
   $("aiAstrologerSend")?.addEventListener("click",send);
   $("aiAstrologerQuestion")?.addEventListener("keydown",event=>{
     if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();send();}
   });
 });
})();
