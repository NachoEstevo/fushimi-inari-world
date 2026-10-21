import * as THREE from 'three';

// One unlit dome draw plus one night-only point field. Paint clouds only on mode changes.
export function installSky(scene,camera){
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,toneMapped:false});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(6000,48,24),material);
  dome.name='Atmosphere · sparse clouds';dome.frustumCulled=false;dome.renderOrder=-100;
  scene.add(dome);
  const positions=[],sizes=[],phases=[];let starSeed=8402;
  const random=()=>((starSeed=(Math.imul(starSeed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<480;i++){
    const y=.07+random()*.93,az=random()*Math.PI*2,r=Math.sqrt(1-y*y);
    positions.push(Math.cos(az)*r*5000,y*5000,Math.sin(az)*r*5000);
    sizes.push(i%43===0?11:i%7===0?6:2.5+random()*1.5);phases.push(random()*6.28);
  }
  const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  starsGeo.setAttribute('starSize',new THREE.Float32BufferAttribute(sizes,1));starsGeo.setAttribute('phase',new THREE.Float32BufferAttribute(phases,1));
  const starsMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,
    uniforms:{time:{value:0},pixelRatio:{value:Math.min(devicePixelRatio,1.7)}},
    vertexShader:`attribute float starSize;attribute float phase;uniform float pixelRatio;varying float vPhase;
      void main(){vPhase=phase;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=starSize*pixelRatio;}`,
    fragmentShader:`uniform float time;varying float vPhase;
      void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float core=1.-smoothstep(.07,.22,r);
        float halo=exp(-r*r*22.)*.32;float a=(core+halo)*( .88+.12*sin(time*.7+vPhase));
        a*=1.-smoothstep(.43,.5,r);gl_FragColor=vec4(mix(vec3(.75,.86,1.),vec3(1.,.95,.84),.5+.5*sin(vPhase)),a);}`});
  const stars=new THREE.Points(starsGeo,starsMat);stars.frustumCulled=false;stars.renderOrder=-90;scene.add(stars);
  const palettes={
    day:['#3687c7','#89c8ec','#d7e6e7','#f8fbfc','#b9d2e0'],
    gold:['#537fac','#b1c9d6','#f2d4b1','#ffe6ca','#b2b3c2'],
    night:['#081326','#172942','#34465c','#52647b','#293b52']
  };
  function setMode(mode){
    stars.visible=mode==='night';
    const [zenith,middle,horizon,lit,shade]=palettes[mode]??palettes.day;
    const gradient=ctx.createLinearGradient(0,0,0,1024);
    gradient.addColorStop(0,zenith);gradient.addColorStop(.30,middle);
    gradient.addColorStop(.51,horizon);gradient.addColorStop(1,horizon);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,2048,1024);
    // Different widths, heights and separated azimuths; the horizon stays clear.
    for(const [x,y,w,h] of [[220,402,118,22],[650,433,92,16],[1120,350,148,30],[1660,415,108,20]]){
      ctx.save();ctx.filter='blur(5px)';ctx.globalAlpha=mode==='night'?.32:.86;
      const cloud=ctx.createLinearGradient(0,y-h,0,y+h);
      cloud.addColorStop(0,lit);cloud.addColorStop(.55,lit);cloud.addColorStop(1,shade);
      ctx.fillStyle=cloud;ctx.beginPath();
      for(const [dx,dy,sx,sy] of [[-.65,.18,.35,.53],[-.25,-.15,.41,.84],[.13,-.37,.35,1],[.5,.04,.34,.64],[.02,.34,.77,.43]]){
        ctx.moveTo(x+dx*w+w*sx,y+dy*h);
        ctx.ellipse(x+dx*w,y+dy*h,w*sx,h*sy,0,0,Math.PI*2);
      }
      ctx.fill();ctx.restore();
    }
    texture.needsUpdate=true;
  }
  setMode('day');
  return {setMode,update(){dome.position.copy(camera.position);stars.position.copy(camera.position);starsMat.uniforms.time.value=performance.now()/1000;}};
}
