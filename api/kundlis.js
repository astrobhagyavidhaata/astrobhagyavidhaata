"use strict";
const {getAuthenticatedUser,serviceFetch}=require("../lib/supabase");
module.exports=async function(req,res){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({success:false,message:"केवल GET अनुरोध स्वीकार है।"});}
  try{
    const user=await getAuthenticatedUser(req,res);
    if(!user)return res.status(401).json({success:false,message:"अपनी कुंडलियाँ देखने के लिए पहले लॉगिन करें।"});
    const id=String(req.params.id||"");
    if(id){
      if(!/^[0-9a-f-]{36}$/i.test(id))return res.status(400).json({success:false,message:"कुंडली पहचान सही नहीं है।"});
      const rows=await serviceFetch("/kundlis?select=id,title,birth_details,chart_data,created_at&user_id=eq."+encodeURIComponent(user.id)+"&id=eq."+encodeURIComponent(id)+"&limit=1");
      if(!rows?.length)return res.status(404).json({success:false,message:"कुंडली नहीं मिली।"});
      const row=rows[0];
      return res.json({success:true,kundli:{id:row.id,title:row.title,birthDetails:row.birth_details,chart:row.chart_data,createdAt:row.created_at}});
    }
    const rows=await serviceFetch("/kundlis?select=id,title,birth_details,created_at&user_id=eq."+encodeURIComponent(user.id)+"&order=created_at.desc&limit=30");
    return res.json({success:true,kundlis:(rows||[]).map(row=>({id:row.id,title:row.title,birthDetails:row.birth_details,createdAt:row.created_at}))});
  }catch(error){
    console.error("Kundli history API:",error.message);
    return res.status(503).json({success:false,message:"कुंडली इतिहास सेवा अभी कॉन्फ़िगर नहीं है।"});
  }
};