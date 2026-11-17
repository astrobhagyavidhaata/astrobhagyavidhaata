"use strict";
const {getAuthenticatedUser,rpc,activeConsultation,serviceFetch}=require("../lib/supabase");
function mapConsultation(c){return c?{id:c.id,status:c.status,ratePaisePerMinute:Number(c.rate_paise_per_minute),billedMinutes:Number(c.billed_minutes),startedAt:c.started_at}:null;}
module.exports=async function(req,res){
  try{
    const user=await getAuthenticatedUser(req,res);
    if(!user)return res.status(401).json({success:false,message:"परामर्श शुरू करने के लिए पहले लॉगिन करें।"});
    const action=req.params.action,body=req.body||{};
    if(action==="history"&&req.method==="GET"){
      const id=String(req.query?.consultationId||"");
      if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({success:false,message:"परामर्श पहचान सही नहीं है।"});
      const rows=await serviceFetch("/chat_messages?select=role,content,created_at&user_id=eq."+encodeURIComponent(user.id)+"&consultation_id=eq."+encodeURIComponent(id)+"&order=created_at.asc&limit=100");
      return res.json({success:true,messages:rows||[]});
    }
    if(action==="active"&&req.method==="GET"){
      const active=await activeConsultation(user.id);
      if(!active)return res.json({success:true,consultation:null});
      const result=await rpc("heartbeat_consultation",{p_user_id:user.id,p_consultation_id:active.id});
      return res.json({success:true,consultation:mapConsultation(result.consultation),wallet:{balancePaise:Number(result.wallet.balance_paise)}});
    }
    if(req.method!=="POST"){res.setHeader("Allow","GET, POST");return res.status(405).json({success:false,message:"यह अनुरोध उपलब्ध नहीं है।"});}
    if(action==="start"){
      const result=await rpc("start_consultation",{p_user_id:user.id,p_astrologer_id:String(body.astrologerId||"vedic-astrologer").slice(0,100)});
      return res.json({success:true,consultation:mapConsultation(result.consultation),wallet:{balancePaise:Number(result.wallet.balance_paise)}});
    }
    const id=String(body.consultationId||"");
    if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({success:false,message:"सही परामर्श सत्र आवश्यक है।"});
    if(action==="heartbeat"){
      const result=await rpc("heartbeat_consultation",{p_user_id:user.id,p_consultation_id:id});
      return res.json({success:true,consultation:mapConsultation(result.consultation),wallet:{balancePaise:Number(result.wallet.balance_paise)}});
    }
    if(action==="stop"){
      const result=await rpc("stop_consultation",{p_user_id:user.id,p_consultation_id:id});
      return res.json({success:true,consultation:mapConsultation(result.consultation),wallet:{balancePaise:Number(result.wallet.balance_paise)}});
    }
    return res.status(404).json({success:false,message:"परामर्श सुविधा नहीं मिली।"});
  }catch(error){
    const msg=String(error.message||"");
    const userMessage=msg.includes("INSUFFICIENT_BALANCE")?"वॉलेट में कम से कम ₹5 होना चाहिए।":msg.includes("ACTIVE_CONSULTATION_EXISTS")?"आपका एक परामर्श पहले से चल रहा है।":msg.includes("CONSULTATION_NOT_ACTIVE")?"यह परामर्श सत्र सक्रिय नहीं है।":"परामर्श सेवा अभी कॉन्फ़िगर नहीं है।";
    console.error("Consultation billing API:",msg);
    return res.status(msg.includes("INSUFFICIENT_BALANCE")||msg.includes("ACTIVE_CONSULTATION_EXISTS")?409:503).json({success:false,message:userMessage});
  }
};