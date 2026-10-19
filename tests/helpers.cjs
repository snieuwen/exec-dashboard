const headers=require('../schemas/eix-columns.json');
function fixture(){
 const sw=(values)=>{const row=Array(headers['sw-details'].length).fill(null);for(const [column,value]of Object.entries(values))row[Number(column)]=value;return row;};
 const hw=(values)=>{const row=Array(headers['hw-details'].length).fill(null);for(const [column,value]of Object.entries(values))row[Number(column)]=value;return row;};
 return {
  'sw-details':[headers['sw-details'],
   sw({4:'Example Entity',10:'Germany',11:'Active',12:'Database',16:'Database',18:'Example database',22:'TEST-PART-A',23:'Processor',24:2,26:'Perpetual',27:'TEST-ORDER-A',28:{date:'2026-01-10'},30:{date:'2026-01-01'},31:{date:'2026-12-31'},32:'TEST-CONTRACT-A',36:1000,37:800,40:200,41:160,42:'EUR',43:'EUR'}),
   sw({4:'Example Entity',10:'Germany',11:'Active',12:'Cloud',14:'Example application',16:'Cloud service',18:'Example subscription',23:'Hosted User',24:10,26:'Annual',27:'TEST-ORDER-B',28:{date:'2026-01-11'},30:{date:'2026-01-01'},31:{date:'2026-12-31'},32:'TEST-CONTRACT-B',40:300,41:240,43:'EUR'}),
   sw({4:'Other Example Entity',10:'Netherlands',11:'Inactive',12:'Database',18:'Inactive example',40:9999})],
  'hw-details':[headers['hw-details'],
   hw({0:'Example Entity',1:'Germany',4:'Example Exadata storage server',5:'TEST-PART-H',6:'Component',7:'Perpetual',11:'Exadata Database Machine',17:1,19:'TEST-ORDER-H',21:{date:'2018-01-01'},29:500,31:'Active',32:{date:'2026-01-01'},33:{date:'2026-12-31'},52:'TEST-CSI',53:'TEST-CONTRACT-H',55:100,62:'EUR'})]
 };
}
// Minimal stored ZIP workbook, generated only during tests. No external data files.
function workbook(source){
 const xml=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const column=i=>{let value='';for(i++;i;i=Math.floor((i-1)/26))value=String.fromCharCode(65+(i-1)%26)+value;return value;};
 const names=Object.keys(source),entries={};
 entries['[Content_Types].xml']='<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>';
 entries['xl/workbook.xml']='<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+names.map((s,i)=>'<sheet name="'+s+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>';
 entries['xl/_rels/workbook.xml.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+names.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Target="worksheets/sheet'+(i+1)+'.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/>').join('')+'</Relationships>';
 names.forEach((s,i)=>{entries['xl/worksheets/sheet'+(i+1)+'.xml']='<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+source[s].map((row,ri)=>'<row r="'+(ri+1)+'">'+row.map((value,ci)=>{const ref=column(ci)+(ri+1);return value==null?'':typeof value==='number'?'<c r="'+ref+'"><v>'+value+'</v></c>':value.date?'<c r="'+ref+'" t="d"><v>'+value.date+'</v></c>':'<c r="'+ref+'" t="inlineStr"><is><t>'+xml(value)+'</t></is></c>';}).join('')+'</row>').join('')+'</sheetData></worksheet>';});
 const crc=buffer=>{let n=0xffffffff;for(const byte of buffer){n^=byte;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;};
 const locals=[],central=[];let offset=0;
 for(const [name,text]of Object.entries(entries)){const n=Buffer.from(name),data=Buffer.from(text),h=Buffer.alloc(30),c=Buffer.alloc(46),checksum=crc(data);h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt32LE(checksum,14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(n.length,26);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt32LE(checksum,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);locals.push(h,n,data);central.push(c,n);offset+=h.length+n.length+data.length;}
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(names.length+3,8);end.writeUInt16LE(names.length+3,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,directory,end]);
}
module.exports={fixture,workbook};
