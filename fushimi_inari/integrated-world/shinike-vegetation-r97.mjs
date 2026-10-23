import * as THREE from 'three';
const KEY='shinikeVegetationR97';
const inside=(x,z,ring)=>{let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
const shoreDistance=(x,z,ring)=>Math.min(...ring.map((a,i)=>{const b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}));
/** Source pairing from legacy-builders: trunks0..259 have two sugi crowns2i/2i+1;
 * trunks260..369 have momiji crown i-260. Call before instance partition and LOD.
 * Rooted positions inside actual mapped water select candidates; crowns never do.
 */
export function repairShinikeVegetationR97(root,legacy,shinikeReport,colliders){
 if(root.userData[KEY])return root.userData[KEY];
 const [trunks,sugi,momiji]=legacy.foliage??[],bank=root.getObjectByName('Shin-ike bounded inward natural bank collar R97');
 if(!shinikeReport?.built||!shinikeReport.ring||!Number.isFinite(shinikeReport.waterLevel)||!Number.isFinite(shinikeReport.maximumBankInset)||!bank?.isMesh||bank.parent?.userData!==shinikeReport)return {built:false,reason:'Exact built R97 bank/water owner required'};
 if(![trunks,sugi,momiji].every(m=>m?.isInstancedMesh)||trunks.count!==370||sugi.count!==520||momiji.count!==110)return {built:false,reason:'Original unpartitioned 370/520/110 source pairing required'};
 root.updateMatrixWorld(true);const identity=new THREE.Matrix4();
 if([trunks,sugi,momiji].some(mesh=>mesh.matrixWorld.elements.some((v,i)=>Math.abs(v-identity.elements[i])>1e-7)))return {built:false,reason:'Geotransformed instance matrices with identity owners required'};
 const removed=[],moved=[],skipped=[],removals=new Map([[trunks,new Set()],[sugi,new Set()],[momiji,new Set()]]),removeColliders=new Set(),matrix=new THREE.Matrix4(),scale=new THREE.Vector3(),q=new THREE.Quaternion(),point=new THREE.Vector3();
 for(let index=0;index<trunks.count;index++){
  trunks.getMatrixAt(index,matrix);matrix.decompose(point,q,scale);if(Math.min(scale.x,scale.y,scale.z)<.1||!inside(point.x,point.z,shinikeReport.ring))continue;
  const origin=point.toArray(),paired=index<260?[[sugi,index*2],[sugi,index*2+1]]:[[momiji,index-260]],s=scale.x;
  let verified=Math.max(...scale.toArray())-Math.min(...scale.toArray())<.0001;
  for(const [mesh,i]of paired){const m=new THREE.Matrix4(),p=new THREE.Vector3(),cs=new THREE.Vector3();mesh.getMatrixAt(i,m);m.decompose(p,new THREE.Quaternion(),cs);const layer=index<260?i%2:0,expected=index<260?s*(1.28-layer*.24):s*1.32;
   // Rigid world relocation preserves X/Z and the source crown/trunk scale
   // ratios. Verify the exact paired index rather than proximity matching crowns.
   if(Math.hypot(p.x-point.x,p.z-point.z)>.003||Math.abs(cs.x-expected)>.0002||Math.abs(cs.z-expected)>.0002||Math.abs(cs.y-(index<260?expected:s*1.18))>.0002||Math.abs(p.y-point.y-(.25+(index<260?7+layer*2.8:6.8)*s))>.004)verified=false;
  }
  const atRoot=colliders.filter(c=>c.type==='cylinder'&&c.args.at(-1)==='tree'&&Math.hypot(c.args[0]-point.x,c.args[1]-point.z)<.003),matches=atRoot.filter(c=>Math.abs(c.args[2]-.38*s)<.0002);
  if(!verified||matches.length>1||matches.length!==atRoot.length){skipped.push({index,root:origin,reason:'Unverified paired crown or ambiguous exact tree collider'});continue;}
  const distance=shoreDistance(point.x,point.z,shinikeReport.ring),ray=new THREE.Raycaster(new THREE.Vector3(point.x,Math.max(point.y,shinikeReport.waterLevel)+100,point.z),new THREE.Vector3(0,-1,0)),hits=ray.intersectObject(bank,false),collarHit=hits.find(h=>Number.isFinite(h.point.y)),hit=hits.find(h=>Number.isFinite(h.point.y)&&h.point.y>shinikeReport.waterLevel+.04);
  if(hit){
   const next=hit.point.y-.25,dy=next-point.y;
   // Retain original 25cm trunk-root burial from the source tree constructor.
   for(const [mesh,i]of [[trunks,index],...paired]){mesh.getMatrixAt(i,matrix);matrix.elements[13]+=dy;mesh.setMatrixAt(i,matrix);}
   for(const c of matches){c.args[3]+=dy;c.args[4]+=dy;}
   moved.push({index,root:origin,bankHeight:hit.point.y,newRoot:[point.x,next,point.z],dy,crownIndices:paired.map(([m,i])=>({role:m===sugi?'sugi':'momiji',index:i})),colliders:matches.length});
  }else if(collarHit||distance>shinikeReport.maximumBankInset+.05){
   removals.get(trunks).add(index);for(const [mesh,i]of paired)removals.get(mesh).add(i);for(const c of matches)removeColliders.add(c);
   removed.push({index,root:origin,distanceToMappedShore:distance,reason:collarHit?'Verified wet collar toe without dry support':'Open water beyond maximum bank inset',bankHeight:collarHit?.point.y??null,crownIndices:paired.map(([m,i])=>({role:m===sugi?'sugi':'momiji',index:i})),colliders:matches.length});
  }else skipped.push({index,root:origin,distanceToMappedShore:distance,reason:'No dry actual collar support within registered bank inset'});
 }
 // Stable compaction preserves every retained matrix/color and original order.
 // No zero-scale ghosts, new mesh, material or render batch is introduced.
 for(const [mesh,indices]of removals){let write=0;for(let read=0;read<mesh.count;read++)if(!indices.has(read)){if(write!==read){mesh.instanceMatrix.array.copyWithin(write*16,read*16,read*16+16);if(mesh.instanceColor)mesh.instanceColor.array.copyWithin(write*3,read*3,read*3+3);}write++;}mesh.count=write;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();}
 for(let i=colliders.length-1;i>=0;i--)if(removeColliders.has(colliders[i]))colliders.splice(i,1);
 const report={built:true,revision:'R97',removed,moved,skipped,removedTrees:removed.length,movedTrees:moved.length,removedColliders:removeColliders.size,counts:{trunks:trunks.count,sugi:sugi.count,momiji:momiji.count},newBatches:0,source:'legacy-builders.mjs source-index tree/crown pairing; actual owned R97 collar ray intersections; actual mapped Shin-ike water polygon',limits:'Only rooted trees inside actual water are candidates. Unverified pairing, ambiguous colliders or absent nearbank dry support are withheld. Crown overhang alone is never removed.'};
 root.userData[KEY]=report;return report;
}
