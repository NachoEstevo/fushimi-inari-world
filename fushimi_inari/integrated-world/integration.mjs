import {buildOfficePondSurfaces} from './office-pond-surfaces.mjs?v=86';
import {buildOfficeGardenBanks} from './office-garden-banks.mjs?v=84';
import {buildPrecinctNorthContext} from './precinct-north-context.mjs?v=84';
import {buildNearPrecinctShrineRow} from './near-precinct-shrine-row.mjs';
import {buildNearPrecinctEnclosures} from './near-precinct-enclosures.mjs';
import {buildNearPrecinctDrains} from './near-precinct-drains.mjs';
import {buildPrecinctShrineCourts} from './precinct-shrine-courts.mjs?v=76';
import {buildNearPrecinctMineralCourts} from './near-precinct-mineral-courts.mjs?v=83';
import {buildTamayamaStairBorders} from './tamayama-stair-borders.mjs?v=77';
import {buildGondenSurroundings} from './gonden-surroundings.mjs?v=76';
import {clearEntranceStatues} from './entrance-statue-clearance.mjs?v=57';
import {buildNorthCourtBuildings,northCourtBuildingIds} from './north-court-buildings.mjs?v=49b';
import {buildNorthCourtPlanting} from './north-court-planting.mjs?v=51';
import {buildEntranceSidePlanting} from './entrance-side-planting.mjs?v=52';
import {buildOmotesandoShoulders} from './omotesando-shoulders.mjs?v=63';
import {buildEntranceMappedBoundaries} from './entrance-mapped-boundaries.mjs?v=62';
import {buildEntranceHedgeUnderstory} from './entrance-hedge-understory.mjs?v=62';
import {buildEntranceShrineEnclosures} from './entrance-shrine-enclosures.mjs?v=61';
import {clearLegacyShrineConflicts} from './entrance-legacy-shrine-conflicts.mjs?v=59';
import {buildEntranceRoadsideShrines} from './entrance-roadside-shrines.mjs?v=62';
import {buildEntranceShrineCourtDetails} from './entrance-shrine-court-details.mjs?v=62';
import {buildEntranceShrineCourtTrees} from './entrance-shrine-court-trees.mjs?v=62';
import {buildEntranceShrineCourt} from './entrance-shrine-court.mjs?v=62';
import {buildEntranceCourtMonument} from './entrance-court-monument.mjs?v=62';
import {buildEntranceRoadsideBasin} from './entrance-roadside-basin.mjs?v=62';
import {buildEntranceGuardhouseDetails} from './entrance-guardhouse-details.mjs?v=62';
import {buildEntranceAreaSurfaces} from './entrance-area-surfaces.mjs?v=59';
import {alignFirstOmotesandoTorii} from './first-torii-alignment.mjs?v=58';
import {placeMappedInariStation,mappedStationId} from './station-placement.mjs?v=54';
import {clearLegacyApproachSlabs} from './legacy-approach-slabs.mjs?v=54';
import {isUnsupportedEntranceProp,isUnsupportedEntranceCollider} from './entrance-unsupported-props.mjs?v=56';
import {buildEntranceNeighborhood} from './entrance-neighborhood.mjs?v=63';
import {buildEntranceMappedTrees} from './entrance-mapped-trees.mjs?v=63';
import {buildGishikidenAccessSurface} from './entrance-gishikiden-access-surface.mjs?v=63';
import {buildEntranceBicycleGate} from './entrance-bicycle-gate.mjs?v=63';
import {buildEntranceBicycleSurfaceCollar} from './entrance-bicycle-surface-collar.mjs?v=63';
import {installPrecinctLife} from './precinct-life.mjs?v=34';
import {preservedForestLOD} from './forest-lod.mjs';
import {bambooLOD} from './bamboo-details.mjs';
import {buildAinomine} from './mountain-landmarks.mjs';
import {refineKumatakasha} from './mountain-landmarks-kumataka.mjs';
import {okushaCourtGrade} from './okusha-court.mjs?v=25';
import {buildOkushaCourt} from './okusha-details.mjs?v=26c';
import {refineEntranceObjects,refineRomonShrubs,buildReception} from './entrance-refinements.mjs?v=86';
import {refineTemizuyaDetails} from './temizuya-details.mjs?v=40b';
import {refineRomonGold,refineRomonGables} from './precinct-details.mjs';
import {buildPathMargins} from './path-margins.mjs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildLegacy} from './legacy-builders.mjs';
import {extendForest} from './forest.mjs?v=66-mountain';
import {heightAt,nearestNode} from '../geography/geo-core.mjs';
import {makeSpatial,pathSampler,rigidPoint,rotateXZ,pathClearance} from './spatial.mjs';
import {makePathSurfaces} from './path-surfaces.mjs?v=68-near-precinct';
import {buildSenbon} from './senbon.mjs?v=37';
import {buildMountainTorii} from './mountain-torii.mjs?v=67-mountain';
import {supportTerraces} from './terrace-foundations.mjs';
import {buildYotsutsuji,teaHouses} from './yotsutsuji.mjs?v=33';
import {yotsuGrade} from './site-grading.mjs';
import {partitionInstances} from './spatial-mesh.mjs';
import {refineShrineFinishes} from './shrine-finishes.mjs?v=15';
import {fineGranite,courtyardGravel,precinctPaving} from './surface-materials.mjs?v=16';
import {entryHeight} from './entry-profile.mjs';
import {precinctLevel,lowerCourtBlend,sanctuaryCourtBlend} from './precinct-grade.mjs?v=25e';
import {buildSanctuaryLanding,buildSanctuaryApproaches} from './sanctuary-landing.mjs?v=25b';
import {separatedTemizuya,westStairHeight,westLandingTransition} from './entrance-layout.mjs';
import {buildRomonCourtSideDetails} from './romon-court-side-details.mjs?v=70';
import {refineRomonWings} from './romon-wings.mjs?v=71';
import {buildAzumamaroHouses,azumamaroHouseIds} from './azumamaro-houses.mjs?v=47';
import {buildAzumamaroCourtDetails} from './azumamaro-court-details.mjs?v=47';
import {buildAzumamaroContext,azumamaroContextIds} from './azumamaro-context.mjs?v=46';
import {buildAzumamaroPlanting} from './azumamaro-planting.mjs?v=44c';
import {makeAzumamaroCourtGrade,makeNorthCourtGrade} from './entrance-ground.mjs?v=49';
import {clearAzumamaroLegacySugi} from './azumamaro-legacy-clearance.mjs?v=45b';
import {buildAzumamaroSignage} from './azumamaro-signage.mjs?v=43';
import {refineGehaiden} from './gehaiden-refinements.mjs?v=48';
import {buildRomonSurroundingsR72} from './romon-surroundings-r72.mjs';
import {buildOmotesandoBollards} from './omotesando-bollards.mjs';
import {buildEntranceBoundaries} from './entrance-boundaries.mjs';
import {buildLateralEntryDetails} from './lateral-entry-details.mjs?v=47bb';
import {clearWestStairPodium} from './entrance-stair-clearance.mjs';
import {refineRomonCurtain} from './romon-curtain.mjs';
import {refineByakkoDetails,seatByakkoDetails} from './byakko-details.mjs';
import {refineNaihaiden} from './naihaiden-refinements.mjs';
import {refineOkumiya} from './okumiya-facade.mjs?v=69-near-precinct';
import {refineTamayama,buildTamayamaCompound} from './tamayama-compound.mjs?v=68-near-precinct';
import {buildTamayamaForecourt} from './tamayama-forecourt.mjs?v=76';
import {refineTamayamaOkumiyaAccess} from './tamayama-okumiya-access.mjs?v=68-near-precinct';
import {refineGondenFacade} from './gonden-facade.mjs?v=65';
import {okumiyaTerrainGrade,okumiyaLandingEdges} from './okumiya-grade.mjs?v=39b';
import {sanctuaryTerrainSupport} from './sanctuary-terrain-support.mjs?v=65b';
import {tamayamaAccessTerrain} from './tamayama-access-support.mjs?v=66';
import {tamayamaAccessFeatures} from './tamayama-access-width.mjs?v=66';
import {buildTamayamaStairRail,buildOkumiyaStairRail} from './tamayama-stair-rail.mjs?v=77';
import {buildGondenAccessTorii} from './gonden-access-torii.mjs?v=66';
import {buildTamayamaAccessShoulders} from './tamayama-access-shoulders.mjs?v=66';
import {refineNinomine} from './ninomine-details.mjs?v=39';

