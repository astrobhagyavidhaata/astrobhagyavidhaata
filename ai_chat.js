/*
 * ASTRO BHAGYA VIDHATA
 * Direct Gemini consultation — no login, wallet, or mandatory birth chart.
 */
(() => {
 "use strict";
 const CHAT_API="/api/consultation";
 let activeAstro="AI वैदिक ज्योतिष सहायक",chatBusy=false,chatHistory=[];
 const $=id=>document.getElementById(id);
 function addMessage(sender,text,type){
  const box=$("chatMessages");if(!box)return;
  const item=document.createElement("div");item.className=type==="user"?"msg-user":"msg-bot";
  const heading=document.createElement("b");heading.textContent=sender+": ";
  const content=document.createElement("span");content.textContent=text;item.append(heading,content);box.appendChild(item);box.scrollTop=box.scrollHeight;
 }
 function getKundliDetails(){if(window.AstroKundli)return window.AstroKundli;const el=$("kTxt");return el&&el.textContent.trim()?el.textContent.trim():null;}
 async function openChatBox(astroName){
  activeAstro=astroName||"AI वैदिक ज्योतिष सहायक";chatHistory=[];
  const modal=$("chatModal");if(modal)modal.style.display="block";
  const title=$("chatTitle");if(title)title.textContent=activeAstro;
  const box=$("chatMessages");if(box)box.replaceChildren();
  addMessage(activeAstro,"नमस्कार! आप कुंडली के साथ या बिना कुंडली के अपना प्रश्न सीधे पूछ सकते हैं।","bot");
  $("userMsgInput")?.focus();return true;
 }
 async function sendUserMsg(){
  if(chatBusy)return;const input=$("userMsgInput");if(!input)return;
  const question=input.value.trim();if(!question)return;
  if(question.length>4000){addMessage("सूचना","प्रश्न 4000 अक्षरों से छोटा रखें।","bot");return;}
  const chartContext=getKundliDetails();chatBusy=true;input.value="";addMessage("आप",question,"user");
  const loading=document.createElement("div");loading.className="msg-bot";loading.textContent="ज्योतिषाचार्य उत्तर तैयार कर रहे हैं...";$("chatMessages")?.appendChild(loading);
  try{
   const response=await fetch(CHAT_API,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({question,chartContext,birthData:chartContext&&typeof chartContext==="object"?chartContext.birth||null:null,lockedProfileRule:window.AstroLockedProfileRule||null,language:$("preferredLanguage")?.value||"hi",conversationHistory:chatHistory.slice(-12)})});
   const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||"AI सेवा अभी उपलब्ध नहीं है।");
   if(typeof data.answer!=="string"||!data.answer.trim())throw new Error("AI से सही उत्तर प्राप्त नहीं हुआ।");
   loading.textContent=activeAstro+": "+data.answer;chatHistory.push({role:"user",content:question},{role:"assistant",content:data.answer});chatHistory=chatHistory.slice(-12);
  }catch(error){loading.textContent="उत्तर प्राप्त नहीं हुआ: "+error.message;}
  finally{chatBusy=false;const box=$("chatMessages");if(box)box.scrollTo({top:box.scrollHeight,behavior:"smooth"});}
 }
 function closeChatBox(){const modal=$("chatModal");if(modal)modal.style.display="none";chatHistory=[];activeAstro="AI वैदिक ज्योतिष सहायक";}
 window.openChatBox=openChatBox;window.sendUserMsg=sendUserMsg;window.closeChatBox=closeChatBox;
})();