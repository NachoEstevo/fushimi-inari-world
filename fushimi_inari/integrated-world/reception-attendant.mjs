import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Reuse the accepted CC0 character, with a private wardrobe/material instance.
// Two-bone reach keeps the stamp hand on the counter throughout the action.
export function upgradeReceptionAttendant(person){
  let animate=null;
  new GLTFLoader().loadAsync('../assets/models/visitors/Kimono_Female.glb').then(asset=>{
    const model=asset.scene,bounds=new THREE.Box3().setFromObject(model);
    const scale=1.85/bounds.getSize(new THREE.Vector3()).y;
    model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;
    model.traverse(o=>{if(o.isMesh){
      o.material=o.material.clone();
      if(o.material.name==='Clothes')o.material.color.set('#eee9df');
      if(o.material.name==='Band')o.material.color.set('#a92d31');
      o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
    }});
    const bones={};model.traverse(o=>{if(o.isBone)bones[o.name]=o;});
    const limbs=['L','R'].map(side=>['UpperArm','LowerArm','Fist'].map(name=>bones[`${name}${side}`]??bones[`${name}.${side}`]));
    if(limbs.some(l=>l.some(b=>!b)))throw Error('Reception character is missing arm joints');
    const mixer=new THREE.AnimationMixer(model);mixer.clipAction(asset.animations[0]).play();
    // Keep the registered interaction root, replacing only its visual children.
    const geometries=new Set(),materials=new Set();
    person.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});
    for(const geometry of geometries)geometry.dispose();
    for(const material of materials)material.dispose();
    person.clear();person.add(model);person.position.z-=.48;person.name='Reception attendant · Quaternius';
    delete person.userData.attendantRig;
    let previous=null;
    const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),target=new THREE.Vector3(),elbow=new THREE.Vector3(),axis=new THREE.Vector3(),bend=new THREE.Vector3();
    const parentRotation=new THREE.Quaternion(),rotation=new THREE.Quaternion(),handRotation=new THREE.Quaternion(),forward=new THREE.Quaternion(),right=new THREE.Vector3(),origin=new THREE.Vector3();
    const aim=(bone,child,destination)=>{
      bone.getWorldPosition(a);child.getWorldPosition(b);
      rotation.setFromUnitVectors(b.sub(a).normalize(),c.copy(destination).sub(a).normalize());
      bone.getWorldQuaternion(parentRotation);rotation.multiply(parentRotation);
      bone.parent.getWorldQuaternion(parentRotation).invert();bone.quaternion.copy(parentRotation.multiply(rotation));
      bone.updateWorldMatrix(false,true);
    };
    animate=(now,press)=>{
      mixer.update(previous===null?0:Math.min(.05,(now-previous)/1000));previous=now;
      person.updateWorldMatrix(true,true);
      limbs.forEach(([upper,lower,hand],i)=>{
        upper.getWorldPosition(a);lower.getWorldPosition(b);hand.getWorldPosition(c);
        const l1=a.distanceTo(b),l2=b.distanceTo(c);origin.copy(a);
        hand.getWorldQuaternion(handRotation);
        person.getWorldQuaternion(parentRotation);right.set(1,0,0).applyQuaternion(parentRotation);
        forward.setFromAxisAngle(right,-Math.PI/2);handRotation.premultiply(forward);
        target.set(i===0?-.16:.05,1.22-.07*(i===1?press:0),.63);
        person.localToWorld(target);axis.copy(target).sub(origin);
        const distance=THREE.MathUtils.clamp(axis.length(),Math.abs(l1-l2)+.001,l1+l2-.001);axis.normalize();
        const along=(l1*l1-l2*l2+distance*distance)/(2*distance);
        bend.set(0,-1,0).addScaledVector(axis,axis.y).normalize();
        elbow.copy(origin).addScaledVector(axis,along).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-along*along)));
        aim(upper,lower,elbow);aim(lower,hand,target);
        hand.parent.getWorldQuaternion(parentRotation).invert();hand.quaternion.copy(parentRotation.multiply(handRotation));
        hand.scale.setScalar(.72);
      });
    };
    person.userData.importedAttendant=true;
  }).catch(error=>console.warn('Reception character unavailable; retaining existing attendant',error));
  return (now,press)=>{if(!animate)return false;animate(now,press);return true;};
}
