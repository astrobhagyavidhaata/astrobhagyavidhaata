"use strict";

const express=require("express");
const path=require("path");
const app=express();
const port=Number(process.env.PORT||3000);

app.disable("x-powered-by");
app.use((req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options","DENY");
  res.setHeader("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  if(process.env.NODE_ENV==="production")res.setHeader("Strict-Transport-Security","max-age=31536000; includeSubDomains");
  next();
});

// Razorpay signs the exact raw bytes. This route must run before express.json().
app.post("/api/payments/webhook",express.raw({type:"application/json"}),require("./api/payment-webhook"));
app.use(express.json({limit:"1mb"}));

app.get("/healthz",(req,res)=>res.status(200).json({status:"ok"}));
app.get("/api/consultation/health",(req,res)=>res.set("Cache-Control","no-store").json({success:true,configured:Boolean(process.env.GEMINI_API_KEY),model:process.env.GEMINI_MODEL||"gemini-2.5-flash"}));

const apiHandlers={
  kundli:require("./api/kundli"),
  consultation:require("./api/consultation"),
  gochar:require("./api/gochar"),
  "gochar-prediction":require("./api/gochar-prediction"),
  panchang:require("./api/panchang")
};

// Register API routes before static files so source files under /api are never served.
app.all("/api/auth/:action",require("./api/auth"));
app.all("/api/payments/:action",require("./api/payments"));
app.all("/api/consultations/:action",require("./api/consultations"));
app.all("/api/wallet",require("./api/wallet"));
app.get("/api/kundlis",require("./api/kundlis"));
app.all("/api/kundlis/:id",require("./api/kundlis"));

app.all("/api/:name",async(req,res)=>{
  const handler=apiHandlers[req.params.name];
  if(!handler)return res.status(404).json({success:false,message:"यह API सुविधा उपलब्ध नहीं है।"});
  try{await handler(req,res);}
  catch(error){
    console.error("API error:",error);
    if(!res.headersSent)res.status(500).json({success:false,message:"सर्वर में समस्या आई।"});
  }
});

// Do not publish backend source, database schema, tests or deployment files.
app.use((req,res,next)=>{
  const blocked=/^\/(?:api|lib|supabase|tests|docs|\.github)(?:\/|$)/i.test(req.path) ||
    /^\/(?:server\.js|package\.json|\.env\.example|README\.md|SECURITY\.md|Dockerfile|render\.yaml)$/i.test(req.path);
  if(blocked)return res.sendStatus(404);
  next();
});

// Static files are served by Node locally and by the Workers ASSETS binding on Cloudflare.
if (typeof __dirname !== "undefined") {
  app.use(express.static(path.join(__dirname),{dotfiles:"deny",index:false}));
  app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
}
if (require.main === module) {
  app.listen(port,()=>console.log("Astro Bhagya Vidhata running on http://localhost:"+port));
}

module.exports = app;