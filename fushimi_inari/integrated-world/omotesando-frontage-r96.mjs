import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {pathWidth} from '../geography/geo-core.mjs';

export const omotesandoFrontageIdR96='way/305214938';
export function buildOmotesandoFrontageR96(root,features,surfaces,materials={},colliders=[]){
 const name='Photo-registered north entrance apartment R96',old=root.getObjectByName(name);if(old)return {group:old,builtIds:[omotesandoFrontageIdR96],...old.userData};
 const feature=features.buildings?.find(b=>b.id===omotesandoFrontageIdR96);if(!feature)return {built:false,builtIds:[]};
 const points=feature.points.slice(0,-1);if(points.length!==4)throw Error('R96 frontage requires original four-corner footprint');
 const height=(x,z)=>{const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Nonfinite R96 apartment ground');return y;};
 const seats=points.map(p=>height(p[0],p[2])),floor=[...seats].sort((a,b)=>a-b)[1],overallHeight=Number(feature.tags?.['building:levels'])*3;
 if(overallHeight!==9)throw Error('R96 source three-storey envelope changed');
 const top=floor+overallHeight,group=new THREE.Group();group.name=name;
 const tan=new THREE.MeshStandardMaterial({color:'#a59a78',roughness:.93}),joint=new THREE.MeshStandardMaterial({color:'#686a5e',roughness:1}),glass=new THREE.MeshStandardMaterial({color:'#374847',roughness:.38,metalness:.15}),frame=new THREE.MeshStandardMaterial({color:'#545c58',roughness:.77,metalness:.24}),rail=new THREE.MeshStandardMaterial({color:'#a6a79a',roughness:.8,metalness:.35});
 // Small ceramic tiles: deterministic DataTexture, real-world UVs on each
 // wall. Recesses below are geometry, never dark rectangles on a solid shell.
 const size=64,data=new Uint8Array(size*size*4);for(let z=0;z<size;z++)for(let x=0;x<size;x++){const i=(z*size+x)*4,mortar=x%16===0||z%8===0,value=mortar?156:225+((x*13+z*17)%18);data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}
 const map=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;map.needsUpdate=true;tan.map=map;tan.bumpMap=map;tan.bumpScale=.003;
 const batches=new Map(),facades=[],pending=[],hedgeCells=[];
 const put=(geo,mat)=>{if(!batches.has(mat))batches.set(mat,[]);const g=geo.index?geo.toNonIndexed():geo;if(g!==geo)geo.dispose();batches.get(mat).push(g);};
 const box=(w,h,d,x,y,z,mat,yaw=0)=>{if(w<=0||h<=0||d<=0)return;const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const face=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(face<2?d:w)/.64,uv.getY(i)*(face===2||face===3?d:h)/.64);}g.rotateY(yaw);g.translate(x,y,z);put(g,mat);};
 for(let edge=0;edge<4;edge++){
  const a=points[edge],b=points[(edge+1)%4],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length,nx=uz,nz=-ux,yaw=-Math.atan2(dz,dx),world=(u,v)=>[a[0]+ux*u+nx*v,a[2]+uz*u+nz*v];
  const fb=(w,h,d,u,y,v,mat)=>{const [x,z]=world(u,v);box(w,h,d,x,y,z,mat,yaw);};
  const publicFace=edge===0||edge===1,bays=edge===1?6:2,step=length/bays,recess=.64;
  // Ground follows each sampled triangle seat while all storey datums remain
  // horizontal. The foundation is buried, rather than a fake flat podium.
  let edgeBottom=Infinity;const sections=Math.ceil(length/.5);for(let j=0;j<sections;j++){const u0=length*j/sections,u1=length*(j+1)/sections,p=world(u0,0),q=world(u1,0),mid=world((u0+u1)/2,0),bottom=Math.min(height(...p),height(...q),height(...mid))-.07;
   fb(u1-u0,floor+3-bottom,.16,(u0+u1)/2,(floor+3+bottom)/2,.08,tan);
   edgeBottom=Math.min(edgeBottom,bottom);
  }
  const collisionCenter=world(length/2,.08);pending.push({type:'box',args:[collisionCenter[0],collisionCenter[1],length/2,.08,yaw,edgeBottom,top,'mapped_entrance_305214938_r96']});
  if(!publicFace){fb(length,6,.16,length/2,floor+6,.08,tan);continue;}
  // Recessed middle gallery: floor, ceiling, end cheeks, rear glazing and
  // parapet are separate solids; there is .64m of actual depth behind rail.
  fb(length,.18,recess,length/2,floor+3.09,recess/2,tan);
  fb(length,.19,recess,length/2,floor+5.91,recess/2,tan);
  fb(length,.86,.16,length/2,floor+3.61,.08,tan);
  for(const u of [.075,length-.075])fb(.15,2.8,recess,u,floor+4.5,recess/2,tan);
  for(let bay=0;bay<bays;bay++){
   const u=(bay+.5)*step,w=step-.22;
   fb(w,1.87,.08,u,floor+4.83,recess-.04,glass);
   for(const du of [-w/2,0,w/2])fb(.055,1.94,.11,u+du,floor+4.83,recess-.045,frame);
   for(const y of [3.87,5.79])fb(w,.055,.11,u,floor+y,recess-.045,frame);
   // Opaque upper-floor wall is pierced by bounded window bays with returns.
   fb(step,.57,.18,u,floor+6.285,.09,tan);fb(step,.47,.18,u,floor+8.765,.09,tan);
   for(const du of [-step/2+.075,step/2-.075])fb(.15,1.96,.24,u+du,floor+7.55,.12,tan);
   fb(step-.30,1.84,.08,u,floor+7.55,.19,glass);
   for(const du of [-(step-.30)/2,0,(step-.30)/2])fb(.055,1.92,.10,u+du,floor+7.55,.14,frame);
   for(const y of [6.59,8.51])fb(step-.27,.055,.24,u,floor+y,.12,frame);
  }
  // Low pale metal gallery rail, as seen above the tan balcony fascia.
  for(const y of [4.08,4.40])fb(length,.045,.045,length/2,floor+y,.095,rail);
  for(let u=.12;u<length-.08;u+=.32)fb(.025,.32,.035,u,floor+4.24,.095,rail);
  fb(length,.13,.23,length/2,top-.065,.115,frame);
  facades.push({edge,length,bays,recessDepth:recess,publicFacing:edge===1?'south avenue':'west street'});
 }
 // The mapped hedge starts east of this frontage (way1133052411). Photos
 // show another clipped row in front of this building; do not duplicate that
 // mapped owner. Keep a gap around the separately mapped small open roof.
 const hedgeCore=new THREE.MeshStandardMaterial({color:'#34442c',roughness:1}),hedgeLeaf=new THREE.MeshStandardMaterial({color:'#405338',roughness:1,side:THREE.DoubleSide});
 const blocked=(x,z,r)=>{
  if((x>-150.1-r&&x<-147.7+r&&z>3.9-r&&z<6.8+r)||Math.hypot(x+138.652,z-5.021)<1.0+r)return true;
  for(const path of features.paths??[])for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1))),width=pathWidth(path.tags);if(Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)<width/2+r)return true;}
  return colliders.some(c=>{const a=c.args;if(c.type==='cylinder')return Math.hypot(x-a[0],z-a[1])<a[2]+r; if(c.type!=='box')return false;const dx=x-a[0],dz=z-a[1],co=Math.cos(a[4]),si=Math.sin(a[4]),u=dx*co-dz*si,v=dx*si+dz*co;return Math.hypot(Math.max(0,Math.abs(u)-a[2]),Math.max(0,Math.abs(v)-a[3]))<r;});
 };
 let seed=9601;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let x=-151.9;x<-136.5;x+=.38){const z=3.76+(x+151.9)*-.004;if(blocked(x,z,.32))continue;const y=height(x,z),bottom=Math.min(height(x-.19,z-.28),height(x+.19,z+.28),y)-.05,h=1.70+.06*Math.sin(x*2.1);box(.40,h,.42,x,bottom+h/2,z,hedgeCore);hedgeCells.push({x,z,bottom,top:bottom+h});

  const vertices=[];for(let j=0;j<34;j++){const angle=random()*Math.PI*2,px=x+(random()-.5)*.46,pz=z+(random()-.5)*.67,py=y+.12+random()*(h-.12),w=.085+random()*.035,dy=.045+random()*.035,dx=Math.cos(angle)*w,dz=Math.sin(angle)*w;vertices.push(px-dx,py-dy,pz-dz,px+dx,py-dy,pz+dz,px,py+dy,pz,px,py+dy,pz,px+dx,py-dy,pz+dz,px+Math.sin(angle)*.025,py,pz-Math.cos(angle)*.025);}
  const leaves=new THREE.BufferGeometry();leaves.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));leaves.setAttribute('uv',new THREE.Float32BufferAttribute(Array(vertices.length/3*2).fill(0),2));leaves.computeVertexNormals();put(leaves,hedgeLeaf);
 }
 const hedgeRuns=[];for(const cell of hedgeCells){let run=hedgeRuns.at(-1);if(!run||cell.x-run.at(-1).x>.39){run=[];hedgeRuns.push(run);}run.push(cell);}for(const run of hedgeRuns){const a=run[0],b=run.at(-1);pending.push({type:'box',args:[(a.x+b.x)/2,(a.z+b.z)/2,(b.x-a.x)/2+.20,.29,0,Math.min(...run.map(c=>c.bottom)),Math.max(...run.map(c=>c.top)),'photo_apartment_hedge_r96']});}
 // Flat roof within the original polygon; shallow parapet stays at the
 // inherited 9m top datum, preserving the mapped silhouette envelope.
 const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();const roof=new THREE.ShapeGeometry(shape);roof.rotateX(-Math.PI/2);roof.translate(0,top-.17,0);put(roof,joint);
 for(const [mat,parts]of batches){const geometry=mergeGeometries(parts,false);if(!geometry)throw Error('R96 apartment batch mismatch');parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='R96 apartment '+(mat===tan?'ceramic shell':mat===glass?'recess glazing':mat===frame?'frames and cap':mat===rail?'gallery rail':mat===hedgeCore?'frontage hedge core':mat===hedgeLeaf?'frontage hedge leaves':'flat roof');group.add(mesh);}
 group.userData={built:true,sourceId:feature.id,footprint:points,seats,floor,top,overallHeight,facades,hedgeCells,wallColliders:4,drawBatches:group.children.length,triangles:group.children.reduce((sum,mesh)=>sum+mesh.geometry.attributes.position.count/3,0),collidersAdded:pending.length,provenance:'Townphoto k01102smal.webp and k01111.jpg (2016) inspected: tan small tile, upper window band, recessed middle balcony/windows, ground behind hedge. OSM way305214938 locates north-side frontage west end at first-torii street and tags three storeys.',limits:'Three storeys retained at existing estimated3m/storey; exact windows/bays, recess depth and materials photo-inferred. Existing mapped hedge/gate owners retained; photo-inferred missing frontage row has gaps for mapped open roof, torii and existing colliders; no shop names, ground doors behind occluding hedge, interiors or hidden layouts invented.'};
 root.add(group);colliders.push(...pending);return {group,builtIds:[feature.id],...group.userData};
}
