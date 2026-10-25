import * as THREE from 'three';

export const wildlifeBudget = Object.freeze({maxBirds:6, visibleDistance:65, trianglesPerBird:108});

// Illustrative short flights around existing trees. Hidden between flights:
// collider bases do not prove a branch contact suitable for a perched model.
export function birdPose(anchor, index, seconds) {
  const phase=((Math.max(0,seconds)+index*7)%32)/32;
  const flying=phase>.68;
  const t=flying?(phase-.68)/.32:0;
  const angle=t*Math.PI*2;
  return {x:anchor.x+Math.cos(angle)*2.4,y:anchor.y+4.2+Math.cos(t*Math.PI)*Math.cos(t*Math.PI)*5,
    z:anchor.z+Math.sin(angle)*2.4,yaw:-angle,
    wing:Math.sin(seconds*21+index)*.7,flying};
}

export function wildlifeAnchors(colliders, maxBirds=wildlifeBudget.maxBirds, pathDistance) {
  const selected=[];
  for(const collider of colliders??[]) {
    const a=collider.args;
    if(collider.type!=='cylinder'||a?.[5]!=='forest_tree'||![a[0],a[1],a[3]].every(Number.isFinite))continue;
    const anchor={x:a[0],y:a[3],z:a[1]};
    if(pathDistance){const distance=pathDistance(anchor.x,anchor.z)?.distance;if(!Number.isFinite(distance)||distance>20)continue;}
    if(selected.some(p=>Math.hypot(p.x-anchor.x,p.z-anchor.z)<55))continue;
    selected.push(anchor);
    if(selected.length>=Math.max(0,Math.min(6,maxBirds)))break;
  }
  return maxBirds<=0?[]:selected;
}

export function createForestWildlife(assembly) {
  const root=assembly.root;
  const group=new THREE.Group();group.name='quiet-forest-birds';
  const anchors=wildlifeAnchors(assembly.colliders,wildlifeBudget.maxBirds,assembly.pathDistance);
  const bodyGeo=new THREE.SphereGeometry(1,6,4);
  const wingGeo=new THREE.BufferGeometry();
  wingGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.24,0,-.04,.12,0,.16],3));
  wingGeo.computeVertexNormals();
  const detailGeo=new THREE.ConeGeometry(1,1,4);detailGeo.rotateX(-Math.PI/2);
  const material=new THREE.MeshStandardMaterial({color:'#514e43',roughness:1,side:THREE.DoubleSide});
  const birds=anchors.map((anchor,index)=>{
    const bird=new THREE.Group();bird.name=`forest-bird-${index}`;bird.visible=false;
    const body=new THREE.Mesh(bodyGeo,material);body.scale.set(.085,.075,.15);bird.add(body);
    const head=new THREE.Mesh(bodyGeo,material);head.scale.setScalar(.06);head.position.set(0,.06,-.12);bird.add(head);
    const beak=new THREE.Mesh(detailGeo,material);beak.scale.set(.025,.025,.065);beak.position.set(0,.055,-.19);bird.add(beak);
    const tail=new THREE.Mesh(detailGeo,material);tail.scale.set(.05,.025,.14);tail.rotation.y=Math.PI;tail.position.z=.19;bird.add(tail);
    const wings=[-1,1].map(side=>{
      const pivot=new THREE.Group(),wing=new THREE.Mesh(wingGeo,material);
      wing.scale.x=side;pivot.add(wing);bird.add(pivot);return pivot;
    });
    group.add(bird);return {anchor,bird,wings,index};
  });
  root.add(group);
  function update(camera,seconds) {
    for(const {anchor,bird,wings,index} of birds) {
      const pose=birdPose(anchor,index,seconds);
      bird.visible=pose.flying&&Math.hypot(camera.position.x-pose.x,camera.position.y-pose.y,camera.position.z-pose.z)<wildlifeBudget.visibleDistance;
      if(!bird.visible)continue;
      bird.position.set(pose.x,pose.y,pose.z);bird.rotation.y=pose.yaw;
      wings[0].rotation.z=pose.wing;wings[1].rotation.z=-pose.wing;
    }
  }
  // No sound source: ambient-audio.mjs already owns the uguisu recording.
  return {group,count:birds.length,update,dispose(){group.removeFromParent();bodyGeo.dispose();wingGeo.dispose();detailGeo.dispose();material.dispose();}};
}
