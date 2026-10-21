import * as THREE from 'three';
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-5;
const boxAt=(o,w,h,d,x,y,z)=>o.isMesh&&near(o.geometry?.parameters?.width,w)&&near(o.geometry?.parameters?.height,h)&&near(o.geometry?.parameters?.depth,d)&&near(o.position.x,x)&&near(o.position.y,y)&&near(o.position.z,z);
// The compressed legacy north wall crosses the mapped three-shrine enclosure.
// Remove only its exact original components and the two source-layout shop
// groups in front. Mapped walls, other shops and the south boundary stay owned.
export function clearLegacyShrineConflicts(root,colliders){
 root.updateWorldMatrix(true,true);const parents=[];
 root.traverse(o=>{if(o.isGroup&&o.children.some(c=>boxAt(c,.42,2.15,41.8,-18.5,1.62,24)))parents.push(o);});
 if(parents.length!==1)return {removedWalls:0,removedShops:0,removedColliders:0,reason:'unique source north wall owner not found'};
 const parent=parents[0],wallSpecs=[[.65,.55,42,-18.5,.275,24],[.42,2.15,41.8,-18.5,1.62,24],[.92,.28,42.4,-18.5,2.82,24]],walls=wallSpecs.map(s=>parent.children.find(o=>boxAt(o,...s)));
 const shopSpecs=[[-14.2,31.5],[-13.8,20.5]],shops=shopSpecs.map(([x,z])=>parent.children.find(o=>o.isGroup&&near(o.position.x,x)&&near(o.position.z,z)&&near(o.rotation.y,Math.PI/2)&&o.children.some(c=>boxAt(c,6.2,3.2,4.2,0,1.6,0))&&o.children.some(c=>boxAt(c,7.2,.45,5.2,0,4.65,0))));
 if(walls.some(o=>!o)||shops.some(o=>!o))return {removedWalls:0,removedShops:0,removedColliders:0,reason:'source wall/shop component signature changed'};
 const centers=[{tag:'tsuijibei_wall',p:parent.localToWorld(new THREE.Vector3(-18.5,0,24))},...shopSpecs.map(([x,z])=>({tag:'monzen_shop',p:parent.localToWorld(new THREE.Vector3(x,0,z))}))];
 const hits=centers.map(({tag,p})=>colliders.filter(c=>c.type==='box'&&c.args.at(-1)===tag&&Math.hypot(c.args[0]-p.x,c.args[1]-p.z)<.15));
 if(hits.some(list=>list.length!==1))return {removedWalls:0,removedShops:0,removedColliders:0,reason:'source geometry/collider pairing ambiguous'};
 for(const object of [...walls,...shops]){
  object.traverse(o=>{o.userData.legacyShrineConflictRemoved=true;if(o.isMesh)o.geometry?.dispose();});object.removeFromParent();
 }
 const doomed=new Set(hits.flat());for(let i=colliders.length-1;i>=0;i--)if(doomed.has(colliders[i]))colliders.splice(i,1);
 return {removedWalls:3,removedShops:2,removedColliders:3,interactionPruneFlag:'legacyShrineConflictRemoved',provenance:'Exact compressed source components; mapped enclosure and all other scene owners retained'};
}
