import * as THREE from 'three';

// A close-up finish for the existing basin, in pavilion-local metres. The photo
// is an appearance reference; these dimensions retain the inherited footprint.
// Call after refineEntranceObjects, before precinct-life registers the ladles.
export function refineTemizuyaDetails(group){
  if(!group?.isGroup||group.userData.zone!=='temizuya')return null;
  const previous=group.getObjectByName('temizuya-water-details');
  if(previous)return previous;
  const water=group.children.find(o=>o.geometry?.type==='PlaneGeometry'&&o.rotation.x< -1);
  const ladles=group.children.filter(o=>o.userData.ladle);
  // Require the hollow-basin refinement. Never decorate the uncut legacy box.
  if(!water||water.position.y>.99||!ladles.length)return null;
  const details=new THREE.Group();details.name='temizuya-water-details';
  details.userData.reference='photo_7_2026-10-20_17-41-36.jpg';
  details.userData.dimensions='inherited basin 2.2 x 1.25 m; visual detail inferred';
  group.add(details);
  const stone=new THREE.MeshStandardMaterial({color:'#696b60',roughness:.94});
  const wet=new THREE.MeshStandardMaterial({color:'#333f2c',roughness:.48});
  // Instance colours are already the final moss colour. A dark material tint
  // would multiply them into near-black spots under the pavilion roof.
  const moss=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1});
  const brass=new THREE.MeshStandardMaterial({color:'#8b7950',metalness:.65,roughness:.46});
  const metal=new THREE.MeshStandardMaterial({color:'#a5aca2',metalness:.72,roughness:.28});
  const box=(name,w,h,d,x,y,z,mat)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.name=name;mesh.position.set(x,y,z);mesh.receiveShadow=true;details.add(mesh);return mesh;
  };
  // Shallow runoff channel on the existing plinth: the thin dark water floor is
  // below its stone lips, rather than a second freestanding fountain.
  box('runoff-channel-floor',2.33,.018,.13,0,.297,.83,wet);
  box('runoff-channel-front-lip',2.44,.055,.055,0,.312,.925,stone);
  for(const x of [-1.19,1.19])box('runoff-channel-end',.055,.055,.23,x,.312,.835,stone);
  // Sparse, flattened growth stays at the lower wet seam and runoff channel.
  const patches=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),moss,58);
  patches.name='irregular-stone-moss';patches.receiveShadow=true;
  const dummy=new THREE.Object3D(),shade=new THREE.Color();let seed=713,count=0;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<58;i++){
    const x=-1.06+random()*2.12,edge=i<38;
    dummy.position.set(x,edge ? .345+random()*.055 : .307,edge ? .626 : .76+random()*.10);
    dummy.scale.set(.009+random()*.019,edge ? .004+random()*.009 : .0025,.002+random()*.003);
    dummy.rotation.set(0,0,random()*.5);dummy.updateMatrix();patches.setMatrixAt(count,dummy.matrix);
    shade.set('#69724e').multiplyScalar(.88+random()*.18);patches.setColorAt(count++,shade);
  }
  patches.instanceMatrix.needsUpdate=true;patches.instanceColor.needsUpdate=true;details.add(patches);
  // Preserve each animated group and its handle. Add rolled lips and the small
  // metal ferrule where the wooden handle enters the cup, as in the close-up.
  for(const ladle of ladles){
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.108,.006,6,24),metal);
    rim.name='rolled-ladle-rim';rim.rotation.x=Math.PI/2;rim.position.set(0,.0525,-.12);ladle.add(rim);
    const ferrule=new THREE.Mesh(new THREE.CylinderGeometry(.026,.022,.095,12),brass);
    ferrule.name='ladle-handle-ferrule';ferrule.rotation.x=Math.PI/2;ferrule.position.set(0,0,.018);ladle.add(ferrule);
  }
  // A dark hollow mouth makes the existing bamboo inlet read as a pipe rather
  // than a capped rod. Its centre matches the inherited falling water stream.
  const mouth=new THREE.Mesh(new THREE.CircleGeometry(.026,16),wet);
  mouth.name='bamboo-inlet-mouth';mouth.position.set(.68,1.22,-.169);details.add(mouth);
  return details;
}
