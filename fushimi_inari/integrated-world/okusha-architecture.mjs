import * as THREE from 'three';
import {staticParts,shide} from './mountain-landmarks-geometry.mjs';

export const okushaBuildingId='way/301527734';
/** Specific eight-corner mapped outline: broad west pavilion, narrow east sanctuary. */
export function okushaArchitecturePlan(features,floor){
  const points=features.buildings?.find(b=>b.id===okushaBuildingId)?.points?.slice(0,-1);
  if(points?.length!==8||!points.every(p=>p.every(Number.isFinite))||!Number.isFinite(floor))return null;
  const origin=points[0],dx=points[1][0]-origin[0],dz=points[1][2]-origin[2],length=Math.hypot(dx,dz);
  if(length<1)return null;
  const right=[dx/length,dz/length],front=[-right[1],right[0]],yaw=Math.atan2(front[0],front[1]);
  const polygon=points.map(p=>[(p[0]-origin[0])*right[0]+(p[2]-origin[2])*right[1],
    (p[0]-origin[0])*front[0]+(p[2]-origin[2])*front[1]]);
  // Exact point ordering is checked before using this site-specific decomposition.
  const width=(polygon[1][0]+polygon[2][0])/2,depth=-(polygon[2][1]+polygon[7][1])/2;
  const rearMin=(polygon[5][0]+polygon[6][0])/2,rearMax=(polygon[3][0]+polygon[4][0])/2;
  const rearBack=(polygon[4][1]+polygon[5][1])/2;
  if(width<5||width>10||depth<5||depth>10||rearMin<=0||rearMax>=width||rearMax<=rearMin||rearBack>=-depth-1)return null;
  const world=(x,z)=>[origin[0]+right[0]*x+front[0]*z,origin[2]+right[1]*x+front[1]*z];
  return {origin:[origin[0],floor,origin[2]],yaw,polygon,width,depth,
    fore:{minX:0,maxX:width,front:0,back:-depth,floor:.16,eave:3.35,ridge:4.80},
    rear:{minX:rearMin,maxX:rearMax,front:-depth,back:rearBack,floor:.60,eave:4.35,ridge:6.05},world,
    provenance:'OSM eight-corner building outline; west open fore-pavilion/east rear sanctuary matched to official exterior photograph. Roof heights, floor separation, joinery and entry gap are estimates, not surveyed.'};
}

