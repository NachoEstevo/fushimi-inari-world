import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {createKeihanStationSpec} from './keihan-station-spec.mjs';
import {buildKeihanApproach,keihanApproachLayout,KEIHAN_CANAL_RING} from './keihan-approach.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url))),surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
const make=()=>{const root=new THREE.Group(),colliders=[],result=buildKeihanApproach(root,features,surfaces,{},colliders);root.updateMatrixWorld(true);const world=new SpatialCollisionWorld();for(const c of colliders)c.type==='box'?world.addBox(...c.args):world.addCylinder(...c.args);return {root,result,world,colliders};};

test('Keihan route starts at the exact east gate, crosses canal and JR tracks, and joins Urasando',()=>{
 const r=make().result,spec=createKeihanStationSpec(features,surfaces);
 assert.deepEqual(r.routePoints[0],spec.publicExit.position);
 for(const p of [[-230.669,-91.56],[-212.032,-86.206],[-207.745,-85.761],[-203.649,-85.382],[-157.252,-85.95],[-151.505,-87.319]])assert.ok(r.routePoints.some(q=>q[0]===p[0]&&q[2]===p[1]));
 assert.deepEqual(r.routePoints.at(-1),[-20.434,surfaces.height(-20.434,-25.381),-25.381]);
 assert.ok(r.routePoints.every(p=>p[2]<-24),'must not reroute through JR Omotesando first torii');
 assert.equal(r.checkpoints.length,3);assert.equal(r.surfaceHeight(0,0),null);
});

test('new bridge and connection pavement has one owner and excludes every existing rendered path quad',()=>{
 const layout=keihanApproachLayout(features,surfaces);
 for(let i=0;i<layout.portions.length;i++){
  const p=layout.portions[i];for(const q of layout.existingTops)assert.ok(Math.abs(polygonArea(clipConvex(p.polygon,q.polygon)))<1e-7,p.id+' overlaps '+q.id);
  for(let j=i+1;j<layout.portions.length;j++)assert.ok(Math.abs(polygonArea(clipConvex(p.polygon,layout.portions[j].polygon)))<1e-7);
 }
 assert.equal(surfaces.segments.some(s=>s.id==='way/105449702'),false,'bridge is genuinely missing from legacy owner');
});

test('physical corridor supports both directions and shoulder offsets with no collision',()=>{
 const {result:r,world}=make();let count=0,maxStep=0;
 for(const route of [r.routePoints,[...r.routePoints].reverse()])for(const offset of [-.25,0,.25]){
  let previous=null;for(let j=1;j<route.length;j++){const a=route[j-1],b=route[j],length=Math.hypot(b[0]-a[0],b[2]-a[2]),steps=Math.ceil(length/.15),nx=-(b[2]-a[2])/length,nz=(b[0]-a[0])/length;
   for(let i=0;i<=steps;i++){const x=a[0]+(b[0]-a[0])*i/steps+nx*offset,z=a[2]+(b[2]-a[2])*i/steps+nz*offset,y=r.surfaceHeight(x,z)??surfaces.sample(x,z)?.height;assert.ok(Number.isFinite(y),'missing physical floor '+[x,z]);const solved=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(solved.x-x,solved.z-z)<1e-7,'route blocked '+[x,z]);if(previous!==null)maxStep=Math.max(maxStep,Math.abs(previous-y));previous=y;count++;}
  }
 }
 assert.ok(count>10000);assert.ok(maxStep<.06,'height discontinuity '+maxStep);
});

test('bridge floor sampler matches downward rays and rail colliders block canal-side exits',()=>{
 const {root,result:r,world}=make(),layout=keihanApproachLayout(features,surfaces),b=layout.bridge;
 for(let u=1;u<b.length-1;u+=.7)for(const v of [-2,0,2,4.5,5.5]){const [x,z]=b.local(u,v),y=r.surfaceHeight(x,z);if(y===null)continue;const ray=new THREE.Raycaster(new THREE.Vector3(x,y+.1,z),new THREE.Vector3(0,-1,0),0,.2),hit=ray.intersectObject(root,true)[0];assert.ok(hit,'no rendered support '+[x,z]);assert.ok(Math.abs(hit.point.y-y)<.015);}
 for(const v of [-3,6.25]){const [x,z]=b.local(b.length*.43,v),y=b.height(x,z),solved=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(solved.x-x,solved.z-z)>.28);}
});

