import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

test('every runtime streaming import resolves to the same browser singleton',async()=>{
 const root=new URL('.',import.meta.url),html=await readFile(new URL('index.html',root),'utf8');
 const {imports}=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
 const resolved=new Set();
 for(const file of await readdir(root)){
  if(!file.endsWith('.mjs')||file.endsWith('.test.mjs'))continue;
  const source=await readFile(new URL(file,root),'utf8');
  for(const match of source.matchAll(/from\s+['"](\.\/texture-streaming\.mjs[^'"]*)['"]/g))resolved.add(imports[match[1]]??match[1]);
 }
 assert.equal(resolved.size,1,`Split streaming managers: ${[...resolved].join(', ')}`);
});
