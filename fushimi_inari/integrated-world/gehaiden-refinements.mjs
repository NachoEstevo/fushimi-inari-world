import * as THREE from 'three';

// 10_gehaiden.jpg: the raised verandah has an OPEN timber balustrade,
// with discrete gold collars. The Blender source instead exported three
// complete horizontal boxes across its interior (build_z02_gehaiden).
// Coordinates below are the original GLB metre frame, before anchor mapping.
export function refineGehaiden(object,materials={}){
  if(object.userData.gehaidenBalustradeRefined)return;
  const candidates=[];
  object.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const name=mesh.material?.name||'';
    if(name.includes('Vermilion_ShuIro'))candidates.push([mesh,[
      {size:[11,.09,7.4],center:[0,2.95,-12.5]},
      {size:[11,.07,7.4],center:[0,2.68,-12.5]}
    ]]);
    if(name.includes('Gold_Kanagu_Leaf'))candidates.push([mesh,[
      {size:[11.08,.06,7.48],center:[0,3.02,-12.5]}
    ]]);
  });
  const repairs=candidates.map(([mesh,targets])=>[mesh,removeBoxes(mesh,targets)]);
  const removed=repairs.reduce((sum,[,repair])=>sum+repair.count,0);
  // Fail closed if a future asset changes its topology or dimensions.
  // Never lay new rails over an intact or only partly repaired source slab.
  if(removed!==3){object.userData.gehaidenBalustradeRemovalCount=removed;return;}
  for(const [mesh,repair] of repairs)if(repair.geometry)mesh.geometry=repair.geometry;
  const group=new THREE.Group();group.name='Gehaiden open verandah balustrade';
  // June 2012 east-court Street View (outputs/r48/central-east.png)
  // resolves the rails as vermilion lacquer, with gold clasp plates and
  // round bolt heads. The older oblique photograph made them look brown.
  const timber=new THREE.MeshStandardMaterial({color:'#b83a22',roughness:.52});
  const gold=materials.goldMat||new THREE.MeshStandardMaterial({color:'#b28a39',metalness:.7,roughness:.35});
  const add=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  };
  // Retain the source rail heights and envelope; only the perimeter is solid.
  for(const [y,h] of [[2.68,.07],[2.95,.09]]){
    for(const z of [-16.2,-8.8])add(11,h,.085,0,y,z,timber);
    for(const x of [-5.5,5.5])add(.085,h,7.4,x,y,-12.5,timber);
  }
  // Discrete small clasp plates replace the incorrect solid gold floor.
  // Spacing follows the source verandah posts, rather than introducing bays.
  for(const x of [-5.5,-1.8,1.8,5.5])for(const z of [-16.2,-8.8]){
    add(.15,.105,.11,x,2.95,z,gold);
    add(.15,.085,.11,x,2.68,z,gold);
  }
  // The source contains gold corner finials and existing picket caps, so
  // preserve those. Add only the missing round fasteners between clasps.
  // Flattened domes sit on the outer rail faces, rather than floating above.
  const fittings=new THREE.Group();fittings.name='Gehaiden verandah round gold rail fasteners';
  const dome=new THREE.SphereGeometry(.028,10,6);
  for(const y of [2.68,2.95]){
    for(const z of [-16.2,-8.8])for(const x of [-3.65,0,3.65]){
      const mesh=new THREE.Mesh(dome,gold);
      mesh.scale.set(1,1,.32);mesh.position.set(x,y,z+Math.sign(z+12.5)*.047);
      mesh.castShadow=true;fittings.add(mesh);
    }
    for(const x of [-5.5,5.5])for(const z of [-14.35,-12.5,-10.65]){
      const mesh=new THREE.Mesh(dome,gold);
      mesh.scale.set(.32,1,1);mesh.position.set(x+Math.sign(x)*.047,y,z);
      mesh.castShadow=true;fittings.add(mesh);
    }
  }
  object.add(group,fittings);object.userData.gehaidenBalustradeRefined=true;
  object.userData.gehaidenBalustradeRemovalCount=removed;
}

// Identify whole connected source components by their exact bounds. Joining
// by position also works with the split vertices at box normals/UV seams.
// This preserves columns, original finials, pickets, lanterns and roof gilding.
function removeBoxes(mesh,targets){
  const source=mesh.geometry,p=source.attributes.position,index=source.index;
  const count=index?index.count:p.count,parent=Array.from({length:p.count},(_,i)=>i);
  const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  const join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
  const weld=new Map();
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*100000)).join(',');
    if(weld.has(key))join(i,weld.get(key));else weld.set(key,i);
  }
  const vertex=i=>index?index.getX(i):i;
  for(let i=0;i<count;i+=3){join(vertex(i),vertex(i+1));join(vertex(i),vertex(i+2));}
  const components=new Map(),v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
    const id=find(i);if(!components.has(id))components.set(id,new THREE.Box3());
    components.get(id).expandByPoint(v.fromBufferAttribute(p,i));
  }
  const remove=new Set(),size=new THREE.Vector3(),center=new THREE.Vector3();
  for(const [id,bounds] of components){
    bounds.getSize(size);bounds.getCenter(center);
    if(targets.some(t=>size.toArray().every((v,i)=>Math.abs(v-t.size[i])<.003)&&
      center.toArray().every((v,i)=>Math.abs(v-t.center[i])<.003)))remove.add(id);
  }
  if(!remove.size)return {count:0};
  const retained=[];
  for(let i=0;i<count;i+=3)if(!remove.has(find(vertex(i))))retained.push(vertex(i),vertex(i+1),vertex(i+2));
  const geometry=source.clone();geometry.setIndex(retained);geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return {count:remove.size,geometry};
}
