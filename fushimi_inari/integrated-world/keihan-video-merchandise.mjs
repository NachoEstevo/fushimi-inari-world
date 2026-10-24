import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {videoOpenBays} from './keihan-urasando.mjs?v=video-shops-3';

// Original product shapes inspired by the user video's 0:51 / 1:16 / 1:26.
// Parcel attribution, inventory and centimetre placement are inferred. The
// registered frontage frame is authoritative; never add a floor or collider.
const NAME='Keihan video merchandise';
const REQUESTS=[
 {id:'way/296201558',bay:0,kind:'souvenirs'},
 {id:'way/296201560',bay:0,kind:'souvenirs'},
 {id:'way/296201558',bay:1,kind:'food-table'},
 {id:'way/305214377',bay:0,kind:'ice-display'},
];

export function planKeihanVideoMerchandise(assembly){
 const frontages=assembly?.keihanUrasando?.frontages??[],plan=[];
 for(const request of REQUESTS){
  const s=frontages.find(s=>s.id===request.id);
  if(!s||!videoOpenBays[s.id]?.includes(request.bay)||!Number.isFinite(s.floor)||!Number.isFinite(s.width)||!s.points?.[s.edge])continue;
  const bays=Math.max(2,Math.round(s.width/2.7)),bayWidth=s.width/bays;
  if(bayWidth<1.85)continue;
  const u=(request.bay+.5)*bayWidth,a=s.points[s.edge];
  plan.push({...request,width:Math.min(1.65,bayWidth-.38),u,bayWidth,floor:s.floor,
   position:[a[0]+s.t[0]*u,s.floor,a[2]+s.t[1]*u],yaw:-Math.atan2(s.t[1],s.t[0]),source:s});
 }
 return plan;
}

function atlas(){
 if(typeof document==='undefined'){const t=new THREE.DataTexture(new Uint8Array([255,245,220,255]),1,1);t.needsUpdate=true;return t;}
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const c=canvas.getContext('2d');
 c.fillStyle='#f5edd8';c.fillRect(0,0,512,512);
 c.clearRect(0,0,256,256);c.beginPath();c.ellipse(128,128,114,124,0,0,Math.PI*2);c.fill();
 // Fox face, fan, menu and ice banner. No copied pixels, prices or shop names.
 c.fillStyle='#b7322e';
 for(const x of [76,180]){c.beginPath();c.moveTo(x-25,105);c.lineTo(x+23,111);c.lineTo(x,124);c.fill();}
 c.fillStyle='#252623';for(const x of [82,174]){c.beginPath();c.ellipse(x,118,12,5,0,0,Math.PI*2);c.fill();}
 c.beginPath();c.moveTo(117,174);c.lineTo(139,174);c.lineTo(128,187);c.fill();
 c.strokeStyle='#c34736';c.lineWidth=6;c.beginPath();c.moveTo(128,193);c.lineTo(128,210);c.stroke();
 c.fillStyle='#a73c39';c.fillRect(256,0,256,256);c.strokeStyle='#ecd6a3';c.lineWidth=3;
 for(let i=0;i<11;i++){const a=Math.PI+i*Math.PI/10;c.beginPath();c.moveTo(384,247);c.lineTo(384+120*Math.cos(a),247+220*Math.sin(a));c.stroke();}
 c.fillStyle='#f3e4bd';for(let i=0;i<5;i++){c.beginPath();c.arc(284+i*48,80+(i%2)*30,11,0,Math.PI*2);c.fill();}
 c.fillStyle='#eee0b9';c.fillRect(0,256,256,256);c.fillStyle='#473d2c';c.textAlign='center';c.font='bold 30px serif';c.fillText('できたて',128,306);c.font='22px serif';c.fillText('焼きもち',128,352);c.fillText('お茶・菓子',128,389);
 c.strokeStyle='#a69062';c.lineWidth=2;for(const y of [325,410,450]){c.beginPath();c.moveTo(25,y);c.lineTo(231,y);c.stroke();}
 c.fillStyle='#f4f4e9';c.fillRect(256,256,256,256);c.fillStyle='#ba3436';c.font='bold 150px serif';c.fillText('氷',384,420);c.strokeStyle='#35649b';c.lineWidth=7;
 for(const y of [452,475]){c.beginPath();for(let x=260;x<=512;x+=4){const py=y+6*Math.sin(x*.08);x===260?c.moveTo(x,py):c.lineTo(x,py);}c.stroke();}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}

