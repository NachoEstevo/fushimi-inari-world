import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {removeSourceBoxes} from './source-component-boxes.mjs';

// IMG6497/6501/6503: unpainted stage boards and dark boarded soffit sit
// within the red frame; sudare headers/tapes are indigo, not white plaster.
// All dimensions derive from the inherited source envelope, not a survey.
export function refineGehaidenContextR96(scene,materials={}){
 if(scene.userData.gehaidenContextR96)return scene.userData.gehaidenContextR96;
 if(!scene.userData.gehaidenBalustradeRefined||scene.userData.romonGehaidenR95?.zone!=='gehaiden')return {built:false,reason:'Successful Gehaiden balustrade and R95 source refinements required'};
 const source=scene.getObjectByName('gehaiden source-referenced architectural completion R95');
 const tapeMesh=source?.children.find(o=>o.isMesh&&o.material.color?.getHexString()==='a9a69b');
 if(!tapeMesh)return {built:false,reason:'Exclusive R95 woven tape batch missing'};
 const panels=[];
 for(let i=0;i<5;i++)for(const z of [-15.68,-9.32])panels.push({x:-4+i*2,z,width:1.82,yaw:z<-12.5?Math.PI:0});
 for(let i=0;i<3;i++)for(const x of [-4.98,4.98])panels.push({x,z:-12.5-2.13+i*2.13,width:1.92,yaw:x<0?-Math.PI/2:Math.PI/2});
 const targets=[];
 const station=(p,u,v)=>[p.x+Math.cos(p.yaw)*u+Math.sin(p.yaw)*v,p.z-Math.sin(p.yaw)*u+Math.cos(p.yaw)*v];
 for(const p of panels){const across=Math.abs(Math.cos(p.yaw))>.5;
  targets.push({size:across?[p.width,.11,.035]:[.035,.11,p.width],center:[p.x,5.365,p.z]});
  for(const u of [-.62,-.22,.22,.62]){const [x,z]=station(p,u,.024);targets.push({size:across?[.055,1.18,.032]:[.032,1.18,.055],center:[x,4.8,z]});}
 }
 // Exact complete components before any mutation. Keep every reed, paper
 // fold, chevron, lantern and original UV buffer; no broad material deletion.
 const repair=removeSourceBoxes(tapeMesh,targets);
 if(repair.count!==80){repair.geometry.dispose();return {built:false,reason:'R95 woven border component signature changed',matched:repair.count};}
 const wood=new THREE.MeshStandardMaterial({name:'R96 Gehaiden weathered timber stage',color:'#65564a',roughness:.93});
 const soffit=new THREE.MeshStandardMaterial({name:'R96 Gehaiden dark timber soffit',color:'#4b3b30',roughness:.96});
 const indigo=new THREE.MeshStandardMaterial({name:'R96 Gehaiden indigo woven border',color:'#243253',roughness:.97});
 const thread=new THREE.MeshStandardMaterial({name:'R96 Gehaiden woven gold edging',color:'#9a8550',roughness:.94});
 const parts=new Map(),add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);};
 const box=(w,h,d,x,y,z,m,yaw=0)=>add(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),m);
 // Longitudinal boards cover the existing red top, retaining its red fascia.
 // Nine mm seams expose the existing substrate and the floor level is fixed.
 const boardCount=36,pitch=10.78/boardCount;
 for(let i=0;i<boardCount;i++)box(pitch-.009,.012,7.18,-5.39+(i+.5)*pitch,2.421,-12.5,wood);
 // Thin underside panels attach to the original mid-beam slab (bottom5.35).
 // Individual narrow joists articulate the open interior, never close sides.
 for(let i=0;i<24;i++)box(9.88/24-.008,.016,6.28,-4.94+(i+.5)*9.88/24,5.345,-12.5,soffit);
 for(const x of [-4,-2,0,2,4])box(.095,.105,6.30,x,5.285,-12.5,soffit);
 for(const p of panels){const put=(w,h,d,u,y,v,m)=>{const [x,z]=station(p,u,v);box(w,h,d,x,y,z,m,p.yaw);};
  put(p.width,.11,.035,0,5.365,0,indigo);
  for(const u of [-.62,-.22,.22,.62]){
   put(.055,1.18,.032,u,4.8,.024,indigo);
   for(const edge of [-1,1])put(.006,1.18,.006,u+edge*.024,4.8,.043,thread);
  }
  for(const y of [5.318,5.412])put(p.width,.008,.006,0,y,.021,thread);
 }
 const group=new THREE.Group();group.name='Gehaiden R96 timber stage soffit and indigo woven borders';let triangles=0;
 for(const [m,gs]of parts){const g=mergeGeometries(gs);gs.forEach(g=>g.dispose());if(!g)throw Error('Gehaiden R96 batch merge failed');const mesh=new THREE.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;triangles+=g.attributes.position.count/3;group.add(mesh);}
 tapeMesh.geometry=repair.geometry;
 const report={built:true,revision:'R96',stageBoards:boardCount,ceilingPanels:24,interiorJoists:5,indigoBlindBorders:80,blindPanels:16,materialBatches:parts.size,triangles,collidersAdded:0,sourceFrame:true,dimensions:'Inherited GLB envelope and R95 stations; photo-inferred board pitch and fine dimensions',references:['https://fushimiinari-guide.com/wp-content/uploads/IMG_6497_20210321.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_6501_20210321.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_6503_20210321.jpg'],limits:'No surveyed dimensions, detailed brocade motifs or whole precinct exactness; root visual acceptance required'};
 group.userData=report;scene.add(group);scene.userData.gehaidenContextR96=report;return report;
}
