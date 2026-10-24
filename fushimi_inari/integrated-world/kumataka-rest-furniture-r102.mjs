import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

// Primary OSM map API snapshot: outputs/r102-kumataka/osm-map.json, 2026-10-23.
// Positions, material, backrest and capacity are mapped; no direction is tagged.
export const kumatakaRestBenchRecordsR102=[
  {id:'node/9667109065',point:[547.326910,-142.177254],lat:34.9684172,lon:135.7786698,material:'metal',colour:'blue',backrest:true,seats:3},
  {id:'node/9667109066',point:[545.885568,-139.639169],lat:34.9683944,lon:135.778654,material:'wood',backrest:false,seats:3},
  {id:'node/9667109067',point:[547.044115,-139.939732],lat:34.9683971,lon:135.7786667,material:'wood',backrest:false,seats:3},
];
const rect=(x,z,hw,hd,yaw)=>[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([u,v])=>[x+Math.cos(yaw)*u+Math.sin(yaw)*v,z-Math.sin(yaw)*u+Math.cos(yaw)*v]);
const overlap=(a,b)=>Math.abs(polygonArea(clipConvex(a,b)))>1e-7;
const triangles=ring=>THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[]).map(t=>t.map(i=>[ring[i][0],ring[i][2]]));
function legacyStoneObstacles(root){
  let owner;root.traverse(o=>{if(o.isGroup&&o.userData.zone==='kumataka')owner=o;});if(!owner)return [];
  for(let p=owner;p;p=p.parent)if(p.visible===false)return [];
  owner.updateWorldMatrix(true,true);const result=[],near=(a,b)=>Math.abs(a-b)<.001;
  for(let index=0;index<28;index++){
    const x=-9.2-index%4*1.35,z=-8.5+Math.floor(index/4)*2.5,h=1.10+index%3*.32;
    for(const o of owner.children){
      const g=o.geometry?.parameters;if(!o.isMesh||!o.visible||o.userData.interactable||!g)continue;
      const stele=o.geometry.type==='BoxGeometry'&&near(g.width,.56)&&near(g.height,h)&&near(g.depth,.30)&&near(o.position.x,x)&&near(o.position.y,h/2+index%4*.18)&&near(o.position.z,z);
      const pair=index%3===0&&near(o.position.x,x+.42)&&near(o.position.z,z);
      const fox=pair&&o.geometry.type==='ConeGeometry'&&near(g.radius,.16)&&near(g.height,.48)&&g.radialSegments===6&&near(o.position.y,.38);
      const bib=pair&&o.geometry.type==='CylinderGeometry'&&near(g.radiusTop,.13)&&near(g.radiusBottom,.16)&&near(g.height,.14)&&g.radialSegments===8&&near(o.position.y,.32);
      if(!stele&&!fox&&!bib)continue;
      const p=o.geometry.attributes.position,points=[],v=new THREE.Vector3();let minY=Infinity,maxY=-Infinity;
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);points.push([v.x,v.z]);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}
      points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lo=[],hi=[];
      for(const p of points){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of points.toReversed()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}
      result.push({index,kind:stele?'stele':fox?'fox':'bib',footprint:lo.slice(0,-1).concat(hi.slice(0,-1)),minY,maxY});
    }
  }
  return result;
}

