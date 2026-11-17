"use strict";

const crypto=require("crypto");
const {rpc}=require("../lib/supabase");

module.exports=async function(req,res){
  try{
    const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
    if(!secret)return res.status(503).send("Webhook not configured");
    if(!Buffer.isBuffer(req.body))return res.status(400).send("Invalid webhook body");
    const signature=String(req.headers["x-razorpay-signature"]||"");
    const expected=crypto.createHmac("sha256",secret).update(req.body).digest("hex");
    const a=Buffer.from(signature),b=Buffer.from(expected);
    if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(400).send("Invalid signature");
    const event=JSON.parse(req.body.toString("utf8"));
    if(event.event==="payment.captured"||event.event==="order.paid"){
      const payment=event.payload?.payment?.entity;
      const order=event.payload?.order?.entity;
      const orderId=payment?.order_id||order?.id;
      const paymentId=payment?.id;
      if(orderId&&paymentId&&Number.isSafeInteger(Number(payment?.amount)))await rpc("credit_payment",{p_order_id:orderId,p_payment_id:paymentId,p_amount_paise:Number(payment.amount)});
    }
    return res.status(200).json({received:true});
  }catch(error){
    console.error("Razorpay webhook:",error.message);
    return res.status(500).send("Webhook processing failed");
  }
};