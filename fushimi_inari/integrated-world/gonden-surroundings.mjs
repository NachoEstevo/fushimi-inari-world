import * as THREE from 'three';

// The side photograph establishes these three objects beside the +X gable.
// All sizes/offsets below are conservative visual estimates, not survey data.
const NAME='Gonden photographed side surroundings';
export function buildGondenSurroundings(root,features,surfaces,materials,colliders){
 let shrine;root.traverse(o=>{if(o.isGroup&&o.userData.zone==='gonden')shrine=o;});
 if(!shrine)return {built:false};
 const previous=shrine.getObjectByName(NAME);if(previous)return previous.userData;
 shrine.updateWorldMatrix(true,false);
 const m=shrine.matrixWorld,e=m.elements,sx=Math.hypot(e[0],e[2]),sy=e[5],sz=Math.hypot(e[8],e[10]);
 if(!e.every(Number.isFinite)||sy<=0||sx<=0||sz<=0||Math.abs(e[1])+Math.abs(e[4])+Math.abs(e[6])+Math.abs(e[9])>1e-6||Math.abs(e[0]*e[8]+e[2]*e[10])>1e-6||m.determinant()<=0)throw Error('Gonden surroundings require an upright positive orthogonal transform');
 const detail=new THREE.Group();detail.name=NAME;
 // Only the photograph-visible +X wall is clad. The interaction-bearing legacy
 // body, the existing front facade and unseen rear surfaces keep their owners.
 const side=new THREE.Group();side.name='Gonden photographed white side and vermilion frame';
 const red=materials.vermilionMat??new THREE.MeshStandardMaterial({color:'#b44425',roughness:.9}),white=materials.plasterMat??new THREE.MeshStandardMaterial({color:'#e1ded1',roughness:.96});
 const sideBox=(w,h,d,x,y,z,mat)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;side.add(mesh);};
 if(shrine.userData.gondenFacadeR65){
  sideBox(.025,2.62,4.13,3.12,2.36,0,white);
  for(const z of [-2.03,0,2.03])sideBox(.10,2.78,.13,3.16,2.36,z,red);
  for(const y of [1.02,2.79,3.71])sideBox(.10,.13,4.22,3.16,y,0,red);
  // The visible side door is a plain red leaf; no unreadable text or carving.
  sideBox(.04,1.73,.93,3.19,1.91,1.43,red);
  sideBox(.02,.05,.025,3.22,1.96,1.11,materials.goldMat??red);
  // Follow the existing facade module's inherited roof section exactly; this
  // changes the visible finish, without inventing a second roof envelope.
  const top=z=>{const t=Math.abs(z+.60)/(z>=-.60?4.15:2.45);return 5.45-1.64*(1-Math.pow(1-t,2))+.14*Math.pow(t,8)-.10;},vertices=[];
  for(let i=0;i<24;i++){const a=-2.1+4.2*i/24,b=-2.1+4.2*(i+1)/24;for(const p of [[3.121,3.77,a],[3.121,top(a),a],[3.121,3.77,b],[3.121,3.77,b],[3.121,top(a),a],[3.121,top(b),b]])vertices.push(...p);}
  const gable=new THREE.BufferGeometry();gable.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));gable.computeVertexNormals();const gableMesh=new THREE.Mesh(gable,white);gableMesh.castShadow=gableMesh.receiveShadow=true;side.add(gableMesh);
  sideBox(.10,top(-.6)-3.77,.12,3.16,(top(-.6)+3.77)/2,-.6,red);
  // A single chord crosses the concave roof section. Short recessed segments
  // follow the same envelope, with enough cover for their rotated end corners.
  for(const [a,b]of [[-2.03,-.60],[-.60,2.03]]){const count=Math.ceil((b-a)/.14);for(let i=0;i<count;i++){
   const za=a+(b-a)*i/count,zb=a+(b-a)*(i+1)/count,ya=top(za)-.20,yb=top(zb)-.20,beam=new THREE.Mesh(new THREE.BoxGeometry(.10,Math.hypot(zb-za,yb-ya),.11),red);
   beam.name='Gonden side recessed roofline segment';beam.position.set(3.16,(ya+yb)/2,(za+zb)/2);beam.rotation.x=Math.atan2(zb-za,yb-ya);beam.castShadow=true;side.add(beam);
  }}
  detail.add(side);
 }
 const wood=new THREE.MeshStandardMaterial({color:'#655b45',roughness:.96}),dark=new THREE.MeshStandardMaterial({color:'#25332e',roughness:.85,metalness:.35}),pane=new THREE.MeshStandardMaterial({color:'#a8aaa0',roughness:.8}),stone=materials.stoneMat??new THREE.MeshStandardMaterial({color:'#8d8980',roughness:1});
 const yaw=Math.atan2(e[8],e[10]),built=[],skipped=[];
 const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);};
 const add=(id,x,z,w,d,h,construct)=>{
  const p=new THREE.Vector3(x,0,z).applyMatrix4(m),radius=Math.hypot(w*sx,d*sz)/2;
  if((surfaces.segments??[]).some(s=>distance(p.x,p.z,s.a,s.b)<s.width/2+radius+.12)){skipped.push({id,reason:'mapped walking corridor'});return;}
  if(colliders.some(c=>{const a=c.args;if(a.at(-1)==='gonden')return false;if(c.type==='cylinder')return Math.hypot(p.x-a[0],p.z-a[1])<radius+a[2]+.12;if(c.type!=='box')return false;
   const axes=y=>[[Math.cos(y),-Math.sin(y)],[Math.sin(y),Math.cos(y)]],own=axes(yaw),other=axes(a[4]??0),dot=(u,v)=>u[0]*v[0]+u[1]*v[1],delta=[p.x-a[0],p.z-a[1]];
   return [...own,...other].every(axis=>Math.abs(dot(delta,axis))<w*sx/2*Math.abs(dot(own[0],axis))+d*sz/2*Math.abs(dot(own[1],axis))+a[2]*Math.abs(dot(other[0],axis))+a[3]*Math.abs(dot(other[1],axis))+.12);
  })){skipped.push({id,reason:'existing solid or prop'});return;}
  const levels=[];for(const dx of [-w/2,0,w/2])for(const dz of [-d/2,0,d/2]){const q=new THREE.Vector3(x+dx,0,z+dz).applyMatrix4(m);levels.push(surfaces.height(q.x,q.z));}
  if(!levels.every(Number.isFinite)||Math.max(...levels)-Math.min(...levels)>.12){skipped.push({id,reason:'unsupported or uneven ground'});return;}
  const base=Math.min(...levels),g=new THREE.Group();g.name=`Gonden side ${id}`;g.position.set(x,(base-p.y)/sy,z);
  const box=(bw,bh,bd,bx,by,bz,mat)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),mat);mesh.position.set(bx,by,bz);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);};
  construct(box,g);detail.add(g);colliders.push({type:'box',args:[p.x,p.z,w*sx/2,d*sz/2,yaw,base,base+h*sy,`gonden_side_${id}`]});built.push({id,localCenter:[x,z],estimatedSize:[w,h,d],base});
 };
 add('low timber barrier',4.02,-.65,.12,2.8,.70,box=>{for(const z of [-1.34,0,1.34])box(.10,.70,.10,0,.35,z,wood);for(const y of [.16,.60])box(.09,.09,2.8,0,y,0,wood);});
 add('roofed cabinet',4.25,1.45,.88,.70,1.84,(box,g)=>{box(.88,.10,.70,0,.05,0,stone);box(.78,1.35,.60,0,.775,0,wood);box(.62,.48,.025,.0,1.07,.313,pane);for(const x of [-.34,0,.34])box(.035,.55,.04,x,1.07,.335,wood);box(.85,.08,.68,0,1.49,0,wood);const roof=new THREE.Mesh(new THREE.ConeGeometry(.72,.30,4),dark);roof.rotation.y=Math.PI/4;roof.position.y=1.68;roof.scale.z=.80;roof.castShadow=true;g.add(roof);});
 add('dark lantern',4.55,-2.65,.48,.48,3.12,(box,g)=>{box(.48,.12,.48,0,.06,0,stone);box(.32,.25,.32,0,.245,0,dark);box(.12,2.13,.12,0,1.405,0,dark);box(.34,.46,.34,0,2.64,0,pane);for(const x of [-.18,.18])for(const z of [-.18,.18])box(.035,.50,.035,x,2.64,z,dark);box(.43,.06,.43,0,2.39,0,dark);const roof=new THREE.Mesh(new THREE.ConeGeometry(.37,.24,4),dark);roof.rotation.y=Math.PI/4;roof.position.y=2.99;roof.castShadow=true;g.add(roof);});
 // The mapped entrance-barriers dataset has no line within 20m of Gonden.
 // This short photo-inferred return starts beside the body's rear edge; it is
 // deliberately not an enclosure around an invented precinct.
 add('rear side roofed screen',3.49,-3.48,.35,2.4,1.72,(box,g)=>{
  for(const z of [-1.12,0,1.12])box(.13,1.54,.13,0,.77,z,red);
  for(const y of [.18,1.39])box(.13,.10,2.4,0,y,0,red);
  for(let z=-1.04;z<1.1;z+=.14)box(.075,1.13,.055,0,.80,z,red);
  for(const sign of [-1,1]){const roof=new THREE.Mesh(new THREE.BoxGeometry(.29,.045,2.55),dark);roof.position.set(sign*.12,1.59,0);roof.rotation.z=-sign*.22;roof.castShadow=roof.receiveShadow=true;g.add(roof);}
  for(let z=-1.18;z<=1.2;z+=.19)box(.035,.045,.045,0,1.65,z,dark);
 });
 detail.userData={built:built.length>0,sideFacade:side.parent===detail,objects:built,skipped,source:'outputs/r76/gonden-side.jpg',dimensions:'inferred photographic proportions; approximate +X side placement; rear screen length bounded to 2.4m',limits:'Unseen rear facade and screen continuation are not reconstructed; no unreadable inscriptions',lighting:'unlit dark metal lantern; no point light',ground:'minimum of nine rendered surface samples; maximum 0.12m relief'};
 shrine.add(detail);return detail.userData;
}
