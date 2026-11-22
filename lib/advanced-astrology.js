"use strict";
const {getNakshatraFromLongitude}=require("./astrology-engine");
function signNumber(v){const n=Number(v);return Number.isInteger(n)&&n>=0&&n<12?n:null;}
function shift(v,k){const n=signNumber(v);return n===null?null:(n+k)%12;}
function degreeOf(p){if(p?.degreeInRashi!==null&&p?.degreeInRashi!==undefined&&Number.isFinite(Number(p.degreeInRashi)))return ((Number(p.degreeInRashi)%30)+30)%30;if(p?.longitude!==null&&p?.longitude!==undefined&&Number.isFinite(Number(p.longitude)))return ((Number(p.longitude)%30)+30)%30;return null;}
function getBhriguNandiNadi(d1,gender){
 const ps=Object.entries(d1?.planets||{}).map(([name,p])=>({name,degree:degreeOf(p),rashiIndex:signNumber(p?.rashiIndex)})).filter(p=>p.degree!==null).sort((a,b)=>a.degree-b.degree||a.name.localeCompare(b.name));
 if(!ps.length)return null;const g=String(gender||"").normalize("NFKC").toLowerCase();
 const jeeva=["male","man","पुरुष","आदमी"].includes(g)?"गुरु":["female","woman","स्त्री","महिला"].includes(g)?"शुक्र":null;
 const j=jeeva?ps.find(p=>p.name===jeeva):null;const near=j?ps.filter(p=>p.name!==jeeva&&Math.abs(p.degree-j.degree)<=2):[];
 const next=j?ps.filter(p=>p.degree>j.degree+2).sort((a,b)=>a.degree-b.degree)[0]:null;
 return {jeevaKaraka:jeeva,sequence:ps.map((p,i)=>({order:i+1,planet:p.name,degreeInRashi:Number(p.degree.toFixed(6)),rashiIndex:p.rashiIndex,differenceFromJeeva:j?Number((p.degree-j.degree).toFixed(6)):null,marker:p.name===jeeva?"जीव कारक":near.some(x=>x.name===p.name)?"जीव कारक से 2° के भीतर":next&&Math.abs(p.degree-next.degree)<1e-7?"जीव कारक के बाद अगली डिग्री":null})),note:j?"ग्रह राशि-अंश के बढ़ते क्रम में; जीव कारक से 2° के भीतर के ग्रह चिह्नित।":"लिंग उपलब्ध/मान्य न होने से जीव कारक निर्धारित नहीं।"};
}
function taraNumber(birth,longitude){if(!Number.isInteger(birth)||longitude==null||!Number.isFinite(Number(longitude)))return null;const t=getNakshatraFromLongitude(Number(longitude));return ((t.index-birth+27)%27)%9+1;}
function getNavtara(d1,gochar,birth){if(!Number.isInteger(birth))return null;const labels={1:"जन्म",2:"सम्पत",3:"विपत",4:"क्षेम",5:"प्रत्यरी",6:"साधक",7:"वध",8:"मित्र",9:"अति-मित्र"};const map=items=>items.map(x=>({...x,label:labels[x.number],category:[3,5,7].includes(x.number)?"चुनौतीपूर्ण":x.number===1?"जन्म तारा":"परंपरागत शुभ"}));return {birthNakshatraIndex:birth,labels,natalPlanets:map(Object.entries(d1?.planets||{}).map(([name,p])=>({name,number:taraNumber(birth,p?.longitude)})).filter(x=>x.number!==null)),transits:map((gochar?.planets||[]).map(p=>({name:p.name,number:taraNumber(birth,p.longitude)})).filter(x=>x.number!==null))};}
function dashaChidra(dasha,now=new Date()){const c=dasha?.current||{},md=(dasha?.mahadashas||[]).find(x=>x.planet===c.mahadasha),ad=(md?.antardashas||[]).find(x=>x.planet===c.antardasha),s=new Date(ad?.start||c.antardashaStart),e=new Date(ad?.end||c.antardashaEnd);if(!Number.isFinite(s.getTime())||!Number.isFinite(e.getTime())||e<=s)return null;const t=e.getTime()-(e.getTime()-s.getTime())*.1;return {antardasha:c.antardasha||ad?.planet||null,start:s.toISOString(),end:e.toISOString(),chidraStart:new Date(t).toISOString(),isDashaChidra:now.getTime()>=t&&now.getTime()<e.getTime(),finalTenPercent:true};}
function getVargottama(d1,d9){const a=[];for(const [name,p] of Object.entries(d1?.planets||{})){const x=signNumber(p?.rashiIndex),y=signNumber(d9?.planets?.[name]?.rashiIndex);if(x!==null&&y!==null&&x===y)a.push({planet:name,rashiIndex:x});}return a;}

