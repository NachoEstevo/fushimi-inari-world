import {LIGHT_PRESETS} from './route-lighting-nodes.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {vec4} from 'three/tsl';
import {collectPrecinctLeafBounds,collectPrecinctRoofBounds,installPrecinctLeafLight} from './precinct-leaf-light.mjs';
import {partitionInstances} from './spatial-mesh.mjs';
import {preservedForestLOD} from './forest-lod.mjs';

const box=(a,b)=>new THREE.Box3(new THREE.Vector3(...a),new THREE.Vector3(...b));
const crown=()=>box([-2,8,-2],[2,12,2]);
function texelAt(effect,x,z){
  const {bounds}=effect.stats,{data,width}=effect.texture.image;
  const ix=Math.min(width-1,Math.max(0,Math.floor((x-bounds.xmin)/(bounds.xmax-bounds.xmin)*width)));
  const iz=Math.min(width-1,Math.max(0,Math.floor((z-bounds.zmin)/(bounds.zmax-bounds.zmin)*width)));
  return Array.from(data.slice((iz*width+ix)*4,(iz*width+ix)*4+4));
}

test('bounds retain per-instance empty space, world transforms, region and explicit collection cap',()=>{
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(2,4,2),new THREE.MeshStandardMaterial(),2);
  mesh.position.set(10,0,0);mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(0,10,0));mesh.setMatrixAt(1,new THREE.Matrix4().makeTranslation(20,10,0));
  const all=collectPrecinctLeafBounds([mesh]);
  assert.equal(all.bounds.length,2);assert.deepEqual(all.bounds[0].min.toArray(),[9,8,-1]);assert.deepEqual(all.bounds[1].max.toArray(),[31,12,1]);
  assert.equal(collectPrecinctLeafBounds([mesh],{region:box([8,0,-2],[12,20,2])}).bounds.length,1);
  const capped=collectPrecinctLeafBounds([mesh],{maxInstances:1});assert.equal(capped.inspected,1);assert.equal(capped.truncated,true);
  mesh.geometry.dispose();mesh.material.dispose();
});

test('removed zero-scale crown instances cannot create phantom canopy coverage',()=>{
  const geometry=new THREE.BoxGeometry(2,4,2),material=new THREE.MeshStandardMaterial();
  const mesh=new THREE.InstancedMesh(geometry,material,2);
  mesh.setMatrixAt(0,new THREE.Matrix4().makeScale(0,0,0));mesh.setMatrixAt(1,new THREE.Matrix4().makeTranslation(10,10,0));
  const result=collectPrecinctLeafBounds([mesh]);assert.equal(result.bounds.length,1);assert.equal(result.skippedDegenerate,1);
  assert.equal(result.bounds[0].min.x,9);geometry.dispose();material.dispose();
});

test('actual partitioned near foliage retains source world bounds while excluding far proxies and removed instances',()=>{
  const parent=new THREE.Group();parent.position.set(25,4,-10);parent.rotation.y=.3;
  const geometry=new THREE.BoxGeometry(3,5,3),material=new THREE.MeshStandardMaterial(),source=new THREE.InstancedMesh(geometry,material,3);
  source.position.set(-4,2,6);source.setMatrixAt(0,new THREE.Matrix4().makeTranslation(5,10,0));
  source.setMatrixAt(1,new THREE.Matrix4().makeTranslation(140,20,10));source.setMatrixAt(2,new THREE.Matrix4().makeScale(0,0,0));
  parent.add(source);parent.updateMatrixWorld(true);const original=collectPrecinctLeafBounds([source]).bounds;
  const chunks=preservedForestLOD(partitionInstances(source,128));parent.add(chunks);source.removeFromParent();
  const actual=[];chunks.traverse(object=>{if(object.isInstancedMesh&&object.geometry===geometry)actual.push(object);});
  const result=collectPrecinctLeafBounds(actual).bounds;assert.equal(result.length,2);
  for(let i=0;i<result.length;i++){
    assert.ok(result[i].min.distanceTo(original[i].min)<1e-5);assert.ok(result[i].max.distanceTo(original[i].max)<1e-5);
  }
  const resources=new Set();chunks.traverse(object=>{if(object.isMesh){resources.add(object.geometry);resources.add(object.material);}});
  resources.forEach(resource=>resource.dispose());
});

