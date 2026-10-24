import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {omotesandoArrivalLayoutR94,buildOmotesandoArrivalR94} from './omotesando-arrival-r94.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
test('crossing anchor uses real shared road/approach node and starts before first gate',()=>{
 const l=omotesandoArrivalLayoutR94(features);assert.equal(l.sourceNode,749327076);assert.deepEqual(l.center,[-157.407,10.342]);assert.ok(l.spawn.lookAt[0]-l.center[0]>18);assert.equal(l.stripes.length,6);
 for(const s of l.stripes)assert.ok(Math.abs((s.center[0]-l.center[0])*l.across[0]+(s.center[1]-l.center[1])*l.across[1])+s.width/2<l.roadWidth/2);
});
test('curb ends leave a five metre flush crossing aperture',()=>{
 const l=omotesandoArrivalLayoutR94(features);for(const c of l.curbs){const dx=c.center[0]-l.center[0],dz=c.center[1]-l.center[1],v=dx*l.along[0]+dz*l.along[1];assert.ok(Math.abs(v)-c.length/2>=2.5-1e-8);}
});
test('surface batches follow slopes, have upward tops and repeated build is idempotent',()=>{
 const root=new THREE.Group(),surface={height:(x,z)=>20+x*.02+z*.01},meta=buildOmotesandoArrivalR94(root,features,surface);assert.equal(meta.drawBatches,3);assert.equal(meta.collidersAdded,0);
 assert.equal(buildOmotesandoArrivalR94(root,features,surface),meta);assert.equal(root.children.length,1);
 for(const mesh of root.children[0].children){const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++)assert.ok(Number.isFinite(pos.getY(i)));}
 for(const mesh of root.children[0].children.slice(0,2)){const n=mesh.geometry.attributes.normal;for(let i=0;i<n.count;i++)assert.ok(n.getY(i)>.99);}
});
test('missing geography is explicit and invalid height fails visibly',()=>{assert.equal(omotesandoArrivalLayoutR94({paths:[]}),null);assert.throws(()=>buildOmotesandoArrivalR94(new THREE.Group(),features,{height:()=>NaN}),/Nonfinite/);});

test('paint and in-road gutters seat on asphalt while outside curbs retain their approach height',()=>{
 const l=omotesandoArrivalLayoutR94(features),root=new THREE.Group(),surface={height:()=>42,segments:[{id:l.roadId,a:[l.center[0],20,l.center[1]+20],b:[l.center[0],22,l.center[1]-20],ya:20,yb:22}]};
 buildOmotesandoArrivalR94(root,features,surface);const p=root.children[0].children[0].geometry.attributes.position;
 for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-(21+(l.center[1]-p.getZ(i))*.05+.022))<1e-5);
 const gutter=root.children[0].children[1].geometry.attributes.position;
 for(let i=0;i<gutter.count;i++)assert.ok(Math.abs(gutter.getY(i)-(21+(l.center[1]-gutter.getZ(i))*.05+.014))<1e-5);
 const curb=root.children[0].children[2].geometry.attributes.position;
 for(let i=0;i<curb.count;i++)assert.ok(Math.abs(curb.getY(i)-42)<1e-5||Math.abs(curb.getY(i)-42.09)<1e-5);
 assert.equal(surface.height(...l.center),42,'walking height is unchanged');
});

test('zebra bands follow the road and repeat across the pedestrian route, matching the station reference',()=>{
 const l=omotesandoArrivalLayoutR94(features);
 assert.ok(l.along[1]<-.99);assert.ok(l.across[0]>.99);
 const project=(point,axis)=>(point[0]-l.center[0])*axis[0]+(point[1]-l.center[1])*axis[1];
 const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-4,`${actual} != ${expected}`);
 for(const [i,stripe] of l.stripes.entries()){
  close(project(stripe.center,l.along),0);close(project(stripe.center,l.across),(i-2.5)*.9);
  assert.equal(stripe.width,.43);assert.equal(stripe.length,3.6);
 }
 const root=new THREE.Group(),before=JSON.stringify(features);buildOmotesandoArrivalR94(root,features,{height:()=>0});
 assert.equal(JSON.stringify(features),before,'road and walking path inputs remain unchanged');
 const p=root.children[0].children[0].geometry.attributes.position;
 const verticesPerBand=Math.ceil(3.6/.5)*6;assert.equal(p.count,6*verticesPerBand);
 // Check the rendered vertices, not only layout metadata: each complete band
 // spans 3.6 m along the road, .43 m across, within the flush curb opening.
 for(let band=0;band<6;band++){
  const u=[],v=[];
  for(let i=band*verticesPerBand;i<(band+1)*verticesPerBand;i++){
   const point=[p.getX(i),p.getZ(i)];u.push(project(point,l.across));v.push(project(point,l.along));close(p.getY(i),.022);
  }
  close(Math.max(...u)-Math.min(...u),.43);close(Math.max(...v)-Math.min(...v),3.6);
  close((Math.max(...u)+Math.min(...u))/2,(band-2.5)*.9);
  assert.ok(Math.max(...u)<l.roadWidth/2-.24);assert.ok(Math.min(...u)>-l.roadWidth/2+.24);
  assert.ok(Math.max(...v)<2.5);assert.ok(Math.min(...v)>-2.5);
 }
 for(const gutter of l.gutters){close(Math.abs(project(gutter.center,l.across)),l.roadWidth/2-.12);close(project(gutter.center,l.along),0);assert.equal(gutter.length,26);assert.equal(gutter.width,.24);}
 for(const curb of l.curbs){close(Math.abs(project(curb.center,l.across)),l.roadWidth/2+.04);close(Math.abs(project(curb.center,l.along)),7.75);assert.equal(curb.length,10.5);assert.equal(curb.width,.16);assert.equal(curb.height,.09);}
});
