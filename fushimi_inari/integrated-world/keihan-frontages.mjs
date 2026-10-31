import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const keihanFrontageIds=['way/305213552','way/305213538','way/305213554','way/305213533','way/305213560'];
const definitions=[
 {id:keihanFrontageIds[0],name:'Sohonke Hogyokudo',sourceName:'宝玉堂',edge:0,vertices:5,center:[-291.5,-104.4],widthRange:[4.1,4.6],kind:'senbei',height:6,publicRecess:1.35},
 {id:keihanFrontageIds[1],name:'Kyozuan',sourceName:'京豆庵',edge:1,vertices:4,center:[-254.3,-92.8],widthRange:[4.1,4.6],kind:'soft-serve',height:6,publicRecess:1.35},
 // The October 2024 panorama establishes a counter ahead on the north side.
 // Parcel 554 is the best perspective match, not a confirmed business identity.
 {id:keihanFrontageIds[2],name:'Observed north-side food counter',edge:4,vertices:6,center:[-249.92,-113.55],widthRange:[3.3,3.6],kind:'grill',height:6,publicRecess:0,registration:'Photo-inferred parcel; business identity withheld'},
 // November 2020 street panorama: bounded anonymous facade classes only.
 {id:keihanFrontageIds[3],name:'North row near Hommachi',edge:1,vertices:4,center:[-188.04,-89.91],widthRange:[9.6,10.0],kind:'red-awning-row',height:6,publicRecess:0,routeId:'way/79699849',registration:'Photo-inferred anonymous facade class; November 2020'},
 {id:keihanFrontageIds[4],name:'South row near Hommachi',edge:0,vertices:7,center:[-181.48,-73.04],widthRange:[9.3,9.8],kind:'green-awning-row',height:6,publicRecess:0,routeId:'way/79699849',registration:'Photo-inferred anonymous facade class; November 2020'}
];
const routeId='way/946510942';

