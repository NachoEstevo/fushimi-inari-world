import * as THREE from 'three';
import {polygonArea} from './entrance-area-surfaces-layout.mjs';
const APRONS=new Set(['way/105449677','way/105449728','way/751194635','way/751194637','way/1106589423']);
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[2])),Math.max(...p.map(v=>v[2]))];
const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
const area3=p=>{let a=0;for(let i=1;i<p.length-1;i++)a+=new THREE.Vector3(...p[i].slice(0,3)).sub(new THREE.Vector3(...p[0].slice(0,3))).cross(new THREE.Vector3(...p[i+1].slice(0,3)).sub(new THREE.Vector3(...p[0].slice(0,3)))).length()/2;return a;};
function half(poly,a,b,inside){
 const distance=p=>((b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0]))*(inside?1:-1);
 const out=[];if(!poly.length)return out;let previous=poly.at(-1),dp=distance(previous);
 for(const current of poly){const dc=distance(current),prevIn=inside?dp>=0:dp>0,curIn=inside?dc>=0:dc>0;if(prevIn!==curIn){const t=dp/(dp-dc);out.push(previous.map((v,i)=>v+(current[i]-v)*t));}if(curIn)out.push(current);previous=current;dp=dc;}return out;
}
// Keep XYZ (and any additional vertex attributes) through the clipping. A
// vertical face has zero projected area but nonzero real area and is valid.
export function subtractApronPrismsR100(polygon,apronTriangles){
 let pieces=[polygon];
 for(const triangle of apronTriangles){let clip=triangle.map(v=>[v[0],v[2]]);if(polygonArea(clip)<0)clip=clip.toReversed();const box=bounds(triangle);
  pieces=pieces.flatMap(poly=>{if(!overlaps(bounds(poly),box))return [poly];let remainder=poly;const outside=[];for(let i=0;i<3&&remainder.length;i++){const a=clip[i],b=clip[(i+1)%3],part=half(remainder,a,b,false);if(area3(part)>1e-10)outside.push(part);remainder=half(remainder,a,b,true);}return outside;});
 }
 return pieces;
}
const triangles=polys=>polys.flatMap(p=>p.slice(1,-1).map((_,i)=>[p[0],p[i+1],p[i+2]]).filter(t=>area3(t)>1e-10));

export function prepareMikoshikoApronTransitionsR100(root){
 const miko=root.getObjectByName('Mikoshiko precinct R93'),apron=root.getObjectByName('Mapped sanctuary side approach aprons');
 if(!miko?.userData.built||!miko.userData.courtBoundsLocal||!apron?.geometry?.attributes.position)return {built:false,reason:'registered-prebatch-court-and-apron-required'};
 root.updateWorldMatrix(true,true);const {floor,width,depth,foundationBottom}=miko.userData;
 if(![floor,width,depth,foundationBottom].every(Number.isFinite))return {built:false,reason:'registered-court-dimensions-required'};
 const [lo,hi,back,front]=miko.userData.courtBoundsLocal,court=[[lo,0,back],[hi,0,back],[hi,0,front],[lo,0,front]].map(p=>new THREE.Vector3(...p).applyMatrix4(miko.matrixWorld).toArray()),b=bounds(court),region=[b[0]-1.8,b[1]+1.8,b[2]-1.8,b[3]+1.8],cuts=[];
 const g=apron.geometry.index?apron.geometry.toNonIndexed():apron.geometry,p=g.attributes.position;
 for(let i=0;i<p.count;i+=3){const t=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(p,i+k).applyMatrix4(apron.matrixWorld).toArray());if(overlaps(bounds(t),region)&&t.every(v=>Math.abs(v[1]-(floor+.105))<.003)&&Math.abs(polygonArea(t.map(v=>[v[0],v[2]])))>1e-8)cuts.push(t);}
 if(g!==apron.geometry)g.dispose();if(!cuts.length)return {built:false,reason:'registered-apron-level-required'};
 const report={built:true,revision:'R100',apronTriangles:cuts.length,region,apronLevel:floor+.105,source:'2021 registered Mikoshiko court photograph; actual sanctuary apron triangles',curbInputTriangles:0,curbOutputTriangles:0,removedCurbArea:0,courtRemovedArea:0,walkingChanged:false,terrainChanged:false,collidersAdded:0};
 // The only existing court geometry eligible for removal is its original
 // outer-west vertical box face BELOW the real apron. Preserve its top,
 // pickets, building and every exterior part of that vertical face.
 for(const mesh of miko.children){if(!mesh.isMesh||!mesh.geometry?.attributes.position)continue;const old=mesh.geometry,geo=old.index?old.toNonIndexed():old,attrs=Object.entries(geo.attributes),pos=geo.attributes.position,output=Object.fromEntries(attrs.map(([k])=>[k,[]]));let changed=false;
  for(let i=0;i<pos.count;i+=3){const local=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(pos,i+k)),eligible=local.every(v=>Math.abs(v.x-lo)<1e-5&&v.y>=foundationBottom-floor-1e-5&&v.y<=.09+1e-5&&v.z>=back-1e-5&&v.z<=front+1e-5);
   const preserve=()=>{for(const [key,a]of attrs)for(let k=0;k<3;k++)for(let j=0;j<a.itemSize;j++)output[key].push(a.array[(i+k)*a.itemSize+j]);};
   if(!eligible){preserve();continue;}
   const vertices=[0,1,2].map(k=>{const world=local[k].clone().applyMatrix4(mesh.matrixWorld).toArray();return [...world,...attrs.filter(([key])=>key!=='position').flatMap(([,a])=>Array.from({length:a.itemSize},(_,j)=>a.array[(i+k)*a.itemSize+j]))];});
   const result=eligible?triangles(subtractApronPrismsR100(vertices,cuts)):[vertices],removed=area3(vertices)-result.reduce((n,t)=>n+area3(t),0);if(removed>1e-8){changed=true;report.courtRemovedArea+=removed;}
   else{preserve();continue;}
   for(const tri of result)for(const v of tri){const q=new THREE.Vector3(...v.slice(0,3)).applyMatrix4(mesh.matrixWorld.clone().invert());output.position.push(...q.toArray());let offset=3;for(const [key,a]of attrs)if(key!=='position'){output[key].push(...v.slice(offset,offset+a.itemSize));offset+=a.itemSize;}}
  }
  if(changed){const next=new THREE.BufferGeometry();for(const [key,a]of attrs)next.setAttribute(key,new THREE.Float32BufferAttribute(output[key],a.itemSize,a.normalized));next.computeBoundingBox();next.computeBoundingSphere();mesh.geometry=next;old.dispose();}if(geo!==old)geo.dispose();
 }
 return {built:true,report,partitionEdges(vertices,segment){
  if(!APRONS.has(segment?.id)||segment.stair)return vertices;
  if(vertices.length%9||!vertices.every(Number.isFinite))throw new TypeError('Curb triangles must be finite XYZ triples');
  const out=[];for(let i=0;i<vertices.length;i+=9){const t=[0,3,6].map(k=>vertices.slice(i+k,i+k+3)),max=Math.max(...t.map(v=>v[1])),min=Math.min(...t.map(v=>v[1]));
   if(!overlaps(bounds(t),region)||Math.abs(max-(floor+.165))>.003||min<floor-.31){out.push(...vertices.slice(i,i+9));continue;}
   const result=triangles(subtractApronPrismsR100(t,cuts));report.curbInputTriangles++;report.curbOutputTriangles+=result.length;report.removedCurbArea+=area3(t)-result.reduce((n,p)=>n+area3(p),0);for(const tri of result)out.push(...tri.flat());
  }return out;
 }};
}
