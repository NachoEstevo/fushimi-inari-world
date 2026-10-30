import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

// Historical WebGL shader hooks are still checked on their matching runtime.
// The shipped WebGPU viewer and geometry contracts run on its pinned Three.
const legacyOnly=new Set(['water-appearance.test.mjs','shinike-reflections.test.mjs']);
const files=['fushimi_inari/integrated-world','fushimi_inari/geography'].flatMap(dir=>
 readdirSync(dir).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>`${dir}/${name}`));
const runs=[
 ['WebGPU viewer · three@0.187.0',['--loader','./scripts/webgpu-test-loader.mjs','--test',...files.filter(file=>!legacyOnly.has(file.split('/').at(-1)))]],
 ['Historical WebGL compatibility',['--test',...files.filter(file=>legacyOnly.has(file.split('/').at(-1)))]],
 ['Static release packaging',['--test','scripts/build-static.test.mjs']]
];
for(const [label,args]of runs){
 console.log(label);
 const result=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
