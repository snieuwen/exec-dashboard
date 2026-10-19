/* Shared source preparation, used identically by CLI builds and browser reloads. */
const DashboardRules=(()=>{
 const schema=typeof module!=='undefined'?require('../schemas/eix-columns.json'):JSON.parse(document.getElementById('source-schema').textContent);
 const fold=value=>String(value??'').trim().toLowerCase();
 function prepare(input,config={}){
  const source={},origins={},counts={};
  for(const sheet of ['sw-details','hw-details']){
   const matrix=input[sheet];if(!Array.isArray(matrix)||!Array.isArray(matrix[0]))throw Error('Missing detail sheet: '+sheet);
   const headers=matrix[0];if(JSON.stringify(headers)!==JSON.stringify(schema[sheet]))throw Error('Unexpected source column layout: '+sheet);
   const index=name=>{const i=headers.indexOf(name);if(i<0)throw Error('Unknown cleansing column: '+name);return i;};
   const rules=(config.cleansing||[]).filter(rule=>!rule.sheet||rule.sheet===sheet);
   const operations=rules.map(rule=>({...rule,columnIndex:index(rule.column)}));
   source[sheet]=[headers.slice()];origins[sheet]=[];let dropped=0,changed=0;
   matrix.slice(1).forEach((record,i)=>{
    const row=Array.from({length:headers.length},(_,j)=>record?.[j]??null);let excluded=false;
    for(const rule of operations){
     const matches=rule.values?rule.values.some(value=>fold(value)===fold(row[rule.columnIndex])):rule.contains!==undefined?fold(row[rule.columnIndex]).includes(fold(rule.contains)):true;
     if(rule.action==='exclude'&&matches){excluded=true;break;}
     if(rule.action==='trim'&&typeof row[rule.columnIndex]==='string'){const before=row[rule.columnIndex];row[rule.columnIndex]=before.trim();if(before!==row[rule.columnIndex])changed++;}
     if(rule.action==='replace'&&matches){row[rule.columnIndex]=rule.value;changed++;}
    }
    if(excluded){dropped++;return;}source[sheet].push(row);origins[sheet].push({sheet,row:i+2});
   });
   counts[sheet]={input:matrix.length-1,retained:source[sheet].length-1,excluded:dropped,changed};
  }
  return {source,origins,counts,summary:JSON.stringify(counts)};
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
 return {prepare,validateConfig};
})();
if(typeof module!=='undefined')module.exports=DashboardRules;
