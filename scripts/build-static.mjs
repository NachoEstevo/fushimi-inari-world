// Static release build: bundles the runtime with esbuild (honouring the page's
// import map) and copies only the files the published experience requests.
// Development keeps serving fushimi_inari/ unbundled with the CDN import map.
//   node scripts/build-static.mjs [--source <dir>] [--out <dir>]
import {mkdir,readdir,copyFile,stat,writeFile,readFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {readImportMap,stripImportMap,createImportMapResolver,SITE_ORIGIN} from './importmap-resolver.mjs';

const {values:args}=parseArgs({options:{source:{type:'string'},out:{type:'string'}}});
const root=process.cwd();
const source=path.resolve(root,args.source??'fushimi_inari'),output=path.resolve(root,args.out??'dist');
const esbuild=await import('esbuild');
// npm alias of three@0.187: node_modules/three stays 0.164.1 for the legacy test lane.
const threeDir=fileURLToPath(new URL('../node_modules/three-runtime/',import.meta.url));
const threeVersion=JSON.parse(await readFile(path.join(threeDir,'package.json'),'utf8')).version;

// This script owns only its output, and refuses to remove an unmarked directory.
const exists=await stat(output).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
if(exists){if((await readFile(path.join(output,'.static-build-owner'),'utf8').catch(()=>''))!=='inariyama-static-build')throw Error('Unowned dist');await rm(output,{recursive:true});}
await mkdir(output,{recursive:true});await writeFile(path.join(output,'.static-build-owner'),'inariyama-static-build');

// --- Assets ------------------------------------------------------------------
// Runtime modules are bundled, so no .mjs is copied. Each exclusion below is a
// file no runtime module, page or stylesheet requests (see docs/run-and-host.md).
const EXCLUDED=new Set([
  'integrated-world/profile-audit-r13.json','integrated-world/profile-evidence-r14.json',
  'integrated-world/profile-walk-audit-r14.json','integrated-world/stair-review.json', // QA records, read by nothing
  'assets/textures/kandakara-cedar-albedo-v1.webp', // streamed only through its balanced/ copy (texture-streaming.mjs)
]);
const files=[];
async function copy(dir,predicate){
  for(const entry of await readdir(path.join(source,dir),{withFileTypes:true})){
    if(entry.name.startsWith('.'))continue; // Local QA backups and caches are never release assets.
    const rel=path.posix.join(dir,entry.name);
    if(entry.isDirectory()){if(!['outputs','references','__pycache__','docs'].includes(entry.name))await copy(rel,predicate);continue;}
    if(EXCLUDED.has(rel)||!predicate(rel))continue;
    await copyOne(rel);
  }
}
async function copyOne(rel){
  const target=path.join(output,rel);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,rel),target);
  files.push({path:rel,bytes:(await stat(target)).size});
}
const topLevel=p=>!p.slice(p.indexOf('/')+1).includes('/');
await copy('integrated-world',p=>topLevel(p)&&/\.(css|json|gz|svg)$/.test(p));
// The viewer fetches terrain, features and manifest; integration.mjs fetches the
// three entrance-* source files. The raw OSM/DEM inputs and the standalone
// geography viewer (geography/index.html, viewer.mjs) are not part of the walk.
for(const rel of ['geography/terrain.json','geography/features.json','geography/manifest.json','geography/style.css',
  'geography/sources/entrance-barriers.json','geography/sources/entrance-surfaces-r54.json','geography/sources/entrance-context-r55.json'])await copyOne(rel);
// Streamed textures ship as their generated balanced/ and high/ WebP tiers only;
// texture-streaming.mjs never requests an original PNG. The content-addressed
// precinct-shared PNGs are image URIs inside the shrine GLBs, so they still ship.
await copy('assets/textures',p=>/\.(webp|json)$/.test(p)||/^assets\/textures\/precinct-shared\/[a-f0-9]{64}\.png$/.test(p));
await copy('assets/audio',p=>/\.(mp3|ogg|json|md)$/.test(p)&&!p.endsWith('/kyoto-main-hall-lg.ogg')); // research candidate, never played
await copy('assets/illustrations/sketches',p=>p.endsWith('.webp'));
await copy('assets/models/visitors',p=>/\.(glb|md)$/.test(p));
await copy('assets/models/cat',p=>/\.(glb|glb\.gz|md)$/.test(p));
await copyOne('assets/social-preview.png');

// --- Bundle ------------------------------------------------------------------
const pageRel='integrated-world/index.html';
const html=await readFile(path.join(source,pageRel),'utf8');
const importMap=readImportMap(html);
const documentUrl=SITE_ORIGIN+pageRel;
const cdnRoots=new Set();
for(const value of Object.values(importMap.imports??{})){
  const m=/^https:\/\/cdn\.jsdelivr\.net\/npm\/three@([^/]+)\//.exec(value);
  if(!m){if(/^https?:/.test(value))throw Error(`Unsupported remote import ${value}`);continue;}
  if(m[1]!==threeVersion)throw Error(`Import map pins three@${m[1]} but three-runtime is ${threeVersion}; update package.json`);
  cdnRoots.add(m[0]);
}
const resolver=createImportMapResolver({importMap,documentUrl,roots:[
  {url:SITE_ORIGIN,dir:source},...[...cdnRoots].map(url=>({url,dir:threeDir}))]});

// Entry points: every dynamic import() in the page's inline module scripts
// (viewer and startup-audit), resolved as the browser would.
const inlineModules=[...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
const pageImports=new Map();
for(const [,code] of inlineModules)for(const [,spec] of code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g))pageImports.set(spec,resolver.resolve(spec,documentUrl).file);
if(![...pageImports.values()].some(f=>path.basename(f)==='viewer.mjs'))throw Error('index.html no longer imports viewer.mjs');

