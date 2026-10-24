import * as THREE from 'three';
import {toriiMaterials} from './torii-materials.mjs';
import {buildToriiInscriptions} from './torii-inscriptions.mjs?v=mountain-walk-1';
import {integratedTerrainTriangles} from './terrain-triangles.mjs?v=90-shared';

// Sampling the nonlinear terrain-height function alone does not reproduce a
// rendered face. The viewer and gate consume one shared triangle generator.
export function continuationTerrainFootLevels(terrain,anchors,pathDistance,surfaces,feet,radius,terrainPositions){
  const vertices=terrainPositions??integratedTerrainTriangles(terrain,anchors,pathDistance,surfaces.terrainHeight);
  const local=[],pad=radius+.02,minX=Math.min(...feet.map(p=>p.x))-pad,maxX=Math.max(...feet.map(p=>p.x))+pad,
    minZ=Math.min(...feet.map(p=>p.z))-pad,maxZ=Math.max(...feet.map(p=>p.z))+pad;
  for(let i=0;i<vertices.length;i+=9){
    const ax=vertices[i],bx=vertices[i+3],cx=vertices[i+6],az=vertices[i+2],bz=vertices[i+5],cz=vertices[i+8];
    if((ax<minX&&bx<minX&&cx<minX)||(ax>maxX&&bx>maxX&&cx>maxX)||(az<minZ&&bz<minZ&&cz<minZ)||(az>maxZ&&bz>maxZ&&cz>maxZ))continue;
    if(feet.some(p=>Math.max(ax,bx,cx)>=p.x-pad&&Math.min(ax,bx,cx)<=p.x+pad&&Math.max(az,bz,cz)>=p.z-pad&&Math.min(az,bz,cz)<=p.z+pad))local.push(...vertices.slice(i,i+9));
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(local,3));
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material),ray=new THREE.Raycaster();mesh.updateMatrixWorld(true);
  const levels=feet.map(p=>{
    const hits=[];for(let i=-1;i<32;i++){
      const angle=i*Math.PI/16,x=p.x+(i<0?0:radius*Math.cos(angle)),z=p.z+(i<0?0:radius*Math.sin(angle));
      ray.set(new THREE.Vector3(x,1000,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];if(hit)hits.push(hit.point.y);
    }
    return hits.length===33?Math.min(...hits)-.04:NaN;
  });
  geometry.dispose();material.dispose();return levels;
}

const routeIds=['way/1133055117','way/297888105','way/1133055118','way/1133055119','way/626313768','way/1392716577'];
export function tamayamaContinuationLayout(features){
  const paths=routeIds.map(id=>features.paths?.find(p=>p.id===id));
  if(paths.some(p=>!p||p.points.length<2||!p.points.every(q=>q.every(Number.isFinite))))return null;
  for(let i=1;i<paths.length;i++)if(Math.hypot(paths[i-1].points.at(-1)[0]-paths[i].points[0][0],paths[i-1].points.at(-1)[2]-paths[i].points[0][2])>.02)return null;
  // June 2012 south view shows a separate large gate on this continuation.
  // The joint between the short steps and next landing is a conservative
  // scene station, not an individually mapped or photographically surveyed torii.
  const a=paths[1].points.at(-1),b=paths[2].points.at(-1),dx=b[0]-a[0],dz=b[2]-a[2];
  if(Math.hypot(dx,dz)<1)return null;
  return {center:[a[0],a[2]],yaw:Math.atan2(dx,dz),pillarSpan:5.6,height:5.8,
    routeIds:[...routeIds],sourcePath:paths[2].id,
    reference:'Google StreetView June 2012 panorama MvihcVb0f466FBJebqyECg, south view',
    placementStatus:'Photo-supported distinct south-branch gate; station inferred at mapped short-step/landing junction, not individually mapped',
    dimensionsStatus:'Estimated 5.6 m post span and 5.8 m height; not surveyed'};
}

