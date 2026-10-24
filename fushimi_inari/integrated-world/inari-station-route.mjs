import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createInariStationArrivalSpec} from './inari-station-arrival-spec.mjs';
import {omotesandoArrivalLayoutR94} from './omotesando-arrival-r94.mjs';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathOffset} from './path-frame.mjs';

const ROAD_IDS=['way/79699850','way/944841272'];
const inside=(x,z,p)=>p.every((a,i)=>{const b=p[(i+1)%p.length];return (b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0])>=-1e-7;});
const ccw=p=>polygonArea(p)<0?[...p].reverse():p;

// The map locates the station south of the inherited first-torii crossing.
// The public route follows the west road margin north; it does not cut across
// the parking court opposite the station. New pavement owns only missing tops.
export function inariStationRouteLayout(features,surfaces,spec=createInariStationArrivalSpec(features,surfaces)){
 const arrival=omotesandoArrivalLayoutR94(features);if(!spec||!arrival)return null;
 const roads=features.paths.filter(p=>ROAD_IDS.includes(p.id));if(roads.length!==2)return null;
 const roadSegments=surfaces.segments?.filter(s=>ROAD_IDS.includes(s.id));
 if(!roadSegments?.length)throw Error('JR Inari route requires the existing paved street sampler');
 const roadHeight=(x,z)=>{
  let best=null;for(const segment of roadSegments){
   const a=segment.a,b=segment.b,dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz))),px=a[0]+dx*t,pz=a[2]+dz*t,d=Math.hypot(x-px,z-pz);
   if(!best||d<best.d)best={height:segment.ya+(segment.yb-segment.ya)*t,d};
  }
  if(!Number.isFinite(best?.height))throw Error('JR Inari route requires the existing paved street sampler');
  return best.height;
 };
 const exit=spec.publicExit.position,e=spec.frame.east,s=spec.frame.south;
 const local=(u,v)=>[exit[0]+e[0]*u+s[0]*v,exit[2]+e[1]*u+s[1]*v];
 const relative=(x,z)=>[(x-exit[0])*e[0]+(z-exit[2])*e[1],(x-exit[0])*s[0]+(z-exit[2])*s[1]];
 const rect=(u0,u1,v0,v1)=>ccw([[u0,v0],[u1,v0],[u1,v1],[u0,v1]].map(p=>local(...p)));
 const stepEnd=local(1.5,0),streetFloor=roadHeight(...stepEnd),rise=spec.publicFloor-streetFloor;
 if(rise<.25||rise>.70)throw Error('JR Inari public stair rise needs source/grade reconciliation');
 const count=3,stepRise=rise/count,stepRun=.30;
 const portions=[
  {id:'entry-landing',polygon:rect(0,.60,-2.2,3.3),height:()=>spec.publicFloor},
  {id:'ramp-head',polygon:rect(.60,1.20,2.2,3.3),height:()=>spec.publicFloor},
  ...Array.from({length:count},(_,i)=>({id:'front-step-'+i,polygon:rect(.60+i*stepRun,.60+(i+1)*stepRun,-2.2,2.2),height:()=>spec.publicFloor-(i+1)*stepRise})),
  {id:'stair-foot',polygon:rect(1.5,1.95,-2.2,2.2),height:(x,z)=>roadHeight(x,z)},
 ];
 const rampEnd=local(.6,12.6),rampBottom=roadHeight(...rampEnd),rampSlope=(spec.publicFloor-rampBottom)/9.3;
 if(rampSlope<=0||rampSlope>.0834)throw Error('JR Inari exterior ramp requires source/grade reconciliation');
 portions.push({id:'south-ramp',polygon:rect(0,1.20,3.3,12.6),height:(x,z)=>spec.publicFloor+(rampBottom-spec.publicFloor)*Math.max(0,Math.min(1,(relative(x,z)[1]-3.3)/9.3))});
 const streetAt=(u,v)=>[arrival.center[0]+arrival.across[0]*u+arrival.along[0]*v,arrival.center[1]+arrival.across[1]*u+arrival.along[1]*v];
 const toStreet=(x,z)=>[(x-arrival.center[0])*arrival.across[0]+(z-arrival.center[1])*arrival.across[1],(x-arrival.center[0])*arrival.along[0]+(z-arrival.center[1])*arrival.along[1]];
 const south=toStreet(...local(1,13.4))[1],north=1.0;
 const sidewalk=ccw([[-4.6,south],[-3.2,south],[-3.2,north],[-4.6,north]].map(p=>streetAt(...p)));
 const accessCuts=portions.map(p=>p.polygon);
 let pavements=[sidewalk];for(const cut of accessCuts)pavements=pavements.flatMap(p=>subtractConvex(p,cut));
 for(const [i,p]of pavements.entries())portions.push({id:'west-road-margin-'+i,polygon:p,height:roadHeight});
 // R94's averaged street axis locates the crossing, but it is not the
 // rendered road edge. Derive that edge from the very same segment miters
 // as buildPathMeshes and subtract their Float32 quads from this small mouth.
 // The 2cm candidate allowance is clipped away wherever the road owns a top;
 // it does not become an overlapping decal or an epsilon-width repair band.
 const roadTops=roadSegments.map(segment=>{
  const index=surfaces.segments.indexOf(segment),adjacent=(candidate,end)=>candidate?.id===segment.id&&Math.hypot(candidate[end][0]-(end==='b'?segment.a:segment.b)[0],candidate[end][2]-(end==='b'?segment.a:segment.b)[2])<.001?candidate:null;
  const start=pathOffset(segment.a,segment.b,adjacent(surfaces.segments[index-1],'b')),end=pathOffset(segment.a,segment.b,adjacent(surfaces.segments[index+1],'a'),true),at=(p,n,side)=>[Math.fround(p[0]+n[0]*side*segment.width/2),Math.fround(p[2]+n[1]*side*segment.width/2)];
  return ccw([at(segment.a,start,-1),at(segment.b,end,-1),at(segment.b,end,1),at(segment.a,start,1)]);
 });
 let connectors=[ccw([[-3.2,-.9],[-2.98,-.9],[-2.98,.9],[-3.2,.9]].map(p=>streetAt(...p)))];
 for(const road of roadTops)connectors=connectors.flatMap(p=>clipConvex(p,road).length?subtractConvex(p,road):[p]);
 for(const [i,p]of connectors.entries())portions.push({id:'crossing-mouth-'+i,polygon:p,height:roadHeight});
 const surfaceHeight=(x,z)=>{for(const p of portions)if(inside(x,z,p.polygon))return p.height(x,z);return null;};
 const sidewalkU=-3.6,sideAtExit=toStreet(...stepEnd)[1];
 const routeXZ=[local(0,0),local(.60,0),local(.61,0),local(.91,0),local(1.21,0),local(1.51,0),streetAt(sidewalkU,sideAtExit),streetAt(sidewalkU,0),arrival.center];
 const routePoints=routeXZ.map(([x,z])=>[x,surfaceHeight(x,z)??surfaces.height(x,z),z]);
 const approach=features.paths.find(p=>p.id===arrival.approachId),approachPoints=[...approach.points].reverse();
 for(const p of approachPoints.slice(1,2))routePoints.push([p[0],surfaces.height(p[0],p[2]),p[2]]);
 return {spec,arrival,portions,local,relative,roadHeight,surfaceHeight,routePoints,stair:{count,rise:stepRise,run:stepRun},ramp:{slope:rampSlope,run:9.3,width:1.2},sidewalk:{width:1.4,south,north},streetAt,rect,roadTops};
}