export async function integrate(scene,renderer,terrain,features,callbacks={}){
  const [spec,entranceBarriers,entranceSurfaces,entranceContext]=await Promise.all([
    fetch('anchors.json').then(r=>r.json()),
    fetch('../geography/sources/entrance-barriers.json').then(r=>{if(!r.ok)throw new Error('Entrance barrier data unavailable');return r.json();}),
    fetch('../geography/sources/entrance-surfaces-r54.json').then(r=>{if(!r.ok)throw new Error('Entrance surface data unavailable');return r.json();}),
    fetch('../geography/sources/entrance-context-r55.json').then(r=>{if(!r.ok)throw new Error('Entrance context data unavailable');return r.json();})
  ]);
  const spatial=makeSpatial(terrain,features,spec);
  const legacy=await buildLegacy(renderer,callbacks);
  legacy.materials.entryStoneMat=fineGranite();
  legacy.materials.gravelMat.copy(courtyardGravel());
  legacy.materials.precinctPaving=precinctPaving();
  legacy.materials.precinctCobbles=precinctPaving(true);
  legacy.materials.goldMat.color.set('#e7bc62');
  legacy.materials.goldMat.roughness=.32;
  legacy.materials.goldMat.metalness=.68;
  const pathDistance=pathClearance(features.paths);
  const root=new THREE.Group();root.name='Preserved original architecture';scene.add(root);
  const {anchors,byId}=spatial, v=new THREE.Vector3();
  const northCourtGrade=makeNorthCourtGrade(byId.romon,features);
  const azumamaroCourtGrade=makeAzumamaroCourtGrade(byId.romon,features,(x,z)=>heightAt(terrain,x,z));
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
  // GSI's 10 m grid cannot resolve the court versus raised building plinths.
  // Video-guided shared court datum; preserve the hall's own authored podium.
  byId.gehaiden.target[1]=byId.romon.target[1];
  byId.naihaiden.target[1]=byId.romon.target[1]+1.6;
  byId.honden.target[1]=byId.naihaiden.target[1];
  byId.gonden.target[1]=byId.naihaiden.target[1];
  // Tamayama is ~60 m beyond Naihaiden, outside its shared terrace. Forcing
  // the same datum excavated a ~6 m pit and a 0.55 m/sample access drop.
  // Retain its geographic elevation; exact stair geometry remains unverified.
  byId.temizuya.mappedTarget=[...byId.temizuya.target];
  byId.temizuya.target=separatedTemizuya(byId.romon,byId.temizuya);
  byId.temizuya.placementStatus='Video-inferred roof clearance; mapped POI retained as mappedTarget';
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
  // The court meets the shared tunnel exit; a coarse hillside DEM is not a podium survey.
  byId.okusha.target[1]=spatial.twins[0].at(1).point[1];
  byId.okusha.yaw=-Math.PI+.14;
  byId.okusha.radius=22;
  const oldOkusha=legacy.scene.children.find(o=>o.userData.zone==='okusha'&&o.isGroup);
  if(oldOkusha)byId.okusha.source[1]=oldOkusha.position.y;
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
    const [ex,ez]=rotateXZ(x-byId.romon.target[0],z-byId.romon.target[2],-byId.romon.yaw);
    const west=westStairHeight(ex,ez);
    if(west!==null)return byId.romon.target[1]-byId.romon.source[1]+west;
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
        localY=a.id==='romon'&&Math.abs(localX)>5.2&&localZ>2.5&&localZ<6.5?0:precinctLevel(localZ);
      if(a.id==='romon')localY=entryHeight(localX,localZ,localY);
      weightedHeight+=(a.target[1]+localY-a.source[1])*influence;weight+=influence;
    }
    const courtyard=weight?THREE.MathUtils.lerp(original,weightedHeight/weight,Math.min(1,weight)):original;
    const datum=byId.romon.target[1]-byId.romon.source[1];
    const connected=lowerCourtBlend(ex,ez,courtyard,byId.romon.target[1]);
    const [nx,nz]=rotateXZ(x-byId.naihaiden.target[0],z-byId.naihaiden.target[2],-byId.naihaiden.yaw);
    const upper=sanctuaryCourtBlend(nx+byId.naihaiden.source[0],nz+byId.naihaiden.source[2],connected,datum);
    return northCourtGrade(x,z,azumamaroCourtGrade(x,z,okushaCourtGrade(x,z,datum+westLandingTransition(ex,ez,upper-datum),byId.okusha.target[1])));
  }
  let kumatakaRefinement=null,okumiyaRefinement=null;
  function moveObject(object){
    if(isUnsupportedEntranceProp(object))return;
    // The illustrative flank pavilion was carried with Gehaiden onto the
    // mapped Azumamaro approach. Keep the sourced main hall, not this duplicate.
    if(object.userData.zone==='gehaiden'&&object.isGroup&&
      Math.abs(object.position.x-15.8)<.01&&Math.abs(object.position.z+12.5)<.01)return;
    // The eight old tunnel fixtures were loose children of the precinct,
    // so nearest-building placement stranded them around Okumiya. Rebuild
    // their mounts with the mapped torii below, never as independent props.
    const p=object.geometry?.parameters;
    if(object.userData.zone==='precinct'&&object.isMesh&&object.position.z<-43&&p&&(
      (p.width===.36&&p.height===.10&&p.depth===.36)||
      (p.width===.24&&p.height===.24&&p.depth===.24&&object.material===legacy.materials.lanternGlowMat)||
      (p.radiusTop===.012&&p.radiusBottom===.012&&p.height===.42)))return;
    // buildConvergenceAprons authored a compressed, illustrative route. Its
    // loose slabs and fence posts cannot be rigidly relocated with Okumiya:
    // the mapped staircase now owns this connection. Keep shrine groups intact.
    if(object.userData.zone==='okumiya'&&object.isMesh&&object.geometry.type==='BoxGeometry')return;
    refineEntranceObjects(object,legacy.materials);
    refineTemizuyaDetails(object);
    refineShrineFinishes(object,legacy.materials.entryStoneMat);
    refineNinomine(object,legacy.materials);
    kumatakaRefinement=refineKumatakasha(object,legacy.materials)??kumatakaRefinement;
    refineOkumiya(object,legacy.materials);
    refineByakkoDetails(object,legacy.materials);
    if(object.userData.okumiyaDetail)okumiyaRefinement=object.userData.okumiyaDetail;
    refineTamayama(object,legacy.materials);
    refineGondenFacade(object,legacy.materials);
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
  const surfaces=makePathSurfaces(tamayamaAccessFeatures(features),ground),twinColliders=[];
  surfaces.terrainHeight=okumiyaTerrainGrade(surfaces);
  surfaces.terrainHeight=sanctuaryTerrainSupport(surfaces);
  surfaces.terrainHeight=tamayamaAccessTerrain(surfaces,features);
  surfaces.edgeCovered=okumiyaLandingEdges(surfaces,features);
  const nearPrecinctAccess=refineTamayamaOkumiyaAccess(surfaces,features);
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
    if(id==='naihaiden')document.body.dataset.naihaidenDetail=JSON.stringify(refineNaihaiden(gltf.scene,legacy.materials));
    if(id==='gehaiden'){
      refineGehaiden(gltf.scene,legacy.materials);
      document.body.dataset.gehaidenRails=String(gltf.scene.userData.gehaidenBalustradeRemovalCount??0);
    }
    if(id==='romon'){
      // Export manifest: these two materials contain only T00 approach slabs.
      // Terrain + mapped path surfaces now own the outdoor floor; a rigid slab
      // cannot follow their grade and leaves exposed vertical/triangular edges.
      const obsolete=[];
      gltf.scene.traverse(o=>{if(o.isMesh&&/Courtyard_Gravel_Dark|Flagstone_Walkway/.test(o.material.name))obsolete.push(o);});
      obsolete.forEach(o=>{o.removeFromParent();o.geometry.dispose();});
    }
    if(id==='romon'){refineRomonCurtain(gltf.scene);refineRomonGold(gltf.scene,legacy.materials.goldMat);refineRomonGables(gltf.scene,legacy.materials.goldMat);}
    gltf.scene.traverse(object=>{
      if(!object.isMesh||object.material===legacy.materials.goldMat)return;
      if(id==='romon'&&object.material.name.includes('Foliage_Canopy')){refineRomonShrubs(object);return;}
      if(id==='romon'&&object.material.name.includes('Granite_Stone_Moss'))clearWestStairPodium(object);
      object.castShadow=true;object.receiveShadow=true;
      const tags={Vermilion_ShuIro:'vermilionMat',Black_Lacquer_Nemaki:'blackNemakiMat',
        Granite_Stone_Moss:'stoneMat',Flagstone_Walkway:'flagstoneMat',Courtyard_Gravel_Dark:'gravelMat',
        White_Shikku_Plaster:'plasterMat',Gold_Kanagu_Leaf:'goldMat',Copper_Patina_Green:'copperRoofMat'};
      for(const [tag,key] of Object.entries(tags))if(object.material.name.includes(tag)){object.material=legacy.materials[key==='flagstoneMat'?'precinctPaving':['romon','naihaiden','honden'].includes(id)&&key==='stoneMat'?'entryStoneMat':key];break;}
    });
    if(id==='romon')document.body.dataset.romonWings=JSON.stringify(refineRomonWings(gltf.scene,legacy.materials));
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
  const colliders=legacy.colliders.filter(c=>c.args.at(-1)!=='kaguraden'&&!isUnsupportedEntranceCollider(c)).map(c=>{
    if(['yotsutsuji_rail','chaya'].includes(c.args.at(-1)))return null;
    const args=[...c.args],x=args[0],z=args[1];
    if(args.at(-1)==='torii'){
      if(z<-43)return null;
      const s=nearest(legacy.trailLookup,x,z);
      if(s.u>=.144&&s.u<=.256)return null;
    }
    const tag=args.at(-1);
    if(tag==='okumiya'&&c.type==='box')args[4]-=Math.PI/2+.06;
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
  document.body.dataset.azumamaroTreesCleared=String(clearAzumamaroLegacySugi(legacy,features,colliders));
  colliders.push(...twinColliders);
  const tamayamaCompound=buildTamayamaCompound(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.tamayamaForecourt=JSON.stringify(buildTamayamaForecourt(root,features,surfaces,legacy.materials));
  document.body.dataset.precinctShrineCourts=JSON.stringify(buildPrecinctShrineCourts(root,features,surfaces,legacy.materials));
  document.body.dataset.nearPrecinctMineralCourts=JSON.stringify(buildNearPrecinctMineralCourts(root,features,surfaces,legacy.materials));
  const officePonds=buildOfficePondSurfaces(root,features,surfaces,legacy.materials);
  document.body.dataset.officeGardenBanks=JSON.stringify(buildOfficeGardenBanks(root,features,surfaces));
  const precinctNorthContext=buildPrecinctNorthContext(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.precinctNorthContext=JSON.stringify(precinctNorthContext);
  const nearPrecinctShrineRow=buildNearPrecinctShrineRow(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.nearPrecinctShrineRow=JSON.stringify(nearPrecinctShrineRow);
  document.body.dataset.nearPrecinctEnclosures=JSON.stringify(buildNearPrecinctEnclosures(root,features,surfaces,legacy.materials,colliders));
  document.body.dataset.nearPrecinctDrains=JSON.stringify(buildNearPrecinctDrains(root,features,surfaces,legacy.materials));
  document.body.dataset.tamayamaStairBorders=JSON.stringify(buildTamayamaStairBorders(root,features,surfaces,legacy.materials));
  document.body.dataset.gondenSurroundings=JSON.stringify(buildGondenSurroundings(root,features,surfaces,legacy.materials,colliders));
  document.body.dataset.tamayamaCompound=JSON.stringify(tamayamaCompound);
  document.body.dataset.okumiyaDetail=JSON.stringify(okumiyaRefinement);
  document.body.dataset.nearPrecinctAccess=JSON.stringify(nearPrecinctAccess);
  document.body.dataset.tamayamaRail=JSON.stringify(buildTamayamaStairRail(root,surfaces,colliders));
  document.body.dataset.okumiyaRail=JSON.stringify(buildOkumiyaStairRail(root,surfaces,colliders));
  document.body.dataset.gondenAccessTorii=JSON.stringify(buildGondenAccessTorii(root,legacy,features,surfaces,colliders));
  document.body.dataset.tamayamaShoulders=JSON.stringify(buildTamayamaAccessShoulders(root,features,surfaces,legacy.materials));
  document.body.dataset.entranceShrineConflicts=JSON.stringify(clearLegacyShrineConflicts(root,colliders));
  legacy.interactables=legacy.interactables.filter(o=>!o.userData.legacyShrineConflictRemoved);
  legacy.flickeringCandleMeshes=legacy.flickeringCandleMeshes.filter(o=>!o.userData.legacyShrineConflictRemoved);
  document.body.dataset.byakkoDetails=JSON.stringify(seatByakkoDetails(root,surfaces,colliders));
  buildSanctuaryLanding(root,byId.naihaiden,legacy.materials,colliders);
  buildSanctuaryApproaches(root,features,surfaces,legacy.materials);
  buildRomonCourtSideDetails(root,byId.romon,legacy.materials);
  buildEntranceBoundaries(root,byId.romon,features,surfaces,legacy.materials,colliders);
  document.body.dataset.romonSurroundings=JSON.stringify(buildRomonSurroundingsR72(root,byId.romon,surfaces,legacy.materials));
  buildEntranceSidePlanting(root,byId.romon);
  buildOmotesandoShoulders(root,features,ground,surfaces,legacy.materials);
  document.body.dataset.omotesandoBollards=JSON.stringify(buildOmotesandoBollards(root,features,surfaces,legacy.materials,colliders));
  buildEntranceMappedBoundaries(root,entranceBarriers,ground,legacy.materials,colliders);
  document.body.dataset.entranceUnderstory=JSON.stringify(buildEntranceHedgeUnderstory(root,entranceBarriers,surfaces));
  document.body.dataset.entranceShrineEnclosures=JSON.stringify(buildEntranceShrineEnclosures(root,entranceBarriers,ground,legacy.materials,colliders).ways);
  document.body.dataset.entranceRoadsideShrines=JSON.stringify(buildEntranceRoadsideShrines(root,features,surfaces,legacy.materials,colliders).records);
  buildEntranceShrineCourt(root,features,surfaces);
  document.body.dataset.entranceCourtDetails=JSON.stringify(buildEntranceShrineCourtDetails(root,features,surfaces,legacy.materials,colliders).records);
  document.body.dataset.entranceCourtTrees=JSON.stringify(buildEntranceShrineCourtTrees(root,features,surfaces,colliders));
  document.body.dataset.entranceCourtMonument=JSON.stringify(buildEntranceCourtMonument(root,features,surfaces,legacy.materials,colliders));
  document.body.dataset.entranceRoadsideBasin=JSON.stringify(buildEntranceRoadsideBasin(root,entranceBarriers,surfaces,legacy.materials,colliders,features));
  buildEntranceAreaSurfaces(root,entranceSurfaces,features,surfaces.terrainHeight);
  document.body.dataset.bicycleSurfaceCollar=JSON.stringify(buildEntranceBicycleSurfaceCollar(root,features,surfaces,surfaces.terrainHeight));
  document.body.dataset.gishikidenAccess=JSON.stringify(buildGishikidenAccessSurface(root,features,surfaces));
  const bicycleGate=buildEntranceBicycleGate(root,features,entranceBarriers,surfaces,legacy.materials,colliders);
  if(bicycleGate)document.body.dataset.bicycleGate=JSON.stringify(bicycleGate.group.userData);
  document.body.dataset.firstToriiAlignment=JSON.stringify(alignFirstOmotesandoTorii(root,features,surfaces,colliders));
  const stationPlacement=placeMappedInariStation(root,features,surfaces,colliders);
  document.body.dataset.stationPlacement=JSON.stringify(stationPlacement);
  document.body.dataset.approachSlabs=JSON.stringify(clearLegacyApproachSlabs(root));
  document.body.dataset.entranceStatues=JSON.stringify(clearEntranceStatues(root,entranceBarriers,features,surfaces,colliders));
  const guardhouse=buildEntranceGuardhouseDetails(root,features,surfaces,legacy.materials,colliders);
  const neighborhoodFeatures=guardhouse?{...features,buildings:features.buildings.filter(b=>b.id!==guardhouse.id)}:features;
  const entranceNeighborhood=buildEntranceNeighborhood(root,neighborhoodFeatures,surfaces.terrainHeight,legacy.materials,colliders,surfaces);
  if(guardhouse)entranceNeighborhood.builtIds.push(guardhouse.id);
  document.body.dataset.entranceNeighborhood=JSON.stringify({builtIds:entranceNeighborhood.builtIds,skipped:entranceNeighborhood.skippedLegacyShopOverlap});
  document.body.dataset.entranceTrees=JSON.stringify(buildEntranceMappedTrees(root,entranceContext,features,surfaces,colliders));
  const lateralEntry=buildLateralEntryDetails(root,features,surfaces,legacy.materials,colliders);
  buildAzumamaroSignage(root,features,surfaces,legacy.materials,colliders);
  if(lateralEntry?.torii){
    const a={id:'azumamaro_entry',label:'Azumamaro · side entrance',target:lateralEntry.torii,radius:0};
    anchors.push(a);byId[a.id]=a;
  }
  const yotsutsuji=buildYotsutsuji(root,legacy,features,ground,colliders,surfaces);
  const ainomine=buildAinomine(root,features,surfaces,legacy.materials,colliders);
  if(ainomine){anchors.push(ainomine.anchor);byId.ainomine=ainomine.anchor;}
  const mountainTorii=buildMountainTorii(root,legacy,spatial,surfaces,colliders,{excludeGate:ainomine?.excludeGate});
  const reception=buildReception(root,features,ground,legacy.materials,colliders);
  buildAzumamaroHouses(root,features,(x,z)=>surfaces.height(x,z),legacy.materials,colliders);
  const courtDetails=buildAzumamaroCourtDetails(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.azumamaroCourtDetails=JSON.stringify(courtDetails);
  buildNorthCourtBuildings(root,features,surfaces,legacy.materials,colliders);
  buildNorthCourtPlanting(root,features,surfaces,legacy.materials,colliders);
  buildAzumamaroContext(root,features,surfaces,legacy.materials,colliders);
  buildAzumamaroPlanting(root,features,surfaces,legacy.materials,colliders);
  if(reception){const a={id:'reception',label:'Shrine reception',target:[30,ground(30,-16.4),-16.4],radius:0};anchors.push(a);byId.reception=a;}
  // Existing mapped outlooks: checkpoints use their connected trail nodes.
  // No invented large terrace is flattened into the mountainside.
  for(const [id,label,osm] of [
    ['kojingamine','Kojingamine · north Kyoto view','node/749327432'],
    ['west_view','Western trail · Kyoto view','node/9673171303']
  ]){
    const poi=features.pois.find(p=>p.id===osm);
    if(poi){const a={id,label,osm,target:[...poi.point],radius:0};anchors.push(a);byId[id]=a;}
  }
  const forest=extendForest(root,legacy,features,anchors,ground,pathDistance,colliders);
  const margins=buildPathMargins(root,surfaces,ground,features,anchors);
  buildOkushaCourt(root,features,byId.okusha,legacy.materials,colliders);
  const terraces=supportTerraces(root,legacy,ground);
  const precinctLife=installPrecinctLife(root,legacy,callbacks);
  for(const mesh of [...legacy.foliage,...legacy.toriiMeshes]){
    if(!mesh.parent)continue;
    const parent=mesh.parent;mesh.updateMatrix();
    const bambooKind=mesh===legacy.foliage[4]?'culms':mesh===legacy.foliage[5]?'leaves':null;
    const chunks=partitionInstances(mesh,bambooKind?64:128);
    if(bambooKind)bambooLOD(chunks,bambooKind);
    else if([legacy.foliage[1],legacy.foliage[2]].includes(mesh))preservedForestLOD(chunks,mesh===legacy.foliage[2]);
    else if(legacy.foliage.includes(mesh))for(const child of chunks.children)child.userData.nearForest=true;
    parent.add(chunks);mesh.removeFromParent();
  }
  // Batch static detail by material after placement. Interactive objects and
  // animated candle flames retain their original identity and callbacks.
  root.updateMatrixWorld(true);
  const walkSurfaces=[];
  const floorMaterials=[legacy.materials.stoneMat,legacy.materials.flagstoneMat,legacy.materials.gravelMat,legacy.materials.entryStoneMat,legacy.materials.precinctPaving,legacy.materials.precinctCobbles,legacy.materials.sanctuaryApronMat];
  root.traverse(object=>{
    if(!object.isMesh||object.isInstancedMesh||![object.material].flat().every(m=>floorMaterials.includes(m)))return;
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
      walkSurfaces.push(new THREE.Mesh(floorGeo,legacy.materials.entryStoneMat));
    }
  });
  const floorRay=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
  function walkHeight(x,z,previous=ground(x,z)){
    const base=surfaces.height(x,z);
    floorRay.set(new THREE.Vector3(x,Math.max(base,previous)+.42,z),down);floorRay.far=2;
    const hit=floorRay.intersectObjects(walkSurfaces,false).find(hit=>hit.point.y>=base-.15&&hit.point.y<=Math.max(base,previous)+.24);
    return hit?Math.max(base,hit.point.y+.025):base;
  }
  // Reviewed exterior positions on the mapped approaches. The nearest graph
  // node can fall beside a stair or inside the sanctuary's solid footprint.
  // Native walking review: the former points were clear of collisions but
  // placed the camera against the lattice. Arrive on the public approach.
  for(const [id,x,z] of [['tamayama',96.05,-33.979],['okumiya',114.75,-15.941]]){
    const anchor=byId[id];
    if(!anchor)continue;
    anchor.checkpoint=[x,walkHeight(x,z),z];
    anchor.lookAt=[anchor.target[0],anchor.target[1]+2,anchor.target[2]];
  }
  const buckets=new Map(),retained=new Set([...legacy.interactables,...legacy.flickeringCandleMeshes]);
  for(const object of legacy.interactables)object.traverse(child=>retained.add(child));
  root.traverse(object=>{
    if(!object.isMesh||object.isInstancedMesh||retained.has(object)||Array.isArray(object.material))return;
    object.geometry.computeBoundingSphere();
    const center=object.geometry.boundingSphere.center.clone().applyMatrix4(object.matrixWorld);
    const key=`${Math.floor(center.x/128)},${Math.floor(center.z/128)}:`+object.material.uuid+Object.keys(object.geometry.attributes).sort().join(',')+Boolean(object.geometry.index)+`:${object.castShadow}:${object.receiveShadow}`;
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(object);
  });
  for(const objects of buckets.values()){
    if(objects.length<2)continue;
    const geometries=objects.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));
    const merged=mergeGeometries(geometries,false);
    geometries.forEach(g=>g.dispose());
    if(!merged)continue;
    const mesh=new THREE.Mesh(merged,objects[0].material);mesh.castShadow=objects[0].castShadow;mesh.receiveShadow=objects[0].receiveShadow;root.add(mesh);
    objects.forEach(o=>o.removeFromParent());
  }
  const forestChunks=[];root.updateMatrixWorld(true);
  root.traverse(o=>{if(!o.userData.nearForest)return;const leaf=o.isLOD?o.levels[0].object:o;leaf.computeBoundingSphere();forestChunks.push({object:o,bounds:leaf.boundingSphere.clone().applyMatrix4(leaf.matrixWorld)});});
  const inventory={activities:precinctLife.stats,...originalStats,anchors:anchors.length,senbonGates:senbon.gates,senbon,mountainTorii,pathSurfaces:surfaces.stats,
    forest,margins,terraces,yotsutsuji,reception,mountainLandmarks:{ainomine:ainomine?.stats??null,kumataka:kumatakaRefinement},
    nearPrecinct:{tamayama:tamayamaCompound,okumiya:okumiyaRefinement,access:nearPrecinctAccess},source:'interactive_viewer/index.html',replaced:['compressed terrain','compressed path ribbons','illustrative distant city'],...legacy.report};
  return {root,spatial,ground,officePonds,walkHeight,precinctLife,forestChunks,surfaces,pathDistance,legacy,colliders,inventory,entranceSurfaces,
    excludesBuilding:b=>precinctNorthContext.builtIds.includes(b.id)||nearPrecinctShrineRow.builtIds.includes(b.id)||entranceNeighborhood.builtIds.includes(b.id)||(stationPlacement.placed&&b.id===mappedStationId)||northCourtBuildingIds.includes(b.id)||azumamaroContextIds.includes(b.id)||azumamaroHouseIds.includes(b.id)||['way/301527739','way/301527730'].includes(b.id)||b.id==='way/105449708'||teaHouses.some(s=>s.id===b.id)||anchors.some(a=>a.osm===b.id||a.radius&&b.points.some(p=>Math.hypot(p[0]-a.target[0],p[2]-a.target[2])<a.radius*.65))};
}
