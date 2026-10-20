import * as THREE from 'three';
let material;

// Small evergreen sprays with a cutout silhouette. Shared by all LOD levels;
// alphaTest writes depth, avoiding transparent sorting of thousands of crowns.
export function leafClusterMaterial(){
  if(material)return material;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.strokeStyle='#78866a';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(20,108);ctx.lineTo(106,20);ctx.stroke();
  for(let i=0;i<9;i++){
    const t=(i+1)/10,side=i%2?1:-1;
    const x=20+t*86+side*10,y=108-t*88+side*10;
    ctx.save();ctx.translate(x,y);ctx.rotate(side>0?.15:-1.55);
    ctx.fillStyle=i%3===0?'#c1cda8':i%3===1?'#a0b589':'#d4ddbf';
    ctx.beginPath();ctx.ellipse(0,0,17,6.5,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#829c69';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(14,0);ctx.stroke();ctx.restore();
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  material=new THREE.MeshStandardMaterial({map,alphaTest:.4,alphaToCoverage:true,vertexColors:true,side:THREE.DoubleSide,roughness:.78});
  return material;
}
