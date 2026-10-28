import test from 'node:test';
import assert from 'node:assert/strict';
import {installBackendWorkAudit} from './backend-work-audit.mjs';

test('existing hooks preserve receiver, arguments, synchronous returns, promises and thrown identity',()=>{
 let time=0;const calls=[],result={},promise=Promise.resolve(result),error=new Error('GPU validation');
 Object.defineProperty(promise,'then',{get(){assert.fail('Audit must not inspect or attach promise continuations');}});
 const backend={createProgram(...args){calls.push([this,...args]);time+=3;return result;},createRenderPipeline(){time+=4;return promise;},updateTexture(){time+=5;throw error;},updateAttribute(){time+=1;return 42;}};
 const audit=installBackendWorkAudit(backend,{now:()=>time}),arg={name:'wood shader',stage:'fragment'},extra={};
 assert.equal(backend.createProgram(arg,extra)===result,true);assert.equal(calls[0][0]===backend,true);assert.equal(calls[0][1]===arg,true);assert.equal(calls[0][2]===extra,true);
 assert.equal(backend.createRenderPipeline({object:{name:'roof',type:'Mesh'}},[])===promise,true);
 assert.throws(()=>backend.updateTexture({name:'paint',isTexture:true,type:1014,source:{data:{width:1024,height:512}}}),caught=>caught===error);
 assert.equal(backend.updateAttribute({name:'instanceMatrix',array:new Float32Array(16),count:1,itemSize:16}),42);
 assert.equal(audit.stats.totals.count,4);assert.equal(audit.stats.totals.totalMs,13);assert.equal(audit.stats.recent.length,3);
 assert.equal(audit.stats.recent[0].method,'createProgram');assert.equal(audit.stats.recent[0].name,'wood shader');assert.equal(audit.stats.recent[0].type,'fragment');
 assert.equal(audit.stats.recent[1].name,'roof');assert.equal(audit.stats.recent[1].type,'Mesh');
 assert.equal(audit.stats.recent[2].width,1024);assert.equal(audit.stats.recent[2].height,512);assert.equal(audit.stats.recent[2].type,'Texture');audit.dispose();
});

test('recent events form a bounded chronological ring while totals include fast calls and phases',()=>{
 let time=10;const backend={updateAttribute(){time+=2;}},audit=installBackendWorkAudit(backend,{now:()=>time,limit:2,thresholdMs:2});
 audit.setPhase('precompile');backend.updateAttribute({array:new Uint8Array(8),count:2,itemSize:4});backend.updateAttribute({});
 audit.setPhase('render');backend.updateAttribute({name:'latest'});
 const stats=audit.stats;assert.deepEqual(stats.recent.map(event=>event.startTimeMs),[12,14]);assert.deepEqual(stats.recent.map(event=>event.phase),['precompile','render']);
 assert.equal(stats.totals.count,3);assert.equal(stats.totals.methods.updateAttribute.totalMs,6);assert.equal(stats.totals.phases.precompile.count,2);
 assert.equal(stats.recent[1].name,'latest');stats.recent[0].ms=999;stats.totals.methods.updateAttribute.count=999;
 assert.equal(audit.stats.recent[0].ms,2);assert.equal(audit.stats.totals.methods.updateAttribute.count,3);
 audit.reset();assert.equal(audit.stats.totals.count,0);assert.equal(audit.stats.recent.length,0);
 backend.updateAttribute({array:new Float32Array(12),count:4,itemSize:3});assert.equal(audit.stats.recent[0].phase,'render');assert.equal(audit.stats.recent[0].byteLength,48);audit.dispose();
});

test('dispose restores own and inherited method ownership without overriding later replacements',()=>{
 const inherited=function(){return 1;},own=function(){return 2;},replacement=()=>3,prototype={createProgram:inherited},backend=Object.assign(Object.create(prototype),{updateTexture:own});
 const audit=installBackendWorkAudit(backend);assert.equal(Object.hasOwn(backend,'createProgram'),true);assert.equal(Object.hasOwn(backend,'createRenderPipeline'),false);assert.equal(Object.hasOwn(backend,'updateAttribute'),false);
 backend.updateTexture=replacement;audit.dispose();audit.dispose();assert.equal(backend.createProgram===inherited,true);assert.equal(Object.hasOwn(backend,'createProgram'),false);assert.equal(backend.updateTexture===replacement,true);
 const target={updateTexture:own};
 const third=installBackendWorkAudit(target);third.dispose();assert.equal(Object.hasOwn(target,'updateTexture'),true);assert.equal(target.updateTexture===own,true);
});