test('offset pedestrian bridge has its full mapped span and joins on both ends',()=>{
 const {root,result:r,world}=make(),points=[...features.paths.find(p=>p.id==='way/777222941').points].reverse().concat([...features.paths.find(p=>p.id==='way/626177639').points].reverse(),[[-207.745,0,-85.761]]);
 for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j],length=Math.hypot(b[0]-a[0],b[2]-a[2]),n=Math.ceil(length/.1),nx=-(b[2]-a[2])/length,nz=(b[0]-a[0])/length;for(const offset of [-.25,0,.25])for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n+nx*offset,z=a[2]+(b[2]-a[2])*i/n+nz*offset,y=r.surfaceHeight(x,z)??surfaces.sample(x,z)?.height;assert.ok(Number.isFinite(y),'pedestrian bridge gap '+[x,z]);const solved=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(solved.x-x,solved.z-z)<1e-7);if(r.surfaceHeight(x,z)!==null){const hit=new THREE.Raycaster(new THREE.Vector3(x,y+.05,z),new THREE.Vector3(0,-1,0),0,.1).intersectObject(root,true)[0];assert.ok(hit,'sampler beyond actual top '+[x,y,z]);assert.ok(Math.abs(hit.point.y-y)<.015);}}}
});

test('canal terrain opening removes its polygon while preserving original outside planes',()=>{
 const {root,result:r}=make(),vertices=[-250,41,-170,-190,47,-170,-190,60,-20,-250,41,-170,-190,60,-20,-250,54,-20],out=r.clipTerrain(vertices);
 assert.ok(out.length>0);const area=positions=>{let a=0;for(let i=0;i<positions.length;i+=9)a+=Math.abs(polygonArea([[positions[i],positions[i+2]],[positions[i+3],positions[i+5]],[positions[i+6],positions[i+8]]]));return a;};
 assert.ok(Math.abs(area(vertices)-area(out)-Math.abs(polygonArea(KEIHAN_CANAL_RING)))<1e-5);
 for(let i=0;i<out.length;i+=3){const [x,y,z]=out.slice(i,i+3);assert.ok(Math.abs(y-(41+(x+250)*.1+(z+170)*13/150))<1e-8);}
 assert.equal(r.group.userData.bankRimFromRenderedTerrain,true);const bank=root.getObjectByName('Keihan approach concrete').geometry.attributes.position.array;
 for(let i=r.group.userData.bankRimVertexStart*3;i<bank.length;i+=18)for(const offset of [0,3]){const x=bank[i+offset],y=bank[i+offset+1],z=bank[i+offset+2];assert.ok(Math.abs(y-(41+(x+250)*.1+(z+170)*13/150))<1e-5,'bank rim must meet the rendered plane, not DEM');}
 const far=[0,0,0,1,0,0,0,0,1];assert.deepEqual(r.clipTerrain(far),far);assert.throws(()=>r.clipTerrain([NaN,0,0]),/finite triangle/);
});

test('static approach stays bounded, idempotent and fails closed without mapped bridge',()=>{
 const {root,result:r,colliders}=make();assert.equal(r.drawBatches,8);assert.ok(r.triangles<6000);assert.ok(r.collidersAdded<20);let lights=0;root.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});assert.equal(lights,0);
 const again=buildKeihanApproach(root,features,surfaces,{},colliders);assert.equal(again.group,r.group);assert.equal(root.children.length,1);assert.equal(colliders.length,r.collidersAdded);
 const empty=new THREE.Group(),failed=buildKeihanApproach(empty,{...features,paths:features.paths.filter(p=>p.id!=='way/105449702')},surfaces);assert.equal(failed.built,false);assert.equal(empty.children.length,0);
});

