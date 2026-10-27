import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {removeSourceBoxesStages} from './source-component-boxes.mjs';

export const centralRoofR95=Object.freeze({romon:{halfLength:7.8,halfWidth:4.9,base:9.95,height:4.2,centerZ:0},gehaiden:{halfLength:7.1,halfWidth:5.2,base:6.85,height:3.65,centerZ:-12.5}});
const sf=s=>Math.min(1,s.height/3.8),ridge=s=>s.halfLength*.52;
const corner=(s,x,z)=>.42*sf(s)*(z/s.halfWidth)**2*(x/s.halfLength)**2;
export function originalCentralRoofHeight(s,x,z){const v=Math.abs(z/s.halfWidth),hip=Math.max(0,(Math.abs(x/s.halfLength)-.38)/.62),r=Math.min(1,Math.sqrt(v*v+hip*hip*.85));return s.base+s.height*(1-r)**1.38+corner(s,x,z);}
const slope=(s,z)=>s.height*(1-Math.min(1,Math.abs(z/s.halfWidth)))**1.38;
const gableHalf=s=>s.halfWidth*.50;
export function centralRoofProfileR95(s,x,z,hip=false){
 const main=slope(s,z);
 if(!hip)return s.base+main+corner(s,x,z);
 const t=Math.max(0,Math.min(1,(Math.abs(x)-ridge(s))/(s.halfLength-ridge(s))));
 return s.base+Math.min(main,slope(s,gableHalf(s)))*(1-t)**1.38+corner(s,x,z);
}

