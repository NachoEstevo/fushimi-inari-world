import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildStationApproachSurfaceFixes} from './station-approach-surface-fixes.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
// Exact emitted Float32 witnesses from the independent actual assembly:
// Hommachi road ribbon and the narrow footway crossing Omotesando.
const witnesses=[
 {point:[-160.15805263157895,34.42171386764517,-85.60263157894737],triangle:[[-160.25570678710938,34.477134704589844,-84.46537780761719],[-154.25201416015625,34.50259780883789,-85.94251251220703],[-160.25198364257812,34.50259780883789,-85.95748901367188]]},
 {point:[-63.7232962962963,37.11516806106252,5.8955370370370375],triangle:[[-61.763206481933594,37.29600524902344,5.761914253234863],[-63.76079559326172,37.29600524902344,5.860085487365723],[-63.692543029785156,37.30860137939453,7.248835563659668]]}
];
function fixture(){
 const group=new THREE.Group();
 for(const {triangle}of witnesses){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(triangle.flat(),3));group.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial()));}
 const assembly={walkHeight(x){return x< -100?witnesses[0].point[1]:witnesses[1].point[1];}};
 return {group,assembly};
}
test('the two actual route feet move onto their emitted top without new geometry or altered owners',()=>{
 const {group,assembly}=fixture(),before=group.children.map(m=>[m.geometry,m.geometry.attributes.position.array.slice()]),base=assembly.walkHeight,fix=buildStationApproachSurfaceFixes(assembly,group,features);
 assert.equal(fix.built,true);assert.equal(fix.stats.regions.length,4);
 for(const {point:[x,y,z]}of witnesses){const ray=new THREE.Raycaster(new THREE.Vector3(x,y+.35,z),new THREE.Vector3(0,-1,0),0,.5),hit=ray.intersectObject(group,true)[0];assert.ok(hit);assert.ok(Math.abs(fix.walkHeight(x,z)-hit.point.y)<1e-8);assert.ok(fix.walkHeight(x,z)>y+.05);}
 assert.equal(assembly.walkHeight,base);assert.equal(group.children.length,before.length);
 group.children.forEach((m,i)=>{assert.equal(m.geometry,before[i][0]);assert.deepEqual(m.geometry.attributes.position.array,before[i][1]);});
});

test('unrelated positions and a higher station/building floor retain original ownership',()=>{
 const {group,assembly}=fixture(),fix=buildStationApproachSurfaceFixes(assembly,group,features);
 assert.equal(fix.walkHeight(0,0),assembly.walkHeight(0,0));assert.equal(fix.walkHeight(-300,-150),assembly.walkHeight(-300,-150));
 const elevated={walkHeight:()=>50},high=buildStationApproachSurfaceFixes(elevated,group,features);assert.equal(high.walkHeight(witnesses[1].point[0],witnesses[1].point[2]),50);
});

test('overhead decorative tops and downward faces cannot become walking support',()=>{
 const {group,assembly}=fixture(),[x,y,z]=witnesses[1].point;
 const top=new THREE.PlaneGeometry(3,3).rotateX(-Math.PI/2).translate(x,y+.8,z),down=new THREE.PlaneGeometry(3,3).rotateX(Math.PI/2).translate(x,y+.23,z);
 group.add(new THREE.Mesh(top,new THREE.MeshBasicMaterial()),new THREE.Mesh(down,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})));
 const fix=buildStationApproachSurfaceFixes(assembly,group,features),height=fix.walkHeight(x,z);assert.ok(height>y+.17&&height<y+.20);
});

test('missing or disconnected junction sources withhold corrections and previous height reaches the canonical sampler',()=>{
 const {group,assembly}=fixture(),missing=buildStationApproachSurfaceFixes(assembly,group,{paths:[]});assert.equal(missing.built,false);assert.equal(missing.walkHeight,assembly.walkHeight);
 const paths=features.paths.map(p=>p.id==='way/626313859'?{...p,nodeIds:p.nodeIds.map(id=>id+90000000000)}:p),partial=buildStationApproachSurfaceFixes(assembly,group,{paths});assert.equal(partial.stats.regions.length,3);
 const a={last:null,walkHeight(x,z,previous){this.last=previous;return 37.11516806106252;}},fix=buildStationApproachSurfaceFixes(a,group,features);fix.walkHeight(-63.7232962962963,5.8955370370370375,37);assert.equal(a.last,37);
});

test('the additional Omotesando and Urasando witnesses use only their registered junction disks',()=>{
 const {group,assembly}=fixture();
 for(const [x,z]of [[-36.28,3.918],[-20.434,-25.381]])group.add(new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2).translate(x,37.21516806106252,z),new THREE.MeshBasicMaterial()));
 const fix=buildStationApproachSurfaceFixes(assembly,group,features);
 for(const [x,z]of [[-36.28,3.918],[-20.434,-25.381]])assert.ok(Math.abs(fix.walkHeight(x+.1,z+.15)-37.21516806106252)<1e-5);
 assert.equal(fix.walkHeight(-30,20),assembly.walkHeight(-30,20));
});