const canalTerrainFixture=()=>[-250,41,-170,-190,47,-170,-190,60,-20,-250,41,-170,-190,60,-20,-250,54,-20,0,0,0,1,0,0,0,0,1,-234,31,-100,-233,31,-100,-234,31,-99];
const bytesHash=array=>createHash('sha256').update(Buffer.from(array.buffer,array.byteOffset,array.byteLength)).digest('hex');
function assertOriginalCanal(result,output){
 const geometry=result.group.getObjectByName('Keihan approach concrete').geometry;
 // Captured from the complete synchronous implementation before startup changes.
 assert.equal(bytesHash(new Float64Array(output)),'10e82d4e9cd265dff9a534c5d68bcf25277559946c27ff4f5d9acdb897a643c7');
 assert.equal(bytesHash(geometry.attributes.position.array),'26190da2203d9c4f3add7238c59acef6d9cb983968de30cd55047e8764cedd3c');
 assert.equal(bytesHash(geometry.attributes.normal.array),'baa38af32865b4ffb120135919f77fec03fe9223acebe4fba1b1e1731807828d');
 assert.equal(result.group.userData.bankRimVertexStart,114);assert.equal(result.group.userData.triangles,4858);
}

test('canal startup clipping retains original terrain bytes and complete rendered bank geometry',()=>{
 const {result}=make();assertOriginalCanal(result,result.clipTerrain(canalTerrainFixture()));
});

test('outside canal terrain avoids triangle slices and whole-input iterator copies',()=>{
 const {result}=make(),values=[0,0,0,1,0,0,0,0,1,-240,3,-100,-239,4,-100,-240,3,-99,-220,4,-200,-219,4,-200,-220,4,-199,-220,3,-20,-219,4,-20,-220,3,-19];
 const positions=new Float64Array(values);
 positions[Symbol.iterator]=()=>{throw Error('whole terrain copied through iterator');};
 positions.slice=()=>{throw Error('outside terrain allocated triangle');};
 const before=result.group.getObjectByName('Keihan approach concrete').geometry;
 assert.deepEqual(result.clipTerrain(positions),values);
 assert.equal(result.group.getObjectByName('Keihan approach concrete').geometry,before);
 assert.notEqual(result.group.userData.bankRimFromRenderedTerrain,true);
});

test('canal clipping rejects sparse and nonfinite triangles without replacing bank geometry',async()=>{
 const {result}=make(),geometry=result.group.getObjectByName('Keihan approach concrete').geometry;
 for(const input of [Array(9),[0,0,0,1,Infinity,0,0,0,1],new Float64Array([0,0,0,1,0,0,0,NaN,1])]){
  assert.throws(()=>result.clipTerrain(input),/finite triangle/);
  await assert.rejects(result.clipTerrainAsync(input),/finite triangle/);
 }
 assert.equal(result.group.getObjectByName('Keihan approach concrete').geometry,geometry);
});

test('asynchronous canal clipping yields during the full scan and retains exact terrain and bank bytes',async t=>{
 const {result}=make(),far=Array.from({length:1100},()=>[0,0,0,1,0,0,0,0,1]).flat(),positions=[...far,...canalTerrainFixture()];
 let elapsed=0;t.mock.method(performance,'now',()=>elapsed+=33);
 let yields=0,scanYields=0;
 const output=await result.clipTerrainAsync(positions,{yieldWork:async()=>{yields++;if(!result.group.userData.bankRimFromRenderedTerrain)scanYields++;}});
 assert.ok(scanYields>=2,'a full terrain scan releases the main thread before publishing its bank');assert.ok(yields>scanYields,'the final terrain cutter also releases the main thread');
 assert.deepEqual(output.slice(0,far.length),far);assertOriginalCanal(result,output.slice(far.length));
 const complete=result.group.getObjectByName('Keihan approach concrete').geometry;
 await result.clipTerrainAsync(far,{yieldWork:async()=>{}});
 assert.equal(result.group.getObjectByName('Keihan approach concrete').geometry,complete,'partial terrain must retain the completed bank');
});
