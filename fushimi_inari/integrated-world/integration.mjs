import {buildKandakaraShrine} from './kandakara-shrine.mjs';
import {buildTakeyaKeepsakes} from './takeya-keepsakes.mjs';
import {buildLateralWaymarkers} from './lateral-waymarkers.mjs';
import {createStartupCheckpoint,yieldStartupTask} from './startup-work.mjs';
import {findVotiveWaxToRetain} from './candle-flame-instances.mjs';
import {createPublicFloorQuery,createPublicGravelSupport} from './public-walk-domain.mjs?v=repair-20261025b';
import {registerMitsurugi} from './mitsurugi-registration.mjs';
import {buildMappedRoofCanopies} from './mapped-roof-canopies.mjs';
import {registeredZenShelters} from './zen-shelter-metadata.mjs';
import {buildMitsurugiCafeFrontage} from './mitsurugi-cafe-frontage.mjs';
import {buildYakurikiTrailContext} from './yakuriki-trail-context.mjs';
import {textureStreaming} from './texture-streaming.mjs?v=repair-20261025b';
import {createDeferredShrineBuildings,yieldShrineWork} from './deferred-shrine-buildings.mjs';
import {refineShrineBuildingAsync} from './shrine-building-refinements.mjs';
import {loadCompressedGLB} from './compressed-glb.mjs';
import {buildOkushaReceptionDisplay} from './okusha-reception-display.mjs';
import {buildOkushaExitFlanks} from './okusha-exit-flanks.mjs';
import {buildOkushaNorthBoundaryR103} from './okusha-north-boundary-r103.mjs';
import {batchStaticScene} from './spatial-static-batches.mjs';
import {createInariStationArrivalSpec} from './inari-station-arrival-spec.mjs';
import {createKeihanJrCrossingSpec,buildKeihanJrCrossingDetail} from './keihan-jr-crossing-detail.mjs?v=recorded-immersion-7';
import {buildInariStationArrival} from './inari-station-arrival.mjs?v=keihan-street-3';
import {buildInariStationRoute} from './inari-station-route.mjs';
import {buildInariStationFrontage} from './inari-station-frontage.mjs';
import {buildKeihanStation} from './keihan-station.mjs?v=station-polish-20261025b';
import {buildKeihanApproach} from './keihan-approach.mjs?v=keihan-street-3';
import {buildKeihanFrontages} from './keihan-frontages.mjs?v=immersion-20261025c';
import {buildKeihanEastParking} from './keihan-east-parking.mjs';
import {buildKeihanStreetContext} from './keihan-street-context.mjs?v=keihan-street-3';
import {buildKeihanUrasando} from './keihan-urasando.mjs?v=video-shops-3';
import {buildKumatakaRestFurnitureR102} from './kumataka-rest-furniture-r102.mjs?v=102-release';
import {buildOkushaMappedSheltersR102} from './okusha-mapped-shelters-r102.mjs?v=102-release';
import {buildEntranceDetailsR101} from './entrance-details-r101.mjs?v=101-release';
import {buildKumatakaDetailsR101} from './kumataka-details-r101.mjs?v=101-release';
import {buildOkushaDetailsR101} from './okusha-details-r101.mjs?v=101-release';
import {prepareMikoshikoApronTransitionsR100} from './mikoshiko-apron-transitions-r100.mjs?v=100-release';
import {buildShinikeWaterR97Async} from './shinike-water-r97.mjs?v=immersion-20261025c';
import {repairShinikeVegetationR97} from './shinike-vegetation-r97.mjs?v=repair-20261025b';
import {buildKumatakaRegistrationR97} from './kumataka-registration-r97.mjs?v=98-water2';
import {buildKumatakaRoofR97} from './kumataka-roof-r97.mjs?v=97-release';
import {buildShinikeBankLandscapeR97} from './shinike-bank-landscape-r97.mjs?v=97-release';
import {prepareGehaidenLanternCleanupR96} from './gehaiden-lantern-cleanup-r96.mjs?v=96-release';
import {buildOmotesandoFrontageR96} from './omotesando-frontage-r96.mjs?v=96-release';
import {buildOmotesandoNoticeR96} from './omotesando-notice-r96.mjs?v=96-release';
import {buildRestBoundaryR96} from './restboundary-r96.mjs?v=96-release';
import {buildShinkosuiWellR96} from './shinkosui-well-r96.mjs?v=96-release';
import {buildUpperEnclosureR96Async} from './upper-enclosure-r96.mjs?v=96-release';
import {buildOmotesandoContextR96} from './omotesando-context-r96.mjs?v=96-release';
import {buildUpperAccessR96} from './upper-access-r96.mjs?v=96-release';
import {buildSenbonRestR96} from './senbon-rest-r96.mjs?v=96-release';
import {buildYotsutsujiContextR96} from './yotsutsuji-context-r96.mjs?v=96-release';
import {buildMappedChojaR95,clearMisplacedSanctuaryProxiesR95} from './sanctuary-proxy-repair-r95.mjs?v=95-release';
import {buildOkumiyaStairLanternsR95} from './okumiya-stair-lanterns-r95.mjs?v=95-release';
import {buildGondenServiceR95} from './gonden-service-r95.mjs?v=95-release';
import {buildOmotesandoContextR95} from './omotesando-context-r95.mjs?v=95-release';
import {buildUpperAccessR95} from './upper-access-r95.mjs?v=95-release';
import {buildSenbonRestR95} from './senbon-rest-r95.mjs?v=95-release';
import {buildYotsutsujiContextR95} from './yotsutsuji-context-r95.mjs?v=95-release';
import {buildSenbonRestLandscape} from './senbon-rest-landscape-r94.mjs';
import {buildOmotesandoArrivalR94} from './omotesando-arrival-r94.mjs?v=recorded-immersion-7';
import {buildRomonPrecinctR94Async} from './romon-precinct-r94.mjs?v=94';
import {buildUpperAccessR94} from './upper-access-r94.mjs?v=94';
import {clearRearPrecinctLegacyTrees} from './rear-precinct-tree-clearance.mjs?v=93-release';
import {buildGondenRearLandscapeAsync} from './gonden-rear-landscape.mjs?v=93-release';
import {buildMikoshikoPrecinct} from './mikoshiko-precinct.mjs?v=93-release';
import {buildHondenRearBoundaryAsync} from './honden-rear-boundary.mjs?v=93-release';
import {buildTamayamaSouthShinmesha} from './tamayama-south-shinmesha.mjs?v=91-final';
import {integratedTerrainTrianglesAsync} from './terrain-triangles.mjs?v=99-release';
import {buildMikoshikoDetailsR99} from './mikoshiko-details-r99.mjs?v=99-release';
import {shinsenjoNorthCourtTerrainDetailR99,buildShinsenjoNorthCourtR99} from './shinsenjo-north-court-r99.mjs?v=99-release';
import {buildTamayamaStairLandscape} from './tamayama-stair-landscape.mjs?v=91-dense';
import {buildTamayamaContinuationTorii} from './tamayama-continuation-torii.mjs?v=mountain-walk-2';
import {buildMitsuFrontageAprons} from './mitsu-frontage-aprons.mjs?v=89-edge';
import {buildKumatakaTakeyaFrontage} from './kumataka-takeya-frontage.mjs?v=89-clearance';
import {buildKumatakaLakesideRail} from './kumataka-lakeside-rail.mjs';
import {buildMitsutsujiFrontages} from './mitsutsuji-frontages.mjs';
import {buildNosatsushoPavilion} from './nosatsusho-pavilion.mjs';
import {buildApproachContextR87} from './approach-context-r87.mjs';
import {buildSanctuaryContextR87} from './sanctuary-context-r87.mjs';
import {refineMountainContextR87} from './mountain-context-r87.mjs';
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
import {buildOmotesandoShoulders} from './omotesando-shoulders.mjs?v=95-release';
import {buildEntranceMappedBoundaries} from './entrance-mapped-boundaries.mjs?v=62';
import {buildEntranceHedgeUnderstory} from './entrance-hedge-understory.mjs?v=62';
import {buildEntranceShrineEnclosures} from './entrance-shrine-enclosures.mjs?v=61';
import {clearLegacyShrineConflicts} from './entrance-legacy-shrine-conflicts.mjs?v=59';
import {buildEntranceRoadsideShrines} from './entrance-roadside-shrines.mjs?v=62';
import {buildEntranceShrineCourtDetails} from './entrance-shrine-court-details.mjs?v=62';
import {buildEntranceShrineCourtTrees} from './entrance-shrine-court-trees.mjs?v=repair-20261025b';
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
import {buildEntranceMappedTrees} from './entrance-mapped-trees.mjs?v=repair-20261025b';
import {buildGishikidenAccessSurface} from './entrance-gishikiden-access-surface.mjs?v=63';
import {buildEntranceBicycleGate} from './entrance-bicycle-gate.mjs?v=63';
import {buildEntranceBicycleSurfaceCollar} from './entrance-bicycle-surface-collar.mjs?v=63';
import {installPrecinctLife} from './precinct-life.mjs?v=34';
import {preservedForestLOD} from './forest-lod.mjs';
import {bambooLOD} from './bamboo-details.mjs';
import {buildOsugiShrine} from './osugi-shrine.mjs';
import {buildAinomine} from './mountain-landmarks.mjs';
import {refineKumatakasha} from './mountain-landmarks-kumataka.mjs';
import {okushaCourtGrade} from './okusha-court.mjs?v=25';
import {buildOkushaCourt} from './okusha-details.mjs?v=95-release';
import {refineEntranceObjects,buildReception} from './entrance-refinements.mjs?v=86';
import {refineTemizuyaDetails} from './temizuya-details.mjs?v=40b';
import {buildPathMargins} from './path-margins.mjs';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildLegacy} from './legacy-builders.mjs';
import {extendForestAsync} from './forest.mjs?v=shrine-access-1';
import {heightAt,nearestNode} from '../geography/geo-core.mjs';
import {makeSpatial,pathSampler,rigidPoint,rotateXZ,pathClearance} from './spatial.mjs';
import {makePathSurfaces} from './path-surfaces.mjs?v=68-near-precinct';
import {buildSenbon} from './senbon.mjs?v=mountain-walk-2';
import {buildMountainTorii} from './mountain-torii.mjs?v=mountain-walk-2';
import {supportTerraces} from './terrace-foundations.mjs';
import {buildYotsutsuji,teaHouses} from './yotsutsuji.mjs?v=repair-20261025b';
import {yotsuGrade} from './site-grading.mjs';
import {partitionInstances,subdivideShadowInstanceLeaves,freezeStaticInstanceTransforms} from './spatial-mesh.mjs';
import {collectInstancePrewarmEntries} from './instance-prewarm-entries.mjs';
import {refineIchinomine} from './ichinomine-refinements.mjs';
import {refineShrineFinishes} from './shrine-finishes.mjs?v=15';
import {fineGranite,courtyardGravel,precinctPaving} from './surface-materials.mjs?v=16';
import {refineSenbonSakaki} from './senbon-sakaki.mjs';
import {entryHeight} from './entry-profile.mjs';
import {precinctLevel,lowerCourtBlend,sanctuaryCourtBlend} from './precinct-grade.mjs?v=25e';
import {buildSanctuaryLanding,buildSanctuaryApproaches} from './sanctuary-landing.mjs?v=96-release';
import {separatedTemizuya,westStairHeight,westLandingTransition} from './entrance-layout.mjs';
import {buildRomonCourtSideDetails} from './romon-court-side-details.mjs?v=70';
import {buildAzumamaroHouses,azumamaroHouseIds} from './azumamaro-houses.mjs?v=47';
import {buildAzumamaroCourtDetails} from './azumamaro-court-details.mjs?v=47';
import {buildAzumamaroContext,azumamaroContextIds} from './azumamaro-context.mjs?v=46';
import {buildAzumamaroPlanting} from './azumamaro-planting.mjs?v=44c';
import {makeAzumamaroCourtGrade,makeNorthCourtGrade} from './entrance-ground.mjs?v=49';
import {clearAzumamaroLegacySugi} from './azumamaro-legacy-clearance.mjs?v=45b';
import {buildAzumamaroSignage} from './azumamaro-signage.mjs?v=43';
import {buildRomonSurroundingsR72} from './romon-surroundings-r72.mjs';
import {buildOmotesandoBollards} from './omotesando-bollards.mjs';
import {buildEntranceBoundaries} from './entrance-boundaries.mjs';
import {buildLateralEntryDetails} from './lateral-entry-details.mjs?v=47bb';
import {refineByakkoDetails,seatByakkoDetails} from './byakko-details.mjs';
import {refineOkumiya} from './okumiya-facade.mjs?v=69-near-precinct';
import {refineTamayama,buildTamayamaCompound} from './tamayama-compound.mjs?v=68-near-precinct';
import {buildTamayamaForecourtAsync} from './tamayama-forecourt.mjs?v=90-seated';
import {refineTamayamaOkumiyaAccess} from './tamayama-okumiya-access.mjs?v=68-near-precinct';
import {refineGondenFacade} from './gonden-facade.mjs?v=92';
import {okumiyaTerrainGrade,okumiyaLandingEdges} from './okumiya-grade.mjs?v=39b';
import {sanctuaryTerrainSupport} from './sanctuary-terrain-support.mjs?v=65b';
import {tamayamaAccessTerrain} from './tamayama-access-support.mjs?v=66';
import {tamayamaAccessFeatures} from './tamayama-access-width.mjs?v=66';
import {buildTamayamaStairRail,buildOkumiyaStairRail} from './tamayama-stair-rail.mjs?v=77';
import {buildGondenAccessTorii} from './gonden-access-torii.mjs?v=66';
import {buildTamayamaAccessShoulders} from './tamayama-access-shoulders.mjs?v=66';
import {refineNinomine} from './ninomine-details.mjs?v=39';

