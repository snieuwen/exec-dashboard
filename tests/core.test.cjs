const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const E=require('../src/model.js'),R=require('../src/rules.js'),{build}=require('../scripts/build.cjs'),{fixture}=require('./helpers.cjs');
test('normalization selects active rows and keeps annual measures separate from purchases',()=>{
 E.configure({financial:{hardwareSupportAnnual:true}});const rows=E.normalize(fixture()),a=E.aggregate(rows);
 assert.equal(rows.length,3);assert.equal(a.purchase,1000);assert.equal(a.support,200);assert.equal(a.subscription,300);assert.equal(a.hardware,100);assert.equal(a.annual,600);
 assert.equal(E.normalize(fixture(),{includeInactive:true}).length,4);
});
test('shared hardware policy applies without customer overrides and defeats legacy settings',()=>{
 for(const config of [{},{financial:{hardwareSupportAnnual:false,hardwarePurchaseCurrency:'order'}}]){
  E.configure(config);const rows=E.normalize(fixture()),hardware=rows.find(r=>r.kind==='Hardware');
  assert.equal(hardware.hardware,100);assert.equal(E.aggregate(rows).annual,600);
  assert.equal(E.hardwarePurchaseCurrency(hardware).currency,'USD');
  assert.equal(hardware.hwOrderCurrency,'EUR');assert.equal(E.hardwareInvestment([hardware],'USD'),500);
  assert(hardware.flags.some(f=>f.includes('shared reporting policy')));
 }
});
test('blank hardware purchases calculate as zero while raw blanks and missing flags survive',()=>{
 E.configure({});for(const blank of [null,'','   ']){
  const input=fixture();input['hw-details'][1][29]=blank;
  const before=JSON.stringify(input),hw=E.normalize(input).filter(r=>r.kind==='Hardware');
  assert.equal(hw[0].hwPurchase,0);assert.equal(hw[0].hwPurchaseSource,null);
  assert.equal(hw[0].hwPurchaseMissing,true);assert.equal(hw[0].hwPurchaseAssumedZero,true);
  const review=E.hardwareInvestmentReview(hw,'EUR');
  assert.equal(review.total,0);assert.equal(review.complete,true);assert.equal(review.missingAmount,1);assert.equal(review.assumedZero,1);
  assert.equal(JSON.stringify(input),before);
 }
});
test('recorded zeros, invalid values, currency fallback and dated conversion stay distinct',()=>{
 E.configure({});const input=fixture();input['hw-details'][1][29]=0;
 let hw=E.normalize(input).filter(r=>r.kind==='Hardware');assert.equal(hw[0].hwPurchaseAssumedZero,false);assert.equal(hw[0].hwPurchaseMissing,false);
 input['hw-details'][1][29]='invalid';hw=E.normalize(input).filter(r=>r.kind==='Hardware');assert.equal(E.hardwareInvestmentReview(hw,'USD').complete,false);
 input['hw-details'][1][29]=500;input['hw-details'][1][55]=null;
 hw=E.normalize(input).filter(r=>r.kind==='Hardware');assert.equal(E.hardwarePurchaseCurrency(hw[0]).currency,'EUR');assert.equal(E.hardwareInvestment(hw,'EUR'),500);assert.equal(E.hardwareInvestment(hw,'USD'),null);
 assert.equal(E.hardwareInvestment(hw,'USD',{EUR:.8},{EUR:'2026-01-01'}),625);
 input['hw-details'][1][55]=100;hw=E.normalize(input).filter(r=>r.kind==='Hardware');assert.equal(E.hardwareInvestment(hw,'EUR'),null);assert.equal(E.hardwareInvestment(hw,'EUR',{EUR:.8},{EUR:'2026-01-01'}),400);
});

