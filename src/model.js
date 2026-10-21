/* Shared data model for the HTML report and its build-time verification. */
const Estate = (() => {
  let config={};
  // Mandatory shared hardware policy, including for legacy customer configurations.
  function configure(value={}){config={...value,financial:{...value.financial,hardwareSupportAnnual:true,hardwarePurchaseCurrency:"support"}};}
  const areas = ['Technology software','Applications software','Appliance software','Hardware','OCI Universal Credits','SaaS Subscriptions','Learning Credits','Unclassified — review'];
  const day = 86400000;
  const numeric = x => typeof x === 'number' && Number.isFinite(x) ? x : null;
  const text = x => x == null ? '' : String(x);
  function date(x) {
    if (x && typeof x === 'object' && x.date) x=x.date;
    if (typeof x==='number') return new Date(Math.round((x-25569)*day)).toISOString().slice(0,10);
    if (!x) return '';
    const s=String(x).slice(0,10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) ? s : '';
  }
  function swCategory(r) {
    if(r[16]==='Exadata Software')return [areas[2],'Exadata software'];
    if(r[16]==='Zero Data Loss Recovery Appliance Software')return [areas[2],'Recovery Appliance software'];
    if(r[12]==='Cloud'){
      if(r[15]==='PaaS and IaaS Universal Credits')return [areas[4],'OCI Universal Credits'];
      if(r[14]==='Education as a Service')return [areas[6],'Learning subscriptions'];
      return [areas[5],r[14]||'Unclassified SaaS — review'];
    }
    if(['Database','Middleware'].includes(r[12]))return [areas[0],r[12]];
    if(r[12]==='Applications')return [areas[1],r[16]||'Other applications'];
    return [areas[7],r[12]||'Unclassified software'];
  }
  function hardwareGroup(product){
    const p=text(product);
    if(/model family/i.test(p))return 'System families / configuration references';
    if(/switch/i.test(p))return 'Networking — switches and switch kits';
    if(/power cord|\bcable|cord assembly/i.test(p))return 'Cables and power cords';
    if(/transceiver|short wave optics/i.test(p))return 'Networking — transceivers and optics';
    if(/\bHBA\b|\badapter\b|network card/i.test(p)&&!/(database|storage) server/i.test(p))return 'Networking and storage adapters';
    if(/\bPDU\b|power distribution|power suppl/i.test(p))return 'Power distribution and supplies';
    if(/\bDIMM\b|memory expansion|memory kit|memory module/i.test(p))return 'Memory';
    if(/storage server/i.test(p))return 'Storage servers';
    if(/database server/i.test(p)&&!/rack/i.test(p))return 'Database servers';
    if(/\bserver\b/i.test(p)&&!/rack/i.test(p))return 'Servers';
    if(/drive enclosure/i.test(p))return 'Storage enclosures';
    if(/disk drive|solid.state|\bSSD\b|\bHDD\b|\bSAS.*drive|\bNVMe.*drive/i.test(p))return 'Storage drives';
    if(/\bprocessor|\bCPU\b|\bXeon\b/i.test(p))return 'Processors';
    if(/\brack\b|\bchassis\b|racked system/i.test(p))return 'Systems and racks';
    if(/upgrade/i.test(p))return 'Upgrade kits';
    return 'Other components and accessories';
  }
  // Licence forms are explicit source conventions, never inferred from quantity alone.
  function licenseEntitlement(r){
    const raw=text(r.licenseLevel),level=raw.trim().toUpperCase().replace(/[\s_\-–—]+/g,' ');
    const regular={kind:'regular',label:'Regular',source:raw,display:numeric(r.quantity)===null?'Not supplied':String(r.quantity),limit:null,unlimited:false,issue:''};
    if(r.sheet!=='sw-details')return regular;
    const capped=['C ULA','CULA','CAPPED ULA','ULA CAPPED','CAPPED UNLIMITED LICENSE AGREEMENT','CAPPED UNLIMITED LICENCE AGREEMENT','CAPPED UNLIMITED LICENSE AGREEMENT (C ULA)','UNLIMITED LICENSE AGREEMENT (C ULA)'];
    const unlimited=['ULA','UNLIMITED LICENSE AGREEMENT','UNLIMITED LICENCE AGREEMENT','UNLIMITED LICENSE AGREEMENT (ULA)','UNLIMITED LICENCE AGREEMENT (ULA)'];
    let kind=capped.includes(level)?'capped':unlimited.includes(level)?'unlimited':/\bULA\b|UNLIMITED LICEN[CS]E/.test(level)&&!['NO ULA','NON ULA','NOT ULA'].includes(level)?'review':'regular';
    if(kind==='regular')return regular;
    const label=kind==='capped'?'Capped ULA':kind==='unlimited'?'ULA':'ULA — review';
    const valid=kind==='unlimited'?r.quantity===1:kind==='capped'?numeric(r.quantity)!==null&&r.quantity>0:false;
    const issue=kind==='review'?'Unrecognised ULA License Level':valid?'':kind==='capped'?'Capped ULA quantity missing or not positive':'ULA quantity is not the expected placeholder 1';
    return {kind,label,source:raw,display:valid?(kind==='unlimited'?'∞ Unlimited':'Max. '+r.quantity):'Review quantity',limit:kind==='capped'&&valid?r.quantity:null,unlimited:kind==='unlimited'&&valid,issue};
  }
  function normalize(source,options={}) {
    for(const s of ['sw-details','hw-details']){
      if(options.allowMissingSheets&&!source[s]?.length)continue;
      if(!Array.isArray(source[s])||source[s].length<1)throw Error('Workbook must contain populated sw-details and hw-details sheets.');
      if(source[s][0][s==='sw-details'?40:55]!== (s==='sw-details'?'Annualized Support Fee - USD':'Support Fees (USD)'))throw Error('The detail-sheet columns differ from the Source data layout. Please use the original Source data detail layout.');
    }
    const result=[];
    for(const [sheet,matrix] of Object.entries(source)){
      if(!['sw-details','hw-details'].includes(sheet))continue;
      const sw=sheet==='sw-details';
      matrix.slice(1).forEach((r,index)=>{
        if(!r[sw?11:31]||(!options.includeInactive&&r[sw?11:31]!=='Active'))return;
        const cloud=sw&&r[12]==='Cloud',technologySub=sw&&!cloud&&r[18]==='Java SE - Subscription';
        const [area,segment]=sw?swCategory(r):[areas[3],r[11]==='Exadata Database Machine'?'Exadata hardware':r[11]==='Zero Data Loss Recovery Appliance'?'Recovery Appliance hardware':'Other hardware'];
        const item={id:`${sheet}!${index+2}`,sheet,row:index+2,status:text(r[sw?11:31]),area,segment,environment:cloud?'Cloud':'On-prem',kind:sw?(cloud?'Subscription':technologySub?'Technology subscription':'Software licence'):'Hardware',
          entity:text(r[sw?4:0]),party:text(r[sw?60:37]),country:text(r[sw?10:1])||'Unassigned',product:text(r[sw?18:4]),family:text(r[sw?16:11]),part:text(r[sw?22:5]),metric:text(r[sw?23:6])||'Unspecified',quantity:numeric(r[sw?24:17]),term:text(r[sw?26:7]),licenseLevel:text(r[sw?25:28]),licenseType:text(r[sw?63:27]),agreement:sw?text(r[8]):'',
          purchase:sw&&!cloud&&!technologySub?numeric(r[36]):null,support:sw&&!cloud&&!technologySub?numeric(r[40]):null,subscription:cloud||technologySub?numeric(r[40]):null,hardware:!sw?numeric(r[55]):null,
          start:date(r[sw?30:32]),end:date(r[sw?31:33]),orderDate:date(r[sw?28:21]),order:text(r[sw?27:19]),contract:text(r[sw?32:53])||(cloud?text(r[47]):''),csi:text(r[sw?34:52]),instance:text(r[sw?35:51]),subId:cloud?text(r[44]):'',plan:cloud?text(r[45]):'',operation:cloud?text(r[61]):'',pricing:cloud?text(r[68]):'',
          originalPurchase:sw&&!cloud?numeric(r[37]):null,purchaseCurrency:sw?text(r[42]):'',originalAnnual:sw?numeric(r[41]):null,supportCurrency:sw?text(r[43]):'',hwPurchase:!sw?(r[29]==null||String(r[29]).trim()===''?0:numeric(r[29])):null,hwPurchaseSource:!sw?numeric(r[29]):null,hwPurchaseMissing:!sw&&numeric(r[29])===null,hwPurchaseAssumedZero:!sw&&(r[29]==null||String(r[29]).trim()===''),hwOrderCurrency:!sw?text(r[62]):'',hwSupportCurrency:!sw&&numeric(r[55])!==null?'USD':'',flags:[]};
        item.annualSupport=sw?item.support:item.hardware;
        item.productGroup=sw?(item.family||item.segment):hardwareGroup(item.product);
        const entitlement=licenseEntitlement(item);if(entitlement.issue)item.flags.push(entitlement.issue);
        if(entitlement.kind!=='regular'&&!item.order)item.flags.push('ULA order number missing: source rows kept separate');
        if(item.country==='Unassigned')item.flags.push('Country missing');
        if(!item.contract)item.flags.push('Contract number missing');
        if(item.contract.includes(';'))item.flags.push('Multiple contract IDs: fee allocation needed');
        if(!item.end)item.flags.push('End date missing');
        if((config.reviewEntities||[]).some(name=>name.toLowerCase()===item.entity.toLowerCase()))item.flags.push('Entity scope to confirm');
        if(cloud&&item.pricing==='Pay As You Go'&&item.subscription===0)item.flags.push('PAYG: no annual fee recorded');
        if(!sw&&!item.hwSupportCurrency&&!item.hwOrderCurrency)item.flags.push('Hardware purchase currency missing');
        if(!sw&&item.hwSupportCurrency)item.flags.push('Hardware purchase currency: shared support-currency preference');
        if(item.hwPurchaseMissing)item.flags.push(item.hwPurchaseAssumedZero?'Hardware purchase source blank: calculated as zero under shared reporting policy':'Hardware purchase amount invalid or missing');
        if(!sw)item.flags.push('Hardware support treated as annual under shared reporting policy');
        if(cloud&&/Unclassified/.test(segment))item.flags.push('Cloud classification to confirm');
        result.push(item);
      });
    }
    const versions=new Map();
    for(const r of result.filter(r=>r.kind==='Subscription')){
      const key=JSON.stringify([r.subId,r.plan,r.part,r.start,r.end,r.quantity]);
      if(!versions.has(key))versions.set(key,[]);versions.get(key).push(r);
    }
    for(const rs of versions.values())if(rs.length>1)rs.forEach(r=>r.flags.push('Subscription versions: possible overlap'));
    const acquisitions=new Map();
    for(const r of result.filter(r=>r.purchase>0&&r.order)){
      const key=JSON.stringify([r.entity,r.order,r.part,r.metric,r.purchase]);
      if(!acquisitions.has(key))acquisitions.set(key,[]);acquisitions.get(key).push(r);
    }
    for(const rs of acquisitions.values())if(rs.length>1)rs.forEach(r=>r.flags.push('Repeated acquisition amount: allocation review'));
    return typeof DashboardExtension!=='undefined'&&DashboardExtension.transformRecords?DashboardExtension.transformRecords(result,{source,config,options}):result;
  }
  function total(rs,key){if(rs.some(r=>r._reportingCurrency&&Number.isNaN(r[key])))return NaN;const vals=rs.map(r=>r[key]).filter(v=>numeric(v)!==null);return vals.length?vals.reduce((a,b)=>a+b,0):null;}
  function aggregate(rs){const annualSupport=total(rs,'annualSupport'),subscription=total(rs,'subscription');return {purchase:total(rs,'purchase'),support:total(rs,'support'),annualSupport,subscription,hardware:total(rs,'hardware'),annual:(annualSupport??0)+(subscription??0),lines:rs.length};}
  function measure(r,m){return m==='annual'?(r.annualSupport??r.subscription):r[m];}
  function group(rs,key){const g=new Map();for(const r of rs){const k=typeof key==='function'?key(r):r[key];if(!g.has(k))g.set(k,[]);g.get(k).push(r);}return [...g].map(([name,rows])=>({name,rows,...aggregate(rows)}));}
  function purchasingRanking(rs,metric){
    const rank=(rows,key)=>group(rows,key).sort((a,b)=>(b[metric]||0)-(a[metric]||0)||a.name.localeCompare(b.name));
    return {total:aggregate(rs)[metric],countries:rank(rs,'country').map(g=>({...g,entities:rank(g.rows,'entity')})),entities:rank(rs,'entity')};
  }
  function daysUntil(r,asof){return r.end?Math.round((Date.parse(r.end)-Date.parse(asof))/day):null;}
  function renewalWindow(r,asof){const d=daysUntil(r,asof);return d===null?'Missing date':d<0?'Past end date':d<=90?'Next 90 days':d<=180?'Days 91–180':d<=365?'Days 181–365':'Beyond 365 days';}
  function renewals(rs){return group(rs,r=>JSON.stringify([r.contract||r.id,r.end||'Unknown'])).map(g=>({...g,contract:g.rows[0].contract,end:g.rows[0].end,entities:[...new Set(g.rows.map(r=>r.entity))],countries:[...new Set(g.rows.map(r=>r.country))],unidentified:!g.rows[0].contract,ambiguous:g.rows[0].contract.includes(';')})).sort((a,b)=>(a.end||'9999').localeCompare(b.end||'9999'));}
  function monthsBefore(asof,months){const d=new Date(asof+'T00:00:00Z'),dayOfMonth=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-Number(months));const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(dayOfMonth,last));return d.toISOString().slice(0,10);}
  function recent(rs,months,asof){const from=monthsBefore(asof,months);return rs.filter(r=>r.orderDate&&r.orderDate>=from&&r.orderDate<=asof);}
  function select(rs,state){return rs.filter(r=>(!state.environment||r.environment===state.environment)&&(!state.financial||measure(r,state.financial)!==null)&&(!state.area||r.area===state.area)&&(!state.country||r.country===state.country)&&(!state.entity||r.entity===state.entity)&&(!state.segment||r.segment===state.segment)&&(!state.window||renewalWindow(r,state.asof)===state.window)&&(!state.month||r.end.slice(0,7)===state.month)&&(!state.contract||r.contract===state.contract)&&(!state.flag||r.flags.includes(state.flag))&&(!state.query||[r.id,r.product,r.entity,r.country,r.order,r.contract,r.csi,r.subId,r.part].join(' ').toLowerCase().includes(state.query.toLowerCase())));}
  function entityRegister(allRows,{mode='active',query=''}={}){
    const search=query.trim().toLowerCase();
    return group(allRows,'entity').map(g=>{
      const active=g.rows.filter(r=>r.status==='Active');
      const countries=[...new Set((mode==='all'?g.rows:active).map(r=>r.country))].sort();
      const support=active.filter(r=>r.kind==='Hardware'||r.kind==='Software licence');
      const subscriptions=active.filter(r=>r.kind==='Subscription'||r.kind==='Technology subscription');
      return {name:g.name,rows:g.rows,countries,parties:[...new Set(g.rows.map(r=>r.party).filter(Boolean))].sort(),portfolios:areas.filter(a=>active.some(r=>r.area===a)),active:active.length,support:support.length,subscriptions:subscriptions.length,other:g.rows.length-active.length,total:g.rows.length,review:g.rows.some(r=>r.flags.includes('Entity scope to confirm'))};
    }).filter(g=>(mode==='all'||g.active>0)&&(!search||[g.name,...g.countries,...g.parties].join(' ').toLowerCase().includes(search))).sort((a,b)=>a.name.localeCompare(b.name));
  }
  function recentGroups(rs){
    const active=rs.filter(r=>r.status==='Active');
    return areas.map(area=>{
      const rows=active.filter(r=>r.area===area);
      const groups=group(rows,r=>JSON.stringify([r.segment,r.productGroup])).sort((a,b)=>a.name.localeCompare(b.name)).map(g=>({
        name:[g.rows[0].segment,g.rows[0].productGroup].filter((value,index,values)=>value&&values.findIndex(v=>v?.toLowerCase()===value.toLowerCase())===index).join(' / '),rows:g.rows,
        products:group(g.rows,r=>JSON.stringify([r.product,r.part,r.metric,r.term])).sort((a,b)=>a.name.localeCompare(b.name)).map(p=>({name:p.rows[0].product,part:p.rows[0].part,metric:p.rows[0].metric,term:p.rows[0].term,rows:[...p.rows].sort((a,b)=>(b.orderDate||'').localeCompare(a.orderDate||'')||a.id.localeCompare(b.id))}))
      }));
      return {name:area,rows,groups};
    }).filter(g=>g.rows.length);
  }
  function entityCountryGroups(entries){
    const countries=[...new Set(entries.flatMap(e=>e.countries))].sort((a,b)=>a.localeCompare(b));
    return countries.map(country=>({country,entities:entries.filter(e=>e.countries.includes(country)).map(e=>({...e,active:e.rows.filter(r=>r.country===country&&r.status==='Active').length})).sort((a,b)=>a.name.localeCompare(b.name))}));
  }
  function convert(amount,currency,rate,rateDate){if(amount===null)return null;if(currency==='USD')return amount;if(!(Number(rate)>0)||!/^\d{4}-\d{2}-\d{2}$/.test(rateDate||''))return null;return amount*Number(rate);}
  function reportingAmount(usd,local,localCurrency,currency,rates,rateDates){
    if(numeric(usd)===null&&numeric(local)===0)return {amount:0,basis:'Source · zero amount; no FX effect'};
    const code=text(localCurrency).trim().toUpperCase(),hasLocal=numeric(local)!==null&&/^[A-Z]{3}$/.test(code);
    const fx=c=>c==='USD'?1:Number.isFinite(Number(rates[c]))&&Number(rates[c])>0&&date(rateDates[c])?Number(rates[c]):null;
    if(hasLocal&&code===currency)return {amount:local,basis:'Source · original '+code+' amount · no FX applied'};
    if(currency==='USD'&&numeric(usd)!==null)return {amount:usd,basis:'Source · Source data supplied USD'+(hasLocal&&code!=='USD'?' equivalent (source conversion from '+code+')':' amount')};
    const useUsd=numeric(usd)!==null,amount=useUsd?usd:hasLocal?local:null,from=useUsd?'USD':code,factorFrom=fx(from),factorTo=fx(currency);
    if(numeric(amount)===null)return {amount:local!==null&&local!==undefined?NaN:null,basis:'Source amount / currency unavailable'};
    if(amount===0)return {amount:0,basis:'Source · zero amount; no FX effect'};
    const basis=useUsd?(hasLocal?'Converted · Source data supplied USD equivalent of original '+code+' amount':'Converted · Source data USD fallback (local amount/currency unavailable)'):'Converted · original '+code+' amount';
    if(factorFrom===null||factorTo===null)return {amount:NaN,basis:basis+' · dated FX required'};
    return {amount:amount/factorFrom*factorTo,basis:basis+' · '+amount+' '+from+' ÷ '+factorFrom+' × '+factorTo+' = '+currency+' · rate dates '+[...new Set([from,currency])].filter(c=>c!=='USD').map(c=>c+': '+rateDates[c]).join('; ')};
  }
  const financialKeys=['purchase','support','subscription','hardware','annualSupport'];
  function sourceAmount(r,key){return r._sourceAmounts?r._sourceAmounts[key]:r[key];}
  function sourceRows(rows){return rows.map(r=>{if(!r._sourceAmounts)return r;const x={...r,...r._sourceAmounts};delete x._sourceAmounts;delete x._reportingCurrency;delete x._amountBasis;return x;});}
  function ociCommitment(r,confirmations=[]){
    if(r.area!=='OCI Universal Credits'||r.metric.trim().toUpperCase()!=='CURRENCY UNIT'||r.pricing!=='Annual'||!(numeric(r.quantity)>0))return null;
    // Quantity is a commitment, not automatically an annual fee for arbitrary terms.
    const duration=(Date.parse(r.end)-Date.parse(r.start))/day;
    if(!(duration>=350&&duration<=370))return null;
    const codes=[...new Set([r.supportCurrency,r.purchaseCurrency].map(c=>text(c).trim().toUpperCase()).filter(c=>/^[A-Z]{3}$/.test(c)))];
    const confirmed=confirmations.filter(c=>['order','subId','part','start','end'].every(k=>c[k]&&c[k]===r[k]));
    const confirmedCodes=[...new Set(confirmed.map(c=>c.currency).filter(c=>/^[A-Z]{3}$/.test(c)))];
    const currencies=[...new Set([...codes,...confirmedCodes])];
    if(currencies.length!==1)return null; // Never infer currency from country or quantity.
    return {amount:r.quantity,currency:currencies[0],basis:codes.length?'Source data local-currency field':confirmed[0].basis};
  }
  function reportingRows(rows,{currency='USD',rates={},rateDates={},creditCurrencyConfirmations=[]}={}){
    const fx=c=>c==='USD'?1:Number(rates[c])>0&&Number.isFinite(Number(rates[c]))&&date(rateDates[c])?Number(rates[c]):null;
    return sourceRows(rows).map(r=>{
      const original=Object.fromEntries(financialKeys.map(k=>[k,r[k]])),out={...r,flags:[...r.flags],_sourceAmounts:original,_reportingCurrency:currency,_amountBasis:{}};
      for(const k of financialKeys.filter(k=>k!=='annualSupport')){
        const applicable=k==='purchase'?r.kind==='Software licence':k==='support'?r.kind==='Software licence':k==='subscription'?['Subscription','Technology subscription'].includes(r.kind):false;
        const local=applicable&&r.area!=='OCI Universal Credits'?(k==='purchase'?r.originalPurchase:r.originalAnnual):null;
        const supportCode=text(r.supportCurrency).trim().toUpperCase(),purchaseCode=text(r.purchaseCurrency).trim().toUpperCase();
        const preferred=k==='purchase'&&applicable&&config.financial?.softwarePurchaseCurrency==='support'&&/^[A-Z]{3}$/.test(supportCode);
        const code=k==='purchase'?(preferred?supportCode:purchaseCode):supportCode;
        const value=reportingAmount(original[k],local,code,currency,rates,rateDates);
        if(preferred&&local!==null)value.basis+=' · Purchase currency uses support preference ('+code+'); recorded purchase currency '+(purchaseCode||'blank')+' retained';
        out[k]=value.amount;out._amountBasis[k]=value.basis;
        if(Number.isNaN(value.amount)){const flag='Currency review ('+k+'): '+value.basis;if(!out.flags.includes(flag))out.flags.push(flag);}
      }
      const native=ociCommitment(r,creditCurrencyConfirmations);
      if(native){
        out.ociLocalAmount=native.amount;out.ociLocalCurrency=native.currency;out.ociCurrencyBasis=native.basis;
        if(currency===native.currency){out.subscription=native.amount;out._amountBasis.subscription='Original OCI commitment · Quantity × CURRENCY UNIT · '+native.currency+' · '+native.basis+' No FX applied.';}
        else if(currency==='USD'&&original.subscription!==null){out.subscription=original.subscription;out._amountBasis.subscription='Source · Source data supplied USD equivalent of OCI commitment';}
        else{const from=fx(native.currency),to=fx(currency);out.subscription=from===null||to===null?NaN:native.amount/from*to;out._amountBasis.subscription='Converted OCI commitment · '+native.currency+' → '+currency+' · original amount ÷ source-currency rate × report-currency rate';}
      }else if(r.area==='OCI Universal Credits'&&r.metric.trim().toUpperCase()==='CURRENCY UNIT'&&r.pricing==='Annual'&&r.quantity>0){
        out.flags.push('OCI currency-unit commitment: currency or annual period unconfirmed; using Source data USD fee basis');
      }
      out.annualSupport=r.kind==='Hardware'?out.hardware:out.support;
      return out;
    });
  }
  function hardwarePurchaseCurrency(r){
    const support=text(r.hwSupportCurrency).trim().toUpperCase(),purchase=text(r.hwOrderCurrency).trim().toUpperCase();
    if(/^[A-Z]{3}$/.test(support))return {currency:support,basis:'Support currency preferred: '+support+' from Support Fees (USD); shared reporting policy. Recorded order currency '+(purchase||'blank')+' retained.'};
    if(/^[A-Z]{3}$/.test(purchase))return {currency:purchase,basis:'Recorded order currency '+purchase};
    return {currency:'',basis:'Support and purchase currencies unavailable'};
  }
  function hardwareInvestmentReview(rs,currency,rates={},rateDates={}){
    const rows=rs.filter(r=>r.kind==='Hardware'),issues={lines:rows.length,missingAmount:0,assumedZero:0,missingCurrency:0,missingRates:[],knownTotal:0,complete:false,total:null};
    const missing=new Set(),fx=c=>c==='USD'?1:Number.isFinite(Number(rates[c]))&&Number(rates[c])>0&&date(rateDates[c])?Number(rates[c]):null;
    for(const r of rows){
      if(r.hwPurchaseAssumedZero&&r.hwPurchase===0){issues.missingAmount++;issues.assumedZero++;continue;}
      if(r.hwPurchaseMissing||numeric(r.hwPurchase)===null){issues.missingAmount++;continue;}
      const fromCurrency=hardwarePurchaseCurrency(r).currency;
      if(!fromCurrency){issues.missingCurrency++;continue;}
      if(r.hwPurchase===0){continue;}
      if(fromCurrency===currency){issues.knownTotal+=r.hwPurchase;continue;}
      const from=fx(fromCurrency),to=fx(currency);
      if(from===null)missing.add(fromCurrency);if(to===null)missing.add(currency);
      if(from!==null&&to!==null)issues.knownTotal+=r.hwPurchase/from*to;
    }
    issues.missingRates=[...missing].sort();issues.complete=rows.length>0&&issues.missingAmount===issues.assumedZero&&!issues.missingCurrency&&!issues.missingRates.length;
    issues.total=issues.complete?issues.knownTotal:null;return issues;
  }
  function hardwareInvestment(rs,currency,rates,rateDates){return hardwareInvestmentReview(rs,currency,rates,rateDates).total;}
  function hardwareAge(r,asof){
    const d=date(r.orderDate),ref=date(asof);
    if(!d||!ref||d>ref||new Date(d+'T00:00:00Z').toISOString().slice(0,10)!==d||new Date(ref+'T00:00:00Z').toISOString().slice(0,10)!==ref)return null;
    let years=Number(ref.slice(0,4))-Number(d.slice(0,4));
    if(ref.slice(5)<d.slice(5))years--;
    return years;
  }
  function hardwareAging(rs,asof,scope='appliances',band='all',review='all'){
    const base=rs.filter(r=>r.status==='Active'&&r.kind==='Hardware'&&(scope==='all'||scope==='appliances'&&['Exadata hardware','Recovery Appliance hardware'].includes(r.segment)||r.segment===scope));
    const missing=base.filter(r=>hardwareAge(r,asof)===null),aged=base.filter(r=>hardwareAge(r,asof)>=5);
    const bands=[{key:'5',label:'5 to <6 years',rows:aged.filter(r=>hardwareAge(r,asof)===5)},{key:'6',label:'6 to <7 years',rows:aged.filter(r=>hardwareAge(r,asof)===6)},{key:'7',label:'7 years or older',rows:aged.filter(r=>hardwareAge(r,asof)>=7)}];
    let selected=band==='missing'?missing:band==='all'?aged:(bands.find(b=>b.key===band)?.rows||[]);
    if(review==='past')selected=selected.filter(r=>r.end&&r.end<asof);
    if(review==='due')selected=selected.filter(r=>{const d=daysUntil(r,asof);return d!==null&&d>=0&&d<=365;});
    if(review==='missing')selected=selected.filter(r=>!r.end);
    return {base,missing,aged,bands,selected:[...selected].sort((a,b)=>(a.orderDate||'9999').localeCompare(b.orderDate||'9999')||a.id.localeCompare(b.id))};
  }
  return {configure,licenseEntitlement,hardwarePurchaseCurrency,hardwareInvestmentReview,areas,numeric,date,normalize,aggregate,total,group,measure,renewals,renewalWindow,daysUntil,select,convert,monthsBefore,recent,hardwareGroup,hardwareInvestment,purchasingRanking,entityRegister,recentGroups,entityCountryGroups,hardwareAge,hardwareAging,reportingAmount,ociCommitment,reportingRows,sourceRows,sourceAmount};
})();
if(typeof module!=='undefined')module.exports=Estate;