export async function integrate(scene,renderer,terrain,features,callbacks={}){
  const yieldWork=callbacks.yieldWork??yieldStartupTask,checkpoint=createStartupCheckpoint({yieldWork,onStep:callbacks.startupStep});
  const [spec,entranceBarriers,entranceSurfaces,entranceContext]=await Promise.all([
    fetch('anchors.json').then(r=>r.json()),
    fetch('../geography/sources/entrance-barriers.json').then(r=>{if(!r.ok)throw new Error('Entrance barrier data unavailable');return r.json();}),
    fetch('../geography/sources/entrance-surfaces-r54.json').then(r=>{if(!r.ok)throw new Error('Entrance surface data unavailable');return r.json();}),
    fetch('../geography/sources/entrance-context-r55.json').then(r=>{if(!r.ok)throw new Error('Entrance context data unavailable');return r.json();})
  ]);
  const spatial=makeSpatial(terrain,features,spec);
  const legacy=await buildLegacy(renderer,{...callbacks,loadTexture:textureStreaming.load,yieldWork:checkpoint});
  const gehaidenLanternCleanupR96=prepareGehaidenLanternCleanupR96(legacy);
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
  let kumatakaRefinement=null,okumiyaRefinement=null,ichinomineRefinement=null;
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
    refineSenbonSakaki(object);
    refineEntranceObjects(object,legacy.materials);
    refineTemizuyaDetails(object);
    refineShrineFinishes(object,legacy.materials.entryStoneMat);
    const summitDetail=refineIchinomine(object,legacy.materials);
    if(summitDetail){
      ichinomineRefinement=summitDetail;
      document.body.dataset.ichinomineRefinement=JSON.stringify(summitDetail.stats);
      addEventListener('pagehide',event=>{if(!event.persisted)summitDetail.dispose();});
    }
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
  await checkpoint('refineTamayamaOkumiyaAccess');
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
  const senbonStart=root.children.length;
  await checkpoint('buildSenbon');
  const senbon=buildSenbon(root,legacy,spatial,surfaces.height,twinColliders);
  const toriiPrewarmRoots=root.children.slice(senbonStart).filter(object=>object.isInstancedMesh);

  // Architectural visuals stream independently of permanent physical owners.
  const shrineFloorData=await fetch('shrine-building-floors.json').then(r=>{if(!r.ok)throw Error('Shrine floor support unavailable');return r.json();});
  const shrineFloors=new THREE.Group();shrineFloors.name='Permanent shrine floor support';
  for(const [id,positions]of Object.entries(shrineFloorData.buildings)){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const floor=new THREE.Mesh(geometry,legacy.materials.entryStoneMat);floor.visible=false;
    floor.applyMatrix4(matrix(byId[id]));shrineFloors.add(floor);
  }
  root.add(shrineFloors);
  await checkpoint('createDeferredShrineBuildings');
  const deferredBuildings=createDeferredShrineBuildings({anchor:byId.romon.target,
    prefetch:async (id,timing)=>{
      const gltf=await loadCompressedGLB(`${id}.glb`,{timing});
      await yieldShrineWork();let start=performance.now();
      await refineShrineBuildingAsync(gltf.scene,id,legacy.materials,{diagnostics:document.body.dataset,gehaidenLanternCleanupR96,timing:(name,ms)=>timing('refine:'+name,ms)});
      timing('refine',performance.now()-start);
      gltf.scene.applyMatrix4(matrix(byId[id]));gltf.scene.updateMatrixWorld(true);
      await yieldShrineWork();start=performance.now();
      batchStaticScene(gltf.scene);timing('batch',performance.now()-start);
      // Compile detached visuals ahead of the activation boundary. The live
      // renderer must not discover unprepared materials while this awaits.
      await yieldShrineWork();start=performance.now();
      await callbacks.buildingAdded?.(gltf.scene,id);
      timing('prepare',performance.now()-start);
      return gltf.scene;
    },
    load:async (id,scene,timing)=>{
      root.add(scene);scene.updateMatrixWorld(true);
      return scene;
    },report:value=>{document.body.dataset.deferredBuildings=JSON.stringify(value);}});
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
  if(ichinomineRefinement)colliders.push(...ichinomineRefinement.getColliders());
  document.body.dataset.azumamaroTreesCleared=String(clearAzumamaroLegacySugi(legacy,features,colliders));
  document.body.dataset.mitsurugiRegistration=JSON.stringify(registerMitsurugi(root,features,surfaces,colliders));
  await checkpoint('buildMitsurugiCafeFrontage');
  const mitsurugiCafe=buildMitsurugiCafeFrontage(root,features,surfaces,colliders,legacy.materials);
  document.body.dataset.mitsurugiCafe=JSON.stringify(mitsurugiCafe);
  await checkpoint('buildYakurikiTrailContext');
  const yakurikiTrail=buildYakurikiTrailContext(root,features,surfaces,legacy.materials);
  document.body.dataset.yakurikiTrail=JSON.stringify(yakurikiTrail);
  await checkpoint('buildMappedRoofCanopies');
  const mappedRoofCanopies=buildMappedRoofCanopies(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.mappedRoofCanopies=JSON.stringify(mappedRoofCanopies);
  colliders.push(...twinColliders);
  await checkpoint('buildOmotesandoArrivalR94');
  const omotesandoArrival=buildOmotesandoArrivalR94(root,features,surfaces);
  document.body.dataset.omotesandoArrival=JSON.stringify(omotesandoArrival);
  callbacks.progress?.('Shaping the mountain…');await yieldWork();
  const renderedTerrainPositions=await integratedTerrainTrianglesAsync(terrain,anchors,pathDistance,surfaces.terrainHeight,{detailBounds:shinsenjoNorthCourtTerrainDetailR99(features),yieldWork,cacheHeights:true});
  callbacks.progress?.('Preparing mountain landmarks…');await yieldWork();
  await checkpoint('buildTamayamaCompound');
  const tamayamaCompound=buildTamayamaCompound(root,features,surfaces,legacy.materials,colliders);
  await checkpoint('buildTamayamaSouthShinmesha');
  const southShinmesha=buildTamayamaSouthShinmesha(root,legacy.materials,features,surfaces,colliders,{terrainPositions:renderedTerrainPositions});
  document.body.dataset.southShinmesha=JSON.stringify(southShinmesha);
  await checkpoint('buildTamayamaForecourtAsync');
  document.body.dataset.tamayamaForecourt=JSON.stringify(await buildTamayamaForecourtAsync(root,features,surfaces,legacy.materials,{terrainPositions:renderedTerrainPositions,yieldWork}));
  await checkpoint('buildPrecinctShrineCourts');
  document.body.dataset.precinctShrineCourts=JSON.stringify(buildPrecinctShrineCourts(root,features,surfaces,legacy.materials));
  await checkpoint('buildNearPrecinctMineralCourts');
  document.body.dataset.nearPrecinctMineralCourts=JSON.stringify(buildNearPrecinctMineralCourts(root,features,surfaces,legacy.materials));
  await checkpoint('buildOfficePondSurfaces');
  const officePonds=buildOfficePondSurfaces(root,features,surfaces,legacy.materials);
  await checkpoint('buildNosatsushoPavilion');
  const nosatsushoPavilion=buildNosatsushoPavilion(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.nosatsushoPavilion=JSON.stringify(nosatsushoPavilion);
  await checkpoint('buildOfficeGardenBanks');
  document.body.dataset.officeGardenBanks=JSON.stringify(buildOfficeGardenBanks(root,features,surfaces));
  await checkpoint('buildPrecinctNorthContext');
  const precinctNorthContext=buildPrecinctNorthContext(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.precinctNorthContext=JSON.stringify(precinctNorthContext);
  await checkpoint('buildNearPrecinctShrineRow');
  const nearPrecinctShrineRow=buildNearPrecinctShrineRow(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.nearPrecinctShrineRow=JSON.stringify(nearPrecinctShrineRow);
  await checkpoint('buildShinkosuiWellR96');
  const shinkosuiWellR96=buildShinkosuiWellR96(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions});
  document.body.dataset.shinkosuiWellR96=JSON.stringify(shinkosuiWellR96);
  await checkpoint('buildMappedChojaR95');
  const mappedChojaR95=buildMappedChojaR95(root,features,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions});
  document.body.dataset.mappedChojaR95=JSON.stringify(mappedChojaR95);
  document.body.dataset.sanctuaryProxyRepairR95=JSON.stringify(clearMisplacedSanctuaryProxiesR95(root,colliders,{anchors:spatial.anchors}));
  await checkpoint('buildNearPrecinctEnclosures');
  document.body.dataset.nearPrecinctEnclosures=JSON.stringify(buildNearPrecinctEnclosures(root,features,surfaces,legacy.materials,colliders));
  await checkpoint('buildNearPrecinctDrains');
  document.body.dataset.nearPrecinctDrains=JSON.stringify(buildNearPrecinctDrains(root,features,surfaces,legacy.materials));
  await checkpoint('buildTamayamaStairBorders');
  document.body.dataset.tamayamaStairBorders=JSON.stringify(buildTamayamaStairBorders(root,features,surfaces,legacy.materials));
  await checkpoint('buildSanctuaryContextR87');
  document.body.dataset.sanctuaryContextR87=JSON.stringify(buildSanctuaryContextR87(root,features,surfaces,legacy.materials,colliders));
  await checkpoint('buildGondenRearLandscapeAsync');
  document.body.dataset.gondenRearLandscape=JSON.stringify(await buildGondenRearLandscapeAsync(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions,yieldWork}));
  await checkpoint('buildGondenServiceR95');
  document.body.dataset.gondenServiceR95=JSON.stringify(buildGondenServiceR95(root,legacy.materials));
  await checkpoint('buildMikoshikoPrecinct');
  const mikoshiko=buildMikoshikoPrecinct(root,legacy.materials,features,surfaces,colliders,{terrainPositions:renderedTerrainPositions});
  await checkpoint('buildMikoshikoDetailsR99');
  document.body.dataset.mikoshikoDetailsR99=JSON.stringify(buildMikoshikoDetailsR99(root,features));
  // Full-ring terrain rises above the sourced facade; preserve legacy context
  // until service-floor/east-bank registration is resolved (R93 native review).
  const shinsenjo={built:false,builtIds:[],reason:'Pending registered floor and terrain levels: southeast ground exceeds proposed roof'};
  document.body.dataset.rearPrecinctTreeClearance=JSON.stringify(clearRearPrecinctLegacyTrees(legacy,features,colliders,[...(mikoshiko.builtIds??[]),...(shinsenjo.builtIds??[])]));
  document.body.dataset.mikoshikoPrecinct=JSON.stringify(mikoshiko);
  document.body.dataset.shinsenjoPrecinct=JSON.stringify(shinsenjo);
  await checkpoint('buildHondenRearBoundaryAsync');
  document.body.dataset.hondenRearBoundary=JSON.stringify(await buildHondenRearBoundaryAsync(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions,yieldWork}));
  await checkpoint('buildGondenSurroundings');
  document.body.dataset.gondenSurroundings=JSON.stringify(buildGondenSurroundings(root,features,surfaces,legacy.materials,colliders));
  document.body.dataset.tamayamaCompound=JSON.stringify(tamayamaCompound);
  document.body.dataset.okumiyaDetail=JSON.stringify(okumiyaRefinement);
  document.body.dataset.nearPrecinctAccess=JSON.stringify(nearPrecinctAccess);
  await checkpoint('buildTamayamaStairRail');
  document.body.dataset.tamayamaRail=JSON.stringify(buildTamayamaStairRail(root,surfaces,colliders));
  await checkpoint('buildOkumiyaStairRail');
  document.body.dataset.okumiyaRail=JSON.stringify(buildOkumiyaStairRail(root,surfaces,colliders));
  await checkpoint('buildGondenAccessTorii');
  document.body.dataset.gondenAccessTorii=JSON.stringify(buildGondenAccessTorii(root,legacy,features,surfaces,colliders));
  await checkpoint('buildTamayamaAccessShoulders');
  document.body.dataset.tamayamaShoulders=JSON.stringify(buildTamayamaAccessShoulders(root,features,surfaces,legacy.materials));
  await checkpoint('buildTamayamaStairLandscape');
  document.body.dataset.tamayamaStairLandscape=JSON.stringify(buildTamayamaStairLandscape(root,features,surfaces,legacy.materials,colliders));
  await checkpoint('buildTamayamaContinuationTorii');
  document.body.dataset.tamayamaContinuationTorii=JSON.stringify(buildTamayamaContinuationTorii(root,legacy,features,surfaces,colliders,{terrainPositions:renderedTerrainPositions}));
  document.body.dataset.entranceShrineConflicts=JSON.stringify(clearLegacyShrineConflicts(root,colliders));
  legacy.interactables=legacy.interactables.filter(o=>!o.userData.legacyShrineConflictRemoved);
  legacy.flickeringCandleMeshes=legacy.flickeringCandleMeshes.filter(o=>!o.userData.legacyShrineConflictRemoved);
  document.body.dataset.byakkoDetails=JSON.stringify(seatByakkoDetails(root,surfaces,colliders));
  buildSanctuaryLanding(root,byId.naihaiden,legacy.materials,colliders);
  buildSanctuaryApproaches(root,features,surfaces,legacy.materials);
  buildRomonCourtSideDetails(root,byId.romon,legacy.materials);
  buildEntranceBoundaries(root,byId.romon,features,surfaces,legacy.materials,colliders);
  await checkpoint('buildRomonSurroundingsR72');
  document.body.dataset.romonSurroundings=JSON.stringify(buildRomonSurroundingsR72(root,byId.romon,surfaces,legacy.materials));
  buildEntranceSidePlanting(root,byId.romon);
  buildOmotesandoShoulders(root,features,ground,surfaces,legacy.materials);
  await checkpoint('buildOmotesandoBollards');
  document.body.dataset.omotesandoBollards=JSON.stringify(buildOmotesandoBollards(root,features,surfaces,legacy.materials,colliders));
  await checkpoint('buildEntranceMappedBoundaries');
  const mappedBoundaries=buildEntranceMappedBoundaries(root,entranceBarriers,ground,legacy.materials,colliders);
  await checkpoint('buildApproachContextR87');
  document.body.dataset.approachContextR87=JSON.stringify(buildApproachContextR87(root,features,entranceBarriers,surfaces,legacy.materials,colliders));
  await checkpoint('buildEntranceHedgeUnderstory');
  document.body.dataset.entranceUnderstory=JSON.stringify(buildEntranceHedgeUnderstory(root,entranceBarriers,surfaces));
  await checkpoint('buildEntranceShrineEnclosures');
  document.body.dataset.entranceShrineEnclosures=JSON.stringify(buildEntranceShrineEnclosures(root,entranceBarriers,ground,legacy.materials,colliders).ways);
  await checkpoint('buildEntranceRoadsideShrines');
  document.body.dataset.entranceRoadsideShrines=JSON.stringify(buildEntranceRoadsideShrines(root,features,surfaces,legacy.materials,colliders).records);
  buildEntranceShrineCourt(root,features,surfaces);
  await checkpoint('buildEntranceShrineCourtDetails');
  document.body.dataset.entranceCourtDetails=JSON.stringify(buildEntranceShrineCourtDetails(root,features,surfaces,legacy.materials,colliders).records);
  await checkpoint('buildEntranceShrineCourtTrees');
  document.body.dataset.entranceCourtTrees=JSON.stringify(buildEntranceShrineCourtTrees(root,features,surfaces,colliders));
  await checkpoint('buildEntranceCourtMonument');
  document.body.dataset.entranceCourtMonument=JSON.stringify(buildEntranceCourtMonument(root,features,surfaces,legacy.materials,colliders));
  await checkpoint('buildEntranceRoadsideBasin');
  document.body.dataset.entranceRoadsideBasin=JSON.stringify(buildEntranceRoadsideBasin(root,entranceBarriers,surfaces,legacy.materials,colliders,features));
  buildEntranceAreaSurfaces(root,entranceSurfaces,features,surfaces.terrainHeight);
  await checkpoint('buildEntranceBicycleSurfaceCollar');
  document.body.dataset.bicycleSurfaceCollar=JSON.stringify(buildEntranceBicycleSurfaceCollar(root,features,surfaces,surfaces.terrainHeight));
  await checkpoint('buildGishikidenAccessSurface');
  document.body.dataset.gishikidenAccess=JSON.stringify(buildGishikidenAccessSurface(root,features,surfaces));
  await checkpoint('buildEntranceBicycleGate');
  const bicycleGate=buildEntranceBicycleGate(root,features,entranceBarriers,surfaces,legacy.materials,colliders);
  if(bicycleGate)document.body.dataset.bicycleGate=JSON.stringify(bicycleGate.group.userData);
  document.body.dataset.firstToriiAlignment=JSON.stringify(alignFirstOmotesandoTorii(root,features,surfaces,colliders));
  const stationPlacement=placeMappedInariStation(root,features,surfaces,colliders);
  document.body.dataset.stationPlacement=JSON.stringify(stationPlacement);
  document.body.dataset.approachSlabs=JSON.stringify(clearLegacyApproachSlabs(root));
  document.body.dataset.entranceStatues=JSON.stringify(clearEntranceStatues(root,entranceBarriers,features,surfaces,colliders));
  await checkpoint('buildEntranceGuardhouseDetails');
  const guardhouse=buildEntranceGuardhouseDetails(root,features,surfaces,legacy.materials,colliders);
  await checkpoint('buildOmotesandoNoticeR96');
  const omotesandoNoticeR96=buildOmotesandoNoticeR96(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.omotesandoNoticeR96=JSON.stringify((({group,...report})=>report)(omotesandoNoticeR96));
  await checkpoint('buildOmotesandoFrontageR96');
  const omotesandoFrontageR96=buildOmotesandoFrontageR96(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.omotesandoFrontageR96=JSON.stringify((({group,...report})=>report)(omotesandoFrontageR96));
  await checkpoint('buildKeihanUrasando');
  const keihanUrasando=buildKeihanUrasando(root,features,surfaces,legacy.materials,colliders);
  const neighborhoodFeatures={...features,buildings:features.buildings.filter(b=>b.id!==guardhouse?.id&&!omotesandoFrontageR96.builtIds.includes(b.id)&&!omotesandoNoticeR96.builtIds.includes(b.id)&&!keihanUrasando.builtIds.includes(b.id))};
  await checkpoint('buildEntranceNeighborhood');
  const entranceNeighborhood=buildEntranceNeighborhood(root,neighborhoodFeatures,surfaces.terrainHeight,legacy.materials,colliders,surfaces);
  if(guardhouse)entranceNeighborhood.builtIds.push(guardhouse.id);
  entranceNeighborhood.builtIds.push(...omotesandoFrontageR96.builtIds);
  entranceNeighborhood.builtIds.push(...omotesandoNoticeR96.builtIds);
  document.body.dataset.entranceNeighborhood=JSON.stringify({builtIds:entranceNeighborhood.builtIds,skipped:entranceNeighborhood.skippedLegacyShopOverlap});
  await checkpoint('buildEntranceMappedTrees');
  document.body.dataset.entranceTrees=JSON.stringify(buildEntranceMappedTrees(root,entranceContext,features,surfaces,colliders));
  await checkpoint('buildLateralEntryDetails');
  const lateralEntry=buildLateralEntryDetails(root,features,surfaces,legacy.materials,colliders);
  buildAzumamaroSignage(root,features,surfaces,legacy.materials,colliders);
  if(lateralEntry?.torii){
    const a={id:'azumamaro_entry',label:'Azumamaro · side entrance',target:lateralEntry.torii,radius:0};
    anchors.push(a);byId[a.id]=a;
  }
  await checkpoint('buildYotsutsuji');
  const yotsutsuji=buildYotsutsuji(root,legacy,features,ground,colliders,surfaces);
  await checkpoint('buildYotsutsujiContextR95');
  const yotsutsujiContextR95=buildYotsutsujiContextR95(root,features,legacy.materials);
  document.body.dataset.yotsutsujiContextR95=JSON.stringify(yotsutsujiContextR95);
  await checkpoint('buildYotsutsujiContextR96');
  document.body.dataset.yotsutsujiContextR96=JSON.stringify(buildYotsutsujiContextR96(root,features,ground,surfaces));
  await checkpoint('buildOsugiShrine');
  document.body.dataset.osugiShrine=JSON.stringify(buildOsugiShrine(root,features,surfaces,legacy.materials,colliders));
  await checkpoint('buildAinomine');
  const ainomine=buildAinomine(root,features,surfaces,legacy.materials,colliders);
  await checkpoint('refineMountainContextR87');
  const mountainContextR87=refineMountainContextR87(ainomine);
  document.body.dataset.mountainContextR87=JSON.stringify(mountainContextR87?.stats??null);
  if(ainomine){anchors.push(ainomine.anchor);byId.ainomine=ainomine.anchor;}
  await checkpoint('buildMitsutsujiFrontages');
  const mitsutsujiFrontages=buildMitsutsujiFrontages(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.mitsutsujiFrontages=JSON.stringify(mitsutsujiFrontages);
  await checkpoint('buildMitsuFrontageAprons');
  const mitsuFrontageAprons=buildMitsuFrontageAprons(root,features,surfaces,legacy.materials);
  document.body.dataset.mitsuFrontageAprons=JSON.stringify(mitsuFrontageAprons);
  await checkpoint('buildKumatakaTakeyaFrontage');
  const takeyaFrontage=buildKumatakaTakeyaFrontage(root,features,surfaces,legacy.materials,colliders);
  await checkpoint('buildTakeyaKeepsakes');
  const takeyaKeepsakes=buildTakeyaKeepsakes(root,takeyaFrontage,legacy.materials,legacy.interactables);
  document.body.dataset.takeyaKeepsakes=JSON.stringify(takeyaKeepsakes);
  document.body.dataset.takeyaFrontage=JSON.stringify(takeyaFrontage);
  document.body.dataset.yotsutsujiRetaining=JSON.stringify(yotsutsuji.retainingEdge??null);
  // Experimental only: the fixed-route A/B did not justify extra draw calls.
  const forestSubcellSize=callbacks.forestSubcellSize??0;
  const mountainDrawStart=root.children.length;
  await checkpoint('buildMountainTorii');
  const mountainTorii=buildMountainTorii(root,legacy,spatial,surfaces,colliders,{terrainPositions:renderedTerrainPositions,excludeGate:gate=>ainomine?.excludeGate?.(gate)||mitsutsujiFrontages.excludeGate?.(gate)});
  const mountainDrawRoots=root.children.slice(mountainDrawStart).filter(object=>object.isInstancedMesh);
  await checkpoint('buildReception');
  const reception=buildReception(root,features,ground,legacy.materials,colliders);
  buildAzumamaroHouses(root,features,(x,z)=>surfaces.height(x,z),legacy.materials,colliders);
  await checkpoint('buildAzumamaroCourtDetails');
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
  await checkpoint('buildKumatakaLakesideRail');
  document.body.dataset.kumatakaLakesideRail=JSON.stringify(buildKumatakaLakesideRail(root,legacy.materials));
  await checkpoint('buildShinikeWaterR97Async');
  const shinikeWater=await buildShinikeWaterR97Async(root,features,legacy.materials,{terrainPositions:renderedTerrainPositions,yieldWork});
  document.body.dataset.shinikeWaterR97=JSON.stringify(shinikeWater);
  await checkpoint('buildKumatakaRegistrationR97');
  const kumatakaRegistrationR97=buildKumatakaRegistrationR97(root,features,surfaces,legacy.materials,colliders,{water:shinikeWater});
  document.body.dataset.kumatakaRegistrationR97=JSON.stringify(kumatakaRegistrationR97?(({group,...report})=>report)(kumatakaRegistrationR97):null);
  await checkpoint('buildKumatakaRoofR97');
  const kumatakaRoofR97=buildKumatakaRoofR97(root);
  document.body.dataset.kumatakaRoofR97=JSON.stringify(kumatakaRoofR97?(({group,...report})=>report)(kumatakaRoofR97):null);
  const shinikeVegetation=repairShinikeVegetationR97(root,legacy,shinikeWater,colliders);
  document.body.dataset.shinikeVegetationR97=JSON.stringify(shinikeVegetation);
  const extendedForestStart=root.children.length;
  callbacks.progress?.('Growing the forest…');await yieldWork();
  const forest=await extendForestAsync(root,legacy,features,anchors,ground,pathDistance,colliders,{yieldWork});
  callbacks.progress?.('Preparing the shrine paths…');await yieldWork();
  const extendedForestRoots=root.children.slice(extendedForestStart);
  await checkpoint('buildShinikeBankLandscapeR97');
  document.body.dataset.shinikeBankLandscapeR97=JSON.stringify(buildShinikeBankLandscapeR97(root,features,surfaces,legacy,colliders,{terrainPositions:renderedTerrainPositions,water:shinikeWater}));
  await checkpoint('buildOmotesandoContextR95');
  document.body.dataset.omotesandoContextR95=JSON.stringify(buildOmotesandoContextR95(root,features,entranceBarriers,surfaces,legacy.materials,colliders));
  await checkpoint('buildSenbonRestLandscape');
  document.body.dataset.senbonRestLandscapeR94=JSON.stringify(buildSenbonRestLandscape(root,features,ground,pathDistance,legacy.materials,colliders));
  await checkpoint('buildUpperAccessR94');
  document.body.dataset.upperAccessR94=JSON.stringify(buildUpperAccessR94(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions}));
  await checkpoint('buildRomonPrecinctR94Async');
  document.body.dataset.romonPrecinctR94=JSON.stringify(await buildRomonPrecinctR94Async(root,byId.romon,features,surfaces,legacy.materials,{terrainPositions:renderedTerrainPositions,yieldWork}));
  await checkpoint('buildOkumiyaStairLanternsR95');
  const okumiyaStairLanternsR95=buildOkumiyaStairLanternsR95(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions});
  document.body.dataset.okumiyaStairLanternsR95=JSON.stringify(okumiyaStairLanternsR95);
  await checkpoint('buildUpperAccessR95');
  document.body.dataset.upperAccessR95=JSON.stringify(buildUpperAccessR95(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions}));
  await checkpoint('buildUpperEnclosureR96Async');
  document.body.dataset.upperEnclosureR96=JSON.stringify(await buildUpperEnclosureR96Async(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions,yieldWork}));
  await checkpoint('buildUpperAccessR96');
  document.body.dataset.upperAccessR96=JSON.stringify(buildUpperAccessR96(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions}));
  await checkpoint('buildOmotesandoContextR96');
  document.body.dataset.omotesandoContextR96=JSON.stringify(buildOmotesandoContextR96(root,features,surfaces,legacy.materials,colliders));
  const pathMarginRoots=[];
  await checkpoint('>pathMarginRoots.push');
  const margins=buildPathMargins(root,surfaces,ground,features,anchors,{onStaticRoot:group=>pathMarginRoots.push(group)});
  document.body.dataset.pathMarginCull=JSON.stringify({enabled:!!callbacks.cullPathMargins,roots:pathMarginRoots.length});
  await checkpoint('buildOkushaCourt');
  const okushaCourt=buildOkushaCourt(root,features,byId.okusha,legacy.materials,colliders,surfaces);
  await checkpoint('buildSenbonRestR95');
  document.body.dataset.okushaFrontageR95=JSON.stringify(buildSenbonRestR95(root,features,byId.okusha,legacy.materials));
  document.body.dataset.okushaRestR96=JSON.stringify((({group,...report})=>report)(buildSenbonRestR96(root,features,byId.okusha,legacy.materials)));
  await checkpoint('buildOkushaReceptionDisplay');
  document.body.dataset.okushaReceptionDisplay=JSON.stringify(buildOkushaReceptionDisplay(root,legacy.materials));
  await checkpoint('buildOkushaDetailsR101');
  const okushaDetailsR101=buildOkushaDetailsR101(root,features,byId.okusha,legacy.materials);
  document.body.dataset.okushaDetailsR101=JSON.stringify(okushaDetailsR101?(({group,...report})=>report)(okushaDetailsR101):null);
  await checkpoint('buildRestBoundaryR96');
  const restBoundaryR96=buildRestBoundaryR96(root,features,legacy.materials,colliders,ground);
  document.body.dataset.okushaBoundaryR96=JSON.stringify(restBoundaryR96?(({group,...report})=>report)(restBoundaryR96):null);
  document.body.dataset.okushaArchitecture=JSON.stringify(okushaCourt??null);
  const terraces=supportTerraces(root,legacy,ground);
  const precinctLife=installPrecinctLife(root,legacy,callbacks);
  const forestSubcells={mode:'selective-shadow-only',minTriangles:50000,size:forestSubcellSize,mountainDrawCellSize:80,mountainShadowCellSize:forestSubcellSize?32:80,originalMeshCount:0,chunks:0,instances:0},legacyPartitionRoots=[];
  const staticInstanceRoots=[...mountainDrawRoots,...extendedForestRoots];
  for(const mesh of [...legacy.foliage,...legacy.toriiMeshes]){
    if(!mesh.parent)continue;
    const parent=mesh.parent;mesh.updateMatrix();
    const bambooKind=mesh===legacy.foliage[4]?'culms':mesh===legacy.foliage[5]?'leaves':null;
    const chunks=partitionInstances(mesh,bambooKind?64:128);
    if(bambooKind)bambooLOD(chunks,bambooKind);
    else if([legacy.foliage[1],legacy.foliage[2]].includes(mesh))preservedForestLOD(chunks,mesh===legacy.foliage[2]);
    else if(legacy.foliage.includes(mesh))for(const child of chunks.children)child.userData.nearForest=true;
    legacyPartitionRoots.push(chunks);
    if(legacy.toriiMeshes.includes(mesh))toriiPrewarmRoots.push(chunks);
    staticInstanceRoots.push(chunks);parent.add(chunks);mesh.removeFromParent();
  }
  await checkpoint('buildShinsenjoNorthCourtR99');
  document.body.dataset.shinsenjoNorthCourtR99=JSON.stringify(buildShinsenjoNorthCourtR99(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions}));
  const apronTransitionsR100=prepareMikoshikoApronTransitionsR100(root);
  if(apronTransitionsR100.built)surfaces.partitionApronEdgesR100=apronTransitionsR100.partitionEdges;
  document.body.dataset.apronTransitionsR100=JSON.stringify(apronTransitionsR100.report??apronTransitionsR100);
  await checkpoint('buildKumatakaDetailsR101');
  const kumatakaDetailsR101=buildKumatakaDetailsR101(root);
  document.body.dataset.kumatakaDetailsR101=JSON.stringify(kumatakaDetailsR101?(({group,...report})=>report)(kumatakaDetailsR101):null);
  await checkpoint('buildEntranceDetailsR101');
  document.body.dataset.entranceDetailsR101=JSON.stringify(buildEntranceDetailsR101(root,features));
  // Replace only the identified legacy station after the complete public
  // access builds successfully. Preserve the original interactive sign object.
  let inariStation=null,inariStationRoute=null,inariBuildError=null,keihanRail=null;
  const stationInteractionsBefore=legacy.interactables.length;
  const stationOwners=[];root.traverse(o=>{if(o.userData.mappedStationPlaced)stationOwners.push(o);});
  const stationSolids=colliders.filter(c=>c.args.at(-1)==='jr_inari_station');
  const stationSigns=stationOwners[0]?.children.filter(o=>legacy.interactables.includes(o))??[];
  if(stationOwners.length===1&&stationSolids.length===1&&stationSigns.length===1){
    let candidate=null,route=null;const routeColliders=[],railColliders=[];
    try{
      const stationSpec=createInariStationArrivalSpec(features,surfaces),crossingSpec=createKeihanJrCrossingSpec(features,surfaces,stationSpec);
      keihanRail=crossingSpec?buildKeihanJrCrossingDetail(root,features,surfaces,railColliders,{spec:crossingSpec}):null;
      candidate=buildInariStationArrival(root,legacy.materials,features,surfaces,{spec:stationSpec,northRailStart:keihanRail?.built?crossingSpec.source.northRailStart:undefined});
      route=candidate.built?buildInariStationRoute(root,features,surfaces,legacy.materials,routeColliders,candidate.spec):null;
    }catch(error){candidate?.group?.removeFromParent();route?.group?.removeFromParent();keihanRail?.group?.removeFromParent();keihanRail=null;candidate=null;route=null;inariBuildError=error.message;}
    if(candidate?.built&&route?.built){
      const sign=stationSigns[0],replacement=candidate.sign;
      replacement.parent.add(sign);sign.position.copy(replacement.position);sign.rotation.set(0,Math.PI/2,0);sign.scale.set(1,1,1);
      replacement.removeFromParent();candidate.sign=sign;
      const stationMode=candidate.setMode;sign.material.emissive.set('#ffffff');sign.material.emissiveMap=sign.material.map;
      candidate.setMode=mode=>{stationMode(mode);sign.material.emissiveIntensity=mode==='night'?.45:.08;};candidate.setMode('day');
      stationOwners[0].removeFromParent();colliders.splice(colliders.indexOf(stationSolids[0]),1);
      // The cinematic crosses this opening without walking physics. Once
      // control is released the doors are closed, so this solid is always valid.
      colliders.push(...candidate.colliders,...(candidate.closedDoorCollider?[candidate.closedDoorCollider]:[]),...routeColliders,...railColliders);
      inariStation=candidate;inariStationRoute=route;
    }else{candidate?.group?.removeFromParent();route?.group?.removeFromParent();keihanRail?.group?.removeFromParent();keihanRail=null;}
  }
  document.body.dataset.inariStation=JSON.stringify(inariStation?{built:true,revision:inariStation.spec.revision,stats:inariStation.stats,provenance:inariStation.spec.provenance,interactablesBefore:stationInteractionsBefore,interactablesAfter:legacy.interactables.length}:{built:false,reason:inariBuildError??'station replacement ownership or access unavailable'});
  document.body.dataset.inariStationRoute=JSON.stringify(inariStationRoute?{built:true,triangles:inariStationRoute.triangles,collidersAdded:inariStationRoute.collidersAdded,routePoints:inariStationRoute.routePoints}:{built:false});
  await checkpoint('buildInariStationFrontage');
  const inariStationFrontage=buildInariStationFrontage(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.inariStationFrontage=JSON.stringify(inariStationFrontage?(({group,...report})=>report)(inariStationFrontage):null);
  // Keihan is a separate station and street approach. Commit both owners only
  // when the platform-to-street connection succeeds; JR remains independent.
  let keihanStation=null,keihanApproach=null,keihanError=null;
  const keihanColliders=[];
  try{
    keihanStation=buildKeihanStation(root,legacy.materials,features,surfaces);
    keihanApproach=keihanStation.built?buildKeihanApproach(root,features,surfaces,legacy.materials,keihanColliders,keihanStation.spec,{externalCrossingDevices:!!keihanRail?.built}):null;
    if(!keihanStation.built||!keihanApproach?.built)throw Error('Keihan platform or public approach unavailable');
    colliders.push(...keihanStation.colliders,...(keihanStation.closedDoorCollider?[keihanStation.closedDoorCollider]:[]),...keihanColliders);
  }catch(error){
    keihanError=error.message;keihanStation?.group?.removeFromParent();keihanApproach?.group?.removeFromParent();keihanStation=null;keihanApproach=null;
  }
  await checkpoint('buildKeihanFrontages');
  const keihanFrontages=buildKeihanFrontages(root,features,surfaces,legacy.materials,colliders);
  await checkpoint('buildKeihanStreetContext');
  const keihanStreetContext=buildKeihanStreetContext(root,features,surfaces,legacy.materials,colliders);
  await checkpoint('buildKeihanEastParking');
  const keihanEastParking=buildKeihanEastParking(root,features,surfaces,legacy.materials,colliders);
  document.body.dataset.keihanEastParking=JSON.stringify({built:keihanEastParking.built,triangles:keihanEastParking.triangles,reason:keihanEastParking.reason});
  document.body.dataset.keihanStation=JSON.stringify(keihanStation?{built:true,stats:keihanStation.stats,revision:keihanStation.spec.revision}:{built:false,reason:keihanError});
  document.body.dataset.keihanApproach=JSON.stringify(keihanApproach?{built:true,triangles:keihanApproach.triangles,drawBatches:keihanApproach.drawBatches}:{built:false});
  document.body.dataset.keihanFrontages=JSON.stringify({built:keihanFrontages.built,builtIds:keihanFrontages.builtIds,triangles:keihanFrontages.triangles});
  await checkpoint('buildKandakaraShrine');
  const kandakaraShrine=buildKandakaraShrine(root,features,surfaces,legacy.materials);
  document.body.dataset.kandakaraShrine=JSON.stringify(kandakaraShrine);
  await checkpoint('buildLateralWaymarkers');
  document.body.dataset.lateralWaymarkers=JSON.stringify(buildLateralWaymarkers(root,features,surfaces,legacy.materials,colliders));
  // Batch static detail by material after placement. Interactive objects and
  // animated candle flames retain their original identity and callbacks.
  root.updateMatrixWorld(true);
  callbacks.progress?.('Preparing walking routes…');await yieldWork();
  await checkpoint('createPublicFloorQuery');
  const publicFloorHit=createPublicFloorQuery(THREE,root,legacy.materials,surfaces,ground);
  await checkpoint('createPublicGravelSupport');
  const publicGravelSupport=createPublicGravelSupport(byId.romon,features);
  // Mesh paving uses the shared height window; shader-painted gravel uses its
  // bounded authored footprint. Neither grants surrounding terrain or roofs.
  const isPublicWalkSupport=(x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&(!!publicFloorHit(x,z)||publicGravelSupport(x,z));
  function walkHeight(x,z,previous=ground(x,z)){
    const stationFloor=keihanStation?.surfaceHeight(x,z)??keihanApproach?.surfaceHeight(x,z)??keihanFrontages?.surfaceHeight?.(x,z)??keihanUrasando?.surfaceHeight?.(x,z)??inariStation?.surfaceHeight(x,z)??inariStationRoute?.surfaceHeight(x,z)??inariStationFrontage?.surfaceHeight?.(x,z);
    if(Number.isFinite(stationFloor))return stationFloor;
    const base=surfaces.height(x,z);
    const hit=publicFloorHit(x,z,previous);
    return hit?Math.max(base,hit.point.y+.025):base;
  }
  await checkpoint('buildOkushaNorthBoundaryR103');
  const okushaNorthBoundary=buildOkushaNorthBoundaryR103(root,features,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions,walkHeight});
  document.body.dataset.okushaNorthBoundaryR103=JSON.stringify(okushaNorthBoundary?(({group,...report})=>report)(okushaNorthBoundary):null);
  await checkpoint('buildOkushaExitFlanks');
  document.body.dataset.okushaExitFlanks=JSON.stringify(buildOkushaExitFlanks(root,legacy.materials,surfaces.terrainHeight,surfaces,colliders));
  await checkpoint('buildOkushaMappedSheltersR102');
  const okushaMappedSheltersR102=buildOkushaMappedSheltersR102(root,features,legacy.materials,walkHeight,colliders);
  document.body.dataset.okushaMappedSheltersR102=JSON.stringify(okushaMappedSheltersR102?(({group,...report})=>report)(okushaMappedSheltersR102):null);
  await checkpoint('buildKumatakaRestFurnitureR102');
  const kumatakaRestFurnitureR102=buildKumatakaRestFurnitureR102(root,features,surfaces,colliders,{water:shinikeWater,terrainPositions:renderedTerrainPositions});
  document.body.dataset.kumatakaRestFurnitureR102=JSON.stringify(kumatakaRestFurnitureR102?(({group,...report})=>report)(kumatakaRestFurnitureR102):null);
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
  // Preserve the pre-subdivision palette identity, including both LOD levels.
  // Season tints must not change just because the draw cells became smaller.
  const precinctVerandaFloors=[];
  root.traverse(object=>{
    if(object.userData.precinctVerandaFinish)precinctVerandaFloors.push(object);
    if(object.isInstancedMesh&&(object.material===legacy.foliage[2].material||object.userData.seasonalMaple)){
      object.userData.seasonSourceGroup??=0;
      // Shadow subcells inherit the original tree index, not the cell offset.
      if(object.userData.partitionSourceIndices)object.userData.seasonSourceIndices??=Object.freeze([...object.userData.partitionSourceIndices]);
    }
  });
  // Logical LOD/residency and colour batches stay intact; only shadow leaves split.
  if(forestSubcellSize)for(const chunks of [...legacyPartitionRoots,...extendedForestRoots]){
    const split=subdivideShadowInstanceLeaves(chunks,forestSubcellSize,{minTriangles:50000});
    for(const key of ['originalMeshCount','chunks','instances'])forestSubcells[key]+=split[key];
  }
  if(forestSubcellSize)for(const mesh of mountainDrawRoots){
    const split=subdivideShadowInstanceLeaves(mesh,32,{minTriangles:50000});
    for(const key of ['originalMeshCount','chunks','instances'])forestSubcells[key]+=split[key];
  }
  const retained=new Set([...legacy.interactables,...legacy.flickeringCandleMeshes,...gehaidenLanternCleanupR96.retainedObjects,...shrineFloors.children]);
  for(const object of legacy.interactables)object.traverse(child=>retained.add(child));
  // A moving carriage and its sliding doors must retain their local transforms.
  inariStation?.trainGroup.traverse(child=>retained.add(child));
  inariStation?.thresholdGroup.traverse(child=>retained.add(child));
  keihanStation?.trainGroup.traverse(child=>retained.add(child));
  keihanStation?.thresholdGroup.traverse(child=>retained.add(child));
  keihanRail?.group.traverse(child=>retained.add(child));
  for(const wax of findVotiveWaxToRetain(legacy.flickeringCandleMeshes))retained.add(wax);
  const residencyRetained=new Set();
  for(const object of legacy.interactables)object.traverse(child=>residencyRetained.add(child));
  // Two multi-material veranda leaves keep their original side finish and
  // shared timber top; retain them in the same sector residency/prewarm index.
  for(const object of precinctVerandaFloors){retained.add(object);residencyRetained.add(object);}
  callbacks.progress?.('Finishing the landscape…');await yieldWork();
  await checkpoint('batchStaticScene');
  const staticBatches=batchStaticScene(root,retained,128,residencyRetained);
  const forestChunks=[];root.updateMatrixWorld(true);
  // Only completed, immutable foliage/torii owners qualify. Animated visitors,
  // flames and railway objects retain automatic transforms.
  const staticInstances=(callbacks.freezeStaticInstances??forestSubcellSize>0)?freezeStaticInstanceTransforms(staticInstanceRoots):null;
  forestSubcells.frozenTransforms=staticInstances?.count??0;
  document.body.dataset.forestSubcells=JSON.stringify(forestSubcells);
  const instancePrewarmEntries=collectInstancePrewarmEntries([...toriiPrewarmRoots,...mountainDrawRoots]);
  root.traverse(o=>{if(!o.userData.nearForest)return;const leaf=o.isLOD?o.levels[0].object:o;leaf.computeBoundingSphere();forestChunks.push({object:o,bounds:leaf.boundingSphere.clone().applyMatrix4(leaf.matrixWorld)});});
  const inventory={activities:precinctLife.stats,...originalStats,anchors:anchors.length,senbonGates:senbon.gates,senbon,mountainTorii,pathSurfaces:surfaces.stats,
    mitsuFrontageAprons,forest,margins,terraces,yotsutsuji,reception,mountainLandmarks:{ainomine:ainomine?.stats??null,kumataka:kumatakaRefinement},
    nearPrecinct:{tamayama:tamayamaCompound,okumiya:okumiyaRefinement,access:nearPrecinctAccess,verandaSurfaces:precinctVerandaFloors.length},source:'interactive_viewer/index.html',replaced:['compressed terrain','compressed path ribbons','illustrative distant city'],...legacy.report};
  const registerCheckpoint=(id,label,point,lookAt)=>{
    const anchor={id,label,source:[...point],target:[...point],checkpoint:[...point],lookAt};spatial.anchors.push(anchor);spatial.byId[id]=anchor;
  };
  if(inariStation){const pose=inariStation.spec.arrival.platformPose;registerCheckpoint('inari_platform','JR Inari · Platform 2',[pose.position[0],pose.position[1]-1.7,pose.position[2]],pose.target);}
  if(keihanStation){const pose=keihanStation.spec.arrival.platformPose;registerCheckpoint('keihan_platform','Keihan Fushimi-Inari · Platform 2',[pose.position[0],pose.position[1]-1.7,pose.position[2]],pose.target);}
  const keihanLabels={keihan_gate:'Keihan · East exit',inari_bridge:'Inari-shinmichi · Canal bridge',urasando:'Urasando · Shrine approach'};
  for(const checkpoint of keihanApproach?.checkpoints??[]){const p=checkpoint.position;registerCheckpoint(checkpoint.id,keihanLabels[checkpoint.id],[p[0],p[1]-1.7,p[2]],checkpoint.lookAt);}
  if(keihanStation){const y=keihanStation.spec.platformFloor;registerCheckpoint('keihan_drinks','Keihan · Drink machines',[-302.0,y,-169.0],[-299.65,y+1.35,-169.0]);}
  if(keihanApproach){
    registerCheckpoint('jr_crossing','JR · Street crossing',[-220.5,walkHeight(-220.5,-86.5),-86.5],[-201,walkHeight(-201,-85)+1.7,-85]);
    registerCheckpoint('hommachi_turn','Hommachi · Right turn',[-157.252,walkHeight(-157.252,-85.95),-85.95],[-157.407,walkHeight(-157.407,10.342)+1.7,10.342]);
  }
  const foodCounter=keihanFrontages.storefronts?.find(s=>s.kind==='grill');
  if(foodCounter){const a=foodCounter.points[foodCounter.edge],u=foodCounter.width/2,x=a[0]+foodCounter.t[0]*u,z=a[2]+foodCounter.t[1]*u,px=x+foodCounter.n[0]*2.6,pz=z+foodCounter.n[1]*2.6;registerCheckpoint('keihan_food','Inari-shinmichi · Food counter',[px,walkHeight(px,pz),pz],[x,foodCounter.floor+1.3,z]);}
  if(omotesandoArrival.built){const {position:[x,z],lookAt:[tx,tz]}=omotesandoArrival.spawn;registerCheckpoint('omotesando_entry','Omotesando · First torii',[x,walkHeight(x,z),z],[tx,walkHeight(x,z)+1.7,tz]);}
  inventory.anchors=spatial.anchors.length;
  await checkpoint('registeredZenShelters');
  const zenShelters=registeredZenShelters({features,colliders,mitsurugi:mappedRoofCanopies,okusha:okushaMappedSheltersR102,yotsutsuji:yotsutsujiContextR95});
  return {root,zenShelters,deferredBuildings,staticBatches,instancePrewarmEntries,staticBoundaryRoots:[mappedBoundaries.group,...(callbacks.cullPathMargins?pathMarginRoots:[])],shadowPartitions:forestSubcells,staticInstanceTransforms:staticInstances,keihanRail,keihanStation,keihanApproach,keihanFrontages,keihanStreetContext,keihanUrasando,inariStation,inariStationRoute,inariStationFrontage,isWalkable:(x,z)=>Number.isFinite(keihanStation?.surfaceHeight(x,z)??keihanApproach?.surfaceHeight(x,z)??keihanFrontages?.surfaceHeight?.(x,z)??keihanUrasando?.surfaceHeight?.(x,z)??inariStation?.surfaceHeight(x,z)??inariStationRoute?.surfaceHeight(x,z)??inariStationFrontage?.surfaceHeight?.(x,z))||!!surfaces.sample(x,z),apronTransitionsR100:apronTransitionsR100.report??apronTransitionsR100,spatial,ground,omotesandoArrival,mikoshikoPrecinct:mikoshiko,shinsenjoPrecinct:shinsenjo,renderedTerrainPositions,officePonds,shinikeWater,mitsuFrontageAprons,walkHeight,precinctLife,forestChunks,surfaces,pathDistance,legacy,colliders,inventory,entranceSurfaces,isPublicWalkSupport,
    excludesBuilding:b=>kandakaraShrine.builtIds.includes(b.id)||yakurikiTrail.builtIds.includes(b.id)||mitsurugiCafe.builtIds.includes(b.id)||mappedRoofCanopies.builtIds.includes(b.id)||(keihanUrasando?.builtIds??[]).includes(b.id)||(keihanStreetContext?.builtIds??[]).includes(b.id)||(keihanStation?.builtIds??[]).includes(b.id)||(keihanFrontages?.builtIds??[]).includes(b.id)||(inariStationFrontage?.builtIds??[]).includes(b.id)||(inariStation?.builtIds??[]).includes(b.id)||(inariStationRoute?.builtIds??[]).includes(b.id)||(okushaMappedSheltersR102?.builtIds??[]).includes(b.id)||(kumatakaRegistrationR97?.builtIds??[]).includes(b.id)||(restBoundaryR96?.builtIds??[]).includes(b.id)||(shinkosuiWellR96.builtIds??[]).includes(b.id)||(mappedChojaR95.builtIds??[]).includes(b.id)||(okumiyaStairLanternsR95.builtIds??[]).includes(b.id)||(mikoshiko.builtIds??[]).includes(b.id)||(shinsenjo.builtIds??[]).includes(b.id)||(southShinmesha.builtIds??[]).includes(b.id)||takeyaFrontage.builtIds.includes(b.id)||mitsutsujiFrontages.builtIds.includes(b.id)||nosatsushoPavilion.builtIds.includes(b.id)||precinctNorthContext.builtIds.includes(b.id)||nearPrecinctShrineRow.builtIds.includes(b.id)||entranceNeighborhood.builtIds.includes(b.id)||(stationPlacement.placed&&b.id===mappedStationId)||northCourtBuildingIds.includes(b.id)||azumamaroContextIds.includes(b.id)||azumamaroHouseIds.includes(b.id)||['way/301527739','way/301527730'].includes(b.id)||b.id==='way/105449708'||teaHouses.some(s=>s.id===b.id)||anchors.some(a=>a.osm===b.id||a.radius&&b.points.some(p=>Math.hypot(p[0]-a.target[0],p[2]-a.target[2])<a.radius*.65))};
}
