import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

const near=(a,b)=>Math.abs(a-b)<.001;
const box=(o,w,h,d,x,y,z)=>{const p=o.geometry?.parameters;return p&&near(p.width,w)&&near(p.height,h)&&near(p.depth,d)&&near(o.position.x,x)&&near(o.position.y,y)&&near(o.position.z,z);};
export function kumatakaRegistrationPlanR97(features){
  const f=features.buildings?.find(b=>b.id==='way/301527741'),ring=f?.points?.slice(0,-1);
  if(ring?.length!==4||ring.some(p=>!p.every(Number.isFinite)))return null;
  const a=ring[1],b=ring[0],w=Math.hypot(b[0]-a[0],b[2]-a[2]),tx=(b[0]-a[0])/w,tz=(b[2]-a[2])/w,front=[tz,-tx];
  const depth=Math.hypot(ring[2][0]-ring[1][0],ring[2][2]-ring[1][2]),center=[ring.reduce((s,p)=>s+p[0],0)/4,ring.reduce((s,p)=>s+p[2],0)/4];
  if(w<6||w>9||depth<4||depth>6)return null;
  return {ring,front,yaw:-Math.atan2(front[1],front[0]),center,scale:[depth/6,1,w/6.8],width:w,depth};
}
function hull(points){
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lo=[],hi=[];
  for(const p of points){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of points.toReversed()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function routeConflicts(owner,features){
  const strips=[];
  for(const path of features.paths.filter(p=>['way/626313754','way/301527750','way/439990443'].includes(p.id)))for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],len=Math.hypot(b[0]-a[0],b[2]-a[2]),n=[-(b[2]-a[2])/len,(b[0]-a[0])/len],half=(parseFloat(path.tags.width)||2)/2;
    strips.push([[a[0]+n[0]*half,a[2]+n[1]*half],[b[0]+n[0]*half,b[2]+n[1]*half],[b[0]-n[0]*half,b[2]-n[1]*half],[a[0]-n[0]*half,a[2]-n[1]*half]]);
  }
  const conflicts=[];owner.updateWorldMatrix(true,true);
  for(let i=0;i<28;i++){
    const x=-9.2-i%4*1.35,z=-8.5+Math.floor(i/4)*2.5,h=1.10+i%3*.32;
    const stele=owner.children.find(o=>!o.userData.interactable&&box(o,.56,h,.30,x,h/2+i%4*.18,z)),candidates=stele?[stele]:[];
    if(i%3===0)for(const o of owner.children){const g=o.geometry?.parameters;if(o.userData.interactable||!g||!near(o.position.x,x+.42)||!near(o.position.z,z))continue;if((g.radius===.16&&g.height===.48&&near(o.position.y,.38))||(g.radiusTop===.13&&g.radiusBottom===.16&&g.height===.14&&near(o.position.y,.32)))candidates.push(o);}
    const objects=[];let area=0;
    for(const object of candidates){
      const p=object.geometry.attributes.position,points=[],v=new THREE.Vector3();for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(object.matrixWorld);points.push([v.x,v.z]);}
      const footprint=hull(points),overlap=strips.reduce((s,strip)=>s+Math.abs(polygonArea(clipConvex(footprint,strip))),0);
      if(overlap>1e-6){objects.push(object);area+=overlap;}
    }
    if(objects.length)conflicts.push({index:i,area,objects});
  }
  return conflicts;
}

