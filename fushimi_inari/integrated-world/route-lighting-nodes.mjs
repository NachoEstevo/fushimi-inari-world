import * as THREE from 'three';
import {float,vec3,uv,exp,smoothstep,uniform,instancedBufferAttribute,positionView,screenDPR} from 'three/tsl';

export const LIGHT_PRESETS={
 day:{sun:2.15,color:0xfff0db,sky:0xddeeff,ground:0x73755d,fill:1.55,exposure:1.02,offset:[-45,65,35],glow:0,power:0},
 gold:{sun:2.5,color:0xffa45c,sky:0xe1c4af,ground:0x68544b,fill:1.12,exposure:1.04,offset:[-65,8,35],glow:.55,power:5},
 night:{sun:.34,color:0x9db7ef,sky:0x9aaaca,ground:0x465068,fill:.84,exposure:1.15,offset:[-45,65,35],glow:1,power:16}
};

// Interpretive low path lights. Grounded outside the paved trail; not a survey
// of installed shrine fixtures. Three nearby, shadow-free lights bound GPU cost.
export function routeLightPositions(route,ground,spacing=28){
 const result=[];let accumulated=0;
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
  if(length<1e-6)continue;
  accumulated+=length;if(accumulated<spacing)continue;accumulated%=spacing;
  const x=b[0]-dz/length*2.6,z=b[2]+dx/length*2.6,y=ground(x,z);
  if(Number.isFinite(y)&&Math.abs(y-b[1])<1.2&&result.every(p=>Math.hypot(x-p[0],z-p[2])>12))result.push([x,y,z]);
 }
 return result;
}

export function installRouteLighting(scene,route,ground,{extraRoutes=[],existingLights=[],extraEmitters=[]}={}){
 const positions=routeLightPositions(route,ground);
 for(const extra of extraRoutes)for(const p of routeLightPositions(extra,ground,20))if(positions.every(q=>Math.hypot(p[0]-q[0],p[2]-q[2])>12))positions.push(p);
 const emitters=[...positions.map(([x,y,z])=>[x,y+.9,z]),...extraEmitters];
 for(const light of existingLights){const p=light.getWorldPosition(new THREE.Vector3());emitters.push(p.toArray());light.visible=false;light.intensity=0;}
 const group=new THREE.Group();group.name='Interpretive trail light markers';scene.add(group);
 const posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.13,.82,.13),new THREE.MeshStandardMaterial({color:0x353c36,roughness:.85}),positions.length);
 const glowMaterial=new THREE.MeshBasicMaterial({color:0xffca80,toneMapped:false});
 const heads=new THREE.InstancedMesh(new THREE.BoxGeometry(.16,.18,.16),glowMaterial,positions.length),matrix=new THREE.Matrix4();
 positions.forEach(([x,y,z],i)=>{posts.setMatrixAt(i,matrix.makeTranslation(x,y+.29,z));heads.setMatrixAt(i,matrix.makeTranslation(x,y+.77,z));});
 group.add(posts,heads);
 const strength=uniform(0),radius=uv().sub(.5).length();
 const haloMaterial=new THREE.PointsNodeMaterial({transparent:true,depthWrite:false,
  blending:THREE.AdditiveBlending,toneMapped:false,sizeAttenuation:false,alphaToCoverage:false});
 haloMaterial.positionNode=instancedBufferAttribute(new THREE.InstancedBufferAttribute(
  new Float32Array(positions.flatMap(([x,y,z])=>[x,y+.77,z])),3));
 haloMaterial.sizeNode=float(180).div(positionView.z.negate().max(1)).clamp(4,18).div(screenDPR);
 haloMaterial.colorNode=vec3(1,.65,.28);
 haloMaterial.opacityNode=exp(radius.mul(radius).mul(-24))
  .mul(float(1).sub(smoothstep(.35,.5,radius))).mul(strength);
 const halos=new THREE.Sprite(haloMaterial);halos.count=positions.length;
 halos.frustumCulled=false;group.add(halos);
 const lights=Array.from({length:3},()=>{const light=new THREE.PointLight(0xffbc72,0,11,2);scene.add(light);return light;});
 let preset=LIGHT_PRESETS.day,elapsed=1;
 return {positions,stats:{markers:positions.length,draws:3,dynamicLights:3,shadows:0},setMode(mode){preset=LIGHT_PRESETS[mode]??LIGHT_PRESETS.day;glowMaterial.color.set(preset.glow?0xffca80:0xb9b6a1);strength.value=preset.glow;halos.visible=preset.glow>0;for(const light of lights)light.intensity=0;elapsed=1;},update(camera,dt){
  if(!preset.power)return;elapsed+=dt;if(elapsed<.25)return;elapsed=0;
  const nearest=emitters.map(p=>({p,d:(p[0]-camera.position.x)**2+(p[1]-camera.position.y)**2+(p[2]-camera.position.z)**2})).sort((a,b)=>a.d-b.d);
  lights.forEach((light,i)=>{const entry=nearest[i];light.intensity=entry?preset.power*Math.max(0,Math.min(1,(625-entry.d)/225)):0;if(entry)light.position.fromArray(entry.p);});
 }};
}
