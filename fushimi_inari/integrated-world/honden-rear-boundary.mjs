import * as THREE from 'three';
import {courtCuts,surface} from './precinct-shrine-courts.mjs';
import {subtractConvex} from './entrance-area-surfaces-layout.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

const NAME='Honden rear votive boundary R93';
export const hondenRearBoundaryPlan=Object.freeze({
  center:[77.6,-.45],length:6.4,depth:.9,height:2.05,
  mineral:[[74.1,.1],[81.1,.1],[81.1,.65],[74.1,.65]],
  // Inferred small backdrop only, north of the roof; no precinct-wide forest.
  trees:[[74.8,-3.1],[77.4,-3.5],[80.1,-3.2]],
  source:'https://image.space.rakuten.co.jp/d/strg/ctrl/9/6c4ae49b941d5ba1da931f3d4adfe61ba71e40c0.77.2.9.2.jpeg',
});
const rect=(x,z,hx,hz)=>[[x-hx,z-hz],[x+hx,z-hz],[x+hx,z+hz],[x-hx,z+hz]];
const intersects=(a,b)=>{
  const bounds=p=>[Math.min(...p.map(q=>q[0])),Math.max(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[1]))];
  const x=bounds(a),y=bounds(b);return x[0]<=y[1]&&x[1]>=y[0]&&x[2]<=y[3]&&x[3]>=y[2];
};

