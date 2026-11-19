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

// Read request bodies without body-parser/raw-body. Those packages pull iconv-lite's
// Node stream shim into the Worker bundle, which fails Cloudflare validation.
async function readRequestBody(req,res,next){
  const chunks=[];
  let size=0;
  try{
    for await(const chunk of req){
      const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
      size+=data.length;
      if(size>1024*1024)return res.status(413).json({success:false,message:"Request body is too large."});
      chunks.push(data);
    }
    req.body=Buffer.concat(chunks);
    next();
  }catch(error){next(error);}
}
function jsonBody(req,res,next){
  const contentType=String(req.headers["content-type"]||"");
  if(!/^application\/(?:[a-z0-9.+-]*\+)?json(?:\s*;|$)/i.test(contentType))return next();
  readRequestBody(req,res,error=>{
    if(error)return next(error);
    try{
      req.body=req.body.length?JSON.parse(req.body.toString("utf8")):{};
      next();
    }catch(parseError){res.status(400).json({success:false,message:"Invalid JSON body."});}
  });
}

// Razorpay signs the exact raw bytes. Keep this route before JSON parsing.
app.post("/api/payments/webhook",readRequestBody,require("./api/payment-webhook"));
app.use(jsonBody);

app.get("/healthz",(req,res)=>res.status(200).json({status:"ok"}));
app.get("/api/consultation/health",(req,res)=>res.set("Cache-Control","no-store").json({success:true,configured:Boolean(process.env.GEMINI_API_KEY),model:process.env.GEMINI_MODEL||"gemini-3.8-flash"}));

const apiHandlers={
  kundli:require("./api/kundli"),
  geocode:require("./api/geocode"),
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

// Cloudflare Worker imports the Express app and owns its listener.
// Start a local HTTP listener only when this file is run directly.
if(require.main===module){
  app.listen(port,()=>console.log("Astro Bhagya Vidhata running on http://localhost:"+port));
}

module.exports=app;
