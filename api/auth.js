"use strict";

const {authFetch,getAuthenticatedUser,setAuthCookies}=require("../lib/supabase");

module.exports=async function(req,res) {
  const action=req.params?.action || req.query?.action;
  try {
    if(action==="me"&&req.method==="GET") {
      const user=await getAuthenticatedUser(req,res);
      if(!user) return res.status(401).json({success:false,message:"गेस्ट अकाउंट अभी नहीं बना है।"});
      return res.json({success:true,user:{id:user.id,isAnonymous:!!user.is_anonymous,phone:user.phone||""}});
    }
    if(action==="guest"&&req.method==="POST") {
      const existing=await getAuthenticatedUser(req,res);
      if(existing) return res.json({success:true,user:{id:existing.id,isAnonymous:!!existing.is_anonymous,phone:existing.phone||""}});
      const response=await authFetch("/signup",{method:"POST",body:JSON.stringify({data:{account_type:"guest"}})});
      const data=await response.json();
      if(!response.ok||!data.access_token||!data.refresh_token||!data.user?.id) {
        const message=data.msg||data.message||"गेस्ट अकाउंट नहीं बन पाया।";
        return res.status(response.status||503).json({success:false,message});
      }
      if(data.user.is_anonymous===false) return res.status(500).json({success:false,message:"सुरक्षित गेस्ट अकाउंट नहीं बन पाया।"});
      setAuthCookies(req,res,data.access_token,data.refresh_token);
      return res.json({success:true,user:{id:data.user.id,isAnonymous:true,phone:""}});
    }
    if(action==="send-otp"||action==="verify-otp") {
      return res.status(410).json({success:false,message:"मोबाइल OTP लॉगिन बंद है। अब गेस्ट अकाउंट से जारी रखें।"});
    }
    if(action==="logout"&&req.method==="POST") {
      return res.status(410).json({success:false,message:"गेस्ट अकाउंट का वॉलेट सुरक्षित रखने के लिए लॉगआउट बंद है।"});
    }
    res.setHeader("Allow","GET, POST");
    return res.status(405).json({success:false,message:"यह अनुरोध उपलब्ध नहीं है।"});
  } catch(error) {
    console.error("Auth API:",error.message);
    return res.status(503).json({success:false,message:"गेस्ट लॉगिन सेवा अभी उपलब्ध नहीं है। Supabase में Anonymous Sign-Ins चालू होना जरूरी है।"});
  }
};