// World coordinates: X east, Z south. No relocation of Honden or its own fence.
// Endpoints/dimensions are conservative estimates, not a surveyed barrier way.
export function buildHondenRearBoundary(root,features,surfaces,materials={},colliders=[],options={}){
  const previous=root.getObjectByName(NAME);if(previous)return previous.userData;
  if(!features.buildings?.some(b=>b.id==='way/1287564336')||!features.buildings.some(b=>b.id==='way/899425893'))return {built:false,reason:'Mapped Honden/Mikoshiko anchors unavailable'};
  const p=hondenRearBoundaryPlan,[cx,cz]=p.center,hx=p.length/2+.15,hz=p.depth/2;
  const envelope=rect(cx,cz,hx,hz),region=[cx-hx,cx+hx,cz-hz,cz+hz];
  const cuts=courtCuts(features,surfaces,region);
  // Reject a run rather than cut sacred furniture into a path or building.
  if(cuts.some(c=>intersects(envelope,c)))return {built:false,reason:'Mapped path/building overlaps estimated boundary'};
  const solidOverlap=(x,z,rx,rz)=>colliders.some(c=>{
    const a=c.args;if(c.type==='cylinder')return Math.hypot(Math.max(0,Math.abs(x-a[0])-rx),Math.max(0,Math.abs(z-a[1])-rz))<a[2]+.12;
    if(c.type!=='box')return false;
    // Bounding-circle expansion of rotated solids is conservative.
    const r=Math.abs(Math.sin(a[4]??0))<1e-6?null:Math.hypot(a[2],a[3]);
    return Math.abs(x-a[0])<rx+(r??a[2])+.12&&Math.abs(z-a[1])<rz+(r??a[3])+.12;
  });
  if(solidOverlap(cx,cz,hx,hz))return {built:false,reason:'Existing solid overlaps estimated boundary'};
  // Clip actual terrain triangles to the footprint: extrema include internal
  // crease vertices, not merely the corners of a coarsely sampled height field.
  const terrain=options.terrainPositions,nearby=[],terrainLevels=[];
  if(terrain)for(let i=0;i<terrain.length;i+=9){
    if(Math.max(terrain[i],terrain[i+3],terrain[i+6])<73||Math.min(terrain[i],terrain[i+3],terrain[i+6])>82||Math.max(terrain[i+2],terrain[i+5],terrain[i+8])< -5||Math.min(terrain[i+2],terrain[i+5],terrain[i+8])>1)continue;
    nearby.push(...terrain.slice(i,i+9));
    let poly=[0,1,2].map(j=>Array.from(terrain.slice(i+j*3,i+j*3+3)));
    for(const [axis,bound,sign]of [[0,region[0],1],[0,region[1],-1],[2,region[2],1],[2,region[3],-1]]){
      const next=[];for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length],da=(a[axis]-bound)*sign,db=(b[axis]-bound)*sign;if(da>=0)next.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);next.push(a.map((v,k)=>v+(b[k]-v)*t));}}poly=next;if(poly.length<3)break;
    }
    if(poly.length>=3)terrainLevels.push(...poly.map(v=>v[1]));
  }
  const height=terrain?makeShoulderTriangleHeight(nearby):surfaces.height.bind(surfaces);
  const levels=envelope.concat([[cx,cz]]).map(([x,z])=>height(x,z));
  if(!levels.every(v=>typeof v==='number'&&Number.isFinite(v))||(terrain&&!terrainLevels.length))return {built:false,reason:'Missing rendered boundary support'};
  levels.push(...terrainLevels);
  const relief=Math.max(...levels)-Math.min(...levels);
  // A low stone toe is visible in the reference; a retaining wall is not.
  // Allow at most 45cm total relief only with exact rendered support evidence.
  if(relief>(terrain?.length ? .45 : .18))return {built:false,reason:'Unsupported or uneven boundary ground',relief};
  const base=terrain?Math.max(...levels)+.015:Math.min(...levels),bottom=Math.min(...levels)-.04,group=new THREE.Group();group.name=NAME;
  const material=(key,color)=>materials[key]??new THREE.MeshStandardMaterial({color,roughness:.92});
  const red=material('vermilionMat','#bb4129'),roof=material('rearBoundaryRoofMat','#536353'),stone=material('stoneMat','#a39d8d'),cream=material('plasterMat','#d4cec1'),wood=material('rearBoundaryWoodMat','#605345'),leaf=material('rearBoundaryLeafMat','#354d32');
  const batches=new Map(),boxes=(mat,w,h,d,x,y,z,rx=0)=>{
    if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push({w,h,d,x,y:base+y,z,rx});
  };
  boxes(stone,p.length,base+.16-bottom,.45,cx,(.16+bottom-base)/2,cz);
  for(let i=0;i<=16;i++)boxes(red,.085,1.5,.10,cx-p.length/2+i*p.length/16,.90,cz);
  for(const y of [.35,1.46])boxes(red,p.length,.10,.13,cx,y,cz);
  for(let i=0;i<=4;i++)boxes(red,.14,1.77,.15,cx-p.length/2+i*p.length/4,.97,cz);
  // The rack carries little torii silhouettes; omit unreadable donor lettering.
  for(let i=0;i<22;i++){
    const x=cx-p.length/2+.18+i*.285;if(Math.abs(x-cx)<.9)continue;
    for(const y of [.65,1.05]){
      for(const dx of [-.075,.075])boxes(red,.025,.26,.035,x+dx,y,cz+.10);
      boxes(red,.23,.035,.045,x,y+.13,cz+.10);boxes(red,.19,.025,.035,x,y+.06,cz+.10);
    }
  }
  const cap=(x,y,z,w,d)=>{
    for(const side of [-1,1])boxes(roof,w,.065,d/2+.04,x,y,z+side*d/4,side*.22);
    boxes(roof,w,.07,.08,x,y+d*.055,z);
    for(let i=0;i<=Math.floor(w/.38);i++)boxes(roof,.025,.035,d,x-w/2+i*.38,y+.045,z);
  };
  cap(cx,1.83,cz,p.length+.3,.9);cap(cx,2.12,cz,1.65,1.15);
  for(const dx of [-.75,.75])boxes(red,.12,2.03,.12,cx+dx,1.10,cz+.13);
  boxes(cream,1.35,.46,.035,cx,1.71,cz+.16);
  for(const dx of [-.34,.34])boxes(wood,.018,.46,.015,cx+dx,1.71,cz+.184);
  boxes(red,.57,.52,.36,cx,.42,cz+.32);boxes(wood,.61,.05,.39,cx,.70,cz+.32);
  // Small crowns overlap behind the run; their estimated extents are path/solid guarded.
  const trees=[];
  for(const [x,z]of p.trees){
    const crown=rect(x,z,1.15,1.15),r=[x-1.15,x+1.15,z-1.15,z+1.15];
    if(courtCuts(features,surfaces,r).some(c=>intersects(crown,c))||solidOverlap(x,z,1.15,1.15))continue;
    const y=height(x,z);if(typeof y!=='number'||!Number.isFinite(y))continue;
    boxes(wood,.16,3.1,.18,x,y-base+1.55,z);trees.push({x,z,y});
  }
  for(const [mat,parts]of batches){
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,parts.length),dummy=new THREE.Object3D();mesh.name='Rear boundary static box batch';
    parts.forEach((v,i)=>{dummy.position.set(v.x,v.y,v.z);dummy.rotation.set(v.rx,0,0);dummy.scale.set(v.w,v.h,v.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  }
  if(trees.length){
    const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),leaf,trees.length*3),dummy=new THREE.Object3D();
    trees.forEach((t,i)=>{for(let j=0;j<3;j++){dummy.position.set(t.x+(j-1)*.32,t.y+2.8+j*.5,t.z);dummy.scale.set(1.05,1.15,.95);dummy.updateMatrix();crowns.setMatrixAt(i*3+j,dummy.matrix);}});crowns.castShadow=crowns.receiveShadow=true;group.add(crowns);
  }
  // Grade-following mineral strip with all mapped cuts, never a new walk route.
  if(materials.gravelMat){const stripCuts=courtCuts(features,surfaces,[74.1,81.1,.1,.65]);const polys=stripCuts.reduce((ps,c)=>ps.flatMap(q=>subtractConvex(q,c)),[p.mineral]);const gravel=surface(polys,{...surfaces,height},materials.gravelMat,'Rear votive boundary mineral strip',{maxSlope:.35});if(gravel)group.add(gravel);}
  colliders.push({type:'box',args:[cx,cz,hx,hz,0,bottom,base+2.3,'honden_rear_votive_boundary']});
  for(const t of trees)colliders.push({type:'cylinder',args:[t.x,t.z,.13,t.y,t.y+3.1,'honden_rear_boundary_tree']});
  group.userData={built:true,base,foundationBottom:bottom,relief,support:terrain?'clipped rendered triangle extrema':'flat surface samples',trees:trees.length,source:p.source,placement:'Estimated short run X74.4..80.8 Z−.45, north of mapped Mikoshiko; not a surveyed endpoint',limits:'No sacred identity or lettering assigned; photo 2016 appearance; plant positions inferred',walkingUnchanged:true};
  root.add(group);return group.userData;
}
