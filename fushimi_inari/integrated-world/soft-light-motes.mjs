import * as THREE from 'three/webgpu';
import {float,vec3,uniform,instancedBufferAttribute,varying,uv,sin,exp,smoothstep} from 'three/tsl';

// Sparse drifting dust, with stable GPU buffers. The shell wraps in world
// coordinates and fades before its edge, so it never follows the gaze as dirt.
export function createSoftLightMotes(){
 const capacity=72,data=new Float32Array(capacity*4);let seed=214577;
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<data.length;i+=4){data[i]=random()*48;data[i+1]=random()*9;data[i+2]=random()*48;data[i+3]=random()*Math.PI*2;}
 const geometry=new THREE.PlaneGeometry(1,1),seeds=new THREE.InstancedBufferAttribute(data,4);
 geometry.setAttribute('moteSeed',seeds);
 const point=instancedBufferAttribute(seeds),time=uniform(0),anchor=uniform(new THREE.Vector3());
 const phase=point.w,drift=time.mul(.045),half=24;
 const wrap=(value,center,span)=>value.sub(center).add(span/2).div(span).fract().mul(span).sub(span/2);
 const x=wrap(point.x.add(drift).add(sin(time.mul(.13).add(phase)).mul(.3)),anchor.x,48);
 const z=wrap(point.z.add(time.mul(.025)).add(sin(time.mul(.09).add(phase.mul(2))).mul(.4)),anchor.z,48);
 const y=wrap(point.y.add(time.mul(.018)),anchor.y.add(2.8),9).add(2.8);
 const offset=vec3(x,y,z),distance=varying(offset.length());
 const radius=uv().sub(.5).length(),edge=float(1).sub(smoothstep(.28,.5,radius));
 const halo=exp(radius.mul(radius).mul(-28)).mul(edge);
 const fade=smoothstep(1.8,3.8,distance).mul(float(1).sub(smoothstep(16,half,distance)));
 const material=new THREE.PointsNodeMaterial({transparent:true,depthWrite:false,depthTest:true,
  toneMapped:false,fog:true,sizeAttenuation:false,alphaToCoverage:false});
 material.positionNode=anchor.add(offset);material.sizeNode=sin(phase.mul(3)).mul(.6).add(1.9);
 const vertical=smoothstep(-1.7,-.5,y).mul(float(1).sub(smoothstep(5.4,7.3,y)));
 material.colorNode=vec3(.98,.94,.8);material.opacityNode=halo.mul(fade).mul(vertical).mul(.3);
 const mesh=new THREE.Sprite(material);mesh.geometry=geometry;mesh.count=28;
 mesh.name='Soft light · floating motes';mesh.userData.environmentTransient=true;mesh.visible=false;mesh.frustumCulled=false;
 mesh.castShadow=false;mesh.receiveShadow=false;
 const stats={capacity,count:mesh.count,draws:0,extraLights:0,textures:0,renderTargets:0,gpuAnimated:true};
 let enabled=false,reduced=false,disposed=false;
 const sync=()=>{mesh.visible=enabled&&!reduced&&!disposed;stats.draws=Number(mesh.visible);};
 return {mesh,stats,setEnabled(value){enabled=!!value;sync();},setReducedMotion(value){reduced=!!value;sync();},
  setQuality(mode){mesh.count=mode==='high'||mode==='ultra'?capacity:28;stats.count=mesh.count;},
  update(position,seconds){
   if(disposed||!mesh.visible||!Number.isFinite(position.x)||!Number.isFinite(position.y)||!Number.isFinite(position.z))return;
   anchor.value.copy(position);time.value=Number.isFinite(seconds)?seconds:0;
  },dispose(){if(disposed)return;disposed=true;sync();geometry.dispose();material.dispose();mesh.removeFromParent();}
 };
}
