import * as THREE from 'three';
import {createWaterAppearance} from './water-appearance.mjs?v=98-water2';
import {clipMitsuTerrain} from './mitsu-frontage-aprons.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
export const SHINIKE_ID='way/105449705';
const NAME='Shin-ike single horizontal water owner R97';
const xy=p=>[p[0],p[2]];
const geometry=(positions,uv)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv??positions.flatMap((_,i)=>i%3===0?[positions[i]/3,positions[i+2]/3]:[]),2));g.computeVertexNormals();return g;};
export function shinikeLayoutR97(features){
 const feature=features.water?.find(f=>f.id===SHINIKE_ID),p=feature?.points;
 if(!p||p.length!==21||feature.tags?.name!=='新池'||!p.every(q=>q.every(Number.isFinite)))return null;
 const ring=p.slice(0,-1).map(xy),bounds=[Math.min(...ring.map(p=>p[0])),Math.max(...ring.map(p=>p[0])),Math.min(...ring.map(p=>p[1])),Math.max(...ring.map(p=>p[1]))];
 if(Math.abs(bounds[0]-530.013)>.02||Math.abs(bounds[1]-575.269)>.02||Math.abs(bounds[2]+149.803)>.02||Math.abs(bounds[3]+70.666)>.02)return null;
 const triangles=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]).map(t=>t.map(i=>ring[i]));return {id:feature.id,ring,bounds,triangles,area:Math.abs(polygonArea(ring))};
}
function legacyPlane(root){const candidates=[];root.traverse(o=>{if(!o.isMesh||o.geometry?.type!=='PlaneGeometry')return;const p=o.geometry.parameters;if(p.width!==18||p.height!==22||p.widthSegments!==1||p.heightSegments!==1||o.geometry.attributes.position.count!==4)return;if(Math.abs(o.position.x-10.5)>.001||Math.abs(o.position.y+.18)>.001||Math.abs(o.position.z)>.001||Math.abs(o.rotation.x+Math.PI/2)>.001||o.material?.roughness!==.07||!o.material.isMeshPhysicalMaterial)return;let a=o.parent,owned=false;while(a){if(a.userData.zone==='kumataka')owned=true;a=a.parent;}if(owned)candidates.push(o);});return candidates.length===1?candidates[0]:null;}
// A storm-fallen illustrative log is not a permanent current shoreline owner.
// Remove only its unique exact source signature AND recorded mapped root.
function legacyFallenLog(root,plan){
 const matches=[];root.traverse(o=>{if(!o.isMesh||o.geometry?.type!=='CylinderGeometry')return;const p=o.geometry.parameters;
  if(Math.abs(p.radiusTop-.18)>1e-8||Math.abs(p.radiusBottom-.26)>1e-8||Math.abs(p.height-6.8)>1e-8||p.radialSegments!==8||p.heightSegments!==1||p.openEnded!==false||p.thetaStart!==0||Math.abs(p.thetaLength-Math.PI*2)>1e-8||o.scale.distanceTo(new THREE.Vector3(1,1,1))>.001)return;
  if(o.position.distanceTo(new THREE.Vector3(8.2,-.08,-2.5))>.001||Math.abs(o.rotation.x)>.001||Math.abs(o.rotation.y-.42)>.001||Math.abs(o.rotation.z-Math.PI*.47)>.001)return;
  let ancestor=o.parent,owned=false;while(ancestor){if(ancestor.userData.zone==='kumataka')owned=true;ancestor=ancestor.parent;}if(owned)matches.push(o);
 });
 if(matches.length!==1)return null;
 const log=matches[0],point=log.getWorldPosition(new THREE.Vector3()),expected=new THREE.Vector3(550.806547703509,65.81652051629592,-122.63669031185331);
 if(point.distanceTo(expected)>.025)return null;
 const inside=plan.triangles.some(tri=>{const [a,b,c]=tri,p=[point.x,point.z],cross=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]),signs=[cross(a,b,p),cross(b,c,p),cross(c,a,p)];return signs.every(v=>v>=-1e-7)||signs.every(v=>v<=1e-7);});
 return inside?log:null;
}
// Clip one mapped ring through the existing exact polygon-subtraction owner.
// Original exterior triangle planes stay unchanged; no height sampler changes.
export function buildShinikeWaterR97(root,features,materials={},options={}){
 const previous=root.getObjectByName(NAME);if(previous)return previous.userData;
 const plan=shinikeLayoutR97(features);if(!plan)return {built:false,builtIds:[],reason:'mapped-shinike-signature-required'};
 const legacy=legacyPlane(root);if(!legacy)return {built:false,builtIds:[],reason:'unique-legacy-water-signature-required'};
 root.updateWorldMatrix(true,true);const legacyWaterLevel=legacy.getWorldPosition(new THREE.Vector3()).y;let waterLevel=legacyWaterLevel;
 if(Math.abs(waterLevel-65.71652051629592)>.02)return {built:false,builtIds:[],reason:'legacy-water-datum-changed',waterLevel};
 const terrain=options.terrainPositions;if(!terrain?.length||terrain.length%9||!terrain.every(Number.isFinite))return {built:false,builtIds:[],reason:'actual-rendered-terrain-required'};
 const shoreline=[];let covered=0,min=Infinity,max=-Infinity,minWitness=null;
 // Intersect every pond-boundary segment with each original triangle using
 // barycentric half-spaces. This records actual cut-edge creases and heights.
 for(let i=0;i<terrain.length;i+=9){const vs=[0,1,2].map(k=>Array.from(terrain.slice(i+k*3,i+k*3+3))),flat=vs.map(xy);if(Math.max(...flat.map(p=>p[0]))<plan.bounds[0]||Math.min(...flat.map(p=>p[0]))>plan.bounds[1]||Math.max(...flat.map(p=>p[1]))<plan.bounds[2]||Math.min(...flat.map(p=>p[1]))>plan.bounds[3])continue;
  const [a,b,c]=vs,det=(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);if(Math.abs(det)<1e-12)continue;
  const bary=p=>{const u=((p[0]-a[0])*(c[2]-a[2])-(p[1]-a[2])*(c[0]-a[0]))/det,v=((b[0]-a[0])*(p[1]-a[2])-(b[2]-a[2])*(p[0]-a[0]))/det;return [1-u-v,u,v];};
  const height=p=>bary(p).reduce((sum,v,k)=>sum+v*vs[k][1],0);
  for(const cut of plan.triangles)covered+=Math.abs(polygonArea(clipConvex(flat,cut)));
  for(let edge=0;edge<plan.ring.length;edge++){
   const p=plan.ring[edge],q=plan.ring[(edge+1)%plan.ring.length],bp=bary(p),bq=bary(q);let lo=0,hi=1;
   for(let k=0;k<3;k++){const delta=bq[k]-bp[k];if(Math.abs(delta)<1e-12){if(bp[k]<-1e-8)hi=-1;continue;}const t=-bp[k]/delta;if(delta>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);}
   if(hi-lo<1e-7)continue;const at=t=>{const point=[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];return [point[0],height(point),point[1]];};const first=at(lo),last=at(hi);shoreline.push({a:first,b:last});for(const point of [first,last])if(point[1]<min){min=point[1];minWitness=point;}max=Math.max(max,first[1],last[1]);
  }
 }
 if(Math.abs(covered-plan.area)>.025||!shoreline.length)return {built:false,builtIds:[],reason:'incomplete-or-overlapping-terrain-coverage',covered,expected:plan.area};
 waterLevel=Math.min(legacyWaterLevel,min-.04);
 if(min<waterLevel+.03)return {built:false,builtIds:[],reason:'water-above-lowest-retained-shore',waterLevel,min,minWitness};
 const clipTerrain=vertices=>{if(vertices.length%9||!vertices.every(Number.isFinite))throw Error('Shin-ike terrain requires finite triangle positions');return clipMitsuTerrain(vertices,plan.triangles);};
 // Validate clipping before removing the legacy plane or attaching any geometry.
 const clipped=clipTerrain(terrain);if(!clipped.length)return {built:false,builtIds:[],reason:'terrain-clip-unexpectedly-empty'};
 const group=new THREE.Group();group.name=NAME;const waterPositions=[];
 for(const original of plan.triangles){const tri=polygonArea(original)>0?[original[0],original[2],original[1]]:original;for(const [x,z]of tri)waterPositions.push(x,waterLevel,z);}
 const water=new THREE.Mesh(geometry(waterPositions),createWaterAppearance({kind:'shinike'}));water.name='Shin-ike flat olive-gray water R97';water.receiveShadow=true;group.add(water);
 // A single triangulated natural-bank annulus avoids overlapping edge strips.
 // The outer ring includes every actual terrain crease; inner toe points move
 // toward the polygon centroid by a drop-dependent distance capped at 4m.
 const bankPositions=[],bankUV=[],outer=[];
 for(let edge=0;edge<plan.ring.length;edge++){
  const a=plan.ring[edge],b=plan.ring[(edge+1)%plan.ring.length],dx=b[0]-a[0],dz=b[1]-a[1],len2=dx*dx+dz*dz,points=[];
  for(const segment of shoreline)for(const p of [segment.a,segment.b]){const t=((p[0]-a[0])*dx+(p[2]-a[1])*dz)/len2;if(t< -1e-6||t>1+1e-6||Math.abs((p[0]-a[0])*dz-(p[2]-a[1])*dx)>1e-5)continue;points.push({p,t});}
  points.sort((p,q)=>p.t-q.t);for(const {p,t}of points){if(t>1-1e-6)continue;if(!outer.length||Math.hypot(p[0]-outer.at(-1)[0],p[2]-outer.at(-1)[2])>1e-5)outer.push(p);}
 }
 const signedArea=polygonArea(plan.ring),center=[0,0];for(let i=0;i<plan.ring.length;i++){const a=plan.ring[i],b=plan.ring[(i+1)%plan.ring.length],cross=a[0]*b[1]-b[0]*a[1];center[0]+=(a[0]+b[0])*cross/(6*signedArea);center[1]+=(a[1]+b[1])*cross/(6*signedArea);}
 const toe=outer.map(p=>{const dx=center[0]-p[0],dz=center[1]-p[2],distance=Math.hypot(dx,dz),inset=Math.min(4,Math.max(.35,(p[1]-waterLevel)*1.25),distance*.3);return [p[0]+dx/distance*inset,waterLevel-.04,p[2]+dz/distance*inset];});
 const inner=toe.map(xy),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 let selfIntersection=false;for(let i=0;i<inner.length;i++)for(let j=i+2;j<inner.length;j++){if(i===0&&j===inner.length-1)continue;const a=inner[i],b=inner[(i+1)%inner.length],c=inner[j],d=inner[(j+1)%inner.length];if(cross(a,b,c)*cross(a,b,d)<-1e-10&&cross(c,d,a)*cross(c,d,b)<-1e-10)selfIntersection=true;}
 const innerFaces=THREE.ShapeUtils.triangulateShape(inner.map(p=>new THREE.Vector2(...p)),[]);let innerCovered=0;for(const f of innerFaces)for(const cut of plan.triangles)innerCovered+=Math.abs(polygonArea(clipConvex(f.map(i=>inner[i]),cut)));
 if(selfIntersection||Math.abs(innerCovered-Math.abs(polygonArea(inner)))>.025){water.geometry.dispose();water.material.dispose();return {built:false,builtIds:[],reason:'inward-bank-ring-conflict'};}
 const combined=outer.concat(toe),faces=THREE.ShapeUtils.triangulateShape(outer.map(p=>new THREE.Vector2(p[0],p[2])),[inner.map(p=>new THREE.Vector2(...p))]);
 for(const face of faces){const tri=face.map(i=>combined[i]),projection=tri.map(xy),det=polygonArea(projection)*2;if(Math.abs(det)<1e-9)continue;const [a,b,c]=tri;
  const height=p=>{const u=((p[0]-a[0])*(c[2]-a[2])-(p[1]-a[2])*(c[0]-a[0]))/det,v=((b[0]-a[0])*(p[1]-a[2])-(b[2]-a[2])*(p[0]-a[0]))/det;return a[1]+u*(b[1]-a[1])+v*(c[1]-a[1]);};
  for(const cut of plan.triangles){let p=clipConvex(projection,cut);if(Math.abs(polygonArea(p))<1e-8)continue;if(polygonArea(p)>0)p=p.toReversed();for(let i=1;i<p.length-1;i++)for(const q of [p[0],p[i],p[i+1]]){bankPositions.push(q[0],height(q),q[1]);bankUV.push(q[0]/2,q[1]/2);}}
 }
 const bankMaterial=materials.shinikeBankMat?.clone()??new THREE.MeshStandardMaterial({color:'#565d46',roughness:1});bankMaterial.side=THREE.DoubleSide;const bank=new THREE.Mesh(geometry(bankPositions,bankUV),bankMaterial);bank.name='Shin-ike bounded inward natural bank collar R97';bank.receiveShadow=bank.castShadow=true;group.add(bank);
 // A bounded opaque visual backing keeps modest alpha from revealing the
 // terrain cut or sky. Its 0.6m offset is a rendering enclosure, not bathymetry.
 const bedLevel=waterLevel-.6,bedPositions=waterPositions.map((v,i)=>i%3===1?bedLevel:v);
 const bedMaterial=new THREE.MeshStandardMaterial({color:'#30382a',roughness:1,metalness:0,side:THREE.DoubleSide,transparent:false,opacity:1,depthWrite:true});
 const bed=new THREE.Mesh(geometry(bedPositions),bedMaterial);bed.name='Shin-ike bounded dark silt visual backing R98';bed.receiveShadow=true;bed.userData.shinikeSubmergedBacking=true;group.add(bed);
 group.userData={built:true,builtIds:[SHINIKE_ID],revision:'R97',waterLevel,legacyWaterLevel,minRetainedShore:min,minShoreWitness:minWitness,pondArea:plan.area,ring:plan.ring,materialBatches:3,bedLevel,backingDepth:.6,backingTriangles:bedPositions.length/9,waterTriangles:waterPositions.length/9,bankTriangles:bankPositions.length/9,shorelineSegments:shoreline.length,terrainRange:[min,max],maximumExposedBank:max-waterLevel,maximumBankInset:4,bankSlope:'Inward toward centroid, inset min(4,max(.35,drop*1.25),distance*.3), clipped and nonoverlapping',legacyPlanesRemoved:1,removedLegacyLogs:0,collidersAdded:0,walkingChanged:false,clipTerrain,source:'https://fushimiinari-guide.com/wp-content/uploads/DSC_0009_20190202.jpg',limits:'Single fixed horizontal datum is no higher than legacy water and 40mm below lowest actual retained shoreline; absolute level inferred, not surveyed. Muted olive-gray appearance and lower water observed; exact DEM-cut sloped earth bank heights/inset inferred. No external terrain, route, shrine pier, reflection pass or GPU work.'};
 root.add(group);legacy.removeFromParent();const fallenLog=legacyFallenLog(root,plan);if(fallenLog){fallenLog.removeFromParent();group.userData.removedLegacyLogs=1;}return group.userData;
}
