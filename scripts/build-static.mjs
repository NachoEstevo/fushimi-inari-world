import {mkdir,readdir,copyFile,stat,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),source=path.join(root,'fushimi_inari'),output=path.join(root,'dist');
// This script owns only dist, and refuses to remove an unmarked directory.
const exists=await stat(output).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
if(exists){if((await readFile(path.join(output,'.static-build-owner'),'utf8'))!=='inariyama-static-build')throw Error('Unowned dist');await rm(output,{recursive:true});}
await mkdir(output,{recursive:true});await writeFile(path.join(output,'.static-build-owner'),'inariyama-static-build');
const files=[];
async function copy(dir,predicate){
 for(const entry of await readdir(path.join(source,dir),{withFileTypes:true})){
  if(entry.name.startsWith('.'))continue; // Local QA backups and caches are never release assets.
  const rel=path.posix.join(dir,entry.name);if(entry.isDirectory()){if(!['outputs','references','__pycache__'].includes(entry.name))await copy(rel,predicate);continue;}
  if(!predicate(rel))continue;
  const target=path.join(output,rel);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,rel),target);files.push({path:rel,bytes:(await stat(target)).size});
 }
}
await copy('integrated-world',p=>!p.endsWith('.test.mjs')&&/\.(mjs|html|css|json|gz|svg)$/.test(p));
await copy('geography',p=>/\.(json|mjs|css)$/.test(p)&&!p.endsWith('.test.mjs'));
await copy('assets/textures',p=>/\.(png|webp|json)$/.test(p));
await copy('assets/audio',p=>/\.(mp3|ogg|json|md)$/.test(p));
await copy('assets/models/visitors',p=>/\.(glb|md)$/.test(p));
await copy('assets/models/cat',p=>/\.(glb|glb\.gz|md)$/.test(p));
await copyFile(path.join(source,'assets/social-preview.png'),path.join(output,'assets/social-preview.png'));
files.push({path:'assets/social-preview.png',bytes:(await stat(path.join(output,'assets/social-preview.png'))).size});
await writeFile(path.join(output,'build-manifest.json'),JSON.stringify({files,totalBytes:files.reduce((s,f)=>s+f.bytes,0)},null,2));
console.log(`${files.length} runtime files · ${(files.reduce((s,f)=>s+f.bytes,0)/1e6).toFixed(2)} MB → dist/`);