test('unsafe metadata cannot replace backend returns or errors and disposed captured wrappers stop recording',()=>{
 let time=0;const expected=new Error('original'),backend={createProgram(){time+=3;return 7;},updateTexture(){time+=4;throw expected;}};
 const audit=installBackendWorkAudit(backend,{now:()=>time}),unsafe={get name(){throw new Error('unsafe metadata');}};
 assert.equal(backend.createProgram(unsafe),7);assert.throws(()=>backend.updateTexture(unsafe),error=>error===expected);
 assert.equal(audit.stats.totals.count,2);assert.equal(audit.stats.recent.length,2);
 const wrapper=backend.createProgram;audit.dispose();assert.equal(wrapper.call(backend,{}),7);assert.equal(audit.stats.totals.count,2);
});

test('every fast pipeline submission enters a bounded history with mode and owner metadata while returns and throws stay intact',()=>{
 let time=0;const result={},error=new Error('pipeline rejected'),backend={createRenderPipeline(object){time+=.25;if(object.fail)throw error;return result;}};
 const audit=installBackendWorkAudit(backend,{now:()=>time,limit:2,thresholdMs:2});
 const object={object:{name:'near mesh',type:'Mesh',uuid:'mesh-id'},material:{name:'paint',type:'MeshStandardNodeMaterial',id:31}};
 audit.setPhase('precompile');assert.equal(backend.createRenderPipeline(object,[])===result,true);
 audit.setPhase('render');assert.equal(backend.createRenderPipeline(object,null)===result,true);
 assert.throws(()=>backend.createRenderPipeline({...object,fail:true},[]),caught=>caught===error);
 const stats=audit.stats;assert.equal(Array.isArray(stats.pipelines),true);assert.equal(stats.pipelines.length,2);
 assert.deepEqual(stats.recent,[]);assert.equal(stats.totals.count,3);
 assert.deepEqual(stats.pipelines.map(event=>event.startTimeMs),[.25,.5]);assert.deepEqual(stats.pipelines.map(event=>event.mode),['sync','async']);
 assert.equal(stats.pipelines[0].phase,'render');assert.equal(stats.pipelines[0].ms,.25);assert.equal(stats.pipelines[0].name,'near mesh');assert.equal(stats.pipelines[0].type,'Mesh');
 assert.equal(stats.pipelines[0].objectId,'mesh-id');assert.equal(stats.pipelines[0].material,'paint');assert.equal(stats.pipelines[0].materialType,'MeshStandardNodeMaterial');assert.equal(stats.pipelines[0].materialId,31);
 stats.pipelines[0].name='mutated';assert.equal(audit.stats.pipelines[0].name,'near mesh');audit.reset();assert.deepEqual(audit.stats.pipelines,[]);audit.dispose();
});

test('first attribute and texture work is captured below threshold without changing calls or results',()=>{
 let time=0;const calls=[],result={},promise=Promise.resolve(result),failure=new Error('upload rejected');
 Object.defineProperty(promise,'then',{get(){assert.fail('Resource hooks must preserve promise identity');}});
 const names=['createAttribute','createIndexAttribute','createStorageAttribute','createIndirectStorageAttribute','createTexture','updateTexture','generateMipmaps'];
 const backend=Object.fromEntries(names.map(name=>[name,function(...args){calls.push([name,this,...args]);time+=.25;if(name==='generateMipmaps')throw failure;return name==='createTexture'?promise:result;}]));
 const originals={...backend},audit=installBackendWorkAudit(backend,{now:()=>time,thresholdMs:10});
 const attribute={id:17,name:'instanceMatrix',version:3,array:new Float32Array(32),count:2,itemSize:16};
 const texture={id:8,name:'floor',isTexture:true,version:5,source:{id:9,version:4,data:{width:1024,height:512,depth:1}}},options={levels:11};
 audit.setPhase('precompile');
 for(const name of names.slice(0,4))assert.equal(backend[name](attribute),result);
 assert.equal(backend.createTexture(texture,options),promise);assert.equal(backend.updateTexture(texture,options),result);
 audit.setPhase('render');assert.throws(()=>backend.generateMipmaps(texture),error=>error===failure);
 assert.equal(calls.length,7);for(const call of calls)assert.equal(call[1],backend);assert.equal(calls[4][2],texture);assert.equal(calls[4][3],options);
 const stats=audit.stats;assert.deepEqual(stats.recent,[]);assert.equal(stats.totals.count,7);assert.deepEqual(stats.resources.map(e=>e.method),names);
 assert.equal(stats.resources[0].resourceId,'attribute:17');assert.equal(stats.resources[0].version,3);assert.equal(stats.resources[0].byteLength,128);assert.equal(stats.resources[0].count,2);assert.equal(stats.resources[0].itemSize,16);
 assert.equal(stats.resources[4].resourceId,'texture:8');assert.equal(stats.resources[4].version,5);assert.equal(stats.resources[4].sourceId,'source:9');assert.equal(stats.resources[4].sourceVersion,4);assert.equal(stats.resources[4].width,1024);assert.equal(stats.resources[4].height,512);
 assert.equal(stats.resources[0].phase,'precompile');assert.equal(stats.resources[6].phase,'render');stats.resources[0].resourceId='changed';assert.equal(audit.stats.resources[0].resourceId,'attribute:17');
 audit.dispose();for(const name of names)assert.equal(backend[name],originals[name]);
});

