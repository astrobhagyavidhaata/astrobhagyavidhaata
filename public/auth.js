"use strict";
(function(){
  const $=id=>document.getElementById(id);
  const status=$("authMessage");
  const consent=$("guestConsent");
  const button=$("guestContinueButton");
  let currentUser=null,starting=false;
  function show(text,error){
    if(!status)return;
    status.textContent=text;
    status.style.display="block";
    status.style.color=error?"#ffb4ab":"#f5d994";
  }
  function render(){
    $("loginState").textContent=currentUser
      ? (currentUser.isAnonymous?"गेस्ट अकाउंट सक्रिय है। आपका वॉलेट इसी डिवाइस के ब्राउज़र से जुड़ा है।":"आपका पुराना लॉगिन अकाउंट सक्रिय है।")
      : "गेस्ट अकाउंट बनाने के लिए नीचे सहमति देकर जारी रखें।";
    $("guestContinueButton").style.display=currentUser?"none":"block";
    $("guestConsentWrap").style.display=currentUser?"none":"block";
  }
  async function call(action,body){
    const response=await fetch("/api/auth/"+action,{
      method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",
      headers:{"Accept":"application/json",...(body?{"Content-Type":"application/json"}:{})},
      ...(body?{body:JSON.stringify(body)}:{})
    });
    const data=await response.json();
    if(!response.ok)throw new Error(data.message||"लॉगिन अनुरोध पूरा नहीं हुआ।");
    return data;
  }
  async function loadUser(){
    try{
      const data=await call("me");
      currentUser=data.user;render();return currentUser;
    }catch(_){currentUser=null;render();return null;}
  }
  async function continueAsGuest(){
    if(starting)return;
    if(!consent?.checked){
      show("आगे बढ़ने से पहले Terms और Privacy Policy पढ़कर सहमति दें।",true);
      return;
    }
    starting=true;button.disabled=true;show("आपका सुरक्षित गेस्ट अकाउंट बनाया जा रहा है…");
    try{
      const data=await call("guest",{termsAccepted:true});
      currentUser=data.user;render();
      show("गेस्ट अकाउंट तैयार है। आपका वॉलेट लोड किया जा रहा है।");
      if(window.AstroWallet)await window.AstroWallet.loadWallet();
      document.dispatchEvent(new CustomEvent("astro:auth-changed",{detail:currentUser}));
    }catch(error){
      show(error.message+" यदि यह संदेश आए, तो Supabase में Anonymous Sign-Ins चालू करना होगा।",true);
    }finally{starting=false;button.disabled=false;}
  }
  button.addEventListener("click",continueAsGuest);
  window.AstroAuth=Object.freeze({loadUser,getUser:()=>currentUser});
  loadUser().then(user=>{
    if(user){
      document.dispatchEvent(new CustomEvent("astro:auth-changed",{detail:user}));
      if(window.AstroWallet)window.AstroWallet.loadWallet().catch(()=>{});
    }
  });
})();