const urlsPerFile=new Map();
const importMapPlugin={name:'import-map',setup(build){
  build.onResolve({filter:/.*/},args=>{
    if(args.kind==='entry-point')return {path:args.path};
    const r=resolver.resolve(args.path,resolver.fileToUrl(args.importer));
    if(!urlsPerFile.has(r.file))urlsPerFile.set(r.file,new Set());
    urlsPerFile.get(r.file).add(r.url);
    return {path:r.file};
  });
}};
const outdir=path.join(output,'integrated-world');
// Chunks sit beside index.html so import.meta.url-relative and
// document-relative URLs (../assets, ../geography, ./x.css) resolve unchanged.
const result=await esbuild.build({
  entryPoints:[...new Set(pageImports.values())],bundle:true,splitting:true,format:'esm',target:'esnext',
  minify:true,outdir,entryNames:'bundle-[name]-[hash]',chunkNames:'bundle-chunk-[hash]',
  metafile:true,logLevel:'warning',legalComments:'eof',plugins:[importMapPlugin],
});
// One copy of three: core, webgpu and tsl builds only (as the CDN map serves them).
const threeBuilds=Object.keys(result.metafile.inputs).filter(i=>/three-runtime[\\/]build[\\/]/.test(i)).map(i=>path.basename(i)).sort();
if(threeBuilds.some(b=>!['three.core.js','three.tsl.js','three.webgpu.js'].includes(b)))throw Error(`Unexpected three builds in bundle: ${threeBuilds}`);
if(Object.keys(result.metafile.inputs).some(i=>/node_modules[\\/]three[\\/]/.test(i)))throw Error('Bundle pulled the legacy node_modules/three');
const outputs=Object.entries(result.metafile.outputs).map(([file,info])=>({file:path.resolve(root,file),...info}));
const entryFor=new Map(outputs.filter(o=>o.entryPoint).map(o=>[path.resolve(root,o.entryPoint),o]));
const outRel=file=>path.relative(output,file).split(path.sep).join('/');
const dirRel=file=>'./'+path.relative(outdir,file).split(path.sep).join('/');

// --- Page --------------------------------------------------------------------
let page=stripImportMap(html);
for(const [spec,file] of pageImports){
  const out=entryFor.get(file);if(!out)throw Error(`No bundle entry for ${spec}`);
  page=page.split(`import("${spec}")`).join(`import("${dirRel(out.file)}")`);
}
const viewerOut=[...entryFor.entries()].find(([f])=>path.basename(f)==='viewer.mjs')[1];
// Preload the viewer and its static chunks so the browser fetches them in parallel.
const preload=[viewerOut.file,...viewerOut.imports.filter(i=>i.kind==='import-statement').map(i=>path.resolve(root,i.path))]
  .map(f=>`<link rel="modulepreload" href="${dirRel(f)}">`).join('');
page=page.replace('</head>',`  ${preload}\n</head>`);
if(/importmap|cdn\.jsdelivr\.net/.test(page))throw Error('Built page still references the import map or CDN');
await writeFile(path.join(output,pageRel),page);
files.push({path:pageRel,bytes:Buffer.byteLength(page)});

const chunks=[];
for(const o of outputs){
  const rel=outRel(o.file);const bytes=(await stat(o.file)).size;
  files.push({path:rel,bytes});
  const pageEntry=o.entryPoint&&[...pageImports.values()].includes(path.resolve(root,o.entryPoint));
  const kind=o===viewerOut?'entry':pageEntry?'page-entry':outputs.some(p=>p.imports.some(i=>i.kind==='dynamic-import'&&path.resolve(root,i.path)===o.file))?'lazy':'shared';
  chunks.push({path:rel,bytes,gzipBytes:gzipSync(await readFile(o.file)).length,kind,source:o.entryPoint?path.relative(source,path.resolve(root,o.entryPoint)).split(path.sep).join('/'):undefined});
}
for(const f of files)if(/\.(js|html|css|json|mjs)$/.test(f.path)&&(await readFile(path.join(output,f.path),'utf8')).includes('cdn.jsdelivr.net'))throw Error(`${f.path} references the CDN`);

const collapsed=[...urlsPerFile].filter(([,urls])=>urls.size>1).map(([file,urls])=>({file:path.relative(source,file).split(path.sep).join('/'),urls:[...urls].map(u=>u.replace(SITE_ORIGIN,'/'))}));
const totalBytes=files.reduce((s,f)=>s+f.bytes,0);
const entry=chunks.find(c=>c.kind==='entry');
await writeFile(path.join(output,'build-manifest.json'),JSON.stringify({
  three:threeVersion,threeBuilds,entry:entry.path,totalBytes,
  modules:Object.keys(result.metafile.inputs).length,chunks,
  // Files reached through several ?v= URLs: separate module instances in
  // development, one instance in the bundle.
  collapsedModuleUrls:collapsed,files},null,2));
const kb=n=>(n/1024).toFixed(1)+' KB';
console.log(`${files.length} files · ${(totalBytes/1e6).toFixed(2)} MB → ${path.relative(root,output)||'.'}/`);
console.log(`${Object.keys(result.metafile.inputs).length} modules → ${chunks.length} chunks (${chunks.filter(c=>c.kind==='lazy').length} lazy)`);
console.log(`entry ${entry.path}: ${kb(entry.bytes)} raw · ${kb(entry.gzipBytes)} gzip`);
if(collapsed.length)console.log(`${collapsed.length} module(s) imported under several ?v= URLs now share one instance (see build-manifest.json)`);
