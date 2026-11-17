"use strict";
const {getAuthenticatedUser,walletFor}=require("../lib/supabase");
module.exports=async function(req,res){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({success:false,message:"केवल GET अनुरोध स्वीकार है।"});}
  try{
    const user=await getAuthenticatedUser(req,res);
    if(!user)return res.status(401).json({success:false,message:"वॉलेट देखने के लिए पहले लॉगिन करें।"});
    const wallet=await walletFor(user.id);
    return res.json({success:true,wallet});
  }catch(error){
    console.error("Wallet API:",error.message);
    return res.status(503).json({success:false,message:"वॉलेट सेवा अभी कॉन्फ़िगर नहीं है।"});
  }
};