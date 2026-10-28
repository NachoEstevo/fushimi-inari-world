import {installStaticInstanceBufferNames} from './static-instance-buffer-names.mjs';
import {padStaticInstanceMatrices} from './static-instance-capacity.mjs';
import {createWalkingPreparationYield} from './walking-preparation-yield.mjs';
import {createSuehiroyaSummit} from './suehiroya-summit.mjs';
import {createMappedBuildingFinishes} from './mapped-building-finishes.mjs';
import {installRendererHealth} from './renderer-health.mjs';
import {chooseShaftSites,createLocalSunShafts} from './local-sun-shafts.mjs';
import {createWalkingPrewarm} from './walking-prewarm.mjs';
import {prepareWalkingNeighborhood} from './walking-neighborhood-preparation.mjs';
import {installPrecinctLeafLight,collectPrecinctLeafBounds,collectPrecinctRoofBounds} from './precinct-leaf-light.mjs';
import {prepareTrainArrival} from './arrival-render-preparation.mjs';
import {omitUnverifiedPrecinctProxy,omitUnmodeledShrineProxy} from './precinct-proxy-policy.mjs';
import {attachCloudShade} from './cloud-shade.mjs';
import {compileAddedGroup,compileSelectedVisuals,createCompilationLightIndex} from './scoped-compilation.mjs';
import {createSectorPreparation,createRenderPreparationQueue} from './sector-preparation.mjs';
import {collectCheckpointVisuals} from './checkpoint-visuals.mjs';
import {panoramaVisible} from './panorama-policy.mjs';
import {createViewingDistance} from './viewing-distance.mjs';
import {installRendererTextureBindings} from './renderer-texture-bindings.mjs';
import {createForestWildlife} from './forest-wildlife.mjs';
import {installWorldAppearance} from './world-appearance.mjs?v=usability-9';
import {buildKeihanStationDetailPolish} from './keihan-station-detail-polish.mjs';
import {createPublicWalkDomain} from './public-walk-domain.mjs?v=repair-20261025b';
import {textureStreaming} from './texture-streaming.mjs?v=usability-9';
import {createRenderQuality} from './render-quality.mjs?v=ultra-2';
import {LIGHT_PRESETS,installRouteLighting} from './route-lighting.mjs';
import {installKeihanFareGates} from './keihan-fare-gates.mjs?v=suica-2';
import {buildKeihanVideoMerchandise} from './keihan-video-merchandise.mjs?v=repair-20261025b';
import {buildKeihanStreetObservedDetails} from './keihan-street-observed-details.mjs?v=repair-20261025b';
import {createWaterAppearance} from './water-appearance.mjs?v=immersion-20261025c';
import {installShinikeReflections} from './shinike-reflections.mjs?v=repair-20261025b';
import {installCityPanorama} from './city-panorama.mjs';
import {installExplorationMenu} from './exploration-menu.mjs?v=usability-9';
import {installJourneyJournal} from './journey-journal-ui.mjs';
import {installZenExperience} from './zen-experience.mjs';
import {observePrewarmRenders} from './prewarm-render-observer.mjs';
import {createPrewarmFrameBudget} from './prewarm-frame-budget.mjs';
import {prewarmViewRadius} from './prewarm-view-radius.mjs';
import {installStaticColorCull} from './static-color-cull.mjs';
import {collectInstancePrewarmEntries} from './instance-prewarm-entries.mjs';
import {installWelcomeScreen} from './welcome-screen.mjs?v=welcome-hud-1';
import {createTrainArrivalExperience,startTrainArrivalAfterWelcome} from './train-arrival-experience.mjs?v=usability-9';
import {buildStationApproachRoutes,joinKeihanSummitLoop} from './station-approach-routes.mjs?v=complete-route-1';
import {buildStationApproachSurfaceFixes} from './station-approach-surface-fixes.mjs?v=recorded-immersion-5';
import {advanceGuidedRoute} from './guided-route-motion.mjs';
import {createWorldDetailChunks} from './world-detail-chunks.mjs';
import {installKeihanStreetCommerce} from './keihan-street-commerce.mjs?v=immersion-20261025c';
import {installKeihanStreetLife} from './keihan-street-life.mjs?v=immersion-20261025c';
import {installTrainArrivalUI} from './train-arrival-ui.mjs?v=welcome-hud-3';
import {installPhotoMode} from './photo-mode.mjs?v=ultra-1';
import {protectOrbit} from './orbit-clearance.mjs';
import {installSky} from './sky.mjs?v=ambience-4';
import {installFlashlight} from './flashlight.mjs?v=welcome-hud-1';
import {installVisitors} from './visitors.mjs?v=immersion-20261025c';
import {spatialMeshes} from './spatial-mesh.mjs';
import {createSunShadowSchedule} from './sun-shadow-schedule.mjs';
import {renderStats} from './render-stats.mjs?v=usability-9';
import {installCandleFlameInstances} from './candle-flame-instances.mjs';
import {distantCanopy} from './distant-canopy.mjs?v=33';
import {blendCourtyardGround} from './courtyard-ground-nodes.mjs';
import {blendEntranceGround} from './entrance-ground-nodes.mjs';
import {blendKeihanStreetGround} from './keihan-street-ground-nodes.mjs';
import {makePrecinctGroundCover} from './ground-cover.mjs?v=64';
import {installSeasons} from './seasons.mjs?v=welcome-hud-1';
import {buildPathMeshes} from './path-meshes.mjs?v=usability-9';
import {installExplorationHUD} from './exploration-hud.mjs?v=welcome-hud-1';
import {integrate} from './integration.mjs?v=station-polish-20261025b';
import {installWalking} from './walking.mjs?v=immersion-20261025c';
import {createAudio} from './audio.mjs?v=audio-small-1';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {heightAt,buildGraph,nearestNode,shortestRoute,routeMetrics,resample,pathWidth,isRestricted,distance} from '../geography/geo-core.mjs';

