import * as THREE from 'three';
import {pathSampler} from './spatial.mjs';
import {toriiMaterials} from './torii-materials.mjs';
import {yotsuForecourt} from './site-grading.mjs';

// Footprints are OSM; floor datums are tied to mapped approaches. Building
// heights, windows and roofs are reference-informed estimates, not a survey.
export const teaHouses=[
  {id:'way/301527779',name:'Nishimura-tei',floor:164.35,height:5.7,front:'north'},
  {id:'way/626313775',name:'Nishimura-tei · anexo',floor:163.45,height:5.4,front:'north'},
  {id:'way/626313685',name:'Okumura-tei',floor:171.7,height:3.2,front:'west'}
];
export function buildYotsutsuji(root,legacy,features,ground,colliders,surfaces){
  const group=new THREE.Group();group.name='Yotsutsuji mapped tea houses';root.add(group);
  const wood=new THREE.MeshStandardMaterial({color:0x493c2c,normalMap:legacy.materials.vermilionMat.normalMap,normalScale:new THREE.Vector2(.2,.2),roughness:.88});
  const glass=new THREE.MeshStandardMaterial({color:0x53685c,roughness:.38,metalness:.15});
  const box=(w,h,d,x,y,z,material,yaw=0)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);mesh.rotation.y=yaw;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  };
  for(const spec of teaHouses){
    const footprint=features.buildings.find(b=>b.id===spec.id);
    if(!footprint)throw Error(`Missing tea-house footprint ${spec.id}`);
    const points=footprint.points.slice(0,-1),xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);
    const minX=Math.min(...xs),minZ=Math.min(...zs),cx=(Math.min(...xs)+Math.max(...xs))/2;
    const vertices=[],uv=[];
    const tri=(a,b,c)=>{for(const p of [a,b,c]){vertices.push(...p);uv.push(p[0]/2,p[2]/2);}};
    const halfWidth=(Math.max(...xs)-minX)/2,wallTop=spec.floor+spec.height;
    const roofY=x=>wallTop+.18+(halfWidth-Math.abs(x-cx))*.28;
    // Split the footprint at the ridge: triangulating only perimeter vertices
    // had flattened the roof even when its height function described a gable.
    const clip=(polygon,side)=>{
      const out=[];
      polygon.forEach((a,i)=>{
        const b=polygon[(i+1)%polygon.length],ina=(a[0]-cx)*side>=0,inb=(b[0]-cx)*side>=0;
        if(ina)out.push(a);
        if(ina!==inb){const t=(cx-a[0])/(b[0]-a[0]);out.push([cx,0,a[2]+(b[2]-a[2])*t]);}
      });return out;
    };
    for(const face of THREE.ShapeUtils.triangulateShape(points.map(p=>new THREE.Vector2(p[0],p[2])),[])){
      for(const side of [-1,1]){
        const poly=clip(face.map(i=>points[i]),side);
        for(let i=1;i<poly.length-1;i++)tri(...[poly[0],poly[i],poly[i+1]].map(p=>[p[0],roofY(p[0]),p[2]]));
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
    const roofMat=legacy.materials.roofMat.clone();roofMat.side=THREE.DoubleSide;
    const roof=new THREE.Mesh(geo,roofMat);roof.castShadow=true;roof.receiveShadow=true;group.add(roof);
    points.forEach((a,i)=>{
      const b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
      const yaw=-Math.atan2(dz,dx),x=(a[0]+b[0])/2,z=(a[2]+b[2])/2;
      const front=spec.front==='north'?z<minZ+3:x<minX+1.5;
      const bottom=Math.min(spec.floor-.3,ground(x,z)-.3);
      box(len,spec.floor-bottom,.3,x,(bottom+spec.floor)/2,z,legacy.materials.stoneMat,yaw);
      box(len,spec.height,.22,x,spec.floor+spec.height/2,z,front?wood:legacy.materials.plasterMat,yaw);
      box(len+.25,.22,.5,x,spec.floor+spec.height,z,roofMat,yaw);
      // Close each gable to its actual roof profile.
      const edgePoints=[a,...((a[0]-cx)*(b[0]-cx)<0?[[cx,0,a[2]+dz*(cx-a[0])/dx]]:[]),b];
      const gable=[];
      for(let j=0;j<edgePoints.length-1;j++){
        const p=edgePoints[j],q=edgePoints[j+1];
        gable.push(p[0],wallTop,p[2],q[0],wallTop,q[2],q[0],roofY(q[0]),q[2],
          p[0],wallTop,p[2],q[0],roofY(q[0]),q[2],p[0],roofY(p[0]),p[2]);
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(gable,3));g.computeVertexNormals();
      const gm=wood.clone();gm.side=THREE.DoubleSide;gm.normalMap=null;
      const infill=new THREE.Mesh(g,gm);infill.castShadow=true;group.add(infill);
      colliders.push({type:'box',args:[x,z,len/2,.18,yaw,bottom,spec.floor+spec.height,'tea_house_wall']});
      if(!front||len<2)return;
      const normal=spec.front==='north'?[0,-1]:[-1,0];
      const bays=Math.max(1,Math.floor(len/1.4));
      for(let j=0;j<=bays;j++){
        const px=a[0]+dx*j/bays+normal[0]*.18,pz=a[2]+dz*j/bays+normal[1]*.18;
        box(.095,spec.height,.095,px,spec.floor+spec.height/2,pz,wood,yaw);
        if(j===bays)continue;
        const wx=a[0]+dx*(j+.5)/bays+normal[0]*.15,wz=a[2]+dz*(j+.5)/bays+normal[1]*.15;
        const levels=spec.height>4?[1.55,4.15]:[1.6];
        for(const level of levels){
          box(len/bays-.16,1.35,.055,wx,spec.floor+level,wz,glass,yaw);
          for(const offset of [-.68,.68])box(len/bays,.07,.10,wx,spec.floor+level+offset,wz,wood,yaw);
          box(.045,1.35,.08,wx,spec.floor+level,wz,wood,yaw);
        }
      }
      box(len,.10,1.05,x+normal[0]*.5,spec.floor+2.8,z+normal[1]*.5,roofMat,yaw);
      for(let j=0;j<=bays;j++)box(.055,.12,1.08,a[0]+dx*j/bays+normal[0]*.5,spec.floor+2.77,a[2]+dz*j/bays+normal[1]*.5,wood,yaw);
      box(len,.10,.10,x+normal[0]*.97,spec.floor+2.78,z+normal[1]*.97,roofMat,yaw);
    });
  }
  // A bounded, sloped forecourt follows the existing junction instead of
  // the old 22 m square that covered the branches and their stairs.
  const polygon=yotsuForecourt;
  const positions=[],uv=[];
  for(const t of THREE.ShapeUtils.triangulateShape(polygon.map(p=>new THREE.Vector2(...p)),[]))
    for(const i of t){const [x,z]=polygon[i];positions.push(x,ground(x,z)+.10,z);uv.push(x/2,z/2);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
  const mat=legacy.materials.flagstoneMat.clone();mat.side=THREE.DoubleSide;
  const plaza=new THREE.Mesh(geo,mat);plaza.receiveShadow=true;group.add(plaza);
  // Lateral ten-step approach and north branch are visible in panoramas.
  // Individual gate positions are inferred within these mapped ways.
  const finishes=toriiMaterials(legacy);
  let gateCount=0;
  for(const id of ['way/1052553392','way/1052553395']){
    const path=features.paths.find(p=>p.id===id),sampler=pathSampler(path.points);
    for(let d=.9;d<sampler.total-.6;d+=2.2){
      const {point,yaw}=sampler.at(d/sampler.total),[x,,z]=point,y=surfaces.height(x,z)-.025;
      const gate=new THREE.Group();gate.position.set(x,y,z);gate.rotation.y=yaw;
      gate.add(new THREE.Mesh(legacy.torii.geometry,gateCount%3?finishes.weathered:finishes.fresh),new THREE.Mesh(legacy.torii.blackGeometry,legacy.materials.blackNemakiMat));
      gate.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});root.add(gate);
      for(const side of [-1,1])colliders.push({type:'cylinder',args:[x+Math.cos(yaw)*side*1.24,z-Math.sin(yaw)*side*1.24,.144,y,y+3.4,'yotsu_torii']});
      gateCount++;
    }
  }
  return {buildings:teaHouses.length,gates:gateCount,footprints:teaHouses.map(s=>s.id),status:'OSM footprints; reference-informed facades; inferred heights'};
}
