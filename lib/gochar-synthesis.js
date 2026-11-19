"use strict";

// Astro Bhagya Vidhata — Vedic Gochar synthesis and event-signal engine.
// Bala values are used only when supplied by a verified calculation module.
const TARA_MAP = {
  1:{name:"जन्म तारा",nature:"मध्यम (सावधानी)",score:0},
  2:{name:"संपत तारा",nature:"अति शुभ (धन/लाभ)",score:2},
  3:{name:"विपत तारा",nature:"चुनौतीपूर्ण (रुकावट)",score:-2},
  4:{name:"क्षेम तारा",nature:"शुभ (सुख/सुरक्षा)",score:1},
  5:{name:"प्रत्यरि तारा",nature:"चुनौतीपूर्ण (विरोध/तनाव)",score:-2},
  6:{name:"साधक तारा",nature:"अति शुभ (कार्य सिद्धि)",score:2},
  7:{name:"नैधन (वध) तारा",nature:"अधिक सावधानी",score:-3},
  8:{name:"मित्र तारा",nature:"शुभ (सहयोग)",score:1},
  9:{name:"अतिमित्र तारा",nature:"अति शुभ (सफलता)",score:2}
};

function calculateTaraBal(janmaNakshatraNum, transitNakshatraNum) {
  const birth=Number(janmaNakshatraNum), transit=Number(transitNakshatraNum);
  if(!Number.isInteger(birth)||birth<1||birth>27||!Number.isInteger(transit)||transit<1||transit>27)return null;
  const count=(transit-birth+27)%27+1;
  const taraIndex=count%9===0?9:count%9;
  return {taraNumber:taraIndex,...TARA_MAP[taraIndex],countFromJanma:count};
}

function detectLifeEvents(kundaliData, transitPlanets, dashaInfo) {
  const triggers=[];
  const birthNakshatra=Number(kundaliData?.janmaNakshatraNumber);
  const md=String(dashaInfo?.mahadashaLord||"");
  const ad=String(dashaInfo?.antardashaLord||"");
  for(const planet of (Array.isArray(transitPlanets)?transitPlanets:[])){
    const tara=calculateTaraBal(birthNakshatra,Number(planet.transitNakshatraNumber));
    if(!tara)continue;
    const isDashaLord=planet.name===md||planet.name===ad;
    const house=Number(planet.transitHouseFromLagna);
    const bala=Number(planet.shadbalaPercent);
    const hasVerifiedBala=Number.isFinite(bala);
    // Career: the supplied rule requires a verified Shadbala >= 100; missing data never passes.
    if([10,6,11].includes(house)&&tara.score>0&&hasVerifiedBala&&bala>=100){
      triggers.push({category:"career_positive",text:`करियर/नौकरी में उन्नति के सहायक संकेत: ${planet.name} (${tara.name}) ${house}वें भाव में गोचर कर रहा है; सत्यापित षड्बल ${bala}% है।`});
    }
    if([8,12].includes(house)&&(tara.score<0||isDashaLord)){
      triggers.push({category:"career_caution",text:`कामकाज में बदलाव, अस्थिरता या अतिरिक्त जिम्मेदारियों पर ध्यान दें: ${planet.name} (${tara.name}) ${house}वें भाव में है${isDashaLord?" और वर्तमान दशा स्वामी भी है":""}। यह अकेले नौकरी छूटने का प्रमाण नहीं है।`});
    }
    if([7,5].includes(house)&&["गुरु","शुक्र"].includes(planet.name)&&tara.score>=0){
      triggers.push({category:"relationship_positive",text:`रिश्ते/विवाह के लिए सहायक संकेत: ${planet.name} का ${house}वें भाव में गोचर (${tara.name})।`});
    }
    if(house===7&&["शनि","राहु","केतु","मंगल"].includes(planet.name)&&tara.score<0){
      triggers.push({category:"relationship_caution",text:`संबंधों में धैर्य और स्पष्ट संवाद की जरूरत हो सकती है: ${planet.name} का सप्तम भाव में गोचर तथा ${tara.name}।`});
    }
    if([9,12].includes(house)&&["राहु","चंद्र","शनि"].includes(planet.name)||([9,12].includes(house)&&isDashaLord)){
      triggers.push({category:"travel",text:`दूर यात्रा, निवास परिवर्तन या घर से दूरी के विषय सक्रिय हो सकते हैं: ${planet.name} का ${house}वें भाव में गोचर। यह यात्रा की गारंटी नहीं है।`});
    }
    if(house===4&&["गुरु","शुक्र"].includes(planet.name)&&tara.score>0){
      triggers.push({category:"home_property",text:`घर, वाहन या पारिवारिक सुख के विषयों में सहायक संकेत: ${planet.name} का चतुर्थ भाव में शुभ तारा बल के साथ गोचर।`});
    }
    if([6,8].includes(house)&&["मंगल","शनि","राहु"].includes(planet.name)&&tara.score<=-2){
      triggers.push({category:"caution",text:`तनाव, विवाद और दिनचर्या/स्वास्थ्य की देखभाल पर ध्यान दें: ${planet.name} का ${house}वें भाव में ${tara.name} के साथ गोचर। यह किसी रोग, चोट या मुकदमे का निदान/निश्चित संकेत नहीं है।`});
    }
    if(planet.name==="चंद्र"&&(house===8||house===12||[3,7].includes(tara.taraNumber))){
      triggers.push({category:"mood",text:`आज मन और नींद के लिए अतिरिक्त विश्राम उपयोगी हो सकता है: चंद्रमा ${house}वें भाव और ${tara.name} में है।`});
    }
    planet.taraBal=tara;
    planet.isCurrentDashaLord=isDashaLord;
    planet.verifiedShadbalaAvailable=hasVerifiedBala;
  }
  return triggers;
}

