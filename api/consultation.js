"use strict";

const {askGemini}=require("../lib/gemini");
const {getAuthenticatedUser,activeConsultation,rpc,serviceFetch}=require("../lib/supabase");
const recentRequests=new Map();

module.exports=async function(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({success:false,message:"केवल POST अनुरोध स्वीकार है।"});}
  try{
    const user=await getAuthenticatedUser(req,res);
    if(!user)return res.status(401).json({success:false,message:"परामर्श के लिए पहले मोबाइल OTP से लॉगिन करें।"});
    const body=req.body||{};
    const question=body.question||body.content;
    if(typeof question!=="string"||!question.trim())return res.status(400).json({success:false,message:"कृपया अपना प्रश्न लिखें।"});
    if(question.length>4000)return res.status(400).json({success:false,message:"प्रश्न 4000 अक्षरों से छोटा रखें।"});
    const now=Date.now(),last=recentRequests.get(user.id)||0;
    if(now-last<3000)return res.status(429).json({success:false,message:"अगला प्रश्न भेजने से पहले कुछ सेकंड रुकें।"});
    const active=await activeConsultation(user.id);
    if(!active)return res.status(402).json({success:false,message:"पहले वॉलेट से ₹5 प्रति मिनट का परामर्श शुरू करें।"});
    const billing=await rpc("heartbeat_consultation",{p_user_id:user.id,p_consultation_id:active.id});
    if(billing.consultation?.status!=="active")return res.status(402).json({success:false,message:"वॉलेट बैलेंस पूरा हो गया है। परामर्श रोक दिया गया।"});
    recentRequests.set(user.id,now);
    const chartContext=body.chartContext&&typeof body.chartContext==="object"?body.chartContext:{};
    const history=Array.isArray(body.conversationHistory)?body.conversationHistory.slice(-10):[];
    const answer=await askGemini({question:question.trim(),chartContext,conversationHistory:history});
    try{
      await serviceFetch("/chat_messages",{
        method:"POST",
        headers:{Prefer:"return=minimal"},
        body:JSON.stringify([
          {user_id:user.id,consultation_id:active.id,role:"user",content:question.trim()},
          {user_id:user.id,consultation_id:active.id,role:"assistant",content:answer}
        ])
      });
    }catch(saveError){console.warn("Consultation transcript save skipped:",saveError.message);}
    return res.status(200).json({success:true,answer});
  }catch(error){
    console.error("Consultation API error:",error.message);
    return res.status(503).json({success:false,message:"परामर्श सेवा अभी कॉन्फ़िगर नहीं है। कृपया बाद में प्रयास करें।"});
  }
};