test('dated FX is mandatory; same-currency source values do not require conversion',()=>{
 assert.equal(E.reportingAmount(100,80,'EUR','EUR',{},{}).amount,80);
 assert(Number.isNaN(E.reportingAmount(100,null,'','EUR',{EUR:.8},{}).amount));
 assert.equal(E.reportingAmount(100,null,'','EUR',{EUR:.8},{EUR:'2026-01-01'}).amount,80);
});
test('cleansing preserves original row lineage and does not mutate input',()=>{
 const input=fixture(),before=JSON.stringify(input),prepared=R.prepare(input,{cleansing:[{sheet:'sw-details',action:'exclude',column:input['sw-details'][0][11],values:['Inactive']}]});
 assert.equal(prepared.source['sw-details'].length,3);assert.equal(prepared.origins['sw-details'][1].row,3);assert.equal(prepared.counts['sw-details'].excluded,1);assert.equal(JSON.stringify(input),before);
 assert.throws(()=>R.prepare(input,{cleansing:[{action:'trim',column:'Unknown'}]}),/Unknown cleansing column/);
});
test('header-only empty source is supported and bad column layouts fail',()=>{
 E.configure({});const input=fixture();for(const name of Object.keys(input))input[name]=input[name].slice(0,1);assert.deepEqual(E.normalize(input),[]);
 input['sw-details'][0]=['wrong'];assert.throws(()=>E.normalize(input),/columns differ/);
});
test('renewal windows, recent purchases and hardware age use supplied reference date',()=>{
 E.configure({});const rows=E.normalize(fixture()),hw=rows.find(r=>r.kind==='Hardware');
 assert.equal(E.hardwareAge(hw,'2026-01-01'),8);assert.equal(E.renewalWindow(rows[0],'2026-12-01'),'Next 90 days');
 assert.equal(E.recent(rows,1,'2026-01-31').length,2);assert.equal(E.renewals(rows).length,3);
});
test('repeated builds are byte-identical and empty distribution contains no records',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'exec-dashboard-test-')),output=path.join(tmp,'dashboard.html');
 try{const first=build({output}),bytes=fs.readFileSync(output);const second=build({output});assert.equal(first.buildId,second.buildId);assert.deepEqual(bytes,fs.readFileSync(output));
  const html=bytes.toString();assert.equal(JSON.parse(html.match(/id="report-source" type="application\/json">(.*?)<\/script>/s)[1])['sw-details'].length,1);assert(!html.includes('TEST-ORDER-'));assert(!html.includes('__MODEL__'));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('source builds require snapshot date and escape script-closing text',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'exec-dashboard-test-'));
 try{const source=path.join(tmp,'source.json'),input=fixture();input['sw-details'][1][4]='</script><script>throw Error("unexpected")</script>';fs.writeFileSync(source,JSON.stringify(input));assert.throws(()=>build({source,output:path.join(tmp,'x.html')}),/snapshot/);build({source,snapshot:'2026-01-31',output:path.join(tmp,'x.html')});const html=fs.readFileSync(path.join(tmp,'x.html'),'utf8');assert(!html.includes('</script><script>throw Error("unexpected")'));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});


test('mandatory inactive cleansing covers both sheets, ignores case/whitespace and cannot be overridden',()=>{
 const input=fixture(),sw=input['sw-details'],hw=input['hw-details'];
 sw[3][11]='  iNaCtIvE  ';hw.push([...hw[1]]);hw[2][31]=' INACTIVE ';hw[2][0]='Historical hardware entity';
 sw.push([...sw[1]]);sw[4][4]='Later active entity';
 const before=JSON.stringify(input);
 const prepared=R.prepare(input,{cleansing:[{sheet:'sw-details',action:'replace',column:'Support Status',values:['inactive'],value:'Active'}]});
 assert.equal(prepared.counts['sw-details'].input,4);assert.equal(prepared.counts['sw-details'].retained,3);assert.equal(prepared.counts['sw-details'].excludedInactive,1);
 assert.equal(prepared.counts['hw-details'].excludedInactive,1);assert.equal(prepared.source['hw-details'].length,2);
 assert.deepEqual(prepared.origins['sw-details'].map(x=>x.row),[2,3,5]);
 assert.equal(JSON.stringify(input),before);
 const again=R.prepare(prepared.source);assert.deepEqual(again.source,prepared.source);assert.equal(again.counts['sw-details'].excludedInactive,0);
 const defaults=R.prepare(input);assert.deepEqual(defaults.source,prepared.source);
});

