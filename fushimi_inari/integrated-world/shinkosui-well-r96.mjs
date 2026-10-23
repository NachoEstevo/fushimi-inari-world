import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
export const SHINKOSUI_ROOF_ID='way/305214828';
const NAME='Shinkosui mapped roofed well R96';
// Primary OSM node11941092061 (34.9669758,135.7733513) lies inside this
// primary OSM roof polygon. The named water_well node was absent from the
// original extract; its live API record is cached .tmp/r96-well-live-osm.xml.
export function shinkosuiLayoutR96(features){
 const f=features.buildings?.find(f=>f.id===SHINKOSUI_ROOF_ID),p=f?.points;
 if(f?.tags?.building!=='roof'||p?.length!==5||!p.every(q=>q.every(Number.isFinite)))return null;
 const width=Math.hypot(p[2][0]-p[1][0],p[2][2]-p[1][2]),depth=Math.hypot(p[0][0]-p[1][0],p[0][2]-p[1][2]);
 const center=[(p[0][0]+p[2][0])/2,(p[0][2]+p[2][2])/2];
 if(width<3.5||width>3.7||depth<2.3||depth>2.5||Math.hypot(center[0]-62.133,center[1]-18.34)>.05)return null;
 return {id:f.id,center,width,depth,yaw:-Math.atan2(p[2][2]-p[1][2],p[2][0]-p[1][0]),ring:p.slice(0,-1).map(q=>[q[0],q[2]])};
}
export function buildShinkosuiWellR96(root,features,surfaces,materials={},colliders=[],options={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const plan=shinkosuiLayoutR96(features);if(!plan)return {built:false,builtIds:[],reason:'mapped-roof-signature-required'};
 const {width:w,depth:d,center:[cx,cz],yaw}=plan,c=Math.cos(yaw),s=Math.sin(yaw),world=(u,v)=>[cx+c*u+s*v,cz-s*u+c*v];
 const near=[];let levels=[],covered=0;
 const positions=options.terrainPositions;
 if(!positions?.length||positions.length%9)return {built:false,builtIds:[],reason:'actual-rendered-support-required'};
 for(let i=0;i<positions.length;i+=9){const t=[0,1,2].map(j=>[positions[i+j*3],positions[i+j*3+1],positions[i+j*3+2]]);if(Math.max(...t.map(p=>p[0]))<cx-w||Math.min(...t.map(p=>p[0]))>cx+w||Math.max(...t.map(p=>p[2]))<cz-d||Math.min(...t.map(p=>p[2]))>cz+d)continue;near.push(...positions.slice(i,i+9));}
 const height=makeShoulderTriangleHeight(near);
 for(let i=0;i<near.length;i+=9){const tri=[0,1,2].map(j=>[near[i+j*3],near[i+j*3+2]]),overlap=clipConvex(tri,plan.ring);if(overlap.length){covered+=Math.abs(polygonArea(overlap));levels.push(...overlap.map(p=>height(...p)));}}
 const expected=Math.abs(polygonArea(plan.ring));
 if(Math.abs(covered-expected)>.01||!levels.length||!levels.every(Number.isFinite))return {built:false,builtIds:[],reason:'incomplete-or-overlapping-rendered-support',covered,expected};
 const relief=Math.max(...levels)-Math.min(...levels);if(relief>.18)return {built:false,builtIds:[],reason:'well-court-grade-conflict',relief};
 const floor=surfaces.height(cx,cz);if(!Number.isFinite(floor)||floor-Math.max(...levels)>.28||floor-Math.min(...levels)<.03)return {built:false,builtIds:[],reason:'unsupported-well-floor',floor,terrain:[Math.min(...levels),Math.max(...levels)]};
 const fw=w-.66,fd=d-.56,body=[[-fw/2,-fd/2],[fw/2,-fd/2],[fw/2,fd/2],[-fw/2,fd/2]].map(p=>world(...p));
 // The roof is a mapped eave. Keep its physical closed fence inset, preserving
 // the already mapped public service-stub corridor rather than widening it.
 for(const seg of surfaces.segments??[]){const a=seg.a,b=seg.b,dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(!len)continue;const r=(seg.width??1.8)/2+.12,nx=-dz/len*r,nz=dx/len*r;const cut=[[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]];if(Math.abs(polygonArea(clipConvex(body,cut)))>1e-5)return {built:false,builtIds:[],reason:'mapped-walking-corridor-conflict',path:seg.id};}
 // Existing physical owners remain authoritative; do not layer a closed well
 // fence through an already assembled building, barrier or tree trunk.
 for(const collider of colliders){const a=collider.args??[];if(collider.type==='box'){
  if(a.length<5)continue;if(Number.isFinite(a[6])&&a[6]<floor)continue;if(Number.isFinite(a[5])&&a[5]>floor+2.2)continue;
  const co=Math.cos(a[4]??0),si=Math.sin(a[4]??0),cut=[[-a[2],-a[3]],[a[2],-a[3]],[a[2],a[3]],[-a[2],a[3]]].map(([u,v])=>[a[0]+co*u+si*v,a[1]-si*u+co*v]);
  if(Math.abs(polygonArea(clipConvex(body,cut)))>1e-5)return {built:false,builtIds:[],reason:'existing-solid-conflict',owner:a[7]??'box'};
 }else if(collider.type==='cylinder'){
  const dx=a[0]-cx,dz=a[1]-cz,u=c*dx-s*dz,v=s*dx+c*dz;
  if(Math.hypot(Math.max(0,Math.abs(u)-fw/2),Math.max(0,Math.abs(v)-fd/2))<(a[2]??0))return {built:false,builtIds:[],reason:'existing-solid-conflict',owner:'cylinder'};
 }}
 const group=new THREE.Group();group.name=NAME;group.position.set(cx,floor,cz);group.rotation.y=yaw;
 const material=(key,color)=>materials[key]??new THREE.MeshStandardMaterial({color,roughness:.94});
 const wood=material('wellTimberMat','#655b48'),roof=material('wellRoofMat','#626451'),stone=materials.entryStoneMat??material('stoneMat','#a3a393'),gold=materials.goldMat??material('wellGoldMat','#ac9456');
 const parts=staticParts(group),bottom=Math.min(...levels)-floor-.035;
 parts.box(fw+.16,.035-bottom,fd+.16,0,(.035+bottom)/2,0,stone);
 // Closed square picket perimeter. Photograph does not license public entry,
 // a visible pump, moving bucket, basin contents, inscription or water draw.
 let pickets=0;
 for(const zz of [-fd/2,fd/2]){for(let i=0;i<=16;i++){parts.box(.055,1.30,.055,-fw/2+fw*i/16,.73,zz,wood);pickets++;}for(const y of [.38,1.14])parts.box(fw,.075,.085,0,y,zz,wood);}
 for(const xx of [-fw/2,fw/2]){for(let i=1;i<10;i++){parts.box(.055,1.30,.055,xx,.73,-fd/2+fd*i/10,wood);pickets++;}for(const y of [.38,1.14])parts.box(.085,.075,fd,xx,y,0,wood);}
 for(const xx of [-fw/2+.12,fw/2-.12])for(const zz of [-fd/2+.12,fd/2-.12]){parts.box(.14,2.16,.14,xx,1.12,zz,wood);parts.box(.24,.10,.24,xx,.085,zz,stone);}
 for(const zz of [-fd/2+.12,fd/2-.12])parts.box(fw,.17,.17,0,2.12,zz,wood);
 for(const xx of [-fw/2+.12,fw/2-.12])parts.box(.17,.17,fd,xx,2.12,0,wood);
 const ridge=2.94,eave=2.18;
 // Thick two-pitch muted roof follows mapped eave dimensions; photo establishes
 // the gable and shallow eaves, while exact curvature/depth remain inferred.
 for(const side of [-1,1]){
  const length=Math.hypot(d/2,ridge-eave),angle=Math.atan2((ridge-eave)*side,d/2);
  const panel=new THREE.BoxGeometry(w,.12,length).rotateX(angle).translate(0,(ridge+eave)/2,side*d/4);parts.put(panel,roof);
  parts.box(w,.13,.12,0,eave,side*(d/2-.04),wood);
  for(let i=0;i<18;i++){const xx=-w/2+.12+i*(w-.24)/17;parts.beam([xx,eave-.05,side*(d/2-.08)],[xx,ridge-.11,0],.025,wood,.025,6);}
 }
 parts.box(w,.15,.20,0,ridge+.045,0,roof);
 for(const xx of [-w/2+.08,w/2-.08]){
  for(const side of [-1,1])parts.beam([xx,eave-.02,side*(d/2-.04)],[xx,ridge-.02,0],.065,wood,.065,4);
  parts.box(.05,.12,.18,xx,ridge+.055,0,gold);
 }
 const stats=parts.flush();root.add(group);colliders.push({type:'box',args:[cx,cz,fw/2+.04,fd/2+.04,yaw,floor,floor+1.43,'shinkosui-well-fence']});
 group.userData={built:true,builtIds:[SHINKOSUI_ROOF_ID],revision:'R96',...plan,floor,renderedSupport:[Math.min(...levels),Math.max(...levels)],relief,pickets,posts:4,...stats,terrainChanged:false,collidersAdded:1,source:'https://api.openstreetmap.org/api/0.6/node/11941092061; https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/',limits:'Named well node inside mapped roof; actual 2016 photo vocabulary. Timber/picket counts, heights, roof section and material values inferred. No pump, public entry, unseen well shaft or new court extension.'};return group.userData;
}
