#!/usr/bin/env node
/* Publication guard: scan tracked files, or the source tree before Git initialization. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),skip=new Set(['.git','node_modules','dist','qa','data','incoming','processed','outputs','test-results','__pycache__']);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>skip.has(entry.name)||/\.(tmp|pyc)$/.test(entry.name)?[]:entry.isDirectory()?walk(path.join(dir,entry.name)):[path.relative(root,path.join(dir,entry.name)).replaceAll('\\','/')]);}
let files;try{files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\0').filter(Boolean);}catch{files=walk(root);}
const failures=[],forbidden=/\bING\b|Deutsche\s+Bank|\bDTAG\b|Caesar\s+Park|Penha\s+Longa|NL-NMA-494188|\bMLSA\b|Sandor\s+Nieuwenhuijs|OneDrive - Oracle Corporation|C:\\Users\\/i;
for(const file of files){
 if(/\.(xlsx?|xlsm|csv|tsv|pdf|docx|pptx|zip|pem|key)$/i.test(file)||/^(data|incoming|processed|outputs|dist|qa)\//.test(file)){failures.push(file+': data/generated file');continue;}
 const text=fs.readFileSync(path.join(root,file),'utf8');
 if(file!=='scripts/check-repository.cjs'&&forbidden.test(text))failures.push(file+': customer-specific reference or personal path');
 if(/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text))failures.push(file+': possible credential');
 if(/\.html$/.test(file)&&file!=='src/report.html')failures.push(file+': generated HTML must remain outside Git');
}
const schema=JSON.parse(fs.readFileSync(path.join(root,'schemas/eix-columns.json'),'utf8'));for(const columns of Object.values(schema))assert(columns.every(x=>typeof x==='string'),'Schema must contain only column names.');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('Publication scan passed: '+files.length+' source files; no customer records, branding, personal paths or credentials detected.');