test('cleansing also removes rows made inactive by a customer rule and preserves unrelated statuses',()=>{
 const input=fixture();input['sw-details'][1][11]='Pending';
 const prepared=R.prepare(input,{cleansing:[{sheet:'sw-details',action:'replace',column:'Support Status',values:['Active'],value:'Inactive'}]});
 assert.equal(prepared.source['sw-details'].length,2);assert.equal(prepared.source['sw-details'][1][11],'Pending');assert.equal(prepared.counts['sw-details'].excludedInactive,2);
});

test('populated builds embed only cleansed rows and retain original evidence pointers',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'exec-dashboard-cleanse-'));
 try{
  const input=fixture(),source=path.join(tmp,'input.json'),output=path.join(tmp,'report.html');
  fs.writeFileSync(source,JSON.stringify(input));const result=build({source,snapshot:'2026-01-31',output});
  const html=fs.readFileSync(output,'utf8');
  const embedded=JSON.parse(html.match(/id="report-source" type="application\/json">(.*?)<\/script>/s)[1]);
  assert.equal(embedded['sw-details'].length,3);assert(!JSON.stringify(embedded).includes('Other Example Entity'));
  assert.equal(result.sourceRecords['sw-details'].excludedInactive,1);assert.equal(result.sourceRecords['sw-details'].retained,2);
  assert.equal(JSON.stringify(input),fs.readFileSync(source,'utf8'));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});


test('ULA interpretation uses License Level, preserves source quantities and checks malformed limits',()=>{
 const {ulaFixture}=require('./helpers.cjs'),input=ulaFixture(),before=JSON.stringify(input),rows=E.normalize(input),q=require('../src/report-quantities.js');
 const unlimited=rows.find(r=>r.order==='TEST-ULA-ORDER'),capped=rows.find(r=>r.order==='TEST-CAPPED-ORDER'),regular=rows.find(r=>r.order==='TEST-REGULAR-ONE');
 assert.equal(unlimited.licenseLevel,'UNLIMITED LICENSE AGREEMENT (ULA)');assert.equal(unlimited.quantity,1);
 assert.equal(E.licenseEntitlement(unlimited).display,'∞ Unlimited');assert.equal(E.licenseEntitlement(capped).label,'Capped ULA');assert.equal(E.licenseEntitlement(capped).limit,250);
 assert.equal(E.licenseEntitlement(regular).kind,'regular');assert.equal(q.summary([regular]).quantity,1);
 assert.equal(q.summary([unlimited,unlimited]).quantity,null);assert.equal(q.summary([capped,capped]).quantity,null);
 assert.equal(E.licenseEntitlement({...regular,licenseType:'ULA'}).kind,'regular');
 assert.equal(E.licenseEntitlement({...capped,quantity:1}).display,'Max. 1');
 for(const quantity of [null,0,-1])assert(E.licenseEntitlement({...capped,quantity}).issue);
 assert(E.licenseEntitlement({...unlimited,quantity:2}).issue);
 assert.equal(E.licenseEntitlement({...unlimited,licenseLevel:'ULA SPECIAL'}).kind,'review');
 assert.equal(E.licenseEntitlement({...unlimited,licenseLevel:'NO ULA'}).kind,'regular');
 assert.equal(E.licenseEntitlement({...unlimited,sheet:'hw-details'}).kind,'regular');
 assert.equal(JSON.stringify(input),before);
});

