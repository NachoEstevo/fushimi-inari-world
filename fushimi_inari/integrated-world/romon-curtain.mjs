import * as THREE from 'three';

// Coordinates derive from build_z01_romon_gate and the GLB export rotation.
// Replace only the three central panels and their raised blue cylinders.
export function isCurtainTriangle(a,b,c){
  return [a,b,c].every(p=>Math.abs(p[0])<1.63&&p[1]>3.50&&p[1]<4.80&&p[2]>2.48&&p[2]<2.64);
}

export function refineRomonCurtain(scene){
  const targets=[];
  scene.traverse(mesh=>{
    if(mesh.isMesh&&/White_Shikku_Plaster|Blue_Hengaku_Plaque/.test(mesh.material.name))targets.push(mesh);
  });
  for(const mesh of targets){
    const source=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone(),p=source.attributes.position,keep=[];
    for(let i=0;i<p.count;i+=3){
      const points=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]);
      if(!isCurtainTriangle(...points))keep.push(i,i+1,i+2);
    }
    const geometry=new THREE.BufferGeometry();
    for(const [name,attribute] of Object.entries(source.attributes)){
      const data=new attribute.array.constructor(keep.length*attribute.itemSize);
      keep.forEach((i,j)=>data.set(attribute.array.subarray(i*attribute.itemSize,(i+1)*attribute.itemSize),j*attribute.itemSize));
      geometry.setAttribute(name,new THREE.BufferAttribute(data,attribute.itemSize,attribute.normalized));
    }
    geometry.computeBoundingSphere();mesh.geometry=geometry;source.dispose();
  }
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=640;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#e6e3d5';ctx.fillRect(0,0,512,640);
  ctx.strokeStyle='rgba(100,95,77,.045)';ctx.lineWidth=1;
  for(let x=0;x<512;x+=3){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,640);ctx.stroke();}
  for(let y=0;y<640;y+=3){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}
  // Preserve the authored navy circular motif, now ink rather than glossy metal.
  ctx.fillStyle='#162447';ctx.beginPath();ctx.arc(256,320,100,0,Math.PI*2);ctx.fill();
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const material=new THREE.MeshStandardMaterial({map,roughness:1,metalness:0,side:THREE.DoubleSide});
  const group=new THREE.Group();group.name='Romon cloth panels · integrated repair';
  for(const x of [-1.1,0,1.1]){
    const geo=new THREE.PlaneGeometry(1.02,1.25,16,1),p=geo.attributes.position;
    for(let i=0;i<p.count;i++)p.setZ(i,.006*Math.sin(p.getX(i)*26));
    geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);
    mesh.position.set(x,4.15,2.58);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }
  scene.add(group);
}
