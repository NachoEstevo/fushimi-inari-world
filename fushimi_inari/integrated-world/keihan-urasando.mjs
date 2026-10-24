import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Source polygons stay authoritative. Facade categories below interpret the
// user's dated street photographs; unnamed parcels do not acquire shop names.
const FRONTAGES=[
 {id:'way/296201563',anchor:[-147.6555,-90.2575],edge:2,kind:'entry-north',capture:'July 2025',height:6},
 {id:'way/305214377',anchor:[-148.075,-83.334],edge:2,kind:'entry-south',capture:'July 2025',height:4.5},
 {id:'way/295577541',anchor:[-120.2105,-88.588],edge:2,kind:'sando-chaya',capture:'official merchant photograph',height:9,name:'Sando Chaya'},
 {id:'way/296201558',anchor:[-138.387,-90.0575],edge:2,kind:'shutter-row',capture:'July 2025',height:6},
 {id:'way/296201560',anchor:[-130.9065,-89.6065],edge:1,kind:'shutter-row',capture:'July 2025',height:6},
 {id:'way/305214369',anchor:[-138.396,-82.538],edge:0,kind:'shutter-row',capture:'July 2025',height:4.5},
 {id:'way/305214378',anchor:[-129.9215,-81.686],edge:0,kind:'shutter-row',capture:'July 2025',height:4.5},
 {id:'way/305213645',anchor:[-111.2795,-84.92],edge:1,kind:'shutter-row',capture:'July 2025',height:4.5},
 {id:'way/305213646',anchor:[-101.5595,-82.9385],edge:8,kind:'shutter-row',capture:'July 2025',height:4.5},
 {id:'way/305213643',anchor:[-90.0245,-80.2835],edge:0,kind:'shutter-row',capture:'July 2025',height:4.5},
 {id:'way/305213640',anchor:[-80.916,-79.0365],edge:0,kind:'shutter-row',capture:'July 2025',height:4.5},
 {id:'way/305213641',anchor:[-75.032,-78.074],edge:4,kind:'shutter-row',capture:'July 2025',height:4.5},
 {id:'way/305213638',anchor:[-68.9155,-77.662],edge:2,kind:'shutter-row',capture:'July 2025',height:4.5},
 {id:'way/305213639',anchor:[-64.3405,-77.2225],edge:2,kind:'shutter-row',capture:'July 2025',height:4.5},
];
export const URASANDO_TORII_SOURCES=[
 {id:'way/952687112',duplicateNode:'node/12178150874',a:[-149.552941,-86.072230],b:[-149.470839,-88.554655],material:'vermilion',height:3.9},
 {id:'way/1051331882',a:[-60.007274,-73.292753],b:[-62.579796,-70.543161],material:'stone',height:4.1}
];
const ROUTE_IDS=['way/297888106','way/105449676'];
export function keihanUrasandoLayout(features,surfaces){
 const segments=surfaces?.segments?.filter(s=>ROUTE_IDS.includes(s.id))??[];if(!segments.length)return null;
 const streetHeight=(x,z)=>{let best=null;for(const s of segments){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t);if(!best||d<best.d)best={d,y:s.ya+(s.yb-s.ya)*t};}return best?.y;};
 const frontages=[];
 for(const source of FRONTAGES){const feature=features.buildings?.find(b=>b.id===source.id),points=feature?.points?.slice(0,-1);if(!points||source.edge>=points.length||!points.flat().every(Number.isFinite))return null;const a=points[source.edge],b=points[(source.edge+1)%points.length],width=Math.hypot(b[0]-a[0],b[2]-a[2]);if(width<2||width>18||Math.hypot((a[0]+b[0])/2-source.anchor[0],(a[2]+b[2])/2-source.anchor[1])>.15)return null;const t=[(b[0]-a[0])/width,(b[2]-a[2])/width],n=[t[1],-t[0]],at=(u,v)=>[a[0]+t[0]*u+n[0]*v,a[2]+t[1]*u+n[1]*v],floor=streetHeight(...at(width/2,.3));if(!Number.isFinite(floor))return null;frontages.push({...source,points,a,b,width,t,n,at,floor,yaw:-Math.atan2(t[1],t[0])});}
 return {frontages,streetHeight};
}