/** Build before static merge; takes over only the existing Okusha hall mesh identity. */
export function buildOkushaArchitecture(root,features,anchor,materials,colliders,original){
  if(root.children.some(g=>g.userData?.okushaArchitecture===88))return null;
  const plan=okushaArchitecturePlan(features,anchor.target[1]);if(!plan||!original)return null;
  const body=original.children.find(c=>c.isMesh&&c.userData?.interactable&&c.geometry?.parameters?.width===5.2&&c.geometry.parameters.height===3.2);
  if(!body)return null; // No partial replacement of an unrecognized legacy contract.
  const group=new THREE.Group();group.name='Okusha · open worship pavilion and rear sanctuary';
  group.position.set(...plan.origin);group.rotation.y=plan.yaw;
  group.userData={okushaArchitecture:88,osm:okushaBuildingId,reference:'https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg',provenance:plan.provenance};
  const parts=staticParts(group),red=materials.vermilionMat;
  const roof=materials.roofMat.clone();roof.color.set('#56615d');roof.side=THREE.DoubleSide;
  const white=materials.plasterMat.clone();white.side=THREE.DoubleSide;
  const stone=materials.entryStoneMat,wood=new THREE.MeshStandardMaterial({color:'#4c3b2b',roughness:.94});
  const straw=new THREE.MeshStandardMaterial({color:'#b7a176',roughness:1});
  const solids=[];
  const solid=(x,z,w,d,bottom,top,tag)=>{const p=plan.world(x,z);solids.push({type:'box',args:[p[0],p[1],w/2,d/2,plan.yaw,plan.origin[1]+bottom,plan.origin[1]+top,tag]});};
  const column=(x,z)=>{parts.box(.22,3.19,.22,x,1.755,z,red);parts.box(.31,.14,.31,x,.23,z,stone);solid(x,z,.31,.31,.16,3.35,'okusha_column');};
  const rail=(x0,z0,x1,z1)=>{
    const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx);
    for(const y of [.32,1.15]){const g=new THREE.BoxGeometry(len,.12,.14);g.rotateY(yaw).translate((x0+x1)/2,y,(z0+z1)/2);parts.put(g,red);}
    const count=Math.max(1,Math.round(len/.20));for(let i=1;i<count;i++)parts.box(.055,.77,.055,x0+dx*i/count,.735,z0+dz*i/count,red);
    const p=plan.world((x0+x1)/2,(z0+z1)/2);
    solids.push({type:'box',args:[p[0],p[1],len/2,.095,plan.yaw+yaw,plan.origin[1]+.16,plan.origin[1]+1.22,'okusha_lattice']});
  };
  function roofVolume(v,gableMaterial){
    const cx=(v.minX+v.maxX)/2,half=(v.maxX-v.minX)/2+.24,back=v.back-.24,front=v.front+.24;
    const y=t=>v.eave+(v.ridge-v.eave)*(1-t)+.10*t*t*t*t;
    for(const side of [-1,1])for(let i=0;i<10;i++){
      const a=i/10,b=(i+1)/10,xa=cx+side*half*a,xb=cx+side*half*b,ya=y(a),yb=y(b);
      const sheet=(delta,mat)=>{
        const triangles=[[xa,ya+delta,back],[xa,ya+delta,front],[xb,yb+delta,back],
          [xb,yb+delta,back],[xa,ya+delta,front],[xb,yb+delta,front]];
        if(side<0)for(let j=0;j<triangles.length;j+=3)[triangles[j+1],triangles[j+2]]=[triangles[j+2],triangles[j+1]];
        parts.sheet(triangles.flat(),mat);
      };
      sheet(0,roof);sheet(-.12,white);
      for(const z of [front-.10,back+.10]){
        parts.sheet([xa,v.eave-.12,z,xb,v.eave-.12,z,xa,ya-.12,z,
          xa,ya-.12,z,xb,v.eave-.12,z,xb,yb-.12,z],gableMaterial);
      }
      for(const z of [front,back]){
        const g=new THREE.BoxGeometry(Math.hypot(xb-xa,yb-ya),.15,.16);g.rotateZ(Math.atan2(yb-ya,xb-xa));g.translate((xa+xb)/2,(ya+yb)/2-.045,z);parts.put(g,red);
      }
    }
    // Exposed rafters are below the white soffit rather than pasted on its top.
    const count=Math.ceil((front-back)/.55);
    for(let j=0;j<=count;j++)for(const side of [-1,1]){
      const a=new THREE.Vector3(cx,v.ridge-.16,back+(front-back)*j/count),b=new THREE.Vector3(cx+side*half,v.eave-.06,a.z),d=b.clone().sub(a);
      const g=new THREE.BoxGeometry(.065,d.length(),.075);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());parts.put(g,red);
    }
    parts.box(.19,.17,front-back+.08,cx,v.ridge+.055,(front+back)/2,roof);
    for(const z of [front-.08,back+.08]){
      parts.box(.13,v.ridge-v.eave,.13,cx,(v.ridge+v.eave)/2-.12,z,red);
      for(const side of [-1,1])parts.beam([cx,v.ridge-.22,z],[cx+side*half*.70,v.eave+.12,z],.045,red,.045,6);
    }
  }
  const f=plan.fore,r=plan.rear,w=plan.width,d=plan.depth;
  parts.box(w,.16,d,w/2,.08,-d/2,stone);
  for(const x of [.20,w*.25,w*.75,w-.20])for(const z of [-.20,-d+.20])column(x,z);
  for(const x of [.20,w-.20])column(x,-d/2);
  for(const z of [-.20,-d+.20])parts.box(w-.18,.25,.23,w/2,3.20,z,red);
  for(const x of [.20,w-.20])parts.box(.23,.25,d-.18,x,3.20,-d/2,red);
  rail(.22,-.20,w/2-.96,-.20);rail(w/2+.96,-.20,w-.22,-.20);
  for(const x of [.20,w-.20])rail(x,-.22,x,-d+.22);
  // Keep the central worship sightline open; rear lattice surrounds the sanctuary.
  rail(.22,-d+.20,r.minX,-d+.20);rail(r.maxX,-d+.20,w-.22,-d+.20);
  roofVolume(f,white);
  const rw=r.maxX-r.minX,rd=r.front-r.back,cx=(r.minX+r.maxX)/2,cz=(r.front+r.back)/2;
  parts.box(rw,.60,rd,cx,.30,cz,stone);
  for(const x of [r.minX+.12,r.maxX-.12]){parts.box(.18,3.75,rd-.16,x,2.475,cz,red);solid(x,cz,.18,rd-.16,.16,4.35,'okusha_rear_wall');}
  for(const z of [r.front-.10,r.back+.10]){parts.box(rw,3.75,.18,cx,2.475,z,red);solid(cx,z,rw,.18,.16,4.35,'okusha_rear_wall');}
  for(const x of [r.minX+.18,r.maxX-.18])for(const z of [r.front-.12,r.back+.12])parts.box(.25,3.90,.25,x,2.55,z,red);
  // Restrained front doors and dark gaps; no invented calligraphy or emblems.
  for(const side of [-1,1]){parts.box(rw*.32,2.5,.055,cx+side*rw*.165,2.08,r.front+.015,wood);parts.box(.035,2.5,.065,cx+side*.035,2.08,r.front+.05,roof);}
  roofVolume(r,red);
  // Rope/shide are directly supported by the official fore-pavilion photograph.
  for(let i=0;i<12;i++){const xa=w*.25+(w*.5)*i/12,xb=w*.25+(w*.5)*(i+1)/12;parts.beam([xa,3.10-.12*Math.sin(Math.PI*i/12),.03],[xb,3.10-.12*Math.sin(Math.PI*(i+1)/12),.03],.048,straw,.048,8);}
  for(const x of [w*.29,w*.39,w*.61,w*.71])shide(parts,x,3.02,.055,.49,white);
  const stats=parts.flush();
  // Preserve the exact registered mesh object/callback while drawing its new
  // visible architecture. No transparent proxy, detached interaction or extra pick list.
  const redBatch=group.children.find(c=>c.isMesh&&c.material===red);
  body.removeFromParent();body.geometry=redBatch.geometry;body.material=red;body.position.set(0,0,0);body.rotation.set(0,0,0);body.scale.set(1,1,1);body.castShadow=body.receiveShadow=true;
  redBatch.removeFromParent();group.add(body);
  for(let i=colliders.length-1;i>=0;i--)if(colliders[i].args.at(-1)==='okusha_hall'&&Math.hypot(colliders[i].args[0]-anchor.target[0],colliders[i].args[1]-anchor.target[2])<30)colliders.splice(i,1);
  colliders.push(...solids);root.add(group);
  group.userData.stats={...stats,colliders:solids.length,footprint:okushaBuildingId,volumes:2};
  return {group,plan,stats:group.userData.stats,builtIds:[okushaBuildingId],interaction:body};
}
