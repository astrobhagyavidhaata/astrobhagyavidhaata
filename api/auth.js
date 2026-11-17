"use strict";

const {authFetch,getAuthenticatedUser,setAuthCookies,clearAuthCookies}=require("../lib/supabase");
function normalizePhone(value) {
  let phone=String(value||"").replace(/[\s()-]/g,"");
  if(/^\d{10}$/.test(phone)) phone="+91"+phone;
  if(!/^\+[1-9]\d{7,14}$/.test(phone)) return null;
  return phone;
}
module.exports=async function(req,res) {
  const action=req.params.action;
  try {
    if(action==="me"&&req.method==="GET") {
      const user=await getAuthenticatedUser(req,res);
      if(!user) return res.status(401).json({success:false,message:"पहले मोबाइल OTP से लॉगिन करें।"});
      return res.json({success:true,user:{id:user.id,phone:user.phone||""}});
    }
    if(action==="send-otp"&&req.method==="POST") {
      const phone=normalizePhone(req.body?.phone);
      if(!phone) return res.status(400).json({success:false,message:"सही मोबाइल नंबर लिखें।"});
      const response=await authFetch("/otp",{method:"POST",body:JSON.stringify({phone,create_user:true})});
      const data=await response.json();
      if(!response.ok) return res.status(response.status).json({success:false,message:data.msg||data.message||"OTP भेजा नहीं जा सका।"});
      return res.json({success:true,message:"OTP भेज दिया गया है।"});
    }
    if(action==="verify-otp"&&req.method==="POST") {
      const phone=normalizePhone(req.body?.phone),token=String(req.body?.token||"").trim();
      if(!phone||!/^\d{6}$/.test(token)) return res.status(400).json({success:false,message:"मोबाइल नंबर और 6 अंकों का OTP भरें।"});
      const response=await authFetch("/verify",{method:"POST",body:JSON.stringify({phone,token,type:"sms"})});
      const data=await response.json();
      if(!response.ok||!data.access_token||!data.refresh_token) return res.status(401).json({success:false,message:data.msg||data.message||"OTP सही नहीं है।"});
      setAuthCookies(req,res,data.access_token,data.refresh_token);
      return res.json({success:true,user:{id:data.user?.id,phone:data.user?.phone||phone}});
    }
    if(action==="logout"&&req.method==="POST") {
      const user=await getAuthenticatedUser(req,res);
      if(user?._accessToken) {
        await authFetch("/logout",{method:"POST",headers:{Authorization:"Bearer "+user._accessToken}}).catch(()=>{});
      }
      clearAuthCookies(req,res);
      return res.json({success:true});
    }
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({success:false,message:"यह अनुरोध उपलब्ध नहीं है।"});
  } catch(error) {
    console.error("Auth API:",error.message);
    return res.status(503).json({success:false,message:"लॉगिन सेवा अभी कॉन्फ़िगर नहीं है।"});
  }
};