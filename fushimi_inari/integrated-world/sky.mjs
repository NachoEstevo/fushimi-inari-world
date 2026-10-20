import * as THREE from 'three';

// One unlit draw call. Paint only on lighting changes, never every frame.
export function installSky(scene,camera){
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,toneMapped:false});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(6000,48,24),material);
  dome.name='Atmosphere · sparse clouds';dome.frustumCulled=false;dome.renderOrder=-100;
  scene.add(dome);
  const palettes={
    day:['#3687c7','#89c8ec','#d7e6e7','#f8fbfc','#b9d2e0'],
    gold:['#537fac','#b1c9d6','#f2d4b1','#ffe6ca','#b2b3c2'],
    night:['#081326','#172942','#34465c','#52647b','#293b52']
  };
  function setMode(mode){
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
  return {setMode,update(){dome.position.copy(camera.position);}};
}