test('merged static roof batch cannot suppress leaf light across an empty court',()=>{
  const material=new THREE.MeshStandardMaterial(),left=new THREE.BoxGeometry(4,.4,4).translate(-10,6,0),right=new THREE.BoxGeometry(4,.4,4).translate(10,6,0);
  // This is the same ownership marker assigned by batchStaticScene. Even a
  // batch narrower than the span cap must be rejected: its gap is still open.
  const merged=new THREE.BufferGeometry(),positions=[...left.attributes.position.array,...right.attributes.position.array];
  merged.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const batch=new THREE.Mesh(merged,material);batch.userData.staticSector=[0,0];
  const result=collectPrecinctRoofBounds([batch]);assert.equal(result.bounds.length,0);assert.equal(result.skippedAggregate,1);
  const effect=installPrecinctLeafLight({canopies:[box([-20,12,-12],[20,15,12])],roofs:result.bounds});
  assert.equal(texelAt(effect,45/65*6,-35/65*6)[2],0);effect.dispose();
  left.dispose();right.dispose();merged.dispose();material.dispose();
});

test('instanced roofs preserve the open court between actual roof elements and reject broad shells',()=>{
  const geometry=new THREE.BoxGeometry(4,.4,4),material=new THREE.MeshStandardMaterial(),roofs=new THREE.InstancedMesh(geometry,material,2);
  roofs.setMatrixAt(0,new THREE.Matrix4().makeTranslation(-10,6,0));roofs.setMatrixAt(1,new THREE.Matrix4().makeTranslation(10,6,0));
  const broad=new THREE.Mesh(new THREE.BoxGeometry(90,.5,30),material);
  const result=collectPrecinctRoofBounds([roofs,broad]);assert.equal(result.bounds.length,2);assert.equal(result.skippedOversized,1);
  const effect=installPrecinctLeafLight({canopies:[box([-20,12,-12],[20,15,12])],roofs:result.bounds});
  for(const x of [-10,10])assert.ok(texelAt(effect,x+45/65*6,-35/65*6)[2]>0);
  assert.equal(texelAt(effect,45/65*6,-35/65*6)[2],0);
  effect.dispose();geometry.dispose();broad.geometry.dispose();material.dispose();
});

test('single deterministic atlas carries bounded real crown coverage, roof heights and soft leaf silhouettes',()=>{
  const options={canopies:[crown()],roofs:[box([-1,3,-1],[1,4,1])]};
  const a=installPrecinctLeafLight(options),b=installPrecinctLeafLight(options);
  assert.deepEqual(a.texture.image.data,b.texture.image.data);assert.equal(a.stats.sourceBytes,65536);
  assert.equal(a.texture.generateMipmaps,false);assert.equal(a.texture.colorSpace,THREE.NoColorSpace);
  // Both crown and roof centres move away from their origins along sunlight.
  const canopy=texelAt(a,45/65*10,-35/65*10),roof=texelAt(a,45/65*3.5,-35/65*3.5);
  assert.ok(canopy[0]>240);assert.ok(canopy[1]>0);assert.ok(roof[2]>0);assert.ok(roof[2]<canopy[1]);
  const {data}=a.texture.image,alphas=Array.from({length:data.length/4},(_,i)=>data[i*4+3]);
  assert.ok(alphas.includes(0));assert.ok(alphas.includes(255));assert.ok(alphas.some(n=>n>0&&n<255));
  const edge=texelAt(a,a.stats.bounds.xmin,a.stats.bounds.zmin);assert.equal(edge[0],0);
  assert.equal(a.stats.extraDraws,0);assert.equal(a.stats.extraLights,0);
  a.dispose();b.dispose();
});

