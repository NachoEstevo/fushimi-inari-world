import * as THREE from 'three';
import {spatialMeshes} from './spatial-mesh.mjs';
import {createArchitecturalSurfaceLibrary} from './architectural-surface-library.mjs';
import {appendUpperCafeFront,isReferencedUpperCafe,upperCafeInferredHeight,upperCafeFront} from './upper-cafe-fronts.mjs';

const pointDistance=(p,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=THREE.MathUtils.clamp(((p[0]-a[0])*dx+(p[2]-a[2])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p[0]-a[0]-dx*t,p[2]-a[2]-dz*t);};
function edgeDistance(a,b,c,d){
 const cross=(p,q,r)=>(q[0]-p[0])*(r[2]-p[2])-(q[2]-p[2])*(r[0]-p[0]);
 const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);
 if(ab1*ab2<0&&cd1*cd2<0)return 0;
 return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));
}
function pathIndex(segments){
 const grid=new Map(),size=64;
 for(const segment of segments){
  if(!segment.a||!segment.b||segment.kind==='restricted')continue;
  const {a,b}=segment;
  for(let x=Math.floor(Math.min(a[0],b[0])/size);x<=Math.floor(Math.max(a[0],b[0])/size);x++)for(let z=Math.floor(Math.min(a[2],b[2])/size);z<=Math.floor(Math.max(a[2],b[2])/size);z++){
   const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(segment);
  }
 }
 return {grid,size};
}
function selectBuildings(options){
 const {buildings,segments,maxDistance,maxBuildings,maxPerCell,focusPoints,focusRadius,excludesBuilding,omitBuilding}=options;
 const {grid,size}=pathIndex(segments),cells=new Map();
 for(const building of buildings){
  const tags=building.tags??{};
  if(excludesBuilding(building)||omitBuilding(building)||tags.religion||tags.amenity==='place_of_worship'||['roof','shrine','temple','church','cathedral','mosque','canopy'].includes(tags.building))continue;
  const ring=building.points.slice(0,-1);if(ring.length<3)continue;
  const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[2]),bounds=[Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)];
  const center=[(bounds[0]+bounds[2])/2,0,(bounds[1]+bounds[3])/2];
  if(focusPoints?.length&&!focusPoints.some(p=>Math.hypot(center[0]-p[0],center[2]-p[1])<=focusRadius))continue;
  const x0=Math.floor((bounds[0]-maxDistance)/size),x1=Math.floor((bounds[2]+maxDistance)/size),z0=Math.floor((bounds[1]-maxDistance)/size),z1=Math.floor((bounds[3]+maxDistance)/size);
  if((x1-x0+1)*(z1-z0+1)>256)continue;
  const near=new Set();for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(const s of grid.get(x+','+z)??[])near.add(s);
  let distance=Infinity;
  for(const s of near)for(let i=0;i<ring.length;i++)distance=Math.min(distance,edgeDistance(ring[i],ring[(i+1)%ring.length],s.a,s.b));
  if(distance>maxDistance)continue;
  const key=Math.floor(center[0]/256)+','+Math.floor(center[2]/256);
  if(!cells.has(key))cells.set(key,[]);cells.get(key).push({building,ring,bounds,distance});
 }
 const rank=(a,b)=>Number(isReferencedUpperCafe(b.building))-Number(isReferencedUpperCafe(a.building))||a.distance-b.distance||a.building.id.localeCompare(b.building.id);
 const queues=[...cells.values()].map(list=>list.sort(rank).slice(0,maxPerCell));
 queues.sort((a,b)=>rank(a[0],b[0]));
 const selected=[];for(let index=0;selected.length<maxBuildings;index++){
  let added=false;for(const queue of queues)if(queue[index]&&selected.length<maxBuildings){selected.push(queue[index]);added=true;}
  if(!added)break;
 }
 return selected;
}

