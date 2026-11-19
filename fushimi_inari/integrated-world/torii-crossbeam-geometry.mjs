import * as THREE from 'three';

// A single closed painted beam. Its gently upturned ends follow the same
// kasagi curve as the red shimaki below, without stacked boxes/internal faces.
export function toriiCrossbeamGeometry({width,height,depth,centerY,endRise,curveWidth=width,segments=6,textureMetres=1.5}){
 if(![width,height,depth,curveWidth,textureMetres].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(centerY)||!Number.isFinite(endRise)||endRise<0||!Number.isInteger(segments)||segments<2||segments>32)throw new RangeError('Invalid torii crossbeam dimensions');
 const positions=[],normals=[],uvs=[],indices=[],half=curveWidth/2;
 const rise=x=>endRise*Math.pow(Math.abs(x)/half,3),slope=x=>3*endRise*x*Math.abs(x)/(half**3);
 function vertex(x,y,z,nx,ny,nz,u,v){
  const inverse=1/Math.hypot(nx,ny,nz);positions.push(x,y,z);normals.push(nx*inverse,ny*inverse,nz*inverse);uvs.push(u,v);
 }
 for(const face of ['front','back','top','bottom']){
  const start=positions.length/3;
  for(let i=0;i<=segments;i++){
   const x=-width/2+width*i/segments,y=centerY+rise(x),dy=slope(x);
   if(face==='front')for(const h of [-1,1])vertex(x,y+h*height/2,depth/2,0,0,1,x/textureMetres,(y+h*height/2)/textureMetres);
   if(face==='back')for(const h of [1,-1])vertex(x,y+h*height/2,-depth/2,0,0,-1,x/textureMetres,(y+h*height/2)/textureMetres);
   if(face==='top')for(const z of [depth/2,-depth/2])vertex(x,y+height/2,z,-dy,1,0,x/textureMetres,z/textureMetres);
   if(face==='bottom')for(const z of [-depth/2,depth/2])vertex(x,y-height/2,z,dy,-1,0,x/textureMetres,z/textureMetres);
  }
  for(let i=0;i<segments;i++){const a=start+i*2,b=a+2;indices.push(a,b,b+1,a,b+1,a+1);}
 }
 for(const side of [-1,1]){
  const x=side*width/2,y=centerY+rise(x),start=positions.length/3;
  const corners=side<0?[[-1,1],[1,1],[1,-1],[-1,-1]]:[[1,1],[-1,1],[-1,-1],[1,-1]];
  for(const [h,z]of corners)vertex(x,y+h*height/2,z*depth/2,side,0,0,z*depth/2/textureMetres,(y+h*height/2)/textureMetres);
  indices.push(start,start+1,start+2,start,start+2,start+3);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}

// The split keys above the through-timber rise toward their exposed ends.
// The thin points meet inside each pillar. Dimensions are photographic
// estimates from the mountain gates in https://livingkyo.com/2699/.
export function toriiNukiWedges({halfSpan,reach,height,depth,seatY}){
 const positions=[],uvs=[],indices=[];
 for(const post of [-halfSpan,halfSpan])for(const side of [-1,1]){
  const x=post+side*reach,z=depth*.5;
  const corners=[[post,seatY,z],[x,seatY,z],[x,seatY+height,z],
                 [post,seatY,-z],[x,seatY,-z],[x,seatY+height,-z]];
  // Separate the flat painted faces to retain the arris at the thick end.
  for(const face of [[0,1,2],[3,5,4],[0,3,4,1],[1,4,5,2],[0,2,5,3]]){
   const start=positions.length/3;
   for(const i of side===1?face:face.toReversed()){
    const [px,py,pz]=corners[i];positions.push(px,py,pz);
    const end=face[0]===1,horizontal=face.length===4&&!end;
    uvs.push((end?pz:px)/1.5,(horizontal?pz:py)/1.5);
   }
   indices.push(start,start+1,start+2);
   if(face.length===4)indices.push(start,start+2,start+3);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}


// The wider black sleeve encloses the post's bottom. Preserve the original
// vertex layout (mountain width cohorts use its ranges) while dropping that cap.
export function sleevedToriiPost(topRadius,bottomRadius,height,segments){
 const g=new THREE.CylinderGeometry(topRadius,bottomRadius,height,segments);
 const bottom=g.groups.find(group=>group.materialIndex===2);
 g.setIndex(new THREE.BufferAttribute(g.index.array.slice(0,bottom.start),1));
 g.clearGroups();return g;
}
