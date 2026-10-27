import test from 'node:test';
import assert from 'node:assert/strict';
import * as health from './renderer-health.mjs';

function target(){const listeners=new Map();return {listeners,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},dispatch(type,event={}){for(const fn of listeners.get(type)??[])fn(event);}};}
function fixture(audit=false){
 const device=target(),canvas=target();let resolveLost;device.lost=new Promise(resolve=>{resolveLost=resolve;});
 const elements=[],created=[],body={append(node){elements.push(node);}},doc={body,createElement(tag){const node={tag,children:[],addEventListener(type,fn){this[type]=fn;},append(...children){this.children.push(...children);},remove(){this.removed=true;},click(){this.clicked=true;}};created.push(node);return node;}};
 const renderer={backend:{isWebGPUBackend:true,device},domElement:canvas,info:{memory:{geometries:4,textures:7}}};let scheduled=0,cleared=0;
 const options={renderer,document:doc,audit,getContext:()=>({quality:'balanced',camera:[1,2,3]}),now:()=>100,setInterval:()=>{scheduled++;return 8;},clearInterval:()=>{cleared++;}};
 return {device,canvas,renderer,resolveLost,doc,elements,created,options,get scheduled(){return scheduled;},get cleared(){return cleared;}};
}

test('audit mode bounds snapshots and preserves existing GPU listeners',()=>{
 const f=fixture(true);let existing=0;f.device.addEventListener('uncapturederror',()=>existing++);
 assert.equal(typeof health.installRendererHealth,'function');const monitor=health.installRendererHealth({...f.options,maxSamples:3,maxEvents:2});
 assert.equal(f.scheduled,1);for(let i=0;i<6;i++)monitor.sample();f.device.dispatch('uncapturederror',{error:{message:'validation error'}});
 assert.equal(existing,1);assert.equal(monitor.stats.samples.length,3);assert.equal(monitor.stats.samples.at(-1).memory.textures,7);assert.equal(monitor.stats.events.at(-1).type,'uncapturederror');assert.equal(monitor.failed,false);
 f.device.dispatch('uncapturederror',{error:{message:'second'}});f.device.dispatch('uncapturederror',{error:{message:'third'}});assert.deepEqual(monitor.stats.events.map(event=>event.detail),['second','third']);
 monitor.dispose();assert.equal(f.cleared,1);assert.equal(f.device.listeners.get('uncapturederror').size,1);
});

test('device loss reveals recovery controls without replacing the renderer promise',async()=>{
 const f=fixture(),original=f.device.lost;assert.equal(typeof health.installRendererHealth,'function');const monitor=health.installRendererHealth(f.options);
 assert.equal(f.scheduled,0);assert.equal(f.elements.length,0);f.resolveLost({reason:'unknown',message:'device lost'});await original;await Promise.resolve();
 assert.equal(monitor.failed,true);assert.equal(f.device.lost,original);assert.equal(f.elements.length,1);assert.match(f.elements[0].children.map(x=>x.textContent).join(' '),/recargar/i);
 monitor.dispose();
});

test('WebGL loss and restoration are observed without intercepting browser events',()=>{
 const f=fixture();f.renderer.backend={isWebGPUBackend:false};let other=0;f.canvas.addEventListener('webglcontextlost',()=>other++);
 assert.equal(typeof health.installRendererHealth,'function');const monitor=health.installRendererHealth(f.options);
 f.canvas.dispatch('webglcontextlost',{});assert.equal(other,1);assert.equal(monitor.failed,true);f.canvas.dispatch('webglcontextrestored',{});
 assert.deepEqual(monitor.stats.events.map(x=>x.type),['webglcontextlost','webglcontextrestored']);monitor.dispose();assert.equal(f.canvas.listeners.get('webglcontextlost').size,1);
});

test('disposing before device loss prevents late UI and later event updates',async()=>{
 const f=fixture(true);assert.equal(typeof health.installRendererHealth,'function');const monitor=health.installRendererHealth(f.options);monitor.dispose();const before=monitor.stats.events.length;
 f.resolveLost({reason:'unknown'});await f.device.lost;await Promise.resolve();f.canvas.dispatch('webglcontextlost',{});
 assert.equal(monitor.stats.events.length,before);assert.ok(f.elements.every(x=>x.removed));
});

test('export is explicit, includes finite snapshots, and reload requires a click',async()=>{
 const f=fixture(true),oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;let blob,reloads=0;
 URL.createObjectURL=value=>{blob=value;return 'blob:test';};URL.revokeObjectURL=()=>{};f.doc.defaultView={location:{reload(){reloads++;}}};
 try{
  const monitor=health.installRendererHealth({...f.options,getContext:()=>({camera:[1,NaN,Infinity]})});
  assert.equal(blob,undefined);f.elements[0].children[1].click();const data=JSON.parse(await blob.text());assert.deepEqual(data.samples.at(-1).context.camera,[1,null,null]);assert.equal(f.created.at(-1).download,'renderer-diagnostic.json');
  f.canvas.dispatch('webglcontextlost',{});assert.equal(reloads,0);f.elements.at(-1).children[2].click();assert.equal(reloads,1);monitor.dispose();
 }finally{URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
});
