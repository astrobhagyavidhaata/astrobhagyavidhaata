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


const ASCENDANT_TRANSIT_RULES = {
 शनि:{good:[3,6,11],meaning:{1:"शारीरिक थकान, जिम्मेदारियों का बोझ और जीवन-दिशा में बदलाव",2:"परिवार से दूरी, वाणी में कठोरता और धन-संचय में रुकावट",3:"पराक्रम और धैर्य में वृद्धि",4:"घर की अशांति, माता/गृहस्थी की चिंता या स्थान परिवर्तन",5:"संतान, प्रेम और निर्णय में देरी",6:"शत्रु, रोग और विवाद पर मेहनत से विजय",7:"जीवनसाथी/साझेदारी पर दबाव और वैचारिक मतभेद",8:"काम में रुकावट, पुराने रोग/तनाव और शोध की ओर झुकाव",9:"भाग्य में देरी और पिता/गुरु से मतभेद",10:"कार्य में अधिक मेहनत से धीरे-धीरे स्थायी प्रतिष्ठा",11:"स्थायी आय-स्रोत और लक्ष्य में प्रगति",12:"खर्च, अनिद्रा, एकांत और दूर स्थान/विदेश से संबंध"}},
 गुरु:{good:[1,2,4,5,7,9,10,11],meaning:{1:"व्यक्तित्व, स्वास्थ्य-जागरूकता और आत्मविश्वास में विस्तार",2:"धन, परिवार और संचय में वृद्धि",3:"सीखने, प्रयास और संचार में विस्तार; परिणाम मेहनत पर निर्भर",4:"घर, माता, शिक्षा, वाहन या संपत्ति के विषय सक्रिय",5:"ज्ञान, संतान, शिक्षा और रचनात्मकता में सहारा",6:"ऋण, प्रतिस्पर्धा, दिनचर्या या वजन पर ध्यान",7:"विवाह, साझेदारी और सार्वजनिक संबंधों में विस्तार",8:"संकट में मार्गदर्शन, शोध और साझा संसाधनों पर ध्यान",9:"भाग्य, उच्च शिक्षा, धर्म और गुरु-कृपा के विषय सक्रिय",10:"करियर, प्रतिष्ठा और जिम्मेदारी में विस्तार",11:"लाभ, नेटवर्क और इच्छापूर्ति में सहारा",12:"धार्मिक यात्रा, दान और आवश्यक खर्च में वृद्धि"}},
 राहु:{good:[3,6,10,11],meaning:{1:"महत्वाकांक्षा/भ्रम बढ़ सकता है; निर्णय जाँचें",2:"वाणी, परिवार और धन में असामान्य उतार-चढ़ाव",3:"तकनीक, साहस और नेटवर्क से अवसर",4:"घर की शांति और निवास में बदलाव",5:"प्रेम, संतान और जोखिम वाले निर्णयों में भ्रम",6:"प्रतिस्पर्धा और विरोधियों से निपटने की क्षमता",7:"साझेदारी में शक/बाहरी हस्तक्षेप से सावधानी",8:"गोपनीयता, साझा धन और अचानक बदलाव में सावधानी",9:"विश्वास, यात्रा और मार्गदर्शकों को लेकर असमंजस",10:"डिजिटल/असामान्य करियर दिशा में बदलाव",11:"नेटवर्क और महत्वाकांक्षा से अचानक अवसर",12:"खर्च, एकांत और भ्रम से सावधानी"}},
 केतु:{good:[3,6,10,11],meaning:{1:"आत्म-छवि और दिशा में विरक्ति/अनिश्चितता",2:"वाणी और पारिवारिक जुड़ाव में दूरी",3:"स्वतंत्र प्रयास और कौशल पर ध्यान",4:"घर/निवास से मन हटना",5:"प्रेम/संतान/रचनात्मकता में अलिप्तता",6:"विरोध और समस्याओं को काटने पर ध्यान",7:"साझेदारी में दूरी और संवाद की कमी",8:"गुप्त विषय, शोध और अनिश्चितता",9:"परंपरा/गुरु/भाग्य को लेकर प्रश्न",10:"पुराने काम से मन हटना, स्वतंत्र/नए क्षेत्र की ओर झुकाव",11:"पुराने नेटवर्क से दूरी, नए लक्ष्यों पर ध्यान",12:"एकांत, आध्यात्म और खर्च पर ध्यान"}},
 सूर्य:{good:[3,6,10,11],meaning:{1:"आत्मविश्वास और अहं-टकराव दोनों बढ़ सकते हैं",4:"घर में गर्मी/तनाव",7:"साझेदारी में अहं का टकराव",8:"जोखिम और विवाद से सावधानी",12:"खर्च और थकान पर ध्यान"}},
 मंगल:{good:[3,6,10,11],meaning:{1:"जल्दबाजी, क्रोध और चोट से सावधानी",4:"घरेलू विवाद/संपत्ति में जल्दबाजी से बचें",7:"जीवनसाथी/साझेदारी में टकराव",8:"चोट, ऑपरेशन या अचानक विवाद से सावधानी",12:"ऊर्जा का अपव्यय और अनावश्यक खर्च"}}
};
function ascendantTransitAnalysis(source){
 const asc=signNumber(source?.d1?.ascendant?.rashiIndex),planets=source?.gochar?.planets||[];
 if(asc===null||!planets.length)return {available:false,reason:"जन्म लग्न राशि या वर्तमान गोचर ग्रह उपलब्ध नहीं।"};
 const rows=planets.filter(p=>ASCENDANT_TRANSIT_RULES[p.name]).map(p=>{
  const sign=signNumber(p?.rashiIndex);if(sign===null)return null;
  const house=((sign-asc+12)%12)+1,rule=ASCENDANT_TRANSIT_RULES[p.name];
  return {planet:p.name,rashi:p.rashi||null,rashiIndex:sign,houseFromAscendant:house,nature:rule.good.includes(house)?"दिए गए नियमों में अनुकूल भाव":p.name==="गुरु"&&[6,8,12].includes(house)?"मिश्रित/त्रिक भाव":"विषय-विशिष्ट/सावधानी वाला भाव",interpretation:rule.meaning?.[house]||"इस भाव के विषय सक्रिय; फल का निर्णय दशा और अन्य योगों के साथ करें."};
 }).filter(Boolean);
 const nodes=rows.filter(x=>x.planet==="राहु"||x.planet==="केतु");
 return {available:true,reference:"जन्म लग्न",natalAscendantRashiIndex:asc,method:"यह गणना केवल जन्म लग्न से 1–12 भाव गिनती है; चंद्रमा-आधारित गोचर से स्वतंत्र रखी गई है।",rahuKetuAxis:nodes.length?{positions:nodes,axis:"लग्न-सप्तम तथा चतुर्थ-दशम अक्ष को अलग से देखें; राहु/केतु सामान्यतः विपरीत राशियों में होते हैं।"}:null,planets:rows};
}

