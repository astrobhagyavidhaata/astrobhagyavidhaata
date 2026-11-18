"use strict";

const crypto=require("crypto");
const {getAuthenticatedUser,serviceFetch,rpc,walletFor}=require("../lib/supabase");

function razorpayConfig(){
  const keyId=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
  if(!keyId||!secret)throw new Error("Razorpay is not configured.");
  return {keyId,secret};
}
async function razorpayRequest(path,options={}){
  const {keyId,secret}=razorpayConfig();
  const auth=Buffer.from(keyId+":"+secret).toString("base64");
  const response=await fetch("https://api.razorpay.com/v1"+path,{
    ...options,
    headers:{Authorization:"Basic "+auth,"Content-Type":"application/json",...(options.headers||{})}
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data.error?.description||"Payment provider request failed.");
  return data;
}
function safeEqual(a,b){
  const left=Buffer.from(String(a||""));
  const right=Buffer.from(String(b||""));
  return left.length===right.length&&crypto.timingSafeEqual(left,right);
}
module.exports=async function(req,res){
  const action=req.params.action;
  try{
    const user=await getAuthenticatedUser(req,res);
    if(!user)return res.status(401).json({success:false,message:"रिचार्ज के लिए पहले गेस्ट अकाउंट बनाएं।"});
    if(action==="create-order"&&req.method==="POST"){
      const amount=Number(req.body?.amountPaise);
      if(!Number.isSafeInteger(amount)||amount<1000||amount>5000000)
        return res.status(400).json({success:false,message:"रिचार्ज ₹10 से ₹50,000 के बीच होना चाहिए।"});
      const order=await razorpayRequest("/orders",{method:"POST",body:JSON.stringify({
        amount,currency:"INR",receipt:"abv_"+crypto.randomUUID().replace(/-/g,"").slice(0,24),
        notes:{user_id:user.id,product:"Astro Bhagya Vidhata wallet"}
      })});
      await serviceFetch("/payments",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({
        user_id:user.id,provider:"razorpay",order_id:order.id,amount_paise:amount,status:"created"
      })});
      return res.json({success:true,keyId:process.env.RAZORPAY_KEY_ID,orderId:order.id,amount:order.amount,currency:order.currency});
    }
    if(action==="verify"&&req.method==="POST"){
      const orderId=String(req.body?.razorpay_order_id||"");
      const paymentId=String(req.body?.razorpay_payment_id||"");
      const signature=String(req.body?.razorpay_signature||"");
      if(!/^order_[A-Za-z0-9]+$/.test(orderId)||!/^pay_[A-Za-z0-9]+$/.test(paymentId)||!signature)
        return res.status(400).json({success:false,message:"भुगतान सत्यापन विवरण अधूरे हैं।"});
      const rows=await serviceFetch("/payments?select=order_id,amount_paise,user_id,status&order_id=eq."+encodeURIComponent(orderId)+"&user_id=eq."+encodeURIComponent(user.id)+"&limit=1");
      if(!rows?.length)return res.status(404).json({success:false,message:"भुगतान ऑर्डर नहीं मिला।"});
      const trustedOrderId=rows[0].order_id;
      const {secret}=razorpayConfig();
      const expected=crypto.createHmac("sha256",secret).update(trustedOrderId+"|"+paymentId).digest("hex");
      if(!safeEqual(expected,signature))return res.status(400).json({success:false,message:"भुगतान हस्ताक्षर सही नहीं है।"});
      const payment=await razorpayRequest("/payments/"+encodeURIComponent(paymentId));
      if(payment.order_id!==trustedOrderId||Number(payment.amount)!==Number(rows[0].amount_paise)||payment.currency!=="INR"||payment.status!=="captured")
        return res.status(409).json({success:false,message:"भुगतान अभी कैप्चर नहीं हुआ है। कुछ समय बाद वॉलेट जाँचें।"});
      const result=await rpc("credit_payment",{p_order_id:trustedOrderId,p_payment_id:paymentId,p_amount_paise:Number(payment.amount)});
      const wallet=await walletFor(user.id);
      return res.json({success:true,credited:Boolean(result?.credited),wallet});
    }
    res.setHeader("Allow","POST");
    return res.status(404).json({success:false,message:"भुगतान सुविधा नहीं मिली।"});
  }catch(error){
    console.error("Payments API:",error.message);
    return res.status(503).json({success:false,message:"भुगतान सेवा अभी कॉन्फ़िगर नहीं है।"});
  }
};