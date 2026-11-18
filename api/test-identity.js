"use strict";
const {getAuthenticatedUser}=require("../lib/supabase");
module.exports=async function(req,res){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({success:false});}
  try{
    const user=await getAuthenticatedUser(req,res);
    if(!user)return res.status(401).json({success:false,message:"Login required."});
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({success:true,userId:user.id});
  }catch(error){
    console.error("Test identity lookup failed:",error.message);
    return res.status(503).json({success:false,message:"Identity lookup unavailable."});
  }
};