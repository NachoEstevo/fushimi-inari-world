import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {staticParts,stonePalette} from './mountain-landmarks-geometry.mjs';
import {addShinmeHorse} from './shinme-horse-geometry.mjs';
import {shinmeHorseForm} from './shinme-horse-form.mjs';

test('horse stands on four hooves inside the original display footprint',()=>{
  const group=new THREE.Group(),parts=staticParts(group),palette=stonePalette({}),z=-1.7;
  addShinmeHorse(parts,palette,z);
  const stats=parts.flush();
  const bounds=new THREE.Box3().setFromObject(group);
  assert.ok(bounds.min.x>-1.45 && bounds.max.x<1.25);
  assert.ok(Math.abs(bounds.min.y-.35)<1e-5 && bounds.max.y<2.8 && bounds.max.y>2.5);
  assert.ok(bounds.min.z>z-.4 && bounds.max.z<z+.4);
  const contacts=new Set();
  group.traverse(o=>{
    if(!o.isMesh)return;
    for(const attribute of Object.values(o.geometry.attributes))for(const n of attribute.array)assert.ok(Number.isFinite(n));
    const p=o.geometry.attributes.position;
    for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)-.35)<1e-5){
      const x=p.getX(i),dz=p.getZ(i)-z;
      if(Math.abs(x)>.25 && Math.abs(dz)>.06)contacts.add(`${Math.sign(x)},${Math.sign(dz)}`);
    }
  });
  assert.deepEqual([...contacts].sort(),['-1,-1','-1,1','1,-1','1,1']);
  const skin=group.children.find(o=>o.material===palette.paper).geometry.attributes.position;
  const hooves=group.children.find(o=>o.material===palette.shaded).geometry.attributes.position;
  for(const side of [-1,1])for(const x of [-.51+side*.015,.57+side*.015]){
    const nearFoot=(p,i,r)=>Math.hypot(p.getX(i)-x,p.getZ(i)-(z+side*.14))<r&&p.getY(i)<.6;
    let legBottom=Infinity,hoofTop=-Infinity;
    for(let i=0;i<skin.count;i++)if(nearFoot(skin,i,.06))legBottom=Math.min(legBottom,skin.getY(i));
    for(let i=0;i<hooves.count;i++)if(nearFoot(hooves,i,.1))hoofTop=Math.max(hoofTop,hooves.getY(i));
    assert.ok(legBottom<=hoofTop+.001,`leg must meet its hoof: ${legBottom} > ${hoofTop}`);
  }
  assert.ok(stats.batches<=5);
  assert.ok(stats.triangles<3200);
});

test('the carved body is one closed surface',()=>{
  const geometry=shinmeHorseForm(0),index=geometry.index,parents=Array.from({length:geometry.attributes.position.count},(_,i)=>i);
  const root=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
  const edges=new Map();
  for(let i=0;i<index.count;i+=3){
    const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);
    parents[root(a)]=root(b);parents[root(b)]=root(c);
    for(const [x,y] of [[a,b],[b,c],[c,a]]){
      const key=x<y?`${x},${y}`:`${y},${x}`;edges.set(key,(edges.get(key)??0)+1);
    }
  }
  assert.equal(new Set(parents.map((_,i)=>root(i))).size,1);
  assert.ok([...edges.values()].every(count=>count===2));
});
