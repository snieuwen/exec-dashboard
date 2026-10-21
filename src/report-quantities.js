/* Recorded quantities only: never add unlike products or licence metrics. */
const ReportQuantities=(()=>{
 const model=typeof module!=='undefined'?require('./model.js'):Estate;
 const entitlement=r=>model.licenseEntitlement(r);
 const isUla=r=>entitlement(r).kind!=='regular';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=n=>Number.isFinite(n)?n.toLocaleString('en-GB',{maximumFractionDigits:10}):'Not supplied';
 function unit(r){
  const metric=String(r.metric||'').trim()||'Metric not supplied';
  if(metric.toUpperCase()!=='CURRENCY UNIT')return metric;
  const codes=[...new Set([r.ociLocalCurrency,r.supportCurrency,r.purchaseCurrency].filter(c=>/^[A-Z]{3}$/.test(c||'')))];
  return metric+' · '+(codes.length===1?codes[0]:'currency unconfirmed');
 }
 const hardware=r=>r.area==='Hardware';
 function key(r){if(hardware(r))return JSON.stringify([r.product,r.part||'']);const metric=unit(r),unknown=/currency unconfirmed|Metric not supplied|^Unspecified$/i.test(metric);return JSON.stringify([r.product,metric,r.term||'Not supplied',unknown?r.id:'']);}
 function years(rows){const known=[...new Set(rows.map(r=>String(r.orderDate||'').slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort(),missing=rows.some(r=>!/^\d{4}-/.test(r.orderDate||''));return (known.length>1?known[0]+'–'+known.at(-1):known[0]||'Not supplied')+(known.length&&missing?' · some dates missing':'');}
 function date(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return 'Not supplied';const [y,m,d]=value.split('-');return Number(d)+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m)-1]+' '+y;}
 function evidence(r){
  const period=hardware(r)?'Support':/subscription/i.test(r.kind||'')?'Subscription':'Support';
  const text=[r.entity||'Customer not supplied',r.country||'Country not supplied','Order date: '+date(r.orderDate),period+': '+date(r.start)+' → '+date(r.end),'CSI: '+(r.csi||'Not supplied')].join(' · ');
  return '<div class="order-evidence" title="'+esc(text)+'" style="white-space:nowrap;overflow-x:auto;font-size:11px;font-weight:400;color:var(--muted);line-height:1.6">'+esc(text)+'</div>';
 }
 const orderLabel=r=>'Order number: '+(r.order||'not supplied');
 // ISO 3166-1 alpha-2 country names, with common source-data aliases.
 const isoCountries='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
 const countryNames=new Intl.DisplayNames(['en'],{type:'region'});
 const countryCodes=new Map(isoCountries.flatMap(code=>[[code.toLowerCase(),code],[countryNames.of(code).toLowerCase(),code]]));
 for(const [name,code] of Object.entries({'uk':'GB','united states of america':'US','czech republic':'CZ','turkey':'TR','türkiye':'TR','bosnia and herzegovina':'BA','macedonia':'MK','republic of korea':'KR','south korea':'KR','russian federation':'RU','viet nam':'VN','ivory coast':'CI'}))countryCodes.set(name,code);
 const countryCode=value=>countryCodes.get(String(value||'').trim().toLowerCase())||'';
 const compactDate=value=>date(value).replaceAll(' ','-').toLowerCase();
 const compactOrderLabel=r=>(countryCode(r.country)?countryCode(r.country)+' ':'')+['Order nr. '+(r.order||'not supplied'),r.entity||'Customer not supplied',compactDate(r.orderDate),'CSI#'+(r.csi||'not supplied')+' ('+compactDate(r.start)+' – '+compactDate(r.end)+')'].join(' - ');
 const orderDateKey=r=>/^\d{4}-\d{2}-\d{2}$/.test(r.orderDate||'')?r.orderDate:'';
 const newestOrders=rows=>[...rows].sort((a,b)=>orderDateKey(b).localeCompare(orderDateKey(a))||String(a.order||'').localeCompare(String(b.order||''),undefined,{numeric:true})||String(a.id).localeCompare(String(b.id)));
 const evidenceRow=(r,columns,depth)=>'<tr class="order-evidence-row"><td colspan="'+columns+'" style="padding:0 10px 10px '+(12+Math.min(depth,2)*18)+'px">'+evidence(r)+'</td></tr>';
 function summary(rows){
  const groups=new Set(rows.map(key)),metrics=[...new Set(rows.map(unit))],terms=[...new Set(rows.map(r=>r.term||'Not supplied'))],missing=rows.filter(r=>!Number.isFinite(r.quantity)).length;
  return {quantity:rows.length&&groups.size===1&&!missing&&!rows.some(isUla)?rows.reduce((n,r)=>n+r.quantity,0):null,groups:groups.size,missing,metric:metrics.length===1?metrics[0]:'',term:terms.length===1?terms[0]:''};
 }
 function create(){
  const expanded=new Set(),collapsed=new Set();let expandAll=false,ulaExpandAll=false;
  const open=(key,depth)=>!collapsed.has(key)&&(expandAll||expanded.has(key));
  function reset(){expandAll=false;ulaExpandAll=false;expanded.clear();collapsed.clear();}
  function action(button){
   if(button.dataset.quantityExpand){expandAll=button.dataset.quantityExpand==='all';ulaExpandAll=expandAll;expanded.clear();collapsed.clear();if(!expandAll)collapsed.add('*');return true;}
   if(button.dataset.quantityNode){const key=button.dataset.quantityNode,depth=Number(button.dataset.quantityDepth),path=JSON.parse(key);
    if(path[0]==='ula'){
     ulaExpandAll=false;
     // Reopening a parent reveals only its immediate children, never remembered descendants.
     for(const set of [expanded,collapsed])for(const item of set){if(item==='*')continue;const child=JSON.parse(item);if(child.length>path.length&&path.every((part,i)=>child[i]===part))set.delete(item);}
    }
    if(button.getAttribute('aria-expanded')==='true'){expanded.delete(key);collapsed.add(key);}else{expanded.add(key);collapsed.delete(key);}return true;}
   return false;
  }
  function render(rows,{areas=[],shell=false,title='Recorded quantities by product',financial=null,prefixes=[]}={}){
   function cells(rs,stage){const q=summary(rs),hw=rs.length&&rs.every(hardware),show=['product','measure','line'].includes(stage)&&q.groups===1;if(!show)return '<td></td><td></td><td></td><td class="num">'+(stage==='line'?'':rs.length)+'</td>';const value=q.missing?'Incomplete':number(q.quantity);return '<td class="num" title="'+esc(q.missing?q.missing+' lines have no quantity':hw?'Sum of recorded component quantities for this product and part':'Sum of recorded quantities for this product, metric and term')+'">'+value+'</td><td>'+esc(hw?rs[0].productGroup||'Other components':q.metric)+'</td><td>'+esc(hw?years(rs):q.term)+'</td><td class="num">'+(stage==='line'?'':rs.length)+'</td>';}
   function group(rs,get){const map=new Map();for(const r of rs){const name=get(r);if(!map.has(name))map.set(name,[]);map.get(name).push(r);}return [...map].sort((a,b)=>a[0].localeCompare(b[0]));}
   function row(label,rs,path,depth,stage){
    const id=JSON.stringify(path),leaf=stage==='line',isOpen=!leaf&&(expanded.has(id)||!collapsed.has('*')&&open(id,depth));
    const attrs=leaf?(shell?'data-row="'+rs[0].row+'"':'data-record="'+esc(rs[0].id)+'"'):'data-quantity-node="'+esc(id)+'" data-quantity-depth="'+depth+'" aria-expanded="'+isOpen+'"';
    const displayLabel=leaf?compactOrderLabel(rs[0]):label;
    let html='<tr class="pivot-level-'+Math.min(depth,4)+'" data-quantity-level="'+stage+'"><td style="padding-left:'+(12+depth*18)+'px"><button class="link pivot-toggle'+(leaf?' quantity-order':'')+'" '+attrs+' title="'+esc(leaf?displayLabel+' · '+rs[0].id:label)+'" aria-label="'+esc((leaf?'Open ':isOpen?'Collapse ':'Expand ')+displayLabel+(leaf?' · '+rs[0].id:''))+'">'+(leaf?'↗':isOpen?'−':'+')+' '+esc(displayLabel)+'</button></td>'+(financial?financial.cells(rs,stage):cells(rs,stage))+'</tr>';
    if(isOpen){
     const products=()=>{for(const [name,children]of group(rs,r=>r.product))html+=row(name,children,[...path,name],depth+1,'product');};
     if(stage.startsWith('prefix:'))html+=roots(rs,path,depth+1,Number(stage.split(':')[1])+1);
     else if(stage==='portfolio'){for(const [name,children]of group(rs,r=>r.segment||r.area))html+=row(name,children,[...path,name],depth+1,'segment');}
     else if(stage==='segment'){const groups=group(rs,r=>r.productGroup||r.segment);if(groups.length===1&&groups[0][0]===label)products();else for(const [name,children]of groups)html+=row(name,children,[...path,name],depth+1,'group');}
     else if(stage==='group')products();
     else if(!financial&&stage==='product'&&summary(rs).groups>1){for(const [k,children]of group(rs,key))html+=row(hardware(children[0])?'Part: '+(children[0].part||'Not supplied'):unit(children[0])+' · '+(children[0].term||'Term not supplied'),children,[...path,k],depth+1,'measure');}
     else for(const r of newestOrders(rs))html+=row(r.id,[r],[...path,r.id],depth+1,'line');
    }return html;
   }
   function roots(rs,path=[],depth=0,index=0){
    if(index<prefixes.length)return group(rs,r=>r[prefixes[index]]||'Not supplied').map(([name,children])=>row(name,children,[...path,name],depth,'prefix:'+index)).join('');
    return group(rs,r=>r.area).sort((a,b)=>areas.indexOf(a[0])-areas.indexOf(b[0])).map(([name,children])=>row(name,children,[...path,name],depth,'portfolio')).join('');
   }
   function ulaTable(selected){
    if(!selected.length)return '';
    // Orders are scoped to the source entity; missing order numbers never merge.
    const orders=group(selected,r=>JSON.stringify([r.order||r.id,r.entity]));
    function ulaCells(rs,stage){
     if(stage!=='product')return '<td></td><td></td>';
     const forms=rs.map(entitlement),valid=forms.every(e=>!e.issue),kinds=new Set(forms.map(e=>e.kind)),limits=[...new Set(forms.map(e=>e.limit))];
     let display='Review quantity';
     if(valid&&kinds.size===1){if(forms[0].kind==='unlimited')display='∞ Unlimited';else display=limits.map(limit=>'Max. '+number(limit)).join(' / ');}
     return '<td class="num" data-ula-quantity>'+esc(display)+'</td><td>'+esc(unit(rs[0]))+'</td>';
    }
    function ulaRow(label,rs,path,depth,stage){
     const id=JSON.stringify(['ula',...path]),leaf=stage==='product',isOpen=!leaf&&!collapsed.has(id)&&(expanded.has(id)||!collapsed.has('*')&&ulaExpandAll);
     const name=leaf?'<span>'+esc(label)+'</span>':'<button class="link pivot-toggle" data-quantity-node="'+esc(id)+'" data-quantity-depth="'+depth+'" aria-expanded="'+isOpen+'">'+(isOpen?'−':'+')+' '+esc(label)+'</button>';
     let html='<tr class="pivot-level-'+depth+'" data-ula-level="'+stage+'"><td style="padding-left:'+(12+depth*18)+'px">'+name+'</td>'+ulaCells(rs,stage)+'</tr>';
     if(isOpen){
      if(stage==='root')for(const [orderKey,children]of orders){const first=children[0];html+=ulaRow('Order '+(first.order||'not supplied')+' — '+(first.entity||'Entity not supplied'),children,[orderKey],1,'order');}
      else if(stage==='order')for(const [productKey,children]of group(rs,r=>JSON.stringify([r.product,r.part,unit(r),r.term,entitlement(r).kind])))html+=ulaRow(children[0].product||'Product not supplied',children,[...path,productKey],2,'product');
     }
     return html;
    }
    return '<div class="table-scroll table-wrap section-gap"><table aria-label="ULA products" class="data-table table pivot-table quantity-table ula-quantity-table"><thead><tr><th>ULA products / order / product</th><th class="num">Quantity / limit</th><th>Metric</th></tr></thead><tbody>'+ulaRow('ULA products',selected,[],0,'root')+'</tbody></table></div>';

   }
   const ulaRows=financial?[]:rows.filter(isUla),regularRows=financial?rows:rows.filter(r=>!isUla(r));
   const portfolios=group(regularRows,r=>r.area).sort((a,b)=>areas.indexOf(a[0])-areas.indexOf(b[0]));
   // Share one header across software/cloud portfolios; hardware has its own columns.
   const tables=[false,true].map(hw=>{const sections=portfolios.filter(([name])=>(name==='Hardware')===hw),tableRows=sections.flatMap(([,rs])=>rs);if(!sections.length)return '';const heads=financial?financial.heads:['Quantity',hw?'Component type':'Metric',hw?'Purchase year(s)':'Term','Active lines'];return '<div class="table-scroll table-wrap section-gap"><table aria-label="'+(hw?'Hardware':'Software and subscriptions')+(financial?' financial values':' recorded quantities')+'" class="data-table table pivot-table quantity-table'+(financial?' compact-financial-table':' regular-quantity-table')+'"><thead><tr><th>'+(prefixes.length?'Country / entity / portfolio / product / order':'Portfolio / product / source line')+'</th>'+heads.map((h,i)=>'<th'+(financial||i===0||i===3?' class="num"':'')+'>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+roots(tableRows)+'</tbody>'+(financial?'<tfoot><tr><th>Selected '+(hw?'hardware':'software and subscriptions')+' totals</th>'+financial.cells(tableRows,'total')+'</tr></tfoot>':'')+'</table></div>';}).join('');
   return '<section class="panel section section-gap"><div class="panel-head"><div><h2>'+esc(title)+'</h2><p>'+(financial?'Active lines only. One-time purchases, annual support and subscriptions are separate measures. Expand to inspect original orders and support details.':'Active lines only. Software totals combine matching metrics and terms; hardware totals combine the same product and part. Expand to inspect the original order and support details.')+'</p></div><div class="pivot-controls pivot-actions"><button data-quantity-expand="all">Expand all</button> <button data-quantity-expand="none">Collapse all</button></div></div>'+ulaTable(ulaRows)+(tables||(!ulaRows.length?'<p class="empty">No Active records match this selection.</p>':''))+(financial?'':'<p class="small muted section-gap">'+rows.length+' selected Active lines. Recorded source quantities—not usage or a deduplicated entitlement assessment. Currency units remain in their original currency; unknown currencies are kept separate.'+(rows.some(hardware)?' Hardware quantities are components, not necessarily complete systems. Purchase years use the original Order Date; component types are derived from product descriptions.':'')+'</p>')+(!shell&&rows.some(hardware)?'<button class="subtle" data-view="aging">Review hardware aging and support cost →</button>':'')+'</section>';
  }
  return {action,render,reset};
 }
 function switcher(mode){return '<style>.portfolio-controls{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;margin-top:18px}.portfolio-controls>label{display:flex;flex-direction:column;gap:6px;font-size:12px}.portfolio-controls select{min-width:160px;min-height:38px;padding:8px;border:1px solid #cbd5df;border-radius:6px;background:white}.portfolio-controls .portfolio-view-toggle{display:flex;gap:6px;margin:0;align-items:center}.portfolio-controls .portfolio-view-toggle button{min-height:38px}.quantity-table{table-layout:fixed;width:100%;min-width:1320px}.quantity-table th:first-child{width:54%}.quantity-table th:nth-child(2){width:9%}.quantity-table th:nth-child(3){width:17%}.quantity-table th:nth-child(4){width:14%}.quantity-table th:nth-child(5){width:6%}.quantity-table td{overflow-wrap:anywhere}.quantity-table td:nth-child(3){font-weight:600}.quantity-table .quantity-order{display:block;width:100%;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;font-size:11px}.compact-financial-table th:first-child{width:58%}.compact-financial-table th:nth-child(2),.compact-financial-table th:nth-child(3),.compact-financial-table th:nth-child(4){width:12%}.compact-financial-table th:nth-child(5){width:6%}.compact-financial-table td:nth-child(3){font-weight:inherit}.quantity-table .num{font-variant-numeric:tabular-nums}[data-portfolio-mode][aria-pressed="true"]{background:var(--orange,var(--accent,#f60));color:#fff;border-color:var(--orange,var(--accent,#f60))}</style><div class="tabs ranking-tabs pivot-controls portfolio-view-toggle" role="group" aria-label="Portfolio view"><button data-portfolio-mode="financial" aria-pressed="'+(mode!=='quantity')+'" class="'+(mode!=='quantity'?'active':'')+'">Financial values</button><button data-portfolio-mode="quantity" aria-pressed="'+(mode==='quantity')+'" class="'+(mode==='quantity'?'active':'')+'">Quantities</button></div>';}
 function selectionKey(state){return JSON.stringify(['view','portfolioMode','area','country','entity','segment','query','window','month','contract','flag','usage','environment','recentMonths','recentAsOf','asof','agingAsOf','agingScope','agingReview','agingBand','changeCategory','atlasCountry','atlasMetric','metric','financial'].map(k=>state[k]));}
 return {key,unit,summary,isUla,evidence,evidenceRow,orderLabel,countryCode,compactOrderLabel,years,selectionKey,create,switcher};
})();
if(typeof module!=='undefined')module.exports=ReportQuantities;
