import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrailGuide,setTrailGuideProminence,trailGuideProminentByDefault,TRAIL_GUIDE_STYLE} from './trail-guide.mjs';

test('guide follows authored platform and stair floor, not graph elevation',async()=>{
 const points=[[0,0,0],[0,0,1],[0,0,2]],copy=structuredClone(points),calls=[];
 const guide=await createTrailGuide({points,walkHeight:(x,z,sourceY)=>{calls.push(sourceY);return z<1?8:8+Math.floor((z-1)*4)*.15;}});
 assert.deepEqual(points,copy);assert.equal(guide.isMesh,true);assert.equal(guide.material.depthTest,true);assert.equal(guide.material.depthWrite,false);assert.equal(guide.material.toneMapped,false);
 const p=guide.geometry.attributes.position;assert.ok(p.count>=22);assert.ok(Math.abs(p.getY(0)-8.04)<1e-5);assert.ok(Math.abs(p.getY(p.count-1)-8.64)<1e-5);assert.ok(calls.every(y=>y===0));
 for(let i=2;i<p.count;i+=2)assert.ok(Math.hypot((p.getX(i)+p.getX(i+1)-p.getX(i-2)-p.getX(i-1))/2,(p.getZ(i)+p.getZ(i+1)-p.getZ(i-2)-p.getZ(i-1))/2)<=.20001);
 for(let i=0;i<p.count;i+=2)assert.ok(Math.hypot(p.getX(i)-p.getX(i+1),p.getZ(i)-p.getZ(i+1))<=.07001);
 assert.equal(guide.material.map,null);assert.ok(p.array.byteLength+guide.geometry.index.array.byteLength<2_000_000);
 assert.equal(guide.userData.routeGuide.noExtraTextures,true);guide.geometry.dispose();guide.material.dispose();
});
test('long routes are bounded and adapt spacing, while yielding during preparation',async()=>{
 let yields=0;const guide=await createTrailGuide({points:[[0,1,0],[0,5,10000]],walkHeight:(x,z,y)=>y,yieldWork:async()=>{yields++;}});
 assert.equal(guide.geometry.attributes.position.count,80000);assert.ok(guide.userData.routeGuide.spacing>.2);assert.ok(yields>=Math.floor(40000/256));guide.geometry.dispose();guide.material.dispose();
});
test('cancellation and invalid surfaces fail closed',async()=>{
 let cancelled=false,yields=0;assert.equal(await createTrailGuide({points:[[0,0,0],[0,0,500]],walkHeight:()=>1,isCancelled:()=>cancelled,yieldWork:async()=>{yields++;cancelled=true;}}),null);assert.equal(yields,1);
 for(const walkHeight of [()=>NaN,()=>{throw Error('missing floor');}])assert.equal(await createTrailGuide({points:[[0,0,0],[0,0,2]],walkHeight}),null);
 assert.equal(await createTrailGuide({points:[[0,0,0],[0,0,0]],walkHeight:()=>0}),null);
 assert.equal(await createTrailGuide({points:[[0,0,0],[0,NaN,1]],walkHeight:()=>0}),null);
});
test('adaptive vertices keep segments above stair treads, including a riser just after the first sample',async()=>{
 const steps=[.002,.31,.54,.82],floor=z=>steps.filter(v=>z>=v).length*.15;
 const guide=await createTrailGuide({points:[[0,0,0],[0,0,1]],walkHeight:(x,z)=>floor(z)}),p=guide.geometry.attributes.position;
 assert.ok(p.count>6);
 for(let i=2;i<p.count;i+=2){
  const z=(p.getZ(i-2)+p.getZ(i-1)+p.getZ(i)+p.getZ(i+1))/4,y=(p.getY(i-2)+p.getY(i))/2;
  if(steps.every(step=>Math.abs(step-z)>.01))assert.ok(y>=floor(z)-.005,`segment ${i} crosses tread at ${z}`);
  if(Math.abs(p.getY(i)-p.getY(i-2))>.075)assert.ok(Math.abs((p.getZ(i)+p.getZ(i+1)-p.getZ(i-2)-p.getZ(i-1))/2)<=.005);
 }
 guide.geometry.dispose();guide.material.dispose();
});
test('sharp bends keep ribbon miters bounded and geometry finite',async()=>{
 const guide=await createTrailGuide({points:[[0,0,0],[1,0,0],[.1,0,.05]],walkHeight:()=>0}),p=guide.geometry.attributes.position;
 for(let i=0;i<p.count;i+=2){assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getZ(i)));assert.ok(Math.hypot(p.getX(i)-p.getX(i+1),p.getZ(i)-p.getZ(i+1))<=.07001);}
 assert.equal(guide.geometry.index.count,(guide.userData.routeGuide.vertices-1)*6);guide.geometry.dispose();guide.material.dispose();
});
test('walking guide is a thin muted thread with a distance fade; debug and audit URLs keep the vermilion line',async()=>{
 const half=g=>{const p=g.geometry.attributes.position;return Math.hypot(p.getX(0)-p.getX(1),p.getZ(0)-p.getZ(1))/2;};
 const quiet=await createTrailGuide({points:[[0,0,0],[0,0,4]],walkHeight:()=>0,prominent:false});
 assert.ok(Math.abs(half(quiet)-TRAIL_GUIDE_STYLE.quiet.width/2)<1e-6);assert.equal(quiet.material.color.getHex(),TRAIL_GUIDE_STYLE.quiet.color);
 assert.equal(quiet.material.transparent,true);assert.ok(quiet.material.opacityNode,'opacity depends on camera distance');assert.equal(quiet.material.map,null);
 assert.equal(JSON.parse(JSON.stringify({...quiet.userData.routeGuide})).prominent,false,'stats stay serializable');
 assert.equal(setTrailGuideProminence(quiet,true),true);assert.equal(quiet.userData.routeGuide.prominence.value,1);assert.equal(quiet.material.color.getHex(),TRAIL_GUIDE_STYLE.prominent.color);
 setTrailGuideProminence(quiet,false);assert.equal(quiet.userData.routeGuide.prominence.value,0);assert.equal(setTrailGuideProminence(null,true),false);
 const strong=await createTrailGuide({points:[[0,0,0],[0,0,4]],walkHeight:()=>0,prominent:true});
 assert.ok(Math.abs(half(strong)-TRAIL_GUIDE_STYLE.prominent.width/2)<1e-6);assert.equal(strong.userData.routeGuide.prominence.value,1);
 for(const search of ['?audit=1','?debugCamera=1','?x=1&audit'])assert.equal(trailGuideProminentByDefault(search),true);
 for(const search of ['','?quality=high'])assert.equal(trailGuideProminentByDefault(search),false);
 for(const g of [quiet,strong]){g.geometry.dispose();g.material.dispose();}
});
