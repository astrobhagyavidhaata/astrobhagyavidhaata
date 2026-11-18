"use strict";
const {getAuthenticatedUser}=require("../lib/supabase");
module.exports=async function(req,res){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({success:false});}
  try{
    const user=await getAuthenticatedUser(req,res);
    if(!user)return res.status(401).json({success:false,message:"Login required."});
    const ownerEmail=String(process.env.AI_FREE_TEST_OWNER_EMAIL||"").trim().toLowerCase();
    const testMode=!!ownerEmail&&String(user.email||"").trim().toLowerCase()===ownerEmail;
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({success:true,userId:user.id,testMode});
  }catch(error){
    console.error("Test identity lookup failed:",error.message);
    return res.status(503).json({success:false,message:"Identity lookup unavailable."});
  }
};