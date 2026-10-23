import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildOmotesandoFrontageR96,omotesandoFrontageIdR96} from './omotesando-frontage-r96.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),height=(x,z)=>34+.025*(x+150)+.035*z;
test('mapped three-storey envelope and footprint replace generic owner once',()=>{
 const root=new THREE.Group(),colliders=[],r=buildOmotesandoFrontageR96(root,features,{height},{},colliders);
 assert.deepEqual(r.builtIds,[omotesandoFrontageIdR96]);assert.equal(r.overallHeight,9);assert.equal(r.drawBatches,7);assert.equal(r.facades.length,2);assert.equal(r.facades[0].edge,0);assert.equal(r.facades[1].edge,1);
 const count=colliders.length;assert.equal(r.wallColliders,4);assert.ok(count>=5&&count<=8);assert.equal(r.collidersAdded,count);assert.equal(r.triangles,r.group.children.reduce((sum,mesh)=>sum+mesh.geometry.attributes.position.count/3,0));assert.equal(buildOmotesandoFrontageR96(root,features,{height},{},colliders).group,r.group);assert.equal(colliders.length,count);
 const f=features.buildings.find(b=>b.id===omotesandoFrontageIdR96);assert.deepEqual(r.footprint,f.points.slice(0,-1));
 root.traverse(o=>{if(o.isMesh){for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));for(let i=0;i<o.geometry.attributes.position.count;i++)assert.ok(o.geometry.attributes.position.getY(i)<=r.top+.0001);}});
});
test('middle gallery is a real .64m recess with rear glazing and front rail',()=>{
 const root=new THREE.Group(),r=buildOmotesandoFrontageR96(root,features,{height}),p=root.getObjectByName('R96 apartment recess glazing').geometry.attributes.position,rail=root.getObjectByName('R96 apartment gallery rail').geometry.attributes.position;
 const a=r.footprint[1],b=r.footprint[2],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),inset=(x,z)=>((x-a[0])*dz-(z-a[2])*dx)/len;
 let count=0;for(let i=0;i<p.count;i++)if(p.getY(i)>r.floor+3.8&&p.getY(i)<r.floor+5.9&&p.getX(i)>a[0]+1&&p.getX(i)<b[0]-1){assert.ok(inset(p.getX(i),p.getZ(i))>=.5599);count++;}assert.ok(count>10);
 for(let i=0;i<rail.count;i++)if(rail.getX(i)>a[0]+1&&rail.getX(i)<b[0]-1)assert.ok(inset(rail.getX(i),rail.getZ(i))<.13);
});
test('wall seats bury into actual terrain and collision leaves source road and approach open',()=>{
 const root=new THREE.Group(),colliders=[],r=buildOmotesandoFrontageR96(root,features,{height},{},colliders),world=new SpatialCollisionWorld();for(const c of colliders){world.addBox(...c.args);const [x,z,,,,bottom]=c.args;assert.ok(bottom<height(x,z));}
 for(const id of ['way/79699850','way/105449722']){const p=features.paths.find(p=>p.id===id);for(let j=1;j<p.points.length;j++){const a=p.points[j-1],b=p.points[j];for(let i=0;i<=50;i++){const x=a[0]+(b[0]-a[0])*i/50,z=a[2]+(b[2]-a[2])*i/50,result=world.resolvePlayer(x,height(x,z)+1.7,z);assert.ok(Math.hypot(result.x-x,result.z-z)<1e-7);}}}
 assert.ok(r.seats.every(Number.isFinite));
 for(let edge=0;edge<4;edge++){const a=r.footprint[edge],b=r.footprint[(edge+1)%4],c=colliders[edge].args,length=Math.hypot(b[0]-a[0],b[2]-a[2]);assert.ok(Math.abs(c[2]-length/2)<1e-9);assert.equal(c[3],.08);assert.equal(c[6],r.top);for(let i=0;i<=100;i++){const x=a[0]+(b[0]-a[0])*i/100,z=a[2]+(b[2]-a[2])*i/100;assert.ok(c[5]<height(x,z));}}
});
test('missing source or nonfinite surface cannot silently create a guessed facade',()=>{
 assert.deepEqual(buildOmotesandoFrontageR96(new THREE.Group(),{buildings:[]},{height}).builtIds,[]);
 assert.throws(()=>buildOmotesandoFrontageR96(new THREE.Group(),features,{height:()=>NaN}),/Nonfinite/);
});
test('horizontal gallery ceramic surfaces preserve metric tile scale through slab depth',()=>{
 const root=new THREE.Group();buildOmotesandoFrontageR96(root,features,{height});
 const geometry=root.getObjectByName('R96 apartment ceramic shell').geometry,p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;let checked=0;
 for(let i=0;i<p.count;i+=3){if(Math.abs(n.getY(i))<.99)continue;for(const j of [i+1,i+2]){const worldDistance=Math.hypot(p.getX(j)-p.getX(i),p.getZ(j)-p.getZ(i)),textureDistance=Math.hypot(uv.getX(j)-uv.getX(i),uv.getY(j)-uv.getY(i))*.64;assert.ok(Math.abs(worldDistance-textureDistance)<.00003,`ceramic horizontal metric scale ${worldDistance} versus ${textureDistance}`);checked++;}}
 assert.ok(checked>100);
});
test('new source frontage hedge keeps roof entry, first torii and existing prop gaps',()=>{
 const r=buildOmotesandoFrontageR96(new THREE.Group(),features,{height});assert.ok(r.hedgeCells.length>15);
 for(const c of r.hedgeCells){assert.ok(c.x<-136.5);assert.ok(!(c.x>-150.42&&c.x<-147.38));assert.ok(Math.hypot(c.x+138.652,c.z-5.021)>=1.32);assert.ok(c.bottom<height(c.x,c.z));}
 const c=r.hedgeCells[5],colliders=[{type:'cylinder',args:[c.x,c.z,.3,0,100,'existing_photo_prop']}],blocked=buildOmotesandoFrontageR96(new THREE.Group(),features,{height},{},colliders);
 assert.ok(blocked.hedgeCells.every(p=>Math.hypot(c.x-p.x,c.z-p.z)>=.62));assert.ok(blocked.hedgeCells.length<r.hedgeCells.length);
});