export function buildKeihanUrasando(root,features,surfaces,materials={},colliders=[]){
 const name='Mapped Urasando merchant corridor',old=root.getObjectByName(name);if(old)return {group:old,...old.userData};
 const layout=keihanUrasandoLayout(features,surfaces);if(!layout)return {built:false,builtIds:[],reason:'Urasando source footprints or paved grade missing'};
 const group=new THREE.Group();group.name=name;
 const colors={plaster:'#d3cbb7',timber:'#624632',dark:'#292e28',stone:'#91948b',cloth:'#ffffff',red:'#bd3e29',food:'#c9a75e',glass:'#8faaa0'},palette=Object.fromEntries(Object.entries(colors).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color,roughness:key==='glass'?.42:.91,vertexColors:key==='cloth',metalness:key==='glass'?.13:0})]));
 const batches=new Map(),pending=[],floors=[];
 const put=(g,key,tint='#ffffff')=>{const geo=g.index?g.toNonIndexed():g;if(geo!==g)g.dispose();geo.deleteAttribute('uv');if(key==='cloth'){const c=new THREE.Color(tint),colors=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(colors,3));}if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geo);};
 const box=(w,h,d,x,y,z,key,yaw=0,tint)=>{if(Math.min(w,h,d)<=0)return;const g=new THREE.BoxGeometry(w,h,d);g.rotateY(yaw);g.translate(x,y,z);put(g,key,tint);};
 const beam=(a,b,r,key,radial=6)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),g=new THREE.CylinderGeometry(r,r,delta.length(),radial);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());put(g,key);};
 for(const s of layout.frontages){const {points,width:w,height:h,floor,at,yaw,kind}=s,foundation=Math.min(floor-.18,...points.map(p=>p[1]-.2)),fb=(bw,bh,bd,u,y,v,key,tint)=>{const [x,z]=at(u,v);box(bw,bh,bd,x,floor+y,z,key,yaw,tint);},shaped=(g,u,y,v,key,tint)=>{const [x,z]=at(u,v);g.rotateY(yaw);g.translate(x,floor+y,z);put(g,key,tint);},block=(bw,bd,u,v,y0,y1,tag)=>{const [x,z]=at(u,v);pending.push({type:'box',args:[x,z,bw/2,bd/2,yaw,floor+y0,floor+y1,tag]});};
  // Full exact polygon massing replaces the previous neighborhood shell.
  // Only the selected street edge receives a shallow, backed display recess.
  for(let i=0;i<points.length;i++){if(i===s.edge)continue;const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx),base=Math.min(foundation,surfaces.height(a[0],a[2])-.12,surfaces.height(b[0],b[2])-.12);box(length,floor+h-base,.12,(a[0]+b[0])/2,(floor+h+base)/2,(a[2]+b[2])/2,'plaster',angle);pending.push({type:'box',args:[(a[0]+b[0])/2,(a[2]+b[2])/2,length/2,.06,angle,base,floor+h,'urasando_source_wall']});}
  const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();put(new THREE.ExtrudeGeometry(shape,{depth:floor-foundation,bevelEnabled:false}).rotateX(-Math.PI/2).translate(0,foundation,0),'stone');put(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,floor+h,0),'dark');
  const recess=kind==='sando-chaya'?1.6:.85;fb(w,2.7,.12,w/2,1.35,-recess,'dark');block(w,.12,w/2,-recess,0,2.7,'urasando_display_back');fb(w,h-2.7,.14,w/2,(h+2.7)/2,-.07,kind==='entry-south'?'timber':'plaster');
  const bays=Math.max(2,Math.round(w/2.7)),bw=w/bays;for(let i=0;i<=bays;i++){const u=i*bw,base=layout.streetHeight(...at(u,0))-floor;fb(.13,2.8-base,.20,u,(2.8+base)/2,-.10,'timber');block(.13,.20,u,-.10,base,2.8,'urasando_front_post');}
  const upperWindowCenter=Math.min(4,h-1);
  for(let i=0;i<bays;i++){const u=(i+.5)*bw;fb(bw-.2,1.15,.04,u,upperWindowCenter,.01,'dark');for(let j=0;j<6;j++)fb(.035,1.17,.05,u-(bw-.23)/2+j*(bw-.23)/5,upperWindowCenter,.05,'timber');for(const y of [upperWindowCenter-.59,upperWindowCenter+.59])fb(bw-.13,.055,.06,u,y,.055,'timber');}
  const awning=kind==='entry-north'?'#586a77':kind==='entry-south'?'#60766a':kind==='shutter-row'?'#a45e55':'#3a3d32';fb(w+.14,.11,.88,w/2,2.89,.22,'cloth',awning);fb(w+.14,.14,.055,w/2,2.79,.64,'cloth',awning);fb(w+.22,.10,.40,w/2,h-.05,.1,'dark');
  // Shallow ceramic eaves retain readable ribs without individual roof tiles.
  for(let u=.1;u<w;u+=.32){const tile=new THREE.CylinderGeometry(.045,.045,.44,5,1,true);tile.rotateX(Math.PI/2);shaped(tile,u,h+.02,.1,'stone');}
  if(kind==='shutter-row'){
   // Continuous shutter rows are observed in the July2025 frames. The fine
   // horizontal seams are flat strips in one batch, not hundreds of boxes.
   for(let i=0;i<bays;i++){const u=(i+.5)*bw;fb(bw-.17,2.43,.055,u,1.26,-.03,'stone');block(bw-.17,.10,u,-.03,0,2.55,'urasando_closed_shutter');for(let y=.15;y<2.45;y+=.13){const [x,z]=at(u,.002),g=new THREE.PlaneGeometry(bw-.22,.018);g.rotateY(Math.PI+yaw);g.translate(x,floor+y,z);put(g,'dark');}}
  }else if(kind==='entry-south'){
   for(let u=.16;u<w;u+=.22)fb(.025,h-2.8,.035,u,(h+2.8)/2,.025,'timber');
   // The low timber fence in the source remains behind the parcel edge.
   for(let u=.16;u<w;u+=.28)fb(.065,.88,.065,u,.44,-.06,'stone');for(const y of [.2,.67])fb(w,.06,.055,w/2,y,-.08,'timber');block(w,.12,w/2,-.1,0,.95,'urasando_observed_low_fence');
  }else if(kind==='sando-chaya'){
   for(let u=.3;u<w-.2;u+=.72)fb(.66,.42,.025,u,2.47,-.12,'cloth','#e5dfcb');
   for(const u of [1.35,w/2,w-1.35])shaped(new THREE.SphereGeometry(.20,10,6),u,2.10,-.70,'cloth','#e8d392');
   // A small public recess is backed; cases and bench stay inside footprint.
   floors.push({a:s.a,t:s.t,n:s.n,width:w,depth:1.4,height:Math.fround(floor)});
   const benchU=w*.74;fb(w*.35,.13,.66,benchU,.45,-.62,'food');fb(w*.35,.06,.62,benchU,.55,-.62,'red');for(const du of [-w*.14,w*.14])for(const v of [-.88,-.36])fb(.07,.40,.07,benchU+du,.20,v,'timber');block(w*.35,.66,benchU,-.62,0,.6,'urasando_tea_bench');
   fb(1.30,.65,.52,.88,.325,-.48,'timber');fb(1.32,.08,.54,.88,.70,-.48,'red');fb(1.26,.32,.04,.88,.88,-.20,'glass');block(1.30,.56,.88,-.48,0,1.08,'urasando_tea_case');for(let i=0;i<6;i++)shaped(new THREE.CylinderGeometry(.065,.045,.08,7),.4+i*.19,.79,-.48,'food');
   const umbrellaU=w*.52,[px,pz]=at(umbrellaU,-.88);beam([px,floor,pz],[px,floor+2.52,pz],.035,'dark');shaped(new THREE.ConeGeometry(.82,.28,20,1,true),umbrellaU,2.38,-.88,'red');for(let j=0;j<20;j++){const angle=j*Math.PI/10;beam([px,floor+2.52,pz],[px+Math.cos(angle)*.81,floor+2.24,pz+Math.sin(angle)*.81],.009,'timber',4);}pending.push({type:'cylinder',args:[px,pz,.04,floor,floor+2.6,'urasando_tea_parasol']});
   // Reed blind at the observed left edge; plain label strips omit prices.
   for(let y=1.13;y<2.45;y+=.065)fb(.80,.025,.025,.5,y,-.08,'food');
  }else{
   // Entry north row: pink noren, shallow display cases and visible souvenir
   // trays. No business name, product price or current inventory is asserted.
   for(let u=.3;u<w-.2;u+=.75)fb(.68,.26,.024,u,2.55,-.08,'cloth','#ad8b8f');
   for(let i=0;i<bays;i++){const u=(i+.5)*bw;fb(bw-.35,.72,.55,u,.36,-.43,'timber');fb(bw-.32,.07,.59,u,.76,-.43,'food');block(bw-.35,.59,u,-.43,0,.82,'urasando_display_counter');for(let j=0;j<4;j++){const pu=u-bw*.30+j*bw*.20;fb(.20,.22,.09,pu,.91,-.48,'cloth','#d9c7a5');fb(.18,.05,.11,pu,.81,-.46,'red');}}
  }
 }
 const torii=[];
 for(const source of URASANDO_TORII_SOURCES){const a=source.a,b=source.b,c=[(a[0]+b[0])/2,(a[1]+b[1])/2],span=Math.hypot(b[0]-a[0],b[1]-a[1]),t=[(b[0]-a[0])/span,(b[1]-a[1])/span],yaw=-Math.atan2(t[1],t[0]),y=layout.streetHeight(...c),key=source.material==='stone'?'stone':'red',h=source.height;
  // The separate OSM node at the entry is the same gate, never a second torii.
  for(const p of [a,b]){const py=layout.streetHeight(...p);beam([p[0],py,p[1]],[p[0],y+h-.25,p[1]],source.material==='stone'?.16:.14,key,8);box(.42,.22,.42,p[0],py+.11,p[1],'stone');if(source.material!=='stone')beam([p[0],py+.15,p[1]],[p[0],py+.70,p[1]],.155,'dark',8);pending.push({type:'cylinder',args:[p[0],p[1],.19,py,y+h,'urasando_torii_pillar']});}
  box(span+.45,.18,.21,c[0],y+h-.85,c[1],key,yaw);box(span+1.0,.26,.30,c[0],y+h-.24,c[1],key,yaw);for(const side of [-1,1]){const u=side*(span/2+.36),x=c[0]+t[0]*u,z=c[1]+t[1]*u;box(.45,.11,.35,x,y+h-.04,z,source.material==='stone'?'stone':'dark',yaw);}
  box(.24,.54,.18,c[0],y+h-.57,c[1],key,yaw);torii.push({...source,center:c,span,base:y});
  if(source.material!=='stone')for(const side of [-1,1]){
   // Pair of permanent stone lanterns visible beyond the entry in frame09.
   // Relative spacing is estimated from that view, not an added OSM claim.
   const forward=[-t[1],t[0]],x=c[0]+forward[0]*2.8+t[0]*side*1.75,z=c[1]+forward[1]*2.8+t[1]*side*1.75,base=layout.streetHeight(x,z);
   box(.62,.17,.62,x,base+.085,z,'stone');box(.42,.18,.42,x,base+.26,z,'stone');box(.25,.92,.25,x,base+.81,z,'stone');box(.48,.12,.48,x,base+1.31,z,'stone');box(.39,.40,.39,x,base+1.57,z,'stone');box(.22,.20,.012,x,base+1.58,z-.202,'dark');const roof=new THREE.ConeGeometry(.46,.25,4);roof.rotateY(Math.PI/4);roof.translate(x,base+1.89,z);put(roof,'stone');beam([x,base+2.0,z],[x,base+2.13,z],.07,'stone');pending.push({type:'cylinder',args:[x,z,.31,base,base+2.15,'urasando_entry_stone_lantern']});
  }
 }
 // The photos show small rectangular stone joints. These flat, millimetre
 // strips follow existing rendered paving; no second walk floor is created.
 for(const s of surfaces.segments.filter(s=>ROUTE_IDS.includes(s.id))){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz),n=[-dz/length,dx/length],point=(t,v)=>[s.a[0]+dx*t+n[0]*v,s.ya+(s.yb-s.ya)*t+.003,s.a[2]+dz*t+n[1]*v],strip=(a,b,c,d)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...c,...b,...a,...d,...c],3));g.computeVertexNormals();put(g,'dark');};
  const rows=Math.max(1,Math.ceil(length/.72));for(let i=0;i<rows;i++){const t=i/rows,half=.008/length;strip(point(Math.max(0,t-half),-s.width/2+.08),point(Math.min(1,t+half),-s.width/2+.08),point(Math.min(1,t+half),s.width/2-.08),point(Math.max(0,t-half),s.width/2-.08));}
  for(let v=-s.width/2+.65;v<s.width/2-.2;v+=.65)strip(point(0,v-.006),point(1,v-.006),point(1,v+.006),point(0,v+.006));
 }
 for(const [key,parts]of batches){const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geometry,palette[key]);mesh.name='Urasando '+key;mesh.castShadow=key!=='glass';mesh.receiveShadow=true;group.add(mesh);}
 const surfaceHeight=(x,z)=>{for(const f of floors){const dx=x-f.a[0],dz=z-f.a[2],u=dx*f.t[0]+dz*f.t[1],v=dx*f.n[0]+dz*f.n[1];if(u>.16&&u<f.width-.16&&v<=0&&v>=-f.depth)return f.height;}return null;};
 group.userData={built:true,builtIds:layout.frontages.map(s=>s.id),frontages:layout.frontages.map(({at,...s})=>s),torii,surfaceHeight,drawBatches:group.children.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),collidersAdded:pending.length,provenance:'Mapped Urasando source footprints; user July2025 StreetView V9rdlksoCt1-9trEC5DgSw, zTzNxb0AchRWsNcF690i9g, JIF05XmG1RnmiJiO2GPEdA, q639HVk2kpcrXKO84h2khw; official sandow.jp merchant frontage; OSM ceremonial gates952687112/1051331882, entry duplicate node12178150874 counted once.',inferred:'Facade dimensions, upper stories beyond photographs, product displays and torii heights are visual estimates. Business identity only for registered Sando Chaya. Festival lantern strings and temporary barriers omitted for spring. No current-inventory or surveyed claim.'};root.add(group);colliders.push(...pending);return {group,...group.userData};
}