// This retains plan limits, source apex/eave datums and shell thickness. The
// upper gabled roof terminates at its existing ridge ends; a lower hip begins
// at the gable foot. A single continuous hip cannot represent that opening.
export function refineCentralIrimoyaR95(scene,zone,materials={}){
 const stages=refineCentralIrimoyaR95Stages(scene,zone,materials);let step;
 do{step=stages.next();}while(!step.done);return step.value;
}
export function* refineCentralIrimoyaR95Stages(scene,zone,materials={}){
 if(scene.userData.centralRoofR95)return scene.userData.centralRoofR95;
 const s=centralRoofR95[zone];if(!s)return {built:false,reason:'Unsupported central roof'};
 const meshes=[];scene.traverse(m=>{if(m.isMesh)meshes.push(m);});
 const match=(m,t)=>`${m.name} ${m.material?.name}`.includes(t),roof=meshes.find(m=>match(m,'Hiwadabuki_Bark_Roof')),black=meshes.find(m=>match(m,'Black_Lacquer_Nemaki')),gold=meshes.find(m=>match(m,'Gold_Kanagu_Leaf')),timber=meshes.find(m=>match(m,'Vermilion_ShuIro'));
 if(!roof||!black||!gold||!timber)return {built:false,reason:'Central roof source meshes missing'};
 const source=roof.geometry,p=source.attributes.position,index=source.index,keep=[];let removed=0;
 const thickness=.38*sf(s);
 for(let i=0;i<(index?.count??p.count);i+=3){
  const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);
  const inside=ids.every(k=>{const x=p.getX(k),z=p.getZ(k)-s.centerZ,y=p.getY(k);if(Math.abs(x)>s.halfLength+.0001||Math.abs(z)>s.halfWidth+.0001)return false;const delta=originalCentralRoofHeight(s,x,z)-y;return Math.abs(delta)<.00003||Math.abs(delta-thickness)<.00003;});
  if(inside)removed++;else keep.push(...ids);if((i+3)%1536===0)yield 'roof-selection';
 }
 const targets=(isGold)=>[-1,1].map(side=>({size:isGold?[.22,.16*sf(s),s.halfWidth*2*.38]:[.18,s.height*.38,s.halfWidth*2*.36],center:[side*(ridge(s)+.12*sf(s)-(isGold?.22:.15)),s.base+s.height*(isGold?.78:.62),s.centerZ]}));
 const rafters=Math.floor(s.halfLength*2*2.4),rafterTargets=[],tipTargets=[],stations=[];
 for(let i=0;i<rafters;i++){
  const x=-s.halfLength+.30+i*((s.halfLength*2-.6)/(rafters-1));stations.push(x);
  for(const side of [-1,1]){
   rafterTargets.push({size:[.075,2.2*Math.sin(.26)+.085*Math.cos(.26),2.2*Math.cos(.26)+.085*Math.sin(.26)],center:[x,s.base+.14,s.centerZ+side*(s.halfWidth-2.2*.48)]});
   tipTargets.push({size:[.08,.04*Math.sin(.26)+.09*Math.cos(.26),.04*Math.cos(.26)+.09*Math.sin(.26)],center:[x,s.base-.12,s.centerZ+side*(s.halfWidth+.02)]});
  }
 }
 const a=yield* removeSourceBoxesStages(black,targets(false)),b=yield* removeSourceBoxesStages(gold,[...targets(true),...tipTargets]),c=yield* removeSourceBoxesStages(timber,rafterTargets);
 if(removed!==4028||a.count!==2||b.count!==2+rafters*2||c.count!==rafters*2){a.geometry.dispose();b.geometry.dispose();c.geometry.dispose();return {built:false,reason:'Central roof production signature changed',removed,pediments:a.count,goldParts:b.count,rafters:c.count};}
 const geometry=source.clone();yield 'roof-source-clone';geometry.setIndex(keep);yield 'roof-source-index';geometry.computeBoundingBox();geometry.computeBoundingSphere();yield 'roof-source-finalize';roof.geometry=geometry;black.geometry=a.geometry;gold.geometry=b.geometry;timber.geometry=c.geometry;
 const group=new THREE.Group();group.name=`${zone} joined ridge and real irimoya gables R95`;
 const parts=new Map(),add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);};
 const red=materials.vermilionMat??new THREE.MeshStandardMaterial({color:'#af3923',roughness:.75}),dark=materials.blackNemakiMat??black.material,gilt=materials.goldMat??gold.material;
 const box=(w,h,d,x,y,z,m)=>add(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
 const shell=function*(xs,hip){
  const zs=Array.from({length:29},(_,i)=>-s.halfWidth+i*s.halfWidth/14),positions=[],uv=[];
  const pt=(x,z,under=0)=>[x,centralRoofProfileR95(s,x,z,hip)-under,z+s.centerZ];
  const triangle=(a,b,c)=>{
   positions.push(...a,...b,...c);
   const dx=b[0]-a[0],dz=b[2]-a[2],ex=c[0]-a[0],ez=c[2]-a[2];
   // The source bark uses a 2m metric tile. One global roof-plan basis keeps
   // core/hip texture coordinates identical at shared stations. Thin vertical
   // fascia faces use along-edge/height coordinates to avoid collapsed UVs.
   const plan=Math.abs(dx*ez-ex*dz)>1e-10,alongX=Math.abs(dx)+Math.abs(ex)>=Math.abs(dz)+Math.abs(ez);
   for(const [x,y,z]of [a,b,c])uv.push(plan?-(z-s.centerZ)/2:alongX?x/2:-(z-s.centerZ)/2,plan?x/2:(y-s.base)/2);
  };
  let triangles=0;
  for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
   const x=xs[i-1],X=xs[i],z=zs[j-1],Z=zs[j];
   triangle(pt(x,z),pt(x,Z),pt(X,z));triangle(pt(X,z),pt(x,Z),pt(X,Z));
   triangle(pt(x,z,thickness),pt(X,z,thickness),pt(x,Z,thickness));triangle(pt(X,z,thickness),pt(X,Z,thickness),pt(x,Z,thickness));
   triangles+=4;if(triangles%512===0)yield 'roof-shell';
  }
  const edge=(a,b)=>{triangle(pt(...a),pt(...a,thickness),pt(...b));triangle(pt(...b),pt(...a,thickness),pt(...b,thickness));};
  for(let i=1;i<xs.length;i++){edge([xs[i-1],-s.halfWidth],[xs[i],-s.halfWidth]);edge([xs[i],s.halfWidth],[xs[i-1],s.halfWidth]);}
  for(let j=1;j<zs.length;j++){edge([xs[0],zs[j]],[xs[0],zs[j-1]]);edge([xs.at(-1),zs[j-1]],[xs.at(-1),zs[j]]);}
  yield 'roof-shell';
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,roof.material);yield 'roof-shell-material';
 };
 const R=ridge(s);yield* shell(Array.from({length:23},(_,i)=>-R+2*R*i/22),false);
 for(const side of [-1,1])yield* shell(Array.from({length:12},(_,i)=>side*R+side*(s.halfLength-R)*i/11).sort((a,b)=>a-b),true);
 // Existing source rafters penetrated the bark near the hip corners. Retain
 // their stations, but attach the whole beam beneath the actual local shell.
 let beams=0;
 for(const x of stations)for(const side of [-1,1]){
  const z0=side*(s.halfWidth-2.2),z1=side*s.halfWidth,hip=Math.abs(x)>R;
  const a=new THREE.Vector3(x,centralRoofProfileR95(s,x,z0,hip)-thickness-.08,z0+s.centerZ),b=new THREE.Vector3(x,centralRoofProfileR95(s,x,z1,hip)-thickness-.08,z1+s.centerZ),v=b.clone().sub(a);
  const g=new THREE.BoxGeometry(.075,.085,v.length());g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),v.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(g,red);box(.082,.095,.065,b.x,b.y,b.z,gilt);if(++beams%16===0)yield 'roof-rafter';
 }
 yield 'roof-rafter';
 for(const side of [-1,1]){
  const x=side*(R+.018),G=gableHalf(s),base=s.base+slope(s,G);
  // Two-direction lattice clipped to the curved roof profile: actual gaps,
  // without a solid black triangular billboard behind it.
  for(let z=-G+.06;z<G;z+=.12){const top=centralRoofProfileR95(s,side*R,z)-thickness*.35,bottom=base+corner(s,R,z);if(top>bottom)box(.055,top-bottom,.035,x,(top+bottom)/2,z+s.centerZ,dark);}
  yield 'roof-gable-vertical-lattice';
  for(let y=base+.10;y<s.base+s.height-.1;y+=.16){const half=s.halfWidth*(1-((y-s.base)/s.height)**(1/1.38));if(half>.04)box(.055,.030,Math.min(G-.03,half)*2,x,y,s.centerZ,dark);}
  yield 'roof-gable-horizontal-lattice';
  box(.10,.14,G*2,x,base-.015,s.centerZ,red);
  // Curved bargeboard follows the actual shell edge, meeting the apex.
  for(const sign of [-1,1]){for(let i=0;i<22;i++){
   const z0=sign*G*i/22,z1=sign*G*(i+1)/22,a=new THREE.Vector3(x,centralRoofProfileR95(s,R,z0)+.015,z0+s.centerZ),b=new THREE.Vector3(x,centralRoofProfileR95(s,R,z1)+.015,z1+s.centerZ),v=b.clone().sub(a);
   const g=new THREE.BoxGeometry(.16,v.length()+.012,.12);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());add(g,red);
  }yield 'roof-bargeboard';}
  // Small gilt bearing and shoulder plates; inherited apex ornament remains.
  for(const z of [-G,0,G])box(.055,.10,.20,x+side*.095,z===0?s.base+s.height-.20:base+.08,z+s.centerZ,gilt);
  yield 'roof-gable';
 }
 yield 'roof-gable';
 for(const [m,gs]of parts){const g=mergeGeometries(gs);gs.forEach(v=>v.dispose());g.computeBoundingSphere();const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);yield 'roof-material';}scene.add(group);
 const report={built:true,removedRoofTriangles:removed,pediments:2,uvPolicy:'2m global roof-plan tiling across core and hips; vertical fascia uses metric edge/height',reseatedRafters:rafters*2,materialBatches:group.children.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),footprint:[s.halfLength*2,s.halfWidth*2],apex:s.base+s.height,ridgeUnderside:s.base+s.height+.14*sf(s)-.21*sf(s),provenance:'Actual 10_gehaiden and09_romon front photos; corrected structural irimoya topology, not surveyed profile. Footprint, ridge-end stations, height and shell thickness retained.'};scene.userData.centralRoofR95=report;return report;
}
