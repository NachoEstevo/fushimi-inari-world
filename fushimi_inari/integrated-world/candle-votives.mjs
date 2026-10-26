import * as THREE from 'three';

// Shared low-poly assets per cabinet: no light sources or transparent overdraw.
export function createVotiveAssets(){
  const flameGeometry=new THREE.LatheGeometry([
    new THREE.Vector2(0,-.04),new THREE.Vector2(.010,-.034),
    new THREE.Vector2(.014,-.018),new THREE.Vector2(.010,.004),
    new THREE.Vector2(.004,.024),new THREE.Vector2(0,.040)
  ],6);
  const positions=flameGeometry.attributes.position,colors=[];
  for(let i=0;i<positions.count;i++){
    const y=positions.getY(i),color=new THREE.Color();
    color.setRGB(1,y<-.022?.83:y<.008?.58:.32,y<-.022?.34:.055);
    colors.push(color.r,color.g,color.b);
  }
  flameGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const flameMaterial=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  const waxMaterial=new THREE.MeshStandardMaterial({color:0xe5d3b0,roughness:.86,emissive:0x36200c,emissiveIntensity:.18});
  const wickGeometry=new THREE.CylinderGeometry(.0018,.0023,.012,4);
  const wickMaterial=new THREE.MeshBasicMaterial({color:0x302019});
  return {flameGeometry,flameMaterial,waxMaterial,wickGeometry,wickMaterial,
    dispose(){for(const asset of [flameGeometry,flameMaterial,waxMaterial,wickGeometry,wickMaterial])asset.dispose();}};
}

export const votiveFlicker=(time,phase)=>.94+.035*Math.sin(time*.0047+phase)+.025*Math.sin(time*.011+phase*1.7);
