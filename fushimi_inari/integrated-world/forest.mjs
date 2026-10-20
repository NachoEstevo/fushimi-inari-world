import * as THREE from 'three';
import {routeSpec} from './route-spec.mjs';

// Reuses original trunk, crown and understory assets. A mixed, irregular canopy
// follows path corridors; positions are illustrative, not surveyed tree points.
export function extendForest(root,legacy,features,anchors,ground,pathDistance,colliders){
  let seed=routeSpec.forest.seed;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const forbidden=new Map(),cell=32;
  for(const f of [...features.buildings,...features.water.filter(w=>w.tags.natural==='water')]){
    const b={minX:Math.min(...f.points.map(p=>p[0]))-2,maxX:Math.max(...f.points.map(p=>p[0]))+2,minZ:Math.min(...f.points.map(p=>p[2]))-2,maxZ:Math.max(...f.points.map(p=>p[2]))+2};
    for(let x=Math.floor(b.minX/cell);x<=Math.floor(b.maxX/cell);x++)for(let z=Math.floor(b.minZ/cell);z<=Math.floor(b.maxZ/cell);z++){
      const key=`${x},${z}`;if(!forbidden.has(key))forbidden.set(key,[]);forbidden.get(key).push(b);
    }
  }
  const buckets=new Map(),spacing=routeSpec.forest.nearSpacing;
  for(let x=110;x<1430;x+=spacing)for(let z=-580;z<330;z+=spacing){
    const px=x+(random()-.5)*spacing*.85,pz=z+(random()-.5)*spacing*.85,y=ground(px,pz);
    if(y<53||anchors.some(a=>a.radius&&Math.hypot(px-a.target[0],pz-a.target[2])<a.radius+2))continue;
    if((forbidden.get(`${Math.floor(px/cell)},${Math.floor(pz/cell)}`)??[]).some(b=>px>b.minX&&px<b.maxX&&pz>b.minZ&&pz<b.maxZ))continue;
    const nearest=pathDistance(px,pz),distance=nearest?.distance??100;
    if(distance<2.9)continue;
    // Dense near paths, coarser distant cover; no rigid visible orchard grid.
    if(distance>27&&random()>.20)continue;
    const key=`${Math.floor(px/80)},${Math.floor(pz/80)}`;
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push({x:px,y,z:pz,scale:1.25+random()*.75,yaw:random()*Math.PI*2,broad:random()<.38,under:distance<22});
  }
  const crownMat=legacy.foliage[1].material.clone();crownMat.color.set('#879e70');crownMat.roughness=.9;
  const broadMat=legacy.foliage[3].material.clone();broadMat.color.set('#8b9a75');broadMat.roughness=.9;
  let total=0,understory=0,broadleaf=0;
  for(const trees of buckets.values()){
    const matrices=[[],[],[],[]],dummy=new THREE.Object3D();
    const put=(bucket,x,y,z,sx,sy,sz,yaw)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();matrices[bucket].push(dummy.matrix.clone());};
    for(const tree of trees){
      const {x,y,z,scale,yaw,broad,under}=tree;
      put(0,x,y-.2,z,scale*.70,scale,scale*.70,yaw);
      if(broad){
        broadleaf++;
        for(let layer=0;layer<4;layer++)put(2,x+Math.sin(layer*2+yaw)*2,y+(8.1+layer*.75)*scale,z+Math.cos(layer*2+yaw)*2,3.8*scale,2.4*scale,3.8*scale,yaw+layer);
      }else for(let layer=0;layer<3;layer++)put(1,x,y+(7.8+layer*1.75)*scale,z,(1.65-layer*.32)*scale,(1.05-layer*.10)*scale,(1.65-layer*.32)*scale,yaw+layer*.8);
      if(under)for(let n=0;n<3;n++){
        const ux=x+(random()-.5)*6,uz=z+(random()-.5)*6;
        const near=pathDistance(ux,uz);if(near&&near.distance<2.1)continue;
        put(3,ux,ground(ux,uz),uz,.6+random()*.65,.45+random()*.75,.6+random()*.65,random()*6.28);understory++;
      }
      colliders.push({type:'cylinder',args:[x,z,.40*scale,y,y+9*scale,'forest_tree']});
    }
    const assets=[[legacy.foliage[0].geometry,legacy.foliage[0].material],[legacy.foliage[1].geometry,crownMat],[legacy.foliage[3].geometry,broadMat],[legacy.foliage[3].geometry,broadMat]];
    matrices.forEach((list,index)=>{
      if(!list.length)return;
      const mesh=new THREE.InstancedMesh(...assets[index],list.length);
      list.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.castShadow=index!==3;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
    });
    total+=trees.length;
  }
  return {trees:total,broadleaf,understory,seed:routeSpec.forest.seed,provenance:routeSpec.forest.provenance};
}
