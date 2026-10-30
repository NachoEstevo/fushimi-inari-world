import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createKeihanStationSpec} from './keihan-station-spec.mjs';
import {pathOffset} from './path-frame.mjs';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {clipMitsuTerrain,clipMitsuTerrainAsync} from './mitsu-frontage-aprons.mjs';
import {createStartupCheckpoint,yieldStartupTask} from './startup-work.mjs';

// Live OSM way310960824, clipped to Z[-155,-40]. This is a bounded canal
// addition, not a replacement for the world's separately owned water meshes.
export const KEIHAN_CANAL_RING=[[-224.069607,-40],[-228.772030,-104.796169],[-232.140731,-155],[-219.347852,-155],[-210.185059,-40]];
export const KEIHAN_APPROACH_IDS=['way/946510942','way/105449702','way/626177639','way/79699849','way/1057050892','way/297888106','way/105449676'];
const ccw=p=>polygonArea(p)<0?[...p].reverse():p;
const inside=(x,z,p)=>ccw(p).every((a,i)=>{const b=ccw(p)[(i+1)%p.length];return (b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0])>=-1e-7;});
const near=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2])<.001;

function pathTops(surfaces){
 return surfaces.segments.map((s,i)=>{
  const prev=surfaces.segments[i-1],next=surfaces.segments[i+1],start=pathOffset(s.a,s.b,prev?.id===s.id&&near(prev.b,s.a)?prev:null),end=pathOffset(s.a,s.b,next?.id===s.id&&near(next.a,s.b)?next:null,true);
  const at=(p,n,k)=>[Math.fround(p[0]+n[0]*k*s.width/2),Math.fround(p[2]+n[1]*k*s.width/2)];
  return {id:s.id,polygon:ccw([at(s.a,start,-1),at(s.b,end,-1),at(s.b,end,1),at(s.a,start,1)])};
 });
}
function projectedHeight(segments,x,z){
 let best=null;for(const s of segments){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz))),d=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t);if(!best||d<best.d)best={d,y:s.ya+(s.yb-s.ya)*t};}return best?.y;
}
export function keihanApproachLayout(features,surfaces,spec=createKeihanStationSpec(features,surfaces)){
 if(!spec||!KEIHAN_APPROACH_IDS.every(id=>features.paths?.some(p=>p.id===id)))return null;
 if(!surfaces.segments?.length)throw Error('Keihan approach requires the existing paved street sampler');
 const byId=id=>features.paths.find(p=>p.id===id),road=byId('way/105449702'),west=road.points.at(-1),east=road.points[0],dx=east[0]-west[0],dz=east[2]-west[2],length=Math.hypot(dx,dz),along=[dx/length,dz/length],across=[-along[1],along[0]],local=(u,v)=>[west[0]+along[0]*u+across[0]*v,west[2]+along[1]*u+across[1]*v];
 const relative=(x,z)=>[(x-west[0])*along[0]+(z-west[2])*along[1],(x-west[0])*across[0]+(z-west[2])*across[1]];
 const roadSegments=surfaces.segments.filter(s=>['way/946510942','way/79699849'].includes(s.id)),westY=projectedHeight(roadSegments,west[0],west[2]),eastY=projectedHeight(roadSegments,east[0],east[2]);
 if(!Number.isFinite(westY)||!Number.isFinite(eastY)||Math.abs(eastY-westY)>1.8)throw Error('Keihan bridge street grade needs reconciliation');
 const bridgeHeight=(x,z)=>westY+(eastY-westY)*Math.max(0,Math.min(1,relative(x,z)[0]/length)),rect=(u0,u1,v0,v1)=>ccw([[u0,v0],[u1,v0],[u1,v1],[u0,v1]].map(p=>local(...p)));
 // Include long ribbons spanning the exit even when their vertices lie outside
 // the approach bounds; otherwise the infill duplicates their street tops.
 const tops=pathTops(surfaces),portions=[];
 const addMissing=(id,polygon,height,kind)=>{let pieces=[ccw(polygon)];for(const cut of [...tops.map(t=>t.polygon),...portions.map(p=>p.polygon)])pieces=pieces.flatMap(p=>clipConvex(p,cut).length?subtractConvex(p,cut):[p]);for(const [i,p]of pieces.entries())portions.push({id:id+'-'+i,polygon:p,height,kind});};
 // Road and parallel pedestrian deck share an edge. The mapped centreline
 // separation fixes the broad deck; thickness, edge widths and rail sizes
 // are estimates from the user's October 2024 panoramas.
 addMissing('road-bridge',rect(0,length,-3,3),bridgeHeight,'street');
 addMissing('pedestrian-bridge',rect(0,length,3,6.25),bridgeHeight,'concrete');
 const corridor=(a,b,width)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),n=[-dz/l*width/2,dx/l*width/2];return ccw([[a[0]-n[0],a[1]-n[1]],[b[0]-n[0],b[1]-n[1]],[b[0]+n[0],b[1]+n[1]],[a[0]+n[0],a[1]+n[1]]]);};
 const footBridge=byId('way/626177639'),footWest=footBridge.points.at(-1),footEast=footBridge.points[0];
 // The pedestrian bridge is longitudinally offset from the road bridge.
 // Its mapped east end extends 1.7m beyond the road deck; own that exact
 // missing continuation instead of assuming the two spans end together.
 addMissing('mapped-pedestrian-deck',corridor([footWest[0],footWest[2]],[footEast[0],footEast[2]],2),bridgeHeight,'concrete');
 const exit=spec.publicExit.position,junction=[-302.572,-121.327],gateSegments=surfaces.segments.filter(s=>['way/952687115','way/946510942','way/777222941'].includes(s.id));
 addMissing('gate-road-join',corridor([exit[0],exit[2]],junction,1.8),(x,z)=>projectedHeight(gateSegments,x,z),'street');
 // Small end joins follow the existing paved endpoints, with no replacement
 // road top or overlapping coplanar slab.
 const sidewalk=byId('way/777222941');if(sidewalk){const p=sidewalk.points[0],q=byId('way/626177639').points.at(-1);addMissing('sidewalk-bridge-join',corridor([p[0],p[2]],[q[0],q[2]],2),(x,z)=>bridgeHeight(x,z),'concrete');}
 addMissing('pedestrian-east-join',corridor([footEast[0],footEast[2]],[-207.745,-85.761],2),(x,z)=>projectedHeight(roadSegments,x,z),'concrete');
 const routeXZ=[[exit[0],exit[2]],junction];
 for(const id of ['way/946510942','way/105449702','way/79699849','way/1057050892','way/297888106','way/105449676']){
  const points=[...byId(id).points].reverse();for(const p of points){if(id==='way/946510942'&&p[0]<junction[0]-.01)continue;const last=routeXZ.at(-1);if(Math.hypot(last[0]-p[0],last[1]-p[2])>.001)routeXZ.push([p[0],p[2]]);}
 }
 const surfaceHeight=(x,z)=>{for(const p of portions)if(inside(x,z,p.polygon))return p.height(x,z);return null;};
 return {spec,portions,existingTops:tops,bridge:{west,east,length,along,across,local,relative,height:bridgeHeight,westY,eastY,polygon:rect(0,length,-3,6.25)},canal:{source:'way/310960824',ring:ccw(KEIHAN_CANAL_RING),waterY:Math.min(westY,eastY)-2.45},routePoints:routeXZ.map(([x,z])=>[x,surfaceHeight(x,z)??surfaces.height(x,z),z]),surfaceHeight};
}

