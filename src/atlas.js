/* Purchasing-country atlas. Geometry is static; every financial value is calculated from current Active Source data records. */
const EstateAtlas=(()=>{
 const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const aliases={'turkiye':'792','turkey':'792','czechrepublic':'203','czechia':'203','unitedstates':'840','usa':'840','us':'840','unitedkingdom':'826','uk':'826','russianfederation':'643','korearepublicof':'410','republicofkorea':'410','southkorea':'410','vietnamesocialistrepublic':'704','vietnam':'704','hongkong':'344','taiwan':'158','unitedarabemirates':'784','uae':'784','slovakrepublic':'703','ivorycoast':'384','cotedivoire':'384','congodemocraticrepublicof':'180','democraticrepublicofthecongo':'180','congorepublicof':'178','iranislamicrepublicof':'364','tanzaniaunitedrepublicof':'834','boliviaplurinationalstateof':'068','venezuela':'862','moldovarepublicof':'498','laopeoplesdemocraticrepublic':'418','syrianarabrepublic':'760','bruneidarussalam':'096','macau':'446','palestine':'275','northmacedonia':'807'};
 const measures={annual:'Annual support + subscriptions',purchase:'Original software licence purchase',annualSupport:'Annual support (software and hardware)',subscription:'Annual subscriptions',hardware:'Annual hardware support'};
 const palette=['#ebebeb','#bcbcbc','#848484','#545454'];
 function countryId(name,geography){const k=key(name);return aliases[k]||geography.countries.find(c=>key(c.name)===k)?.id||null;}
 function amount(rows,metric,E){if(metric==='annual'&&!rows.some(r=>r.annualSupport!==null&&r.annualSupport!==undefined||r.subscription!==null&&r.subscription!==undefined))return null;return E.aggregate(rows)[metric]??null;}
 function summarize(records,metric,geography,E){
  const groups=new Map();
  for(const row of records.filter(r=>r.status==='Active')){const id=countryId(row.country,geography),k=id||'unmapped:'+row.country;if(!groups.has(k))groups.set(k,{key:k,id,names:[],rows:[]});const g=groups.get(k);g.rows.push(row);if(!g.names.includes(row.country))g.names.push(row.country);}
  const countries=[...groups.values()].map(g=>({...g,name:g.names.sort().join(' / '),value:amount(g.rows,metric,E),entities:new Set(g.rows.map(r=>r.entity)).size})).sort((a,b)=>(b.value??-Infinity)-(a.value??-Infinity)||a.name.localeCompare(b.name));
  const rows=countries.flatMap(c=>c.rows),positive=countries.reduce((n,c)=>n+Math.max(c.value||0,0),0);
  return {countries,total:amount(rows,metric,E),positive,rows,unmapped:countries.filter(c=>!c.id),top3Share:positive?countries.slice(0,3).reduce((n,c)=>n+Math.max(c.value||0,0),0)/positive:null};
 }
 function color(value,positive){if(value===null)return '#cecece';if(value<0)return '#727272';if(value===0)return 'url(#atlas-zero)';const share=positive?value/positive:0;return palette[share<=.01?0:share<=.05?1:share<=.2?2:3];}
 return {countryId,amount,summarize,color,measures,palette};
})();
if(typeof module!=='undefined')module.exports=EstateAtlas;
