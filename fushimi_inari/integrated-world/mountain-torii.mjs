import {mountainToriiProfile,inscriptionVariant,inscriptionDate} from './mountain-torii-profile.mjs?v=29c';
import {buildToriiInscriptions} from './torii-inscriptions.mjs?v=mountain-walk-1';
import * as THREE from 'three';
import {pathSampler} from './spatial.mjs';
import {toriiVariation} from './torii-variation.mjs';
import {toriiMaterials} from './torii-materials.mjs?v=29';
import {pathClearance} from './spatial.mjs';
import {toriiPosts,toriiClearsPaths} from './torii-clearance.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

// Eight transformed corners retain each station's actual orientation and scale.
// Consumers project these points rather than guessing roof width from pillars.
export function toriiVisualBoundsCorners(bounds,matrix){
  const corners=[];
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z).applyMatrix4(matrix).toArray());
  return corners;
}

// The gate follows the walking axis; each lateral nemaki needs its own support
// on the cross-slope. Sample its actual elliptical perimeter, not the path axis.
export function mountainToriiFootSupports(matrix,thickness,surfaces,renderedTerrainHeight){
  return [-1,1].map(side=>{
    const center=new THREE.Vector3(side*1.24,0,0).applyMatrix4(matrix),samples=[center.clone()];
    for(let i=0;i<16;i++){const a=i*Math.PI/8;samples.push(new THREE.Vector3(side*1.24+Math.cos(a)*.144*thickness,0,Math.sin(a)*.144*thickness).applyMatrix4(matrix));}
    const bottom=Math.min(...samples.map(p=>surfaces.sample?.(p.x,p.z)?.height??renderedTerrainHeight?.(p.x,p.z)??surfaces.terrainHeight?.(p.x,p.z)??surfaces.height(p.x,p.z)))-.08;
    return {x:center.x,z:center.z,bottom:Math.min(center.y,bottom),top:center.y+.015};
  });
}

// Index only terrain cells touched by post footprints. The shared sampler's
// two-metre bins otherwise retain the entire mountain for these narrow feet.
export function mountainToriiSupportTriangles(positions,posts){
  const cells=new Set(),size=2,local=[];
  for(const p of posts)for(let x=Math.floor((p.x-p.radius-.02)/size);x<=Math.floor((p.x+p.radius+.02)/size);x++)for(let z=Math.floor((p.z-p.radius-.02)/size);z<=Math.floor((p.z+p.radius+.02)/size);z++)cells.add(`${x},${z}`);
  for(let i=0;i<positions.length;i+=9){
    const minX=Math.floor(Math.min(positions[i],positions[i+3],positions[i+6])/size),maxX=Math.floor(Math.max(positions[i],positions[i+3],positions[i+6])/size),minZ=Math.floor(Math.min(positions[i+2],positions[i+5],positions[i+8])/size),maxZ=Math.floor(Math.max(positions[i+2],positions[i+5],positions[i+8])/size);
    let needed=false;
    for(let x=minX;x<=maxX&&!needed;x++)for(let z=minZ;z<=maxZ;z++)if(cells.has(`${x},${z}`)){needed=true;break;}
    if(needed)for(let j=0;j<9;j++)local.push(positions[i+j]);
  }
  return local;
}

