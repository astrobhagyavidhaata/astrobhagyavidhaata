"use strict";

const express=require("express");
const path=require("path");
const app=express();
const port=Number(process.env.PORT||3000);

app.disable("x-powered-by");

// Razorpay signs the exact raw bytes. This route must run before express.json().
app.post("/api/payments/webhook",express.raw({type:"application/json"}),require("./api/payment-webhook"));
app.use(express.json({limit:"1mb"}));

const apiHandlers={
  kundli:require("./api/kundli"),
  consultation:require("./api/consultation"),
  gochar:require("./api/gochar"),
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

app.use(express.static(path.join(__dirname),{dotfiles:"deny",index:false}));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(port,()=>console.log("Astro Bhagya Vidhata running on http://localhost:"+port));