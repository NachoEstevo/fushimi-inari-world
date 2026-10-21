import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

export function installVisitors(assembly){
  const people=[],reception=assembly.root.getObjectByName('Mapped shrine reception'),world=new THREE.Vector3();
  // Authored waiting spots outside the existing counter, not a navigation simulation.
  const specs=[
    [1,14.0,Math.PI], [4.3,14.2,Math.PI], [7.1,14.4,2.5],
    [8.2,15.5,-.8], [9.1,14.8,2.3]
  ];
  if(!reception)return {update(){},count:0};
  for(const [i,[x,z,yaw]] of specs.entries()){
    const p={root:new THREE.Group()};p.root.name=`Visitor ${i+1}`;
    reception.localToWorld(world.set(x,0,z));world.y=assembly.walkHeight(world.x,world.z)+.03;
    reception.worldToLocal(world);p.root.position.copy(world);p.root.rotation.y=yaw;reception.add(p.root);
    people.push(p);
  }
  const loader=new GLTFLoader(),files=['Casual_Male','Kimono_Female','Casual_Female'];
  const templates=files.map(file=>loader.loadAsync(`../assets/models/visitors/${file}.glb`));
  people.forEach((p,i)=>{templates[i%3].then(asset=>{
    const model=clone(asset.scene),bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=(i%2?1.64:1.76)/size.y;
    const wrapper=new THREE.Group();model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;wrapper.add(model);
    wrapper.position.copy(p.root.position);wrapper.rotation.copy(p.root.rotation);wrapper.name=p.root.name+' · Quaternius';
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    p.root.parent.add(wrapper);p.root.removeFromParent();p.root=wrapper;p.mixer=new THREE.AnimationMixer(model);
    const idle=asset.animations.find(a=>/idle/i.test(a.name))??asset.animations[0];if(idle){const action=p.mixer.clipAction(idle);action.play();action.time=i*.63%idle.duration;action.timeScale=.9+i*.04;}
  }).catch(error=>console.warn('Visitor asset unavailable',error));});
  let lastTime=null;
  return {update(camera,time){const dt=lastTime===null?0:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;for(const p of people){
    p.root.getWorldPosition(world);p.root.visible=world.distanceToSquared(camera.position)<85*85;if(!p.root.visible)continue;
    p.mixer?.update(dt);
  }},count:people.length};
}
