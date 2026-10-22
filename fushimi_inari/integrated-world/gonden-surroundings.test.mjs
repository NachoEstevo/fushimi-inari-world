import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildGondenSurroundings} from './gonden-surroundings.mjs';
function fixture(){const root=new THREE.Group(),shrine=new THREE.Group();root.add(shrine);shrine.userData.zone='gonden';shrine.position.set(12,7,-20);shrine.rotation.y=.7;shrine.scale.set(1.2,1.1,.9);return {root,shrine,colliders:[],surfaces:{height:()=>8,segments:[]}};}
test('side props seat on world ground with matching transformed solid bounds and no lights',()=>{
 const f=fixture(),record=buildGondenSurroundings(f.root,{},f.surfaces,{},f.colliders);
 assert.equal(record.objects.length,4);assert.equal(f.colliders.length,4);
 f.root.updateMatrixWorld(true);
 for(const obj of record.objects){const g=f.root.getObjectByName(`Gonden side ${obj.id}`),p=g.getWorldPosition(new THREE.Vector3()),c=f.colliders.find(c=>c.args.at(-1)===`gonden_side_${obj.id}`);assert.ok(Math.abs(p.y-8)<1e-9);assert.ok(Math.abs(p.x-c.args[0])<1e-9);assert.ok(Math.abs(p.z-c.args[1])<1e-9);assert.equal(c.args[5],8);assert.ok(Math.abs(c.args[4]-.7)<1e-9);}
 let lights=0;f.root.traverse(o=>{if(o.isLight)lights++;});assert.equal(lights,0);
 assert.equal(buildGondenSurroundings(f.root,{},f.surfaces,{},f.colliders),record);assert.equal(f.colliders.length,4);
});
test('mapped walking corridor prevents side furniture rather than narrowing route',()=>{const f=fixture();f.surfaces.segments=[{a:[-100,8,-20],b:[100,8,-20],width:100}];const r=buildGondenSurroundings(f.root,{},f.surfaces,{},f.colliders);assert.equal(r.objects.length,0);assert.equal(r.skipped.length,4);assert.equal(f.colliders.length,0);});
test('uneven or missing ground prevents floating furniture',()=>{for(const height of [()=>NaN,(x,z)=>x+z]){const f=fixture();f.surfaces.height=height;assert.equal(buildGondenSurroundings(f.root,{},f.surfaces,{},f.colliders).objects.length,0);}});
test('existing lantern prevents duplicate and unrelated solids are retained',()=>{const f=fixture();f.shrine.updateWorldMatrix(true,false);const p=new THREE.Vector3(4.55,0,-2.65).applyMatrix4(f.shrine.matrixWorld),existing={type:'cylinder',args:[p.x,p.z,.25,8,12,'lantern']};f.colliders.push(existing);const r=buildGondenSurroundings(f.root,{},f.surfaces,{},f.colliders);assert.ok(!r.objects.some(o=>o.id==='dark lantern'));assert.equal(f.colliders[0],existing);});
test('tilted transforms fail before scene or collider mutation',()=>{const f=fixture();f.shrine.rotation.x=.1;assert.throws(()=>buildGondenSurroundings(f.root,{},f.surfaces,{},f.colliders),/upright/);assert.equal(f.colliders.length,0);assert.equal(f.shrine.children.length,0);});
test('photo-visible wall cladding preserves interaction mesh and existing front facade',()=>{const f=fixture(),body=new THREE.Mesh(new THREE.BoxGeometry(6.2,3.1,4.2),new THREE.MeshStandardMaterial());body.userData.onInteract=()=>true;body.position.y=2.25;f.shrine.add(body);f.shrine.userData.gondenFacadeR65={frontBays:5};const callback=body.userData.onInteract,material=body.material;const r=buildGondenSurroundings(f.root,{},f.surfaces,{},f.colliders);assert.equal(r.sideFacade,true);assert.equal(body.parent,f.shrine);assert.equal(body.material,material);assert.equal(body.userData.onInteract,callback);const side=f.root.getObjectByName('Gonden photographed white side and vermilion frame');assert.ok(side.children.length>5);for(const mesh of side.children){mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.min.x+mesh.position.x>3.099);}assert.equal(r.objects.filter(o=>o.id==='rear side roofed screen').length,1);});
test('every rotated gable roofline beam corner stays below the inherited roof envelope',()=>{
 const f=fixture();f.shrine.userData.gondenFacadeR65={frontBays:5};buildGondenSurroundings(f.root,{},f.surfaces,{},f.colliders);
 const roofHeight=z=>{const t=Math.abs(z+.60)/(z>=-.60?4.15:2.45);return 5.45-1.64*(1-(1-t)**2)+.14*t**8;};
 const side=f.root.getObjectByName('Gonden photographed white side and vermilion frame'),beams=side.children.filter(o=>o.name==='Gonden side recessed roofline segment');assert.ok(beams.length>25);
 for(const beam of beams){beam.updateMatrix();const p=beam.geometry.attributes.position;for(let i=0;i<p.count;i++){const corner=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(beam.matrix);assert.ok(corner.y<roofHeight(corner.z)-.15,`Beam corner ${corner.toArray()} crosses roof`);}}
});
