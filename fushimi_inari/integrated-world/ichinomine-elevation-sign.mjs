import * as THREE from 'three';

// Two independent visits show the summit notice on a low granite base.
// https://blog-imgs-90.fc2.com/k/y/o/kyoto1966/372-7.jpg (January 2016)
// https://livingkyo.com/wp-content/uploads/2019/08/500_2.png (July 2019)
export function replaceSummitMarker(canopy,createCanvas){
  const compound=canopy.parent,near=(n,k)=>Math.abs(n-k)<.002;
  const post=compound?.children.find(o=>o.geometry?.parameters?.width===.34&&
    o.geometry.parameters.height===2.85&&near(o.position.x,-4.2)&&near(o.position.z,1.65));
  const cap=compound?.children.find(o=>o.geometry?.parameters?.radius===.28&&
    o.geometry.parameters.height===.25&&near(o.position.x,-4.2)&&near(o.position.z,1.65));
  const lantern=compound?.children.find(o=>o.isGroup&&near(o.position.x,-3.75)&&near(o.position.z,2.45));
  const pedestal=lantern?.children.find(o=>o.geometry?.parameters?.width===.62&&o.geometry.parameters.height===.45);
  if(!post||!cap||!pedestal)return null;
  const canvas=createCanvas();canvas.width=256;canvas.height=160;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.fillStyle='#e3dfd0';ctx.fillRect(0,0,256,160);
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const [text,y,size,color] of [['標高233m',23,18,'#527678'],['稲荷山',47,18,'#8d4f3e'],['山 頂',88,48,'#aa4938'],['TOP OF THE MOUNTAIN',130,13,'#8d4f3e']]){
    ctx.fillStyle=color;ctx.font='bold '+size+'px sans-serif';ctx.fillText(text,128,y);
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map,roughness:.97});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(.41,.256),material);
  sign.name='Ichinomine summit elevation notice';sign.receiveShadow=true;
  sign.position.set(0,.012,.312);pedestal.add(sign);
  const removed=[post,cap].map(mesh=>({mesh,index:compound.children.indexOf(mesh)}));
  for(const {mesh} of removed)mesh.removeFromParent();
  return {source:'https://livingkyo.com/wp-content/uploads/2019/08/500_2.png',dispose(){
    sign.removeFromParent();sign.geometry.dispose();material.dispose();map.dispose();
    for(const {mesh,index} of removed)if(!mesh.parent){compound.add(mesh);compound.children.splice(compound.children.indexOf(mesh),1);compound.children.splice(index,0,mesh);}
  }};
}
