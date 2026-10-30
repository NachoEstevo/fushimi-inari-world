import * as THREE from 'three';
import {routeSpec} from './route-spec.mjs';
import {evergreenCanopy} from './evergreen-canopy.mjs?v=10';
import {outlookOpening} from './panorama-policy.mjs?v=33';
import {refineBamboo} from './bamboo-details.mjs';
import {understoryGeometry,createUnderstoryPlacement,understoryGround,understoryLOD,understoryBudget} from './forest-understory.mjs';

// Reuses original trunk/crown assets with lightweight procedural understory.
// A mixed, irregular canopy
// follows path corridors; positions are illustrative, not surveyed tree points.
export function extendForest(root,legacy,features,anchors,ground,pathDistance,colliders){
  const work=forestWork(root,legacy,features,anchors,ground,pathDistance,colliders);let next=work.next();
  while(!next.done)next=work.next();return next.value;
}
export async function extendForestAsync(root,legacy,features,anchors,ground,pathDistance,colliders,{yieldWork,now=()=>performance.now(),budgetMs=32}={}){
  if(typeof yieldWork!=='function')throw new TypeError('Forest preparation requires yieldWork');
  if(!(budgetMs>0&&budgetMs<=32))throw new RangeError('Forest preparation budget must be between 0 and 32 ms');
  const work=forestWork(root,legacy,features,anchors,ground,pathDistance,colliders);let start=now(),next=work.next();
  while(!next.done){
    if(now()-start>=budgetMs){await yieldWork();start=now();}
    next=work.next();
  }
  return next.value;
}
// Preserve the random sequence and ownership order while the async caller
// checks its budget between candidates and completed tree/bucket work.
function* forestWork(root,legacy,features,anchors,ground,pathDistance,colliders){
  const bamboo=refineBamboo(legacy);
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
    yield;
    const px=x+(random()-.5)*spacing*.85,pz=z+(random()-.5)*spacing*.85,y=ground(px,pz);
    if(y<53||anchors.some(a=>a.radius&&Math.hypot(px-a.target[0],pz-a.target[2])<a.radius+2))continue;
    if((forbidden.get(`${Math.floor(px/cell)},${Math.floor(pz/cell)}`)??[]).some(b=>px>b.minX&&px<b.maxX&&pz>b.minZ&&pz<b.maxZ))continue;
    const nearest=pathDistance(px,pz),distance=nearest?.distance??100;
    if(distance<2.9)continue;
    // Dense near paths, coarser distant cover; no rigid visible orchard grid.
    if(distance>27&&random()>.20)continue;
    const key=`${Math.floor(px/80)},${Math.floor(pz/80)}`;
    const tree={x:px,y,z:pz,scale:.85+random()*.65,yaw:random()*Math.PI*2,broad:random()<.76,under:distance<22};
    if(outlookOpening(px,pz))continue;
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(tree);
  }
  yield;
  const crownMat=legacy.foliage[1].material.clone();crownMat.color.set('#879e70');crownMat.roughness=.9;
  const understoryMaterial=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.95});
  const understoryNear=understoryGeometry(),understoryFar=understoryGeometry('far');
  const placeUnderstory=createUnderstoryPlacement(features.paths??[],anchors);
  const evergreen=evergreenCanopy();
  const distantEvergreen=evergreenCanopy(48);
  const horizonEvergreen=evergreenCanopy(12);
  const branchGeo=new THREE.CylinderGeometry(.035,.12,1,6);branchGeo.translate(0,.5,0);
  let total=0,understory=0,broadleaf=0;
  for(const trees of buckets.values()){
    yield;
    const matrices=[[],[],[],[],[]],dummy=new THREE.Object3D();
    const put=(bucket,x,y,z,sx,sy,sz,yaw)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();matrices[bucket].push(dummy.matrix.clone());};
    for(const tree of trees){
      const {x,y,z,scale,yaw,broad,under}=tree;
      put(0,x,y-.2,z,scale*.70,scale*(broad?.68:1),scale*.70,yaw);
      if(broad){
        broadleaf++;
        const clusters=3+Math.floor(random()*3),spread=1+random()*1.2;
        for(let layer=0;layer<clusters;layer++){
          const angle=yaw+layer*2.4+(random()-.5)*.8;
          const bx=x+Math.sin(angle)*spread,by=y+(6.8+random()*2.8)*scale,bz=z+Math.cos(angle)*spread;
          put(2,bx,by,bz,(1.8+random())*scale,(1.1+random()*1.1)*scale,(1.7+random())*scale,angle);
          const start=new THREE.Vector3(x,y+5.8*scale,z),delta=new THREE.Vector3(bx,by,bz).sub(start);
          dummy.position.copy(start);dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
          dummy.scale.set(scale,delta.length(),scale);dummy.updateMatrix();matrices[4].push(dummy.matrix.clone());
        }
      }else for(let layer=0;layer<3;layer++)put(1,x,y+(7.8+layer*1.75)*scale,z,(1.65-layer*.32)*scale,(1.05-layer*.10)*scale,(1.65-layer*.32)*scale,yaw+layer*.8);
      if(under)for(let n=0;n<3;n++){
        const ux=x+(random()-.5)*6,uz=z+(random()-.5)*6;
        const near=pathDistance(ux,uz);if(near&&near.distance<2.1)continue;
        // A clear tree root does not imply its offset shrubs clear a shrine.
        // Consume the same random values so unrelated forest placement stays stable.
        const sx=.6+random()*.65,sy=.45+random()*.75,sz=.6+random()*.65,yaw=random()*6.28;
        if((forbidden.get(`${Math.floor(ux/cell)},${Math.floor(uz/cell)}`)??[]).some(b=>ux>b.minX&&ux<b.maxX&&uz>b.minZ&&uz<b.maxZ))continue;
        // Keep every legacy random draw above: new filtering must never move
        // unrelated trees, their branches or the authoritative colliders.
        const radius=understoryBudget.radius*Math.max(sx,sz),height=understoryGround(ground,ux,uz,radius);
        if(height===null||!placeUnderstory(ux,uz,radius))continue;
        put(3,ux,height-.012,uz,sx,sy,sz,yaw);understory++;
      }
      colliders.push({type:'cylinder',args:[x,z,.40*scale,y,y+9*scale,'forest_tree']});
      yield;
    }
    const assets=[[legacy.foliage[0].geometry,legacy.foliage[0].material],[legacy.foliage[1].geometry,crownMat],[evergreen.geometry,evergreen.material],[understoryNear,understoryMaterial],[branchGeo,legacy.foliage[0].material]];
    matrices.forEach((list,index)=>{
      if(!list.length)return;
      const mesh=new THREE.InstancedMesh(...assets[index],list.length);
      if(index===1||index===2)mesh.userData.precinctCanopy=true;
      list.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.castShadow=index!==3;mesh.receiveShadow=true;mesh.computeBoundingSphere();
      if(index===3){
        const tint=new THREE.Color(),position=new THREE.Vector3();
        list.forEach((matrix,i)=>{
          position.setFromMatrixPosition(matrix);
          const patch=.5+.5*Math.sin(position.x*.13+Math.sin(position.z*.11));
          tint.setRGB(.80+patch*.20,.86+patch*.14,.72+patch*.18);mesh.setColorAt(i,tint);
        });
        root.add(understoryLOD(mesh,understoryFar));
      }else if(index===2){
        const tint=new THREE.Color();
        const tintLeaves=target=>list.forEach((_,i)=>{
          const n=(Math.sin(i*12.9898+trees[0].x*.13)*43758.5453)%1;
          tint.setHSL(.22+Math.abs(n)*.035,.12,.78+Math.abs(n)*.16);target.setColorAt(i,tint);
        });
        tintLeaves(mesh);
        // Per-cell LOD keeps nearby leaves dense without drawing the full
        // botanical geometry for the entire mountain in the overview.
        const center=mesh.boundingSphere.center.clone(),lod=new THREE.LOD();lod.position.copy(center);
        mesh.position.copy(center).negate();
        const far=new THREE.InstancedMesh(distantEvergreen.geometry,distantEvergreen.material,list.length);
        list.forEach((matrix,i)=>far.setMatrixAt(i,matrix));far.position.copy(mesh.position);far.receiveShadow=true;far.computeBoundingSphere();
        const horizon=new THREE.InstancedMesh(horizonEvergreen.geometry,horizonEvergreen.material,list.length);
        tintLeaves(far);tintLeaves(horizon);
        list.forEach((matrix,i)=>horizon.setMatrixAt(i,matrix));horizon.position.copy(mesh.position);horizon.computeBoundingSphere();
        lod.addLevel(mesh,0);lod.addLevel(far,85,.12);lod.addLevel(horizon,200,.15);lod.userData.nearForest=true;root.add(lod);
      }else {mesh.userData.nearForest=true;root.add(mesh);}
    });
    total+=trees.length;
    yield;
  }
  return {trees:total,broadleaf,understory,bamboo,seed:routeSpec.forest.seed,provenance:routeSpec.forest.provenance};
}