test('resource history is bounded independently of fast per-frame updates and resets without losing resource identity',()=>{
 let time=0;const backend={createAttribute(){time+=.1;},updateAttribute(){time+=.1;},createTexture(){time+=.1;},updateTexture(){time+=.1;},generateMipmaps(){time+=.1;}},audit=installBackendWorkAudit(backend,{now:()=>time,limit:3,thresholdMs:2});
 const attribute={array:new Uint8Array(4)},texture={isTexture:true,version:1,source:{data:{data:new Uint8Array(16),width:2,height:2}}};
 backend.createAttribute(attribute);const id=audit.stats.resources[0].resourceId;backend.createTexture(texture);backend.updateTexture(texture);backend.generateMipmaps(texture);
 for(let i=0;i<100;i++)backend.updateAttribute(attribute);
 assert.equal(audit.stats.resources.length,3);assert.deepEqual(audit.stats.resources.map(e=>e.method),['createTexture','updateTexture','generateMipmaps']);assert.equal(audit.stats.resources[0].byteLength,16);assert.equal(audit.stats.totals.count,104);
 audit.reset();assert.deepEqual(audit.stats.resources,[]);backend.createAttribute(attribute);assert.equal(audit.stats.resources[0].resourceId,id);audit.dispose();
});

test('pipeline context identifies color and shadow cameras without traversing scene objects',()=>{
 let time=0;const backend={createRenderPipeline(){time+=.1;}},audit=installBackendWorkAudit(backend,{now:()=>time});
 const object={name:'roof',uuid:'roof-id',type:'Mesh'},geometry={id:12},camera={uuid:'color-camera',type:'PerspectiveCamera'},material={id:3,type:'MeshStandardNodeMaterial'};
 backend.createRenderPipeline({object,geometry,camera,material,context:{id:7}});
 backend.createRenderPipeline({object,geometry,camera:{uuid:'shadow-camera',type:'OrthographicCamera'},material:{...material,isShadowPassMaterial:true},context:{id:8}},[]);
 const [color,shadow]=audit.stats.pipelines;assert.equal(color.cameraId,'camera:color-camera');assert.equal(color.cameraType,'PerspectiveCamera');assert.equal(color.geometryId,'geometry:12');assert.equal(color.pass,'color');assert.equal(color.contextId,7);
 assert.equal(shadow.cameraId,'camera:shadow-camera');assert.equal(shadow.cameraType,'OrthographicCamera');assert.equal(shadow.pass,'shadow');assert.equal(shadow.contextId,8);audit.dispose();
});

test('new inherited hooks restore ownership, missing methods stay absent and unsafe resource metadata cannot change errors',()=>{
 let time=0;const error=new Error('device error'),inherited=function(){time+=3;throw error;},prototype={createTexture:inherited},backend=Object.create(prototype),audit=installBackendWorkAudit(backend,{now:()=>time});
 assert.equal(Object.hasOwn(backend,'createTexture'),true);assert.equal(Object.hasOwn(backend,'createStorageAttribute'),false);
 const unsafe={get source(){throw new Error('unsafe source');}};assert.throws(()=>backend.createTexture(unsafe),caught=>caught===error);assert.equal(audit.stats.resources.length,1);assert.equal(audit.stats.resources[0].method,'createTexture');
 const captured=backend.createTexture;audit.dispose();audit.dispose();assert.equal(Object.hasOwn(backend,'createTexture'),false);assert.equal(backend.createTexture,inherited);assert.throws(()=>captured.call(backend,{}),caught=>caught===error);assert.equal(audit.stats.resources.length,1);
});

