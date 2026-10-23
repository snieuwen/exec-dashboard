const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {initProject}=require('../scripts/init-project.cjs'),{build}=require('../scripts/build.cjs');
test('starter creates documented folders, builds an empty report and refuses to overwrite customer files',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dashboard-starter-'));
 try{
  const output=path.join(temp,'customer'),result=initProject(output);
  assert.equal(result.output,output);
  for(const name of ['input/incoming/EIX','stage','outputs','backups','customizations','docs'])assert(fs.statSync(path.join(output,name)).isDirectory(),name);
  const config=path.join(output,'customizations/customer.json'),before=fs.readFileSync(config);
  const pkg=require('../package.json');assert.equal(fs.readFileSync(path.join(output,'CORE_VERSION.txt'),'utf8').split(/\r?\n/)[0],pkg.version);
  assert(pkg.files.includes('scripts/init-project.cjs'));assert(pkg.files.includes('examples/local-project'));
  const manifest=build({config,output:path.join(temp,'work/empty.html')});assert.equal(manifest.sourceSHA256,null);assert.equal(manifest.sourceRecords['hw-details'].retained,0);
  const sentinel=path.join(output,'input/incoming/EIX/preserve.txt');fs.writeFileSync(sentinel,'original customer source');
  assert.throws(()=>initProject(output),/already exists/);assert.deepEqual(fs.readFileSync(config),before);assert.equal(fs.readFileSync(sentinel,'utf8'),'original customer source');
  assert.throws(()=>initProject(),/Provide --output/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
