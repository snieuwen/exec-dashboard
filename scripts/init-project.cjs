#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const template=path.resolve(__dirname,'../examples/local-project');
function initProject(output){
 if(!output)throw Error('Provide --output <new-customer-folder>.');
 const target=path.resolve(output);
 if(fs.existsSync(target))throw Error('Destination already exists; choose a new folder. Existing customer files are never overwritten.');
 fs.cpSync(template,target,{recursive:true,errorOnExist:true,force:false});
 return {output:target,coreVersion:JSON.parse(fs.readFileSync(path.resolve(__dirname,'../package.json'),'utf8')).version};
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.length===1&&args[0]==='--help')console.log('node scripts/init-project.cjs --output <new-customer-folder>');
 else if(args.length===2&&args[0]==='--output')console.log(JSON.stringify(initProject(args[1]),null,2));
 else {console.error('Provide --output <new-customer-folder>.');process.exitCode=1;}
}
module.exports={initProject};
