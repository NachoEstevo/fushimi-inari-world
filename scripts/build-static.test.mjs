import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createImportMapResolver,readImportMap,stripImportMap,SITE_ORIGIN} from './importmap-resolver.mjs';

const CDN='https://cdn.jsdelivr.net/npm/three@0.187.0/';
const importMap={imports:{
  'three':CDN+'build/three.webgpu.js','three/webgpu':CDN+'build/three.webgpu.js','three/tsl':CDN+'build/three.tsl.js','three/addons/':CDN+'examples/jsm/',
  './sky.mjs?v=ambience-4':'./sky-nodes.mjs?v=aozora-r186-3','./sky-nodes.mjs':'./sky-nodes.mjs?v=aozora-r186-3',
  './water.mjs':'./webgpu-water.mjs','./audit.mjs':'./audit.mjs?v=2',
}};

test('resolver follows browser import-map semantics',()=>{
  const r=createImportMapResolver({importMap,documentUrl:SITE_ORIGIN+'integrated-world/index.html',
    roots:[{url:SITE_ORIGIN,dir:'/src'},{url:CDN,dir:'/three'}]});
  const from=SITE_ORIGIN+'integrated-world/viewer.mjs';
  // Keys match the full resolved URL, query included.
  assert.equal(r.resolve('./sky.mjs?v=ambience-4',from).file,path.join('/src','integrated-world','sky-nodes.mjs'));
  // An unlisted ?v= variant is not remapped: the browser loads that exact file.
  assert.equal(r.resolve('./sky.mjs?v=other',from).file,path.join('/src','integrated-world','sky.mjs'));
  assert.equal(r.resolve('./water.mjs',from).file,path.join('/src','integrated-world','webgpu-water.mjs'));
  assert.equal(r.resolve('../geography/geo-core.mjs',from).file,path.join('/src','geography','geo-core.mjs'));
  assert.equal(r.resolve('three',from).file,path.join('/three','build','three.webgpu.js'));
  assert.equal(r.resolve('three/addons/loaders/GLTFLoader.js',from).file,path.join('/three','examples','jsm','loaders','GLTFLoader.js'));
  // Bare specifiers inside three's own files use the same map; relative ones stay in the package.
  assert.equal(r.resolve('three/webgpu',CDN+'build/three.tsl.js').file,path.join('/three','build','three.webgpu.js'));
  assert.equal(r.resolve('../utils/BufferGeometryUtils.js',CDN+'examples/jsm/loaders/GLTFLoader.js').file,path.join('/three','examples','jsm','utils','BufferGeometryUtils.js'));
  assert.throws(()=>r.resolve('lil-gui',from),/not in the import map/);
});

test('import map is read from and stripped out of the page',()=>{
  const html=`<head>\n  <script type="importmap">${JSON.stringify(importMap)}</script>\n</head>`;
  assert.deepEqual(readImportMap(html),importMap);
  assert.equal(stripImportMap(html),'<head>\n</head>');
});

