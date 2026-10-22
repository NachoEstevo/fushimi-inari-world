import * as THREE from 'three';
import {courtCuts,surface,shrineCourtPlan} from './precinct-shrine-courts.mjs';
import {tamayamaForecourtPlan} from './tamayama-forecourt-layout.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

const rectangle=(x0,x1,z0,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];

// Bounded photo-inferred public apron extents, tied to actual mapped lanes and
// roof outlines. The wooded flanks of the long 22-step flight remain outside.
// Video iqK2tg-TxbY at 345s establishes mineral court, not surveyed boundaries.
export function nearPrecinctCourtEnvelopes(features){
 const building=id=>features.buildings?.find(b=>b.id===id);
 const path=id=>features.paths?.find(p=>p.id===id);
 const tamayama=building('way/305214602'),okumiya=building('way/301527733');
 const lane=path('way/1133055117'),upper=path('way/1392716577'),north=path('way/105449724');
 const result=[];
 if(tamayama&&lane){
  const b=bounds(tamayama.points.map(p=>[p[0],p[2]]));
  const west=lane.points[0][0]-1.1;
  result.push({id:'Tamayama public mineral apron',envelope:rectangle(west,b[1]+.5,b[2]-1.3,lane.points.at(-1)[2]+1.3)});
 }
 if(okumiya&&upper&&north){
  const b=bounds(okumiya.points.map(p=>[p[0],p[2]]));
  // Upper landing's east endpoint is the public terrace boundary. Extending
  // back over its western approach coats a different, lower terrain skirt.
  result.push({id:'Okumiya public mineral apron',envelope:rectangle(upper.points.at(-1)[0],b[1]+.35,b[2]-.6,Math.min(north.points[1][2]-.35,b[3]+.85))});
 }
 return result;
}

export function buildNearPrecinctMineralCourts(root,features,network,materials){
 const name='Near precinct continuous mineral aprons R77',old=root.getObjectByName(name);if(old)return old.userData;
 if(!materials.gravelMat)return null;
 const occupied=[];
 root.traverse(o=>{
  if(!o.isGroup)return;
  if(o.userData.zone==='tamayama'&&o.userData.tamayamaDetail){o.updateWorldMatrix(true,false);occupied.push(tamayamaForecourtPlan(o.matrixWorld.elements).envelope);}
  if((o.userData.zone==='gonden'&&o.userData.gondenFacadeR65)||(o.userData.zone==='okumiya'&&o.userData.okumiyaDetail)){
   o.updateWorldMatrix(true,false);occupied.push(shrineCourtPlan(o.userData.zone,o.matrixWorld.elements).envelope);
  }
 });
 const group=new THREE.Group();group.name=name;const records=[];
 for(const plan of nearPrecinctCourtEnvelopes(features)){
  const cuts=[...courtCuts(features,network,bounds(plan.envelope)),...occupied];
  const polygons=cuts.reduce((ps,c)=>ps.flatMap(p=>subtractConvex(p,c)),[plan.envelope]);
  // A mineral court belongs to gentle public ground, never the steep terrain
  // skirts between independently graded landings. Reject whole .25m cells
  // with >35% sampled slope, then independently reject steep final triangles.
  const mesh=surface(polygons,network,materials.gravelMat,plan.id,{maxSlope:.35});if(!mesh)continue;
  const p=mesh.geometry.attributes.position;let renderedArea=0;
  for(let i=0;i<p.count;i+=3)renderedArea+=Math.abs(polygonArea(Array.from({length:3},(_,j)=>[p.getX(i+j),p.getZ(i+j)])));
  group.add(mesh);records.push({id:plan.id,envelope:plan.envelope,area:renderedArea,plannedArea:polygons.reduce((a,p)=>a+Math.abs(polygonArea(p)),0)});
 }
 if(!group.children.length)return null;
 group.userData={records,grid:.25,maxSlope:.35,heightOffset:.012,walkingUnchanged:true,provenance:'Video iqK2tg-TxbY 345s mineral Tamayama court, 325s stone staircase and wooded edges. Apron limits conservatively inferred between mapped access lanes and shrine roof bounds; public paths, buildings, water and existing forecourt/collars excluded.',limits:'Material overlay only; exact historical boundary and walking experience unverified. Steep graded skirts excluded by cell sampling and final triangle slope; no extension along wooded staircase slopes.'};root.add(group);return group.userData;
}