test('slow draw, pass submission and binding hooks preserve results, arguments and errors',()=>{
 let time=0;const calls=[],value={},promise=Promise.resolve(value),failure=new Error('binding failed');
 Object.defineProperty(promise,'then',{get(){assert.fail('Render-pass promise must remain untouched');}});
 const names=['draw','beginRender','finishRender','createBindings','updateBindings'];
 const backend=Object.fromEntries(names.map(name=>[name,function(...args){calls.push([name,this,...args]);time+=3;if(name==='updateBindings')throw failure;return name==='beginRender'?promise:value;}]));
 const originals={...backend},audit=installBackendWorkAudit(backend,{now:()=>time,limit:8}),context={id:4,width:1280,height:720,renderTarget:{id:15},depthTexture:{isTexture:true,id:16},textures:[{}]};
 const draw={object:{uuid:'caster',name:'wall',type:'Mesh'},geometry:{id:6},camera:{uuid:'shadow-view',type:'OrthographicCamera'},material:{isShadowPassMaterial:true}},info={};
 assert.equal(backend.draw(draw,info),value);assert.equal(backend.beginRender(context),promise);assert.equal(backend.finishRender(context),value);
 const bindGroup={id:18,name:'material',bindings:[{},{}]},bindings=[bindGroup];assert.equal(backend.createBindings(bindGroup,bindings,7,9),value);assert.throws(()=>backend.updateBindings(bindGroup,bindings,8,10),error=>error===failure);
 for(const call of calls)assert.equal(call[1],backend);assert.equal(calls[0][2],draw);assert.equal(calls[0][3],info);assert.equal(calls[3][3],bindings);assert.deepEqual(calls[3].slice(4),[7,9]);
 const stats=audit.stats;assert.deepEqual(stats.recent.map(event=>event.method),names);assert.deepEqual(stats.resources,[]);assert.equal(stats.totals.count,5);
 assert.equal(stats.recent[0].objectId,'caster');assert.equal(stats.recent[0].cameraId,'camera:shadow-view');assert.equal(stats.recent[0].pass,'shadow');
 assert.equal(stats.recent[1].contextId,4);assert.equal(stats.recent[1].width,1280);assert.equal(stats.recent[1].height,720);assert.equal(stats.recent[1].renderTargetId,'renderTarget:15');assert.equal(stats.recent[1].depthTextureId,'texture:16');assert.equal(stats.recent[1].colorAttachmentCount,1);
 assert.equal(stats.recent[3].bindGroupId,'bindGroup:18');assert.equal(stats.recent[3].bindingCount,2);assert.equal(stats.recent[3].cacheIndex,7);assert.equal(stats.recent[3].bindingVersion,9);assert.equal(stats.recent[4].bindingVersion,10);
 audit.dispose();for(const name of names)assert.equal(backend[name],originals[name]);
});

test('fast render work does not fill event histories and nested durations remain inclusive',()=>{
 let time=0;const draw={object:{name:'mesh'},material:{}},backend={draw(){time+=.1;},beginRender(){time+=.1;},finishRender(){time+=1;this.draw(draw);time+=1;},createBindings(){time+=.1;},updateBindings(){time+=.1;}};
 const audit=installBackendWorkAudit(backend,{now:()=>time,thresholdMs:2,limit:2});
 for(let i=0;i<100;i++){backend.beginRender({});backend.draw(draw);backend.createBindings({});backend.updateBindings({});}
 assert.deepEqual(audit.stats.recent,[]);assert.deepEqual(audit.stats.resources,[]);assert.equal(audit.stats.totals.count,400);
 audit.reset();backend.finishRender({});assert.equal(audit.stats.totals.count,2);assert.ok(Math.abs(audit.stats.totals.totalMs-2.2)<1e-9,'outer 2.1ms includes the inner .1ms draw');
 assert.equal(audit.stats.recent.length,1);assert.equal(audit.stats.recent[0].method,'finishRender');audit.dispose();
});

test('inherited render hooks restore ownership and unsafe pass metadata does not replace an original exception',()=>{
 let time=0;const failure=new Error('submit failed'),finish=function(){time+=4;throw failure;},prototype={finishRender:finish},backend=Object.create(prototype),audit=installBackendWorkAudit(backend,{now:()=>time});
 assert.equal(Object.hasOwn(backend,'finishRender'),true);assert.equal(Object.hasOwn(backend,'draw'),false);
 assert.throws(()=>backend.finishRender({get id(){throw new Error('unsafe context');}}),error=>error===failure);assert.equal(audit.stats.recent.length,1);
 audit.dispose();assert.equal(Object.hasOwn(backend,'finishRender'),false);assert.equal(backend.finishRender,finish);
});
