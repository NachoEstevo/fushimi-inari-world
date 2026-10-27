import {refineGehaidenContextR96} from './gehaiden-context-r96.mjs?v=96-release';
import {refineNaihaidenContextR96} from './naihaiden-context-r96.mjs?v=96-release';
import {refineRomonPrecinctR96} from './romon-precinct-r96.mjs?v=96-release';
import {refineHondenServiceEnvelopeR96} from './sanctuary-context-r96.mjs?v=96-release';
import {refineRomonGehaidenR95Stages} from './romon-gehaiden-r95.mjs?v=95-release';
import {refineHondenOpenEnclosure,refineNaihaidenArchitecture,refineNaihaidenPrayerFront} from './sanctuary-context-r95.mjs?v=95-release';
import {refineHondenRearVeranda} from './sanctuary-context-r94.mjs?v=94';
import {refineRomonShrubs} from './entrance-refinements.mjs?v=86';
import {refineRomonGold,refineRomonGables} from './precinct-details.mjs';
import {refineRomonWingStages} from './romon-wings.mjs?v=71';
import {refineGehaidenStages} from './gehaiden-refinements.mjs?v=48';
import {clearWestStairPodium} from './entrance-stair-clearance.mjs';
import {refineRomonCurtain} from './romon-curtain.mjs';
import {refineNaihaidenStages} from './naihaiden-refinements.mjs';

// Shared by deferred visual loading and the authored floor-support bake.
function* refinementStages(scene,id,materials,{diagnostics={},gehaidenLanternCleanupR96}={}){
    if(id==='honden'){diagnostics.hondenRearVeranda=JSON.stringify(refineHondenRearVeranda(scene,materials));yield 'rear-veranda';}
    if(id==='naihaiden'){diagnostics.naihaidenDetail=JSON.stringify(yield* refineNaihaidenStages(scene,materials));yield 'naihaiden-detail';}
    if(id==='gehaiden'){
      yield* refineGehaidenStages(scene,materials);
      diagnostics.gehaidenRails=String(scene.userData.gehaidenBalustradeRemovalCount??0);yield 'gehaiden-detail';
    }
    if(id==='honden'){diagnostics.hondenEnclosureR95=JSON.stringify(refineHondenOpenEnclosure(scene,materials));yield 'honden-enclosure';diagnostics.hondenEnvelopeR96=JSON.stringify(refineHondenServiceEnvelopeR96(scene,materials));yield 'honden-envelope';}
    if(id==='naihaiden'){diagnostics.naihaidenArchitectureR95=JSON.stringify(refineNaihaidenArchitecture(scene,materials));yield 'naihaiden-architecture';}
    if(id==='naihaiden'){diagnostics.naihaidenFrontR95=JSON.stringify(refineNaihaidenPrayerFront(scene,materials));yield 'naihaiden-front';}
    if(id==='romon'||id==='gehaiden'){diagnostics[id+'ArchitectureR95']=JSON.stringify(yield* refineRomonGehaidenR95Stages(scene,id,materials));yield 'architecture-r95';}
    if(id==='gehaiden'&&gehaidenLanternCleanupR96){
      const {removedElements,...report}=gehaidenLanternCleanupR96.commit(scene.userData.romonGehaidenR95);
      diagnostics.gehaidenLanternCleanupR96=JSON.stringify(report);yield 'lantern-cleanup';
    }
    if(id==='gehaiden'){diagnostics.gehaidenContextR96=JSON.stringify(refineGehaidenContextR96(scene,materials));yield 'gehaiden-context';}
    if(id==='naihaiden'){diagnostics.naihaidenContextR96=JSON.stringify(refineNaihaidenContextR96(scene,materials));yield 'naihaiden-context';}
    if(id==='romon'){
      // Export manifest: these two materials contain only T00 approach slabs.
      // Terrain + mapped path surfaces now own the outdoor floor; a rigid slab
      // cannot follow their grade and leaves exposed vertical/triangular edges.
      const obsolete=[];
      scene.traverse(o=>{if(o.isMesh&&/Courtyard_Gravel_Dark|Flagstone_Walkway/.test(o.material.name))obsolete.push(o);});
      obsolete.forEach(o=>{o.removeFromParent();o.geometry.dispose();});yield 'obsolete-floor-removal';
    }
    if(id==='romon'){refineRomonCurtain(scene);yield 'romon-curtain';refineRomonGold(scene,materials.goldMat);yield 'romon-gold';refineRomonGables(scene,materials.goldMat);yield 'romon-gables';}
    const meshes=[];scene.traverse(object=>{if(object.isMesh)meshes.push(object);});
    for(const object of meshes){
      if(object.material===materials.goldMat)continue;
      if(id==='romon'&&object.material.name.includes('Foliage_Canopy')){refineRomonShrubs(object);yield 'romon-shrubs';continue;}
      if(id==='romon'&&object.material.name.includes('Granite_Stone_Moss'))clearWestStairPodium(object);
      object.castShadow=true;object.receiveShadow=true;
      const tags={Vermilion_ShuIro:'vermilionMat',Black_Lacquer_Nemaki:'blackNemakiMat',
        Granite_Stone_Moss:'stoneMat',Flagstone_Walkway:'flagstoneMat',Courtyard_Gravel_Dark:'gravelMat',
        White_Shikku_Plaster:'plasterMat',Gold_Kanagu_Leaf:'goldMat',Copper_Patina_Green:'copperRoofMat'};
      for(const [tag,key] of Object.entries(tags))if(object.material.name.includes(tag)){object.material=materials[key==='flagstoneMat'?'precinctPaving':['romon','naihaiden','honden'].includes(id)&&key==='stoneMat'?'entryStoneMat':key];break;}
      yield 'material-mesh';
    }
    if(id==='romon'){diagnostics.romonWings=JSON.stringify(yield* refineRomonWingStages(scene,materials));yield 'romon-wings';diagnostics.romonPrecinctR96=JSON.stringify(refineRomonPrecinctR96(scene,materials));yield 'romon-precinct';}
  return scene;
}

// The floor bake drains the same ordered passes synchronously.
export function refineShrineBuilding(scene,id,materials,options){
 for(const stage of refinementStages(scene,id,materials,options))void stage;
 return scene;
}

// Geometry slices share a short CPU budget; yielding per triangle chunk would
// create thousands of clamped timers. Report each stage's peak, off the hot loop.
export async function refineShrineBuildingAsync(scene,id,materials,{yieldWork=()=>new Promise(resolve=>setTimeout(resolve,0)),timing=()=>{},now=()=>performance.now(),workBudgetMs=4,...options}={}){
 const stages=refinementStages(scene,id,materials,options);
 const peaks=new Map(),reported=new Map();let sliceStart=now(),steps=0;
 const report=()=>{for(const [name,ms]of peaks)if(!reported.has(name)||ms>reported.get(name)){timing(name,ms);reported.set(name,ms);}};
 while(true){
  const start=now(),step=stages.next(),ms=now()-start;
  if(step.done){report();break;}
  peaks.set(step.value,Math.max(peaks.get(step.value)??0,ms));
  if(++steps>=128||now()-sliceStart>=workBudgetMs){report();await yieldWork();sliceStart=now();steps=0;}
 }
 return scene;
}
