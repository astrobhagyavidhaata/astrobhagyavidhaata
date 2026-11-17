"use strict";
(function(){
  const $=id=>document.getElementById(id);
  const form=$("loginForm");
  if(!form)return;
  const status=$("authMessage"),otpRow=$("otpRow"),phoneInput=$("loginPhone");
  let otpSent=false,currentUser=null;
  function show(text,error){status.textContent=text;status.style.display="block";status.style.color=error?"#ffb4ab":"#f5d994";}
  function render(){
    $("loginFields").style.display=currentUser?"none":"block";
    $("loggedInBox").style.display=currentUser?"block":"none";
    $("loginState").textContent=currentUser?"लॉगिन है: "+(currentUser.phone||"मोबाइल उपयोगकर्ता"):"लॉगिन नहीं है";
    if(currentUser)$("loggedInPhone").textContent=currentUser.phone||"";
  }
  async function call(action,body){
    const response=await fetch("/api/auth/"+action,{method:body?"POST":"GET",credentials:"same-origin",headers:{"Accept":"application/json",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.message||"लॉगिन अनुरोध पूरा नहीं हुआ।");
    return data;
  }
  async function loadUser(){
    try{const data=await call("me");currentUser=data.user;render();return currentUser;}
    catch(_){currentUser=null;render();return null;}
  }
  $("sendOtpButton").addEventListener("click",async()=>{
    const phone=phoneInput.value.trim();
    if(!phone){show("मोबाइल नंबर भरें।",true);return;}
    $("sendOtpButton").disabled=true;
    try{
      const data=await call("send-otp",{phone});
      otpSent=true;otpRow.style.display="block";show(data.message||"OTP भेज दिया गया है।");
      $("loginOtp").focus();
    }catch(error){show(error.message,true);}
    finally{$("sendOtpButton").disabled=false;}
  });
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!otpSent){show("पहले OTP भेजें।",true);return;}
    $("verifyOtpButton").disabled=true;
    try{
      const data=await call("verify-otp",{phone:phoneInput.value.trim(),token:$("loginOtp").value.trim()});
      currentUser=data.user;otpSent=false;$("loginOtp").value="";render();
      show("लॉगिन सफल। आपका वॉलेट लोड किया जा रहा है।");
      if(window.AstroWallet)await window.AstroWallet.loadWallet();
      document.dispatchEvent(new CustomEvent("astro:auth-changed",{detail:currentUser}));
    }catch(error){show(error.message,true);}
    finally{$("verifyOtpButton").disabled=false;}
  });
  $("logoutButton").addEventListener("click",async()=>{
    try{
      if(window.AstroWallet)await window.AstroWallet.stopConsultation();
      await call("logout",{});
      currentUser=null;otpSent=false;otpRow.style.display="none";render();
      show("आप लॉगआउट हो गए हैं।");
      if($("bal"))$("bal").textContent="0.00";
      document.dispatchEvent(new CustomEvent("astro:auth-changed",{detail:null}));
    }catch(error){show(error.message,true);}
  });
  window.AstroAuth=Object.freeze({loadUser,getUser:()=>currentUser});
  loadUser().then(user=>{
    if(user){
      document.dispatchEvent(new CustomEvent("astro:auth-changed",{detail:user}));
      if(window.AstroWallet)window.AstroWallet.loadWallet().catch(()=>{});
    }
  });
})();