function calculateAdvancedAstrology(source,now=new Date()){const d1=source?.d1||{},d9=source?.d9||{},moon=d1?.planets?.चंद्र;const birth=Number.isInteger(source?.dasha?.birthMoon?.nakshatraIndex)?source.dasha.birthMoon.nakshatraIndex:Number.isInteger(source?.birthNakshatraIndex)?source.birthNakshatraIndex:Number.isFinite(Number(moon?.longitude))?getNakshatraFromLongitude(Number(moon.longitude)).index:null;const a=signNumber(d1?.ascendant?.rashiIndex),m=signNumber(moon?.rashiIndex),d9m=signNumber(d9?.planets?.चंद्र?.rashiIndex);return {sixtyFourthNavamsa:{navamsaAscendant:shift(d9?.ascendant?.rashiIndex,3)===null?null:{source:"D9 लग्न",baseRashiIndex:signNumber(d9.ascendant.rashiIndex),rashiIndex:shift(d9.ascendant.rashiIndex,3)},navamsaMoon:d9m===null?null:{source:"D9 चंद्र",baseRashiIndex:d9m,rashiIndex:shift(d9m,3)}},twentySecondDrekkana:{ascendant:a===null?null:{source:"D1 लग्न राशि",baseRashiIndex:a,rashiIndex:shift(a,7)},moon:m===null?null:{source:"D1 चंद्र राशि",baseRashiIndex:m,rashiIndex:shift(m,7)},method:"निर्देशानुसार राशि संख्या +7; डिग्री-आधारित शास्त्रीय 22वें द्रेष्काण से अलग संकेत।"},bhriguNandiNadi:getBhriguNandiNadi(d1,source?.gender),navtara:getNavtara(d1,source?.gochar,birth),dashaChidra:dashaChidra(source?.dasha,now),vargottama:getVargottama(d1,d9),moonTransit:transitAnalysis(source),ascendantTransit:ascendantTransitAnalysis(source)};}
module.exports={calculateAdvancedAstrology,getBhriguNandiNadi,getNavtara,dashaChidra,getVargottama};
