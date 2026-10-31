import * as THREE from 'three';

const MAX_VERTICES=40000,DESIRED_SPACING=.2,MAX_RISER_DEPTH=6,RISER_THRESHOLD=.075;
// Source graph elevations only guide floor selection; the walk surface owns Y.
export async function createTrailGuide({points,walkHeight,yieldWork=async()=>{},isCancelled=()=>false}){
 const start=performance.now();
 if(!Array.isArray(points)||points.length<2||typeof walkHeight!=='function'||isCancelled())return null;
 const lengths=new Float64Array(points.length);let total=0;
 for(let i=0;i<points.length;i++){
  const p=points[i];if(!Array.isArray(p)||p.length<3||!Number.isFinite(p[0])||!Number.isFinite(p[1])||!Number.isFinite(p[2]))return null;
  if(i){const q=points[i-1];total+=Math.hypot(p[0]-q[0],p[2]-q[2]);lengths[i]=total;}
  if((i+1)%256===0){await yieldWork();if(isCancelled())return null;}
 }
 if(!Number.isFinite(total)||total<=0)return null;
 const baseline=Math.min(MAX_VERTICES,Math.ceil(total/DESIRED_SPACING)+1),spacing=total/(baseline-1),positions=new Float32Array(MAX_VERTICES*3);
 let segment=1,count=0,queries=0;
 async function sample(d){
  while(segment<points.length-1&&lengths[segment]<d)segment++;
  const a=points[segment-1],b=points[segment],run=lengths[segment]-lengths[segment-1],t=run>0?(d-lengths[segment-1])/run:0;
  const x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,sourceY=a[1]+(b[1]-a[1])*t;
  let y;try{y=walkHeight(x,z,sourceY);}catch{return null;}
  if(!Number.isFinite(y))return null;
  if(++queries%256===0){await yieldWork();if(isCancelled())return null;}
  return {d,x,y:y+.04,z,sourceY};
 }
 function add(p){if(count>=MAX_VERTICES)return false;positions[count*3]=p.x;positions[count*3+1]=p.y;positions[count*3+2]=p.z;count++;return true;}
 let previous=await sample(0);if(!previous||isCancelled()||!add(previous))return null;
 for(let i=1;i<baseline;i++){
  if(isCancelled())return null;
  const end=await sample(i===baseline-1?total:i*spacing);if(!end)return null;
  const stack=[{a:previous,b:end,depth:0}];
  while(stack.length){
   const edge=stack.pop(),{a,b,depth}=edge;
   if(Math.abs(b.y-a.y)>RISER_THRESHOLD&&depth<MAX_RISER_DEPTH){
    // Interpolate on this source segment; baseline intervals can span a source
    // corner, so sample the route rather than the chord when bisecting.
    const savedSegment=segment;while(segment>1&&lengths[segment-1]>(a.d+b.d)/2)segment--;
    const middle=await sample((a.d+b.d)/2);segment=savedSegment;
    if(!middle||isCancelled())return null;
    stack.push({a:middle,b,depth:depth+1},{a,b:middle,depth:depth+1});
   }else{
    if(Math.abs(b.y-a.y)>RISER_THRESHOLD&&b.d-a.d>.005)return null;
    if(!add(b))return null;
   }
  }
  previous=end;
 }
 if(isCancelled())return null;
 // A physical ribbon remains legible on pale paving. Clamp the miter at
 // bends so tight turns cannot protrude far outside the intended path.
 const half=.035/2,ribbon=new Float32Array(count*6),indices=new Uint32Array((count-1)*6);
 for(let i=0;i<count;i++){
  const x=positions[i*3],y=positions[i*3+1],z=positions[i*3+2];
  const previous=Math.max(0,i-1),next=Math.min(count-1,i+1);
  let ax=x-positions[previous*3],az=z-positions[previous*3+2],bx=positions[next*3]-x,bz=positions[next*3+2]-z;
  const al=Math.hypot(ax,az),bl=Math.hypot(bx,bz);
  if(al){ax/=al;az/=al;}if(bl){bx/=bl;bz/=bl;}
  if(!al){ax=bx;az=bz;}if(!bl){bx=ax;bz=az;}
  let nx=-az-bz,nz=ax+bx,nl=Math.hypot(nx,nz);
  if(nl<1e-6){nx=-az;nz=ax;nl=Math.hypot(nx,nz)||1;}
  nx/=nl;nz/=nl;
  const projection=Math.abs(nx*(-az)+nz*ax),length=Math.min(half*2,half/Math.max(.01,projection));
  const k=i*6;ribbon[k]=x+nx*length;ribbon[k+1]=y;ribbon[k+2]=z+nz*length;ribbon[k+3]=x-nx*length;ribbon[k+4]=y;ribbon[k+5]=z-nz*length;
  if(i<count-1){const v=i*2,k=i*6;indices[k]=v;indices[k+1]=v+1;indices[k+2]=v+2;indices[k+3]=v+1;indices[k+4]=v+3;indices[k+5]=v+2;}
  if((i+1)%256===0){await yieldWork();if(isCancelled())return null;}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(ribbon,3));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeBoundingSphere();
 const material=new THREE.MeshBasicMaterial({color:0xd75b18,depthTest:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Trail guide';mesh.userData.routeGuide={vertices:count,spacing,builtMs:performance.now()-start,noExtraTextures:true};return mesh;
}
