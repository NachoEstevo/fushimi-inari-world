import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildKumatakaLakesideRail} from './kumataka-lakeside-rail.mjs';

function fixture(){const root=new THREE.Group(),shrine=new THREE.Group();shrine.userData.zone='kumataka';root.add(shrine);const red=new THREE.MeshStandardMaterial(),dark=new THREE.MeshStandardMaterial();
 const box=(w,h,d,x,y,z,mat=red)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);shrine.add(m);return m;};
 const rail=box(.18,.92,16.8,2.55,1.05,0),cap=box(.22,.10,17,2.55,1.54,0,dark),shore=box(1.15,1.10,18.5,2.4,.18,0),body=box(4.2,2.9,5.2,-5.8,1.85,0);body.userData.interactable=true;body.userData.onInteract=()=>42;
 const marker=box(.56,1.1,.30,-9.2,.55,-8.5);return {root,shrine,rail,cap,shore,body,marker,red,dark};}
test('replaces only exact rail/cap, retains shoreline/pavilion/steles and inherited transform, and is idempotent',()=>{
 const f=fixture(),callback=f.body.userData.onInteract;f.shrine.position.set(545,66,-129);f.shrine.rotation.y=-1.162;f.shrine.updateMatrix();const matrix=f.shrine.matrix.clone();
 const r=buildKumatakaLakesideRail(f.root);assert.equal(r.adapted,true);assert.equal(r.terracesBuilt,false);assert.equal(r.materialBatches,2);assert.ok(r.triangles<3200);assert.equal(f.rail.parent,null);assert.equal(f.cap.parent,null);
 for(const o of [f.shore,f.body,f.marker])assert.equal(o.parent,f.shrine);assert.equal(f.body.userData.onInteract,callback);assert.deepEqual(f.shrine.matrix.elements,matrix.elements);
 assert.equal(buildKumatakaLakesideRail(f.root),r);assert.equal(f.shrine.children.length,4);
});
test('all finite nondegenerate replacement geometry remains inside exact inherited local envelope',()=>{
 const f=fixture(),r=buildKumatakaLakesideRail(f.root),g=f.shrine.children.at(-1),box=new THREE.Box3().setFromObject(g);
 for(let k=0;k<3;k++){assert.ok(box.min.getComponent(k)>=r.localEnvelope.min[k]-1e-5);assert.ok(box.max.getComponent(k)<=r.localEnvelope.max[k]+1e-5);}
 assert.ok(Math.abs(box.max.y-1.59)<1e-5);assert.ok(Math.abs(box.min.z+8.5)<1e-5);assert.ok(Math.abs(box.max.z-8.5)<1e-5);
 for(const mesh of g.children){assert.ok([f.red,f.dark].includes(mesh.material));const p=mesh.geometry.attributes.position;for(const value of p.array)assert.ok(Number.isFinite(value));for(let i=0;i<p.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-16);}}
});
test('paling has true open gaps and visible solid slats from both sides',()=>{
 const f=fixture();buildKumatakaLakesideRail(f.root);const g=f.shrine.children.at(-1);g.updateWorldMatrix(true,true);
 const hits=z=>new THREE.Raycaster(new THREE.Vector3(5,1,z),new THREE.Vector3(-1,0,0),0,5).intersectObject(g,true);
 assert.equal(hits(-8.3+16.6/88).length,0,'gap between first two slats is physically open geometry');assert.ok(hits(-8.3+.5*16.6/88).length>0);
 const reverse=z=>new THREE.Raycaster(new THREE.Vector3(0,1,z),new THREE.Vector3(1,0,0),0,5).intersectObject(g,true);
 assert.equal(reverse(-8.3+16.6/88).length,0);assert.ok(reverse(-8.3+.5*16.6/88).length>0);
});
test('unrecognized source group leaves all objects intact rather than inventing a fence or terrace',()=>{
 const f=fixture();f.rail.position.x+=.1;const before=[...f.shrine.children],r=buildKumatakaLakesideRail(f.root);assert.equal(r.adapted,false);assert.deepEqual(f.shrine.children,before);
 assert.equal(buildKumatakaLakesideRail(new THREE.Group()).adapted,false);
});