// Original large torii assets on connected mountain paths. The corridor
// coverage follows the official pilgrimage route; individual gate stations
// remain inferred until each segment is visually surveyed.
export function buildMountainTorii(root,legacy,spatial,surfaces,colliders,{excludeGate,terrainPositions}={}){
  const finishes=toriiMaterials(legacy,{separateInk:true});
  const sections=[
    {from:'okusha',to:'kumataka',spacing:1.35,scale:1.16},
    {from:'kumataka',to:'mitsu',spacing:1.6,scale:1.12},
    {from:'mitsu',to:'yotsu',spacing:1.35,scale:1.10},
    {from:'yotsu',to:'sannomine',spacing:1.6,scale:1.08},
    {from:'sannomine',to:'ninomine',spacing:1.5,scale:1.12},
    {from:'ninomine',to:'summit',spacing:1.7,scale:1.12},
    {from:'summit',to:'mitsurugi',spacing:2.1,scale:1.14},
    {from:'mitsurugi',to:'gozendani',spacing:2.3,scale:1.12},
    {from:'gozendani',to:'yotsu',spacing:2.2,scale:1.14},
  ];
  const matrices=[],occupied=new Set();
  const routePaths=[spatial.main,spatial.returning].map(points=>({points}));
  // Include all walkable graph edges, so a side route gets the same clearance.
  for(const node of spatial.graph.values())for(const edge of node.edges){
    const next=spatial.graph.get(edge.id);if(next)routePaths.push({points:[node.point,next.point]});
  }
  const nearestPath=pathClearance(routePaths);let omittedForAccess=0;
  const landmarkExclusions=[];
  // The first two merged cylinder components are the original pillars. Change
  // only their radial section, preserving beam shapes and pillar centre lines.
  const cylinder=new THREE.CylinderGeometry(.122,.135,2.62,16);
  const pillarVertices=cylinder.attributes.position.count*2;cylinder.dispose();
  const variants=new Map();
  function geometryFor(source,thickness){
    const key=source.uuid+':'+thickness;if(variants.has(key))return variants.get(key);
    const g=source.clone(),p=g.attributes.position;
    for(let i=0;i<pillarVertices;i++){
      const center=p.getX(i)<0?-1.24:1.24;
      p.setXYZ(i,center+(p.getX(i)-center)*thickness,p.getY(i),p.getZ(i)*thickness);
    }
    g.computeVertexNormals();g.computeBoundingSphere();variants.set(key,g);return g;
  }
  const visualBoundsByThickness=new Map();
  function visualCornersFor(matrix,thickness){
    if(!visualBoundsByThickness.has(thickness)){
      const bounds=new THREE.Box3();
      for(const source of [legacy.torii.geometry,legacy.torii.blackGeometry]){
        const geometry=geometryFor(source,thickness);geometry.computeBoundingBox();bounds.union(geometry.boundingBox);
      }
      visualBoundsByThickness.set(thickness,bounds);
    }
    return toriiVisualBoundsCorners(visualBoundsByThickness.get(thickness),matrix);
  }
  for(const [sectionIndex,section] of sections.entries()){
    const route=pathSampler(spatial.connected([section.from,section.to]));
    for(let d=5,index=0;d<route.total-5;index++){
      const {point,yaw:heading}=route.at(d/route.total),[x,,z]=point;
      const variation=toriiVariation(771+sectionIndex*509,index,.32+sectionIndex*.035);
      const yaw=heading+variation.yaw;
      d+=section.spacing*(1+.12*Math.sin(index*1.7));
      const key=`${Math.round(x)},${Math.round(z)}`;if(occupied.has(key))continue;occupied.add(key);
      // Keep shrine forecourts and junction centers open for branching.
      if(spatial.anchors.some(a=>a.radius&&Math.hypot(x-a.target[0],z-a.target[2])<a.radius*.95))continue;
      const scale=section.scale*(1+.035*Math.sin(index*.83)),y=surfaces.height(x,z)-.025;
      const profile=mountainToriiProfile(sectionIndex,index);
      const sx=scale*variation.width*profile.width,sy=scale*.96*variation.height*profile.height,sz=scale*variation.depth;
      const posts=toriiPosts(x,z,yaw,sx,sz,profile.thickness);
      if(!toriiClearsPaths(posts,nearestPath)){omittedForAccess++;continue;}
      const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(sx,sy,sz));
      const reason=excludeGate?.({x,z,posts,visualCorners:visualCornersFor(m,profile.thickness)});
      if(reason){
        // Reject the whole inferred station before geometry, inscriptions or
        // colliders are emitted. Remaining stations retain their positions.
        landmarkExclusions.push({id:`${section.from}-${section.to}:${index}`,sectionIndex,index,
          from:section.from,to:section.to,point:[x,y,z],reason});
        continue;
      }
      matrices.push({m,variation,posts,thickness:profile.thickness,inscription:inscriptionVariant(sectionIndex,index),dateInscription:inscriptionDate(sectionIndex,index)});
    }
  }
  const supportTerrain=terrainPositions?.length?mountainToriiSupportTriangles(terrainPositions,matrices.flatMap(e=>e.posts)):[];
  const renderedTerrainHeight=supportTerrain.length?makeShoulderTriangleHeight(supportTerrain):null;
  for(const entry of matrices){
    entry.feet=mountainToriiFootSupports(entry.m,entry.thickness,surfaces,renderedTerrainHeight);
    for(const [i,p]of entry.posts.entries())colliders.push({type:'cylinder',args:[p.x,p.z,p.radius,entry.feet[i].bottom,entry.m.elements[13]+3.4*entry.m.elements[5],'mountain_torii']});
  }
  // Chunk spatially so the whole mountain is not drawn from inside one tunnel.
  const chunks=new Map();
  matrices.forEach(entry=>{const m=entry.m,key=`${Math.floor(m.elements[12]/80)},${Math.floor(m.elements[14]/80)}`;if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(entry);});
  let supportCount=0;
  const supportGeometry=new THREE.CylinderGeometry(1,1,1,16),scale=new THREE.Vector3(),rotation=new THREE.Quaternion(),position=new THREE.Vector3();
  for(const chunk of chunks.values()){
    const supports=[];
    for(const entry of chunk){entry.m.decompose(position,rotation,scale);for(const foot of entry.feet){
      if(foot.top-foot.bottom<=.025)continue;
      supports.push(new THREE.Matrix4().compose(new THREE.Vector3(foot.x,(foot.bottom+foot.top)/2,foot.z),rotation,new THREE.Vector3(.144*entry.thickness*scale.x,foot.top-foot.bottom,.144*entry.thickness*scale.z)));
    }}
    if(!supports.length)continue;
    const mesh=new THREE.InstancedMesh(supportGeometry,legacy.materials.blackNemakiMat,supports.length);mesh.name='Mountain torii grounded nemaki';supports.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);supportCount+=supports.length;
  }
  for(const chunk of chunks.values())for(const thickness of [1,1.22,1.45]){
    const entries=chunk.filter(e=>e.thickness===thickness);
    for(const [source,material,list] of [
    [legacy.torii.geometry,finishes.fresh,entries.filter(e=>!e.variation.weathered)],
    [legacy.torii.geometry,finishes.weathered,entries.filter(e=>e.variation.weathered)],
    [legacy.torii.blackGeometry,legacy.materials.blackNemakiMat,entries]]){
    if(!list.length)continue;
    const geometry=geometryFor(source,thickness);
    const mesh=new THREE.InstancedMesh(geometry,material,list.length);
    list.forEach(({m,variation},i)=>{mesh.setMatrixAt(i,m);if(source===legacy.torii.geometry)mesh.setColorAt(i,new THREE.Color().setRGB(variation.tint,variation.tint*.96,variation.tint*.92));});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  }
  }
  buildToriiInscriptions(root,matrices,{halfSpan:1.24,bottomRadius:.135,topRadius:.122,bottomY:.65,topY:3.27});
  return {sizeCohorts:3,inscriptionVariants:16,count:matrices.length,supportCount,supportTerrainTriangles:supportTerrain.length/9,maxSupportDepth:Math.max(0,...matrices.flatMap(e=>e.feet.map(f=>f.top-f.bottom))),omittedForAccess,
    omittedForLandmarks:landmarkExclusions.length,landmarkExclusions,
    weathered:matrices.filter(e=>e.variation.weathered).length,sections:sections.length,provenance:'Original geometry, unlettered timber maps, three inferred size cohorts and interpretive dedications; individual gates not surveyed.'};
}