// The caller omits returned IDs from its cheap distant extrusion pass. Public
// collision/surfaces stay untouched; only the two sourced cafe fronts open.
export function createMappedBuildingFinishes({buildings,segments,ground,excludesBuilding=()=>false,omitBuilding=()=>false,maxDistance=24,maxBuildings=64,maxPerCell=8,focusPoints,focusRadius=80,surfaceLibrary}){
 const started=performance.now(),selected=selectBuildings({buildings,segments,maxDistance,maxBuildings,maxPerCell,focusPoints,focusRadius,excludesBuilding,omitBuilding});
 const group=new THREE.Group();group.name='Bounded mapped building facade finishes';
 const surfaces=surfaceLibrary??createArchitecturalSurfaceLibrary(),ownsSurfaces=!surfaceLibrary;
 const detailedIds=new Set(),records=[],buckets=new Map(),materials=new Map(),maps=new Set(),geometries=[];
 const bucket=kind=>{if(!buckets.has(kind))buckets.set(kind,{vertices:[],uv:[]});return buckets.get(kind);};
 const append=(kind,p,uv)=>{bucket(kind).vertices.push(...p);bucket(kind).uv.push(...uv);};
 for(const {building,ring,bounds,distance}of selected){
  const tags=building.tags??{},heightValue=Number.parseFloat(tags.height),levels=Number.parseFloat(tags['building:levels']);
  const height=Number.isFinite(heightValue)?heightValue:Number.isFinite(levels)?levels*3:upperCafeInferredHeight(building)??6;
  const terrain=ring.map(p=>ground(p[0],p[2]));if(!terrain.every(Number.isFinite))continue;
  const base=Math.min(...terrain),front=upperCafeFront({building,buildings,ring});
  const grades=front?Array.from({length:5},(_,i)=>ground(front.a[0]+front.dx*i/4,front.a[2]+front.dz*i/4)):[];
  const frontFloor=grades.length&&grades.every(Number.isFinite)?Math.max(...grades):null;
  // The toe retains the inherited terrain coverage. For an inferred shop
  // envelope, measure eaves from its public-facing grade rather than the toe.
  const roof=frontFloor!==null&&!Number.isFinite(heightValue)&&!Number.isFinite(levels)?Math.max(frontFloor+height,Math.max(...terrain)+.1):Math.max(...terrain)+height;
  const kind=/wood|timber/i.test(tags['building:material']??'')?'timber':/stone|brick|concrete/i.test(tags['building:material']??'')?'mineral':'plaster';
  const upperCafe=frontFloor===null?null:appendUpperCafeFront({building,buildings,ring,base:frontFloor,roof,append,front});
  if(upperCafe)upperCafe.frontFloor=frontFloor;
  const windowFaces=0;
  for(let i=0;i<ring.length;i++){
   const a=ring[i],b=ring[(i+1)%ring.length],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
   // Only a successfully built referenced frontage opens the facing wall.
   // Its terrain support stays below the high grade; all other walls remain.
   const wallTop=upperCafe?.edge===i?frontFloor:roof;if(wallTop-base<1e-6)continue;
   const tile=surfaces.tileMetres(kind),u0=0,u1=length/tile,vertical=(wallTop-base)/tile;
   const corners=[[a[0],base,a[2]],[b[0],base,b[2]],[b[0],wallTop,b[2]],[a[0],wallTop,a[2]]],uv=[[u0,0],[u1,0],[u1,vertical],[u0,vertical]];
   for(const j of [0,1,2,0,2,3])append(kind,corners[j],uv[j]);
  }
  for(const tri of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[]))for(const j of tri)append('roof',[ring[j][0],roof,ring[j][2]],[ring[j][0]/3,ring[j][2]/3]);
  detailedIds.add(building.id);records.push({id:building.id,distance,height,heightSource:Number.isFinite(heightValue)?'height':Number.isFinite(levels)?'levels':'inferred',base,roof,bounds,material:kind,windowFaces,inferredFacade:!!upperCafe,opaqueOnly:true,...(upperCafe?{upperCafe}:{})});
 }
 for(const [kind,{vertices,uv}]of buckets){
  const textures=surfaces.getMaps(kind);for(const t of Object.values(textures))maps.add(t);
  const material=surfaces.get(kind);materials.set(kind,material);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const chunks=spatialMeshes(geometry,material,256);geometry.dispose();for(const mesh of chunks.children){mesh.receiveShadow=false;geometries.push(mesh.geometry);}group.add(chunks);
 }
 const stats={buildings:detailedIds.size,records,maxBuildings,maxPerCell,maxDistance,materials:materials.size,textures:maps.size,textureBytes:[...maps].reduce((n,t)=>n+(t.image.data?.byteLength??t.image.width*t.image.height*4),0),batches:geometries.length,triangles:geometries.reduce((n,g)=>n+g.attributes.position.count/3,0),extraLights:0,perFrameWork:false,buildMs:performance.now()-started,provenance:'OSM footprint and existing extrusion heights; two photographed upper cafes have inferred shallow facade details; all other context remains opaque; no added collisions'};
 let disposed=false;return {group,detailedIds,stats,dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const g of geometries)g.dispose();if(ownsSurfaces)surfaces.dispose();}};
}
