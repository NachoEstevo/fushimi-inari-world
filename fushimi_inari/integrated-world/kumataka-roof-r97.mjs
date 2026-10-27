import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

export const kumatakaRoofProfileR97=z=>{
  const t=Math.min(1,Math.abs(z)/3.4);return 3.35+.95*Math.pow(1-t,1.45)+.13*Math.pow(t,8);
};
function lowerTriangles(geometry){
  if(geometry.index)return null;
  const p=geometry.attributes.position,keep=[];
  for(let i=0;i<p.count;i+=3)if(![0,1,2].every(j=>p.getY(i+j)>=3.25))keep.push(i,i+1,i+2);
  const g=new THREE.BufferGeometry();
  for(const [name,a]of Object.entries(geometry.attributes)){
    const values=[];for(const i of keep)for(let k=0;k<a.itemSize;k++)values.push(a.array[i*a.itemSize+k]);
    g.setAttribute(name,new THREE.Float32BufferAttribute(values,a.itemSize));
  }
  return g;
}

/** After mapped pavilion registration, before global batching. */
export function buildKumatakaRoofR97(root){
  const owner=root.children.find(g=>g.userData.kumatakaRegistrationR97);
  if(!owner||owner.getObjectByName('Kumataka continuous swept roof R97'))return null;
  const details=owner.getObjectByName('Kumataka photographed timber pavilion and straw fringe');
  if(!details)return null;
  const named=color=>details.children.filter(o=>o.isMesh&&o.material?.color?.getHexString()===color);
  const roof=named('848983'),wood=named('494536'),dark=named('242923');
  if(roof.length!==1||wood.length!==1||dark.length!==1||roof[0].material.metalness!==.22)return null;
  const filtered=[wood[0],dark[0]].map(o=>lowerTriangles(o.geometry));if(filtered.some(g=>!g))return null;
  const group=new THREE.Group();group.name='Kumataka continuous swept roof R97';
  const p=staticParts(group),metal=roof[0].material.clone(),timber=wood[0].material.clone();metal.side=timber.side=THREE.DoubleSide;
  const back=-8.8,front=-2.8,half=3.4,segments=20;
  for(const side of [-1,1])for(let i=0;i<segments;i++){
    const a=side*half*i/segments,b=side*half*(i+1)/segments,ya=kumatakaRoofProfileR97(a),yb=kumatakaRoofProfileR97(b);
    const face=[back,ya,a,front,ya,a,back,yb,b,back,yb,b,front,ya,a,front,yb,b];
    // Both surface windings point upward, even before double-sided materials.
    if(side>0)for(let j=0;j<face.length;j+=9){const q=face.slice(j+3,j+6);face.splice(j+3,3,...face.slice(j+6,j+9));face.splice(j+6,3,...q);}
    p.sheet(face,metal);p.sheet(face.map((n,j)=>j%3===1?n-.105:n),timber);
    for(const x of [front,back])p.beam([x,ya-.04,a],[x,yb-.04,b],.055,timber,.055,4);
    // Continuous closed upper gables at both roof ends. The absent rear gable
    // was the apparent rectangular hole seen through the open pavilion.
    for(const x of [front-.09,back+.09])p.sheet([x,3.22,a,x,3.22,b,x,ya-.105,a,x,ya-.105,a,x,3.22,b,x,yb-.105,b],timber);
  }
  for(const z of [-half,half])p.box(6.04,.14,.11,-5.8,kumatakaRoofProfileR97(z)-.045,z,timber);
  p.box(6.20,.11,.18,-5.8,4.345,0,metal);
  for(let x=back+.24;x<front-.1;x+=.48)for(const side of [-1,1])for(let j=0;j<10;j++){
    const a=side*half*j/10,b=side*half*(j+1)/10,ya=kumatakaRoofProfileR97(a)+.008,yb=kumatakaRoofProfileR97(b)+.008,w=.009;
    p.sheet([x-w,ya+.018,a,x+w,ya+.018,a,x-w,yb+.018,b,x-w,yb+.018,b,x+w,ya+.018,a,x+w,yb+.018,b],metal);
    for(const dx of [-w,w])p.sheet([x+dx,ya,a,x+dx,ya+.018,a,x+dx,yb,b,x+dx,yb,b,x+dx,ya+.018,a,x+dx,yb+.018,b],metal);
  }
  const stats=p.flush();
  const removedTriangles=roof[0].geometry.attributes.position.count/3+[wood[0],dark[0]].reduce((s,o,i)=>s+(o.geometry.attributes.position.count-filtered[i].attributes.position.count)/3,0);
  roof[0].removeFromParent();wood[0].geometry=filtered[0];dark[0].geometry=filtered[1];details.add(group);
  group.userData={...stats,removedTriangles,triangleDelta:stats.triangles-removedTriangles,profile:'3.35 + .95(1-t)^1.45 + .13t^8, t=abs(z)/3.4',rearClosure:'Inferred completion of unseen roof end; same existing envelope',sources:['https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg','https://fushimiinari-guide.com/wp-content/uploads/P3600706_20190210.jpg']};
  return {group,...group.userData};
}
