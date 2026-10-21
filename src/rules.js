/* Shared source preparation, used identically by CLI builds and browser reloads. */
const DashboardRules=(()=>{
 const schema=typeof module!=='undefined'?require('../schemas/eix-columns.json'):JSON.parse(document.getElementById('source-schema').textContent);
 const fold=value=>String(value??'').trim().toLowerCase();
 function sourceDate(value){
  if(value&&typeof value==='object')value=value.date;
  if(typeof value==='number'){
   if(!Number.isFinite(value)||value<1)return '';
   try{value=new Date(Math.round((value-25569)*86400000)).toISOString().slice(0,10);}catch{return '';}
  }
  const text=String(value??'').trim();if(!/^\d{4}-\d{2}-\d{2}(?:$|T|_|\s)/.test(text))return '';
  const day=text.slice(0,10);try{return new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day?day:'';}catch{return '';}
 }
 function prepare(input,config={},options={}){
  const snapshot=sourceDate(options.snapshot||config.snapshot);
  if(!snapshot&&['sw-details','hw-details'].some(sheet=>input[sheet]?.length>1))throw Error('Source preparation requires the EIX export/snapshot date (YYYY-MM-DD).');
  const source={},origins={},counts={},excludedRows={};
  for(const sheet of ['sw-details','hw-details']){
   const matrix=input[sheet];if(!Array.isArray(matrix)||!Array.isArray(matrix[0]))throw Error('Missing detail sheet: '+sheet);
   const headers=matrix[0];if(JSON.stringify(headers)!==JSON.stringify(schema[sheet]))throw Error('Unexpected source column layout: '+sheet);
   const index=name=>{const i=headers.indexOf(name);if(i<0)throw Error('Unknown cleansing column: '+name);return i;};
   const rules=(config.cleansing||[]).filter(rule=>!rule.sheet||rule.sheet===sheet);
   const operations=rules.map(rule=>({...rule,columnIndex:index(rule.column)}));
   source[sheet]=[headers.slice()];origins[sheet]=[];excludedRows[sheet]=[];let dropped=0,changed=0,excludedInactive=0,excludedPastEnd=0,excludedCustomer=0,missingEndDate=0,invalidEndDate=0;
   const statusIndex=index(sheet==='sw-details'?'Support Status':'Contract Status Type'),endIndex=index(sheet==='sw-details'?'Support/Subscription End Date':"Support Expiration");
   function scopeReason(row){if(fold(row[statusIndex])==='inactive')return 'Inactive';const end=sourceDate(row[endIndex]);return end&&snapshot&&end<snapshot?'Past end date':'';}
   function drop(row,i,reason){dropped++;if(reason==='Inactive')excludedInactive++;else if(reason==='Past end date')excludedPastEnd++;else excludedCustomer++;excludedRows[sheet].push({sheet,row:i+2,reason,endDate:sourceDate(row[endIndex])||null});}
   matrix.slice(1).forEach((record,i)=>{
    const row=Array.from({length:headers.length},(_,j)=>record?.[j]??null);let excluded=false;
    // Mandatory scope cleansing precedes customer transformations: an inactive row cannot be reactivated by a replacement rule.
    const initialReason=scopeReason(row);if(initialReason){drop(row,i,initialReason);return;}
    for(const rule of operations){
     const matches=rule.values?rule.values.some(value=>fold(value)===fold(row[rule.columnIndex])):rule.contains!==undefined?fold(row[rule.columnIndex]).includes(fold(rule.contains)):true;
     if(rule.action==='exclude'&&matches){excluded=true;break;}
     if(rule.action==='trim'&&typeof row[rule.columnIndex]==='string'){const before=row[rule.columnIndex];row[rule.columnIndex]=before.trim();if(before!==row[rule.columnIndex])changed++;}
     if(rule.action==='replace'&&matches){row[rule.columnIndex]=rule.value;changed++;}
    }
    if(excluded){drop(row,i,'Customer rule');return;}
    const finalReason=scopeReason(row);if(finalReason){drop(row,i,finalReason);return;}
    if(row[endIndex]===null||String(row[endIndex]).trim()==='')missingEndDate++;else if(!sourceDate(row[endIndex]))invalidEndDate++;
    source[sheet].push(row);origins[sheet].push({sheet,row:i+2});
   });
   counts[sheet]={input:matrix.length-1,retained:source[sheet].length-1,excluded:dropped,excludedInactive,excludedPastEnd,excludedCustomer,missingEndDate,invalidEndDate,changed};
  }
  return {source,origins,counts,excludedRows,snapshot,summary:JSON.stringify(counts)};
 }
 function validateConfig(config){
  if(!config||typeof config!=='object'||Array.isArray(config))throw Error('Configuration must be an object.');
  if(config.schemaVersion!==1)throw Error('Configuration schemaVersion must be 1.');
  if(config.reportCurrency&&!['USD','AUD','BRL','CHF','CNY','EUR','GBP','INR','JPY','MXN','PLN','SAR','SGD','TRY'].includes(config.reportCurrency))throw Error('Unsupported report currency.');
  const f=config.financial||{};
  if(f.hardwareSupportAnnual!==undefined&&typeof f.hardwareSupportAnnual!=='boolean')throw Error('hardwareSupportAnnual must be boolean.');
  for(const key of ['hardwarePurchaseCurrency','softwarePurchaseCurrency'])if(f[key]&&!['order','support'].includes(f[key]))throw Error('Invalid financial currency preference.');
  for(const rule of config.cleansing||[]){
   if(!['exclude','trim','replace'].includes(rule.action)||!rule.column)throw Error('Invalid cleansing rule.');
   if(rule.sheet&&!['sw-details','hw-details'].includes(rule.sheet))throw Error('Invalid cleansing sheet.');
   if(['exclude','replace'].includes(rule.action)&&!Array.isArray(rule.values)&&rule.contains===undefined)throw Error('Exclusion/replacement rules require values or contains.');
  }
  return config;
 }
 return {prepare,validateConfig,sourceDate};
})();
if(typeof module!=='undefined')module.exports=DashboardRules;
