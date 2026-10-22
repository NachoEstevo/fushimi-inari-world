import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const mitsutsujiFrontageSpecs=Object.freeze([
  {id:'way/301527744',front:[0,1],height:5.55,kind:'gift'},
  {id:'way/301527777',front:[3,2],height:3.05,kind:'cafe'},
]);
const source='https://fushimiinari-guide.com/mitamatei/';

// The guide explicitly identifies uphill-left gift shop and uphill-right cafe.
// Both actual 2021 photographs agree with the two OSM footprints and lane.
// Storeys, apertures, roof pitch, floor datum and canopy extent are estimates.
export function buildMitsutsujiFrontages(root,features,surfaces,materials,colliders){
  const name='Mitsutsuji source-registered timber street R88',old=root.getObjectByName(name);
  if(old)return old.userData;
  const group=new THREE.Group();group.name=name;
  const wood=new THREE.MeshStandardMaterial({color:'#514032',roughness:.93});
  const boards=new THREE.MeshStandardMaterial({color:'#353830',roughness:.96});
  const plaster=new THREE.MeshStandardMaterial({color:'#bcb39c',roughness:1});
  const roof=new THREE.MeshStandardMaterial({color:'#48504b',roughness:.9,side:THREE.DoubleSide});
  const fabric=new THREE.MeshStandardMaterial({color:'#70443b',roughness:1,side:THREE.DoubleSide});
  const shadow=new THREE.MeshStandardMaterial({color:'#1d241f',roughness:1});
  const glazing=new THREE.MeshStandardMaterial({color:'#67716a',roughness:.5,metalness:.06});
  const stone=materials.entryStoneMat??materials.stoneMat??new THREE.MeshStandardMaterial({color:'#858174',roughness:1});
  const canopy=new THREE.MeshStandardMaterial({color:'#bbb9a5',roughness:.73,side:THREE.DoubleSide});
  const batches=new Map(),records=[],builtIds=[],pending=[],frontages=[];
  const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);};
  const box=(w,h,d,x,y,z,m,yaw=0)=>{if(w<=0||h<=0||d<=0)return;add(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),m);};
  const quad=(p,m)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>p[i]),3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,0,1,1,0,1],2));g.computeVertexNormals();add(g,m);};
  const triangle=(p,m)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.flat(),3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1],2));g.computeVertexNormals();add(g,m);};
  for(const spec of mitsutsujiFrontageSpecs){
    const feature=features.buildings.find(f=>f.id===spec.id);if(!feature)continue;
    const ring=feature.points.slice(0,-1);
    if(ring.length!==4||ring.some(p=>!p.every(Number.isFinite)))continue;
    const a=ring[spec.front[0]],b=ring[spec.front[1]],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
    if(length<3)continue;
    const ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length,cx=ring.reduce((s,p)=>s+p[0]/4,0),cz=ring.reduce((s,p)=>s+p[2]/4,0);
    const direction=Math.sign((-uz)*(cx-a[0])+ux*(cz-a[2])),nx=-uz*direction,nz=ux*direction,yaw=-Math.atan2(uz,ux);
    const local=p=>[(p[0]-a[0])*ux+(p[2]-a[2])*uz,(p[0]-a[0])*nx+(p[2]-a[2])*nz];
    const depth=Math.max(...ring.map(p=>local(p)[1]));
    const at=(s,d,y)=>[a[0]+ux*s+nx*d,y,a[2]+uz*s+nz*d];
    const samples=Array.from({length:7},(_,i)=>{const p=at(length*i/6,0,0);return surfaces.terrainHeight(p[0],p[2]);});
    if(!samples.every(Number.isFinite))throw Error('Nonfinite Mitsutsuji frontage terrain '+spec.id);
    const floor=Math.max(...samples)+.16,top=floor+spec.height;
    const put=(w,h,d,s,y,inset,m)=>box(w,h,d,...at(s,inset,y),m,yaw);
    const collider=(s,d,hw,hd,lo,hi,tag)=>{const p=at(s,d,0);pending.push({type:'box',args:[p[0],p[2],hw,hd,yaw,lo,hi,tag]});};
    // One exact footprint owner. Side/back walls follow each original edge,
    // independent of the decorative street frame; no axis-aligned shell.
    for(let e=0;e<4;e++){
      const p=ring[e],q=ring[(e+1)%4],len=Math.hypot(q[0]-p[0],q[2]-p[2]);
      const front=(e===spec.front[0]&&(e+1)%4===spec.front[1])||(e===spec.front[1]&&(e+1)%4===spec.front[0]);
      const angle=-Math.atan2(q[2]-p[2],q[0]-p[0]),count=Math.ceil(len/.7);
      for(let k=0;k<count;k++){
        const t0=k/count,t1=(k+1)/count,t=(t0+t1)/2,x=p[0]+(q[0]-p[0])*t,z=p[2]+(q[2]-p[2])*t;
        const ground=surfaces.terrainHeight(x,z)-.06;
        if(!Number.isFinite(ground))throw Error('Nonfinite Mitsutsuji wall terrain');
        const bottom=Math.min(ground,floor-.08);
        box(len/count,floor-bottom,.12,x,(floor+bottom)/2,z,stone,angle);
        if(!front){
          box(len/count,top-floor,.12,x,(floor+top)/2,z,boards,angle);
          pending.push({type:'box',args:[x,z,len/count/2,.08,angle,bottom,top,'mitsutsuji_shell_'+spec.id]});
        }
      }
    }
    // Solid floor stays inside the mapped polygon. No public terrain flattening.
    for(const tri of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[])){
      const p=tri.map(i=>[ring[i][0],floor,ring[i][2]]);triangle([p[0],p[2],p[1]],wood);
    }
    const bays=spec.kind==='gift'?4:7,bay=length/bays;
    for(let k=0;k<=bays;k++){
      const s=k*bay;put(.14,spec.kind==='gift'?5.4:2.94,.16,s,floor+(spec.kind==='gift'?2.7:1.47),.09,wood);
      collider(s,.09,.075,.08,floor,top,'mitsutsuji_front_post_'+spec.id);
    }
    for(const h of [0.10,2.34,2.91])put(length,.13,.18,length/2,floor+h,.09,wood);
    for(let k=0;k<bays;k++){
      const s=(k+.5)*bay;
      // Recessed dark frontage and actual timber frame read as open seating
      // without inventing a navigable shop interior or menu/merchandise.
      put(bay-.15,2.16,.035,s,floor+1.18,.82,shadow);
      collider(s,.82,(bay-.15)/2,.025,floor,top,'mitsutsuji_recess_'+spec.id);
      put(bay-.15,.44,.045,s,floor+.36,.11,boards);
      if(spec.kind==='cafe'){
        put(bay-.18,.44,.025,s,floor+2.65,-.015,fabric);
        if(k===0||k===bays-1){put(bay-.23,1.56,.025,s,floor+1.29,.14,glazing);for(let j=1;j<5;j++)put(.025,1.56,.04,k*bay+j*bay/5,floor+1.29,.105,wood);}
        else put(bay-.18,.62,.025,s,floor+1.93,.33,fabric);
      }else{
        put(bay-.17,2.09,.035,s,floor+4.18,.10,plaster);
        put(bay-.27,1.25,.04,s,floor+4.10,.055,glazing);
        for(let j=0;j<5;j++)put(.045,1.28,.045,k*bay+.15+j*(bay-.30)/4,floor+4.10,.015,wood);
      }
    }
    // The gift building's upper balcony remains within its original footprint:
    // it is a recessed balustrade, never an extra ground-space obstruction.
    if(spec.kind==='gift'){
      put(length,.16,.54,length/2,floor+3.05,.28,wood);
      for(const h of [3.12,3.96])put(length,.10,.09,length/2,floor+h,.025,wood);
      const n=Math.ceil(length/.22);for(let j=0;j<=n;j++)put(.045,.76,.055,length*j/n,floor+3.54,.025,wood);
      collider(length/2,.28,length/2,.27,floor+2.97,floor+3.13,'mitsutsuji_balcony_'+spec.id);
    }
    // Front eave is shallow and suspended; posts stay on the source frontage.
    // Low eave underside must clear the mapped walking grade by 2.5m.
    const eaveY=floor+(spec.kind==='gift'?2.98:3.03),projection=.34;
    put(length,.10,.50,length/2,eaveY,-projection/2,roof);
    for(let j=0;j<=Math.ceil(length/.55);j++)put(.065,.105,.56,length*j/Math.ceil(length/.55),eaveY-.08,-projection/2,wood);
    put(length,.12,.10,length/2,eaveY-.04,-.39,wood);
    collider(length/2,-projection/2,length/2,.25,eaveY-.14,eaveY+.05,'mitsutsuji_eave_'+spec.id);
    // Roof ridge splits the true footprint polygon, preserving OSM corners.
    const poly=ring.map(p=>local(p)),roofY=d=>top+.12+Math.min(d,depth-d)*.33;
    for(const side of [-1,1]){
      const clipped=[];for(let i=0;i<poly.length;i++){
        const p=poly[i],q=poly[(i+1)%poly.length],pin=(p[1]-depth/2)*side>=0,qin=(q[1]-depth/2)*side>=0;
        if(pin)clipped.push(p);if(pin!==qin){const t=(depth/2-p[1])/(q[1]-p[1]);clipped.push([p[0]+(q[0]-p[0])*t,depth/2]);}
      }
      for(let i=1;i<clipped.length-1;i++){const p=[clipped[0],clipped[i],clipped[i+1]].map(([s,d])=>at(s,d,roofY(d)));triangle(p,roof);}
    }
    for(let e=0;e<4;e++){
      const p=poly[e],q=poly[(e+1)%4];
      const stops=(p[1]-depth/2)*(q[1]-depth/2)<0?[p,[p[0]+(q[0]-p[0])*(depth/2-p[1])/(q[1]-p[1]),depth/2],q]:[p,q];
      for(let j=1;j<stops.length;j++){const [v,w]=[stops[j-1],stops[j]];quad([at(...v,top),at(...w,top),at(w[0],w[1],roofY(w[1])),at(v[0],v[1],roofY(v[1]))],boards);}
    }
    records.push({id:spec.id,kind:spec.kind,front:spec.front.map(i=>ring[i]),frontLength:length,depth,floor,height:spec.height,eaveY,source,dimensions:'photo-informed estimates; OSM footprint exact'});
    frontages.push({spec,a,b,ux,uz,nx,nz,length,depth,floor,eaveY,at});builtIds.push(spec.id);
  }
  // The two photographed views register this canopy between these same fronts.
  // Restrict longitudinal coverage to their actual overlap; do not continue it
  // toward the upper torii, Kyoya or either stair mouth.
  let canopyRecord=null;
  if(frontages.length===2){
    const left=frontages.find(f=>f.spec.kind==='gift'),right=frontages.find(f=>f.spec.kind==='cafe');
    const project=p=>(p[0]-left.a[0])*left.ux+(p[2]-left.a[2])*left.uz;
    const lo=Math.max(.15,Math.min(project(right.a),project(right.b)))+.12,hi=Math.min(left.length-.15,Math.max(project(right.a),project(right.b)))-.12;
    const ontoRight=s=>{
      const denominator=right.ux*left.ux+right.uz*left.uz,t=(s-project(right.a))/denominator;
      return right.at(t,0,0);
    };
    if(hi-lo>.8){
      const corners=[left.at(lo,0,0),left.at(hi,0,0),ontoRight(hi),ontoRight(lo)];
      const levels=[left.eaveY+.06,left.eaveY+.06,right.eaveY+.06,right.eaveY+.06];
      let minHeadroom=Infinity;for(let row=0;row<=6;row++)for(let col=0;col<=6;col++){
        const t=row/6,u=col/6,a=corners[0].map((v,i)=>v+(corners[1][i]-v)*t),b=corners[3].map((v,i)=>v+(corners[2][i]-v)*t),x=a[0]+(b[0]-a[0])*u,z=a[2]+(b[2]-a[2])*u;
        const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Nonfinite Mitsutsuji canopy clearance');minHeadroom=Math.min(minHeadroom,levels[0]*(1-u)+levels[3]*u-.05-y);
      }
      // Seat the pitched frame on the two observed eaves instead of floating a
      // horizontal panel above the lower cafe. Omit on insufficient headroom.
      if(minHeadroom>=2.6){
        const beams=corners.map((c,i)=>[c[0],levels[i],c[2]]),p=beams.map(c=>[c[0],c[1]+.06,c[2]]);quad(p,canopy);
        const beam=(a,b)=>{const delta=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),delta.clone().normalize());add(new THREE.BoxGeometry(delta.length(),.10,.07).applyQuaternion(rotation).translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),wood);pending.push({type:'box',args:[(a[0]+b[0])/2,(a[2]+b[2])/2,len/2,.035,-Math.atan2(dz,dx),Math.min(a[1],b[1])-.05,Math.max(a[1],b[1])+.05,'mitsutsuji_canopy_beam']});};
        for(let i=0;i<4;i++)beam(beams[i],beams[(i+1)%4]);
        for(let j=1;j<4;j++){const t=j/4;beam(beams[0].map((v,i)=>v+(beams[1][i]-v)*t),beams[3].map((v,i)=>v+(beams[2][i]-v)*t));}
        for(let j=1;j<4;j++){const t=j/4;beam(beams[0].map((v,i)=>v+(beams[3][i]-v)*t),beams[1].map((v,i)=>v+(beams[2][i]-v)*t));}
        canopyRecord={corners:beams,underside:Math.min(...levels)-.05,minHeadroom,span:hi-lo,registration:'2021 IMG_6659 and IMG_7551; overlap of two registered source frontages; exact extent inferred'};
      }
    }
  }
  let triangles=0;for(const [mat,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());geometry.computeBoundingSphere();if(!Array.from(geometry.attributes.position.array).every(Number.isFinite))throw Error('Nonfinite Mitsutsuji geometry');triangles+=geometry.attributes.position.count/3;const mesh=new THREE.Mesh(geometry,mat);mesh.name='Mitsutsuji merged street architecture';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
  colliders.push(...pending);group.userData={builtIds,buildings:records,canopy:canopyRecord,drawBatches:group.children.length,triangles,colliders:pending.length,
    provenance:source+' actual 2021 lane IMG_6659_20210328.jpg and cafe IMG_7551_20210328.jpg; 2019 livingkyo200_43.png corroborates two-storey left/one-storey right street. Geographic IDs and footprints from checked-in OSM; hidden elevations and dimensions inferred.',
    limits:'Kyoya untouched. No guessed signs, fixtures, broad grading, interiors or plant placement. Canopy is estimated within verified frontage overlap; minimum walking headroom sampled from actual route surfaces.'};
  // Actual lane photos show clear air between the entry and upper stair gate,
  // rather than inferred torii repeating through the shop eaves/canopy.
  const gift=frontages.find(f=>f.spec.kind==='gift');
  if(gift){
    const end=Math.max(...frontages.flatMap(f=>[f.a,f.b]).map(p=>(p[0]-gift.a[0])*gift.ux+(p[2]-gift.a[2])*gift.uz));
    group.userData.gateExclusion={origin:[gift.a[0],gift.a[2]],axis:[gift.ux,gift.uz],start:0,end,inwardNormal:[-gift.nx,-gift.nz],crossRange:[-.25,3.7],source:'IMG_6659 lane between photographed end gates'};
    group.userData.excludeGate=({x,z,posts,visualCorners})=>{
      // The whole inferred gate is rejected if either its post/beam envelope
      // reaches the photographed street. The .35m margin covers roof overhang
      // beyond the supplied pillar centres; the original end gates lie beyond.
      const actual=visualCorners?.length;
      const samples=actual?visualCorners.map(p=>({x:p[0],z:p[2],radius:0})):posts?.length?posts:[{x,z,radius:0}],margin=actual?0:posts?.length ? .35 : 0;
      const bounds=samples.map(p=>{const dx=p.x-gift.a[0],dz=p.z-gift.a[2];return {s:dx*gift.ux+dz*gift.uz,cross:dx*(-gift.nx)+dz*(-gift.nz),r:(p.radius??0)+margin};});
      const s0=Math.min(...bounds.map(p=>p.s-p.r)),s1=Math.max(...bounds.map(p=>p.s+p.r)),c0=Math.min(...bounds.map(p=>p.cross-p.r)),c1=Math.max(...bounds.map(p=>p.cross+p.r));
      return s1>=0&&s0<=end&&c1>=-.25&&c0<=3.7?'source-registered Mitsutsuji covered shop lane':null;
    };
  }
  root.add(group);return group.userData;
}