/** After R89 shop and R88 rail; before global static merging. Water stays root-owned. */
export function buildKumatakaRegistrationR97(root,features,surfaces,materials,colliders,{water}={}){
  if(root.children.some(g=>g.userData.kumatakaRegistrationR97))return null;
  const plan=kumatakaRegistrationPlanR97(features),owner=root.children.find(g=>g.userData.zone==='kumataka');if(!plan||!owner)return null;
  const body=owner.children.find(o=>o.userData.interactable&&near(o.position.x,-5.8)&&near(o.position.y,1.85)&&near(o.position.z,0));
  const base=owner.children.find(o=>box(o,4.8,.72,5.8,-5.8,.36,0)),details=owner.getObjectByName('Kumataka photographed timber pavilion and straw fringe');
  const plaque=owner.children.find(o=>box(o,.10,1.22,.67,-2.735,3.77,0));
  const candles=owner.children.filter(o=>o.isGroup&&near(o.position.x,-3.3)&&near(o.position.y,.25)&&near(Math.abs(o.position.z),2.4));
  const deck=owner.children.find(o=>box(o,9.2,.35,11.5,-2.2,.12,0));
  const oldRail=owner.getObjectByName('Kumataka photographed lakeside paling R88'),shore=owner.children.find(o=>box(o,1.15,1.10,18.5,2.4,.18,0));
  const legacyWater=owner.children.find(o=>o.geometry?.type==='PlaneGeometry'&&o.geometry.parameters.width===18&&o.geometry.parameters.height===22&&near(o.position.x,10.5)&&near(o.position.y,-.18)&&near(o.position.z,0));
  const basin=owner.children.find(o=>box(o,1.5,.82,1.1,-4.2,.48,5.2)),basinRoof=owner.children.find(o=>box(o,2.2,.32,1.8,-4.2,2.35,5.2));
  if(!body||!base||!details||!plaque||candles.length!==2||!deck||!oldRail||!shore||!basin||!basinRoof)return null;
  owner.updateWorldMatrix(true,true);const oldCenter=body.getWorldPosition(new THREE.Vector3()),oldCollider=colliders.find(c=>c.type==='box'&&c.args.at(-1)==='kumatakasha'&&Math.hypot(c.args[0]-oldCenter.x,c.args[1]-oldCenter.z)<.2);
  const floor=surfaces.terrainHeight(...plan.center),datum=owner.position.y;
  const pond=features.water.find(w=>w.id==='way/105449705'),pa=pond?.points[1],pb=pond?.points[2];
  if(!oldCollider||!pa||!pb||!Number.isFinite(floor)||datum>floor+.02||datum+.72<floor-.05)return null;
  const waterBounds=legacyWater?new THREE.Box3().setFromObject(legacyWater):null;
  const validReport=water?.built===true&&water.builtIds?.includes('way/105449705')&&Number.isFinite(water.waterLevel);
  if(water&&!validReport)return null;
  if(!water&&(!waterBounds||waterBounds.max.y-waterBounds.min.y>1e-5))return null;
  const waterLevel=validReport?water.waterLevel:(waterBounds.min.y+waterBounds.max.y)/2,pierBottom=waterLevel-.15;
  if(!Number.isFinite(waterLevel)||waterLevel>=floor-.10||floor-pierBottom>2)return null;
  const sw=[-(plan.ring[0][0]-plan.ring[1][0])/plan.width,-(plan.ring[0][2]-plan.ring[1][2])/plan.width];
  const bay=[(plan.ring[1][0]+plan.ring[2][0])/2+sw[0]*.75,(plan.ring[1][2]+plan.ring[2][2])/2+sw[1]*.75],bayFloor=surfaces.terrainHeight(...bay),bayYaw=-Math.atan2(sw[1],sw[0]);
  if(!Number.isFinite(bayFloor)||Math.abs(bayFloor-floor)>.18)return null;
  const bayPolygon=[[-1.1,-.9],[1.1,-.9],[1.1,.9],[-1.1,.9]].map(([x,z])=>[bay[0]+Math.cos(bayYaw)*x+Math.sin(bayYaw)*z,bay[1]-Math.sin(bayYaw)*x+Math.cos(bayYaw)*z]);
  for(const path of features.paths.filter(p=>['way/626313754','way/301527750'].includes(p.id)))for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),half=(parseFloat(path.tags.width)||2)/2+.28,n=[-dz/len*half,dx/len*half];
    if(Math.abs(polygonArea(clipConvex(bayPolygon,[[a[0]+n[0],a[2]+n[1]],[b[0]+n[0],b[2]+n[1]],[b[0]-n[0],b[2]-n[1]],[a[0]-n[0],a[2]-n[1]]])))>1e-6)return null;
  }
  const wet=pond.points.slice(0,-1);for(const tri of THREE.ShapeUtils.triangulateShape(wet.map(q=>new THREE.Vector2(q[0],q[2])),[]))if(Math.abs(polygonArea(clipConvex(bayPolygon,tri.map(i=>[wet[i][0],wet[i][2]]))))>1e-6)return null;
  const group=new THREE.Group();group.name='Kumataka mapped pavilion and lakeside passage R97';group.userData={kumatakaRegistrationR97:true,sourceFeature:'way/301527741'};
  const pavilion=new THREE.Group();pavilion.name='Kumataka original interaction mapped northwest toward Takeya';pavilion.rotation.y=plan.yaw;pavilion.scale.set(...plan.scale);
  pavilion.position.set(plan.center[0]+plan.front[0]*5.8*plan.scale[0],datum,plan.center[1]+plan.front[1]*5.8*plan.scale[0]);group.add(pavilion);
  const p=staticParts(group),stone=materials.entryStoneMat??materials.stoneMat,red=materials.vermilionMat,dark=new THREE.MeshStandardMaterial({color:'#292f28',roughness:.95});
  // A small mineral court remains inside the exact roof polygon; no invented
  // outer terrace or broad grade patch is inferred from building=roof.
  const contour=plan.ring.map(q=>new THREE.Vector2(q[0],q[2]));for(const t of THREE.ShapeUtils.triangulateShape(contour,[])){
    const tri=t.map(i=>plan.ring[i]);const a=tri[0],b=tri[1],c=tri[2];p.sheet([a[0],floor+.015,a[2],c[0],floor+.015,c[2],b[0],floor+.015,b[2]],stone);
  }
  // Register photographed lakeside paling to the mapped pond's west bank,
  // clipped to the pavilion's east eave endpoints. No pond plane is constructed.
  const dx=pb[0]-pa[0],dz=pb[2]-pa[2],len2=dx*dx+dz*dz;
  const projection=q=>{const t=Math.max(0,Math.min(1,((q[0]-pa[0])*dx+(q[2]-pa[2])*dz)/len2));return [pa[0]+dx*t,pa[2]+dz*t];};
  const railA=projection(plan.ring[2]),railB=projection(plan.ring[3]);
  pavilion.updateMatrix();const receiver=new THREE.Vector3(-7.77,0,2.48).applyMatrix4(pavilion.matrix),southwestReceiver=new THREE.Vector3(-7.77,0,-2.48).applyMatrix4(pavilion.matrix);
  // P3600705 looks southwest along the rear passage with lake on the left.
  // Its photographed terminal fence is this bounded SW return, not the NE run.
  const segments=[[railA,railB],[railB,[receiver.x,receiver.z]],[railA,[southwestReceiver.x,southwestReceiver.z]]],pending=[];
  let slats=0;
  for(const [a,b]of segments){
    const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),count=Math.max(2,Math.ceil(len/.18)),yaw=-Math.atan2(dz,dx),box=(w,h,d,x,y,z,m)=>p.put(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),m);
    // Localized architectural stone pier, not a wall around the entire pond.
    // Its submerged toe derives from the recognized original water plane.
    const courses=Math.max(2,Math.ceil((floor-.02-pierBottom)/.24)),height=(floor-.02-pierBottom)/courses;
    for(let row=0;row<courses;row++){
      const blocks=Math.max(2,Math.ceil(len/(row%2?.62:.53)));
      for(let j=0;j<blocks;j++){const t=(j+.5)/blocks;box(len/blocks-.009,height-.008,.40,a[0]+dx*t,pierBottom+(row+.5)*height,a[1]+dz*t,stone);}
    }
    box(len+.02,.12,.43,(a[0]+b[0])/2,floor+.04,(a[1]+b[1])/2,stone);
    for(let i=0;i<=count;i++){const t=i/count,x=a[0]+dx*t,z=a[1]+dz*t;box(.065,1.12,.075,x,floor+.64,z,red);box(.067,.15,.08,x,floor+1.275,z,dark);slats++;}
    for(const y of [floor+.27,floor+1.06])box(len,.075,.085,(a[0]+b[0])/2,y,(a[1]+b[1])/2,red);
    box(len+.06,.09,.14,(a[0]+b[0])/2,floor+1.40,(a[1]+b[1])/2,dark);
    pending.push({type:'box',args:[(a[0]+b[0])/2,(a[1]+b[1])/2,len/2,.07,yaw,floor,floor+1.45,'kumataka_mapped_lakeside_rail']});
  }
  const stats=p.flush(),conflicts=routeConflicts(owner,features);
  const entryTemizuya=owner.children.filter(o=>box(o,1.5,.82,1.1,-4.2,.48,5.2)||box(o,2.2,.32,1.8,-4.2,2.35,5.2));
  const temizuyaPathOverlaps=[];
  for(const o of entryTemizuya){
    const b=new THREE.Box3().setFromObject(o);for(const path of features.paths.filter(p=>['way/626313754','way/301527750'].includes(p.id)))for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],c=path.points[i],dx=c[0]-a[0],dz=c[2]-a[2],len=Math.hypot(dx,dz),half=(parseFloat(path.tags.width)||2)/2,n=[-dz/len*half,dx/len*half];
      const strip=[[a[0]+n[0],a[2]+n[1]],[c[0]+n[0],c[2]+n[1]],[c[0]-n[0],c[2]-n[1]],[a[0]-n[0],a[2]-n[1]]];
      const vertices=[],p=o.geometry.attributes.position,v=new THREE.Vector3();for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld);vertices.push([v.x,v.z]);}
      const area=Math.abs(polygonArea(clipConvex(hull(vertices),strip)));if(area>1e-6)temizuyaPathOverlaps.push({path:path.id,area,geometry:o.geometry.parameters,worldBounds:[b.min.toArray(),b.max.toArray()]});
    }
  }
  // Mutation starts only after all recognized replacement batches succeed.
  const entry=new THREE.Group();entry.name='Kumataka southwest entry temizuya source-relative bay R97';entry.position.set(bay[0],bayFloor,bay[1]);entry.rotation.y=bayYaw;group.add(entry);
  const e=staticParts(entry),timber=new THREE.MeshStandardMaterial({color:'#726754',roughness:.97}),entryRoof=new THREE.MeshStandardMaterial({color:'#666e65',roughness:.88,side:THREE.DoubleSide});
  for(const x of [-.82,.82])for(const z of [-.61,.61])e.box(.11,2.25,.11,x,1.125,z,timber);
  for(const z of [-.61,.61])e.box(1.84,.14,.14,0,2.18,z,timber);
  const roofTemp=new THREE.Group(),rp=staticParts(roofTemp);
  for(const side of [-1,1])rp.sheet([-1.1,2.30,side*.90,1.1,2.30,side*.90,-1.1,2.64,0,-1.1,2.64,0,1.1,2.30,side*.90,1.1,2.64,0],entryRoof);
  rp.flush();basinRoof.geometry=roofTemp.children[0].geometry;basinRoof.material=entryRoof;basinRoof.position.set(0,0,0);basinRoof.rotation.set(0,0,0);basinRoof.removeFromParent();entry.add(basinRoof);
  basin.removeFromParent();basin.position.set(0,.43,0);basin.rotation.set(0,0,0);entry.add(basin);
  const entryStats=e.flush();
  for(const o of [body,base,details,plaque,...candles]){o.removeFromParent();pavilion.add(o);}
  for(const o of [deck,oldRail,shore,...conflicts.flatMap(c=>c.objects)])o.removeFromParent();
  oldCollider.args=[...plan.center,2.5*plan.scale[0],3*plan.scale[2],plan.yaw,datum,datum+3.8,'kumatakasha'];colliders.push(...pending);root.add(group);
  for(const x of [-.82,.82])for(const z of [-.61,.61]){const q=new THREE.Vector3(x,0,z).applyAxisAngle(new THREE.Vector3(0,1,0),bayYaw);colliders.push({type:'cylinder',args:[bay[0]+q.x,bay[1]+q.z,.08,bayFloor,bayFloor+2.25,'kumataka_entry_temizuya_post']});}
  colliders.push({type:'box',args:[...bay,.75,.55,bayYaw,bayFloor,bayFloor+.84,'kumataka_entry_temizuya_basin']});
  const report={...stats,entryStats,builtIds:['way/301527741'],front:plan.front,roofCenter:plan.center,scale:plan.scale,datum,floor,rail:[railA,railB],slats,pier:{bottom:pierBottom,waterLevel,top:floor+.10,width:.43,segments},temizuya:{bay,bayFloor,front:sw,roofSize:[2.2,1.8],roofPolygon:bayPolygon,previousPathOverlaps:temizuyaPathOverlaps,pathOverlapArea:0,pondOverlapArea:0},clearedSteleIndices:conflicts.map(c=>c.index),clearedMeshes:conflicts.reduce((s,c)=>s+c.objects.length,0),preservedInteraction:true,pondChanged:false,
    sources:['https://fushimiinari-guide.com/wp-content/uploads/P3600691_20190219.jpg','https://fushimiinari-guide.com/wp-content/uploads/P3600705_20190210.jpg','https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg'],limits:'Exact mapped roof and bank line, photograph-confirmed NW worship front. Heights, slat counts and bounded return inferred; no outer memorial terrace surveyed.'};
  group.userData={...group.userData,...report};return {group,...report};
}
