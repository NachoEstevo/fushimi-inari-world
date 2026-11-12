import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {legacyProgressEnglish} from './integration.mjs';

test('every legacy loading status reaches the visitor in English',()=>{
  const source=readFileSync(new URL('./legacy-builders.mjs',import.meta.url),'utf8');
  const statuses=[...source.matchAll(/loaderStatus\.textContent\s*=\s*'([^']+)'/g)].map(match=>match[1]);
  assert.ok(statuses.length>=4);
  for(const status of statuses){
    const english=legacyProgressEnglish[status];
    assert.ok(english,`untranslated legacy status: ${status}`);
    assert.match(english,/^[\x20-\x7e]+…$/,'plain English ending like the other loading stages');
  }
});
