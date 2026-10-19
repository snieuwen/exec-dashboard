const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const E=require('../src/model.js'),R=require('../src/rules.js'),{build}=require('../scripts/build.cjs'),{fixture}=require('./helpers.cjs');
test('normalization selects active rows and keeps annual measures separate from purchases',()=>{
 E.configure({financial:{hardwareSupportAnnual:true}});const rows=E.normalize(fixture()),a=E.aggregate(rows);
 assert.equal(rows.length,3);assert.equal(a.purchase,1000);assert.equal(a.support,200);assert.equal(a.subscription,300);assert.equal(a.hardware,100);assert.equal(a.annual,600);
 assert.equal(E.normalize(fixture(),{includeInactive:true}).length,4);
});
test('generic defaults require hardware annual confirmation and retain recorded purchase currency',()=>{
 E.configure({});const rows=E.normalize(fixture()),hardware=rows.find(r=>r.kind==='Hardware');
 assert.equal(hardware.hardware,null);assert.equal(E.aggregate(rows).annual,500);assert.equal(E.hardwarePurchaseCurrency(hardware).currency,'EUR');
 assert(hardware.flags.some(f=>f.includes('annual basis unconfirmed')));
 E.configure({financial:{hardwarePurchaseCurrency:'support'}});assert.equal(E.hardwarePurchaseCurrency(hardware).currency,'USD');
});
test('blank hardware purchase is unavailable rather than zero and blocks complete total',()=>{
 E.configure({});const input=fixture();input['hw-details'][1][29]=null;const hardware=E.normalize(input).filter(r=>r.kind==='Hardware');
 assert.equal(hardware[0].hwPurchase,null);assert.equal(E.hardwareInvestment(hardware,'EUR',{},{}),null);assert.equal(E.hardwareInvestmentReview(hardware,'EUR').missingAmount,1);
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
