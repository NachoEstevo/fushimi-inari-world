import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {roofHeight} from './roof-profile.mjs';

// Video FmRyJ-RtBPg, 00:35–00:50: curved copper roof, exposed red frame,
// shimenawa and paper streamers. Dimensions fit the inherited pavilion footprint.
export function refineTemizuyaCanopy(group){
  if(group.getObjectByName('Temizuya photo-backed canopy'))return;
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
  const details=new THREE.Group();details.name='Temizuya photo-backed canopy';group.add(details);
  const batches=new Map();
  const part=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  const height=(z,x=0)=>2.85+roofHeight(z/2.3,1.05)+.10*Math.pow(Math.abs(x/3.1),6);
  const squareBeam=(a,b,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),g=new THREE.BoxGeometry(.07,.07,v.length());g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),v.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());part(g,mat);};
  const line=(points,r,mat)=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    part(new THREE.TubeGeometry(curve,24,r,5,false),mat);
  };
  const vertices=[],uv=[];
  const widthSegments=24,depthSegments=32;
  for(let i=0;i<depthSegments;i++)for(let j=0;j<widthSegments;j++){
    const z=-2.3+i*4.6/depthSegments,next=z+4.6/depthSegments,x0=-3.1+j*6.2/widthSegments,x1=x0+6.2/widthSegments;
    // Counterclockwise from above: top normals point out of the roof.
    for(const [x,t]of [[x0,z],[x0,next],[x1,z],[x1,z],[x0,next],[x1,next]]){vertices.push(x,height(t,x),t);uv.push((x+3.1)/6.2,(t+2.3)/4.6);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
  // Photo DSC0677 shows a pale soffit behind the red rafters. It follows the
  // same curved skin with a small thickness offset, never a floating flat cap.
  const soffit=geo.clone(),sp=soffit.getAttribute('position'),su=soffit.getAttribute('uv');
  // Reverse triangle winding, not just material side, for the visible underside.
  for(let i=0;i<sp.count;i+=3){
    const px=sp.getX(i+1),py=sp.getY(i+1),pz=sp.getZ(i+1),u=su.getX(i+1),v=su.getY(i+1);
    sp.setXYZ(i+1,sp.getX(i+2),sp.getY(i+2),sp.getZ(i+2));sp.setXYZ(i+2,px,py,pz);
    su.setXY(i+1,su.getX(i+2),su.getY(i+2));su.setXY(i+2,u,v);
  }
  soffit.translate(0,-.085,0);soffit.computeVertexNormals();
  part(geo,copper);part(soffit,paper);
  // Standing seams and the two curved bargeboards follow the same roof profile.
  for(let x=-3;x<=3;x+=.36)line(Array.from({length:17},(_,i)=>{const z=-2.3+i*4.6/16;return [x,height(z,x)+.012,z];}),.009,edge);
  for(const x of [-3.12,3.12])line(Array.from({length:17},(_,i)=>{const z=-2.3+i*4.6/16;return [x,height(z,x)-.04,z];}),.09,red);
  box(6.4,.13,.18,0,3.96,0,edge);
  for(const z of [-1.4,1.4]){
    box(4.65,.24,.22,0,2.67,z,red);
    for(const x of [-2.1,2.1])box(.52,.17,.46,x,2.51,z,red);
  }
  for(let x=-2.9;x<3;x+=.32){
    for(const sign of [-1,1]){
      // Segmented rafters stay below the actual concave copper pitch.
      for(let i=0;i<7;i++){
        const z0=sign*(.04+i*2.22/7),z1=sign*(.04+(i+1)*2.22/7);
        squareBeam([x,height(z0,x)-.14,z0],[x,height(z1,x)-.14,z1],red);
      }
      box(.075,.09,.065,x,height(sign*2.25,x)-.14,sign*2.25,straw);
    }
  }
  for(const z of [-1.58,1.58]){
    line([[-2.15,2.5,z],[0,2.33,z],[2.15,2.5,z]],.032,straw);
    for(let x=-1.9;x<2;x+=.22)box(.014,.18,.014,x,2.24+.035*x*x,z,straw);
    for(const x of [-1.45,-.48,.48,1.45]){
      const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.10,-.06);shape.lineTo(.015,-.16);shape.lineTo(.12,-.22);shape.lineTo(.025,-.34);shape.lineTo(-.05,-.30);shape.lineTo(.02,-.23);shape.lineTo(-.08,-.17);shape.lineTo(.005,-.07);shape.closePath();
      const shide=new THREE.ShapeGeometry(shape);shide.translate(x,2.31+.035*x*x,z+.02);part(shide,paper);
    }
  }
  // Narrow dark fascia and raised corners visible in the front oblique photo.
  for(const z of [-2.3,2.3]){
    for(let i=0;i<24;i++){
      const x0=-3.1+i*6.2/24,x1=-3.1+(i+1)*6.2/24;
      squareBeam([x0,height(z,x0)-.035,z],[x1,height(z,x1)-.035,z],edge);
      squareBeam([x0,height(z,x0)-.105,z],[x1,height(z,x1)-.105,z],edge);
    }
  }
  // Restrained layered bearing blocks: the photographed carved iconography
  // is intentionally not replaced by invented animals or readable inscriptions.
  for(const x of [-2.1,2.1])for(const z of [-1.4,1.4]){
    box(.32,.12,.42,x,2.39,z,red);
    box(.48,.08,.30,x,2.31,z,red);
    box(.30,.045,.32,x,2.26,z,straw);
  }
  let pieces=0,verticesCount=0;
  for(const [mat,parts]of batches){const merged=mergeGeometries(parts);pieces+=parts.length;parts.forEach(g=>g.dispose());if(!merged)throw Error('Temizuya canopy geometry merge failed');verticesCount+=merged.getAttribute('position').count;const mesh=new THREE.Mesh(merged,mat);mesh.castShadow=true;mesh.receiveShadow=true;details.add(mesh);}
  details.userData={sourcePhoto:'https://fushimiinari-guide.com/wp-content/uploads/DSC_0677-2_20190331.jpg',earlierReference:'FmRyJ-RtBPg 00:35-00:50',provenance:'Observed copper roof, dark fascia, raised corners, pale soffit, red rafters with pale ends and layered bearing joinery. Dimensions estimated within inherited 6.2x4.6m canopy envelope. Basin, interaction roots, terrain, columns and collisions retained.',materialBatches:batches.size,sourcePieces:pieces,vertices:verticesCount,roofGrid:[widthSegments,depthSegments],soffitOffset:.085};

}
