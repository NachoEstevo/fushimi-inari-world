import * as THREE from 'three';
import {riceSheafCrestGeometry,staticParts} from './mountain-landmarks-geometry.mjs';

const shrineId='way/301554315';
const sourcePhoto='https://cdn-ak.f.st-hatena.com/images/fotolife/h/hayabusa8823/20210319/20210319002904.jpg';
const near=(a,b)=>Math.abs(a-b)<.003;
const hasBox=(mesh,w,h,d)=>{const p=mesh.geometry?.parameters;return p&&near(p.width,w)&&near(p.height,h)&&near(p.depth,d);};

export function refineGozendani(root,features,surfaces,legacy,colliders){
  const owner=root.children.find(o=>o.userData.zone==='gozendani');
  if(!owner||owner.userData.prayerHall)return null;
  const hall=owner.children.find(o=>hasBox(o,4.4,2.8,3.2)&&o.userData.interactable);
  const roof=owner.children.find(o=>hasBox(o,5.6,.55,4.4));
  const base=owner.children.find(o=>hasBox(o,5.2,.55,4.2));
  const curtain=owner.children.find(o=>o.geometry?.parameters?.width===3.6&&o.geometry.parameters.height===.95);
  const candle=owner.children.find(o=>o.isGroup&&near(o.position.x,1.85)&&near(o.position.z,1.45));
  const old=colliders.find(c=>c.args.at(-1)==='gozendani'&&Math.hypot(c.args[0]-owner.position.x,c.args[1]-owner.position.z)<.05);
  const site=features.buildings.find(b=>b.id===shrineId),path=features.paths.find(p=>p.id==='way/60272187');
  if(!hall||!roof||!base||!curtain||!candle||!old||!path||site?.points?.length!==9)return null;
  // The mapped polygon identifies the worship site. The small freestanding
  // hall, photographed separately from the office, occupies only a portion.
  const [a,b]=site.points.slice(1,3),dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
  const t=[dx/len,dz/len],front=[-t[1],t[0]],yaw=Math.atan2(front[0],front[1]);
  const edge=[(a[0]+b[0])/2,(a[2]+b[2])/2],halfW=1.84,halfD=1.62;
  const center=[edge[0]-2.28*front[0],edge[1]-2.28*front[1]];
  const world=(u,v)=>[center[0]+t[0]*u+front[0]*v,center[1]+t[1]*u+front[1]*v];
  const nearest=Math.min(...path.points.map(p=>Math.hypot(edge[0]-p[0],edge[1]-p[2])));
  if(len<15||len>17||nearest>2.5)return null;
  const corners=[[-halfW,-halfD],[halfW,-halfD],[halfW,halfD],[-halfW,halfD]];
  const grades=corners.map(([u,v])=>surfaces.terrainHeight(...world(u,v)));
  if(!grades.every(Number.isFinite))return null;
  const floor=Math.max(...grades)+.04,low=Math.min(...grades)-floor-.06;
  const materials=legacy.materials,red=materials.vermilionMat,stone=materials.entryStoneMat??materials.stoneMat;
  const cover=roof.material.clone();cover.color.set('#717b73');cover.side=THREE.DoubleSide;cover.roughness=.82;
  const cloth=new THREE.MeshStandardMaterial({color:'#432649',roughness:.97,side:THREE.DoubleSide});
  const pale=materials.plasterMat;
  const group=new THREE.Group(),parts=staticParts(group);
  parts.box(3.62,.15-low,3.16,0,(low+.15)/2,0,stone);
  parts.box(2.72,.12,.29,0,.065,1.69,stone);
  // Upper windows and white gable infill between the vermilion timber frame.
  parts.box(3.32,2.42,2.86,0,1.36,-.02,pale);
  for(const u of [-1.68,1.68])for(const v of [-1.46,1.46])parts.box(.15,2.68,.15,u,1.49,v,red);
  for(const v of [-1.46,1.46])for(const h of [.21,1.57,2.26,2.75])parts.box(3.52,.105,.16,0,h,v,red);
  for(const side of [-1,1]){
    const x=side*1.68;
    for(const h of [.22,.83,2.27,2.75])parts.box(.15,.10,3.00,x,h,0,red);
    for(let j=-5;j<=5;j++)parts.box(.076,.57,.08,x,.52,j*.245,red);
    parts.box(.06,.67,2.92,side*1.76,1.97,0,cloth);
    parts.box(.70,.76,.07,side*1.23,1.96,1.55,cloth);
    parts.put(riceSheafCrestGeometry(.215).translate(side*1.23,1.96,1.589),pale);
  }
  for(const u of [-.55,0,.55])parts.box(.06,1.24,.06,u,.85,1.46,red);
  parts.box(1.16,.91,.08,0,.69,1.47,red);
  parts.box(1.22,.20,.10,0,2.0,1.58,cloth);
  const half=2.14,eave=2.79,ridge=3.77;
  const profile=u=>{const f=Math.abs(u/half);return eave+(ridge-eave)*(1-f)**1.35+.105*f**6;};
  for(const v of [-1.53,1.53]){
    parts.sheet([-1.80,2.75,v,1.80,2.75,v,0,ridge-.07,v],pale);
    parts.box(.095,.92,.09,0,3.20,v,red);
    for(const side of [-1,1])parts.beam([0,3.65,v],[side*1.67,2.79,v],.05,red,.05,4);
  }
  // Both faces of the copper roof follow the same swept profile. A small
  // fascia closes its edge and a row of exposed rafters sits in the overhang.
  const z0=-1.86,z1=1.89;
  for(const side of [-1,1])for(let i=0;i<8;i++){
    const u=side*half*i/8,w=side*half*(i+1)/8,y=profile(u),h=profile(w);
    for(const [rise,m] of [[0,cover],[-.095,red]])parts.sheet([u,y+rise,z0,w,h+rise,z0,u,y+rise,z1,w,h+rise,z0,w,h+rise,z1,u,y+rise,z1],m);
    for(const z of [z0,z1])parts.sheet([u,y,z,w,h,z,u,y-.095,z,w,h,z,w,h-.095,z,u,y-.095,z],cover);
  }
  for(const side of [-1,1]){
    parts.box(.10,.12,z1-z0,side*half,profile(half)-.05,(z1+z0)/2,cover);
    for(let j=0;j<13;j++)parts.box(.48,.08,.08,side*1.88,2.78,z0+.12+j*.29,red);
  }
  parts.box(.14,.12,z1-z0+.04,0,ridge,(z1+z0)/2,cover);
  const stats=parts.flush();
  const frame=group.children.find(o=>o.material===red);
  if(!frame)throw Error('Missing Gozendani interactive timber frame');
  // Keep the actual registered pick object and callback. Its new geometry is
  // the red facade and frame that the visitor sees.
  const removedFlames=new Set();candle.traverse(o=>removedFlames.add(o));
  legacy.flickeringCandleMeshes=legacy.flickeringCandleMeshes.filter(o=>!removedFlames.has(o));
  for(const mesh of [roof,base,curtain,candle])mesh.removeFromParent();
  for(const mesh of [roof,base,curtain,hall])mesh.geometry.dispose();
  hall.geometry=frame.geometry;hall.material=red;hall.position.set(0,0,0);frame.removeFromParent();
  owner.position.set(center[0],floor,center[1]);owner.rotation.set(0,yaw,0);owner.add(group);
  old.args=[...center,1.80,1.58,yaw,floor+low,floor+2.79,'gozendani'];
  const report={...stats,poi:shrineId,center:owner.position.toArray(),front,route:path.id,sourcePhoto,
    official:'https://inari.jp/en/map/spot_15/',provenance:'Red frame, pale gables, purple cloth, low stone toe and swept roof based on 2021 photograph. OSM identifies the site; prayer hall dimensions and its position on the path-facing side are inferred.'};
  owner.userData.prayerHall=report;return report;
}
