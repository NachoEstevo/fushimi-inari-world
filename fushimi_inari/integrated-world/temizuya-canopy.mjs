import * as THREE from 'three';
import {roofHeight} from './roof-profile.mjs';

// Video FmRyJ-RtBPg, 00:35–00:50: curved copper roof, exposed red frame,
// shimenawa and paper streamers. Dimensions fit the inherited pavilion footprint.
export function refineTemizuyaCanopy(group){
  const roof=group.children.find(o=>o.geometry?.parameters?.width===6.2);
  const ridge=group.children.find(o=>o.geometry?.parameters?.width===6.4);
  if(!roof)return;
  roof.removeFromParent();ridge?.removeFromParent();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#67947f';ctx.fillRect(0,0,256,256);
  let seed=184;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<1800;i++){
    ctx.fillStyle=i%3?'rgba(35,66,47,.08)':'rgba(188,166,94,.12)';
    ctx.fillRect(random()*256,random()*256,2+random()*8,1+random()*16);
  }
  ctx.strokeStyle='rgba(27,48,36,.24)';ctx.lineWidth=1;
  for(let y=8;y<256;y+=12){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  const copper=new THREE.MeshStandardMaterial({map,roughness:.67,metalness:.38,side:THREE.DoubleSide});
  const edge=new THREE.MeshStandardMaterial({color:'#305d51',roughness:.78,metalness:.2});
  const red=new THREE.MeshStandardMaterial({color:'#b33924',roughness:.8});
  const straw=new THREE.MeshStandardMaterial({color:'#b7a071',roughness:1});
  const paper=new THREE.MeshStandardMaterial({color:'#f0eee4',roughness:1,side:THREE.DoubleSide});
  const box=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.receiveShadow=true;group.add(m);};
  const height=z=>2.85+roofHeight(z/2.3,1.05);
  const line=(points,r,mat)=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,r,5,false),mat);group.add(mesh);
  };
  const vertices=[],uv=[];
  for(let i=0;i<32;i++){
    const z=-2.3+i*4.6/32,next=z+4.6/32;
    for(const [x,t] of [[-3.1,z],[-3.1,next],[3.1,z],[3.1,z],[-3.1,next],[3.1,next]]){vertices.push(x,height(t),t);uv.push((x+3.1)/6.2,(t+2.3)/4.6);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
  const skin=new THREE.Mesh(geo,copper);skin.castShadow=true;skin.receiveShadow=true;group.add(skin);
  // Standing seams and the two curved bargeboards follow the same roof profile.
  for(let x=-3;x<=3;x+=.36)line(Array.from({length:17},(_,i)=>{const z=-2.3+i*4.6/16;return [x,height(z)+.012,z];}),.009,edge);
  for(const x of [-3.12,3.12])line(Array.from({length:17},(_,i)=>{const z=-2.3+i*4.6/16;return [x,height(z)-.04,z];}),.09,red);
  box(6.4,.13,.18,0,3.96,0,edge);
  for(const z of [-1.4,1.4]){
    box(4.65,.24,.22,0,2.67,z,red);
    for(const x of [-2.1,2.1])box(.52,.17,.46,x,2.51,z,red);
  }
  for(let x=-2.9;x<3;x+=.32){
    for(const sign of [-1,1]){
      const beam=new THREE.Mesh(new THREE.BoxGeometry(.075,.09,2.52),red);
      beam.position.set(x,3.33,sign*1.12);beam.rotation.x=sign*.34;group.add(beam);
    }
  }
  for(const z of [-1.58,1.58]){
    line([[-2.15,2.5,z],[0,2.33,z],[2.15,2.5,z]],.032,straw);
    for(let x=-1.9;x<2;x+=.22)box(.014,.18,.014,x,2.24+.035*x*x,z,straw);
    for(const x of [-1.45,-.48,.48,1.45]){
      const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.10,-.06);shape.lineTo(.015,-.16);shape.lineTo(.12,-.22);shape.lineTo(.025,-.34);shape.lineTo(-.05,-.30);shape.lineTo(.02,-.23);shape.lineTo(-.08,-.17);shape.lineTo(.005,-.07);shape.closePath();
      const shide=new THREE.Mesh(new THREE.ShapeGeometry(shape),paper);shide.position.set(x,2.31+.035*x*x,z+.02);group.add(shide);
    }
  }
}