test('sunset rebuilds one fixed world atlas; camera updates and toggles do not rebuild graphs or move shade',()=>{
  const effect=installPrecinctLeafLight({canopies:[crown()]}),texture=effect.texture,day=effect.texture.image.data.slice();
  const material=new THREE.MeshStandardNodeMaterial();effect.attach(material);const node=material.colorNode,version=material.version;
  effect.update(new THREE.Vector3(100,20,300));effect.update(new THREE.Vector3(-40,10,90));
  assert.deepEqual(effect.texture.image.data,day);assert.equal(effect.stats.rebuilds,1);
  effect.setMode('gold');assert.equal(effect.texture,texture);assert.notDeepEqual(effect.texture.image.data,day);assert.equal(effect.stats.strength,.36*.8);
  assert.equal(material.colorNode,node);assert.equal(material.version,version);
  effect.setMode('night');assert.equal(effect.stats.strength,0);effect.setEnabled(false);effect.setMode('day');assert.equal(effect.stats.strength,0);
  effect.setEnabled(true);assert.equal(effect.stats.strength,.36);assert.deepEqual(effect.texture.image.data,day);
  assert.throws(()=>effect.setMode('moon'),RangeError);effect.dispose();material.dispose();
});

test('composition retains source RGBA graph, map and material state and restores only owned replacement',()=>{
  const map=new THREE.Texture(),a=new THREE.MeshStandardNodeMaterial({map,color:0xd94816,opacity:.6}),b=new THREE.MeshStandardNodeMaterial();
  const source=vec4(.4,.3,.2,.6);a.colorNode=source;const effect=installPrecinctLeafLight({canopies:[crown()],materials:[a,b]});
  let found=false;a.colorNode.traverse(node=>{if(node===source)found=true;});assert.ok(found);
  assert.equal(a.map,map);assert.equal(a.opacity,.6);assert.equal(a.color.getHex(),0xd94816);
  effect.attach(a);assert.equal(effect.stats.materials,2);
  const later=vec4(1,0,0,1);b.colorNode=later;let disposals=0;effect.texture.addEventListener('dispose',()=>disposals++);
  effect.dispose();effect.dispose();assert.equal(disposals,1);assert.equal(a.colorNode,source);assert.equal(b.colorNode,later);
  assert.throws(()=>effect.attach(a),/disposed/);a.dispose();b.dispose();map.dispose();
});

test('no canopy leaves materials unchanged in appearance, with zero effective strength',()=>{
  const effect=installPrecinctLeafLight();assert.equal(effect.stats.strength,0);assert.equal(effect.stats.bounds,null);
  effect.setMode('gold');effect.setEnabled(true);assert.equal(effect.stats.strength,0);effect.dispose();
  for(const size of [16,129,NaN])assert.throws(()=>installPrecinctLeafLight({}, {size}),RangeError);
  assert.throws(()=>installPrecinctLeafLight({}, {strength:.51}),RangeError);
});


test('golden canopy projection follows the same solar direction as the visible disc and light',()=>{
 const canopy=crown(),effect=installPrecinctLeafLight({canopies:[canopy]},{mode:'gold'});
 try{
  const [x,y,z]=LIGHT_PRESETS.gold.offset,sx=x/y,sz=z/y;
  assert.ok(Math.abs(effect.stats.bounds.xmin-(canopy.min.x-Math.max(sx*canopy.min.y,sx*canopy.max.y)-1))<1e-10);
  assert.ok(Math.abs(effect.stats.bounds.zmax-(canopy.max.z-Math.min(sz*canopy.min.y,sz*canopy.max.y)+1))<1e-10);
  assert.equal(effect.stats.extraLights,0);assert.equal(effect.stats.extraDraws,0);assert.equal(effect.stats.sourceBytes,65536);
 }finally{effect.dispose();}
});

