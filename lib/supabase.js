"use strict";

function config() {
  const url=process.env.SUPABASE_URL;
  const anon=process.env.SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service) throw new Error("Supabase server environment is not configured.");
  return {url:url.replace(/\/+$/,""),anon,service};
}
function cookies(req) {
  const header=req.headers.cookie||"";
  return Object.fromEntries(header.split(";").map(part=>{
    const i=part.indexOf("=");
    return i<0?["",""]:[part.slice(0,i).trim(),decodeURIComponent(part.slice(i+1).trim())];
  }).filter(x=>x[0]));
}
function cookieOptions(req,maxAge) {
  const secure=process.env.NODE_ENV==="production"||req.secure||req.headers["x-forwarded-proto"]==="https";
  return "Path=/; HttpOnly; SameSite=Lax; Max-Age="+maxAge+(secure?"; Secure":"");
}
function setAuthCookies(req,res,access,refresh) {
  res.setHeader("Set-Cookie",[
    "astro_access="+encodeURIComponent(access)+"; "+cookieOptions(req,3600),
    "astro_refresh="+encodeURIComponent(refresh)+"; "+cookieOptions(req,60*60*24*30)
  ]);
}
function clearAuthCookies(req,res) {
  res.setHeader("Set-Cookie",[
    "astro_access=; "+cookieOptions(req,0),
    "astro_refresh=; "+cookieOptions(req,0)
  ]);
}
async function authFetch(path,options={}) {
  const c=config();
  return fetch(c.url+"/auth/v1"+path,{
    ...options,
    headers:{
      apikey:c.anon,
      "Content-Type":"application/json",
      ...(options.headers||{})
    }
  });
}
async function getAuthenticatedUser(req,res) {
  const c=config(), jar=cookies(req);
  let access=jar.astro_access;
  if(!access) return null;
  let response=await fetch(c.url+"/auth/v1/user",{
    headers:{apikey:c.anon,Authorization:"Bearer "+access}
  });
  if(response.status===401&&jar.astro_refresh) {
    const refreshed=await authFetch("/token?grant_type=refresh_token",{
      method:"POST",body:JSON.stringify({refresh_token:jar.astro_refresh})
    });
    if(!refreshed.ok) { clearAuthCookies(req,res); return null; }
    const tokens=await refreshed.json();
    if(!tokens.access_token||!tokens.refresh_token) return null;
    access=tokens.access_token;
    setAuthCookies(req,res,access,tokens.refresh_token);
    response=await fetch(c.url+"/auth/v1/user",{
      headers:{apikey:c.anon,Authorization:"Bearer "+access}
    });
  }
  if(!response.ok) return null;
  return response.json();
}
async function serviceFetch(path,options={}) {
  const c=config();
  const response=await fetch(c.url+"/rest/v1"+path,{
    ...options,
    headers:{
      apikey:c.service,
      Authorization:"Bearer "+c.service,
      "Content-Type":"application/json",
      ...(options.headers||{})
    }
  });
  const text=await response.text();
  let data=null;
  try{data=text?JSON.parse(text):null;}catch(_){data=text;}
  if(!response.ok) {
    const error=new Error(data?.message||data?.hint||"Database request failed.");
    error.status=response.status;error.details=data;throw error;
  }
  return data;
}
async function rpc(name,args) {
  return serviceFetch("/rpc/"+encodeURIComponent(name),{
    method:"POST",body:JSON.stringify(args)
  });
}
async function walletFor(userId) {
  const rows=await serviceFetch("/wallets?select=balance_paise&user_id=eq."+encodeURIComponent(userId)+"&limit=1");
  if(!rows||!rows.length) throw new Error("Wallet not found.");
  return {balancePaise:Number(rows[0].balance_paise)};
}
async function activeConsultation(userId) {
  const rows=await serviceFetch("/consultations?select=id,status,rate_paise_per_minute,billed_minutes,started_at&user_id=eq."+encodeURIComponent(userId)+"&status=eq.active&limit=1");
  return rows&&rows.length?rows[0]:null;
}
module.exports={config,authFetch,getAuthenticatedUser,setAuthCookies,clearAuthCookies,serviceFetch,rpc,walletFor,activeConsultation};