test('quantity renderer separates ULA orders above regular quantities without changing financial rendering',()=>{
 const q=require('../src/report-quantities.js'),{ulaFixture}=require('./helpers.cjs');const rows=E.normalize(ulaFixture()),view=q.create();
 let html=view.render(rows,{areas:E.areas});
 assert(html.includes('aria-label="ULA products"'));assert(html.indexOf('ula-quantity-table')<html.indexOf('regular-quantity-table'));
 assert.equal((html.match(/data-ula-level="root"/g)||[]).length,1);assert.equal((html.match(/data-ula-level="order"/g)||[]).length,0);
 assert(!html.includes('ULA Capped'));assert(!html.includes('Max. 500'));
 const button={dataset:{quantityExpand:'all'}};view.action(button);html=view.render(rows,{areas:E.areas});
 assert(html.includes('∞ Unlimited'));assert(html.includes('Max. 250'));assert(html.includes('Max. 100'));
 const ula=html.split('class="data-table table pivot-table quantity-table ula-quantity-table"')[1].split('</table>')[0];
 assert(!ula.includes('Example single licence'));
 const normal=html.split('regular-quantity-table')[1];assert(!normal.includes('Example unlimited database'));assert(!normal.includes('Example capped database'));
 const financial=view.render(rows,{areas:E.areas,financial:{heads:['Amount'],cells:()=>'<td>0</td>'}});assert(!financial.includes('ula-quantity-table'));assert(financial.includes('Example unlimited database'));
 const onlyRegular=q.create().render(rows.filter(r=>!q.isUla(r)),{areas:E.areas});assert(!onlyRegular.includes('ula-quantity-table'));
});

test('ULA renderer keeps unknown orders, unlike metrics and differing capped quantities separate',()=>{
 const q=require('../src/report-quantities.js'),base=E.normalize(require('./helpers.cjs').ulaFixture()).find(r=>r.order==='TEST-CAPPED-ORDER');
 const rows=[{...base,id:'a',order:'',quantity:100},{...base,id:'b',order:'',quantity:200},{...base,id:'c',order:'ONE',quantity:100},{...base,id:'d',order:'ONE',quantity:200},{...base,id:'e',order:'ONE',metric:'Named User Plus',quantity:50}];
 const view=q.create();view.action({dataset:{quantityExpand:'all'}});const html=view.render(rows,{areas:E.areas});
 assert.equal((html.match(/data-ula-level="order"/g)||[]).length,3);assert(html.includes('Max. 100 / Max. 200'));assert(html.includes('Named User Plus'));assert(!html.includes('Max. 300'));
});

test('ULA starts collapsed and expands one level with terminal products',()=>{
 const q=require('../src/report-quantities.js'),all=E.normalize(require('./helpers.cjs').ulaFixture());
 for(const rows of [all,all.filter(r=>r.order==='TEST-ULA-ORDER')]){
  const view=q.create(),render=()=>view.render(rows,{areas:E.areas}),root=JSON.stringify(['ula']);
  const click=(key,open)=>view.action({dataset:{quantityNode:key,quantityDepth:'0'},getAttribute:()=>String(open)});
  let html=render();assert(!html.includes('data-ula-level="order"'));assert(!html.includes('ula-note'));
  click(root,false);html=render();assert(html.includes('data-ula-level="order"'));assert(!html.includes('data-ula-level="product"'));
  const first=rows.find(q.isUla),order=JSON.stringify(['ula',JSON.stringify([first.order,first.entity])]);
  click(order,false);html=render();assert(html.includes('data-ula-level="product"'));
  const table=html.split('ula-quantity-table')[1].split('</table>')[0];assert(!table.includes('data-record'));assert(!table.includes('data-ula-level="line"'));
  for(const product of table.matchAll(/<tr[^>]*data-ula-level="product".*?<\/tr>/gs))assert(!product[0].includes('<button'));
  click(root,true);click(root,false);assert(!render().includes('data-ula-level="product"'));
  view.action({dataset:{quantityExpand:'all'}});assert(render().includes('data-ula-level="product"'));
  click(root,true);click(root,false);assert(!render().includes('data-ula-level="product"'));
  view.reset();assert(!render().includes('data-ula-level="order"'));
 }
});
