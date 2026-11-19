import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSurfacePicker,installSurfacePickAudit} from './surface-pick-audit.mjs';

function fixture() {
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,1,.1,150);
  const options={scene,camera,assembly:{colliders:[],legacy:{interactables:[]}},features:{buildings:[]}};
  function panel(name,z,parent=scene) {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({color:'#a72a33'}));
    mesh.name=name;mesh.position.z=z;parent.add(mesh);return mesh;
  }
  return {scene,camera,options,panel};
}

test('surface pick follows visible rendered hierarchy and camera layers within a bounded ray',()=>{
  const f=fixture(),group=new THREE.Group();group.visible=false;f.scene.add(group);
  f.panel('hidden ancestor',-.8,group);
  f.panel('invisible material',-1).material.visible=false;
  f.panel('fully transparent glass',-1.2).material.setValues({transparent:true,opacity:0});
  f.panel('shadow-only mesh',-2).layers.set(1);
  const overlay=f.panel('route aid excluded by owner',-2.5);
  const facade=f.panel('facade',-3);
  f.panel('too distant',-100);
  const pick=createSurfacePicker({...f.options,exclude:()=>[overlay]});
  const hit=pick();assert.equal(hit.hit.object.name,'facade');
  assert.deepEqual(hit.hit.point,[0,0,-3]);assert.equal(hit.ray.maxDistance,45);
  assert.equal(createSurfacePicker({...f.options,maxDistance:2,exclude:[overlay]})().hit,null);
  facade.visible=false;
  assert.equal(createSurfacePicker({...f.options,maxDistance:999,exclude:[overlay]})().hit,null);
  assert.equal(pick({ndc:[NaN,0]}),null);
});

test('instance triangle, orientation and material are recovered in world coordinates',()=>{
  const f=fixture(),owner=new THREE.Group();owner.name='Recorded eave';owner.userData.sourceFeature='way/1';owner.position.set(2,0,0);f.scene.add(owner);
  const material=new THREE.MeshBasicMaterial({color:'#847053'});material.name='Timber';
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(2,2),material,2);mesh.name='Two planes';owner.add(mesh);
  mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(8,0,-2));
  mesh.setMatrixAt(1,new THREE.Matrix4().makeRotationY(Math.PI/4).setPosition(0,0,-4));
  f.camera.position.set(2,0,0);
  const {hit}=createSurfacePicker(f.options)();
  assert.deepEqual(hit.point,[2,0,-4]);
  assert.equal(hit.triangle.instanceId,1);assert.equal(hit.triangle.batchId,null);
  assert.ok(hit.triangle.index>=0&&hit.triangle.indices.length===3);
  assert.ok(hit.triangle.vertices.every(([x,,z])=>Math.abs(x+z+2)<1e-6),'rotated vertices lie on the final hit plane');
  assert.deepEqual(hit.triangle.orientation,{normal:[.707107,0,.707107],yawDegrees:45,slopeDegrees:90,facesCamera:true});
  assert.equal(hit.material.name,'Timber');assert.equal(hit.material.color,'847053');
  assert.equal(hit.owner.sourceFeature,'way/1');assert.equal(hit.ownerEvidence,'scene ancestry');
});

test('mapped footprints, nearby colliders and actions remain proximity evidence for a static batch',()=>{
  const f=fixture(),batch=f.panel('Static sector 4,-2',-5);batch.userData.staticSector=[4,-2];
  const real=new THREE.Group();real.position.set(.3,0,-5);real.userData.interactable={title:'Touch lantern'};f.scene.add(real);
  const hidden=new THREE.Group();hidden.position.set(.01,0,-5);hidden.visible=false;hidden.userData.interactable={title:'Invisible'};f.scene.add(hidden);
  f.options.assembly.legacy.interactables.push(hidden,real);
  f.options.assembly.colliders.push({type:'cylinder',args:[0,-5,.2,5,7,'above ray']},{type:'box',args:[1,-5,.5,.25,Math.PI/2,-1,1,'near slab']});
  f.options.features.buildings.push({id:'way/101',tags:{name:'Mapped shop'},points:[[-1,0,-6],[1,0,-6],[1,0,-4],[-1,0,-4],[-1,0,-6]]});
  const {hit}=createSurfacePicker(f.options)();
  assert.equal(hit.owner.name,batch.name);assert.deepEqual(hit.owner.staticSector,[4,-2]);
  assert.equal(hit.owner.sourceFeature,undefined);assert.match(hit.ownerEvidence,/source mesh unavailable/);
  assert.deepEqual(hit.proximity.footprints,[{id:'way/101',name:'Mapped shop',relation:'projected inside footprint',distance:0}]);
  assert.equal(hit.proximity.collider.tag,'near slab');assert.equal(hit.proximity.collider.distance,.75);
  assert.equal(hit.proximity.interactable.title,'Touch lantern');assert.equal(hit.proximity.interactable.distance,.3);
});

test('only explicit center and canvas requests report a hit and disposing removes the handlers',()=>{
  const f=fixture(),target=f.panel('face',-3),records=[],keys=new Map(),pointers=new Map();let blocked=false;
  const element={ownerDocument:{addEventListener:(k,fn)=>keys.set(k,fn),removeEventListener:k=>keys.delete(k)},
    addEventListener:(k,fn)=>pointers.set(k,fn),removeEventListener:k=>pointers.delete(k),
    getBoundingClientRect:()=>({left:30,top:20,width:100,height:100})};
  const api=installSurfacePickAudit({...f.options,element,onPick:data=>records.push(data),isBlocked:()=>blocked});
  const key=(code,extra={})=>keys.get('keydown')({code,preventDefault(){},...extra});
  key('KeyA');key('KeyI',{repeat:true});assert.equal(records.length,0);
  key('KeyI');assert.equal(records[0].hit.object.id,target.id);assert.deepEqual(records[0].ray.ndc,[0,0]);
  const pointer={clientX:90,clientY:70,button:0,preventDefault(){},stopImmediatePropagation(){}};
  pointers.get('pointerdown')(pointer);assert.equal(records.length,1);
  pointers.get('pointerdown')({...pointer,altKey:true});assert.ok(Math.abs(records[1].ray.ndc[0]-.2)<1e-6);
  blocked=true;assert.equal(api.pick(),null);
  api.dispose();assert.equal(keys.size+pointers.size,0);assert.equal(api.pick(),null);
});
