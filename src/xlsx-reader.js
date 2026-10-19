const EixXlsx = (()=>{
 const decoder=new TextDecoder();
 async function read(buffer){
  if(buffer.byteLength>50*1024*1024)throw Error('This draft accepts workbooks up to 50 MB.');
  const bytes=new Uint8Array(buffer),v=new DataView(buffer);let eocd=-1;
  for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65558);p--)if(v.getUint32(p,true)===0x06054b50){eocd=p;break;}
  if(eocd<0)throw Error('This is not an unencrypted .xlsx workbook.');
  const count=v.getUint16(eocd+10,true);let pos=v.getUint32(eocd+16,true);const entries=new Map();
  for(let i=0;i<count;i++){
   if(v.getUint32(pos,true)!==0x02014b50)throw Error('Invalid workbook archive.');
   const method=v.getUint16(pos+10,true),compressed=v.getUint32(pos+20,true),size=v.getUint32(pos+24,true),nl=v.getUint16(pos+28,true),el=v.getUint16(pos+30,true),cl=v.getUint16(pos+32,true),offset=v.getUint32(pos+42,true),name=decoder.decode(bytes.slice(pos+46,pos+46+nl));
   entries.set(name,{method,compressed,size,offset});pos+=46+nl+el+cl;
  }
  let expanded=0;
  async function part(name,optional=false){
   const e=entries.get(name);if(!e){if(optional)return '';throw Error('Missing workbook part: '+name);}
   expanded+=e.size;if(e.size>100*1024*1024||expanded>220*1024*1024)throw Error('Workbook expands beyond the supported size.');
   const p=e.offset+30+v.getUint16(e.offset+26,true)+v.getUint16(e.offset+28,true),compressed=bytes.slice(p,p+e.compressed);
   if(e.method===0)return decoder.decode(compressed);
   if(e.method!==8)throw Error('Unsupported workbook compression.');
   const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
   return await new Response(stream).text();
  }
  const xml=s=>{const doc=new DOMParser().parseFromString(s,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Invalid workbook XML.');return doc;};
  const tags=(doc,n)=>Array.from(doc.getElementsByTagNameNS('*',n));
  const path=(base,target)=>{if(target.startsWith('/'))return target.slice(1);const a=(base+'/'+target).split('/'),out=[];for(const x of a){if(x==='..')out.pop();else if(x&&x!=='.')out.push(x);}return out.join('/');};
  const workbook=xml(await part('xl/workbook.xml'));if(tags(workbook,'workbookPr')[0]?.getAttribute('date1904')==='1')throw Error('This draft expects the standard Excel 1900 date system.');
  const rels=new Map(tags(xml(await part('xl/_rels/workbook.xml.rels')),'Relationship').map(n=>[n.getAttribute('Id'),path('xl',n.getAttribute('Target'))]));
  const sharedText=await part('xl/sharedStrings.xml',true),shared=sharedText?tags(xml(sharedText),'si').map(n=>tags(n,'t').map(t=>t.textContent).join('')):[];
  const output={};
  for(const s of tags(workbook,'sheet')){
   const name=s.getAttribute('name');if(!['sw-details','hw-details'].includes(name))continue;
   const rid=s.getAttribute('r:id')||s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'),doc=xml(await part(rels.get(rid))),matrix=[];
   for(const row of tags(doc,'row')){
    const ri=Number(row.getAttribute('r'))-1;if(ri>200000)throw Error('Too many source rows.');const values=[];
    for(const c of tags(row,'c')){
     const letters=c.getAttribute('r').match(/^[A-Z]+/)[0];let ci=0;for(const ch of letters)ci=ci*26+ch.charCodeAt(0)-64;ci--;
     const type=c.getAttribute('t'),raw=tags(c,'v')[0]?.textContent;let val=null;
     if(tags(c,'f').length&&(raw===undefined||raw===''))throw Error('Formula has no cached result: '+name+'!'+c.getAttribute('r')+'. Recalculate and save the workbook first.');
     if(type==='s')val=shared[Number(raw)]??null;
     else if(type==='inlineStr')val=tags(c,'t').map(n=>n.textContent).join('');
     else if(type==='d')val=raw?{date:raw.slice(0,10)}:null;
     else if(type==='b')val=raw==='1';
     else if(type==='str'||type==='e')val=raw??null;
     else if(raw!==undefined&&raw!=='')val=Number(raw);
     values[ci]=val;
    }
    matrix[ri]=values;
   }
   const width=matrix[0]?.length||0;
   output[name]=Array.from({length:matrix.length},(_,i)=>Array.from({length:width},(_,j)=>matrix[i]?.[j]??null));
  }
  return output;
 }
 return {read};
})();
if(typeof module!=='undefined')module.exports=EixXlsx;