function buildGocharSynthesis(kundaliData, transitData) {
  const birthPlanets=kundaliData?.d1?.planets||{};
  const moon=birthPlanets["चंद्र"]||{};
  const dasha=kundaliData?.dasha?.current||{};
  const janmaNakshatraNumber=Number.isInteger(Number(moon.nakshatraIndex))?Number(moon.nakshatraIndex)+1:null;
  const dashaInfo={
    mahadashaLord:dasha.mahadasha||null,
    antardashaLord:dasha.antardasha||null,
    pratyantardashaLord:dasha.pratyantardasha||null,
    dashaNature:null,
    mahadashaStart:dasha.mahadashaStart||null,
    mahadashaEnd:dasha.mahadashaEnd||null,
    antardashaStart:dasha.antardashaStart||null,
    antardashaEnd:dasha.antardashaEnd||null
  };
  const planets=(transitData.planets||[]).map(p=>{
    const natal=birthPlanets[p.name]||{};
    return {
      name:p.name,
      transitLongitude:p.longitude,
      transitSign:p.rashi,
      transitNakshatra:p.nakshatra,
      transitNakshatraNumber:Number.isInteger(Number(p.nakshatraIndex))?Number(p.nakshatraIndex)+1:null,
      transitPada:p.pada,
      transitHouseFromLagna:p.lagnaHouse,
      transitHouseFromMoon:p.moonHouse,
      retrograde:p.retrograde,
      combust:p.combust,
      natal:{
        sign:natal.rashi||null,longitude:Number.isFinite(Number(natal.longitude))?natal.longitude:null,
        house:natal.house??null,nakshatra:natal.nakshatra||null,
        nakshatraPada:natal.pada??null
      },
      // Current chart engine does not yet calculate these values.
      shadbalaPercent:null,bhavaBala:null
    };
  });
  const kundali={
    lagna:kundaliData?.d1?.ascendant?.rashi||null,
    chandraRashi:moon.rashi||null,
    janmaNakshatra:moon.nakshatra||null,
    janmaCharan:moon.pada??null,
    janmaNakshatraNumber,
    d1Planets:planets.map(p=>({name:p.name,...p.natal})),
    balaAvailability:{shadbala:false,bhavaBala:false,reason:"वर्तमान जन्मकुंडली इंजन इनका प्रमाणित संख्यात्मक मान अभी नहीं देता।"}
  };
  const triggers=detectLifeEvents(kundali,planets,dashaInfo);
  return {kundali,dashaInfo,transitPlanets:planets,activeTriggers:triggers};
}

module.exports={calculateTaraBal,detectLifeEvents,buildGocharSynthesis};