function labelTexture(){
 // One local atlas for two confirmed business names and two product categories. No photographs,
 // advertising, remote fonts or runtime canvas redraws enter the scene.
 if(typeof document==='undefined'){
  const texture=new THREE.DataTexture(new Uint8Array([230,223,203,255]),1,1);texture.needsUpdate=true;return texture;
 }
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=256;
 const ctx=canvas.getContext('2d');
 if(!ctx)return null;
 ctx.fillStyle='#ded8c7';ctx.fillRect(0,0,2048,256);
 ctx.textAlign='center';ctx.textBaseline='middle';
 for(const [i,japanese,english]of [[0,'総本家 宝玉堂','SOHONKE HOGYOKUDO'],[1,'京豆庵','KYOZUAN']]){
  const x=256+i*512;ctx.fillStyle=i?'#e9dfc4':'#74685a';ctx.fillRect(i*512,0,512,256);
  ctx.fillStyle=i?'#242a28':'#f4f0df';ctx.font='bold 76px serif';ctx.fillText(japanese,x,104,480);
  ctx.font='24px sans-serif';ctx.fillText(english,x,191,470);
 }
 // The association listing confirms tofu and matcha tofu soft serve. Original
 // category boards convey that distinction without prices or copied artwork.
 for(const [i,title,subtitle]of [[2,'お豆腐ソフト','TOFU SOFT SERVE'],[3,'濃厚抹茶豆腐ソフト','MATCHA TOFU SOFT SERVE']]){
  const x=i*512;ctx.fillStyle=i===2?'#f2ead7':'#53683e';ctx.fillRect(x,0,512,256);
  ctx.fillStyle=i===2?'#393d2c':'#fff5d8';ctx.font='bold 43px serif';ctx.fillText(title,x+256,102,480);
  ctx.font='23px sans-serif';ctx.fillText(subtitle,x+256,184,480);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

// Original woven cloth: one static texture, shared across every canopy.
function clothTexture(){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 ctx.fillStyle='#eee9dc';ctx.fillRect(0,0,128,128);
 for(let i=0;i<128;i+=4){ctx.fillStyle=i%8?'#e8e2d4':'#ded6c7';ctx.fillRect(i,0,1,128);ctx.fillRect(0,i,128,1);}
 ctx.fillStyle='#c9c0ae';ctx.fillRect(0,0,3,128);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(12,2);return texture;
}

export function buildKeihanFrontages(root,features,surfaces,materials={},colliders=[]){
 const name='Registered Keihan approach food storefronts',old=root.getObjectByName(name);
 if(old)return {group:old,...old.userData};
 const segments=surfaces?.segments?.filter(s=>s.id===routeId||s.id==='way/79699849')??[];
 if(!segments.length)return {built:false,builtIds:[],reason:'Inari-shinmichi paved segments unavailable'};
 const streetHeight=(x,z,id)=>{
  let best=null;
  for(const s of segments){if(s.id!==id)continue;const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],den=dx*dx+dz*dz;if(den<1e-10)continue;
   const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/den)),d=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t),height=s.ya+(s.yb-s.ya)*t;
   if(!best||d<best.d)best={d,height};
  }
  return best?.height;
 };
 const stores=[];
 for(const source of definitions){
  const feature=features?.buildings?.find(b=>b.id===source.id),points=feature?.points?.slice(0,-1);
  if(!points||points.length!==source.vertices||(source.sourceName&&feature.tags.name!==source.sourceName)||!points.flat().every(Number.isFinite))return {built:false,builtIds:[],reason:'registered food-store footprint changed'};
  const cx=points.reduce((n,p)=>n+p[0],0)/points.length,cz=points.reduce((n,p)=>n+p[2],0)/points.length;
  if(Math.hypot(cx-source.center[0],cz-source.center[1])>2)return {built:false,builtIds:[],reason:'registered food-store position changed'};
  const a=points[source.edge],b=points[(source.edge+1)%points.length],width=Math.hypot(b[0]-a[0],b[2]-a[2]),t=[(b[0]-a[0])/width,(b[2]-a[2])/width],n=[t[1],-t[0]],yaw=-Math.atan2(t[1],t[0]);
  const at=(u,v)=>[a[0]+t[0]*u+n[0]*v,a[2]+t[1]*u+n[1]*v],floor=streetHeight(...at(width/2,1),source.routeId??routeId);
  if(width<source.widthRange[0]||width>source.widthRange[1]||!Number.isFinite(floor))return {built:false,builtIds:[],reason:'registered food-store frontage grade unavailable'};
  stores.push({...source,points,width,t,n,yaw,at,floor});
 }
 const group=new THREE.Group();group.name=name;
 const palette={
  plaster:new THREE.MeshStandardMaterial({color:'#ddd9cc',roughness:.94,vertexColors:true}),
  timber:new THREE.MeshStandardMaterial({color:'#70503a',roughness:.85}),
  dark:new THREE.MeshStandardMaterial({color:'#272e2b',roughness:.87}),
  stone:new THREE.MeshStandardMaterial({color:'#8b8e86',roughness:.95}),
  glass:new THREE.MeshStandardMaterial({color:'#b1cec7',roughness:.35,metalness:.08,transparent:true,opacity:.44,depthWrite:false}),
  red:new THREE.MeshStandardMaterial({color:'#bd4834',roughness:.86}),
  food:new THREE.MeshStandardMaterial({color:'#ca9c53',roughness:.95}),
  cloth:new THREE.MeshStandardMaterial({color:'#ffffff',map:clothTexture(),roughness:1,vertexColors:true}),
  lamp:new THREE.MeshStandardMaterial({color:'#fff0ca',emissive:'#ffc16b',emissiveIntensity:1.2,roughness:.6}),
  labels:new THREE.MeshStandardMaterial({color:'#ffffff',map:labelTexture(),roughness:.88})
 };
 const batches=new Map(),pending=[],lightPositions=[];
 const put=(g,m,tint)=>{const geom=g.index?g.toNonIndexed():g;if(g!==geom)g.dispose();if(m.vertexColors){const c=new THREE.Color(tint??'#ffffff'),colors=new Float32Array(geom.attributes.position.count*3);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}geom.setAttribute('color',new THREE.BufferAttribute(colors,3));}if(!batches.has(m))batches.set(m,[]);batches.get(m).push(geom);};
 const box=(w,h,d,x,y,z,mat,yaw=0,tint)=>{if(w<=0||h<=0||d<=0)return;const g=new THREE.BoxGeometry(w,h,d);g.rotateY(yaw);g.translate(x,y,z);put(g,mat,tint);};
 for(const [storeIndex,s]of stores.entries()){
  const {points,width:w,height:h,floor,at,yaw,kind}=s;
  const fb=(bw,bh,bd,u,y,v,mat,tint)=>{const [x,z]=at(u,v);box(bw,bh,bd,x,floor+y,z,mat,yaw,tint);};
  const blocker=(bw,bd,u,v,y0,y1,tag)=>{const [x,z]=at(u,v);pending.push({type:'box',args:[x,z,bw/2,bd/2,yaw,floor+y0,floor+y1,tag]});};
  const shaped=(geometry,u,y,v,mat,tint)=>{const [x,z]=at(u,v);geometry.rotateY(yaw);geometry.translate(x,floor+y,z);put(geometry,mat,tint);};
  // The existing projection is retained; the cloth now falls away from the
  // wall instead of reading as a thick horizontal slab. No clearance changes.
  const awning=(bw,u,back,front,backY,frontY,tint)=>{
   const depth=front-back,g=new THREE.BoxGeometry(bw,.035,depth),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const f=(depth/2-p.getZ(i))/depth;p.setY(i,p.getY(i)+backY+(frontY-backY)*f);}
   g.computeVertexNormals();shaped(g,u,0,(back+front)/2,palette.cloth,tint);
   fb(bw,.16,.035,u,frontY-.075,front,palette.cloth,tint);
   fb(bw,.045,.045,u,backY-.04,back,palette.dark);
   for(const du of [-bw/2+.05,bw/2-.05]){
    const rib=new THREE.BoxGeometry(.025,.025,Math.hypot(depth,backY-frontY));rib.rotateX(-Math.atan2(backY-frontY,depth));
    shaped(rib,u+du,(backY+frontY)/2-.035,(back+front)/2,palette.stone);
   }
  };
  const foundation=Math.min(floor-.2,...points.map(p=>p[1]-.2));
  // Preserve the complete source footprint; only the observed street edge is
  // open. The shallow display recess is backed and cannot reveal invented rooms.
  for(let i=0;i<points.length;i++){
   if(i===s.edge)continue;
   const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx);
   box(len,floor+h-foundation,.14,(a[0]+b[0])/2,(floor+h+foundation)/2,(a[2]+b[2])/2,palette.plaster,angle);
   pending.push({type:'box',args:[(a[0]+b[0])/2,(a[2]+b[2])/2,len/2,.07,angle,foundation,floor+h,'keihan_store_wall']});
  }
  const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();
  put(new THREE.ExtrudeGeometry(shape,{depth:floor-foundation,bevelEnabled:false}).rotateX(-Math.PI/2).translate(0,foundation,0),palette.stone);
  put(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,floor+h,0),palette.dark);
  if(kind.endsWith('-row')){
   const green=kind==='green-awning-row',bay=w/3,openBay=green?0:2;
   s.machineRecess={uMin:openBay*bay+.12,uMax:(openBay+1)*bay-.12,depth:1.30};s.interpretiveOpenBay=true;
   fb(w,h-2.65,.14,w/2,(h+2.65)/2,-.07,palette.plaster);
   for(let i=0;i<3;i++){
    const u=bay*(i+.5),bw=bay-.18;
    if(i===openBay||i===1){
     // An interpretive open service bay occupies the existing parcel. It is
     // backed, floored and bounded; no new business identity is implied.
     fb(bw,2.65,.10,u,1.325,-1.35,palette.dark);blocker(bw,.10,u,-1.35,0,2.65,'keihan_row_recess_back');
     for(const du of [-bw/2,bw/2]){fb(.09,2.65,1.35,u+du,1.325,-.675,palette.plaster);blocker(.09,1.35,u+du,-.675,0,2.65,'keihan_row_recess_jamb');}
     const extra=i===1,caseW=extra?bw-.18:bw-1.35,caseU=extra?u:green?u+.55:u-.55;
     fb(caseW,.87,.64,caseU,.435,-.54,palette.timber);fb(caseW+.06,.055,.69,caseU,.90,-.54,palette.stone);blocker(caseW,.69,caseU,-.54,0,1.10,'keihan_row_food_case');
     for(let r=0;r<2;r++)for(let c=0;c<5;c++){const x=caseU-caseW*.38+c*caseW*.19;fb(.14,.085,.12,x,.97+r*.10,-.36-r*.18,palette.food);fb(.16,.015,.14,x,.935+r*.10,-.36-r*.18,palette.red);}
     // Additional anonymous tea/sweets counters inside the existing row.
     // These open bays are interpretation, not verified current tenants.
     for(const y of [1.55,2.02]){
      fb(bw-.20,.055,.32,u,y,-1.10,palette.timber);
      for(let c=0;c<7;c++){
       const x=u-bw*.38+c*bw*.126;
       if(green){shaped(new THREE.CylinderGeometry(.065,.05,.15,8),x,y+.10,-1.07,palette.plaster);fb(.06,.025,.065,x,y+.19,-1.07,palette.red);}
       else{fb(.18,.16,.13,x,y+.11,-1.07,c%2?palette.food:palette.red);fb(.13,.035,.014,x,y+.12,-.998,palette.plaster);}
      }
     }
     fb(bw-.26,.07,.12,u,2.49,-.22,palette.lamp);
     const [lx,lz]=at(u,-.38);lightPositions.push([lx,floor+2.35,lz]);
     for(const du of [-bw*.35,bw*.35]){
      shaped(new THREE.CylinderGeometry(.11,.11,.26,10),u+du,2.22,-.13,palette.lamp);
      for(const y of [2.07,2.37])fb(.17,.035,.17,u+du,y,-.13,palette.dark);
     }
    }else{
     fb(bay,2.65,.14,u,1.325,-.07,palette.plaster);blocker(bay,.14,u,-.07,0,2.65,'keihan_observed_row_front');
     fb(bw,2.28,.05,u,1.27,.015,i===2?palette.dark:palette.stone);
     if(i<2)for(let j=0;j<15;j++)fb(bw,.022,.025,u,.24+j*.145,.048,palette.dark);
    }
    for(const du of [-bw/2,bw/2])fb(.055,2.38,.07,u+du,1.27,.045,palette.stone);
    awning(bw,u,-.05,.48,2.94,2.66,green?'#537568':'#a94736');
    fb(bw,.25,.075,u,3.14,-.005,palette.timber);
    for(const yy of [3.02,3.26])fb(bw,.025,.09,u,yy,.01,palette.food);
    for(const du of [-bw/2,bw/2])fb(.085,2.45,.085,u+du,1.3,.015,palette.timber);
    fb(bw-.20,.96,.035,u,4.43,.015,palette.dark);
    for(let j=0;j<7;j++)fb(.04,1.02,.055,u-(bw-.25)/2+j*(bw-.25)/6,4.43,.05,palette.timber);
    for(const y of [3.94,4.92])fb(bw-.12,.04,.06,u,y,.05,palette.timber);
   }
   if(green){
    fb(w,.10,.54,w/2,3.14,.17,palette.stone);
    for(let i=0;i<27;i++){const tile=new THREE.CylinderGeometry(.06,.06,.55,6,1,true);tile.rotateX(Math.PI/2);shaped(tile,w*i/26,3.21,.17,palette.dark);}
   }
   continue;
  }
  fb(w,2.65,.14,w/2,1.325,-1.43,palette.dark);blocker(w,.14,w/2,-1.43,0,2.65,'keihan_store_display_back');
  fb(w,h-2.65,.15,w/2,(h+2.65)/2,-.075,palette.plaster);
  for(const u of [.11,w-.11]){fb(.22,2.7,.34,u,1.35,-.17,palette.plaster);blocker(.22,.34,u,-.17,0,2.7,'keihan_store_jamb');}
  // Each canopy is above walking clearance. Products and cases remain inside
  // the mapped property instead of narrowing the public street with props.
  awning(w+.18,w/2,-.19,.72,3.02,2.83,kind==='senbei'?'#66584a':kind==='soft-serve'?'#708572':'#e4cfa5');
  for(const u of [.14,w-.14])fb(.065,2.56,.075,u,1.30,-.025,palette.timber);
  fb(w-.24,.12,.10,w/2,2.64,-.035,palette.timber);
  if(kind!=='grill'){
   const sign=new THREE.PlaneGeometry(kind==='senbei'?2.25:1.25,kind==='senbei'?.66:.75),uv=sign.attributes.uv;
   for(let i=0;i<uv.count;i++)uv.setX(i,(uv.getX(i)+storeIndex)/4);
   const sw=kind==='senbei'?2.25:1.25,sh=kind==='senbei'?.66:.75;
   fb(sw+.18,sh+.16,.08,w/2,3.54,-.022,palette.timber);
   for(const yy of [3.54-sh/2-.025,3.54+sh/2+.025])fb(sw+.14,.045,.09,w/2,yy,.015,palette.food);
   sign.rotateY(Math.PI);shaped(sign,w/2,3.54,.035,palette.labels);
  }
  // One light strip is geometry only; no per-store light or shadow capture.
  fb(w-.35,.035,.04,w/2,2.60,-.07,palette.plaster);
  const caseData=kind==='senbei'?[[.90,1.35],[w-.90,1.35]]:kind==='soft-serve'?[[.94,1.40],[w-.83,1.21]]:[];
  // Interpretive stock and equipment inside the recess, using existing batches.
  // Keep the doorway and public street clear; these are not inventory claims.
  for(const [u,bw] of caseData){
   for(const y of [1.58,2.05]){
    fb(bw-.12,.045,.32,u,y,-1.12,palette.timber);
    for(const du of [-bw*.35,bw*.35])fb(.035,.18,.25,u+du,y-.10,-1.15,palette.stone);
    for(let i=0;i<5;i++){
     const x=u-bw*.32+i*bw*.16,ph=.21+(i%3)*.035;
     fb(.14,ph,.13,x,y+.023+ph/2,-1.10,kind==='senbei'?palette.food:palette.plaster);
     fb(.10,.055,.008,x,y+.11,-1.031,i%2?palette.red:palette.dark);
     fb(.15,.018,.14,x,y+.032+ph,-1.10,palette.timber);
    }
   }
  }
  if(kind==='soft-serve'){
   const u=w-.85;
   for(const du of [-.27,.27])fb(.045,.91,.045,u+du,.455,-1.20,palette.stone);
   fb(.67,.06,.50,u,.94,-1.08,palette.stone);
   fb(.50,.49,.40,u,1.215,-1.09,palette.plaster);
   fb(.38,.15,.025,u,1.32,-.876,palette.dark);
   for(const du of [-.11,.11]){fb(.035,.15,.045,u+du,1.18,-.85,palette.dark);fb(.075,.035,.065,u+du,1.245,-.83,palette.red);}
   fb(.42,.025,.20,u,.985,-.85,palette.dark);
  }
  for(const [u,bw]of caseData){
   fb(bw,.68,.68,u,.34,-.43,kind==='senbei'?palette.timber:palette.plaster);blocker(bw,.68,u,-.43,0,1.25,'keihan_store_display_case');
   fb(bw,.065,.74,u,.73,-.43,palette.dark);fb(bw,.06,.62,u,1.20,-.42,palette.plaster);
   if(kind==='senbei'){
    // Association photograph: the two separate timber cases have angled
    // glazed display lids, with multiple narrow framed panes.
    const lid=new THREE.BoxGeometry(bw-.09,.48,.025);lid.rotateX(-.38);shaped(lid,u,.99,-.16,palette.glass);
    for(let pane=0;pane<5;pane++){
     const frame=new THREE.BoxGeometry(.025,.50,.035);frame.rotateX(-.38);
     shaped(frame,u-(bw-.09)/2+pane*(bw-.09)/4,.99,-.14,palette.timber);
    }
   }else fb(bw-.09,.40,.035,u,.98,-.085,palette.glass);
   for(const du of [-bw/2+.025,bw/2-.025])fb(.05,.47,.63,u+du,.98,-.42,palette.timber);
   for(let row=0;row<2;row++)for(let col=0;col<5;col++){
    const x=u-bw*.39+col*bw*.195,y=.81+row*.20;
    if(kind==='senbei'){
     const cracker=new THREE.CylinderGeometry(.071,.071,.025,10);cracker.rotateX(Math.PI/2);shaped(cracker,x,y,-.20-row*.16,palette.food);
     // The shop identifies fox and bell senbei; simplified silhouettes are
     // original geometry, not copies of packaging or claims of current stock.
     if(col%2===0){
      for(const dx of [-.044,.044]){const ear=new THREE.ConeGeometry(.029,.065,3);ear.rotateZ(dx<0?.22:-.22);shaped(ear,x+dx,y+.058,-.20-row*.16,palette.food);}
     }else fb(.045,.025,.025,x,y-.068,-.20-row*.16,palette.food);
     for(const dx of [-.023,.023])fb(.017,.026,.008,x+dx,y-.006,-.182-row*.16,palette.timber);
     fb(.17,.025,.11,x,y-.063,-.20-row*.16,palette.red);
    }else{
     const bowl=new THREE.CylinderGeometry(.065,.048,.055,8);shaped(bowl,x,y,-.21-row*.16,palette.plaster);
     shaped(new THREE.SphereGeometry(.052,8,4),x,y+.046,-.21-row*.16,palette.plaster,col%2?'#6b814b':'#f2e8cd');
    }
   }
   if(kind==='senbei')for(let col=0;col<4;col++){
    const x=u-bw*.33+col*bw*.22;fb(.21,.20,.15,x,1.33,-.40,palette.red);fb(.15,.045,.018,x,1.35,-.316,palette.plaster);
   }
  }
  if(kind==='senbei'){
   // The photograph shows a shallow tiled eave, not a new main-roof shape.
   fb(w+.22,.10,.63,w/2,3.14,.17,palette.stone);
   for(let i=0;i<19;i++){const tile=new THREE.CylinderGeometry(.055,.055,.64,6,1,true);tile.rotateX(Math.PI/2);shaped(tile,w*i/18,3.20,.17,palette.dark);}
   for(let i=0;i<16;i++)fb(.035,2.30,.025,.30+i*(w-.60)/15,1.30,-1.345,palette.timber);
   // Timber shop entrance surround and the dark recessed workshop visible in
   // the merchant-association photograph. Dimensions remain approximate.
   for(const u of [.24,w-.24])fb(.11,2.40,.12,u,1.30,-1.27,palette.timber);
   fb(w-.42,.13,.13,w/2,2.53,-1.27,palette.timber);
   for(const u of [.35,w-.35])fb(.08,.19,.28,u,2.76,.12,palette.dark);
   // Source-visible framed lower counter shelf and central door opening.
   for(const u of [.35,w-.35])fb(.20,.40,.05,u,1.98,-.04,palette.food);
  }else if(kind==='soft-serve'){
   // Readable original category boards sit beside the confirmed shop name. The
   // exact arrangement is inferred, rather than a claim about today's menu.
   for(let i=0;i<2;i++){
    const u=i?.94:w-.83,board=new THREE.PlaneGeometry(1.15,.42),uv=board.attributes.uv;
    for(let j=0;j<uv.count;j++)uv.setX(j,(uv.getX(j)+2+i)/4);
    board.rotateY(Math.PI);shaped(board,u,3.54,.035,palette.labels);
    fb(1.21,.48,.035,u,3.54,-.022,palette.timber);
   }
   // Long illustrated menu strip is interpreted with simple product motifs,
   // no copied prices or advertisements. Eight panels share existing batches.
   for(let i=0;i<8;i++){
    const u=.29+i*(w-.58)/7;fb((w-.35)/8,.34,.04,u,2.43,-.015,palette.plaster);
    shaped(new THREE.ConeGeometry(.06,.14,8),u,2.40,.02,palette.food);
    shaped(new THREE.SphereGeometry(.06,8,4),u,2.49,.02,palette.plaster,i%2?'#6b814b':'#f2e8cd');
   }
   for(const center of [1.00,w-1.0]){
    fb(1.44,.95,.06,center,4.64,-.015,palette.dark);
    for(let i=0;i<10;i++)fb(.035,1.04,.09,center-.68+i*.15,4.64,.04,palette.timber);
    for(const y of [4.18,5.08])fb(1.52,.045,.10,center,y,.045,palette.dark);
   }
   // Large soft-serve model is observed at the left case. Inset placement
   // retains a passable pavement despite uncertain centimeter positioning.
   const coneU=.35,coneV=-.29;
   shaped(new THREE.CylinderGeometry(.19,.20,.12,10),coneU,.06,coneV,palette.plaster);
   shaped(new THREE.ConeGeometry(.17,.45,12).rotateZ(Math.PI),coneU,.34,coneV,palette.food);
   // Tapered piped coil, with its center filled so the model is not a spring.
   const coil=[];for(let i=0;i<=72;i++){const t=i/72,r=.135*(1-t),a=t*Math.PI*8;coil.push(new THREE.Vector3(Math.cos(a)*r,.59+t*.50,Math.sin(a)*r));}
   shaped(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil),72,.052,6,false),coneU,0,coneV,palette.plaster);
   shaped(new THREE.ConeGeometry(.14,.49,12),coneU,.825,coneV,palette.plaster);
   blocker(.43,.45,coneU,coneV,0,1.20,'keihan_store_soft_serve_model');
  }else{
   // Observed October 2024 food counter: cream awning, dark wood, red
   // lanterns and a metal grill. All equipment stays behind the parcel edge.
   fb(w-.44,.94,.72,w/2,.47,-.47,palette.timber);
   fb(w-.36,.08,.80,w/2,.98,-.47,palette.stone);
   blocker(w-.44,.80,w/2,-.47,0,1.10,'keihan_food_counter');
   for(let i=0;i<16;i++)fb(.045,.87,.025,.29+i*(w-.58)/15,.49,-.095,palette.dark);
   fb(w-.50,.60,.06,w/2,2.20,-.03,palette.dark);
   // Display panels use food silhouettes, with no invented menu or prices.
   for(let i=0;i<3;i++){
    const u=.65+i*(w-1.30)/2;fb(.62,.43,.025,u,2.20,.013,palette.timber);
    fb(.022,.30,.018,u,2.17,.035,palette.food);
    for(let j=0;j<3;j++)shaped(new THREE.SphereGeometry(.048,8,4),u,2.12+j*.072,.053,palette.food);
   }
   for(const u of [.30,w-.30]){
    shaped(new THREE.CylinderGeometry(.14,.14,.33,10),u,2.31,-.20,palette.red);
    for(const y of [2.12,2.50])shaped(new THREE.CylinderGeometry(.11,.11,.045,10),u,y,-.20,palette.dark);
   }
   for(let i=0;i<7;i++)shaped(new THREE.SphereGeometry(.045,8,4),.34+i*(w-.68)/6,2.64,.39,palette.plaster);
   for(const u of [w*.32,w*.67]){
    fb(.74,.06,.42,u,1.06,-.42,palette.dark);
    for(let i=0;i<6;i++)fb(.025,.018,.37,u-.30+i*.12,1.102,-.42,palette.stone);
    for(let i=0;i<3;i++){
     const v=-.28-i*.12;fb(.55,.018,.012,u,1.125,v,palette.food);
     for(let j=0;j<3;j++)shaped(new THREE.SphereGeometry(.045,8,4),u-.12+j*.12,1.16,v,palette.food);
    }
   }
   // One upper window is visible above the awning; the rest remains plain.
   fb(1.50,1.18,.04,w/2,4.43,-.04,palette.dark);
   for(const du of [-.72,0,.72])fb(.045,1.22,.07,w/2+du,4.43,.005,palette.stone);
   for(const y of [3.84,5.02])fb(1.50,.045,.07,w/2,y,.005,palette.stone);
  }
 }
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.name='Keihan food storefront material';mesh.castShadow=!material.transparent;mesh.receiveShadow=true;group.add(mesh);}
 const publicStores=stores.map(({at,...s})=>s);
 const surfaceHeight=(x,z)=>{
  for(const s of stores){if(!s.publicRecess&&!s.machineRecess)continue;const a=s.points[s.edge],dx=x-a[0],dz=z-a[2],u=dx*s.t[0]+dz*s.t[1],v=dx*s.n[0]+dz*s.n[1];if(s.machineRecess&&u>=s.machineRecess.uMin&&u<=s.machineRecess.uMax&&v<=0&&v>=-s.machineRecess.depth)return s.floor;if(s.publicRecess&&u>=.22&&u<=s.width-.22&&v<=0&&v>=-s.publicRecess)return s.floor;}
  return null;
 };
 group.userData={built:true,builtIds:stores.map(s=>s.id),storefronts:publicStores,lightPositions,openServiceBays:4,surfaceHeight,collidersAdded:pending.length,materialBatches:group.children.length,drawBatches:group.children.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),sources:['https://www.youtube.com/watch?v=K0UC5GkHbaU&t=35s','https://inari-kyoto.com/hogyokudo','https://inari-kyoto.com/kyozuan','Street View October 2024 panorama jdt_0bBLBQcMoedhCMDVJA','Street View November 2020 panorama 6ki716lGb157sL6O6f-Gqw'],provenance:'Named OSM footprints 305213552/305213538 and merchant-association photos. North-side counter appearance from October 2024 Street View; parcel 305213554 is photo-inferred. Anonymous rows 305213533/305213560 interpret observed November 2020 facade classes. No additional business-name claims.',inferred:'Six-metre envelopes retain the existing default two-storey massing. Counter dimensions, upper elevations outside the crop and exact product positions are inferred. Public-road fronts remain clear. Four open anonymous service bays are interpretive additions requested for the expanded experience, not observed operating-status claims. No claim of current inventory or surveyed dimensions. Cloth seams, sloped canopies and piped soft-serve/product forms use the user video as typological reference; its edited sequence does not establish these exact parcel details.'};
 group.userData.productDetails={source:'https://inari-kyoto.com/kyozuan',categories:['tofu-soft-serve','matcha-tofu-soft-serve'],boards:2,inferred:'Original product-category typography, colors and board placement; not a current menu or stock claim.'};
 group.userData.hogyokudoDetails={source:'https://inari-kyoto.com/hogyokudo',photo:'https://inari-kyoto.com/wp/wp-content/uploads/2021/12/hogyokudo_main.jpg',features:['paired angled glazed timber cases','recessed timber surround','fox and bell senbei silhouettes'],inferred:'Case dimensions, framing, workshop depth and product placement are approximate; no current stock claim.'};
 root.add(group);colliders.push(...pending);return {group,...group.userData};
}