function batch(group,materials){
 const parts=new Map();
 const put=(g,key='color',color='#ffffff')=>{const p=g.index?g.toNonIndexed():g;if(p!==g)g.dispose();
  if(key==='color'){const c=new THREE.Color(color),values=new Float32Array(p.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}p.setAttribute('color',new THREE.BufferAttribute(values,3));}
  if(!parts.has(key))parts.set(key,[]);parts.get(key).push(p);
 };
 return {put,box(w,h,d,x,y,z,color,key='color'){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);put(g,key,color);},
  shape(g,x,y,z,color,key='color'){g.translate(x,y,z);put(g,key,color);},
  print(w,h,x,y,z,cell){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv,col=cell%2,row=Math.floor(cell/2);for(let i=0;i<uv.count;i++)uv.setXY(i,(col+uv.getX(i))*.5,(1-row+uv.getY(i))*.5);g.rotateY(Math.PI);g.translate(x,y,z);put(g,'print');},
  finish(){for(const [key,geos]of parts){const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,materials[key]);mesh.name=group.name+' '+key;mesh.receiveShadow=true;group.add(mesh);}}
 };
}

function rack(b,w){
 const edge=w/2-.08;
 for(const x of [-edge,edge]){b.box(.025,1.91,.025,x,.955,.64,'#635a48');b.box(.09,.04,.53,x,.02,.43,'#393b36');}
 for(const y of [.23,.56,.97,1.30,1.88])b.box(w,.025,.025,0,y,.64,'#635a48');
 for(const y of [.24,.57,.98])b.box(w,.028,.48,0,y,.43,'#aa8060');
 for(let i=0;i<7;i++)b.box(.012,1.55,.012,-edge+i*edge/3,1.05,.65,'#706953');
 // Six dimensional masks; ears and nose project from the illustrated face.
 for(let row=0;row<2;row++)for(let i=0;i<3;i++){
  const x=(i-1)*w*.28,y=1.25+row*.37;
  const face=new THREE.SphereGeometry(1,8,4);face.scale(.12,.145,.055);b.shape(face,x,y,.30,'#f4ecda');
  for(const side of [-1,1]){const ear=new THREE.ConeGeometry(.052,.12,3);ear.rotateY(Math.PI);b.shape(ear,x+side*.078,y+.14,.30,'#f4ecda');}
  b.print(.19,.245,x,y-.006,.242,0);
  // High-contrast face marks sit ahead of the convex body and printed layer.
  // Small original polygons remain legible at oblique native street views.
  for(const side of [-1,1]){
   const mark=new THREE.PlaneGeometry(.066,.020);mark.rotateZ(side*.23);mark.rotateY(Math.PI);mark.translate(x+side*.046,y+.014,.231);b.put(mark,'color','#b72c26');
   const eye=new THREE.PlaneGeometry(.032,.013);eye.rotateZ(side*.15);eye.rotateY(Math.PI);eye.translate(x+side*.044,y+.001,.229);b.put(eye,'color','#25211e');
  }
  const nose=new THREE.CircleGeometry(.013,3);nose.rotateZ(Math.PI/2);nose.rotateY(Math.PI);nose.translate(x,y-.050,.229);b.put(nose,'color','#25211e');
 }
 // Open fan silhouettes and bamboo handles stay in front of the wire grid.
 for(let i=0;i<3;i++){
  const x=(i-1)*w*.30,shape=new THREE.Shape();shape.moveTo(0,0);for(let j=0;j<=10;j++){const a=Math.PI*j/10;shape.lineTo(Math.cos(a)*.18,Math.sin(a)*.22);}shape.closePath();
  const g=new THREE.ShapeGeometry(shape);g.rotateY(Math.PI);b.shape(g,x,.78,.19,['#ae443b','#d8bb76','#5d8072'][i]);
  b.box(.015,.19,.018,x,.74,.185,'#bda773');
  for(let j=0;j<5;j++){const spoke=new THREE.PlaneGeometry(.008,.20);spoke.rotateZ((j-2)*.43);spoke.rotateY(Math.PI);spoke.translate(x,.87,.184);b.put(spoke,'color','#d5c09a');}
 }
 for(let row=0;row<2;row++)for(let i=0;i<5;i++)for(let layer=0;layer<3;layer++){
  const x=(i-2)*w*.18,y=.285+row*.33+layer*.045;b.box(w*.15,.038,.24,x,y,.39,['#a94b49','#e3ceb0','#304f62','#88a28a','#bd974b'][(i+layer)%5]);
  b.box(w*.15,.010,.012,x,y+.008,.263,'#eee4c9');
 }
}

