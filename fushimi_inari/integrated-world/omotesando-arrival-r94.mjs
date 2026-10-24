import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';

// OSM locates the road/approach junction; the 2016 station-facing photograph
// establishes zebra markings, a pale gutter and low curbs outside the crossing.
// Neither source surveys stripe dimensions. Keep that distinction in metadata.
export function omotesandoArrivalLayoutR94(features){
 const road=features.paths?.find(p=>p.id==='way/79699850');
 const approach=features.paths?.find(p=>p.id==='way/105449722');
 if(!road||!approach)return null;
 const shared=approach.nodeIds.find(id=>road.nodeIds.includes(id));
 if(shared===undefined)return null;
 const i=road.nodeIds.indexOf(shared),p=road.points[i],a=road.points[Math.max(0,i-1)],b=road.points[Math.min(road.points.length-1,i+1)];
 const length=Math.hypot(b[0]-a[0],b[2]-a[2]);if(!length)return null;
 const along=[(b[0]-a[0])/length,(b[2]-a[2])/length],across=[-along[1],along[0]],width=pathWidth(road.tags);
 const point=(u,v)=>[p[0]+across[0]*u+along[0]*v,p[2]+across[1]*u+along[1]*v];
 // Station-facing 2016 reference: long bands follow the road heading, while
 // successive bands cross the road from JR Inari toward Omotesando.
 const stripes=Array.from({length:6},(_,j)=>({center:point((j-2.5)*.9,0),width:.43,length:3.6}));
 const gutters=[-1,1].map(side=>({center:point(side*(width/2-.12),0),width:.24,length:26}));
 const curbs=[-1,1].flatMap(side=>[[-13,-2.5],[2.5,13]].map(([lo,hi])=>({center:point(side*(width/2+.04),(lo+hi)/2),width:.16,length:hi-lo,height:.09})));
 return {center:[p[0],p[2]],along,across,roadWidth:width,stripes,gutters,curbs,sourceNode:shared,roadId:road.id,approachId:approach.id,
  spawn:{position:[p[0],p[2]],lookAt:[-138.295875883405,10.764594759741]}};
}

export function buildOmotesandoArrivalR94(root,features,surfaces){
 const name='Omotesando pedestrian crossing R94',existing=root.getObjectByName(name);if(existing)return existing.userData;
 const layout=omotesandoArrivalLayoutR94(features);if(!layout)return {built:false,reason:'mapped road/approach junction missing'};
 const group=new THREE.Group();group.name=name;
 const roads=(surfaces.segments??[]).filter(s=>s.id===layout.roadId&&!s.stair);
 const paintHeight=(x,z)=>{
  let best=null;
  for(const s of roads){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz);if(!best||d<best.d)best={d,y:s.ya+(s.yb-s.ya)*t};}
  return best?.y??height(x,z);
 };
 const height=(x,z)=>{const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Nonfinite Omotesando crossing surface');return y;};
 const materials=[new THREE.MeshStandardMaterial({color:'#e6e5dc',roughness:.94,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),new THREE.MeshStandardMaterial({color:'#a8aaa1',roughness:.98,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),new THREE.MeshStandardMaterial({color:'#babcb2',roughness:.96})];
 const batches=[[],[],[]];
 const vertex=(spec,u,v,raise)=>{const x=spec.center[0]+layout.across[0]*u+layout.along[0]*v,z=spec.center[1]+layout.across[1]*u+layout.along[1]*v;return [x,(layout.stripes.includes(spec)||layout.gutters.includes(spec)?paintHeight(x,z):height(x,z))+raise,z];};
 const quad=(out,a,b,c,d)=>{out.push(...a,...b,...c,...a,...c,...d);};
 const patch=(spec,mat,raise)=>{const n=Math.ceil(spec.length/.5);for(let j=0;j<n;j++){const lo=-spec.length/2+spec.length*j/n,hi=-spec.length/2+spec.length*(j+1)/n;quad(batches[mat],vertex(spec,-spec.width/2,lo,raise),vertex(spec,spec.width/2,lo,raise),vertex(spec,spec.width/2,hi,raise),vertex(spec,-spec.width/2,hi,raise));}};
 for(const stripe of layout.stripes)patch(stripe,0,.022);
 for(const gutter of layout.gutters)patch(gutter,1,.014);
 for(const curb of layout.curbs){patch(curb,2,curb.height);const n=Math.ceil(curb.length/.5);for(let j=0;j<n;j++){const lo=-curb.length/2+curb.length*j/n,hi=-curb.length/2+curb.length*(j+1)/n;for(const side of [-1,1]){const u=side*curb.width/2,points=[vertex(curb,u,lo,0),vertex(curb,u,hi,0),vertex(curb,u,hi,curb.height),vertex(curb,u,lo,curb.height)];quad(batches[2],...(side===1?points:points.reverse()));}}for(const side of [-1,1]){const v=side*curb.length/2,points=[vertex(curb,-curb.width/2,v,0),vertex(curb,curb.width/2,v,0),vertex(curb,curb.width/2,v,curb.height),vertex(curb,-curb.width/2,v,curb.height)];quad(batches[2],...(side===-1?points:points.reverse()));}}
 for(let i=0;i<batches.length;i++){if(!batches[i].length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(batches[i],3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,materials[i]);mesh.receiveShadow=true;group.add(mesh);}
 group.userData={built:true,...layout,drawBatches:group.children.length,triangles:batches.reduce((n,v)=>n+v.length/9,0),collidersAdded:0,
  provenance:'OSM shared node749327076 in ways79699850/105449722 anchors crossing; townphoto.net/kyoto/k01/k01102smal.webp (2016) inspected for zebra, gutter, low curb appearance. Road width6m follows existing pathWidth fallback. All marking/curb dimensions inferred.',
  limits:'Low decorative curb9cm deliberately interrupted over5m pedestrian crossing. Existing road/path surfaces retain walk height and collision ownership; no new road barrier, shop identity or facade invented. Current marking count and dimensions unverified.'};
 root.add(group);return group.userData;
}

