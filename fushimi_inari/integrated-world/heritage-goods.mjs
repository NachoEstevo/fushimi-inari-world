import * as THREE from 'three';

// All origins are the centre of the bottom surface. Goods are merged by the
// caller's existing staticParts batches; the caller owns every material.
const place=(geometry,position,yaw)=>geometry.rotateY(yaw).translate(...position);
const point=(position,yaw,x,y,z)=>{
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return [position[0]+c*x+s*z,position[1]+y,position[2]-s*x+c*z];
};

export function appendMochi(parts,{position,yaw=0,width=.10,height=.055,depth=.09,material}){
 const geometry=new THREE.SphereGeometry(1,10,7),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),flattened=Math.max(0,(y+1)/2-.075)/.925;
  p.setXYZ(i,x*width*.5*(1+.025*z),flattened*height,z*depth*.5*(1+.025*x));
 }
 geometry.computeVertexNormals();parts.put(place(geometry,position,yaw),material,false);
}

export function appendOmamoriPouch(parts,{position,yaw=0,width=.12,height=.17,depth=.05,body,cord,front=1}){
 // Rounded, flat padded cloth with cut upper corners, not a drawstring vase.
 const thickness=Math.min(depth,width*.28),outline=[[-.40,0],[.40,0],[.50,.07],[.50,.83],[.38,1],[-.38,1],[-.50,.83],[-.50,.07]];
 const vertices=[],uv=[],indices=[],count=outline.length;
 const vertex=(x,y,z)=>{vertices.push(x*width,y*height,z*thickness);uv.push(x+.5,y);};
 for(const side of [1,-1]){
  const base=vertices.length/3;
  for(const [x,y] of outline)vertex(x,y,side*.32);
  for(const [x,y] of outline)vertex(x*.76,.5+(y-.5)*.76,side*.5);
  vertex(0,.5,side*.5);
  const tri=(a,b,c)=>side>0?indices.push(a,b,c):indices.push(a,c,b);
  for(let i=0;i<count;i++){
   const j=(i+1)%count;tri(base+i,base+j,base+count+j);tri(base+i,base+count+j,base+count+i);tri(base+count*2,base+count+i,base+count+j);
  }
 }
 const back=count*2+1;
 for(let i=0;i<count;i++){const j=(i+1)%count;indices.push(i,back+i,back+j,i,back+j,j);}
 const pouch=new THREE.BufferGeometry();pouch.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));pouch.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));pouch.setIndex(indices);pouch.computeVertexNormals();
 parts.put(place(pouch,position,yaw),body,false);
 // The knot and fine embroidery sit on the front plane of the padding.
 const z=front*(thickness*.5+width*.006),y=height*.74;
 for(const side of [-1,1]){
  const loop=new THREE.TorusGeometry(width*.09,width*.012,3,7).translate(side*width*.085,y,z);
  parts.put(place(loop,position,yaw),cord,false);
  parts.beam(point(position,yaw,0,y,z),point(position,yaw,side*width*.13,y-height*.13,z),width*.012,cord,width*.012,4);
 }
 const knot=new THREE.SphereGeometry(width*.026,6,4).translate(0,y,z);
 parts.put(place(knot,position,yaw),cord,false);
 const stitchVertices=[],stitchZ=front*(thickness*.5+width*.002);
 const stitch=(x1,y1,x2,y2)=>{
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),r=width*.004,nx=-dy/len*r,ny=dx/len*r;
  const a=[x1+nx,y1+ny,stitchZ],b=[x1-nx,y1-ny,stitchZ],c=[x2+nx,y2+ny,stitchZ],d=[x2-nx,y2-ny,stitchZ];
  for(const p of front>0?[a,b,c,c,b,d]:[a,c,b,c,d,b])stitchVertices.push(...p);
 };
 for(const side of [-1,1])for(const y of [.24,.33,.42,.51,.60])stitch(side*width*.29,height*y,side*width*.29,height*(y+.024));
 const motif=[[0,.54],[.11,.43],[0,.32],[-.11,.43]];
 for(let i=0;i<motif.length;i++){const a=motif[i],b=motif[(i+1)%motif.length];stitch(a[0]*width,a[1]*height,b[0]*width,b[1]*height);}
 const embroidery=new THREE.BufferGeometry();embroidery.setAttribute('position',new THREE.Float32BufferAttribute(stitchVertices,3));
 parts.put(place(embroidery,position,yaw),cord);
}

export function appendEmaTablet(parts,{position,yaw=0,width=.14,height=.15,depth=.012,wood,cord,front=1}){
 const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);
 shape.lineTo(width/2,height*2/3);shape.lineTo(0,height);shape.lineTo(-width/2,height*2/3);shape.closePath();
 const holeY=height*.80,holeRadius=width*.045,hole=new THREE.Path();
 hole.absarc(0,holeY,holeRadius,0,Math.PI*2,true);shape.holes.push(hole);
 const tablet=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1,curveSegments:4}).translate(0,0,-depth/2);
 parts.put(place(tablet,position,yaw),wood,false);
 // One closed cord passes through the opening and rises above the tablet on
 // both sides, rather than a ring pasted to its face.
 const z=front*(depth/2+width*.04),curve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,holeY,0),new THREE.Vector3(0,holeY,z),
  new THREE.Vector3(-width*.075,height*1.01,z),new THREE.Vector3(-width*.055,height*1.10,z*.65),
  new THREE.Vector3(0,height*1.13,0),new THREE.Vector3(width*.055,height*1.10,-z*.65),
  new THREE.Vector3(width*.075,height*1.01,-z),new THREE.Vector3(0,holeY,-z),
 ],true,'centripetal');
 parts.put(place(new THREE.TubeGeometry(curve,24,width*.012,4,true),position,yaw),cord,false);
 // A discreet rear prop makes the upright display physically supported.
 parts.beam(point(position,yaw,0,.0025,-front*(depth/2+width*.13)),
  point(position,yaw,0,height*.40,-front*depth/2),width*.018,wood,width*.018,4);
}