const $=id=>document.getElementById(id);
// Inspection tools remain explicit, separate from the visitor experience.
const query=new URLSearchParams(location.search);
// Live-flow diagnostics retain streaming/prewarm and skip destination warmup.
const liveFlowAudit=query.get('shadowAudit')==='1'&&query.get('shadowFlow')==='live';
const allowDebugCamera=query.get('debugCamera')==='1';
const allowFastTravel=allowDebugCamera||query.get('audit')==='1'||query.get('textureAudit')==='1';
const welcome=installWelcomeScreen();
const loadingStages=[];
function loadingStage(message){
  $('loading').textContent=message;
  loadingStages.push({message,ms:Math.round(performance.now())});
  document.body.dataset.loadingStages=JSON.stringify(loadingStages);
}
try {
  document.body.dataset.bootPhase='geography';
  const [terrain,features,manifest]=await Promise.all(['terrain','features','manifest'].map(async name=>{
    const response=await fetch(`../geography/${name}.json`);if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);return response.json();
  }));
  const width=(terrain.cols-1)*terrain.step, depth=(terrain.rows-1)*terrain.step;
  const cx=terrain.xmin+width/2,cz=terrain.zmin+depth/2;
  let assembly=null,leafLight=null,walkingPrewarm=null,renderPreparation=null,showcase=null,shadowRouteAudit=null,shadowCasterCapture=null,shadowCasterPending=false;
  const ground=(x,z)=>assembly?assembly.ground(x,z):heightAt(terrain,x,z);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#263c36');
  const compilationLights=createCompilationLightIndex(scene);
  const renderer=new THREE.WebGPURenderer({antialias:true,forceWebGL:new URLSearchParams(location.search).get('backend')==='webgl'});
  document.body.dataset.bootPhase='graphics device';
  await renderer.init();
  document.body.dataset.bootPhase='scene';
  const staticShaderOwners=new WeakSet();
  const instanceCapacityEnabled=query.get('pipelineAudit')!=='1'||query.get('instanceCapacity')!=='0';
  const instanceBufferNames=instanceCapacityEnabled?installStaticInstanceBufferNames(renderer.backend,{objects:staticShaderOwners}):null;
  let renderBuildAudit=null,rendererHealth=null,frameStallAudit=null,backendWorkAudit=null,frameSchedulingAudit=null;
  rendererHealth=installRendererHealth({renderer,audit:query.get('gpuAudit')==='1',getContext:()=>({
    quality:document.body.dataset.renderQuality,timeOfDay:$('light').value,camera:document.body.dataset.camera?.split(',').map(Number),
    prewarm:walkingPrewarm?.stats,textures:textureStreaming.stats,shafts:document.body.dataset.sunShafts,pipelineReadiness:document.body.dataset.pipelineReadiness
  })});
  addEventListener('pagehide',event=>{if(!event.persisted)rendererHealth.dispose();});
  if(query.get('pipelineAudit')==='1'){
    const {installRenderBuildAudit}=await import('./render-build-audit.mjs');
    renderBuildAudit=installRenderBuildAudit(renderer.backend);
    const [{installFrameStallAudit},{installBackendWorkAudit}]=await Promise.all([import('./frame-stall-audit.mjs'),import('./backend-work-audit.mjs')]);
    const {installFrameSchedulingAudit}=await import('./frame-scheduling-audit.mjs');
    frameStallAudit=installFrameStallAudit();backendWorkAudit=installBackendWorkAudit(renderer.backend,{limit:1000});frameSchedulingAudit=installFrameSchedulingAudit();
    addEventListener('pagehide',event=>{if(!event.persisted){frameStallAudit.dispose();backendWorkAudit.dispose();frameSchedulingAudit.dispose();}});
    addEventListener('pagehide',event=>{if(!event.persisted)renderBuildAudit.dispose();});
  }
  addEventListener('pagehide',event=>{if(!event.persisted)instanceBufferNames?.dispose();});
  renderer.backend.device?.addEventListener('uncapturederror',event=>{document.body.dataset.gpuError=event.error.message;});
  const textureBindings=installRendererTextureBindings(renderer);
  document.body.dataset.rendererBackend=renderer.backend.isWebGPUBackend?'webgpu':'webgl2';
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  $('world').append(renderer.domElement);
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Explore Inariyama: click to capture mouse, WASD to walk, mouse to look, Escape to release');
  const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.2,12000);
  const viewingDistance=createViewingDistance({scene,camera,debugCamera:allowDebugCamera});
  const sky=installSky(scene,camera);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=3;controls.maxDistance=6000;
  const hemi=new THREE.HemisphereLight(0xe9f1e3,0x61765f,1.6);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffebcd,2.3);sun.position.set(-800,1400,-600);scene.add(sun);
  const audio=createAudio();
  loadingStage('Building nearby streets and walking surfaces…');
  assembly=await integrate(scene,renderer,terrain,features,{cullPathMargins:query.get('pipelineAudit')!=='1'||query.get('marginCull')!=='0',freezeStaticInstances:query.get('shadowAudit')==='1'&&query.has('shadowFreeze')?query.get('shadowFreeze')==='1':undefined,forestSubcellSize:query.get('shadowAudit')==='1'?({'legacy':0,'64':64,'48':48,'32':32}[query.get('shadowCells')]??64):undefined,progress:loadingStage,bell:audio.bell,water:audio.water,map:()=>document.body.classList.remove('panels-hidden'),buildingAdded:async group=>{
    compilationLights.invalidate();
    appearance.applyTo(group);
    group.traverse(object=>{for(const material of [object.material].flat())if(material?.userData?.precinctLeafReceiver)leafLight?.attach(material);});
    quality.refreshTextures(group);
    textureStreaming.index(group,{append:true});
    textureStreaming.update(camera.position,1);
    const compileGroup=async()=>{walkingPrewarm?.setBlocked(true);await walkingPrewarm?.awaitIdle();await textureStreaming.prepareAt(camera.position);await compileAddedGroup(quality,scene,group,camera,{batchSize:1,reuseRenderScene:true,getLights:compilationLights.getLights,report:stats=>{document.body.dataset.deferredCompilation=JSON.stringify(stats);}});};
    await (renderPreparation?renderPreparation.run(compileGroup):compileGroup());
    group.updateWorldMatrix(true,true);
    const bounds=new THREE.Box3().setFromObject(group);
    detailChunks.add(group,{bounds:bounds.getBoundingSphere(new THREE.Sphere())});preparationResidency.add(group);
    preparationBounds.set(group,bounds);walkingPreparationBounds.set(group,bounds);
    walkingPrewarm?.append([{object:group,bounds}]);
    detailChunks.update(camera,performance.now()/1000,quality.detailScale,true);
    sun.shadow.needsUpdate=true;
  }});
  // Deferred groups join the world after their detached shader preparation.
  for(const type of ['childadded','childremoved'])assembly.root.addEventListener(type,compilationLights.invalidate);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  // r180 preserves an explicitly extended shadow mask. The visitor and
  // reflection cameras stay on layer 0; layer 1 contains shadow-only instances.
  if(assembly.shadowPartitions.size>0)sun.shadow.camera.layers.enable(1);
  Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:200});
  sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;scene.add(sun.target);
  const sunShadows=createSunShadowSchedule({sun,quality:'balanced'});
  const terrainGeo=new THREE.BufferGeometry();
  const pondClipped=assembly.officePonds.clipTerrain(assembly.renderedTerrainPositions);
  const pathClipped=assembly.mitsuFrontageAprons.clipTerrain?.(pondClipped)??pondClipped;
  const mikoshikoClipped=assembly.mikoshikoPrecinct.clipTerrain?.(pathClipped)??pathClipped;
  const shinsenjoClipped=assembly.shinsenjoPrecinct.clipTerrain?.(mikoshikoClipped)??mikoshikoClipped;
  const shinikeClipped=assembly.shinikeWater.clipTerrain?.(shinsenjoClipped)??shinsenjoClipped;
  const pos=assembly.keihanApproach?.clipTerrain(shinikeClipped)??shinikeClipped;
  document.body.dataset.officePonds=JSON.stringify(assembly.officePonds);
  terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  terrainGeo.computeVertexNormals();
  const soil=textureStreaming.load('../assets/textures/nanobanana/surface_forest_soil_leaves.png');
  soil.colorSpace=THREE.SRGBColorSpace;soil.wrapS=soil.wrapT=THREE.RepeatWrapping;soil.anisotropy=8;
  const soilNormal=textureStreaming.load('../assets/textures/nanobanana/surface_forest_soil_leaves_normal.png');
  soilNormal.wrapS=soilNormal.wrapT=THREE.RepeatWrapping;
  const groundUV=[];for(let i=0;i<pos.length;i+=3)groundUV.push(pos[i]/1.5,pos[i+2]/1.5);
  terrainGeo.setAttribute('uv',new THREE.Float32BufferAttribute(groundUV,2));
  const cover=[],precinctGrass=[],coverCache=new Map();
  const groundCover=makePrecinctGroundCover(features,{surfaceAreas:assembly.entranceSurfaces});
  for(let i=0;i<pos.length;i+=3){
    const x=pos[i],y=pos[i+1],z=pos[i+2],key=`${x},${z}`;
    if(!coverCache.has(key)){
      const slope=Math.hypot(ground(x+1,z)-ground(x-1,z),ground(x,z+1)-ground(x,z-1))/2;
      const distance=assembly.pathDistance(x,z)?.distance??100;
      coverCache.set(key,[groundCover(x,y,z,slope,distance),groundCover.precinct(x,y,z,slope,distance)]);
    }
    cover.push(coverCache.get(key)[0]);precinctGrass.push(coverCache.get(key)[1]);
  }
  terrainGeo.setAttribute('groundCover',new THREE.Float32BufferAttribute(cover,1));
  terrainGeo.setAttribute('precinctGrass',new THREE.Float32BufferAttribute(precinctGrass,1));
  coverCache.clear();
  const terrainMaterial=new THREE.MeshStandardNodeMaterial({map:soil,normalMap:soilNormal,normalScale:new THREE.Vector2(.35,.35),roughness:1});
  // Reuse the terrain's streamed earth maps, with matching world-space UVs.
  const pondBank=scene.getObjectByName('Shin-ike bounded inward natural bank collar R97');
  if(pondBank){
    pondBank.material.map=soil;pondBank.material.normalMap=soilNormal;
    pondBank.material.normalScale.copy(terrainMaterial.normalScale);
    pondBank.material.color.set(0xffffff);pondBank.material.needsUpdate=true;
  }
  const courtyard=assembly.legacy.materials.gravelMat;
  const romon=assembly.spatial.byId.romon;
  blendCourtyardGround(terrainMaterial,courtyard,romon);
  blendEntranceGround(terrainGeo,terrainMaterial,courtyard,romon,features);
  blendKeihanStreetGround(terrainGeo,terrainMaterial,features);
  const cloudShade=attachCloudShade(terrainMaterial);
  const landscape=spatialMeshes(terrainGeo,terrainMaterial,160);scene.add(landscape);terrainGeo.dispose();

  function meshFrom(vertices,material){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
    const uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]/2,vertices[i+2]/2);geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;return mesh;
  }
  function appendRibbon(vertices,points,w,offset){
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[2]-a[2]);
      if(len<.001)continue;
      const dx=-(b[2]-a[2])/len*w/2,dz=(b[0]-a[0])/len*w/2;
      const corners=[[a[0]+dx,a[2]+dz],[b[0]+dx,b[2]+dz],[b[0]-dx,b[2]-dz],[a[0]-dx,a[2]-dz]]
        .map(([x,z])=>[x,ground(x,z)+offset,z]);
      for(const j of [0,1,2,0,2,3])vertices.push(...corners[j]);
    }
  }
  const pathGroup=buildPathMeshes(assembly.surfaces,assembly.legacy,assembly.ground);scene.add(pathGroup);
  const approachFloors=buildStationApproachSurfaceFixes(assembly,pathGroup,features);
  assembly.walkHeight=approachFloors.walkHeight;
  const streetCommerce=installKeihanStreetCommerce(assembly);
  const observedStreet=buildKeihanStreetObservedDetails(assembly);
  const stationDetails=buildKeihanStationDetailPolish(assembly);
  const videoMerchandise=buildKeihanVideoMerchandise(assembly);
  document.body.dataset.videoMerchandise=JSON.stringify(videoMerchandise.stats);
  document.body.dataset.observedStreet=JSON.stringify(observedStreet.stats);
  document.body.dataset.streetCommerce=JSON.stringify(streetCommerce.stats);
  document.body.dataset.approachFloors=JSON.stringify(approachFloors.stats);
  document.body.dataset.apronTransitionsR100=JSON.stringify(assembly.apronTransitionsR100);

  // Footprints are sourced. Extrusion height is metadata-based or explicitly inferred.
  const buildingGroup=new THREE.Group();scene.add(buildingGroup);buildingGroup.visible=$('buildings').checked;
  const buildings={ordinary:[],sacred:[]};
  let inferredHeightCount=0,omittedShrineProxies=0;
  const includeMappedProxies=query.get('mappedProxies')==='1';
  const summitShop=createSuehiroyaSummit({buildings:features.buildings,ground,walkHeight:assembly.walkHeight,materials:assembly.legacy.materials});
  buildingGroup.add(summitShop.group);
  document.body.dataset.suehiroyaSummit=JSON.stringify(summitShop.stats);
  addEventListener('pagehide',event=>{if(!event.persisted)summitShop.dispose();});
  const omitContext=building=>summitShop.builtIds.has(building.id)||omitUnverifiedPrecinctProxy(building)||(!includeMappedProxies&&omitUnmodeledShrineProxy(building));
  const contextRoutes=[assembly.spatial.main,assembly.spatial.returning,...assembly.spatial.twins.map(path=>Array.from({length:81},(_,i)=>path.at(i/80).point)),assembly.keihanStation?.routePoints,assembly.keihanApproach?.routePoints,assembly.inariStationRoute?.routePoints].filter(route=>route?.length>1);
  const contextSegments=contextRoutes.flatMap(route=>route.slice(1).map((b,i)=>({a:route[i],b})));
  const contextFinishes=createMappedBuildingFinishes({buildings:features.buildings,segments:contextSegments,ground,excludesBuilding:assembly.excludesBuilding,omitBuilding:omitContext});
  buildingGroup.add(contextFinishes.group);
  inferredHeightCount=contextFinishes.stats.records.filter(record=>record.heightSource!=='height').length;
  document.body.dataset.mappedBuildingFinishes=JSON.stringify(contextFinishes.stats);
  addEventListener('pagehide',event=>{if(!event.persisted)contextFinishes.dispose();});

  for(const b of features.buildings){
    if(summitShop.builtIds.has(b.id)||assembly.excludesBuilding(b)||omitUnverifiedPrecinctProxy(b))continue;
    if(!includeMappedProxies&&omitUnmodeledShrineProxy(b)){omittedShrineProxies++;continue;}
    if(contextFinishes.detailedIds.has(b.id))continue;
    const ring=b.points.slice(0,-1), contour=ring.map(p=>new THREE.Vector2(p[0],p[2]));
    const sacred=b.tags.building==='shrine'||b.tags.religion==='shinto'||b.tags.amenity==='place_of_worship';
    const heightValue=Number.parseFloat(b.tags.height),levels=Number.parseFloat(b.tags['building:levels']);
    const h=Number.isFinite(heightValue)?heightValue:Number.isFinite(levels)?levels*3:sacred?4:6;
    if(!Number.isFinite(heightValue))inferredHeightCount++;
    const base=Math.min(...ring.map(p=>ground(p[0],p[2]))),roof=Math.max(...ring.map(p=>ground(p[0],p[2])))+h;
    const v=buildings[sacred?'sacred':'ordinary'];
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length];
      const q=[[a[0],base,a[2]],[b[0],base,b[2]],[b[0],roof,b[2]],[a[0],roof,a[2]]];
      for(const j of [0,1,2,0,2,3])v.push(...q[j]);
    }
    for(const triangle of THREE.ShapeUtils.triangulateShape(contour,[]))for(const j of triangle)v.push(ring[j][0],roof,ring[j][2]);
  }
  // Existing OSM footprints, partitioned so offscreen neighbourhoods are culled.
  for(const [kind,tint] of [['ordinary',0xaaa79e],['sacred',0x87796c]]){
    const material=new THREE.MeshLambertMaterial({color:tint,side:THREE.DoubleSide});
    const mesh=meshFrom(buildings[kind],material);
    const normal=mesh.geometry.attributes.normal;
    const shades=[];
    for(let i=0;i<normal.count;i++){
      const shade=Math.abs(normal.getY(i))>.7?.48:1;
      shades.push(shade,shade,shade);
    }
    mesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));material.vertexColors=true;
    const chunks=spatialMeshes(mesh.geometry,material,256);
    for(const child of chunks.children)child.receiveShadow=false;
    buildingGroup.add(chunks);mesh.geometry.dispose();
  }
  buildingGroup.updateWorldMatrix(true,true);
  const mappedBuildingEntries=[];buildingGroup.traverse(object=>{if(object.isMesh)mappedBuildingEntries.push({object,bounds:new THREE.Box3().setFromObject(object)});});
  document.body.dataset.mappedProxyPolicy=JSON.stringify({omittedShrineProxies,includeMappedProxies,provenance:'Unmodeled religious extrusions omitted; source footprints and POIs retained'});
  const panorama=installCityPanorama(scene,features,ground,building=>assembly.excludesBuilding(building)||omitContext(building));
  const canopy=distantCanopy(features,ground,assembly.pathDistance,terrain);scene.add(canopy.group);
  document.body.dataset.aerialContext=JSON.stringify({footprints:features.buildings.length,crowns:canopy.group.userData.count,canopyTriangles:canopy.group.userData.count*20,provenance:'OSM footprints; satellite-interpreted woodland; estimated heights'});

  const waterVertices=[];
  for(const w of features.water){
    if(w.tags.natural!=='water'||w.points.length<4||assembly.officePonds.builtIds.includes(w.id)||assembly.shinikeWater.builtIds.includes(w.id))continue;
    const ring=w.points.slice(0,-1),contour=ring.map(p=>new THREE.Vector2(p[0],p[2]));
    for(const triangle of THREE.ShapeUtils.triangulateShape(contour,[]))for(const j of triangle){
      const p=ring[j];waterVertices.push(p[0],ground(p[0],p[2])+.3,p[2]);
    }
  }
  const lakeWater=meshFrom(waterVertices,createWaterAppearance({kind:'lake'}));lakeWater.receiveShadow=true;scene.add(lakeWater);
  const waterControllers=new Set();
  scene.traverse(object=>{for(const material of (Array.isArray(object.material)?object.material:[object.material])){if(material?.userData.waterAppearance)waterControllers.add(material.userData.waterAppearance);}});

  const translations={'楼門':'Rōmon','本殿':'Honden','外拝殿':'Gehaiden','内拝殿':'Naihaiden','奥社奉拝所':'Okusha Hōhaisho','熊鷹社':'Kumatakasha','新池':'Shin-ike',
    '一ノ峰':'Ichinomine','二ノ峰':'Ninomine','三ノ峰':'Sannomine','御劔社':'Mitsurugisha','御膳谷奉拝所':'Gozendani Hōhaisho','眼力社':'Ganrikisha',
    '四ツ辻':'Yotsutsuji','四ツ辻 (Yottsu tsuji)':'Yotsutsuji','四つ辻':'Yotsutsuji','四辻':'Yotsutsuji','三ツ辻':'Mitsutsuji','稲荷山':'Inariyama · summit','稲荷':'JR Inari','伏見稲荷':'Keihan Fushimi-Inari',
    '奥宮':'Okumiya','荒木神社':'Araki-jinja','伏見神宝神社 本殿':'Fushimi Kandakara-jinja'};
  const displayName=p=>translations[p.tags.name]??p.tags['name:en']??p.tags.name;
  const landmarks=features.pois.filter(p=>p.tags.name&&(p.tags.religion==='shinto'||p.tags.building==='shrine'
    ||p.tags.natural==='peak'||p.tags.natural==='water'||p.tags.railway==='station'||p.tags.tourism==='viewpoint'||p.id==='node/749327219'));
  landmarks.sort((a,b)=>displayName(a).localeCompare(displayName(b)));
  for(const p of landmarks){
    for(const id of ['start','destination','via']){
      const option=document.createElement('option');option.value=p.id;option.textContent=`${displayName(p)} · ${Math.round(p.point[1])} m`;$ (id).append(option);
    }
  }
  const startPoi=landmarks.find(p=>p.tags.name==='楼門')??landmarks[0];
  const endPoi=landmarks.find(p=>p.tags.name==='一ノ峰')??landmarks.at(-1);
  $('start').value=startPoi.id;$('destination').value=endPoi.id;
  const landmarkGroup=new THREE.Group();scene.add(landmarkGroup);
  const markerGeometry=new THREE.SphereGeometry(.65,8,6),markerMaterial=new THREE.MeshBasicMaterial({color:0xf0b176});
  const markers=new THREE.InstancedMesh(markerGeometry,markerMaterial,landmarks.length),dummy=new THREE.Object3D();
  landmarks.forEach((p,i)=>{dummy.position.set(p.point[0],ground(p.point[0],p.point[2])+12,p.point[2]);dummy.updateMatrix();markers.setMatrixAt(i,dummy.matrix);});
  landmarkGroup.add(markers);landmarkGroup.visible=false;
  const graph=buildGraph(features.paths,terrain);
  const stationRoutes=buildStationApproachRoutes(assembly,features,terrain);
  let activeRoute=[],routeLine=null,walking=false,routeProgress=0,travelled=0,lastTime=performance.now();
  let arrival=null,arrivalUI=null,zen=null;
  function interruptArrival(){
    zen?.cancelActivity();
    // If the requested destination is unavailable, remain on a safe platform.
    if(arrival?.active)arrival.skip();
    arrival?.cancel();
  }
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.35,12,8),new THREE.MeshBasicMaterial({color:0xf5f7dd}));
  marker.visible=false;scene.add(marker);
  function overview(){
    walking=false;controls.enabled=true;
    controls.target.set(650,100,-90);camera.position.set(-1000,1700,1750);camera.up.set(0,1,0);controls.update();
    $('stop').disabled=true;$('walk').textContent=routeProgress>0?'Resume':'Follow route';
    $('position').textContent='Horizontal and vertical scale 1:1';
  }
  overview();
  function profile(points){
    const canvas=$('profile'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);canvas.style.display='block';
    const total=routeMetrics(points).length,lo=Math.min(...points.map(p=>p[1])),hi=Math.max(...points.map(p=>p[1]));
    let along=0;ctx.strokeStyle='#b8382b';ctx.lineWidth=2;ctx.beginPath();
    points.forEach((p,i)=>{if(i)along+=distance(points[i-1],p);const x=12+along/Math.max(total,1)*(w-24),y=h-28-(p[1]-lo)/Math.max(hi-lo,1)*(h-55);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
    ctx.fillStyle='#593a33';ctx.font='20px system-ui';ctx.fillText(`${Math.round(lo)}–${Math.round(hi)} m`,12,20);
  }
  function clearRoute(){
    const resumeWalking=walking&&!allowDebugCamera;
    walking=false;controls.enabled=allowDebugCamera;activeRoute=[];routeProgress=0;travelled=0;marker.visible=false;
    $('walk').disabled=true;$('stop').disabled=true;$('profile').style.display='none';$('route-stops').textContent='';$('route-gaps').textContent='';
    if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();routeLine=null;}
    // A route replan releases the guided camera back to public walking.
    if(resumeWalking)walker.start();
  }
  function trace(){
    clearRoute();
    $('custom-fields').hidden=$('itinerary').value!=='custom';
    const stationKey=$('itinerary').value;
    const completeKeihan=stationKey==='keihan_loop',viewsOnly=stationKey==='zen_views';
    const stationSelected=['keihan','keihan_omotesando','jr'].includes(stationKey);
    $('branch').hidden=stationSelected;document.querySelector('label[for="branch"]').hidden=stationSelected;
    if(stationSelected){
      const route=stationRoutes[stationKey];
      if(!route){$('route-info').textContent='This station approach is unavailable.';drawMap();return;}
      activeRoute=route.points;
      const stats=routeMetrics(activeRoute);
      $('route-info').textContent=`${Math.round(stats.length)} m · Station to Rōmon`;
      $('route-stops').textContent=route.stops.join(' → ');
      $('route-gaps').textContent='Follow the station exit and public streets to the shrine.';
      showRoute();return;
    }
    let chosen=[$('start').value,...($('via').value?[$('via').value]:[]),$('destination').value].map(id=>landmarks.find(p=>p.id===id));
    if($('itinerary').value!=='custom'){
      const names=viewsOnly?['楼門','奥社奉拝所','熊鷹社','四ツ辻 (Yottsu tsuji)']:['楼門','奥社奉拝所','熊鷹社','四ツ辻 (Yottsu tsuji)','三ノ峰','二ノ峰','一ノ峰'];
      if($('itinerary').value==='loop'||completeKeihan)names.push('御劔社','御膳谷奉拝所','四ツ辻 (Yottsu tsuji)','楼門');
      chosen=names.map(name=>landmarks.find(p=>p.tags.name===name));
      const branch=features.paths.find(p=>p.id===$('branch').value);
      chosen.splice(1,0,branch?{id:branch.id,tags:{name:'Senbon · rama seleccionada'},point:branch.points[Math.floor(branch.points.length/2)]}:landmarks.find(p=>p.id==='node/6865347485'));
      if(chosen.some(p=>!p))throw new Error('An itinerary landmark is missing from the map');
      $('start').value=chosen[0].id;$('destination').value=chosen.at(-1).id;$('via').value='';
    }
    const snapped=chosen.map(p=>nearestNode(graph,p.point,80));
    if(snapped.some(s=>!s)){$('route-info').textContent='No accessible mapped path within 80 m of a selected point. No connection was invented.';drawMap();return;}
    let route=[];
    for(let i=1;i<snapped.length;i++){
      const segment=shortestRoute(graph,snapped[i-1].node.id,snapped[i].node.id,new Set($('branch').value?['way/260121328','way/377968455'].filter(id=>id!==$('branch').value):[]));
      if(!segment){$('route-info').textContent='These points are on disconnected trail networks. Try another access point.';drawMap();return;}
      route.push(...(i===1?segment:segment.slice(1)));
    }
    const mountainRoute=resample(route,terrain,2);
    activeRoute=(completeKeihan||viewsOnly)?joinKeihanSummitLoop(stationRoutes.keihan_omotesando,mountainRoute,assembly.walkHeight):mountainRoute;
    if(!activeRoute){$('route-info').textContent='The station approach and summit loop could not be joined at Rōmon.';drawMap();return;}
    if(activeRoute.length<2){$('route-info').textContent='Start and destination share the same network point.';drawMap();return;}
    const stats=routeMetrics(activeRoute),gaps=snapped.map(s=>Math.round(s.distance));
    $('route-info').textContent=`${(stats.length/1000).toFixed(2)} km · ↑ ${Math.round(stats.ascent)} m · ↓ ${Math.round(stats.descent)} m. Elevation estimated from DEM.`;
    $('route-stops').textContent=[...((completeKeihan||viewsOnly)?stationRoutes.keihan_omotesando.stops.slice(0,-1):[]),...chosen.map(displayName)].join(' → ');
    $('route-gaps').textContent=`Maximum landmark-to-path distance: ${Math.max(...gaps)} m. Routes reach mapped trail nodes, without invented links to buildings.`;
    showRoute();
  }
  function showRoute(){
    const lift=['keihan','keihan_omotesando','keihan_loop','zen_views','jr'].includes($('itinerary').value)?.08:1;
    routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(activeRoute.map(p=>new THREE.Vector3(p[0],p[1]+lift,p[2]))),
      new THREE.LineBasicMaterial({color:0xff7146,depthTest:true}));
    routeLine.renderOrder=20;scene.add(routeLine);profile(activeRoute);$('walk').disabled=false;$('walk').textContent='Follow route';
    marker.position.set(activeRoute[0][0],activeRoute[0][1]+5,activeRoute[0][2]);marker.visible=true;drawMap();
  }
  $('route').onclick=trace;
  $('itinerary').onchange=trace;$('branch').onchange=trace;
  $('overview').onclick=()=>{if(!allowDebugCamera||sectorPreparation?.busy)return;interruptArrival();walker.stop();overview();};
  $('walk').onclick=()=>{
    if(!activeRoute.length)return;
    if(routeProgress>=activeRoute.length-1){routeProgress=0;travelled=0;}
    walking=true;controls.enabled=false;$('stop').disabled=false;$('walk').textContent='Following route…';
  };
  $('stop').onclick=()=>{
    walking=false;controls.target.copy(camera.position).add(new THREE.Vector3(0,0,-10).applyQuaternion(camera.quaternion));
    controls.enabled=allowDebugCamera;if(allowDebugCamera)controls.update();else walker.start();$('stop').disabled=true;$('walk').textContent='Resume';
  };
  $('buildings').onchange=e=>buildingGroup.visible=e.target.checked;
  $('aerial-canopy').onchange=e=>canopy.group.visible=e.target.checked;
  $('paths').onchange=e=>{pathGroup.visible=e.target.checked;drawMap();};
  $('landmarks').onchange=e=>{landmarkGroup.visible=e.target.checked;drawMap();};
  for(const id of ['start','destination','via'])$(id).onchange=()=>{$('itinerary').value='custom';clearRoute();$('route-info').textContent='Selection changed. Plan the new route.';drawMap();};
  const map=$('map'),ctx=map.getContext('2d'),pad=15;
  const scale=Math.min((map.width-2*pad)/width,(map.height-2*pad)/depth);
  const mx=x=>pad+(x-terrain.xmin)*scale,mz=z=>pad+(z-terrain.zmin)*scale;
  const relief=document.createElement('canvas');relief.width=terrain.cols;relief.height=terrain.rows;
  const rc=relief.getContext('2d'),im=rc.createImageData(terrain.cols,terrain.rows);
  terrain.heights.forEach((h,i)=>{
    const c=i%terrain.cols,r=Math.floor(i/terrain.cols);
    const slope=(terrain.heights[r*terrain.cols+Math.max(0,c-1)]-terrain.heights[r*terrain.cols+Math.min(terrain.cols-1,c+1)])*.6;
    const v=35+h*.2+slope;im.data.set([v*.82,v*1.12,v*.94,255],i*4);
  });rc.putImageData(im,0,0);
  function drawMap(){
    ctx.clearRect(0,0,map.width,map.height);ctx.drawImage(relief,pad,pad,width*scale,depth*scale);
    if($('paths').checked)for(const p of features.paths){
      ctx.strokeStyle=isRestricted(p.tags)?'#98756e':['footway','path','steps','pedestrian','track'].includes(p.tags.highway)?'#d6b78088':'#a4b1a43a';
      ctx.lineWidth=1;ctx.beginPath();p.points.forEach((q,i)=>i?ctx.lineTo(mx(q[0]),mz(q[2])):ctx.moveTo(mx(q[0]),mz(q[2])));ctx.stroke();
    }
    for(const p of features.water.filter(w=>w.tags.natural==='water')){
      ctx.fillStyle='#568c99';ctx.beginPath();p.points.forEach((q,i)=>i?ctx.lineTo(mx(q[0]),mz(q[2])):ctx.moveTo(mx(q[0]),mz(q[2])));ctx.fill();
    }
    if(activeRoute.length){ctx.strokeStyle='#ff8c5f';ctx.lineWidth=3;ctx.beginPath();activeRoute.forEach((q,i)=>i?ctx.lineTo(mx(q[0]),mz(q[2])):ctx.moveTo(mx(q[0]),mz(q[2])));ctx.stroke();}
    if($('landmarks').checked)for(const p of landmarks){
      ctx.fillStyle='#e1c69f';ctx.beginPath();ctx.arc(mx(p.point[0]),mz(p.point[2]),2.5,0,Math.PI*2);ctx.fill();
    }
    for(const id of [$('start').value,$('destination').value,$('via').value].filter(Boolean)){
      const p=landmarks.find(p=>p.id===id);ctx.fillStyle='#fff5d8';ctx.font='18px system-ui';
      ctx.fillText(displayName(p),Math.min(map.width-140,mx(p.point[0])+8),mz(p.point[2])-8);
    }
    if(marker.visible){ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(mx(marker.position.x),mz(marker.position.z),5,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#d8e2d3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad,map.height-12);ctx.lineTo(pad+500*scale,map.height-12);ctx.stroke();
    ctx.fillStyle='#ccd8c9';ctx.font='16px system-ui';ctx.fillText('500 m',pad,map.height-20);
  }
  map.onclick=e=>{
    const rect=map.getBoundingClientRect(),x=(e.clientX-rect.left)*map.width/rect.width,z=(e.clientY-rect.top)*map.height/rect.height;
    let best=null,d=18;for(const p of landmarks){const gap=Math.hypot(mx(p.point[0])-x,mz(p.point[2])-z);if(gap<d){d=gap;best=p;}}
    if(best&&!sectorPreparation?.busy){interruptArrival();if(allowDebugCamera)walker.stop();$('itinerary').value='custom';$('destination').value=best.id;trace();if(allowDebugCamera){controls.target.set(best.point[0],best.point[1],best.point[2]);camera.position.set(best.point[0]-120,best.point[1]+160,best.point[2]+160);}}
  };
  const raycaster=new THREE.Raycaster();
  renderer.domElement.addEventListener('dblclick',e=>{
    raycaster.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);
    const hit=raycaster.intersectObject(markers)[0];
    if(hit&&landmarkGroup.visible){$('itinerary').value='custom';$('destination').value=landmarks[hit.instanceId].id;trace();}
  });
  $('summary').textContent=`${(width/1000).toFixed(2)} × ${(depth/1000).toFixed(2)} km study area · ${features.paths.length.toLocaleString('es')} mapped segments · ${landmarks.length} identified landmarks`;
  const fareGates=installKeihanFareGates(assembly.keihanStation);
  const publicWalkDomain=createPublicWalkDomain(assembly);
  const canMove=(from,to)=>(fareGates?.canMove(from,to)??true)&&(assembly.keihanRail?.canMove(from,to)??true);
  let journal=null,sectorPreparation=null,sectorPause=null,checkpointRequest=0,qualityPending=0;
  const walker=installWalking({camera,renderer,controls,ground,assembly,audio,canMove,allowDebugCamera,resolveMove:allowDebugCamera?undefined:publicWalkDomain.resolveMove,onInteraction:(object,event)=>{journal?.recordInteraction(object);if(event?.type==='drink.collected')zen?.collectDrink(event);},onStart:()=>{walking=false;$('stop').disabled=true;}});
  // Visible review destinations use existing exterior paths, never service interiors.
  if(new URLSearchParams(location.search).get('audit')==='1'){
    for(const [id,label,x,z,tx,tz] of [
      ['audit_osugi','Review · Osugi approach',909.15,-185.27,923.59,-183.51],
      ['audit_yakuriki','Review · Yakuriki trail',1146.15,-189.77,1145,-184],
      ['audit_mikoshiko','Review · Mikoshiko exterior',71.15,6,77.8,11.9],
      ['audit_rear_boundary','Review · Rear votive boundary',77.6,1.714,77.6,-.45]
    ]){
      const y=assembly.surfaces.height(x,z),target=[tx,y+1.5,tz];
      const anchor={id,label,target,source:[...target],checkpoint:[x,y,z],lookAt:target};
      assembly.spatial.anchors.push(anchor);assembly.spatial.byId[id]=anchor;
    }
  }
  for(const a of assembly.spatial.anchors){const option=document.createElement('option');option.value=a.id;option.textContent=a.label;$('place').append(option);}
  function visit(){
    if(sectorPreparation?.busy&&allowDebugCamera)return;
    interruptArrival();
    walker.stop();walking=false;controls.enabled=allowDebugCamera;
    const a=assembly.spatial.byId[$('place').value],near=a.checkpoint??nearestNode(graph,a.target,80)?.node.point??a.target;
    if(!allowDebugCamera){if(sectorPreparation){requestCheckpoint({id:a.id,label:a.label,point:near,target:a.lookAt??a.target});return;}walker.teleport(near,a.lookAt??a.target);return;}
    controls.target.set(a.target[0],a.target[1]+3,a.target[2]);
    if(a.id==='romon'){
      camera.position.set(near[0]-35,ground(near[0]-35,near[2]+14)+8,near[2]+14);
    }else if(a.id==='chaya_s'){
      camera.position.set(798,170,-222);controls.target.set(814,168,-204);
    }else if(a.id==='chaya_n'){
      camera.position.set(804,176,-250);controls.target.set(816,174,-243);
    }else if(a.id==='senbon'){
      const eye=assembly.spatial.twins[0].at(.04).point,target=assembly.spatial.twins[0].at(.07).point;
      camera.position.set(eye[0],ground(eye[0],eye[2])+1.7,eye[2]);
      controls.target.set(target[0],ground(target[0],target[2])+1.7,target[2]);
    }else camera.position.set(near[0],(a.checkpoint?near[1]:ground(near[0],near[2]))+2,near[2]);
    if(a.lookAt)controls.target.set(...a.lookAt);
    controls.update();
    $('position').textContent=`${a.label} · ${a.target[1].toFixed(1)} m ASL`;
  }
  $('visit').onclick=()=>{if(allowFastTravel)visit();};$('place').value='romon';visit();
  const hud=installExplorationHUD({camera,features,assembly,getRoute:()=>activeRoute,teleport:id=>{
    if(!allowFastTravel)return;
    const anchor=assembly.spatial.byId[id],node=nearestNode(graph,anchor.target,80)?.node;
    if(!node)return;
    const main=['mitsurugi','gozendani'].includes(id)?assembly.spatial.returning:assembly.spatial.main;
    let closest=0;for(let i=1;i<main.length;i++)if(Math.hypot(main[i][0]-node.point[0],main[i][2]-node.point[2])<Math.hypot(main[closest][0]-node.point[0],main[closest][2]-node.point[2]))closest=i;
    const point=anchor.checkpoint??(id==='azumamaro_entry'?[16.91,assembly.surfaces.height(16.91,15.9),15.9]:id==='mitsurugi'?main[closest]:id==='yotsu'||id==='chaya_s'?[801.414,163.85,-213.322]:id==='chaya_n'?[809.642,171.7,-245.871]:node.point);
    const target=anchor.lookAt??(['kojingamine','west_view'].includes(id)?[anchor.target[0]-1000,60,anchor.target[2]+650]:id==='yotsu'?[-800,60,-300]:['summit','ninomine','chaya_n','chaya_s','temizuya','reception','azumamaro_entry'].includes(id)?anchor.target:main[Math.min(closest+6,main.length-1)]);
    requestCheckpoint({id,label:anchor.label,point,target});
  }});
  const startGuided=$('walk').onclick;$('walk').onclick=()=>{if(!allowFastTravel||sectorPreparation?.busy)return;interruptArrival();walker.stop();startGuided();};
  const toggleWalking=$('freewalk').onclick;$('freewalk').onclick=()=>{
    if(sectorPreparation?.busy)return;
    if(arrival?.active){interruptArrival();walker.start();}else toggleWalking();
  };
  $('panels').onclick=()=>{const hidden=document.body.classList.toggle('panels-hidden');$('panels').textContent=hidden?'Show panels':'Hide panels';};
  const routeLighting=installRouteLighting(scene,assembly.spatial.main,assembly.ground,{extraRoutes:[assembly.spatial.returning,...assembly.spatial.twins.map(path=>Array.from({length:81},(_,i)=>path.at(i/80).point))],extraEmitters:assembly.keihanFrontages.lightPositions??[],existingLights:assembly.legacy.lanternPointLights});
  document.body.dataset.routeLighting=JSON.stringify(routeLighting.stats);
  const sunOffset=new THREE.Vector3();
  $('light').onchange=()=>{
    const mode=$('light').value;
    const preset=LIGHT_PRESETS[mode]??LIGHT_PRESETS.day;
    sun.intensity=preset.sun;sun.color.set(preset.color);sunOffset.fromArray(preset.offset);
    hemi.intensity=preset.fill;hemi.color.set(preset.sky);hemi.groundColor.set(preset.ground);
    sunShadows.invalidate();renderer.toneMappingExposure=preset.exposure;sky.setMode(mode);routeLighting.setMode(mode);viewingDistance.setTimeOfDay(mode);
    assembly.inariStation?.setMode(mode);
    assembly.keihanStation?.setMode(mode);
    for(const water of waterControllers)water.setMode(mode);
  };$('light').onchange();
  const cityHorizon=await panorama.createHorizonPass({renderer,camera});
  const quality=createRenderQuality({renderer,scene,camera,sun,cityHorizon});
  if(renderBuildAudit){
    const compile=quality.compileAsync;
    quality.compileAsync=(...args)=>{
      renderBuildAudit.setPhase('precompile');backendWorkAudit?.setPhase('precompile');
      try{return compile(...args);}finally{renderBuildAudit.setPhase('render');backendWorkAudit?.setPhase('render');}
    };
  }
  const appearance=await installWorldAppearance({scene,renderer,assembly,camera,hemi,sun,quality});
  // Snapshot only known crown instances; the atlas never scans the scene per frame.
  const leafRegion=new THREE.Box3(new THREE.Vector3(romon.target[0]-180,-100,romon.target[2]-260),new THREE.Vector3(romon.target[0]+360,400,romon.target[2]+180));
  const leafMaterials=new Set(),roofObjects=[],crownObjects=[],botanicalCrowns=[];
  const crownGeometry=new Set(assembly.legacy.foliage.slice(1,3).map(mesh=>mesh.geometry));
  scene.traverse(object=>{
    if(object.isInstancedMesh&&!object.userData.shadowOnly){
      if(crownGeometry.has(object.geometry))crownObjects.push(object);
      else if(object.userData.precinctCanopy)botanicalCrowns.push(object);
    }
    for(const material of [object.material].flat()){
      if(material?.userData?.precinctLeafReceiver)leafMaterials.add(material);
      if(object.isMesh&&!object.userData.shadowOnly&&material?.map&&material.map===assembly.legacy.materials.roofMat?.map)roofObjects.push(object);
    }
  });
  const forestCrowns=collectPrecinctLeafBounds([...crownObjects,...botanicalCrowns],{maxInstances:8192,sample:true});
  const shaftCoverage={canopies:forestCrowns.bounds.length,inspected:forestCrowns.inspected,truncated:forestCrowns.truncated,sampleStride:forestCrowns.sampleStride,availableInstances:forestCrowns.availableInstances};
  const forestRoofs=collectPrecinctRoofBounds([...new Set(roofObjects)],{maxInstances:2048,maxHorizontalSpan:30});
  const leafCrowns=collectPrecinctLeafBounds(crownObjects,{region:leafRegion,maxInstances:8192});
  const leafRoofs={...forestRoofs,bounds:forestRoofs.bounds.filter(b=>b.intersectsBox(leafRegion))};
  leafLight=installPrecinctLeafLight({canopies:leafCrowns.bounds,roofs:leafRoofs.bounds,materials:[...leafMaterials]},
    {strength:.28,enabled:quality.mode!=='balanced'&&query.get('leafLight')!=='0',mode:$('light').value});
  document.body.dataset.precinctLeafLight=JSON.stringify({...leafLight.stats,skippedAggregateRoofs:leafRoofs.skippedAggregate,skippedOversizedRoofs:leafRoofs.skippedOversized});
  const shaftRoutes=[...assembly.spatial.twins.map(path=>Array.from({length:81},(_,i)=>path.at(i/80).point)),assembly.spatial.main,assembly.spatial.returning];
  const shaftSites=chooseShaftSites({routes:shaftRoutes,canopies:forestCrowns.bounds,ground:assembly.ground});
  const sunShafts=createLocalSunShafts({scene,sites:shaftSites,roofs:forestRoofs.bounds,audit:query.get('shaftAudit')==='1'});
  sunShafts.setQuality(quality.mode);sunShafts.setMode($('light').value);sunShafts.update(camera);
  const applyTimeOfDay=$('light').onchange;
  $('light').onchange=()=>{appearance.updateBaseLighting(applyTimeOfDay);leafLight.setMode($('light').value);sunShafts.setMode($('light').value);sunShafts.update(camera);document.body.dataset.precinctLeafLight=JSON.stringify(leafLight.stats);};
  const photo=installPhotoMode({renderer,scene,camera,walker,controls,allowDebugCamera,includeImage:true,isCameraOwned:()=>!!zen?.active||!!arrival?.active,getCaptureContext:()=>({mode:zen?.returning.cameraOwned||arrival?.active?'train':walker.mode,fov:camera.fov,weather:zen?.journey.snapshot().weather??'clear',light:$('light').value}),onCaptured:async details=>{journal?.recordPhoto(details);return await zen?.recordPhoto(details)??'';},render:()=>{sunShadows.invalidate();sunShadows.update(performance.now(),camera.position,sunOffset);quality.render();},overlays:()=>[routeLine,marker,landmarkGroup]});
  const candleFlames=installCandleFlameInstances(assembly.legacy.flickeringCandleMeshes,{polish:true});
  document.body.dataset.candleFlames=JSON.stringify(candleFlames.stats);
  let detailDistance='near';
  const detailChunks=createWorldDetailChunks({onStats:stats=>document.body.dataset.detailChunks=JSON.stringify(stats)});
  for(const {object,bounds} of assembly.staticBatches.residencyEntries)detailChunks.add(object,{bounds});
  for(const {object,bounds} of assembly.forestChunks)detailChunks.add(object,{bounds,radius:260,margin:40});
  for(const group of videoMerchandise.detailGroups??[])detailChunks.add(group,{radius:28,margin:8});
  for(const group of stationDetails.detailGroups??[])detailChunks.add(group,{radius:70,margin:15});
  for(const group of observedStreet.detailGroups??[])detailChunks.add(group,{radius:100,margin:20});
  for(const group of streetCommerce.detailGroups??[])detailChunks.add(group,{radius:80,margin:20});
  for(const group of assembly.keihanRail?.detailGroups??[])detailChunks.add(group);
  renderPreparation=createRenderPreparationQueue({onBusy:busy=>{if(busy)walkingPrewarm?.setBlocked(true);}});
  const menu=installExplorationMenu({walker,controls,camera,assembly,allowDebugCamera,allowFastTravel,places:hud.places,onNavigate:interruptArrival,
    sound:{get enabled(){return audio.enabled;},set:value=>audio.setEnabled(value)},cameraOwned:()=>!!zen?.active||!!arrival?.active||(!!sectorPreparation?.busy||qualityPending>0),
    onRenderQuality:async value=>{
      qualityPending++;
      try{await renderPreparation.run(async()=>{
      walkingPrewarm?.setBlocked(true);await walkingPrewarm?.awaitIdle();
      textureStreaming.setMode(value);
      try{await textureStreaming.prepareAt(camera.position);await quality.setMode(value);}
      catch(error){textureStreaming.setMode(quality.mode);throw error;}
      viewingDistance.setQuality(quality.mode);sunShadows.setQuality(quality.mode);
      walkingPrewarm?.invalidate();
      walkingPrewarm?.setRadius(Math.min(prewarmViewRadius(camera)+24,300));
      leafLight.setEnabled(quality.mode!=='balanced'&&query.get('leafLight')!=='0');document.body.dataset.precinctLeafLight=JSON.stringify(leafLight.stats);
      sunShafts.setQuality(quality.mode);sunShafts.update(camera);
      if(quality.mode==='high')await compileAddedGroup(quality,scene,sunShafts.mesh,camera,{batchSize:1,reuseRenderScene:true,includeHiddenRoot:true,getLights:compilationLights.getLights});
      await appearance.prepare();
      await zen?.prepare(compileZen);
      if(assembly.keihanStation?.group)await compileAddedGroup(quality,scene,assembly.keihanStation.group,camera,{batchSize:4,reuseRenderScene:true});
      await prepareWalkingNeighborhood({entries:walkingPreparationBounds,position:camera.position,camera,scene,quality,textureStreaming,service:walkingPrewarm,
        radius:Math.min(300,prewarmViewRadius(camera)+64),yieldWork:yieldPreparation,getLights:compilationLights.getLights,
        onCompiled:objects=>renderBuildAudit?.noteCompiled(objects),report:reportWalkingNeighborhood});
      document.body.dataset.worldAppearance=JSON.stringify(appearance.stats);
      });}finally{
        qualityPending--;
        if(!qualityPending){
          const blocked=!!zen?.active||photo.active||menu.active||journal.active||!!arrival?.active||!!sectorPreparation?.busy||document.body.classList.contains('welcome-open');
          walker.pause(blocked);controls.enabled=allowDebugCamera&&!blocked&&!walker.active&&$('stop').disabled;
        }
      }
    },
    onDetailDistance:value=>{detailDistance=value;}});
  journal=installJourneyJournal({camera,assembly,walker,controls,cameraOwned:()=>!!zen?.active,isBlocked:()=>!!zen?.world.active||!!zen?.returning.active||photo.active||menu.active||!!arrival?.active||(!!sectorPreparation?.busy||qualityPending>0)||document.body.classList.contains('welcome-open')});
  const preparationResidency=new Set([
    ...mappedBuildingEntries.map(entry=>entry.object),...assembly.staticBatches.residencyEntries.map(entry=>entry.object),...assembly.forestChunks.map(entry=>entry.object),
    ...(videoMerchandise.detailGroups??[]),...(stationDetails.detailGroups??[]),...(observedStreet.detailGroups??[]),
    ...(streetCommerce.detailGroups??[]),...(assembly.keihanRail?.detailGroups??[])
  ]);
  const preparationBounds=new Map([...mappedBuildingEntries,...assembly.staticBatches.residencyEntries,...assembly.forestChunks].map(entry=>[entry.object,entry.bounds]));
  // Known late detail owners also need walking admission. This one-time
  // snapshot does not activate them or authorize static render culling.
  for(const object of preparationResidency){
    if(preparationBounds.has(object))continue;
    object.updateWorldMatrix(true,true);
    const bounds=new THREE.Box3().setFromObject(object);
    if(!bounds.isEmpty()&&[...bounds.min,...bounds.max].every(Number.isFinite))preparationBounds.set(object,bounds);
  }
  const yieldPreparation=()=>globalThis.scheduler?.yield?.()??new Promise(resolve=>setTimeout(resolve,0));
  const checkpointStatus=document.createElement('output');checkpointStatus.id='checkpoint-status';checkpointStatus.hidden=true;
  checkpointStatus.setAttribute('role','status');checkpointStatus.setAttribute('aria-live','polite');checkpointStatus.setAttribute('aria-atomic','true');document.body.append(checkpointStatus);
  let checkpointStatusTimer=null;
  function showCheckpointStatus(message,failed=false){
    clearTimeout(checkpointStatusTimer);checkpointStatus.textContent=message;checkpointStatus.hidden=false;checkpointStatus.classList.toggle('is-error',failed);
    if(failed)checkpointStatusTimer=setTimeout(()=>{checkpointStatus.hidden=true;},8000);
  }
  function requestCheckpoint(destination){
    if(!sectorPreparation||photo.active)return;
    const token=++checkpointRequest;showCheckpointStatus(`Preparing ${destination.label}...`);
    sectorPreparation.request(destination).catch(error=>{
      if(token!==checkpointRequest)return;
      $('position').textContent=`Could not prepare ${destination.label}: ${error.message}. Retry this checkpoint.`;
      showCheckpointStatus(`Could not prepare ${destination.label}. Retry this checkpoint. ${error.message}`.slice(0,260),true);
      console.warn('Checkpoint preparation failed',error);
    });
  }
  sectorPreparation=createSectorPreparation({
    run:renderPreparation.run,
    onBusy(value){
      if(value)walkingPrewarm?.setBlocked(true);
      if(value&&!sectorPause){
        sectorPause={controls:controls.enabled,target:controls.target.clone(),position:camera.position.clone(),rotation:camera.quaternion.clone(),photoDisabled:$('photo-open').disabled,committed:false};
        walker.pause(true);controls.enabled=false;$('photo-open').disabled=true;
      }else if(!value&&sectorPause){
        const previous=sectorPause;sectorPause=null;
        const blocked=!!zen?.active||photo.active||menu.active||journal.active||qualityPending>0||!!arrival?.active||document.body.classList.contains('welcome-open');
        walker.pause(blocked);
        if(!previous.committed){controls.enabled=previous.controls&&!blocked;controls.target.copy(previous.target);}else if(blocked)controls.enabled=false;
        $('photo-open').disabled=previous.photoDisabled;
      }
    },
    report(value){
      document.body.dataset.checkpointPreparation=JSON.stringify(value);
      const latest=value.history.at(-1);
      if(value.busy&&latest?.stage){
        const message=`Preparing ${assembly.spatial.byId[latest.id]?.label??latest.id} · ${latest.stage}`;
        $('position').textContent=message;showCheckpointStatus(message);
      }else if(!value.busy&&latest?.status==='ready'){clearTimeout(checkpointStatusTimer);checkpointStatus.hidden=true;}
      else if(!value.busy&&latest?.status==='blocked')showCheckpointStatus('No clear access found. Try another checkpoint.',true);
    },
    async prepareSources(destination,stage){
      const romon=assembly.spatial.byId.romon.target;
      if(Math.hypot(destination.point[0]-romon[0],destination.point[2]-romon[2])<210)await stage('shrine buildings',()=>assembly.deferredBuildings.ensure());
    },
    async prepare(destination,stage,isCurrent){
      await walkingPrewarm?.awaitIdle();
      const position=new THREE.Vector3(destination.point[0],destination.point[1]+1.7,destination.point[2]);
      const targetCamera=camera.clone();targetCamera.position.copy(position);targetCamera.lookAt(destination.target[0],position.y,destination.target[2]);targetCamera.updateMatrixWorld(true);
      if(!isCurrent())return;
      const textures=await stage('nearby textures',()=>textureStreaming.prepareAt(position));
      destination.textureFailures=textures.failed;document.body.dataset.checkpointTextures=JSON.stringify(textures);
      if(!isCurrent())return;
      const visuals=await stage('nearby visual selection',async()=>{
        const result=await collectCheckpointVisuals({scene,position,residencyRoots:preparationResidency,residencyBounds:preparationBounds,radius:Math.min(300,prewarmViewRadius(targetCamera)+24),yieldWork:yieldPreparation});
        const {objects,...stats}=result;document.body.dataset.checkpointVisuals=JSON.stringify({objects:objects.length,...stats});return objects;
      });
      if(!isCurrent())return;
      await stage('nearby shaders',async()=>{
        const report=value=>{document.body.dataset.checkpointCompilation=JSON.stringify(value);};
        await compileSelectedVisuals(quality,scene,visuals,camera,{batchSize:4,yieldWork:yieldPreparation,report,reuseRenderScene:true,getLights:compilationLights.getLights,onCompiled:objects=>{renderBuildAudit?.noteCompiled(objects);if(query.get('pipelineAudit')!=='1'||query.get('prewarmPrepared')!=='0')for(const object of objects)walkingPrewarm?.markPrepared(object);}});
      });
      if(!isCurrent())return;
      if($('buildings').checked&&panoramaVisible(position,false)){
        await stage('mapped city geometry',()=>panorama.prepare());
        if(!isCurrent())return;
        await stage('mapped city shaders',()=>cityHorizon.prepare(targetCamera));
      }
    },
    commit(destination){
      interruptArrival();
      if(!walker.teleport(destination.point,destination.target)){$('position').textContent='No clear access found at this checkpoint.';return false;}
      if(sectorPause)sectorPause.committed=true;
      walking=false;marker.visible=false;$('stop').disabled=true;$('place').value=destination.id;
      $('position').textContent=`${destination.label} · Ready to walk${destination.textureFailures?' · Some textures unavailable':''}`;
      document.body.dataset.checkpoint=destination.id;return true;
    }
  });
  const lookLabel=document.createElement('label');lookLabel.htmlFor='creative-look';lookLabel.textContent='Visual atmosphere';
  const lookSelect=document.createElement('select');lookSelect.id='creative-look';lookSelect.innerHTML='<option value="natural">Natural</option><option value="sakura">Sakura · pink sunset</option><option value="dreamcore">Dreamcore · soft highlights</option>';
  $('scene-settings').append(lookLabel,lookSelect);
  lookSelect.onchange=()=>{appearance.setLook(lookSelect.value);sky.setLook(lookSelect.value);};
  // Stable matrix-buffer capacities share r180 shaders across static cells.
  const instanceCapacity=instanceBufferNames?.enabled?padStaticInstanceMatrices([...assembly.staticBatches.meshes,...assembly.instancePrewarmEntries.map(entry=>entry.object),...assembly.forestChunks.map(entry=>entry.object),...assembly.staticBoundaryRoots],{onEligible:object=>staticShaderOwners.add(object)}):null;
  document.body.dataset.instanceCapacity=JSON.stringify(instanceCapacity);
  const walkingPreparationBounds=new Map([...preparationBounds,...assembly.instancePrewarmEntries.map(({object,bounds})=>[object,bounds])]);
  // Late candle/detail instancing also creates per-object shader variants.
  // Snapshot admission once; these extra owners are never used for static culling.
  assembly.root.updateWorldMatrix(true,true);
  for(const {object,bounds}of collectInstancePrewarmEntries([assembly.root])){
    let covered=false;for(let parent=object;parent;parent=parent.parent)if(walkingPreparationBounds.has(parent)){covered=true;break;}
    if(!covered)walkingPreparationBounds.set(object,bounds);
  }
  const walkingViewDirection=new THREE.Vector3();
  renderBuildAudit?.noteRegistered([...walkingPreparationBounds].map(([object,bounds])=>({object,bounds})));
  const walkingCompileHistory=renderBuildAudit?[]:null;
  const reportWalkingNeighborhood=stats=>{document.body.dataset.walkingNeighborhood=JSON.stringify(stats);};
  const walkingPreparationYield=createWalkingPreparationYield(),framePacedWalkingPreparation=query.get('prewarmFrameYield')!=='0';
  walkingPrewarm=createWalkingPrewarm({refillIntervalMs:100,radius:Math.min(prewarmViewRadius(camera)+24,300),entries:[...walkingPreparationBounds].map(([object,bounds])=>({object,bounds})),
    compile:async(object,{isCurrent})=>{
      if(!isCurrent())return false;
      const yieldIdle=async()=>{
        if(!isCurrent())throw new Error('Walking preparation paused');
        // Yield through a completed render opportunity; async shader batches
        // otherwise have no quota on continuations between visible frames.
        await (framePacedWalkingPreparation?walkingPreparationYield.yield():yieldPreparation());
        if(!isCurrent())throw new Error('Walking preparation paused');
      };
      // Both near and far variants must be ready before the LOD switches.
      // Explicit roots let scoped compilation borrow dormant levels safely.
      const visuals=object.isLOD?object.levels.map(level=>level.object):[object];
      const started=renderBuildAudit?performance.now():0;let compilation;
      await compileSelectedVisuals(quality,scene,visuals,camera,{batchSize:1,yieldWork:yieldIdle,reuseRenderScene:true,getLights:compilationLights.getLights,onCompiled:renderBuildAudit?objects=>renderBuildAudit.noteCompiled(objects):undefined,report:renderBuildAudit?stats=>{compilation=stats;}:undefined});
      if(walkingCompileHistory){walkingCompileHistory.push({name:object.name||object.parent?.name||object.type,startTimeMs:started,elapsedMs:performance.now()-started,...compilation});if(walkingCompileHistory.length>40)walkingCompileHistory.shift();document.body.dataset.walkingCompilation=JSON.stringify(walkingCompileHistory);}
      return isCurrent();
    },onError:error=>{document.body.dataset.walkingPrewarmError=String(error);}});
  const pauseWalkingPreparation=()=>{if(document.hidden){walkingPrewarm.setBlocked(true);walkingPreparationYield.cancel();}};
  document.addEventListener('visibilitychange',pauseWalkingPreparation);pauseWalkingPreparation();
  let renderingPrewarmFrame=false;
  const prewarmRenderObserver=observePrewarmRenders([...walkingPreparationBounds].map(([object,bounds])=>({object,bounds})),
    {camera,service:walkingPrewarm,isRendering:()=>renderingPrewarmFrame});
  addEventListener('pagehide',event=>{if(!event.persisted)prewarmRenderObserver.dispose();});
  function renderWalkingFrame(){renderingPrewarmFrame=true;try{quality.render();}finally{renderingPrewarmFrame=false;}}
  // Reject only proven static bounds outside a sphere enclosing the full view.
  // Keep a diagnostic opt-out for visual and frame-time comparisons.
  if(query.get('prewarmCull')!=='0'){
    const staticCullEntries=[...mappedBuildingEntries,...assembly.staticBatches.meshes.filter(object=>object.children.length===0).map(object=>({object})),...assembly.instancePrewarmEntries,...assembly.forestChunks,...assembly.staticBoundaryRoots.map(object=>({object}))];
    const colorCull=installStaticColorCull(renderer,camera,staticCullEntries);
    const render=quality.render;
    quality.render=()=>{colorCull.update();render();if(allowFastTravel)document.body.dataset.prewarmColorCull=JSON.stringify(colorCull.stats);};
    addEventListener('pagehide',event=>{if(!event.persisted)colorCull.dispose();});
  }

  document.getElementById('ambient-volume').addEventListener('input',event=>audio.setRecordedVolume(Number(event.target.value)/100));
  document.getElementById('sound-settings').insertAdjacentHTML('beforeend',`<details class="sound-credits"><summary>Recorded sound credits</summary><p>Real recordings, adapted to this scene. Railway sounds are not exact Keihan recordings; Arrival voices were supplied for this experience: Japanese, then English.</p><ul><li><a href="https://freesound.org/people/MrAuralization/sounds/162068/" target="_blank" rel="noopener">Crossing near Fushimi Inari — MrAuralization</a> · CC BY 4.0</li><li><a href="https://freesound.org/people/Hinoki.owo/sounds/796687/" target="_blank" rel="noopener">Suica gate in Tokyo — Hinoki.owo</a> · CC BY 4.0</li><li><a href="https://lpc.opengameart.org/content/fantozzis-footsteps-grasssand-stone" target="_blank" rel="noopener">Stone / sand footsteps — Fantozzi, edited by qubodup</a> · CC0</li><li>Odakyu rail joints — Cassiopeia sweet · public domain</li><li>JR Nambu door alarm — Hitachi-Train · public domain</li></ul><p><a href="../assets/audio/recorded-rail/manifest.json" target="_blank" rel="noopener">Rail recording sources</a> · <a href="../assets/audio/recorded-station/CREDITS.md" target="_blank" rel="noopener">Station recording sources</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Recordings are volume-adjusted, looped or stopped to follow scene events.</p></details>`);
  const flashlight=installFlashlight(scene,camera);
  const visitors=installVisitors(assembly);
  const compileZen=roots=>compileSelectedVisuals(quality,scene,roots,camera,{batchSize:2,reuseRenderScene:true,includeHiddenRoots:true,getLights:compilationLights.getLights});
  const zenViews=document.createElement('option');zenViews.value='zen_views';zenViews.textContent='Station → Kyoto views';$('itinerary').append(zenViews);
  function applyZenIntention(id){
    if(id==='wander'){clearRoute();$('route-info').textContent='Follow your curiosity. A route is optional.';drawMap();return;}
    $('itinerary').value=id==='views'?'zen_views':'keihan_loop';trace();
  }
  zen=installZenExperience({scene,camera,walker,controls,assembly,shop:summitShop,visitors,streetCommerce,audio,audit:query.has('audit')||query.get('gpuAudit')==='1',
    getTimeOfDay:()=>$('light').value,getQuality:()=>quality.mode,
    getBlocked:()=>photo.active||menu.active||journal.active||!!arrival?.active||renderPreparation.busy||sectorPreparation.busy||qualityPending>0||document.body.classList.contains('welcome-open'),
    openJournal:()=>journal.open(),onTimeOfDay:mode=>{$('light').value=mode;$('light').onchange();},
    onPhoto:prompt=>{zen.selectPhotoPrompt(prompt);photo.open();},
    onIntention:applyZenIntention});
  if(query.get('audit')==='1'){
    for(const [i,owner] of zen.world.interactionRoots.entries()){
      const target=owner.getWorldPosition(new THREE.Vector3()),id=`audit_zen_${i}`;
      const seatProp=['cat','map','postcard'].includes(owner.userData.zenMoment);
      const teaApproach=owner.userData.zenMoment==='tea'?summitShop.stats.front.outward:null;
      const x=target.x+(teaApproach?teaApproach[0]*2:seatProp?0:-1.5),z=target.z+(teaApproach?teaApproach[1]*2:seatProp?-1.5:1.0),y=assembly.walkHeight(x,z);
      const anchor={id,label:`Review · ${owner.userData.interactable?.title??owner.name}`,target:[target.x,target.y+.8,target.z],checkpoint:[x,y,z],lookAt:[target.x,target.y+.8,target.z]};
      assembly.spatial.byId[id]=anchor;const option=document.createElement('option');option.value=id;option.textContent=anchor.label;$('place').append(option);$('checkpoint-select').append(option.cloneNode(true));
    }
  }
  loadingStage('Preparing small encounters and weather…');
  await zen.prepare(compileZen);
  if(renderBuildAudit)visitors.ready.then(()=>document.body.dataset.visitorsReadyAt=String(performance.now()),()=>document.body.dataset.visitorsReadyAt='failed');
  const wildlife=createForestWildlife(assembly);
  document.body.dataset.forestWildlife=JSON.stringify({count:wildlife.count});
  const streetLife=installKeihanStreetLife(assembly,{onStats:stats=>document.body.dataset.streetLife=JSON.stringify(stats)});
  installSeasons(assembly,canopy);
  const pondReflections=installShinikeReflections({scene,renderer,
    water:assembly.root.getObjectByName('Shin-ike flat olive-gray water R97'),
    forestChunks:assembly.forestChunks,overlays:()=>[routeLine,marker,landmarkGroup]});
  addEventListener('pagehide',event=>{if(!event.persisted){zen.dispose();visitors.dispose();streetLife.dispose();streetCommerce.dispose?.();journal.dispose();walkingPrewarm?.dispose();walkingPreparationYield.dispose();document.removeEventListener('visibilitychange',pauseWalkingPreparation);leafLight?.dispose();sunShafts.dispose();rendererHealth?.dispose();appearance.dispose();pondReflections.dispose();sunShadows.dispose();quality.dispose();textureBindings.dispose();}});
  document.body.dataset.inventory=JSON.stringify(assembly.inventory);
  loadingStage('Preparing materials for the arrival…');
  await textureStreaming.prepare(scene,new THREE.Vector3().fromArray(assembly.keihanStation?.spec.arrival.interiorPose.position??[-355,32,-100]));
  const prepareNearby=()=>{
    detailChunks.update(camera,performance.now()/1000,quality.detailScale,true);
    sunShadows.invalidate();sunShadows.update(performance.now(),camera.position,sunOffset);sky.update();
    canopy.update(camera);panorama.update(camera,$('buildings').checked);
  };
  loadingStage('Preparing train and platform…');
  const arrivalPrepared=await prepareTrainArrival({station:assembly.keihanStation??assembly.inariStation,camera,
    prepareView:prepareNearby,prepareAppearance:()=>appearance.prepare(),
    compile:()=>{appearance.update(0);return quality.compileAsync(scene,camera);},
    render:()=>quality.render(),settle:()=>renderer.waitForGPU()});
  if(!arrivalPrepared){await assembly.deferredBuildings.ensure();prepareNearby();await quality.compileAsync(scene,camera);}
  loadingStage('Preparing nearby walking details…');
  // Include the service's 40 m look-ahead around the starting platform, so an
  // immediate walk or turn does not begin by exhausting cold nearby owners.
  const initialWalkingPosition=arrivalPrepared?new THREE.Vector3().fromArray((assembly.keihanStation??assembly.inariStation).spec.arrival.platformPose.position):camera.position;
  await prepareWalkingNeighborhood({entries:walkingPreparationBounds,position:initialWalkingPosition,camera,scene,quality,textureStreaming,service:walkingPrewarm,
    radius:Math.min(300,prewarmViewRadius(camera)+64),yieldWork:yieldPreparation,getLights:compilationLights.getLights,
    onCompiled:objects=>renderBuildAudit?.noteCompiled(objects),report:reportWalkingNeighborhood});
  if(arrivalPrepared){
    const preview=(assembly.keihanStation??assembly.inariStation).spec.arrival.interiorPose;
    camera.position.set(...preview.position);camera.lookAt(...preview.target);prepareNearby();
  }
  document.body.dataset.arrivalRenderPrepared=String(arrivalPrepared);
  document.body.dataset.loadReadyMs=String(Math.round(performance.now()));
  applyZenIntention(zen.journey.snapshot().intention);
  function startAtOmotesando(){
    if(!assembly.omotesandoArrival?.built)return false;
    const {position:[x,z],lookAt:[tx,tz]}=assembly.omotesandoArrival.spawn;
    const y=assembly.walkHeight(x,z);
    return walker.teleport([x,y,z],[tx,y+1.7,tz]);
  }
  // Route initialization enables orbit controls; give arrival sole ownership last.
  const arrivalStation=assembly.keihanStation??assembly.inariStation;
  if(arrivalStation?.built){
    const isKeihan=arrivalStation===assembly.keihanStation;
    arrival=createTrainArrivalExperience({sequenceOptions:arrivalStation.spec.arrival,
      station:arrivalStation,camera,controls,walker,allowDebugCamera,
      onBegin:()=>{zen?.cancelActivity();walking=false;marker.visible=false;$('stop').disabled=true;$('interaction').hidden=true;},
      onFallback:startAtOmotesando,onState:state=>arrivalUI?.update(state)});
    arrivalUI=installTrainArrivalUI({experience:arrival,focusTarget:renderer.domElement,isBlocked:()=>!!zen?.active||photo.active||menu.active||journal.active||(sectorPreparation.busy||qualityPending>0),
      labels:isKeihan?{stationName:'Fushimi-Inari',line:'Keihan Main Line · Platform 2',journey:'Gion-shijo → Fushimi-Inari · Southbound',reference:'Keihan station plan and mapped platform; train and dimensions interpreted from references.',exitHint:'Turn right along the platform to the exit · WASD to walk · click the scene, then move the mouse to look · Esc releases the cursor'}:{}});
    // The train waits behind the welcome sheet so its sound and motion start together.
    startTrainArrivalAfterWelcome({welcome,experience:arrival,reducedMotion:()=>arrivalUI.reducedMotion,onGesture:()=>{audio.setEnabled(true);menu.syncSound();}});
    document.body.dataset.startLocation=isKeihan?'Keihan Fushimi-Inari train arrival · Platform 2':'JR Inari fallback · Platform 2';
  }else{
    document.body.dataset.startLocation=startAtOmotesando()?'Omotesando fallback: station unavailable':'Romon fallback: crossing unavailable';
    welcome.ready().then(({gesture})=>{if(gesture){audio.setEnabled(true);menu.syncSound();}});
  }


  // The optional capture panel records this renderer; ordinary visitors never load it.
  if(query.get('showcase')==='1'){
    const {installShowcaseCapture}=await import('./showcase-capture.mjs?v=edit-2');
    let captureSize=null;
    showcase=installShowcaseCapture({canvas:renderer.domElement,camera,controls,station:arrivalStation,assembly,
      overlays:[routeLine,marker,landmarkGroup],
      onBegin(){
        zen?.cancelActivity();arrival?.cancel();walking=false;walker.pause(true);walkingPrewarm.setBlocked(true);
        captureSize={size:renderer.getSize(new THREE.Vector2()),ratio:renderer.getPixelRatio(),aspect:camera.aspect,fov:camera.fov};
        renderer.setDrawingBufferSize(1920,1080,1);camera.aspect=16/9;camera.fov=58;camera.updateProjectionMatrix();
      },
      onEnd(){
        if(captureSize){renderer.setDrawingBufferSize(captureSize.size.x,captureSize.size.y,captureSize.ratio);camera.aspect=captureSize.aspect;camera.fov=captureSize.fov;camera.updateProjectionMatrix();captureSize=null;}
        walker.pause(false);walkingPrewarm.setBlocked(false);
      },
      onState:state=>document.body.dataset.showcaseCapture=JSON.stringify({...state,result:undefined}),
      async prepare(views){
        await assembly.deferredBuildings.ensure();
        await walkingPrewarm.awaitIdle();
        await renderPreparation.run(async()=>{
          for(const frame of views){
            arrivalStation.setTrainOffset(frame.trainOffset);arrivalStation.setDoorOpen(frame.doorProgress);
            camera.position.set(...frame.pose.position);camera.lookAt(...frame.pose.target);
            await textureStreaming.prepareAt(camera.position);prepareNearby();
            await quality.compileAsync(scene,camera);quality.render();await renderer.waitForGPU();
          }
        });
      }
    });
    addEventListener('pagehide',()=>showcase.dispose(),{once:true});
  }

  if(query.get('shadowAudit')==='1'){
    const {installShadowRouteAudit}=await import('./shadow-route-audit.mjs');
    shadowRouteAudit=installShadowRouteAudit({camera,assembly,settleDurationMs:liveFlowAudit?0:2000,
      onBegin(){zen?.cancelActivity();renderBuildAudit?.reset();arrival?.cancel();walking=false;walker.pause(true);controls.enabled=false;walkingPrewarm.setBlocked(!liveFlowAudit);},
      onEnd(){walker.pause(true);walkingPrewarm.setBlocked(!liveFlowAudit);document.body.dataset.walkingPrewarmAtEnd=JSON.stringify(walkingPrewarm.stats);if(renderBuildAudit)document.body.dataset.renderBuildAuditAtEnd=JSON.stringify(renderBuildAudit.stats);},
      getStats:()=>({calls:renderer.info.render.drawCalls??renderer.info.render.calls,triangles:renderer.info.render.triangles,shadowUpdates:sunShadows.stats.updates}),
      async prepare(views){
        if(liveFlowAudit&&query.get('shadowWarmup')!=='1')return;
        await walkingPrewarm.awaitIdle();
        await renderPreparation.run(async()=>{
          for(const frame of views){
            camera.position.set(...frame.pose.position);camera.lookAt(...frame.pose.target);
            await textureStreaming.prepareAt(camera.position);prepareNearby();
            await quality.compileAsync(scene,camera);quality.render();await renderer.waitForGPU();
          }
        });
        if(renderBuildAudit)document.body.dataset.renderBuildAuditPrepared=JSON.stringify(renderBuildAudit.stats);
      }
    });
    const panel=$('shadow-route-audit');
    Object.assign(panel.style,{position:'fixed',left:'10px',bottom:'45px',zIndex:10000,maxWidth:'600px',maxHeight:'110px',overflow:'auto',background:'#fffffff0',color:'#222',padding:'8px',fontSize:'11px'});
    ({captureShadowCasters:shadowCasterCapture}=await import('./shadow-caster-audit.mjs'));
    const casters=document.createElement('button');casters.textContent='Inspect shadow casters';casters.onclick=()=>{if(!shadowRouteAudit.active)shadowCasterPending=true;};panel.append(casters);
    addEventListener('pagehide',()=>shadowRouteAudit.dispose(),{once:true});
  }
  renderer.info.autoReset=false;
  const recordRender=renderStats(renderer);
  let movementFrameAudit=null;
  if(query.get('frameAudit')==='1'){
    const {installMovementFrameAudit}=await import('./movement-frame-audit.mjs');
    movementFrameAudit=installMovementFrameAudit({camera,durationMs:Number(query.get('frameAuditSeconds')||16)*1000,onStart:()=>{renderBuildAudit?.reset();frameStallAudit?.reset();backendWorkAudit?.reset();frameSchedulingAudit?.reset();if(walkingCompileHistory)walkingCompileHistory.length=0;},getContext:()=>({backend:document.body.dataset.rendererBackend,quality:quality.mode,look:quality.look,mode:walker.mode,prewarm:walkingPrewarm.stats,neighborhood:JSON.parse(document.body.dataset.walkingNeighborhood??'null'),staticCull:query.get('prewarmCull')!=='0',textures:textureStreaming.stats,gpuMemory:renderer.info.memory,assets:{visitorModels:visitors.people.filter(p=>p.bones).length,visitorsReadyAt:document.body.dataset.visitorsReadyAt,streetLife:{...streetLife.stats}},resources:renderBuildAudit?performance.getEntriesByType('resource').filter(r=>/\.glb(?:\.gz)?(?:[?#]|$)/.test(r.name)).map(r=>({url:r.name.split(/[?#]/)[0],startTime:r.startTime,responseEnd:r.responseEnd,duration:r.duration})):undefined,...(renderBuildAudit?{builds:renderBuildAudit.stats,stalls:frameStallAudit.stats,scheduling:frameSchedulingAudit.stats,backendWork:backendWorkAudit.stats,walkingCompiles:walkingCompileHistory}:{})})});
    addEventListener('pagehide',event=>{if(!event.persisted)movementFrameAudit.dispose();});
  }
  let horizonAuditAt=0;
  document.addEventListener('visibilitychange',recordRender.reset);
  lastTime=performance.now();
  let mapTimer=0,aheadPrefetchAt=0,aheadCheckpoint=null;const aheadPrefetchPosition=camera.position.clone();
  const prewarmFrameBudget=query.get('prewarmHeadroom')==='1'?createPrewarmFrameBudget():null;
  function animate(time){
    frameSchedulingAudit?.noteFrame(time);
    if(rendererHealth.failed){walkingPrewarm?.setBlocked(true);return;}
    requestAnimationFrame(animate);const dt=Math.min(.1,(time-lastTime)/1000);lastTime=time;if(document.hidden)return;
    const updateStart=movementFrameAudit?.active?performance.now():0;
    const captureOwnsCamera=(shadowRouteAudit?.update(time)??false)||(showcase?.update(time)??false);
    // r180 publishes async pipelines before the backend has finished creating
    // them. Preserve the last frame while preparation owns this renderer; main
    // and pond renders pause for explicit quality/teleport transactions only.
    // Background warming uses the selective draw guard to keep walking fluid.
    if(renderPreparation.busy)return;
    if(showcase?.preparing)return;
    if(!captureOwnsCamera&&(sectorPreparation.busy||qualityPending>0)&&sectorPause){camera.position.copy(sectorPause.position);camera.quaternion.copy(sectorPause.rotation);controls.enabled=false;}
    zen.update(dt,time,{blocked:captureOwnsCamera||!!arrival?.active||photo.active||menu.active||journal.active||sectorPreparation.busy||qualityPending>0||document.body.classList.contains('welcome-open')});
    if(captureOwnsCamera){
      // Capture is the sole camera owner, including during route preparation.
    }else if(arrival?.active){
      const holdDoors=arrival.snapshot.phase==='stopped'&&arrival.snapshot.phaseProgress>.94&&audio.arrivalSpeechActive();
      arrival.update(holdDoors?0:dt,{paused:photo.active||menu.active||journal.active||(sectorPreparation.busy||qualityPending>0)});
    }else if(zen.active){
      // A seated pause, conversation or return train owns its controls.
    }else if(walking&&activeRoute.length>1&&!menu.active&&!photo.active&&!journal.active&&!(sectorPreparation.busy||qualityPending>0)){
      const motion=advanceGuidedRoute(activeRoute,routeProgress,travelled,dt*Number($('speed').value),canMove);
      routeProgress=motion.index;travelled=motion.travelled;
      const arrived=motion.arrived;
      if(arrived){walking=false;$('stop').disabled=true;$('walk').textContent='Restart route';}
      const a=activeRoute[Math.min(routeProgress,activeRoute.length-2)],b=activeRoute[Math.min(routeProgress+1,activeRoute.length-1)];
      const [x,,z]=motion.position,y=assembly.walkHeight(x,z,camera.position.y-1.7);
      camera.position.set(x,y+1.7,z);
      const look=routeProgress>=activeRoute.length-1
        ? [b[0]+b[0]-a[0],b[1],b[2]+b[2]-a[2]]
        : activeRoute[Math.min(routeProgress+5,activeRoute.length-1)];
      camera.lookAt(look[0],look[1]+1.7,look[2]);marker.position.set(x,y+5,z);
      if(arrived){controls.target.set(look[0],look[1]+1.7,look[2]);controls.enabled=allowDebugCamera;if(!allowDebugCamera)walker.start();}
      $('position').textContent=motion.blocked?'Train crossing · Please wait':arrived?`Arrived · ${y.toFixed(1)} m ASL`:`${y.toFixed(1)} m ASL · ${$('speed').value} m/s · eye height 1.70 m`;
      if(time-mapTimer>250){drawMap();mapTimer=time;}
    }else if(!photo.active&&!menu.active&&!journal.active&&!(sectorPreparation.busy||qualityPending>0)&&!walker.update(dt)&&allowDebugCamera){
      controls.update();
      const guard=protectOrbit(camera,controls,assembly.surfaces.terrainHeight);
      document.body.dataset.orbitClearance=JSON.stringify(guard);
    }
    zen.afterCamera(dt,time,{blocked:captureOwnsCamera||!!arrival?.active||photo.active||menu.active||journal.active||sectorPreparation.busy||qualityPending>0||document.body.classList.contains('welcome-open')});
    sunShadows.update(time,camera.position,sunOffset);
    viewingDistance.update(camera.position,dt);
    routeLighting.update(camera,dt);
    candleFlames.update(time);

    for(const water of waterControllers)water.update(time/1000);
    fareGates?.update(camera.position.toArray(),time/1000,document.hidden||zen.active||menu.active||photo.active||journal.active);
    if(fareGates)document.body.dataset.fareGates=JSON.stringify(fareGates.state);
    sunShafts.update(camera);sky.update();flashlight.update();visitors.update(camera,time/1000);wildlife.update(camera,time/1000);streetLife.update(camera,time/1000);streetCommerce.update?.(camera,time/1000);assembly.keihanRail?.update(camera,time/1000);canopy.update(camera);assembly.precinctLife.update(camera);panorama.update(camera,$('buildings').checked);
    cloudShade.update(time/1000,$('light').value);
    if(!showcase?.active&&!arrival?.active&&!renderPreparation.busy&&!(sectorPreparation.busy||qualityPending>0)&&!document.body.classList.contains('welcome-open'))assembly.deferredBuildings.update(camera.position);
    if(!arrival?.active&&!document.body.classList.contains('welcome-open'))textureStreaming.update(camera.position,dt);
    camera.getWorldDirection(walkingViewDirection);
    walkingPrewarm.update(camera.position,time,{direction:walkingViewDirection,blocked:document.hidden||zen.active||(!!shadowRouteAudit&&!liveFlowAudit)||!!showcase?.active||!!arrival?.active||menu.active||photo.active||journal.active||renderPreparation.busy||(sectorPreparation.busy||qualityPending>0)||document.body.classList.contains('welcome-open')});
    if(aheadCheckpoint!==document.body.dataset.checkpoint){aheadCheckpoint=document.body.dataset.checkpoint;aheadPrefetchPosition.copy(camera.position);aheadPrefetchAt=time;}
    if(!zen.active&&!arrival?.active&&!(sectorPreparation.busy||qualityPending>0)&&!photo.active&&!menu.active&&!journal.active&&time-aheadPrefetchAt>1500&&camera.position.distanceToSquared(aheadPrefetchPosition)>=36){
      const ahead=camera.position.clone().sub(aheadPrefetchPosition);ahead.y=0;
      if(ahead.lengthSq()>0)textureStreaming.prefetch(ahead.normalize().multiplyScalar(40).add(camera.position));
      aheadPrefetchPosition.copy(camera.position);aheadPrefetchAt=time;
    }
    const elevated=camera.position.y-assembly.ground(camera.position.x,camera.position.z)>22;
    detailChunks.update(camera,time/1000,allowDebugCamera&&detailDistance==='full'?60:allowDebugCamera&&elevated?6:quality.detailScale);
    // Detailed replacement IDs were excluded while building the fallback meshes.
    // Keep the remaining mapped buildings visible near the walker too.
    // Capture only settled images; a probe made from placeholders must refresh.
    const textureState=textureStreaming.stats;
    if(!arrival?.active&&!quality.compiling&&textureState.pending===0)pondReflections.update(camera.position,[$('light').value,appearance.stats.look,document.body.dataset.season,$('buildings').checked,$('aerial-canopy').checked,textureState.revision].join(':'));
    document.body.dataset.shinikeReflection=JSON.stringify(pondReflections.stats);
    if(assembly.keihanRail)document.body.dataset.jrCrossing=JSON.stringify(assembly.keihanRail.group.userData.crossingState);
    appearance.update(time/1000);
    if(prewarmFrameBudget){
      const warmState=walkingPrewarm.stats;
      if(!prewarmFrameBudget.shouldRender(time,camera,!warmState.blocked&&(warmState.active||warmState.scheduled||warmState.queued>0)))return;
    }
    const submitStart=performance.now();renderer.info.reset();
    if(shadowCasterPending&&!shadowRouteAudit.active){
      shadowCasterPending=false;sunShadows.invalidate();sunShadows.update(time,camera.position,sunOffset);
      document.body.dataset.shadowCasterAudit=JSON.stringify(shadowCasterCapture({scene,shadowCamera:sun.shadow.camera,render:renderWalkingFrame,label:object=>{
        const index=assembly.legacy.foliage.findIndex(source=>source.geometry===object.geometry);
        return index>=0?['forest trunks','sugi crowns','maple crowns','understory','bamboo culms','bamboo leaves'][index]:object.name||object.parent?.name||`geometry ${object.geometry.id}`;
      }}));
    }else renderWalkingFrame();
    showcase?.afterRender();const submitMs=performance.now()-submitStart;shadowRouteAudit?.afterRender(time,submitMs);recordRender(time,submitMs);
    if(time-horizonAuditAt>1000){horizonAuditAt=time;document.body.dataset.cityHorizon=JSON.stringify(cityHorizon.stats);document.body.dataset.worldAppearance=JSON.stringify(appearance.stats);document.body.dataset.walkingPrewarm=JSON.stringify(walkingPrewarm.stats);document.body.dataset.sunShafts=JSON.stringify({...sunShafts.stats,coverage:shaftCoverage});if(query.get('gpuAudit')==='1')document.body.dataset.pipelineReadiness=JSON.stringify(quality.pipelineStats);if(renderBuildAudit){document.body.dataset.renderBuildAudit=JSON.stringify(renderBuildAudit.stats);document.body.dataset.frameStalls=JSON.stringify(frameStallAudit.stats);document.body.dataset.frameScheduling=JSON.stringify(frameSchedulingAudit.stats);document.body.dataset.backendWork=JSON.stringify(backendWorkAudit.stats);}}
    document.body.dataset.textureBindingRepairs=textureBindings.stats.repaired;
    if(allowFastTravel)document.body.dataset.sunShadowSchedule=JSON.stringify(sunShadows.stats);
    document.body.dataset.drawCalls=renderer.info.render.drawCalls??renderer.info.render.calls;
    document.body.dataset.camera=[camera.position.x,camera.position.y,camera.position.z].map(v=>v.toFixed(2)).join(',');
    menu.update(time);journal.update(time);hud.update(time);audio.update(camera,$('light').value==='night',{gate:assembly.keihanStation?.spec.gate,gateState:fareGates?.state,arrival:arrival?.snapshot,rail:assembly.keihanRail,time:time/1000,paused:document.hidden||zen.active||menu.active||photo.active||journal.active||(sectorPreparation.busy||qualityPending>0)});
    if(movementFrameAudit?.active)movementFrameAudit.afterRender(time,submitMs,Math.max(0,performance.now()-updateStart-submitMs));

  }
  requestAnimationFrame(animate);
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();walkingPrewarm.setRadius(Math.min(prewarmViewRadius(camera)+24,300));quality.resize();});
}catch(error){
  console.error(error);$('loading').textContent=`Could not load geographic data: ${error.message}. Open this page from the local server.`;
}
