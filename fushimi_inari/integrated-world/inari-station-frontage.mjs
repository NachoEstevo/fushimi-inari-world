import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {inariStationRouteLayout} from './inari-station-route.mjs';

export const inariStationFrontageId='way/795552041';
// Observed businesses share the road-facing ground floor of mio表参道.
// The dated photos establish their order and equipment categories; exact bay
// dimensions and concealed rear elevations retain the mapped massing estimate.
export function buildInariStationFrontage(root,features,surfaces,materials={},colliders=[]){
 const name='Photo registered Daily Yamazaki and MIO Park frontage',old=root.getObjectByName(name);if(old)return {group:old,...old.userData};
 const feature=features.buildings.find(b=>b.id===inariStationFrontageId);if(!feature)return {built:false,builtIds:[],reason:'mapped mio frontage missing'};
 let layout;try{layout=inariStationRouteLayout(features,surfaces);}catch(error){return {built:false,builtIds:[],reason:'existing paved street unavailable: '+error.message};}if(!layout)return {built:false,builtIds:[],reason:'station route source missing'};
 const points=feature.points.slice(0,-1),height=Number(feature.tags['building:levels'])*3;
 if(points.length!==8||height!==9)return {built:false,builtIds:[],reason:'registered frontage envelope changed'};
 const a=points[6],b=points[7],length=Math.hypot(b[0]-a[0],b[2]-a[2]),t=[(b[0]-a[0])/length,(b[2]-a[2])/length],n=[t[1],-t[0]],yaw=-Math.atan2(t[1],t[0]);
 // Local v is east, outside the registered wall. Interior recesses are v<0.
 const at=(u,v)=>[a[0]+t[0]*u+n[0]*v,a[2]+t[1]*u+n[1]*v],floor=layout.roadHeight(...at(length/2,.7));
 if(length<11.9||length>12.1)return {built:false,builtIds:[],reason:'registered frontage envelope changed'};
 const group=new THREE.Group();group.name=name;
 const tile=new THREE.MeshStandardMaterial({color:'#938278',roughness:.96}),whiteTile=new THREE.MeshStandardMaterial({color:'#c6c6bc',roughness:.95}),charcoal=new THREE.MeshStandardMaterial({color:'#3e4a49',roughness:.85}),white=new THREE.MeshStandardMaterial({color:'#e0e3d9',roughness:.73}),glass=new THREE.MeshStandardMaterial({color:'#526868',roughness:.37,metalness:.18}),dark=new THREE.MeshStandardMaterial({color:'#363e3b',roughness:.97}),capsule=new THREE.MeshStandardMaterial({color:'#517ba1',roughness:.64}),red=new THREE.MeshStandardMaterial({color:'#aa4e38',roughness:.8});
 const size=32,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,value=x%8===0||y%4===0?127:225+(x*13+y*7)%17;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}
 const map=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;map.needsUpdate=true;tile.map=map;tile.bumpMap=map;tile.bumpScale=.003;whiteTile.map=map;
 const batches=new Map(),pending=[];
 const put=(g,m)=>{const geo=g.index?g.toNonIndexed():g;if(g!==geo)g.dispose();if(!batches.has(m))batches.set(m,[]);batches.get(m).push(geo);};
 const box=(w,h,d,x,y,z,mat,angle=0)=>{if(w<=0||h<=0||d<=0)return;const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const face=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(face<2?d:w)/.32,uv.getY(i)*(face===2||face===3?d:h)/.32);}g.rotateY(angle);g.translate(x,y,z);put(g,mat);};
 const fb=(w,h,d,u,y,v,mat)=>{const [x,z]=at(u,v);box(w,h,d,x,floor+y,z,mat,yaw);};
 const wallCollider=(u,w,v,d,y0,y1,tag)=>{const [x,z]=at(u,v);pending.push({type:'box',args:[x,z,w/2,d/2,yaw,floor+y0,floor+y1,tag]});};
 // Preserve the eight-corner source footprint. Only its public east edge is
 // opened; the other sides retain restrained, explicitly inferred massing.
 for(let i=0;i<points.length;i++){
  if(i===6)continue;const p=points[i],q=points[(i+1)%points.length],dx=q[0]-p[0],dz=q[2]-p[2],len=Math.hypot(dx,dz),angle=-Math.atan2(dz,dx),base=Math.min(surfaces.height(p[0],p[2]),surfaces.height(q[0],q[2]),floor)-.10;
  box(len,floor+height-base,.15,(p[0]+q[0])/2,(floor+height+base)/2,(p[2]+q[2])/2,tile,angle);pending.push({type:'box',args:[(p[0]+q[0])/2,(p[2]+q[2])/2,len/2,.075,angle,base,floor+height,'mapped_mio_wall']});
 }
 // Three ground-floor cheeks bound two real shop bays. Recessed glass and
 // rear closures are physically behind the wall; the public route stays out.
 for(const [u,w]of [[.14,.28],[3.45,.42],[length-.14,.28]]){fb(w,3.25,.45,u,1.625,-.225,whiteTile);wallCollider(u,w,-.225,.45,-.3,3.25,'mapped_mio_store_cheek');}
 fb(length,.60,.30,length/2,3.55,-.15,tile);
 const daily={u0:3.66,u1:length-.28,recess:.42},mio={u0:.28,u1:3.24,recess:1.05};
 for(const bay of [daily,mio]){
  const w=bay.u1-bay.u0,u=(bay.u0+bay.u1)/2;fb(w,.15,bay.recess,u,-.075,-bay.recess/2,whiteTile);fb(w,.15,bay.recess,u,3.10,-bay.recess/2,white);
  fb(w,2.93,.08,u,1.59,-bay.recess,daily===bay?glass:dark);wallCollider(u,w,-bay.recess,.08,0,3.15,'registered_store_rear_glazing');
 }
 const step=(daily.u1-daily.u0)/5;
 for(let i=0;i<=5;i++){const u=daily.u0+i*step;fb(.045,2.94,.10,u,1.57,-daily.recess+.06,white);}
 for(const y of [.16,1.08,2.63,3.02])fb(daily.u1-daily.u0,.05,.10,(daily.u0+daily.u1)/2,y,-daily.recess+.06,white);
 // The observed pale base frame meets the paving; the former 125mm void
 // below the glass exposed the unmodelled room behind the shop frontage.
 fb(daily.u1-daily.u0,.125,.08,(daily.u0+daily.u1)/2,.0625,-daily.recess,white);
 // Lower frosted bands from the observed doors/windows, with no copied ads.
 fb(daily.u1-daily.u0,.66,.018,(daily.u0+daily.u1)/2,.68,-daily.recess+.115,white);
 // 2021 sign treatment: charcoal fascia, paired white stripes. Text uses a
 // small physical stencil, making the confirmed identity visible in CPU views.
 const fasciaCenter=(daily.u0+daily.u1)/2,fasciaW=daily.u1-daily.u0+.42;
 fb(fasciaW,.86,.17,fasciaCenter,3.43,.02,charcoal);for(const y of [3.20,3.66])fb(fasciaW-.18,.075,.025,fasciaCenter,y,.12,white);
 const glyphs={D:['11110','10001','10001','10001','10001','10001','11110'],A:['01110','10001','10001','11111','10001','10001','10001'],I:['111','010','010','010','010','010','111'],L:['10000','10000','10000','10000','10000','10000','11111'],Y:['10001','10001','01010','00100','00100','00100','00100'],M:['10001','11011','10101','10101','10001','10001','10001'],Z:['11111','00001','00010','00100','01000','10000','11111'],K:['10001','10010','10100','11000','10100','10010','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001']};
 // Local u runs north-to-south, opposite left-to-right from the road.
 const text=(label,center,y,pixel,mat,v)=>{const width=[...label].reduce((n,c)=>n+(glyphs[c]?.[0].length??3)+1,0)*pixel;let cursor=center+width/2;for(const c of label){const rows=glyphs[c];if(rows)for(let row=0;row<7;row++)for(let col=0;col<rows[row].length;col++)if(rows[row][col]==='1')fb(pixel*.90,pixel*.90,.018,cursor-(col+.5)*pixel,y+(3-row)*pixel,v,mat);cursor-=((rows?.[0].length??3)+1)*pixel;}};
 text('DAILY YAMAZAKI',fasciaCenter,3.43,.049,white,.132);
 fb(2.0,.35,.12,(mio.u0+mio.u1)/2,2.85,.025,white);text('MIO PARK',(mio.u0+mio.u1)/2,2.85,.033,red,.10);
 // Source-visible equipment is seated INSIDE the MIO recess so its uncertain
 // exact projection cannot consume the narrow public walking margin.
 const machineU=.89,machineV=-.38;fb(.88,1.87,.65,machineU,.935,machineV,white);wallCollider(machineU,.88,machineV,.65,0,1.87,'photo_mio_drinks_machine');
 fb(.69,.83,.025,machineU,1.31,machineV+.34,glass);fb(.50,.29,.025,machineU,.36,machineV+.34,charcoal);
 for(let row=0;row<3;row++)for(let col=0;col<5;col++){fb(.085,.13,.035,machineU-.25+col*.125,1.05+row*.25,machineV+.37,[capsule,red,white][(row+col)%3]);fb(.06,.025,.04,machineU-.25+col*.125,.95+row*.25,machineV+.37,charcoal);}
 for(const u of [2.15,2.76]){fb(.54,1.48,.46,u,.74,-.25,white);wallCollider(u,.54,-.25,.46,0,1.48,'photo_mio_capsule_stack');for(const y of [.39,1.11]){fb(.43,.35,.025,u,y+.15,-.006,glass);fb(.32,.25,.025,u,y-.19,-.006,capsule);const [x,z]=at(u,.018);const g=new THREE.CylinderGeometry(.073,.073,.035,10);g.rotateX(Math.PI/2);g.rotateY(yaw);g.translate(x,floor+y-.04,z);put(g,charcoal);}}
 // The source photograph shows brick upper floors with recessed galleries.
 // Keep the inherited 9m estimate; bay count and depth are photo estimates.
 for(const level of [3.95,6.5]){
  fb(length,.20,.75,length/2,level,-.375,tile);fb(length,.82,.16,length/2,level+.48,-.08,tile);fb(length,1.84,.08,length/2,level+1.30,-.70,glass);
  for(const u of [.11,length/2,length-.11])fb(.22,2.55,.75,u,level+1.275,-.375,tile);
  fb(length,.16,.82,length/2,level+2.44,-.37,tile);for(const u of [2,4,6,8,10])fb(.06,1.72,.11,u,level+1.39,-.64,charcoal);
 }
 wallCollider(length/2,length,-.70,.10,3.85,height,'mapped_mio_upper_recess');
 const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();put(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2).translate(0,floor+height,0),charcoal);
 for(const [mat,parts]of batches){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 const surfaceHeight=(x,z)=>{const dx=x-a[0],dz=z-a[2],u=dx*t[0]+dz*t[1],v=dx*n[0]+dz*n[1];return [daily,mio].some(b=>u>=b.u0&&u<=b.u1&&v<=0&&v>=-b.recess)?floor:null;};
 group.userData={built:true,builtIds:[inariStationFrontageId],surfaceHeight,sourceFeature:inariStationFrontageId,footprint:points,floor,height,publicEdge:6,publicLength:length,storefronts:[{name:'Daily Yamazaki 京都伏見稲荷大社前店',...daily},{name:'MIO Park ミオパーク',...mio}],equipment:['one observed white drinks cabinet','two observed stacked capsule cabinets'],collidersAdded:pending.length,drawBatches:group.children.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),provenance:'OSM way795552041 mio表参道, three levels. Townphoto2016 k01102/k01105/k01106 situate the building north of JR and directly west of the first torii. Inspected primary 2021 visitor photographs IMG_5720_20210418.jpg and IMG_5722_20210418.jpg establish Daily Yamazaki fascia/glazing, MIO opening and drinks/capsule cabinets.',inferred:'9m envelope retains existing 3m/storey estimate. Bay widths, gallery depth, glazing subdivisions, equipment dimensions and inset equipment placement are inferred. Physical uppercase sign lettering interprets the confirmed identity rather than reproducing its exact script logo.',limits:'Shop exterior reflects the dated 2021 photos, not verified 2026 conditions. Interiors, advertising, prices, neighboring shop identities and hidden rear elevations are not reconstructed. Equipment is inset to preserve public clearance. Render review remains root-owned.'};
 root.add(group);colliders.push(...pending);return {group,...group.userData};
}