function foodTable(b,w){
 const table=w*.73,cookerX=w*.40;
 for(const x of [-w*.46,w*.13])for(const z of [.22,.64])b.box(.04,.76,.04,x,.38,z,'#726656');
 b.box(table,.055,.52,-w*.12,.79,.44,'#e5d6b4');
 // Cloth has an uneven hem and shallow vertical folds, not a solid wall box.
 for(let i=0;i<9;i++)b.box(table/9+.003,.62+(i%3)*.025,.018,-w*.12-table/2+(i+.5)*table/9,.47,.177+(i%2)*.012,i%2?'#e9dec5':'#d5c7aa');
 for(const x of [-w*.12-table/2,-w*.12+table/2])b.box(.018,.63,.50,x,.47,.43,'#ded0b5');
 for(let i=0;i<3;i++){
  const x=-w*.12+(i-1)*table*.30;b.box(table*.27,.045,.36,x,.846,.41,'#39372e');b.box(table*.25,.015,.33,x,.875,.41,'#c2ab80');
  for(let j=0;j<6;j++){const g=new THREE.SphereGeometry(1,6,3);g.scale(.042,.025,.058);b.shape(g,x+(j%2-.5)*.08,.907,.32+Math.floor(j/2)*.09,['#c48e42','#bd773d','#dfb75e'][i]);}
  b.box(.26,.22,.025,x,1.03,.65,'#cbb17c');b.print(.235,.19,x,1.035,.635,2);
 }
 b.box(w*.23,.72,.44,cookerX,.36,.45,'#a5aaa5','metal');b.box(w*.25,.045,.46,cookerX,.75,.45,'#707c79','metal');
 b.shape(new THREE.CylinderGeometry(.15,.14,.17,10,1,true),cookerX,.85,.45,'#aaaaaa','metal');
 b.shape(new THREE.CylinderGeometry(.14,.14,.012,10),cookerX,.93,.45,'#6c4b28');
 b.box(.16,.018,.03,cookerX-.2,.89,.45,'#343b35');b.box(.11,.018,.025,cookerX+.19,.89,.45,'#343b35');
}

function iceDisplay(b){
 b.shape(new THREE.CylinderGeometry(.21,.23,.08,12),-.40,.04,.43,'#484b43');
 b.shape(new THREE.CylinderGeometry(.17,.11,.43,10),-.40,.295,.43,'#d2a346');
 for(let i=0;i<5;i++){const ring=new THREE.TorusGeometry(.15-i*.024,.055,5,10);ring.rotateX(Math.PI/2);b.shape(ring,-.40,.55+i*.09,.43,'#f7f1df');}
 b.shape(new THREE.ConeGeometry(.065,.17,8),-.40,1.0,.43,'#f7f1df');
 b.box(.025,1.94,.025,.40,.97,.58,'#5b6259');b.box(.46,.025,.025,.18,1.94,.58,'#5b6259');
 b.print(.40,.62,.19,1.58,.56,3);
}

export function buildKeihanVideoMerchandise(assembly){
 const root=assembly?.root;if(!root||typeof assembly.walkHeight!=='function')return {built:false,reason:'Registered owners and final floor required'};
 const old=root.getObjectByName(NAME);if(old)return old.userData.runtime;
 const plan=planKeihanVideoMerchandise(assembly);if(!plan.length)return {built:false,reason:'No registered open video bays'};
 const group=new THREE.Group();group.name=NAME;
 const materials={color:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82}),print:new THREE.MeshStandardMaterial({map:atlas(),side:THREE.DoubleSide,alphaTest:.4,roughness:.9}),metal:new THREE.MeshStandardMaterial({color:'#b3bbb7',metalness:.65,roughness:.36})};
 const detailGroups=[];
 for(const p of plan){const owner=new THREE.Group();owner.name=`${p.id} ${p.kind} bay ${p.bay}`;owner.position.set(...p.position);owner.rotation.y=p.yaw;owner.userData={detailRadius:28,sourceId:p.id,bay:p.bay,kind:p.kind,placement:'Inferred video merchandise; registered floor/frame; not surveyed inventory'};group.add(owner);detailGroups.push(owner);const b=batch(owner,materials);
  if(p.kind==='souvenirs')rack(b,p.width);else if(p.kind==='food-table')foodTable(b,p.width);else iceDisplay(b);b.finish();
 }
 const meshes=detailGroups.flatMap(g=>g.children),stats={groups:detailGroups.length,drawBatches:meshes.length,triangles:meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),textures:1,collidersAdded:0,lightsAdded:0,sourceIds:[...new Set(plan.map(p=>p.id))],inferred:true};
 const runtime={built:true,group,detailGroups,stats};group.userData.runtime=runtime;root.add(group);return runtime;
}
