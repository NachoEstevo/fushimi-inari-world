import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {courtCuts,surface} from './precinct-shrine-courts.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

export const officeGardenPonds=['way/626313848','way/626313851'];
const name='Mapped office garden banks R84';
// Mapped shorelines are authoritative. The narrow planted margin and individual
// stones are photo-informed approximations, not a garden survey or new islands.
export function buildOfficeGardenBanks(root,features,network){
 const prior=root.getObjectByName(name);if(prior)return prior.userData;
 const ponds=(features.water??[]).filter(w=>officeGardenPonds.includes(w.id));
 if(!ponds.length)return {ponds:[],area:0,stones:0};
 const group=new THREE.Group();group.name=name;
 const moss=new THREE.MeshStandardMaterial({color:'#687e38',roughness:1,vertexColors:true});
 const stone=new THREE.MeshStandardMaterial({color:'#a5a397',roughness:1});
 const allPolygons=[],occupied=[],records=[];
 for(const pond of ponds){
  const ring=pond.points.map(p=>[p[0],p[2]]),xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);
  const cuts=courtCuts(features,network,[Math.min(...xs)-1,Math.max(...xs)+1,Math.min(...zs)-1,Math.max(...zs)+1]);
  const polygons=[];
  for(let i=1;i<ring.length;i++){
   const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<.01)continue;
   const nx=-dz/length*.8,nz=dx/length*.8;
   const strip=[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]];
   const pieces=[...cuts,...occupied].reduce((ps,c)=>ps.flatMap(p=>subtractConvex(p,c)),[strip]);
   polygons.push(...pieces);occupied.push(strip);
  }
  // Rounded joins close the exterior wedges between adjacent shoreline strips.
  // They use the same exclusions so concave shore bends never fill the pond.
  for(const [x,z] of ring.slice(0,-1)){
   const join=Array.from({length:12},(_,i)=>[x+.8*Math.cos(i*Math.PI/6),z+.8*Math.sin(i*Math.PI/6)]);
   const pieces=[...cuts,...occupied].reduce((ps,c)=>ps.flatMap(p=>subtractConvex(p,c)),[join]);
   polygons.push(...pieces);occupied.push(join);
  }
  allPolygons.push(...polygons);records.push({id:pond.id,plannedArea:polygons.reduce((n,p)=>n+Math.abs(polygonArea(p)),0)});
 }
 const mesh=surface(allPolygons,network,moss,'Office pond planted margins',{maxSlope:.45});
 if(!mesh){moss.dispose();stone.dispose();return {ponds:[],area:0,stones:0};}
 const p=mesh.geometry.attributes.position,colors=[],stones=[];let area=0;
 for(let i=0;i<p.count;i++){
  const shade=.88+.1*Math.sin(p.getX(i)*2.3)*Math.cos(p.getZ(i)*1.7);colors.push(shade,shade,shade);
 }
 mesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));group.add(mesh);moss.dispose();
 // Sparse low stones stay wholly within accepted planted polygons and on
 // gently graded ground. They do not occupy water, roofs or walking routes.
 const contains=(x,z)=>allPolygons.some(poly=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;});
 for(let i=0;i<p.count;i+=3)area+=Math.abs(polygonArea(Array.from({length:3},(_,j)=>[p.getX(i+j),p.getZ(i+j)])));
 for(let x=70.2;x<85;x+=2.1)for(let z=-110.5;z<-63;z+=2.7){
  if(![[0,0],[.22,0],[-.22,0],[0,.22],[0,-.22]].every(([dx,dz])=>contains(x+dx,z+dz)))continue;
  const ys=[[-.22,-.22],[.22,-.22],[.22,.22],[-.22,.22]].map(([dx,dz])=>network.terrainHeight(x+dx,z+dz));
  if(!ys.every(Number.isFinite)||Math.max(...ys)-Math.min(...ys)>.08)continue;
  const geo=new THREE.IcosahedronGeometry(1,0).scale(.23,.16,.23).rotateY(x+z).translate(x,Math.min(...ys)+.07,z);stones.push(geo);
 }
 if(stones.length){const geo=mergeGeometries(stones);stones.forEach(g=>g.dispose());const rocks=new THREE.Mesh(geo,stone);rocks.name='Office garden low bank stones';rocks.castShadow=rocks.receiveShadow=true;group.add(rocks);}else stone.dispose();
 group.userData={ponds:records,area,stones:stones.length,marginWidth:.8,walkingUnchanged:true,provenance:'OSM pond outlines 626313848/851; Obayashi shrine office photograph and Kyoto Greenery Association garden photographs establish moss and stone banks. Width and individual stones inferred; no islands, additional water or invented paths.'};root.add(group);return group.userData;
}