export function buildKeihanApproach(root,features,surfaces,materials={},colliders=[],spec=createKeihanStationSpec(features,surfaces),options={}){
 const name='Keihan Inari-shinmichi bridge and Urasando approach',old=root.getObjectByName(name);if(old)return {group:old,...old.userData};
 const layout=keihanApproachLayout(features,surfaces,spec);if(!layout)return {built:false,builtIds:[],reason:'Keihan station or mapped approach missing'};
 const group=new THREE.Group();group.name=name;
 const palette={street:'#626660',concrete:'#9c9f94',vermilion:'#bc3c28',dark:'#343b38',white:'#dad9c9',yellow:'#d3ad36',metal:'#777c75',water:'#3c584d'};
 const mats=Object.fromEntries(Object.entries(palette).map(([k,color])=>[k,new THREE.MeshStandardMaterial({color,roughness:k==='water'?.5:k==='metal'?.65:.92,metalness:k==='metal'?.25:0,side:k==='concrete'?THREE.DoubleSide:THREE.FrontSide})])),batches=new Map(),topTriangles=[],pending=[];
 const put=(g,key)=>{const geo=g.index?g.toNonIndexed():g;if(geo!==g)g.dispose();geo.deleteAttribute('uv');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geo);};
 const tri=(a,b,c,key,record=false)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c],3));g.computeVertexNormals();put(g,key);if(record)topTriangles.push([a,b,c].map(p=>p.map(Math.fround)));};
 const top=(polygon,height,key,record=false)=>{const p=ccw(polygon),a=p[0];for(let i=1;i<p.length-1;i++)tri([a[0],height(...a),a[1]],[p[i+1][0],height(...p[i+1]),p[i+1][1]],[p[i][0],height(...p[i]),p[i][1]],key,record);};
 const box=(x,y,z,w,h,d,key,yaw=0)=>{const g=new THREE.BoxGeometry(w,h,d);g.rotateY(yaw);g.translate(x,y,z);put(g,key);};
 const beam=(a,b,r,key,radial=6)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),g=new THREE.CylinderGeometry(r,r,delta.length(),radial);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());put(g,key);};
 for(const p of layout.portions)top(p.polygon,p.height,p.kind,true);
 const {bridge,canal}=layout,yaw=Math.atan2(-bridge.along[1],bridge.along[0]);
 for(const side of [-1,1])top([bridge.local(0,side*2.70),bridge.local(bridge.length,side*2.70),bridge.local(bridge.length,side*2.79),bridge.local(0,side*2.79)],(x,z)=>bridge.height(x,z)+.006,'white');
 // Visible deck fascia and curb have physical thickness over open water.
 for(const v of [-3,6.25]){const a=bridge.local(0,v),b=bridge.local(bridge.length,v),ya=bridge.height(...a),yb=bridge.height(...b);tri([a[0],ya,a[1]],[b[0],yb-.42,b[1]],[b[0],yb,b[1]],'concrete');tri([a[0],ya,a[1]],[a[0],ya-.42,a[1]],[b[0],yb-.42,b[1]],'concrete');
  const count=Math.ceil(bridge.length/2.35);for(let i=0;i<=count;i++){const u=bridge.length*i/count,[x,z]=bridge.local(u,v),y=bridge.height(x,z);box(x,y+.52,z,.12,1.04,.12,'vermilion',yaw);}
  const midpoint=bridge.local(bridge.length/2,v);pending.push({type:'box',args:[midpoint[0],midpoint[1],bridge.length/2,.065,yaw,Math.min(ya,yb),Math.max(ya,yb)+1.12,'inari_bridge_continuous_rail']});
  for(const h of [.17,.81,1.03])beam([a[0],ya+h,a[1]],[b[0],yb+h,b[1]],.042,'vermilion');
  for(let u=.22;u<bridge.length;u+=.28){const [x,z]=bridge.local(u,v),y=bridge.height(x,z);beam([x,y+.19,z],[x,y+.79,z],.012,'vermilion',4);}
  for(const u of [0,bridge.length]){const [x,z]=bridge.local(u,v),y=bridge.height(x,z);box(x,y+.57,z,.27,1.14,.27,'vermilion',yaw);box(x,y+1.16,z,.32,.10,.32,'dark',yaw);}
 }
 // Open south pedestrian strip is separated by photographed short bollards.
 for(let u=2;u<bridge.length;u+=3.4){const [x,z]=bridge.local(u,3.2),y=bridge.height(x,z);beam([x,y,z],[x,y+.79,z],.045,'dark');for(const h of [.54,.67])beam([x,y+h,z],[x,y+h+.06,z],.047,'white');pending.push({type:'cylinder',args:[x,z,.055,y,y+.82,'inari_bridge_bollard']});}
 top(canal.ring,()=>canal.waterY,'water');
 const concreteBase=mergeGeometries(batches.get('concrete'),false);
 // Recessed canal walls follow the mapped banks. The top rim is derived from
 // the inherited terrain skin; clipTerrain below removes the terrain lid.
 for(let i=0;i<canal.ring.length;i++){const a=canal.ring[i],b=canal.ring[(i+1)%canal.ring.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);const count=Math.ceil(length/.8);for(let j=0;j<count;j++){const p=[a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count],q=[a[0]+(b[0]-a[0])*(j+1)/count,a[1]+(b[1]-a[1])*(j+1)/count],height=(x,z)=>(surfaces.terrainHeight?.(x,z)??surfaces.height(x,z))-.04,yp=height(...p),yq=height(...q);tri([p[0],yp,p[1]],[q[0],yq,q[1]],[q[0],canal.waterY-.5,q[1]],'concrete');tri([p[0],yp,p[1]],[q[0],canal.waterY-.5,q[1]],[p[0],canal.waterY-.5,p[1]],'concrete');}}
 // Narrow white edge lines and gutters are flat batches following each
 // existing street segment's grade. They never replace walking surfaces.
 const streetIds=['way/946510942','way/79699849'];
 for(const s of surfaces.segments.filter(s=>streetIds.includes(s.id)&&s.a[0]>-304)){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],l=Math.hypot(dx,dz),n=[-dz/l,dx/l],p=(v,t)=>[s.a[0]+dx*t+n[0]*v,s.a[2]+dz*t+n[1]*v],height=(x,z)=>projectedHeight([s],x,z)+.006;for(const side of [-1,1])top([p(side*(s.width/2-.30),0),p(side*(s.width/2-.21),0),p(side*(s.width/2-.21),1),p(side*(s.width/2-.30),1)],height,'white');}
 // Two independently mapped JR Nara tracks (1067 mm gauge) cross directly
 // after the bridge. Rails are embedded in the existing asphalt, not hurdles.
 const crossingCenters=[[-207.745,-85.761],[-203.649,-85.382]],railDir=[.079,.99687];
 for(const [x,z]of crossingCenters){for(const side of [-1,1]){const cx=x+railDir[1]*.5335*side,cz=z-railDir[0]*.5335*side,a=[cx-railDir[0]*5,cz-railDir[1]*5],b=[cx+railDir[0]*5,cz+railDir[1]*5],n=[railDir[1]*.032,-railDir[0]*.032];top([[a[0]-n[0],a[1]-n[1]],[b[0]-n[0],b[1]-n[1]],[b[0]+n[0],b[1]+n[1]],[a[0]+n[0],a[1]+n[1]]],(px,pz)=>projectedHeight(surfaces.segments.filter(s=>s.id==='way/79699849'),px,pz)+.009,'metal');}}
 // Crossing equipment remains open and inert. No train, red-light state or
 // movement is implied; device dimensions/offsets are photograph estimates.
 if(!options.externalCrossingDevices)for(const [x,z]of [[-210.65,-89.65],[-199.2,-81.0]]){const y=surfaces.height(x,z);for(let i=0;i<9;i++)box(x,y+.2+i*.33,z,.15,.33,.15,i%2?'dark':'yellow');for(const sign of [-1,1]){const g=new THREE.BoxGeometry(.15,1.05,.06);g.rotateZ(sign*Math.PI/4);g.translate(x,y+3.0,z);put(g,'yellow');}for(const ox of [-.28,.28]){beam([x+ox,y+2.4,z-.08],[x+ox,y+2.4,z+.08],.13,'dark',10);}const armX=x+.36;for(let i=0;i<8;i++)box(armX,y+.5+i*.40,z,.075,.40,.075,i%2?'dark':'yellow');box(x,y+.55,z,.48,1.0,.4,'yellow');pending.push({type:'cylinder',args:[x,z,.3,y,y+3.5,'inari_crossing_device']});}
 // November 2020 east-street frame shows paired white globe lamps on dark
 // curved arms. Two bounded examples use estimated roadside positions;
 // spheres are unlit geometry and introduce no point lights or update work.
 for(const [x,z]of [[-194.0,-88.25],[-177.0,-81.0]]){const y=surfaces.height(x,z);beam([x,y,z],[x,y+3.48,z],.055,'dark');for(const sign of [-1,1]){const arm=[[x,y+3.25,z],[x+sign*.27,y+3.58,z],[x+sign*.60,y+3.64,z],[x+sign*.79,y+3.48,z]];for(let i=1;i<arm.length;i++)beam(arm[i-1],arm[i],.026,'dark');put(new THREE.SphereGeometry(.16,8,6).translate(x+sign*.79,y+3.48,z),'white');}pending.push({type:'cylinder',args:[x,z,.065,y,y+3.5,'inari_street_globe_lamp']});}
 for(const [key,parts]of batches){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,mats[key]);mesh.name='Keihan approach '+key;mesh.castShadow=['vermilion','dark','yellow'].includes(key);mesh.receiveShadow=true;group.add(mesh);}
 const cells=new Map(),size=4;for(const t of topTriangles){const xs=t.map(p=>p[0]),zs=t.map(p=>p[2]);for(let x=Math.floor(Math.min(...xs)/size);x<=Math.floor(Math.max(...xs)/size);x++)for(let z=Math.floor(Math.min(...zs)/size);z<=Math.floor(Math.max(...zs)/size);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(t);}}
 const surfaceHeight=(x,z)=>{for(const [a,b,c]of cells.get(Math.floor(x/size)+','+Math.floor(z/size))??[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,w=1-u-v;if(Math.min(u,v,w)>=-1e-8)return u*a[1]+v*b[1]+w*c[1];}return null;};
 function* prepareCanalBank(positions){
  let checked=0;
  if(positions.length%9||!positions.every(value=>{checked++;return Number.isFinite(value);})||checked!==positions.length)throw Error('Keihan canal clip requires finite triangle positions');
  // The rendered terrain is a coarse triangle plane, not the DEM sampler.
  // Intersect each bank edge with those actual planes once, so both sides
  // of the cut share the same rim, including previous terrain-owner cuts.
  const bankPositions=[],coverage=canal.ring.map(()=>0);
  for(let k=0;k<positions.length;k+=9){
   if(k>0&&k%4608===0)yield;
   // Reject distant world triangles before allocating their vertex/polygon arrays.
   // Keep the original inclusive canal bounds and intersection math unchanged.
   if(Math.max(positions[k],positions[k+3],positions[k+6])< -233||Math.min(positions[k],positions[k+3],positions[k+6])> -209||Math.max(positions[k+2],positions[k+5],positions[k+8])< -155||Math.min(positions[k+2],positions[k+5],positions[k+8])> -40)continue;
   const triangle=[0,3,6].map(o=>positions.slice(k+o,k+o+3)),flat=ccw(triangle.map(p=>[p[0],p[2]])),[ta,tb,tc]=triangle,den=(tb[2]-tc[2])*(ta[0]-tc[0])+(tc[0]-tb[0])*(ta[2]-tc[2]);if(Math.abs(den)<1e-10)continue;
   const height=(x,z)=>{const u=((tb[2]-tc[2])*(x-tc[0])+(tc[0]-tb[0])*(z-tc[2]))/den,v=((tc[2]-ta[2])*(x-tc[0])+(ta[0]-tc[0])*(z-tc[2]))/den;return u*ta[1]+v*tb[1]+(1-u-v)*tc[1];};
   for(let edge=0;edge<canal.ring.length;edge++){const a=canal.ring[edge],b=canal.ring[(edge+1)%canal.ring.length];let lo=0,hi=1;
    for(let i=0;i<3;i++){const p=flat[i],q=flat[(i+1)%3],side=v=>(q[0]-p[0])*(v[1]-p[1])-(q[1]-p[1])*(v[0]-p[0]),v0=side(a),v1=side(b),delta=v1-v0;if(Math.abs(delta)<1e-12){if(v0< -1e-9){hi=-1;break;}}else if(delta>0)lo=Math.max(lo,-v0/delta);else hi=Math.min(hi,-v0/delta);}
    if(hi<=lo+1e-9)continue;coverage[edge]+=hi-lo;const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],p=at(lo),q=at(hi),pa=[p[0],height(...p),p[1]],qa=[q[0],height(...q),q[1]],pb=[p[0],canal.waterY-.5,p[1]],qb=[q[0],canal.waterY-.5,q[1]];bankPositions.push(...pa,...qa,...qb,...pa,...qb,...pb);
   }
  }
  // Partial terrain chunks do not replace a complete bank. Normal world
  // integration supplies the full triangle set and reaches every edge.
  if(coverage.every(v=>v>.99999)){const bank=new THREE.BufferGeometry();bank.setAttribute('position',new THREE.Float32BufferAttribute(bankPositions,3));bank.computeVertexNormals();const concreteMesh=group.getObjectByName('Keihan approach concrete'),geometry=mergeGeometries([concreteBase,bank],false);bank.dispose();concreteMesh.geometry.dispose();concreteMesh.geometry=geometry;group.userData.bankRimFromRenderedTerrain=true;group.userData.bankRimVertexStart=concreteBase.attributes.position.count;group.userData.triangles=group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0);}
 }
 const clipTerrain=positions=>{for(const _ of prepareCanalBank(positions)){}return clipMitsuTerrain(positions,[canal.ring]);};
 const clipTerrainAsync=async(positions,{yieldWork=yieldStartupTask}={})=>{
  const checkpoint=createStartupCheckpoint({yieldWork});
  for(const _ of prepareCanalBank(positions)){const pause=checkpoint();if(pause)await pause;}
  return clipMitsuTerrainAsync(positions,[canal.ring],{yieldWork});
 };
 const routePoints=layout.routePoints.map(([x,y,z])=>[x,surfaceHeight(x,z)??y,z]),checkpoint=(id,p,target)=>({id,position:[p[0],(surfaceHeight(p[0],p[1])??surfaces.height(p[0],p[1]))+1.7,p[1]],lookAt:[target[0],surfaces.height(target[0],target[1])+1.7,target[1]]});
 group.userData={built:true,builtIds:[],sourceIds:KEIHAN_APPROACH_IDS,surfaceHeight,clipTerrain,clipTerrainAsync,routePoints,topTriangles,portions:layout.portions.map(p=>({id:p.id,polygon:p.polygon})),canal,bridge:{west:bridge.west,east:bridge.east,length:bridge.length},checkpoints:[checkpoint('keihan_gate',[-301.277,-124.745],[-291.042,-114.169]),checkpoint('inari_bridge',bridge.local(3,0),[-199.024,-84.948]),checkpoint('urasando',[-151.505,-87.319],[-124.95,-84.325])],drawBatches:group.children.length,collidersAdded:pending.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),provenance:'OSM roads/bridges and canal310960824; user October2024 StreetView panoramas jdt_0bBLBQcMoedhCMDVJA, mVT8dPF3mdWEKySYwkIvHQ, vCTQFSUYZhnjIYqJrVIRZw. Keihan to Inari-shinmichi, Inari bridge, mapped JR crossing, Hommachi, Urasando; not the JR Omotesando route.',inferred:'Deck width/thickness, water level, railings, device dimensions and offsets are photo estimates. Canal bounded to Z[-155,-40]. Existing street heights remain canonical; no surveyed claim.',limits:'No live crossing animation; native walking/visual acceptance remains root-owned. New canal must be wired into final terrain clipping.'};
 root.add(group);colliders.push(...pending);return {group,...group.userData};
}
