import {ShapeUtils,Vector2,Group,Mesh,BoxGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {shinsenjoLayout} from './shinsenjo-precinct.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

// IMG_6572 shows close square pickets on the foreground timber boundary.
// Reuse the existing boundary's endpoints and collider: no new enclosure extent.
export function buildGondenServiceR95(root,materials){
  const name='Gonden photographed service pickets R95',old=root.getObjectByName(name);
  if(old)return old.userData;
  const owner=root.getObjectByName('Gonden bounded rear service landscape R93');
  const ends=owner?.userData.fence,wood=materials.woodMat??materials.timberMat??materials.roofMat??materials.blackNemakiMat;
  if(!owner?.userData.built||ends?.length!==2||!ends.flat().every(Number.isFinite)||!wood)return {built:false,reason:'existing-seated-boundary-required'};
  const [a,b]=ends,length=Math.hypot(b[0]-a[0],b[2]-a[2]);
  if(length<.2||length>1.5)return {built:false,reason:'unrecognized-boundary-extent'};
  const group=new Group();group.name=name;
  const parts=[],count=Math.max(1,Math.floor(length/.14)-1),yaw=-Math.atan2(b[2]-a[2],b[0]-a[0]);
  // The R93 group stores world-space vertices and is attached to root. Convert
  // into root coordinates so this owner does not accidentally apply it twice.
  root.updateWorldMatrix(true,false);const inverse=root.matrixWorld.clone().invert();
  for(let i=1;i<=count;i++){
    const t=i/(count+1),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t;
    const indexed=new BoxGeometry(.052,.64,.045).rotateY(yaw).translate(x,y+.32,z).applyMatrix4(inverse),geometry=indexed.toNonIndexed();indexed.dispose();parts.push(geometry);
  }
  const geometry=mergeGeometries(parts);for(const part of parts)part.dispose();
  const mesh=new Mesh(geometry,wood);mesh.name='Gonden source-visible square timber pickets';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  group.userData={built:true,pickets:count,extent:ends.map(p=>p.slice()),source:'https://fushimiinari-guide.com/wp-content/uploads/IMG_6572_20210311.jpg',accuracy:'Photo-supported square picket type; estimated spacing and height within existing R93 boundary envelope',limits:'No retaining wall, stone fence, adjacent roof or service-route extension registered. Existing collider owns the same boundary.'};root.add(group);return group.userData;
}

// This is a registration gate, not a terrain modifier. Feed the actual composed,
// rendered world triangles, before Shinsenjo subtraction, including the -.06 m.
export function auditShinsenjoGrade(features,terrainPositions,floor){
  const plan=shinsenjoLayout(features);
  if(!plan)return {ready:false,reason:'unrecognized-footprint'};
  if(!Number.isFinite(floor)||!terrainPositions?.length||terrainPositions.length%9||!terrainPositions.every(Number.isFinite))
    return {ready:false,reason:'finite-floor-and-rendered-triangles-required'};
  const cuts=ShapeUtils.triangulateShape(plan.ring.map(p=>new Vector2(...p)),[]).map(f=>f.map(i=>plan.ring[i]));
  const bounds={minX:Math.min(...plan.ring.map(p=>p[0])),maxX:Math.max(...plan.ring.map(p=>p[0])),minZ:Math.min(...plan.ring.map(p=>p[1])),maxZ:Math.max(...plan.ring.map(p=>p[1]))};
  let area=0,min=Infinity,max=-Infinity,roofIntrusion=-Infinity,worst=null,triangleCount=0;
  // Roof is the existing R93 candidate, not a newly asserted source measurement.
  const roof=z=>(z<32.7?5.65-.23*Math.abs(z-27.35):5.55-.23*Math.abs(z-37.6))+.07;
  const bands=[bounds.minZ,27.35,32.7,37.6,bounds.maxZ];
  for(let i=0;i<terrainPositions.length;i+=9){
    const t=[0,3,6].map(j=>[terrainPositions[i+j],terrainPositions[i+j+1],terrainPositions[i+j+2]]),p=t.map(q=>[q[0],q[2]]);
    if(Math.max(...p.map(q=>q[0]))<bounds.minX||Math.min(...p.map(q=>q[0]))>bounds.maxX||Math.max(...p.map(q=>q[1]))<bounds.minZ||Math.min(...p.map(q=>q[1]))>bounds.maxZ)continue;
    const determinant=(p[1][1]-p[2][1])*(p[0][0]-p[2][0])+(p[2][0]-p[1][0])*(p[0][1]-p[2][1]);
    if(Math.abs(determinant)<1e-12)continue;
    const height=([x,z])=>{
      const a=((p[1][1]-p[2][1])*(x-p[2][0])+(p[2][0]-p[1][0])*(z-p[2][1]))/determinant;
      const b=((p[2][1]-p[0][1])*(x-p[2][0])+(p[0][0]-p[2][0])*(z-p[2][1]))/determinant;
      return a*t[0][1]+b*t[1][1]+(1-a-b)*t[2][1];
    };
    let intersects=false;
    for(const cut of cuts){
      const overlap=clipConvex(p,cut);if(!overlap.length)continue;
      intersects=true;area+=Math.abs(polygonArea(overlap));
      for(const q of overlap){const y=height(q);min=Math.min(min,y);max=Math.max(max,y);}
      for(let band=1;band<bands.length;band++){
        const lo=bands[band-1],hi=bands[band],region=clipConvex(overlap,[[bounds.minX,lo],[bounds.maxX,lo],[bounds.maxX,hi],[bounds.minX,hi]]);
        for(const q of region){
          // Evaluate the appropriate side of the candidate's discontinuous valley.
          const z=q[1]===32.7?(band===2?32.7-1e-9:32.7+1e-9):q[1],y=height(q),intrusion=y-floor-roof(z);
          if(intrusion>roofIntrusion){roofIntrusion=intrusion;worst={x:q[0],z:q[1],terrain:y,roof:floor+roof(z)};}
        }
      }
    }
    if(intersects)triangleCount++;
  }
  const footprintArea=Math.abs(polygonArea(plan.ring)),complete=Math.abs(area-footprintArea)<Math.max(1e-5,footprintArea*1e-6);
  return {ready:false,reason:!complete?'incomplete-or-overlapping-terrain-coverage':roofIntrusion>0?'terrain-above-candidate-roof':'floor-registration-still-required',
    owner:plan.id,floor,approach:[65.326,20.483],bounds,footprintArea,coveredArea:area,complete,triangleCount,
    terrainRange:triangleCount?[min,max]:null,maxTerrainAboveFloor:triangleCount?max-floor:null,
    maxTerrainAboveRoof:triangleCount?roofIntrusion:null,worst,
    action:'Register the building floor and exterior grade from source; do not raise the roof, substitute DEM maximum for floor, or cut terrain to conceal the discrepancy.'};
}
