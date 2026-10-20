import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildLegacy} from './legacy-builders.mjs';
import {extendForest} from './forest.mjs?v=10';
import {heightAt,nearestNode} from '../geography/geo-core.mjs';
import {makeSpatial,pathSampler,rigidPoint,rotateXZ,pathClearance} from './spatial.mjs';
import {makePathSurfaces} from './path-surfaces.mjs?v=13';
import {buildSenbon} from './senbon.mjs';
import {buildMountainTorii} from './mountain-torii.mjs';
import {supportTerraces} from './terrace-foundations.mjs';
import {buildYotsutsuji,teaHouses} from './yotsutsuji.mjs';
import {yotsuGrade} from './site-grading.mjs';
import {partitionInstances} from './spatial-mesh.mjs';
import {refineShrineFinishes} from './shrine-finishes.mjs?v=12';
import {fineGranite} from './surface-materials.mjs';
import {entryHeight} from './entry-profile.mjs';
import {refineRomonCurtain} from './romon-curtain.mjs';

export async function integrate(scene,renderer,terrain,features,callbacks={}){
  const spec=await fetch('anchors.json').then(r=>r.json());
  const spatial=makeSpatial(terrain,features,spec);
  const legacy=await buildLegacy(renderer,callbacks);
  legacy.materials.entryStoneMat=fineGranite();
  const pathDistance=pathClearance(features.paths);
  const root=new THREE.Group();root.name='Preserved original architecture';scene.add(root);
  const {anchors,byId}=spatial, v=new THREE.Vector3();
  // Keep the original benches, lanterns and noren beside the mapped storefronts.
  Object.assign(byId.chaya_s,{target:[806.8,164.35,-207.5],yaw:0,label:'Nishimura-tei'});
  Object.assign(byId.chaya_n,{target:[815,171.7,-243.5],yaw:0,label:'Okumura-tei'});
  byId.senbon.yaw=spatial.twins[0].at(.01).yaw-Math.PI;
  // Large original authoring containers are organizational, not single buildings.
  // Detach their independent compounds before applying geographic transforms.
  for(const container of [...legacy.scene.children]){
    if(['precinct','yotsu'].includes(container.userData.zone)){
      container.updateMatrixWorld(true);
      for(const child of [...container.children]){
        const zone=child.userData.zone??container.userData.zone;
        legacy.scene.attach(child);child.userData.zone=zone;
      }
      container.removeFromParent();
    }
  }
  const gozendani=legacy.scene.children.find(o=>o.userData.zone==='gozendani');
  if(gozendani)byId.gozendani.source=gozendani.position.toArray();
  // Keep local floor datums exactly consistent with the original builders.
  for(const a of anchors)a.source[1]=legacy.sampleGroundHeight(a.source[0],a.source[2]);
  for(const id of ['chaya_n','chaya_s']){
    const original=legacy.scene.children.find(o=>o.userData.zone===id&&o.isGroup);
    if(original)byId[id].source[1]=original.position.y;
  }
  const nearest=(lookup,x,z)=>lookup.reduce((best,s)=>{
    const d=(x-s.pt.x)**2+(z-s.pt.z)**2;return d<best.d?{s,d}:best;
  },{s:lookup[0],d:Infinity}).s;
  for(const a of anchors.filter(a=>['okusha','kumataka','sannomine','ninomine','mitsurugi','gozendani','summit'].includes(a.id))){
    const old=nearest(a.id==='mitsurugi'||a.id==='gozendani'?legacy.eastLoopLookup:legacy.trailLookup,a.source[0],a.source[2]);
    const node=nearestNode(spatial.graph,a.target,80)?.node;
    if(node&&Math.hypot(old.pt.x-a.source[0],old.pt.z-a.source[2])>2){
      a.yaw=Math.atan2(node.point[0]-a.target[0],node.point[2]-a.target[2])-Math.atan2(old.pt.x-a.source[0],old.pt.z-a.source[2]);
    }else if(node&&a.id==='summit')a.yaw=Math.atan2(node.point[0]-a.target[0],node.point[2]-a.target[2]);
  }
  const pond=features.water.find(w=>w.tags.name==='新池');
  if(pond){
    const center=pond.points.reduce((p,v)=>[p[0]+v[0]/pond.points.length,p[1]+v[2]/pond.points.length],[0,0]);
    byId.kumataka.yaw=-Math.atan2(center[1]-byId.kumataka.target[2],center[0]-byId.kumataka.target[0]);
  }
  function makeRouteMap(lookup,ids){
    const knots=ids.map(id=>({u:nearest(lookup,byId[id].source[0],byId[id].source[2]).u,id}));
    const segments=[];
    for(let i=1;i<knots.length;i++){
      const points=spatial.connected([knots[i-1].id,knots[i].id]);
      segments.push({from:knots[i-1].u,to:knots[i].u,sample:pathSampler(points)});
    }
    return (u)=>{
      const s=segments.find(s=>u<=s.to)??segments.at(-1);
      return s.sample.at((u-s.from)/Math.max(.0001,s.to-s.from));
    };
  }
  const mainMap=makeRouteMap(legacy.trailLookup,spatial.mainIds);
  const eastMap=makeRouteMap(legacy.eastLoopLookup,['yotsu','mitsurugi','summit']);
  function routeFrame(p){
    const main=nearest(legacy.trailLookup,p[0],p[2]),east=nearest(legacy.eastLoopLookup,p[0],p[2]);
    const isEast=p[2]<-190&&Math.hypot(p[0]-east.pt.x,p[2]-east.pt.z)<Math.hypot(p[0]-main.pt.x,p[2]-main.pt.z);
    const s=isEast?east:main;
    const lateral=(p[0]-s.pt.x)*s.right.x+(p[2]-s.pt.z)*s.right.z;
    let mapped=(isEast?eastMap:mainMap)(s.u),offset=lateral;
    // Both Senbon tunnels use their distinct surveyed OSM polylines.
    if(!isEast&&s.u>=.144&&s.u<=.256&&Math.abs(lateral)>1&&Math.abs(lateral)<3.6){
      mapped=spatial.twins[lateral<0?0:1].at((s.u-.144)/(.256-.144));
      offset=lateral-Math.sign(lateral)*2.05;
    }
    const yaw=mapped.yaw-Math.atan2(s.tan.x,s.tan.z);
    const [dx,dz]=rotateXZ(s.right.x*offset,s.right.z*offset,yaw);
    const target=[mapped.point[0]+dx,0,mapped.point[2]+dz];
    target[1]=ground(target[0],target[2])+p[1]-legacy.sampleGroundHeight(p[0],p[2]);
    return {source:p,target,yaw};
  }
  function zoneFor(p,scope){
    if(scope&&scope!=='precinct')return byId[scope];
    if(scope==='precinct'||p[2]>-43){
      return anchors.filter(a=>['romon','gehaiden','naihaiden','honden','okumiya'].includes(a.id))
        .reduce((best,a)=>Math.hypot(p[0]-a.source[0],p[2]-a.source[2])<Math.hypot(p[0]-best.source[0],p[2]-best.source[2])?a:best,byId.romon);
    }
    return null;
  }
  function frame(p,scope,clearance=0){
    const anchor=zoneFor(p,scope);
    const result=anchor??routeFrame(p);
    if(!clearance)return result;
    const target=rigidPoint(p,result.source,result.target,result.yaw);
    for(let round=0;round<3;round++){
      for(const a of clearance>4?anchors:[]){
        const d=Math.hypot(target[0]-a.target[0],target[2]-a.target[2]);
        if(a.radius&&d<a.radius+5){
          const dx=target[0]-a.target[0],dz=target[2]-a.target[2],factor=(a.radius+5)/(d||1);
          target[0]=a.target[0]+(dx||1)*factor;target[2]=a.target[2]+dz*factor;
        }
      }
      const near=pathDistance(target[0],target[2]);
      if(near&&near.distance<clearance){
        const origin=[target[0],target[2]];
        const direction=near.distance>.001?[(target[0]-near.x)/near.distance,(target[2]-near.z)/near.distance]:near.normal;
        for(let i=1;i<=12;i++){
          const x=origin[0]+direction[0]*clearance*i,z=origin[1]+direction[1]*clearance*i;
          const candidate=pathDistance(x,z);
          if(!candidate||candidate.distance>=clearance){target[0]=x;target[2]=z;break;}
        }
      }
    }
    target[1]=ground(target[0],target[2])+p[1]-legacy.sampleGroundHeight(p[0],p[2]);
    return {source:p,target,yaw:result.yaw};
  }
  function matrix(f){
    return new THREE.Matrix4().makeTranslation(...f.target)
      .multiply(new THREE.Matrix4().makeRotationY(f.yaw))
      .multiply(new THREE.Matrix4().makeTranslation(...f.source.map(n=>-n)));
  }
  function ground(x,z){
    const raw=heightAt(terrain,x,z);
    const original=x>790&&x<808&&z>-226&&z<-207?yotsuGrade(x,z,raw):raw;
    let weight=0,weightedHeight=0;
    for(const a of anchors){
      if(['yotsu','chaya_n','chaya_s'].includes(a.id))continue;
      if(!a.radius)continue;
      if(Math.hypot(x-a.target[0],z-a.target[2])>a.radius*1.5+8)continue;
      const [lx,lz]=rotateXZ(x-a.target[0],z-a.target[2],-a.yaw);
      const localX=a.source[0]+lx,localZ=a.source[2]+lz;
      const pads={romon:[27,16,8],gehaiden:[8.2,6.4,0],naihaiden:[7.4,5,0],honden:[9.2,7,0]};
      const pad=pads[a.id];
      const score=pad?Math.max(Math.abs(lx)/pad[0],Math.abs(lz-pad[2])/pad[1]):Math.hypot(lx,lz)/a.radius;
      const influence=1-THREE.MathUtils.smoothstep(score,.7,1.3);
      if(!influence)continue;
      let localY=a.source[1];
      if(a.id==='romon'||a.id==='naihaiden')
        localY=a.id==='romon'&&Math.abs(localX)>5.2&&localZ>2.5&&localZ<6.5?0:legacy.sampleGroundHeight(localX,localZ);
      if(a.id==='romon')localY=entryHeight(localX,localZ,localY);
      weightedHeight+=(a.target[1]+localY-a.source[1])*influence;weight+=influence;
    }
    return weight?THREE.MathUtils.lerp(original,weightedHeight/weight,Math.min(1,weight)):original;
  }
  function moveObject(object){
    refineShrineFinishes(object,legacy.materials.entryStoneMat);
    // Replace only generic slabs/shells; original source files and detailed
    // fittings remain intact. No square plaza is laid across mapped stairways.
    if(object.userData.zone==='yotsu'&&object.isMesh&&object.geometry.type==='BoxGeometry'&&
      (object.geometry.parameters.width>15||object.geometry.parameters.depth>15))return;
    if(['chaya_n','chaya_s'].includes(object.userData.zone)){
      for(const child of [...object.children]){
        if(child.geometry?.type==='BoxGeometry'&&child.geometry.parameters.width>4)child.removeFromParent();
      }
    }
    if(object.isInstancedMesh){
      const m=new THREE.Matrix4(),position=new THREE.Vector3();
      for(let i=0;i<object.count;i++){
        object.getMatrixAt(i,m);position.setFromMatrixPosition(m);
        if(legacy.toriiMeshes.includes(object)){
          if(position.z<-43){
            object.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));continue;
          }
          const s=nearest(legacy.trailLookup,position.x,position.z);
          const side=(position.x-s.pt.x)*s.right.x+(position.z-s.pt.z)*s.right.z;
          if(s.u>=.144&&s.u<=.256&&Math.abs(side)>1&&Math.abs(side)<3.6){
            // Rebuilt below at meter spacing on the two real paths.
            object.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));continue;
          }
        }
        const f=frame(position.toArray(),object.userData.zone,legacy.foliage.includes(object)?4.5:0);
        m.premultiply(matrix(f));object.setMatrixAt(i,m);
      }
      object.instanceMatrix.needsUpdate=true;object.computeBoundingBox();object.computeBoundingSphere();
    }else{
      const box=new THREE.Box3().setFromObject(object);
      box.getCenter(v);
      // Groups' authored origins keep compounds together, including internal stairs.
      const point=(object.isGroup||object.isLight)&&object.position.lengthSq()>0?object.position.toArray():[v.x,legacy.sampleGroundHeight(v.x,v.z),v.z];
      const f=frame(point,object.userData.zone,object.userData.pathClearance??0);
      object.applyMatrix4(matrix(f));
    }
    root.add(object);
  }
  const originalStats={roots:legacy.scene.children.length,meshes:0,instances:0};
  legacy.scene.traverse(o=>{if(o.isMesh)originalStats.meshes++;if(o.isInstancedMesh)originalStats.instances+=o.count;});
  for(const object of [...legacy.scene.children])moveObject(object);
  callbacks.progress?.('Adapting paving, stairs and torii to the trails…');
  const surfaces=makePathSurfaces(features,ground),twinColliders=[];
  const pilgrimage=pathClearance([{points:spatial.main},{points:spatial.returning}]);
  const sourcePaths=new Map(features.paths.map(p=>[p.id,p]));
  for(const review of surfaces.stats.profileReview){
    const path=sourcePaths.get(review.id),a=path.points[0],b=path.points.at(-1);
    review.rawDemStart=heightAt(terrain,a[0],a[2]);review.rawDemEnd=heightAt(terrain,b[0],b[2]);
    review.adaptedGround=Math.abs(review.rawDemStart-review.startHeight)>.02||Math.abs(review.rawDemEnd-review.endHeight)>.02;
    review.nearPilgrimage=(pilgrimage(review.center[0],review.center[2])?.distance??Infinity)<12;
    const nearestAnchor=anchors.reduce((best,anchor)=>{
      const distance=Math.hypot(anchor.target[0]-review.center[0],anchor.target[2]-review.center[2]);
      return !best||distance<best.distance?{id:anchor.id,label:anchor.label,distance}:best;
    },null);
    review.nearestAnchor=nearestAnchor;
    if(review.adaptedGround)review.reasons.push('local terrace grading modifies raw DEM; inspect authored stairs before changing heights');
  }
  const senbon=buildSenbon(root,legacy,spatial,surfaces.height,twinColliders);

  // Reuse each lower building as a rigid object, never stretch the old compressed precinct.
  const gltfLoader=new GLTFLoader();
  for(const id of ['romon','gehaiden','naihaiden','honden']){
    callbacks.progress?.(`Integrating ${id} with its original details…`);
    const gltf=await gltfLoader.loadAsync(`${id}.glb`);
    if(id==='romon')refineRomonCurtain(gltf.scene);
    gltf.scene.traverse(object=>{
      if(!object.isMesh)return;
      object.castShadow=true;object.receiveShadow=true;
      const tags={Vermilion_ShuIro:'vermilionMat',Black_Lacquer_Nemaki:'blackNemakiMat',
        Granite_Stone_Moss:'stoneMat',Flagstone_Walkway:'flagstoneMat',Courtyard_Gravel_Dark:'gravelMat',
        White_Shikku_Plaster:'plasterMat',Gold_Kanagu_Leaf:'goldMat',Copper_Patina_Green:'copperRoofMat'};
      for(const [tag,key] of Object.entries(tags))if(object.material.name.includes(tag)){object.material=legacy.materials[id==='romon'&&key==='stoneMat'?'entryStoneMat':key];break;}
    });
    gltf.scene.applyMatrix4(matrix(byId[id]));root.add(gltf.scene);
  }
  const entrySteps=new THREE.Group();entrySteps.name='Romon podium approach adapter';
  for(const flight of [{count:11,width:9.2,start:6.5,end:3.4,bottom:0,rise:2.1},{count:4,width:3.6,start:-5,end:-3.4,bottom:1.6,rise:.5}]){
    const depth=Math.abs(flight.end-flight.start)/flight.count;
    for(let i=0;i<flight.count;i++){
      const height=flight.rise*(i+1)/flight.count;
      const step=new THREE.Mesh(new THREE.BoxGeometry(flight.width,height,depth+.015),legacy.materials.entryStoneMat);
      step.position.set(0,flight.bottom+height/2,flight.start+(flight.end-flight.start)*(i+.5)/flight.count);
      step.receiveShadow=true;entrySteps.add(step);
    }
  }
  entrySteps.applyMatrix4(matrix(byId.romon));root.add(entrySteps);
  // Transform original physical obstacles with the same zone/route rules as their meshes.
  const colliders=legacy.colliders.map(c=>{
    if(['yotsutsuji_rail','chaya'].includes(c.args.at(-1)))return null;
    const args=[...c.args],x=args[0],z=args[1];
    if(args.at(-1)==='torii'){
      if(z<-43)return null;
      const s=nearest(legacy.trailLookup,x,z);
      if(s.u>=.144&&s.u<=.256)return null;
    }
    const tag=args.at(-1);
    const named={gonden:'gonden',tamayama_inari:'tamayama',byakkosha:'byakko',okumiya:'okumiya',gozendani:'gozendani'};
    const zone=named[tag]??(['chaya','chaya_bench'].includes(tag)?(z<-205?'chaya_n':'chaya_s'):c.zone);
    const f=frame([x,legacy.sampleGroundHeight(x,z),z],zone,tag==='tree'?4.5:['sign','lantern'].includes(tag)?2.2:0);
    const p=rigidPoint([x,0,z],f.source,f.target,f.yaw);
    args[0]=p[0];args[1]=p[2];
    const ymin=c.type==='box'?5:3,ymax=ymin+1;
    args[ymin]=(args[ymin]??-100)+f.target[1]-f.source[1];
    args[ymax]=(args[ymax]??500)+f.target[1]-f.source[1];
    if(c.type==='box')args[4]=(args[4]??0)+f.yaw;
    return {type:c.type,args};
  }).filter(Boolean);
  colliders.push(...twinColliders);
  const yotsutsuji=buildYotsutsuji(root,legacy,features,ground,colliders,surfaces);
  const mountainTorii=buildMountainTorii(root,legacy,spatial,surfaces,colliders);
  const forest=extendForest(root,legacy,features,anchors,ground,pathDistance,colliders);
  const terraces=supportTerraces(root,legacy,ground);
  for(const mesh of [...legacy.foliage,...legacy.toriiMeshes]){
    if(!mesh.parent)continue;
    const parent=mesh.parent;mesh.updateMatrix();
    parent.add(partitionInstances(mesh));mesh.removeFromParent();
  }
  // Batch static detail by material after placement. Interactive objects and
  // animated candle flames retain their original identity and callbacks.
  root.updateMatrixWorld(true);
  const walkSurfaces=[];
  root.traverse(object=>{
    if(!object.isMesh||object.isInstancedMesh||![legacy.materials.stoneMat,legacy.materials.flagstoneMat,legacy.materials.gravelMat,legacy.materials.entryStoneMat].includes(object.material))return;
    const geo=object.geometry.clone().applyMatrix4(object.matrixWorld),position=geo.attributes.position,index=geo.index;
    const vertices=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
    for(let i=0;i<(index?index.count:position.count);i+=3){
      a.fromBufferAttribute(position,index?index.getX(i):i);b.fromBufferAttribute(position,index?index.getX(i+1):i+1);c.fromBufferAttribute(position,index?index.getX(i+2):i+2);
      normal.crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();
      if(normal.y>.75&&Math.max(a.y,b.y,c.y)-Math.min(a.y,b.y,c.y)<.3)vertices.push(...a.toArray(),...b.toArray(),...c.toArray());
    }
    geo.dispose();
    if(vertices.length){
      const floorGeo=new THREE.BufferGeometry();floorGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
      walkSurfaces.push(new THREE.Mesh(floorGeo,object.material));
    }
  });
  const floorRay=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
  function walkHeight(x,z,previous=ground(x,z)){
    const base=surfaces.height(x,z);
    floorRay.set(new THREE.Vector3(x,Math.max(base,previous)+.42,z),down);floorRay.far=2;
    const hit=floorRay.intersectObjects(walkSurfaces,false).find(hit=>hit.point.y>=base-.15&&hit.point.y<=Math.max(base,previous)+.24);
    return hit?Math.max(base,hit.point.y+.025):base;
  }
  const buckets=new Map(),retained=new Set([...legacy.interactables,...legacy.flickeringCandleMeshes]);
  for(const object of legacy.interactables)object.traverse(child=>retained.add(child));
  root.traverse(object=>{
    if(!object.isMesh||object.isInstancedMesh||retained.has(object)||Array.isArray(object.material))return;
    object.geometry.computeBoundingSphere();
    const center=object.geometry.boundingSphere.center.clone().applyMatrix4(object.matrixWorld);
    const key=`${Math.floor(center.x/128)},${Math.floor(center.z/128)}:`+object.material.uuid+Object.keys(object.geometry.attributes).sort().join(',')+Boolean(object.geometry.index);
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(object);
  });
  for(const objects of buckets.values()){
    if(objects.length<2)continue;
    const geometries=objects.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));
    const merged=mergeGeometries(geometries,false);
    geometries.forEach(g=>g.dispose());
    if(!merged)continue;
    const mesh=new THREE.Mesh(merged,objects[0].material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
    objects.forEach(o=>o.removeFromParent());
  }
  const inventory={...originalStats,anchors:anchors.length,senbonGates:senbon.gates,senbon,mountainTorii,pathSurfaces:surfaces.stats,
    forest,terraces,yotsutsuji,source:'interactive_viewer/index.html',replaced:['compressed terrain','compressed path ribbons','illustrative distant city'],...legacy.report};
  return {root,spatial,ground,walkHeight,surfaces,pathDistance,legacy,colliders,inventory,
    excludesBuilding:b=>teaHouses.some(s=>s.id===b.id)||anchors.some(a=>a.osm===b.id||a.radius&&b.points.some(p=>Math.hypot(p[0]-a.target[0],p[2]-a.target[2])<a.radius*.65))};
}
