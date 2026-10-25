import {refineGehaidenContextR96} from './gehaiden-context-r96.mjs?v=96-release';
import {refineNaihaidenContextR96} from './naihaiden-context-r96.mjs?v=96-release';
import {refineRomonPrecinctR96} from './romon-precinct-r96.mjs?v=96-release';
import {refineHondenServiceEnvelopeR96} from './sanctuary-context-r96.mjs?v=96-release';
import {refineRomonGehaidenR95} from './romon-gehaiden-r95.mjs?v=95-release';
import {refineHondenOpenEnclosure,refineNaihaidenArchitecture,refineNaihaidenPrayerFront} from './sanctuary-context-r95.mjs?v=95-release';
import {refineHondenRearVeranda} from './sanctuary-context-r94.mjs?v=94';
import {refineRomonShrubs} from './entrance-refinements.mjs?v=86';
import {refineRomonGold,refineRomonGables} from './precinct-details.mjs';
import {refineRomonWings} from './romon-wings.mjs?v=71';
import {refineGehaiden} from './gehaiden-refinements.mjs?v=48';
import {clearWestStairPodium} from './entrance-stair-clearance.mjs';
import {refineRomonCurtain} from './romon-curtain.mjs';
import {refineNaihaiden} from './naihaiden-refinements.mjs';

// Shared by deferred visual loading and the authored floor-support bake.
export function refineShrineBuilding(scene,id,materials,{diagnostics={},gehaidenLanternCleanupR96}={}){
    if(id==='honden')diagnostics.hondenRearVeranda=JSON.stringify(refineHondenRearVeranda(scene,materials));
    if(id==='naihaiden')diagnostics.naihaidenDetail=JSON.stringify(refineNaihaiden(scene,materials));
    if(id==='gehaiden'){
      refineGehaiden(scene,materials);
      diagnostics.gehaidenRails=String(scene.userData.gehaidenBalustradeRemovalCount??0);
    }
    if(id==='honden'){diagnostics.hondenEnclosureR95=JSON.stringify(refineHondenOpenEnclosure(scene,materials));diagnostics.hondenEnvelopeR96=JSON.stringify(refineHondenServiceEnvelopeR96(scene,materials));}
    if(id==='naihaiden')diagnostics.naihaidenArchitectureR95=JSON.stringify(refineNaihaidenArchitecture(scene,materials));
    if(id==='naihaiden')diagnostics.naihaidenFrontR95=JSON.stringify(refineNaihaidenPrayerFront(scene,materials));
    if(id==='romon'||id==='gehaiden')diagnostics[id+'ArchitectureR95']=JSON.stringify(refineRomonGehaidenR95(scene,id,materials));
    if(id==='gehaiden'&&gehaidenLanternCleanupR96){
      const {removedElements,...report}=gehaidenLanternCleanupR96.commit(scene.userData.romonGehaidenR95);
      diagnostics.gehaidenLanternCleanupR96=JSON.stringify(report);
    }
    if(id==='gehaiden')diagnostics.gehaidenContextR96=JSON.stringify(refineGehaidenContextR96(scene,materials));
    if(id==='naihaiden')diagnostics.naihaidenContextR96=JSON.stringify(refineNaihaidenContextR96(scene,materials));
    if(id==='romon'){
      // Export manifest: these two materials contain only T00 approach slabs.
      // Terrain + mapped path surfaces now own the outdoor floor; a rigid slab
      // cannot follow their grade and leaves exposed vertical/triangular edges.
      const obsolete=[];
      scene.traverse(o=>{if(o.isMesh&&/Courtyard_Gravel_Dark|Flagstone_Walkway/.test(o.material.name))obsolete.push(o);});
      obsolete.forEach(o=>{o.removeFromParent();o.geometry.dispose();});
    }
    if(id==='romon'){refineRomonCurtain(scene);refineRomonGold(scene,materials.goldMat);refineRomonGables(scene,materials.goldMat);}
    scene.traverse(object=>{
      if(!object.isMesh||object.material===materials.goldMat)return;
      if(id==='romon'&&object.material.name.includes('Foliage_Canopy')){refineRomonShrubs(object);return;}
      if(id==='romon'&&object.material.name.includes('Granite_Stone_Moss'))clearWestStairPodium(object);
      object.castShadow=true;object.receiveShadow=true;
      const tags={Vermilion_ShuIro:'vermilionMat',Black_Lacquer_Nemaki:'blackNemakiMat',
        Granite_Stone_Moss:'stoneMat',Flagstone_Walkway:'flagstoneMat',Courtyard_Gravel_Dark:'gravelMat',
        White_Shikku_Plaster:'plasterMat',Gold_Kanagu_Leaf:'goldMat',Copper_Patina_Green:'copperRoofMat'};
      for(const [tag,key] of Object.entries(tags))if(object.material.name.includes(tag)){object.material=materials[key==='flagstoneMat'?'precinctPaving':['romon','naihaiden','honden'].includes(id)&&key==='stoneMat'?'entryStoneMat':key];break;}
    });
    if(id==='romon'){diagnostics.romonWings=JSON.stringify(refineRomonWings(scene,materials));diagnostics.romonPrecinctR96=JSON.stringify(refineRomonPrecinctR96(scene,materials));}
  return scene;
}
