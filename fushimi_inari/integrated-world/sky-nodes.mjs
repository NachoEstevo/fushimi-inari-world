import * as THREE from 'three';
import {SUN_DIRECTIONS,GOLDEN_ATMOSPHERE} from './atmosphere-profile.mjs';
import {float,vec3,mix,sin,exp,smoothstep,uv,uniform,instancedBufferAttribute,varying,screenDPR} from 'three/tsl';

// Canvas textures repaint only on appearance changes; cloud motion stays on the GPU.
export const SKY_SUN_DIRECTIONS=SUN_DIRECTIONS;
export const SKY_CLOUD_DRIFT=.0018;
export const skyDistanceScale=far=>Math.min(1,far/7500);
export function installSky(scene,camera){
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,toneMapped:false,fog:false});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(6000,48,24),material);
  dome.name='Atmosphere · sparse clouds';dome.frustumCulled=false;dome.renderOrder=-100;
  scene.add(dome);
  const cloudCanvas=document.createElement('canvas');cloudCanvas.width=2048;cloudCanvas.height=1024;
  const cloudCtx=cloudCanvas.getContext('2d'),cloudTexture=new THREE.CanvasTexture(cloudCanvas);
  cloudTexture.colorSpace=THREE.SRGBColorSpace;
  const cloudMaterial=new THREE.MeshBasicMaterial({map:cloudTexture,side:THREE.BackSide,transparent:true,depthWrite:false,toneMapped:false,fog:false});
  const clouds=new THREE.Mesh(new THREE.SphereGeometry(5800,48,24),cloudMaterial);
  clouds.name='Drifting sky clouds';clouds.frustumCulled=false;clouds.renderOrder=-95;scene.add(clouds);
  const sunRadius=uv().sub(.5).length();
  const sunCore=float(1).sub(smoothstep(.104,.115,sunRadius));
  const sunHalo=exp(sunRadius.mul(sunRadius).mul(-24)).mul(.25);
  const sunMaterial=new THREE.SpriteNodeMaterial({transparent:true,depthWrite:false,toneMapped:false,fog:false});
  const sunTint=uniform(new THREE.Color('#fff4d0'));
  sunMaterial.colorNode=vec3(sunTint);
  sunMaterial.opacityNode=sunCore.add(sunHalo).mul(float(1).sub(smoothstep(.4,.5,sunRadius)));
  const sunDisc=new THREE.Sprite(sunMaterial);sunDisc.name='Solar disc';sunDisc.scale.setScalar(350);
  sunDisc.frustumCulled=false;sunDisc.renderOrder=-98;scene.add(sunDisc);
  const sunDirection=new THREE.Vector3();
  const startedAt=performance.now()/1000;
  const positions=[],sizes=[],phases=[];let starSeed=8402;
  const random=()=>((starSeed=(Math.imul(starSeed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<480;i++){
    const y=.07+random()*.93,az=random()*Math.PI*2,r=Math.sqrt(1-y*y);
    positions.push(Math.cos(az)*r*5000,y*5000,Math.sin(az)*r*5000);
    sizes.push(i%43===0?11:i%7===0?6:2.5+random()*1.5);phases.push(random()*6.28);
  }
  // WebGPU point primitives are always one pixel: instanced sprite quads retain
  // the original circular profile and screen-space sizes on both backends.
  const starTime=uniform(0),distanceScale=uniform(skyDistanceScale(camera.far));
  const phase=varying(instancedBufferAttribute(new THREE.InstancedBufferAttribute(new Float32Array(phases),1)));
  const radius=uv().sub(.5).length();
  const core=float(1).sub(smoothstep(.07,.22,radius));
  const halo=exp(radius.mul(radius).mul(-22)).mul(.32);
  const alpha=core.add(halo).mul(sin(starTime.mul(.7).add(phase)).mul(.12).add(.88))
    .mul(float(1).sub(smoothstep(.43,.5,radius)));
  const starsMat=new THREE.PointsNodeMaterial({transparent:true,depthWrite:false,toneMapped:false,fog:false,
    blending:THREE.AdditiveBlending,sizeAttenuation:false,alphaToCoverage:false});
  starsMat.positionNode=instancedBufferAttribute(new THREE.InstancedBufferAttribute(new Float32Array(positions),3)).mul(distanceScale);
  starsMat.sizeNode=instancedBufferAttribute(new THREE.InstancedBufferAttribute(new Float32Array(sizes),1)).mul(screenDPR.min(1.7)).div(screenDPR);
  starsMat.colorNode=mix(vec3(.75,.86,1),vec3(1,.95,.84),sin(phase).mul(.5).add(.5));
  starsMat.opacityNode=alpha;
  const stars=new THREE.Sprite(starsMat);stars.count=phases.length;
  stars.frustumCulled=false;stars.renderOrder=-90;scene.add(stars);
  const palettes={
    day:['#3687c7','#89c8ec','#d7e6e7','#f8fbfc','#b9d2e0'],
    gold:GOLDEN_ATMOSPHERE.skyPalette,
    night:['#081326','#172942','#34465c','#52647b','#293b52']
  };
  // Creative palettes retain each time-of-day's brightness: night remains dark.
  const creativePalettes={
    sakura:{
      day:['#a889bb','#dfb5ce','#f4d3d3','#fff1ec','#cda5bf'],
      gold:['#8d709f','#d88f9b',GOLDEN_ATMOSPHERE.horizon,'#ffd0ad','#aa737e'],
      night:['#17152d','#30213e','#493047','#6e506a','#382c49']
    },
    dreamcore:{
      day:['#929ed3','#c0cbe8','#e8ddd6','#fff5e8','#bdc1dc'],
      gold:['#9189bc','#cb9ba5',GOLDEN_ATMOSPHERE.horizon,'#ffdbc0','#b18491'],
      night:['#111a30','#242c46','#3c4158','#62667e','#2f3650']
    }
  };
  let mode='day',look='natural';
  function paint(){
    stars.visible=mode==='night';sunDisc.visible=mode!=='night';
    sunTint.value.set(mode==='gold'?GOLDEN_ATMOSPHERE.disc:'#fff4d0');
    sunDirection.fromArray(SKY_SUN_DIRECTIONS[mode]??SKY_SUN_DIRECTIONS.day).normalize().multiplyScalar(5400);
    const [zenith,middle,horizon,lit,shade]=(creativePalettes[look]??palettes)[mode];
    const gradient=ctx.createLinearGradient(0,0,0,1024);
    gradient.addColorStop(0,zenith);gradient.addColorStop(.30,middle);
    gradient.addColorStop(.51,horizon);gradient.addColorStop(1,horizon);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,2048,1024);
    cloudCtx.clearRect(0,0,2048,1024);
    // Broken banks leave blue sky and a clear sunset horizon between them.
    for(const [x,y,w,h] of [[180,402,118,22],[520,433,92,16],[850,350,148,30],[1200,415,108,20],[1530,330,96,22],[1840,440,125,19]]){
      cloudCtx.save();cloudCtx.filter='blur(5px)';cloudCtx.globalAlpha=mode==='night'?.32:.86;
      const cloud=cloudCtx.createLinearGradient(0,y-h,0,y+h);
      cloud.addColorStop(0,lit);cloud.addColorStop(.55,lit);cloud.addColorStop(1,shade);
      cloudCtx.fillStyle=cloud;cloudCtx.beginPath();
      for(const [dx,dy,sx,sy] of [[-.65,.18,.35,.53],[-.25,-.15,.41,.84],[.13,-.37,.35,1],[.5,.04,.34,.64],[.02,.34,.77,.43]]){
        cloudCtx.moveTo(x+dx*w+w*sx,y+dy*h);
        cloudCtx.ellipse(x+dx*w,y+dy*h,w*sx,h*sy,0,0,Math.PI*2);
      }
      cloudCtx.fill();cloudCtx.restore();
    }
    texture.needsUpdate=true;cloudTexture.needsUpdate=true;
  }
  function setMode(value){
    const next=Object.hasOwn(palettes,value)?value:'day';
    if(next===mode)return;
    mode=next;paint();
  }
  function setLook(value){
    const next=Object.hasOwn(creativePalettes,value)?value:'natural';
    if(next===look)return;
    look=next;paint();
  }
  paint();
  return {setMode,setLook,update(){
    const seconds=performance.now()/1000,scale=skyDistanceScale(camera.far);
    dome.scale.setScalar(scale);clouds.scale.setScalar(scale);distanceScale.value=scale;
    sunDisc.scale.setScalar(350*scale);
    dome.position.copy(camera.position);clouds.position.copy(camera.position);stars.position.copy(camera.position);
    sunDisc.position.copy(camera.position).addScaledVector(sunDirection,scale);
    clouds.rotation.y=(seconds-startedAt)*SKY_CLOUD_DRIFT;starTime.value=seconds;
  }};
}
