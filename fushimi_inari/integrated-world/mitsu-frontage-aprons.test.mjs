import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildMitsuFrontageAprons,clipMitsuTerrain} from './mitsu-frontage-aprons.mjs';
import {buildPathMeshes} from './path-meshes.mjs';
const setup=(features={paths:[],buildings:[],water:[]})=>{
  const root=new THREE.Group(),segment={id:'way/1372838160',a:[560,2,-332],b:[561,2,-332],ya:2.14,yb:2.14,width:2,stair:true,rise:.16};
  const surfaces={segments:[segment],terrainHeight:()=>2,height:()=>2.14},materials={stoneMat:new THREE.MeshStandardMaterial()};
  return {root,surfaces,segment,run:()=>buildMitsuFrontageAprons(root,features,surfaces,materials)};
};
test('north collar remains outside existing curb, preserving tread and central walking height',()=>{
  const {root,surfaces,segment,run}=setup(),before=JSON.stringify(segment),r=run(),p=root.children[0].geometry.attributes.position;
  assert.equal(JSON.stringify(segment),before);assert.equal(r.drawBatches,1);assert.ok(r.triangles>0);
  for(let i=0;i<p.count;i++){assert.ok(p.getZ(i)>=-333.55001&&p.getZ(i)<=-333.12999);assert.ok(p.getY(i)>=1.93999&&p.getY(i)<=2.16801);if(Math.abs(p.getZ(i)+333.55)<.0001)assert.ok(Math.abs(p.getY(i)-1.94)<1e-6,'outer apron must meet rendered DEM skin, not float 7.4cm above it');}
  assert.equal(surfaces.height(560.5,-332),2.14);assert.equal(surfaces.height(560.5,-330.5),2.14);assert.ok(Math.abs(surfaces.height(560.5,-333.1301)-2.168)<1e-4);
  assert.equal(surfaces.omitEarthShoulder(segment,-1),true);assert.equal(surfaces.omitEarthShoulder(segment,1),false);assert.equal(surfaces.omitEarthShoulder({...segment,id:'other'},-1),false);
});
test('actual emitted triangle planes match walking heights and face upwards',()=>{
  const {root,surfaces,run}=setup();run();const p=root.children[0].geometry.attributes.position;
  for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).y>0);const centre=a.add(b).add(c).divideScalar(3);assert.ok(Math.abs(surfaces.height(centre.x,centre.z)-centre.y)<1e-6);}
});
test('mapped building/water footprints and transverse routes cut exact collar fragments',()=>{
  for(const type of ['buildings','water']){
    const features={paths:[],[type]:[{points:[[560.2,2,-333.2],[560.8,2,-333.2],[560.8,2,-333.6],[560.2,2,-333.6],[560.2,2,-333.2]]}]};
    const {root,run}=setup(features);run();const p=root.children[0].geometry.attributes.position;
    for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;assert.ok(!(x>560.20001&&x<560.79999&&z< -333.20001&&z> -333.59999));}
  }
  const {root,run}=setup({paths:[{id:'crossing',tags:{highway:'footway',width:'.2'},points:[[560.5,2,-334],[560.5,2,-331]]}]});run();const p=root.children[0].geometry.attributes.position;
  for(let i=0;i<p.count;i++)assert.ok(p.getX(i)<=560.25001||p.getX(i)>=560.74999);
});
test('idempotent build does not wrap height twice and requires authoritative path sections',()=>{
  const {root,surfaces,run}=setup(),r=run(),height=surfaces.height;assert.equal(run(),r);assert.equal(surfaces.height,height);assert.equal(root.children.length,1);
  const absent=setup();absent.surfaces.segments=[];assert.deepEqual(absent.run().sourceIds,[]);assert.equal(absent.root.children.length,0);
  const composed=setup();composed.surfaces.omitEarthShoulder=(s,side)=>s.id==='prior-owner'&&side===1;composed.run();
  assert.equal(composed.surfaces.omitEarthShoulder({id:'prior-owner'},1),true);assert.equal(composed.surfaces.omitEarthShoulder({id:'prior-owner'},-1),false);assert.equal(composed.surfaces.omitEarthShoulder({id:'other'},1),false);
});
test('terrain ownership clips only buried paving cells and preserves original DEM planes outside',()=>{
  const triangle=[559,5,-334,562,8,-334,559,5,-330],mask=[[[560,-333.5],[561,-333.5],[561,-331],[560,-331]]];
  const out=clipMitsuTerrain(triangle,mask);assert.ok(out.length>0);
  for(let i=0;i<out.length;i+=3)assert.ok(Math.abs(out[i+1]-(out[i]-554))<1e-8);
  for(let i=0;i<out.length;i+=9){const x=(out[i]+out[i+3]+out[i+6])/3,z=(out[i+2]+out[i+5]+out[i+8])/3;assert.ok(!(x>560.00001&&x<560.99999&&z> -333.49999&&z< -331.00001));}
  const distant=[0,1,0,1,1,0,0,1,1];assert.deepEqual(clipMitsuTerrain(distant,mask),distant);
});
test('shared path builder transfers only selected north earth shoulders, preserving other geometry',()=>{
  const previousDocument=globalThis.document,noop=()=>{};
  const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
  globalThis.document={createElement:()=>({width:512,height:256,getContext:()=>context}),body:{dataset:{}}};
  try{
    const m=new THREE.MeshStandardMaterial(),legacy={materials:{stoneMat:m,gravelMat:m,flagstoneMat:m,precinctPaving:m}};
    const s={id:'way/1372838161',a:[560,102,-332],b:[561,102,-332],ya:102.14,yb:102.14,width:2,stair:false,kind:'stone',distance:0};
    const {surfaces,run}=setup();run();
    const build=(id,omit)=>buildPathMeshes({segments:[{...s,id}],sample:()=>null,edgeCovered:()=>false,omitEarthShoulder:omit},legacy,()=>102);
    const baseline=build(s.id,undefined),after=build(s.id,surfaces.omitEarthShoulder),other=build('unrelated',surfaces.omitEarthShoulder);
    const vertices=(group,earth)=>{const values=[];group.traverse(o=>{if(o.isMesh&&(o.material.color.getHexString()==='71644d')===earth)values.push(...o.geometry.attributes.position.array);});return values;};
    const beforeEarth=vertices(baseline,true),afterEarth=vertices(after,true);
    assert.equal(afterEarth.length,beforeEarth.length/2);assert.deepEqual(vertices(other,true),beforeEarth);
    assert.deepEqual(vertices(after,false),vertices(baseline,false));
    for(let i=2;i<afterEarth.length;i+=3)assert.ok(afterEarth[i]>-332,'south shoulder retained');
  }finally{globalThis.document=previousDocument;}
});