const TRANSIT_RULES = {
 शनि:{good:[3,6,11],bad:[1,2,4,8,12],meaning:{1:"साढ़ेसाती: मानसिक दबाव और आत्म-पुनर्गठन",2:"साढ़ेसाती: खर्च और पारिवारिक/वाणी दबाव",4:"ढैया: घर-परिवार और मानसिक शांति की परीक्षा",8:"ढैया: गुप्त चिंता और पुराने मामलों की परीक्षा",12:"साढ़ेसाती: खर्च, दूरी और नींद पर दबाव"}},
 राहु:{good:[3,6,11],bad:[1,2,4,5,7,8,9,10,12],meaning:{1:"भ्रम और जल्दबाजी से बचें",4:"घर और भावनात्मक स्थिरता की परीक्षा",7:"साझेदारी/रिश्तों में स्पष्टता जरूरी",8:"अचानक बदलाव और साझा धन में सावधानी",12:"खर्च, नींद और एकांत पर ध्यान"}},
 केतु:{good:[3,6,11],bad:[1,2,4,5,7,8,9,10,12],meaning:{1:"अलगाव और आत्ममंथन",4:"घर में विरक्ति/असंतोष",7:"रिश्तों में दूरी या संवाद की कमी",8:"गोपनीयता और अनिश्चितता",12:"एकांत और खर्च पर ध्यान"}},
 गुरु:{good:[2,5,7,9,11],bad:[1,3,4,6,8,10,12]},
 सूर्य:{good:[3,6,10,11],bad:[1,2,4,5,7,8,9,12]},
 मंगल:{good:[3,6,10,11],bad:[1,2,4,5,7,8,9,12]},
 बुध:{good:[2,4,6,8,10,11],bad:[1,3,5,7,9,12]},
 शुक्र:{good:[1,2,3,4,5,8,9,11,12],bad:[6,7,10]},
 चंद्र:{good:[],bad:[]}
};
function transitAnalysis(source){
 const moonSign=signNumber(source?.d1?.planets?.चंद्र?.rashiIndex),planets=source?.gochar?.planets||[];
 if(moonSign===null||!planets.length)return {available:false,reason:"जन्म चंद्र राशि या वर्तमान गोचर ग्रह उपलब्ध नहीं।"};
 const av=source?.ashtakavarga||{};
 const result=planets.map(p=>{
  const sign=signNumber(p?.rashiIndex);if(sign===null)return null;
  const house=((sign-moonSign+12)%12)+1,rule=TRANSIT_RULES[p.name]||{good:[],bad:[]};
  const base=rule.good.includes(house)?"परंपरागत शुभ भाव":rule.bad.includes(house)?"परंपरागत चुनौतीपूर्ण भाव":"मिश्रित/अन्य भाव";
  const vedhaHouse=((house+5)%12)+1;
  const vedhaPlanet=planets.find(q=>q.name!==p.name&&Number.isInteger(q.rashiIndex)&&((q.rashiIndex-moonSign+12)%12)+1===vedhaHouse);
  const bav=av?.bhinna?.[p.name]?.signs?.find(x=>x.rashiIndex===sign)?.bindus;
  return {planet:p.name,rashi:p.rashi||null,rashiIndex:sign,houseFromMoon:house,baseTransitNature:base,ruleMeaning:rule.meaning?.[house]||null,vedha:{oppositeHouse:vedhaHouse,occupiedBy:vedhaPlanet?.name||null,blocked:Boolean(vedhaPlanet),method:"7वें-सामने वाले स्थान की सरलीकृत जाँच; पूर्ण ग्रह-विशिष्ट शास्त्रीय वेध-सारणी नहीं।"},ashtakavarga:{bhinnaBindus:Number.isFinite(bav)?bav:null,threshold:4,nature:Number.isFinite(bav)?(bav>=4?"4 या अधिक बिंदु: अनुकूलता समर्थित":"0–3 बिंदु: गोचर फल कमजोर/कठिन"):"इस ग्रह के लिए व्यक्तिगत BAV उपलब्ध नहीं; 4-बिंदु फ़िल्टर लागू नहीं।"}};
 }).filter(Boolean);
 return {available:true,reference:"जन्म चंद्र राशि",natalMoonRashiIndex:moonSign,method:"भाव whole-sign से गिने गए; वेध को विपरीत 7वें स्थान की सरलीकृत जाँच माना गया है।",planets:result};
}

function calculateAdvancedAstrology(source,now=new Date()){const d1=source?.d1||{},d9=source?.d9||{},moon=d1?.planets?.चंद्र;const birth=Number.isInteger(source?.dasha?.birthMoon?.nakshatraIndex)?source.dasha.birthMoon.nakshatraIndex:Number.isInteger(source?.birthNakshatraIndex)?source.birthNakshatraIndex:Number.isFinite(Number(moon?.longitude))?getNakshatraFromLongitude(Number(moon.longitude)).index:null;const a=signNumber(d1?.ascendant?.rashiIndex),m=signNumber(moon?.rashiIndex),d9m=signNumber(d9?.planets?.चंद्र?.rashiIndex);return {sixtyFourthNavamsa:{navamsaAscendant:shift(d9?.ascendant?.rashiIndex,3)===null?null:{source:"D9 लग्न",baseRashiIndex:signNumber(d9.ascendant.rashiIndex),rashiIndex:shift(d9.ascendant.rashiIndex,3)},navamsaMoon:d9m===null?null:{source:"D9 चंद्र",baseRashiIndex:d9m,rashiIndex:shift(d9m,3)}},twentySecondDrekkana:{ascendant:a===null?null:{source:"D1 लग्न राशि",baseRashiIndex:a,rashiIndex:shift(a,7)},moon:m===null?null:{source:"D1 चंद्र राशि",baseRashiIndex:m,rashiIndex:shift(m,7)},method:"निर्देशानुसार राशि संख्या +7; डिग्री-आधारित शास्त्रीय 22वें द्रेष्काण से अलग संकेत।"},bhriguNandiNadi:getBhriguNandiNadi(d1,source?.gender),navtara:getNavtara(d1,source?.gochar,birth),dashaChidra:dashaChidra(source?.dasha,now),vargottama:getVargottama(d1,d9),transitAnalysis:transitAnalysis(source)};}
module.exports={calculateAdvancedAstrology,getBhriguNandiNadi,getNavtara,dashaChidra,getVargottama};
