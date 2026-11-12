import test from 'node:test';
import assert from 'node:assert/strict';
import {AUDIT_PARAMS,auditRequested,createTelemetry,telemetry} from './telemetry.mjs';

test('only explicit audit parameters enable diagnostics',()=>{
  assert.equal(auditRequested(''),false);
  assert.equal(auditRequested('?intro=0&backend=webgl&leafLight=0'),false);
  for(const name of AUDIT_PARAMS)assert.equal(auditRequested(`?${name}=1`),true,name);
  assert.equal(auditRequested('?audit'),true,'a bare audit flag still counts');
  assert.equal(auditRequested('?audit=0&gpuAudit=0'),false,'an explicit zero keeps the visit ordinary');
  assert.equal(telemetry.enabled,false,'Node and ordinary visits have no audit location');
});

test('ordinary visits never serialize or write diagnostics',()=>{
  const dataset={},calls=[],value={toJSON(){calls.push('serialized');return {};}};
  const quiet=createTelemetry({enabled:false,target:()=>{calls.push('target');return dataset;}});
  quiet.report('inventory',value);quiet.text('drawCalls',12);
  assert.deepEqual(dataset,{});assert.deepEqual(calls,[]);
});

test('audit visits keep the existing attribute encodings',()=>{
  const dataset={},audit=createTelemetry({enabled:true,target:()=>dataset});
  audit.report('inventory',{anchors:3});audit.text('drawCalls',12);audit.text('ready',false);
  assert.deepEqual(dataset,{inventory:'{"anchors":3}',drawCalls:'12',ready:'false'});
  assert.doesNotThrow(()=>createTelemetry({enabled:true,target:()=>undefined}).report('missing',{}));
});