test('static release bundles the runtime and ships only requested files',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'inari-static-'));
  const page=`<!doctype html><html><head><link rel="stylesheet" href="world.css?v=1">
  <script type="importmap">${JSON.stringify(importMap)}</script>
</head><body><script type="module">if(new URLSearchParams(location.search).get("loadAudit")==="1"){const {installStartupAudit}=await import("./startup-audit.mjs");installStartupAudit(document.body);}import("./viewer.mjs?v=9").catch(error=>{document.body.dataset.bootstrapError=String(error);});</script></body></html>`;
  const fixtures={
    'integrated-world/index.html':page,
    'integrated-world/viewer.mjs':`import {uniform as TSL} from 'three/tsl';import {REVISION} from 'three';console.log(REVISION);import {sky} from './sky.mjs?v=ambience-4';import {water} from './water.mjs';import {geo} from '../geography/geo-core.mjs';
console.log(sky,water,geo,typeof TSL,new URL('../assets/textures/stone.webp',import.meta.url).href);
const data=await fetch('../geography/terrain.json');if(location.search)import('./audit.mjs').then(m=>m.audit());`,
    'integrated-world/sky.mjs':`export const sky='LEGACY_SKY';`,'integrated-world/sky-nodes.mjs':`export const sky='NODE_SKY';`,
    'integrated-world/water.mjs':`export const water='LEGACY_WATER';`,'integrated-world/webgpu-water.mjs':`export const water='NODE_WATER';`,
    'integrated-world/audit.mjs':`export function audit(){return 'LAZY_AUDIT';}`,
    'integrated-world/startup-audit.mjs':`export function installStartupAudit(body){body.dataset.audit='STARTUP';}`,
    'integrated-world/unused.mjs':`export const unused='UNREACHED';`,
    'integrated-world/viewer.test.mjs':'test','integrated-world/webgpu-lab.html':'lab','integrated-world/notes.md':'notes',
    'integrated-world/world.css':'body{}','integrated-world/anchors.json':'{}','integrated-world/stair-review.json':'{}',
    'integrated-world/romon.glb.gz':'gz','integrated-world/romon.glb':'raw','integrated-world/favicon.svg':'<svg/>',
    'integrated-world/.qa-before.html':'qa','integrated-world/.local/backup.mjs':'qa','integrated-world/outputs/capture.json':'{}','integrated-world/docs/note.json':'{}',
    'geography/geo-core.mjs':`export const geo='GEO';`,'geography/viewer.mjs':'geo viewer','geography/index.html':'geo page',
    'geography/terrain.json':'{}','geography/features.json':'{}','geography/manifest.json':'{}','geography/style.css':'a{}',
    'geography/sources/osm.json':'{}','geography/sources/named-nodes.json':'{}',
    'geography/sources/entrance-barriers.json':'{}','geography/sources/entrance-surfaces-r54.json':'{}','geography/sources/entrance-context-r55.json':'{}',
    'assets/textures/stone.webp':'img','assets/textures/.cache/map.png':'img',
    // Streamed textures ship as WebP tiers only; GLB-referenced precinct PNGs still ship.
    'assets/textures/nanobanana/wood.png':'png','assets/textures/balanced/nanobanana/wood.webp':'w','assets/textures/balanced/manifest.json':'[]',
    'assets/textures/Torii/column.png':'png','assets/textures/balanced/Torii/column.webp':'w','assets/textures/high/Torii/column.webp':'w','assets/textures/high/manifest.json':'[]',
    [`assets/textures/precinct-shared/${'a'.repeat(64)}.png`]:'png','assets/textures/precinct-shared/notes.png':'png',
    'assets/textures/kandakara-cedar-albedo-v1.webp':'w','assets/textures/balanced/kandakara-cedar-albedo-v1.webp':'w',
    'assets/audio/credits.md':'c','assets/audio/recorded-station/kyoto-main-hall-lg.ogg':'o','assets/audio/recorded-station/gate.ogg':'o',
    'assets/models/visitors/credits.md':'c','assets/social-preview.png':'p',
    'assets/models/cat/Mugi.glb.gz':'g','assets/models/cat/CREDITS.md':'c','assets/models/cat/source.blend':'b',
    'assets/illustrations/sketches/canal.webp':'w','assets/illustrations/sketches/source.png':'p',
  };
  try{
    for(const [file,content] of Object.entries(fixtures)){
      const dest=path.join(root,'fushimi_inari',file);
      await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,content);
    }
    execFileSync(process.execPath,[fileURLToPath(new URL('./build-static.mjs',import.meta.url))],{cwd:root,stdio:'pipe'});
    const dist=path.join(root,'dist');
    const manifest=JSON.parse(await readFile(path.join(dist,'build-manifest.json'),'utf8'));
    const shipped=manifest.files.map(f=>f.path);
    const assets=shipped.filter(p=>!/\/bundle-.*\.js$/.test(p)).sort();
    assert.deepEqual(assets,[
      'assets/audio/credits.md','assets/audio/recorded-station/gate.ogg','assets/illustrations/sketches/canal.webp',
      'assets/models/cat/CREDITS.md','assets/models/cat/Mugi.glb.gz','assets/models/visitors/credits.md','assets/social-preview.png',
      'assets/textures/balanced/Torii/column.webp','assets/textures/balanced/kandakara-cedar-albedo-v1.webp','assets/textures/balanced/manifest.json','assets/textures/balanced/nanobanana/wood.webp',
      'assets/textures/high/Torii/column.webp','assets/textures/high/manifest.json',
      `assets/textures/precinct-shared/${'a'.repeat(64)}.png`,'assets/textures/stone.webp',
      'geography/features.json','geography/manifest.json',
      'geography/sources/entrance-barriers.json','geography/sources/entrance-context-r55.json','geography/sources/entrance-surfaces-r54.json',
      'geography/style.css','geography/terrain.json',
      'integrated-world/anchors.json','integrated-world/favicon.svg','integrated-world/index.html','integrated-world/romon.glb.gz','integrated-world/world.css',
    ]);
    assert.equal(manifest.totalBytes,manifest.files.reduce((s,f)=>s+f.bytes,0));
    assert.ok(!shipped.some(p=>p.endsWith('.mjs')),'no unbundled modules ship');

    const html=await readFile(path.join(dist,'integrated-world/index.html'),'utf8');
    assert.doesNotMatch(html,/importmap|cdn\.jsdelivr\.net|viewer\.mjs|startup-audit\.mjs/);
    const entry=manifest.chunks.find(c=>c.kind==='entry');
    assert.match(entry.path,/^integrated-world\/bundle-viewer-[A-Z0-9]{8}\.js$/);
    assert.ok(html.includes(`import("./${path.posix.basename(entry.path)}")`),'bootstrap imports the hashed entry');
    assert.ok(html.includes(`<link rel="modulepreload" href="./${path.posix.basename(entry.path)}">`));
    const startup=manifest.chunks.find(c=>c.kind==='page-entry');
    assert.ok(html.includes(`await import("./${path.posix.basename(startup.path)}")`),'startup audit stays a lazy page import');
    assert.ok(entry.bytes>0&&entry.gzipBytes>0);

    const read=rel=>readFile(path.join(dist,rel),'utf8');
    const code=(await Promise.all(manifest.chunks.map(c=>read(c.path)))).join('\n');
    const entryCode=await read(entry.path);
    assert.match(code,/NODE_SKY/);assert.match(code,/NODE_WATER/);assert.match(code,/GEO/);
    assert.doesNotMatch(code,/LEGACY_SKY|LEGACY_WATER|UNREACHED/);
    assert.match(entryCode,/new URL\("\.\.\/assets\/textures\/stone\.webp",import\.meta\.url\)/);
    const lazy=manifest.chunks.find(c=>c.kind==='lazy');
    assert.equal(lazy.source,'integrated-world/audit.mjs');
    assert.match(await read(lazy.path),/LAZY_AUDIT/);
    assert.doesNotMatch(entryCode,/LAZY_AUDIT/);
    assert.deepEqual(manifest.threeBuilds,['three.core.js','three.tsl.js','three.webgpu.js']);

    const all=[];
    const walk=async dir=>{for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else all.push(p);}};
    await walk(dist);
    for(const file of all)assert.ok(!(await readFile(file,'utf8')).includes('cdn.jsdelivr.net'),`${file} references the CDN`);
  }finally{await rm(root,{recursive:true,force:true});}
});