export function buildInariStationRoute(root,features,surfaces,materials={},colliders=[],spec=createInariStationArrivalSpec(features,surfaces)){
 const name='JR Inari east exit and real street route',old=root.getObjectByName(name);if(old)return {group:old,...old.userData};
 const layout=inariStationRouteLayout(features,surfaces,spec);if(!layout)return {built:false,reason:'station or existing street contract missing',builtIds:[]};
 const group=new THREE.Group();group.name=name;
 const concrete=new THREE.MeshStandardMaterial({color:'#a3a39a',roughness:.98}),asphalt=new THREE.MeshStandardMaterial({color:'#6d706b',roughness:1}),red=new THREE.MeshStandardMaterial({color:'#bc3d25',roughness:.65}),metal=new THREE.MeshStandardMaterial({color:'#737b78',roughness:.55,metalness:.45}),yellow=new THREE.MeshStandardMaterial({color:'#c9a63a',roughness:.96});
 const batches=new Map(),topTriangles=[],pending=[];
 const put=(g,m)=>{const geo=g.index?g.toNonIndexed():g;if(g!==geo)g.dispose();geo.deleteAttribute('uv');if(!batches.has(m))batches.set(m,[]);batches.get(m).push(geo);};
 const tri=(a,b,c,m,record=false)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c],3));geo.computeVertexNormals();put(geo,m);if(record)topTriangles.push([a,b,c].map(p=>p.map(Math.fround)));};
 // Split tops on a 0.5m grid so the actual street sampler controls every
 // visible pavement vertex. All decorative layers sit below a centimetre.
 const top=(polygon,height,mat,record=true)=>{
  const xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  for(let x=minX;x<maxX-1e-8;x+=.5)for(let z=minZ;z<maxZ-1e-8;z+=.5){
   // Existing convex subtraction preserves convex pieces. Clip the grid cell.
   const cell=[[x,z],[Math.min(x+.5,maxX),z],[Math.min(x+.5,maxX),Math.min(z+.5,maxZ)],[x,Math.min(z+.5,maxZ)]],p=clipConvex(polygon,cell);
   if(p.length<3)continue;const point=([px,pz])=>[px,height(px,pz),pz];for(let i=1;i<p.length-1;i++)tri(point(p[0]),point(p[i+1]),point(p[i]),mat,record);
  }
 };
 const accessTop=p=>{
  const corners=p.polygon.map(v=>layout.relative(...v).map(n=>Math.round(n*1e8)/1e8)),us=corners.map(p=>p[0]),vs=corners.map(p=>p[1]);
  const cuts=(lo,hi)=>[lo,...Array.from({length:Math.max(0,Math.ceil(hi/.5)-Math.floor(lo/.5)-1)},(_,i)=>(Math.floor(lo/.5)+1+i)*.5).filter(v=>v>lo+1e-8&&v<hi-1e-8),hi],u=cuts(Math.min(...us),Math.max(...us)),v=cuts(Math.min(...vs),Math.max(...vs));
  const point=(a,b)=>{const [x,z]=layout.local(a,b);return [x,p.height(x,z),z];};
  for(let i=1;i<u.length;i++)for(let j=1;j<v.length;j++){const a=point(u[i-1],v[j-1]),b=point(u[i],v[j-1]),c=point(u[i],v[j]),d=point(u[i-1],v[j]);tri(a,c,b,concrete,true);tri(a,d,c,concrete,true);}
 };
 // All adjacent access rectangles share identical local-coordinate edge
 // vertices. Independent world grids otherwise leave Float32 hairline cracks
 // at a riser, where a ray can incorrectly see the terrain below the steps.
 for(const p of layout.portions)/road-margin|crossing-mouth/.test(p.id)?top(p.polygon,p.height,asphalt):accessTop(p);
 // Solid stair risers and ramp sidewalls meet their own sampled top. No
 // generic slab or collidable invisible plane is placed across the road.
 for(const p of layout.portions)for(let i=0;i<p.polygon.length;i++){
  const a=p.polygon[i],b=p.polygon[(i+1)%p.polygon.length],ya=p.height(...a),yb=p.height(...b),dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),outside=[(a[0]+b[0])/2+dz/len*.002,(a[1]+b[1])/2-dx/len*.002],neighbor=layout.portions.find(q=>q!==p&&inside(...outside,q.polygon));
  // Only buried side support may consult the underlying existing ground;
  // pavement tops and navigation never inherit its off-road DEM cross-slope.
  const bottomA=neighbor?neighbor.height(...a):Math.min(surfaces.height(...a)-.10,ya-.18),bottomB=neighbor?neighbor.height(...b):Math.min(surfaces.height(...b)-.10,yb-.18),mat=/road-margin|crossing-mouth/.test(p.id)?asphalt:concrete;
  if(ya<=bottomA+1e-7&&yb<=bottomB+1e-7)continue;
  tri([a[0],ya,a[1]],[b[0],yb,b[1]],[b[0],Math.min(yb,bottomB),b[1]],mat);tri([a[0],ya,a[1]],[b[0],Math.min(yb,bottomB),b[1]],[a[0],Math.min(ya,bottomA),a[1]],mat);
 }
 const beam=(a,b,r,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),g=new THREE.CylinderGeometry(r,r,delta.length(),7);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());put(g,mat);};
 const railRun=(u0,v0,u1,v1,ground)=>{
  const a=layout.local(u0,v0),b=layout.local(u1,v1),length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(length/1.8);
  for(let i=0;i<=count;i++){const t=i/count,u=u0+(u1-u0)*t,v=v0+(v1-v0)*t,[x,z]=layout.local(u,v),y=ground(u,v);beam([x,y-.04,z],[x,y+.92,z],.027,red);pending.push({type:'cylinder',args:[x,z,.031,y-.04,y+.95,'jr_inari_exterior_rail']});}
  for(const [h,mat]of [[.92,red],[.54,metal]])beam([a[0],ground(u0,v0)+h,a[1]],[b[0],ground(u1,v1)+h,b[1]],.026,mat);
 };
 for(const v of [-2.2,2.2])railRun(.60,v,1.5,v,u=>spec.publicFloor-(u-.60)/.90*(spec.publicFloor-layout.roadHeight(...layout.local(1.5,0))));
 const ramp=layout.portions.find(p=>p.id==='south-ramp');for(const u of [0,1.2])railRun(u,3.3,u,12.6,(a,b)=>ramp.height(...layout.local(a,b)));
 // Observed tactile warning at ramp foot; repeated dots are a visual estimate.
 const warning=layout.rect(.10,1.10,12.15,12.55);top(warning,(x,z)=>ramp.height(x,z)+.004,yellow,false);
 for(let u=.2;u<1.1;u+=.13)for(let v=12.22;v<12.5;v+=.13){const [x,z]=layout.local(u,v),y=ramp.height(x,z);put(new THREE.CylinderGeometry(.022,.022,.008,6).translate(x,y+.008,z),yellow);}
 for(const [mat,parts]of batches){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,mat);mesh.name=mat===asphalt?'Street margin missing pavement':mat===concrete?'Exit landing three steps and south ramp':mat===red?'Observed red exterior handrails':mat===metal?'Exterior secondary handrails':'Ramp tactile warning';mesh.castShadow=mat!==asphalt;mesh.receiveShadow=true;group.add(mesh);}
 // Walking samples the emitted pavement triangles, including the very small
 // differences introduced where the inherited road changes segment slope.
 const cells=new Map(),cellSize=2;
 for(const triangle of topTriangles){const xs=triangle.map(p=>p[0]),zs=triangle.map(p=>p[2]);for(let x=Math.floor(Math.min(...xs)/cellSize);x<=Math.floor(Math.max(...xs)/cellSize);x++)for(let z=Math.floor(Math.min(...zs)/cellSize);z<=Math.floor(Math.max(...zs)/cellSize);z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(triangle);}}
 const surfaceHeight=(x,z)=>{
  for(const [a,b,c]of cells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))??[]){const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,w=1-u-v;if(Math.min(u,v,w)>=-5e-5)return u*a[1]+v*b[1]+w*c[1];}
  return null;
 };
 group.userData={built:true,group,builtIds:[],surfaceHeight,routePoints:layout.routePoints.map(([x,y,z])=>[x,surfaceHeight(x,z)??y,z]),portions:layout.portions.map(p=>({id:p.id,polygon:p.polygon})),topTriangles,stair:layout.stair,ramp:layout.ramp,drawBatches:group.children.length,collidersAdded:pending.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),provenance:'OSM station way952687107, Hommachi ways79699850/944841272 and inherited crossing node749327076. Townphoto2016 k01101.jpg and inspected 2019 P3590836 photograph establish three front steps, south ramp and red/grey rails. Heights derive from canonical station floor and projected existing paved-street segments, never off-road DEM; walk height samples emitted triangles.',inferred:'Widths, exact stair rise/run, ramp extents, rail dimensions and tactile detail are photo estimates; no cadastral or surveyed accuracy claimed.',withheld:'No unregistered vending machine, food stall, new shop, temporary festival flags, street pole or sign is invented. Shops and station equipment retain separate ownership.',limits:'Historical east frontage; new west-exit works are excluded. Native walking, materials and visual acceptance remain root-owned.'};
 // Keep the live group out of serialized userData; expose it on the return.
 delete group.userData.group;root.add(group);colliders.push(...pending);return {group,...group.userData};
}
