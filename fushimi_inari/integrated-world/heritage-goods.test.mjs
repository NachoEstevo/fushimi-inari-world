import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {appendMochi,appendOmamoriPouch,appendEmaTablet} from './heritage-goods.mjs';

function build(emit){
 const group=new THREE.Group(),parts=staticParts(group),body=new THREE.MeshStandardMaterial(),cord=new THREE.MeshStandardMaterial();
 emit(parts,body,cord);const stats=parts.flush();return {group,body,cord,stats};
}
const positions=mesh=>mesh.geometry.attributes.position;
test('soft mochi has a rounded silhouette and rests on its wrapper plane',()=>{
 const f=build((parts,body)=>appendMochi(parts,{position:[2,3,4],width:.10,height:.055,depth:.09,material:body}));
 const p=positions(f.group.children[0]),bounds=new THREE.Box3().setFromBufferAttribute(p);
 assert.ok(Math.abs(bounds.min.y-3)<1e-5&&Math.abs(bounds.max.y-3.055)<1e-5);
 const base=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]).filter(([,y])=>Math.abs(y-3)<1e-5);
 assert.ok(Math.max(...base.map(p=>p[0]))-Math.min(...base.map(p=>p[0]))>.03,'flat underside makes real contact with the wrapper');
 assert.ok(bounds.max.x-bounds.min.x>.09&&bounds.max.z-bounds.min.z>.08);
 assert.ok(p.count>36&&f.stats.triangles<140);
 const normal=f.group.children[0].geometry.attributes.normal;
 assert.ok(new Set(Array.from(normal.array,value=>Math.round(value*100))).size>20,'rounded body has smoothly varied normals');
});

test('tied pouches and pentagonal tablets have finite surfaces, cords and bounded static geometry',()=>{
 const f=build((parts,body,cord)=>{
  appendOmamoriPouch(parts,{position:[0,0,0],width:.12,height:.17,depth:.05,body,cord});
  appendEmaTablet(parts,{position:[.3,0,0],width:.14,height:.15,depth:.012,wood:body,cord,front:-1});
 });
 assert.equal(f.stats.batches,2);assert.ok(f.stats.triangles<600);
 const body=f.group.children.find(mesh=>mesh.material===f.body),thread=f.group.children.find(mesh=>mesh.material===f.cord);
 const p=positions(body),uv=body.geometry.attributes.uv;
 assert.equal(p.count,uv.count);for(const value of [...p.array,...uv.array])assert.ok(Number.isFinite(value));
 const near=(y,target)=>Math.abs(y-target)<1e-5;
 const pouch=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i)]).filter(([x])=>x<.15);
 const breadth=(low,high)=>Math.max(...pouch.filter(([,y])=>y>=low&&y<=high).map(([x])=>Math.abs(x)));
 assert.ok(breadth(.12,.14)>breadth(.03,.10)*.70,'pouch retains a broad rectangular upper body');
 assert.ok(breadth(.16,.17)<breadth(.03,.10),'the cut top corners do not flare outward');
 const tablet=Array.from({length:p.count},(_,i)=>[p.getX(i)-.3,p.getY(i)]).filter(([x])=>Math.abs(x)<.09);
 assert.ok(tablet.some(([x,y])=>near(x,0)&&near(y,.15)),'tablet has a single pitched apex');
 assert.ok(tablet.some(([x,y])=>Math.abs(x)>.06&&near(y,.10)),'pitched shoulders establish a pentagonal silhouette');
 assert.ok(thread.geometry.attributes.position.count>0,'cords use an existing material batch');
});

test('omamori has a padded flat profile, stitched detail and cord resting on its front for either side',()=>{
 const width=.12,height=.17,depth=.05,skin=width*.28/2;
 for(const front of [-1,1]){
  const f=build((parts,body,cord)=>appendOmamoriPouch(parts,{position:[0,0,0],width,height,depth,body,cord,front}));
  const p=positions(f.group.children.find(mesh=>mesh.material===f.body));
  const strand=positions(f.group.children.find(mesh=>mesh.material===f.cord));
  const bounds=new THREE.Box3().setFromBufferAttribute(p);
  assert.ok(bounds.max.z-bounds.min.z<=width*.28+1e-5,'cloth pouch stays flat rather than bulbous');
  assert.ok(bounds.max.z-bounds.min.z>width*.20,'padding gives the cloth a soft thickness');
  const frontDepth=Array.from({length:strand.count},(_,i)=>strand.getZ(i)*front);
  assert.ok(Math.min(...frontDepth)>skin-.004&&Math.max(...frontDepth)<skin+.005,'knot and stitching touch the front skin');
  const belowKnot=Array.from({length:strand.count},(_,i)=>strand.getY(i)).filter(y=>y<height*.6);
  assert.ok(belowKnot.length>=60,'front carries subtle stitched decoration below the knot');
 }
});

test('tablet has an actual through-hole, threaded cord and a rear rest on the shelf',()=>{
 const width=.14,height=.15,depth=.012,holeY=height*.80,radius=width*.045;
 for(const front of [-1,1]){
 const f=build((parts,wood,cord)=>appendEmaTablet(parts,{position:[0,0,0],width,height,depth,wood,cord,front}));
 const wood=f.group.children.find(mesh=>mesh.material===f.body).geometry.attributes.position;
 const cord=f.group.children.find(mesh=>mesh.material===f.cord).geometry.attributes.position;
 const edge=(a,b,x,y)=>(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
 for(let i=0;i<wood.count;i+=3){
  const tri=[0,1,2].map(j=>[wood.getX(i+j),wood.getY(i+j),wood.getZ(i+j)]);
  if(!tri.every(p=>Math.abs(Math.abs(p[2])-depth/2)<1e-5))continue;
  const signs=tri.map((p,j)=>edge(p,tri[(j+1)%3],0,holeY));
  assert.ok(!(signs.every(v=>v>=-1e-10)||signs.every(v=>v<=1e-10)),'no front or back face covers the hole');
 }
 const through=Array.from({length:cord.count},(_,i)=>[cord.getX(i),cord.getY(i),cord.getZ(i)])
  .filter(([x,y])=>Math.hypot(x,y-holeY)<radius*.9);
 assert.ok(through.some(p=>p[2]>depth/2)&&through.some(p=>p[2]<-depth/2),'cord crosses from front to back through the hole');
 const rest=Array.from({length:wood.count},(_,i)=>[wood.getX(i),wood.getY(i),wood.getZ(i)])
  .filter(([,y,z])=>y<.006&&z*front<-depth*.8);
 assert.ok(rest.length>0,'rear rest meets the shelf behind the tablet');
 }
});
