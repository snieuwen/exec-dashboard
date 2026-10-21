#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),Rules=require('../src/rules.js'),Estate=require('../src/model.js');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const safe=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function build(options={}){
 const configPath=options.config?path.resolve(options.config):path.join(root,'config/default.json');
 const config=Rules.validateConfig(JSON.parse(fs.readFileSync(configPath,'utf8'))),configDir=path.dirname(configPath);
 const headers=JSON.parse(read('schemas/eix-columns.json'));
 let input=Object.fromEntries(Object.entries(headers).map(([name,columns])=>[name,[columns]]));
 let sourceFile='No source loaded',sourceHash=null,snapshot=options.snapshot||config.snapshot||'2000-01-01';
 if(options.source){
  if(!options.snapshot&&!config.snapshot)throw Error('A source build requires --snapshot YYYY-MM-DD.');
  const file=path.resolve(options.source),bytes=fs.readFileSync(file);input=JSON.parse(bytes.toString('utf8'));sourceFile=path.basename(file);sourceHash=hash(bytes);
 }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(snapshot)||new Date(snapshot+'T00:00:00Z').toISOString().slice(0,10)!==snapshot)throw Error('Invalid snapshot date.');
 for(const [sheet,columns]of Object.entries(headers)){
  if(!Array.isArray(input[sheet])||JSON.stringify(input[sheet][0])!==JSON.stringify(columns))throw Error('Unexpected source column layout: '+sheet);
 }
 const prepared=Rules.prepare(input,config,{snapshot}),source=prepared.source;
 Estate.configure(config);Estate.normalize(source);
 const customerCss=config.themeFile?fs.readFileSync(path.resolve(configDir,config.themeFile),'utf8'):'';
 if(/@import|url\s*\(/i.test(customerCss))throw Error('Customer CSS must be self-contained; remote/resource URLs are not supported.');
 const extension=config.extensionFile?fs.readFileSync(path.resolve(configDir,config.extensionFile),'utf8'):'const DashboardExtension={};';
 new vm.Script(extension,{filename:'customer-extension.js'});
 const meta={snapshot,sourceFile,originalFile:sourceFile,sha256:sourceHash,cleansing:prepared.summary,scopeNote:config.scopeNote||'',origins:prepared.origins,fxDefaults:config.fxDefaults||{},sheets:Object.fromEntries(Object.entries(source).map(([name,rows])=>[name,{rows:rows.length-1,columns:rows[0].length}]))};
 const pkg=JSON.parse(read('package.json'));
 const licenses=['D3','TOPOJSON','WORLD-ATLAS'].map(name=>name+'\n'+read('vendor/'+name+'-LICENSE.txt')).join('\n\n');
 const blocks={TITLE:escape(config.title||config.label||'Executive dashboard'),LABEL:escape(config.label||'Executive dashboard'),VERSION:pkg.version,CSS:read('src/layout.css'),CUSTOMER_CSS:customerCss,CUSTOMER_CONFIG:safe(config),SCHEMA:safe(headers),SOURCE:safe(source),META:safe(meta),RULES:read('src/rules.js'),EXTENSION:extension,MODEL:read('src/model.js'),ATLAS:read('src/atlas.js'),ATLAS_GEOGRAPHY:safe(require('./build-atlas.cjs')),ATLAS_LICENSES:safe(licenses),XLSX:read('src/xlsx-reader.js'),APP:read('src/report-footnotes.js')+'\n'+read('src/report-quantities.js')+'\n'+read('src/app.js')};
 let html=read('src/report.html').replace(/__([A-Z_]+)__/g,(marker,key)=>key==='BUILD'?marker:Object.hasOwn(blocks,key)?blocks[key]:(()=>{throw Error('Unresolved template marker: '+marker);})());
 const buildId=hash(html).slice(0,12),manifest={coreVersion:pkg.version,buildId,configSHA256:hash(fs.readFileSync(configPath)),sourceSHA256:sourceHash,sourceSnapshot:options.source?snapshot:null,sourceRecords:prepared.counts,extensionSHA256:hash(extension),themeSHA256:hash(customerCss)};
 html=html.replace('__BUILD__',safe({version:pkg.version,id:buildId,...manifest}));
 // Inline scripts cannot terminate their containing element through customer configuration.
 for(const [name,script]of Object.entries({extension,customerCss}))if(/<\/script|<\/style/i.test(script))throw Error('Unsafe closing tag in '+name);
 const output=path.resolve(options.output||path.join(root,'dist/dashboard.html'));fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);fs.writeFileSync(output.replace(/\.html$/i,'')+'.manifest.json',JSON.stringify({...manifest,artifactSHA256:hash(html)},null,2)+'\n');
 return {output,...manifest};
}
function main(){
 const args=process.argv.slice(2),options={};
 if(args.includes('--help')){console.log('exec-dashboard [--config customer.json] [--source source.json --snapshot YYYY-MM-DD] [--output dashboard.html]');return;}
 for(let i=0;i<args.length;i+=2){if(!['--config','--source','--snapshot','--output'].includes(args[i])||!args[i+1])throw Error('Unknown option or missing value: '+args[i]);options[args[i].slice(2)]=args[i+1];}
 console.log(JSON.stringify(build(options),null,2));
}
if(require.main===module){try{main();}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={build};
