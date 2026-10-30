import * as THREE from 'three';
import {rigidPoint} from './spatial.mjs';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {courtCuts} from './precinct-shrine-courts.mjs';
import {createStartupCheckpoint,yieldStartupTask} from './startup-work.mjs';

// IMG_6491_20210317: pale stone between the north gallery plinth and the
// grated court junction. The R72 drain's inner frame ends at z=-2.955;
// this strip leaves 6 cm beside it and stops before the existing gallery rail.
export const romonDripApronR94=Object.freeze({x0:-19.5,x1:-5.6,z0:-2.895,z1:-2.44,tileLength:.80,joint:.009});
const name='Romon north gallery granite drip apron R94';
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];

// Call after the shared rendered terrain has been finalized. No fallback to
// raw DEM/analytic height: every emitted vertex lies on an actual source face.
export function buildRomonPrecinctR94(root,romon,features,network,materials,{terrainPositions}={}){
 const work=romonPrecinctWork(root,romon,features,network,materials,terrainPositions);let step=work.next();
 while(!step.done)step=work.next();return step.value;
}
export async function buildRomonPrecinctR94Async(root,romon,features,network,materials,{terrainPositions,yieldWork=yieldStartupTask,clock}={}){
 const checkpoint=createStartupCheckpoint({yieldWork,clock}),work=romonPrecinctWork(root,romon,features,network,materials,terrainPositions);let step=work.next();
 while(!step.done){const pause=checkpoint();if(pause)await pause;step=work.next();}return step.value;
}
function* romonPrecinctWork(root,romon,features,network,materials,terrainPositions){
 const old=root.getObjectByName(name);if(old)return old.userData;
 if(!terrainPositions?.length||!(materials.entryStoneMat??materials.stoneMat))return {built:false,reason:'Rendered terrain triangles and stone material required'};
 let checked=0;
 if(terrainPositions.length%9||!terrainPositions.every(value=>{checked++;return Number.isFinite(value);})||checked!==terrainPositions.length)throw Error('Invalid Romon terrain triangles');
 const s=romonDripApronR94,world=(x,z)=>{const p=rigidPoint([x,0,z],romon.source,romon.target,romon.yaw);return [p[0],p[2]];};
 const outline=[world(s.x0,s.z0),world(s.x1,s.z0),world(s.x1,s.z1),world(s.x0,s.z1)],region=bounds(outline);
 // The own mapped roof overhang is not a ground obstruction. Its physical
 // plinth is already separated by the canonical local z limit above.
 const cuts=courtCuts({...features,buildings:(features.buildings??[]).filter(b=>b.id!=='way/105449733')},network,region);
 const tiles=[],count=Math.ceil((s.x1-s.x0)/s.tileLength),pitch=(s.x1-s.x0)/count;
 for(let i=0;i<count;i++){
  const a=s.x0+i*pitch+s.joint/2,b=s.x0+(i+1)*pitch-s.joint/2;
  const polygon=[world(a,s.z0),world(b,s.z0),world(b,s.z1),world(a,s.z1)];
  tiles.push(...cuts.reduce((ps,c)=>ps.flatMap(p=>subtractConvex(p,c)),[polygon]));
 }
 const positions=[],uv=[];let area=0;
 for(let i=0;i<terrainPositions.length;i+=9){
  if(i%2304===0)yield;
  // This narrow apron covers very few world triangles. Preserve the inclusive
  // original bounds while rejecting remote faces before allocating polygons.
  if(Math.min(terrainPositions[i],terrainPositions[i+3],terrainPositions[i+6])>region[1]||Math.max(terrainPositions[i],terrainPositions[i+3],terrainPositions[i+6])<region[0]||Math.min(terrainPositions[i+2],terrainPositions[i+5],terrainPositions[i+8])>region[3]||Math.max(terrainPositions[i+2],terrainPositions[i+5],terrainPositions[i+8])<region[2])continue;
  const tri=[0,3,6].map(k=>Array.from(terrainPositions.slice(i+k,i+k+3))),flat=tri.map(p=>[p[0],p[2]]);
  if(!overlaps(bounds(flat),region))continue;
  const [a,b,c]=tri,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;
  const height=(x,z)=>{const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;return u*a[1]+v*b[1]+(1-u-v)*c[1];};
  const dx=b[0]-a[0],dz=b[2]-a[2],ex=c[0]-a[0],ez=c[2]-a[2],det=dx*ez-ex*dz;
  if(Math.hypot(((b[1]-a[1])*ez-(c[1]-a[1])*dz)/det,(dx*(c[1]-a[1])-ex*(b[1]-a[1]))/det)>.35)continue;
  for(const tile of tiles){
   let p=clipConvex(tile,flat);if(polygonArea(p)<0)p=p.toReversed();
   for(let j=1;j<p.length-1;j++){
    const points=[p[0],p[j+1],p[j]],size=Math.abs(polygonArea(points));if(size<1e-10)continue;area+=size;
    for(const [x,z]of points){positions.push(x,height(x,z)+.006,z);uv.push(x/1.2,z/1.2);}
   }
  }
 }
 if(!positions.length)return {built:false,reason:'No gentle rendered terrain remains after mapped exclusions'};
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const mesh=new THREE.Mesh(geometry,materials.entryStoneMat??materials.stoneMat);mesh.name=name;mesh.receiveShadow=true;
 mesh.userData={built:true,area,tiles:count,triangles:positions.length/9,materialBatches:1,collidersAdded:0,terrainOffset:.006,walkingUnchanged:true,provenance:'https://fushimiinari-guide.com/wp-content/uploads/IMG_6491_20210317.jpg visually inspected: pale stone apron beside existing north Kairo grating; dimensions, joints and registration inferred from inherited wing and R72 drain. North only; no mirrored south feature claimed.'};
 root.add(mesh);return mesh.userData;
}
