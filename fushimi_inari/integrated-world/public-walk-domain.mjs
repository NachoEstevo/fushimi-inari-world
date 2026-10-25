import {makeEntranceGroundMask} from './entrance-ground.mjs';
import {makeOmotesandoShoulderExclusion} from './omotesando-shoulders-layout.mjs';
import {rotateXZ} from './spatial.mjs';
import {entryWallRuns,entryGardenTiers} from './entrance-layout.mjs';

// These gravel owners are painted onto terrain by courtyard-ground and
// entrance-ground, so they have no paving mesh for the floor ray to discover.
// Use their actual envelopes, excluding mapped solids, water and planted beds.
export function createPublicGravelSupport(romon,features){
  const entrance=makeEntranceGroundMask(romon,features);
  const blocked=makeOmotesandoShoulderExclusion({...features,paths:[]},[romon.target[0]-150,romon.target[0]+150,romon.target[2]-150,romon.target[2]+150]);
  return (x,z)=>{
    if(!Number.isFinite(x)||!Number.isFinite(z)||blocked(x,z))return false;
    const [lx,lz]=rotateXZ(x-romon.target[0],z-romon.target[2],-romon.yaw);
    const ax=lx+romon.source[0],az=lz+romon.source[2];
    if(entryWallRuns.some(([a,b])=>ax>a-.4&&ax<b+.4)&&entryGardenTiers.some(t=>az>t.back-.35&&az<t.front+.35))return false;
    // Midpoint of the shader's narrow edge feather is the public boundary.
    return (Math.abs(lx)<=30&&lz>=-55&&lz<=22)||entrance(x,z)>=.5;
  };
}

// Admission follows assembled support owners, never terrain height or a route shortlist.
// Colliders and dynamic railway gates remain independent of this horizontal domain.
export function createPublicWalkDomain(assembly,{sampleSpacing=.1}={}){
  if(!(sampleSpacing>0&&Number.isFinite(sampleSpacing)))throw new RangeError('sampleSpacing must be finite and positive');
  function contains(x,z){
    if(!Number.isFinite(x)||!Number.isFinite(z))return false;
    return !!(assembly.isWalkable?.(x,z)??assembly.surfaces?.sample(x,z))||!!assembly.isPublicWalkSupport?.(x,z);
  }
  function trace(from,to){
    const distance=Math.hypot(to[0]-from[0],to[2]-from[2]);
    const count=Math.max(1,Math.ceil(distance/sampleSpacing));
    let accepted=from;
    for(let i=1;i<=count;i++){
      const t=i/count,p=[from[0]+(to[0]-from[0])*t,to[1],from[2]+(to[2]-from[2])*t];
      if(!contains(p[0],p[2])){
        let low=accepted,high=p;
        for(let j=0;j<12;j++){
          const mid=[(low[0]+high[0])/2,to[1],(low[2]+high[2])/2];
          if(contains(mid[0],mid[2]))low=mid;else high=mid;
        }
        return {point:low,complete:false};
      }
      accepted=p;
    }
    return {point:accepted,complete:true};
  }
  function resolveMove(from,to){
    if(!from||!to||![from[0],from[1],from[2],to[0],to[1],to[2]].every(Number.isFinite))return null;
    if(!contains(from[0],from[2]))return null;
    const direct=trace(from,to);
    if(direct.complete)return direct.point;
    // Preserve tangent movement at a boundary. Every candidate is swept again,
    // so axis sliding cannot jump across a disconnected support island.
    const p=direct.point;
    const xFirst=trace(trace(p,[to[0],to[1],p[2]]).point,to).point;
    const zFirst=trace(trace(p,[p[0],to[1],to[2]]).point,to).point;
    return Math.hypot(xFirst[0]-to[0],xFirst[2]-to[2])<Math.hypot(zFirst[0]-to[0],zFirst[2]-to[2])?xFirst:zFirst;
  }
  return {contains,resolveMove};
}

// Index only upward near-level faces of existing paving owners. The same query
// serves horizontal admission and height resolution.
export function createPublicFloorQuery(THREE,root,materials,surfaces,ground=surfaces.height){
  const walkFloorCells=new Map(),walkFloorCellSize=16;
  const floorMaterials=[materials.stoneMat,materials.flagstoneMat,materials.gravelMat,materials.entryStoneMat,materials.precinctPaving,materials.precinctCobbles,materials.sanctuaryApronMat];
  // These builders clone their paving material. Admit the actual triangle
  // footprint, including the west-stair cutout, rather than its bounds.
  const ownedFloors=new Set(['Yotsutsuji forecourt outside west stair','Tamayama photographed mineral forecourt','Tamayama upper access mineral shoulders','Shinsenjo bounded north mineral court R99']);
  root.traverse(object=>{
    const explicit=object.userData.publicWalkSupport===true||ownedFloors.has(object.name);
    if(!object.isMesh||object.isInstancedMesh||(!explicit&&![object.material].flat().every(m=>floorMaterials.includes(m))))return;
    const geo=object.geometry.clone().applyMatrix4(object.matrixWorld),position=geo.attributes.position,index=geo.index;
    const vertices=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
    for(let i=0;i<(index?index.count:position.count);i+=3){
      a.fromBufferAttribute(position,index?index.getX(i):i);b.fromBufferAttribute(position,index?index.getX(i+1):i+1);c.fromBufferAttribute(position,index?index.getX(i+2):i+2);
      normal.crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();
      // ShapeUtils triangulates these X/Z courts with downward winding;
      // their visible paving is DoubleSide. Normalize only explicit owners.
      if(explicit&&object.material.side===THREE.DoubleSide&&normal.y<-.75){
        const swap=b.clone();b.copy(c);c.copy(swap);normal.negate();
      }
      if(normal.y>.75&&(explicit||Math.max(a.y,b.y,c.y)-Math.min(a.y,b.y,c.y)<.3))vertices.push(...a.toArray(),...b.toArray(),...c.toArray());
    }
    geo.dispose();
    if(vertices.length){
      const floorGeo=new THREE.BufferGeometry();floorGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
      const floorMesh=new THREE.Mesh(floorGeo,materials.entryStoneMat);
      floorGeo.computeBoundingBox();
      const bounds=floorGeo.boundingBox;
      for(let x=Math.floor(bounds.min.x/walkFloorCellSize);x<=Math.floor(bounds.max.x/walkFloorCellSize);x++)
        for(let z=Math.floor(bounds.min.z/walkFloorCellSize);z<=Math.floor(bounds.max.z/walkFloorCellSize);z++){
          const key=`${x},${z}`;if(!walkFloorCells.has(key))walkFloorCells.set(key,[]);walkFloorCells.get(key).push(floorMesh);
        }
    }
  });
  const floorRay=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
  function publicFloorHit(x,z,previous=ground(x,z)){
    const candidates=walkFloorCells.get(`${Math.floor(x/walkFloorCellSize)},${Math.floor(z/walkFloorCellSize)}`);
    if(!candidates)return null;
    const base=surfaces.height(x,z);
    floorRay.set(new THREE.Vector3(x,Math.max(base,previous)+.42,z),down);floorRay.far=2;
    return floorRay.intersectObjects(candidates,false).find(hit=>hit.point.y>=base-.15&&hit.point.y<=Math.max(base,previous)+.24)??null;
  }
  return publicFloorHit;
}

