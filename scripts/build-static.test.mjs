import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('static release contains runtime assets and excludes local QA backups',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'inari-static-'));
  const fixtures=[
    'integrated-world/index.html','integrated-world/viewer.mjs',
    'integrated-world/.qa-before.html','integrated-world/.qa-before-viewer.mjs',
    'integrated-world/.local/backup.mjs','integrated-world/outputs/capture.json',
    'integrated-world/viewer.test.mjs','integrated-world/notes.md',
    'geography/world.json','assets/textures/stone.webp','assets/textures/.cache/map.png',
    'assets/audio/credits.md','assets/models/visitors/credits.md','assets/social-preview.png',
    'assets/models/cat/Mugi.glb.gz','assets/models/cat/CREDITS.md','assets/models/cat/source.blend',
    'assets/illustrations/sketches/canal.webp','assets/illustrations/sketches/source.png',
  ];
  try{
    for(const file of fixtures){
      const dest=path.join(root,'fushimi_inari',file);
      await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,'fixture');
    }
    execFileSync(process.execPath,[fileURLToPath(new URL('./build-static.mjs',import.meta.url))],{cwd:root});
    const manifest=JSON.parse(await readFile(path.join(root,'dist/build-manifest.json'),'utf8'));
    assert.deepEqual(manifest.files.map(f=>f.path).sort(),[
      'assets/audio/credits.md','assets/illustrations/sketches/canal.webp','assets/models/cat/CREDITS.md','assets/models/cat/Mugi.glb.gz',
      'assets/models/visitors/credits.md','assets/social-preview.png',
      'assets/textures/stone.webp','geography/world.json',
      'integrated-world/index.html','integrated-world/viewer.mjs',
    ]);
    assert.equal(manifest.totalBytes,10*'fixture'.length);
  }finally{await rm(root,{recursive:true,force:true});}
});