/** Existing lower western gate and Okumiya/Senbon gates have separate ownership. */
export function buildTamayamaContinuationTorii(root,legacy,features,surfaces,colliders,options={}){
  const name='Tamayama right-turn continuation torii R90',existing=root.getObjectByName(name);
  if(existing)return {built:true,...existing.userData};
  const plan=tamayamaContinuationLayout(features);if(!plan)return {built:false,reason:'unrecognized-route-chain'};
  legacy.torii.geometry.computeBoundingBox();legacy.torii.blackGeometry.computeBoundingBox();
  const sourceBounds=legacy.torii.geometry.boundingBox.clone().union(legacy.torii.blackGeometry.boundingBox);
  const [x,z]=plan.center,sx=plan.pillarSpan/2.48,sy=plan.height/sourceBounds.max.y,sz=sx;
  // Refuse to add another gate if a future upstream owner already supplies one.
  root.updateMatrixWorld(true);const instance=new THREE.Matrix4(),world=new THREE.Matrix4(),point=new THREE.Vector3();
  for(const mesh of legacy.toriiMeshes??[])if(mesh.isInstancedMesh)for(let i=0;i<mesh.count;i++){
    mesh.getMatrixAt(i,instance);world.multiplyMatrices(mesh.matrixWorld,instance);if(Math.abs(world.determinant())<.001)continue;
    point.setFromMatrixPosition(world);if(Math.hypot(point.x-x,point.z-z)<2)return {built:false,reason:'existing-gate-at-station'};
  }
  if(colliders.some(c=>c.type==='cylinder'&&String(c.args.at(-1)).includes('torii')&&Math.hypot(c.args[0]-x,c.args[1]-z)<plan.pillarSpan/2+.65))return {built:false,reason:'existing-static-gate-at-station'};
  const base=surfaces.height(x,z);if(!Number.isFinite(base))return {built:false,reason:'invalid-floor'};
  const group=new THREE.Group();group.name=name;group.position.set(x,base,z);group.rotation.y=plan.yaw;group.scale.set(sx,sy,sz);
  const finishes=toriiMaterials(legacy,{separateInk:true});
  for(const [geometry,material] of [[legacy.torii.geometry,finishes.fresh],[legacy.torii.blackGeometry,legacy.materials.blackNemakiMat]]){
    const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  }
  buildToriiInscriptions(group,[{m:new THREE.Matrix4()}],{halfSpan:1.24,bottomRadius:.135,topRadius:.122,bottomY:.65,topY:3.27,frontOnly:true});
  const radius=.144*sx,feet=[-1,1].map(side=>({x:x+Math.cos(plan.yaw)*side*plan.pillarSpan/2,z:z-Math.sin(plan.yaw)*side*plan.pillarSpan/2}));
  const sampleStart=performance.now();
  const hasTerrain=!!(options.terrainPositions||options.terrain);
  const levels=hasTerrain?continuationTerrainFootLevels(options.terrain,options.anchors??[],options.pathDistance??(()=>null),surfaces,feet,radius,options.terrainPositions):feet.map(p=>Math.min(base,...[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].map(([dx,dz])=>{
    const h=surfaces.terrainHeight?.(p.x+dx,p.z+dz);return Number.isFinite(h)?h-.06:surfaces.height(p.x+dx,p.z+dz);
  })));
  if(!levels.every(Number.isFinite))return {built:false,reason:'invalid-post-seating'};
  let footTriangles=0;
  for(let i=0;i<feet.length;i++){
    const p=feet[i],depth=base-levels[i];
    if(depth>.015){const foot=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,16),legacy.materials.blackNemakiMat);foot.position.set(p.x,levels[i]+depth/2,p.z);foot.castShadow=foot.receiveShadow=true;foot.userData.tamayamaContinuationFoot=true;footTriangles+=(foot.geometry.index?.count??foot.geometry.attributes.position.count)/3;root.add(foot);}
    colliders.push({type:'cylinder',args:[p.x,p.z,radius,levels[i],base+plan.height,'tamayama_continuation_torii']});
  }
  root.add(group);group.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(group);
  let triangles=footTriangles;group.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  group.userData={...plan,base,templateBounds:{min:sourceBounds.min.toArray(),max:sourceBounds.max.toArray()},footSeating:hasTerrain?'Actual viewer adaptive terrain triangles; 33 ray samples per foot, .04 m buried toe':'Height-function fallback; rendered terrain seating unverified',footSamplingMs:performance.now()-sampleStart,footLevels:levels,posts:feet.map((p,i)=>({...p,radius,bottom:levels[i],top:base+plan.height})),
    geometryBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},triangles,
    provenance:'Distinct gate confirmed by source south view; uses existing torii template. Exact centre, dimensions and foot levels remain source-informed scene estimates. Lower west gate unchanged.'};
  return {built:true,...group.userData};
}
