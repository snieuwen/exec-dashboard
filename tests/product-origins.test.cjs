const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../src/model.js');
const r=(id,extra={})=>({id,kind:'Software licence',product:'Example product A',part:'PART-A',metric:'Processor',term:'Perpetual',order:'ORDER-A',csi:'CSI-A',contract:'CONTRACT-A',entity:'Example entity',country:'Germany',support:90,annualSupport:90,subscription:null,hardware:null,end:'2027-01-31',...extra});
test('origins selects groups through anchors but retains other products and countries in denominator',()=>{
 const rows=[r('1'),r('2',{product:'Example product B',country:'France',entity:'Another entity',support:10,annualSupport:10,csi:'CSI-B',contract:'CONTRACT-B'}),r('3',{order:'ORDER-B',csi:'CSI-C',contract:'CONTRACT-C'})],products=[E.originProductKey(rows[0])];
 const a=E.productOrigins(rows,{products,anchorIds:['1']});assert.equal(a.groups.length,1);const g=a.groups[0];assert.equal(g.rows.length,2);assert.equal(g.total,100);assert.equal(g.selectedFee,90);assert.equal(g.otherFee,10);assert.equal(g.share,.9);assert.equal(g.countries.length,2);
 assert.equal(E.productOrigins(rows,{products,anchorIds:['1'],minShare:95}).groups.length,0);
 for(const groupBy of ['csi','contract']){const b=E.productOrigins(rows,{products,anchorIds:['1'],groupBy}).groups[0];assert.equal(b.rows.length,1);assert.equal(b.related.length,1);assert.equal(b.related[0].id,'2');}
});
test('missing and multi identifiers never collapse unknown rows or allocate fees',()=>{
 const rows=[r('1',{order:''}),r('2',{order:''}),r('3',{order:'ORDER-A;ORDER-B'})];const groups=E.productOrigins(rows).groups;
 assert.equal(groups.length,3);assert(groups.every(g=>g.issues.length));assert.equal(groups.find(g=>g.identifier==='ORDER-A;ORDER-B').total,90);
});
test('unknown FX/fees, zero and negative values do not produce misleading composition percentages',()=>{
 for(const fee of [null,NaN,-10]){const rows=[r('1'),r('2',{product:'Other',support:fee})];const a=E.productOrigins(rows,{products:[E.originProductKey(rows[0])],minShare:100});assert.equal(a.groups.length,1);assert.equal(a.groups[0].share,null);}
 const z=r('0',{support:0});assert.equal(E.productOrigins([z],{products:[E.originProductKey(z)]}).groups[0].share,null);
});
test('financial scopes stay separate while complete group evidence retains other portfolios',()=>{
 const rows=[r('1'),r('2',{kind:'Hardware',support:null,hardware:50,annualSupport:50}),r('3',{kind:'Subscription',support:null,annualSupport:null,subscription:400})];
 for(const [scope,total]of [['software',90],['hardware',50],['subscriptions',400]]){const a=E.productOrigins(rows,{scope});assert.equal(a.groups[0].total,total);assert.equal(a.groups[0].rows.length,3);assert.equal(a.groups[0].outsideScope.length,2);}
 assert.equal(E.productOrigins(rows,{products:[E.originProductKey(rows[0])]}).groups[0].share,1);
});