test('global canopy sampling spans every input owner within the cap and retains real world bounds',()=>{
 const geometry=new THREE.BoxGeometry(2,4,2),material=new THREE.MeshStandardMaterial(),owners=[],counts=[5,7,6];let matrixReads=0;
 for(let owner=0;owner<3;owner++){
  const mesh=new THREE.InstancedMesh(geometry,material,counts[owner]);mesh.position.set(owner*100,owner*10,0);
  for(let i=0;i<counts[owner];i++)mesh.setMatrixAt(i,new THREE.Matrix4().makeTranslation(i*4,10,0));
  const getMatrix=mesh.getMatrixAt.bind(mesh);mesh.getMatrixAt=(...args)=>{matrixReads++;return getMatrix(...args);};owners.push(mesh);
 }
 const result=collectPrecinctLeafBounds(owners,{maxInstances:6,sample:true});
 assert.equal(result.availableInstances,18);assert.equal(result.sampleStride,3);assert.equal(result.inspected,6);assert.equal(result.bounds.length,6);assert.equal(result.truncated,false);assert.equal(matrixReads,6,'only sampled instance transforms are read');
 assert.deepEqual(result.bounds.map(b=>b.min.toArray()),[[-1,8,-1],[11,8,-1],[103,18,-1],[115,18,-1],[199,28,-1],[211,28,-1]]);
 assert.deepEqual(result.bounds.map(b=>b.max.toArray()),[[1,12,1],[13,12,1],[105,22,1],[117,22,1],[201,32,1],[213,32,1]]);
 const repeat=collectPrecinctLeafBounds(owners,{maxInstances:6,sample:true});assert.deepEqual(repeat.bounds,result.bounds);
 const legacy=collectPrecinctLeafBounds(owners,{maxInstances:6});assert.equal(legacy.bounds.length,6);assert.equal(legacy.truncated,true);assert.equal(legacy.availableInstances,18);assert.equal(legacy.sampleStride,1);assert.ok(legacy.bounds.every(b=>b.max.x<200));geometry.dispose();material.dispose();
});

test('sampling handles exact budgets, nondivisible totals and empty input without claiming truncation',()=>{
 const geometry=new THREE.BoxGeometry(2,4,2),material=new THREE.MeshStandardMaterial(),mesh=new THREE.InstancedMesh(geometry,material,24);
 for(let i=0;i<24;i++)mesh.setMatrixAt(i,new THREE.Matrix4().makeTranslation(i*4,10,0));
 const exact=collectPrecinctLeafBounds([mesh],{sample:true,maxInstances:8});assert.equal(exact.bounds.length,8);assert.equal(exact.sampleStride,3);assert.equal(exact.truncated,false);
 mesh.count=23;const partial=collectPrecinctLeafBounds([mesh],{sample:true,maxInstances:8});assert.equal(partial.bounds.length,8);assert.equal(partial.sampleStride,3);assert.equal(partial.truncated,false);
 mesh.count=17;const sparse=collectPrecinctLeafBounds([mesh],{sample:true,maxInstances:8});assert.equal(sparse.bounds.length,6);assert.equal(sparse.sampleStride,3);assert.equal(sparse.truncated,false);
 mesh.count=8;const all=collectPrecinctLeafBounds([mesh],{sample:true,maxInstances:8});assert.equal(all.bounds.length,8);assert.equal(all.sampleStride,1);assert.equal(all.truncated,false);
 const empty=collectPrecinctLeafBounds([],{sample:true,maxInstances:8});assert.equal(empty.bounds.length,0);assert.equal(empty.availableInstances,0);assert.equal(empty.sampleStride,1);assert.equal(empty.inspected,0);assert.equal(empty.truncated,false);geometry.dispose();material.dispose();
});
