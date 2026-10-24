import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {buildKumatakaDetailsR101} from './kumataka-details-r101.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const localBounds=group=>{const bounds=new THREE.Box3();for(const mesh of group.children){mesh.geometry.computeBoundingBox();bounds.union(mesh.geometry.boundingBox);}return bounds;};
function fixture(){
  const root=new THREE.Group(),owner=new THREE.Group(),entry=new THREE.Group();owner.userData.kumatakaRegistrationR97=true;root.add(owner);owner.add(entry);entry.name='Kumataka southwest entry temizuya source-relative bay R97';
  entry.position.set(540.8168266467086,66.312874,-130.67418475988063);entry.rotation.y=-Math.atan2(.8730869868258527,-.487564471055217);
  const basin=new THREE.Mesh(new THREE.BoxGeometry(1.5,.82,1.1),new THREE.MeshStandardMaterial());basin.position.y=.43;entry.add(basin);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-1.1,2.3,-.9,1.1,2.3,-.9,-1.1,2.64,0,-1.1,2.64,0,1.1,2.3,-.9,1.1,2.64,0,-1.1,2.3,.9,1.1,2.3,.9,-1.1,2.64,0,-1.1,2.64,0,1.1,2.3,.9,1.1,2.64,0],3));
  const roof=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#666e65'}));entry.add(roof);
  const interaction=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial());interaction.userData.interactable={onTrigger:()=>42};owner.add(interaction);
  return {root,owner,entry,basin,roof,interaction};
}
test('source-confirmed entry fittings use three bounded static batches and preserve accepted owners',()=>{
  const f=fixture(),original=[...f.entry.children],callback=f.interaction.userData.interactable,position=f.entry.position.clone(),rotation=f.entry.rotation.clone();
  const r=buildKumatakaDetailsR101(f.root);assert.ok(r);assert.equal(r.batches,3);assert.ok(r.triangles<1200);assert.equal(f.interaction.userData.interactable,callback);assert.equal(callback.onTrigger(),42);assert.ok(f.entry.position.equals(position));assert.ok(f.entry.rotation.equals(rotation));
  for(const o of original)assert.equal(o.parent,f.entry);assert.equal(f.basin.geometry.parameters.height,.82);assert.equal(f.roof.geometry.attributes.position.count,12);
  const bounds=localBounds(r.group);assert.ok(bounds.min.x>=-1.1&&bounds.max.x<=1.1);assert.ok(bounds.min.z>=-.9&&bounds.max.z<=.9);assert.ok(bounds.min.y>=1.68&&bounds.max.y<=2.65);
  const wood=r.group.children.find(o=>o.material.color.getHexString()==='726754'),vertices=wood.geometry.attributes.position;
  const partBounds=start=>new THREE.Box3().setFromPoints(Array.from({length:36},(_,i)=>new THREE.Vector3().fromBufferAttribute(vertices,start+i)));
  const joint=partBounds(0).intersect(partBounds(36)).getSize(new THREE.Vector3());assert.ok(joint.x>.019&&joint.y>.009&&joint.z>.099,'actual kingpost and tie-beam triangle bounds have positive contact in all axes');
  r.group.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
  f.root.updateMatrixWorld(true);const origin=new THREE.Vector3(2,1.78,.23).applyMatrix4(f.entry.matrixWorld),direction=new THREE.Vector3(-1,0,0).transformDirection(f.entry.matrixWorld);
  assert.ok(new THREE.Raycaster(origin,direction,0,3).intersectObject(r.group,true).length>0,'photographed straw bundle has actual visible geometry');
  assert.equal(buildKumatakaDetailsR101(f.root),null);
});
test('actual registered detail footprint clears full public paving plus player radius',()=>{
  const f=fixture(),r=buildKumatakaDetailsR101(f.root);f.root.updateMatrixWorld(true);const local=localBounds(r.group),poly=[[local.min.x,local.min.z],[local.max.x,local.min.z],[local.max.x,local.max.z],[local.min.x,local.max.z]].map(([x,z])=>{const p=new THREE.Vector3(x,0,z).applyMatrix4(f.entry.matrixWorld);return [p.x,p.z];});
  assert.ok(poly.every(p=>p[0]>539&&p[0]<543&&p[1]>-133&&p[1]<-129),'clearance is evaluated at the actual world bay, not a twice-transformed bound');
  for(const path of features.paths.filter(p=>['way/626313754','way/301527750'].includes(p.id)))for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),half=(parseFloat(path.tags.width)||2)/2+.28,n=[-dz/len*half,dx/len*half];
    const strip=[[a[0]+n[0],a[2]+n[1]],[b[0]+n[0],b[2]+n[1]],[b[0]-n[0],b[2]-n[1]],[a[0]-n[0],a[2]-n[1]]];assert.ok(Math.abs(polygonArea(clipConvex(poly,strip)))<1e-6);
  }
});
test('unrecognized source contracts fail before adding partial fittings',()=>{
  for(const invalid of ['roof','owner']){const f=fixture();if(invalid==='roof')f.roof.material.color.set('#000000');else delete f.owner.userData.kumatakaRegistrationR97;const children=[...f.entry.children];assert.equal(buildKumatakaDetailsR101(f.root),null);assert.deepEqual(f.entry.children,children);}
});
