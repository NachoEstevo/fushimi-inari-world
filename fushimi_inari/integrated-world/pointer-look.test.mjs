import test from 'node:test';
import assert from 'node:assert/strict';
import {installPointerLook} from './pointer-look.mjs';
function fixture({supported=true}={}){
 const handlers={},docHandlers={},windowHandlers={},moves=[];let enabled=true,requests=0,releases=0;
 const doc={defaultView:{addEventListener:(name,fn)=>windowHandlers[name]=fn},pointerLockElement:null,addEventListener:(name,fn)=>docHandlers[name]=fn,exitPointerLock(){doc.pointerLockElement=null;docHandlers.pointerlockchange();}};
 const element={addEventListener:(name,fn)=>handlers[name]=fn,setPointerCapture(){}};
 if(supported)element.requestPointerLock=()=>{requests++;doc.pointerLockElement=element;docHandlers.pointerlockchange();};
 const input=installPointerLook({element,document:doc,enabled:()=>enabled,look:(...delta)=>moves.push(delta),onRelease:()=>releases++});
 return {handlers,docHandlers,windowHandlers,doc,element,input,moves,setEnabled:value=>enabled=value,get requests(){return requests;},get releases(){return releases;}};
}
test('mouse click captures and relative movement continues after button release; release clears lock',()=>{
 const f=fixture();f.handlers.pointerdown({pointerType:'mouse',clientX:12,clientY:20});
 f.handlers.pointerup();f.handlers.pointermove({movementX:15,movementY:-8});
 assert.equal(f.requests,1);assert.deepEqual(f.moves,[[15,-8]]);f.input.release();assert.equal(f.input.locked,false);assert.ok(f.releases>0);
 f.handlers.pointermove({clientX:80,clientY:80});assert.equal(f.moves.length,1);
});
test('touch and unsupported browsers retain drag look without a lock request',()=>{
 for(const supported of [false,true]){
  const f=fixture({supported});f.handlers.pointerdown({pointerType:'touch',clientX:10,clientY:20});
  f.handlers.pointermove({clientX:15,clientY:12});f.handlers.pointerup();f.handlers.pointermove({clientX:25,clientY:25});
  assert.equal(f.requests,0);assert.deepEqual(f.moves,[[5,-8]]);
 }
});
test('paused input cannot capture or rotate; native Escape lock change clears dragging',()=>{
 const f=fixture();f.setEnabled(false);f.handlers.pointerdown({pointerType:'mouse'});assert.equal(f.requests,0);
 f.setEnabled(true);f.handlers.pointerdown({pointerType:'mouse',clientX:0,clientY:0});
 f.doc.pointerLockElement=null;f.docHandlers.pointerlockchange();f.handlers.pointermove({clientX:10,clientY:10});assert.deepEqual(f.moves,[]);
});

test('denied lock and invalid pointer capture preserve mouse look after release until Escape',async()=>{
 const f=fixture();
 f.element.requestPointerLock=()=>Promise.reject(new Error('WrongDocumentError'));
 f.element.setPointerCapture=()=>{throw new Error('InvalidStateError');};
 assert.doesNotThrow(()=>f.handlers.pointerdown({pointerType:'mouse',pointerId:1,clientX:10,clientY:20}));
 await Promise.resolve();f.docHandlers.pointerlockerror();f.handlers.pointerup();
 assert.equal(f.input.locked,false);assert.equal(f.input.engaged,true);
 f.handlers.pointermove({clientX:16,clientY:18});assert.deepEqual(f.moves,[[6,-2]]);
 f.docHandlers.keydown({code:'Escape'});assert.equal(f.input.engaged,false);
 f.handlers.pointermove({clientX:20,clientY:20});assert.equal(f.moves.length,1);
});
test('unsupported mouse fallback clears on explicit pause release and avoids reentry jumps',()=>{
 const f=fixture({supported:false});f.handlers.pointerdown({pointerType:'mouse',clientX:10,clientY:20});f.handlers.pointerup();
 f.handlers.pointerenter({clientX:100,clientY:100});f.handlers.pointermove({clientX:103,clientY:97});
 assert.deepEqual(f.moves,[[3,-3]]);f.input.release();assert.equal(f.input.engaged,false);
 f.handlers.pointermove({clientX:110,clientY:100});assert.equal(f.moves.length,1);
});
test('synchronous lock failure leaves fallback usable and pointer cancellation releases it',()=>{
 const f=fixture();f.element.requestPointerLock=()=>{throw new Error('WrongDocumentError');};
 f.handlers.pointerdown({pointerType:'mouse',clientX:0,clientY:0});f.handlers.pointerup();
 f.handlers.pointermove({clientX:4,clientY:5});assert.deepEqual(f.moves,[[4,5]]);
 f.handlers.pointercancel();assert.equal(f.input.engaged,false);
});

test('window blur clears click-armed fallback',()=>{
 const f=fixture({supported:false});f.handlers.pointerdown({pointerType:'mouse',clientX:0,clientY:0});
 f.windowHandlers.blur();assert.equal(f.input.engaged,false);
 f.handlers.pointermove({clientX:4,clientY:5});assert.deepEqual(f.moves,[]);
});