/** After registered court, final water and existing solids; before batching. */
export function buildKumatakaRestFurnitureR102(root,features,surfaces,colliders,{water,terrainPositions}={}){
  if(root.getObjectByName('Kumataka mapped rest benches R102'))return null;
  if(!root.children.some(g=>g.userData.kumatakaRegistrationR97)||water?.built!==true||!water.builtIds?.includes('way/105449705')||!Number.isFinite(water.waterLevel)||!terrainPositions?.length||terrainPositions.length%9!==0)return null;
  const nearby=[];
  for(let i=0;i<terrainPositions.length;i+=9){
    const t=Array.from(terrainPositions.slice(i,i+9));if(!t.every(Number.isFinite))continue;
    if(Math.max(t[0],t[3],t[6])<543||Math.min(t[0],t[3],t[6])>549||Math.max(t[2],t[5],t[8])< -144||Math.min(t[2],t[5],t[8])> -138)continue;
    nearby.push(...t);
  }
  const terrainHeight=makeShoulderTriangleHeight(nearby);
  const pond=features.water?.find(w=>w.id==='way/105449705');if(!pond)return null;
  const wet=triangles(pond.points.slice(0,-1)),a=pond.points[1],b=pond.points[2],yaw=-Math.atan2(b[2]-a[2],b[0]-a[0]),routes=[];
  for(const path of features.paths)for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(len<1e-6)continue;
    if(Math.min(a[0],b[0])>550||Math.max(a[0],b[0])<541||Math.min(a[2],b[2])> -136||Math.max(a[2],b[2])< -146)continue;
    routes.push(rect((a[0]+b[0])/2,(a[2]+b[2])/2,len/2,(parseFloat(path.tags.width)||2)/2+.28,-Math.atan2(dz,dx)));
  }
  const group=new THREE.Group();group.name='Kumataka mapped rest benches R102';
  const p=staticParts(group),wood=new THREE.MeshStandardMaterial({color:'#6b5941',roughness:.96}),blue=new THREE.MeshStandardMaterial({color:'#486d84',roughness:.66,metalness:.20});
  const accepted=[],skipped=[],pending=[],visibleStones=legacyStoneObstacles(root);
  for(const record of kumatakaRestBenchRecordsR102){
    const [x,z]=record.point,footprint=rect(x,z,.825,.25,yaw),at=(u,v)=>[x+Math.cos(yaw)*u+Math.sin(yaw)*v,z-Math.sin(yaw)*u+Math.cos(yaw)*v];
    const legs=[[-.64,-.16],[-.64,.16],[.64,-.16],[.64,.16]],legLevels=legs.map(q=>terrainHeight(...at(...q)));
    const support=[[x,z],...footprint].map(q=>terrainHeight(...q)).concat(legLevels);
    const floor=Math.max(...support),reject=reason=>skipped.push({id:record.id,reason});
    if(support.some(y=>!Number.isFinite(y))||Math.max(...support)-Math.min(...support)>.12||Math.min(...support)<=water.waterLevel+.12){reject('Missing, sloping or wet support');continue;}
    if(wet.some(t=>overlap(footprint,t))||routes.some(t=>overlap(footprint,t))){reject('Full footprint overlaps pond or buffered public route');continue;}
    const roofs=features.buildings.filter(f=>Math.min(...f.points.map(q=>q[0]))<x+1&&Math.max(...f.points.map(q=>q[0]))>x-1&&Math.min(...f.points.map(q=>q[2]))<z+1&&Math.max(...f.points.map(q=>q[2]))>z-1);
    if(roofs.some(f=>triangles(f.points.slice(0,-1)).some(t=>overlap(footprint,t)))){reject('Mapped building footprint');continue;}
    const stone=visibleStones.find(s=>s.maxY>=floor-.02&&s.minY<=floor+(record.backrest ? .93 : .48)&&overlap(footprint,s.footprint));
    if(stone){skipped.push({id:record.id,reason:'Recognized visible legacy stone intersects bench volume',conflict:{index:stone.index,kind:stone.kind,overlapArea:Math.abs(polygonArea(clipConvex(footprint,stone.footprint))),minY:stone.minY,maxY:stone.maxY,footprint:stone.footprint}});continue;}
    let blocked=false;
    for(const c of [...colliders,...pending]){
      const q=c.args,lo=c.type==='box'?q[5]:q[3],hi=c.type==='box'?q[6]:q[4];if(hi<floor-.05||lo>floor+1.0)continue;
      const obstacle=c.type==='box'?rect(q[0],q[1],q[2]+.10,q[3]+.10,q[4]):rect(q[0],q[1],q[2]+.10,q[2]+.10,0);
      if(overlap(footprint,obstacle)){blocked=true;break;}
    }
    if(blocked){reject('Existing physical owner');continue;}
    const mat=record.material==='wood'?wood:blue;
    const put=(w,h,d,u,y,v)=>{const q=at(u,v);p.put(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(q[0],y,q[1]),mat);};
    for(const v of [-.105,.105])put(1.65,.055,.19,0,floor+.445,v);
    for(let i=0;i<legs.length;i++){const [u,v]=legs[i],bottom=legLevels[i]-.02,top=floor+.4175;put(.075,top-bottom,.075,u,(top+bottom)/2,v);}
    if(record.backrest){
      // Local -Z is northwest; seat faces southeast toward the adjacent pond.
      put(1.65,.32,.055,0,floor+.76,-.22);
      for(const u of [-.64,.64])put(.055,.47,.055,u,floor+.64,-.22);
    }
    pending.push({type:'box',args:[x,z,.825,.25,yaw,floor-.02,floor+(record.backrest ? .93 : .48),'kumataka_rest_bench']});
    accepted.push({...record,yaw,floor,support,legSupports:legs.map(([u,v],i)=>({point:at(u,v),surface:legLevels[i],bottom:legLevels[i]-.02,top:floor+.4175})),supportAuthority:'Actual final rendered and clipped terrain triangles',footprint,orientation:'Inferred parallel to adjacent mapped western shoreline; blue backrest northwest, seat toward pond'});
  }
  const stats=accepted.length?p.flush():{batches:0,primitives:0,triangles:0};
  group.userData={kumatakaRestFurnitureR102:true,...stats,accepted,skipped,source:'https://api.openstreetmap.org/api/0.6/map.json?bbox=135.77825,34.96805,135.77885,34.96875',limits:'Exact POI positions/types; bench dimensions, joinery and shoreline-parallel azimuth inferred. No bench moved to force clearance.'};
  if(accepted.length){root.add(group);colliders.push(...pending);}
  return {group:accepted.length?group:null,...group.userData};
}
