import * as THREE from 'three';

// Only the preserved 3x3 leaf-card topology is understood here. Keep every
// card, its corner UVs and authored normals; retain a coarse curved interior.
// Unknown assets retain their original two-level policy without approximation.
export function coarseFoliageCards(source){
 const position=source.attributes.position,index=source.index;
 if(!position||!source.attributes.normal||!source.attributes.uv||!index||position.count%16||index.count!==position.count/16*54)return null;
 if(position.itemSize!==3||source.attributes.normal.itemSize!==3||source.attributes.uv.itemSize!==2||index.itemSize!==1)return null;
 if(source.groups.length||Object.keys(source.morphAttributes).length||source.drawRange.start!==0||source.drawRange.count<index.count)return null;
 const attributes=Object.entries(source.attributes);
 for(const [,attribute]of attributes){
  if(attribute.isInterleavedBufferAttribute||attribute.count!==position.count||!attribute.array.every(Number.isFinite))return null;
 }
 const cards=position.count/16;
 if(!cards)return null;
 for(let card=0;card<cards;card++)for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const a=card*16+row*4+col,b=a+4,d=a+1,expected=[a,b,d,b,b+1,d],offset=card*54+(row*3+col)*6;
  for(let i=0;i<6;i++)if(index.getX(offset+i)!==expected[i])return null;
 }
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let card=0;card<cards;card++)for(const triangle of [[0,12,3],[12,15,3]]){
  a.fromBufferAttribute(position,card*16+triangle[0]);b.fromBufferAttribute(position,card*16+triangle[1]);c.fromBufferAttribute(position,card*16+triangle[2]);
  if(b.sub(a).cross(c.sub(a)).lengthSq()<1e-14)return null;
 }
 const geometry=new THREE.BufferGeometry(),indices=[];
 for(const [name,attribute]of attributes){
  const values=new attribute.array.constructor(cards*9*attribute.itemSize);
  for(let card=0;card<cards;card++)for(let row=0;row<3;row++)for(let col=0;col<3;col++){
   const x=col*1.5,y=row*1.5,x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(3,x0+1),y1=Math.min(3,y0+1),tx=x-x0,ty=y-y0;
   const to=(card*9+row*3+col)*attribute.itemSize;
   const at=(xx,yy,k)=>attribute.array[(card*16+yy*4+xx)*attribute.itemSize+k];
   for(let k=0;k<attribute.itemSize;k++)values[to+k]=(1-ty)*((1-tx)*at(x0,y0,k)+tx*at(x1,y0,k))+ty*((1-tx)*at(x0,y1,k)+tx*at(x1,y1,k));
   if(name==='normal'&&(tx||ty)){
    const length=Math.hypot(values[to],values[to+1],values[to+2]);
    if(length>1e-8)for(let k=0;k<3;k++)values[to+k]/=length;
   }
  }
  geometry.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize,attribute.normalized));
 }
 for(let card=0;card<cards;card++)for(let row=0;row<2;row++)for(let col=0;col<2;col++){
  const a=card*9+row*3+col,b=a+3,d=a+1;indices.push(a,b,d,b,b+1,d);
 }
 geometry.setIndex(indices);
 if(!source.boundingBox)source.computeBoundingBox();if(!source.boundingSphere)source.computeBoundingSphere();
 // Full source bounds stay conservative across the simplified curvature.
 geometry.boundingBox=source.boundingBox.clone();geometry.boundingSphere=source.boundingSphere.clone();
 geometry.name='Preserved crown · whole leaf cards';return geometry;
}

// Both meshes use the same card UV domain and diagonal direction. Overlay the
// thirds and halves on a sixths lattice: all intersections of the two triangle
// meshes lie on it. A linear displacement reaches its maximum at a vertex.
export function crownCardDeviation(source,middle){
 const nearPosition=source.attributes.position,midPosition=middle.attributes.position;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),nearPoint=new THREE.Vector3(),midPoint=new THREE.Vector3();
 function point(attribute,card,steps,x,y,out){
  const i=Math.min(steps-1,Math.floor(x*steps)),j=Math.min(steps-1,Math.floor(y*steps));
  const u=x*steps-i,v=y*steps-j,side=steps+1,base=card*side*side+j*side+i;
  b.fromBufferAttribute(attribute,base+1);c.fromBufferAttribute(attribute,base+side);
  if(u+v<=1)return out.copy(a.fromBufferAttribute(attribute,base)).multiplyScalar(1-u-v).addScaledVector(b,u).addScaledVector(c,v);
  return out.copy(a.fromBufferAttribute(attribute,base+side+1)).multiplyScalar(u+v-1).addScaledVector(b,1-v).addScaledVector(c,1-u);
 }
 let maximum=0;
 for(let card=0;card<nearPosition.count/16;card++)for(let y=0;y<=6;y++)for(let x=0;x<=6;x++){
  point(nearPosition,card,3,x/6,y/6,nearPoint);point(midPosition,card,2,x/6,y/6,midPoint);
  maximum=Math.max(maximum,nearPoint.distanceToSquared(midPoint));
 }
 return Math.sqrt(maximum);
}
