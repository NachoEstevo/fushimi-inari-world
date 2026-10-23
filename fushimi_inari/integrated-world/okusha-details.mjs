import * as THREE from 'three';
import {okushaArrival} from './okusha-arrival.mjs';
import {buildOkushaArchitecture} from './okusha-architecture.mjs';
import {buildSenbonRestFrontage} from './senbon-rest-r94.mjs?v=95-release';
import {buildOkushaCourtSurfacesR95} from './okusha-court-surface-r95.mjs';
// Existing Omokaru stones and ema remain in their group; the hall interaction
// moves with its visible replacement architecture, retaining the same mesh.
export function buildOkushaCourt(root,features,anchor,m,colliders,network=null){
  const wood=new THREE.MeshStandardMaterial({color:'#4c3b2b',roughness:.9});
  const shutter=new THREE.MeshStandardMaterial({color:'#8c7860',roughness:.88});
  const roof=m.roofMat.clone();roof.color.set('#56615d');roof.side=THREE.DoubleSide;
  const box=(g,w,h,d,x,y,z,mat)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=h>.3;g.add(o);return o;};
  const sheet=(g,vertices,mat)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap((v,i)=>i%3===0?[v/2,vertices[i+2]/2]:[]),2));geo.computeVertexNormals();const o=new THREE.Mesh(geo,mat);o.receiveShadow=true;g.add(o);};
  const court=new THREE.Group();court.name='Connected Okusha arrival court';court.position.set(259,anchor.target[1],69);court.rotation.y=-.14;
  buildOkushaCourtSurfacesR95(court,features,m,network);
  root.add(court);
  const r=okushaArrival;
  const arrival=box(root,r.maxX-r.minX,.08,r.maxZ-r.minZ,(r.minX+r.maxX)/2,anchor.target[1]+.10,(r.minZ+r.maxZ)/2,m.precinctPaving);
  arrival.name='Flush Senbon exit paving';
  const ap=arrival.geometry.attributes.position,au=arrival.geometry.attributes.uv;
  for(let i=0;i<ap.count;i++)au.setXY(i,(ap.getX(i)+arrival.position.x)/2,(ap.getZ(i)+arrival.position.z)/2);
  au.needsUpdate=true;
  const original=root.children.find(o=>o.isGroup&&o.userData.zone==='okusha');
  const architecture=buildOkushaArchitecture(root,features,anchor,m,colliders,original);
  if(original){
    let rackIndex=0;
    for(let i=colliders.length-1;i>=0;i--){const c=colliders[i];if(c.args.at(-1)==='ema_rack'&&Math.hypot(c.args[0]-anchor.target[0],c.args[1]-anchor.target[2])<35)colliders.splice(i,1);}

    // Remove only recognized hall-only fittings after the replacement succeeds.
    // The official open pavilion has rope/shide instead of the old opaque maku.
    for(const child of [...original.children]){
      const p=child.geometry?.parameters;
      if(!p)continue;
      if(p.width===3.2&&p.height===2.1&&p.depth===.22){
        // The mapped northern exit crosses this inferred row between racks 2/3.
        // Retain the three actual objects, opening a real gap around that path.
        // Shifting the complete row merely moved the obstruction along the route.
        const rackU=[-4.4,-.2,6.2][rackIndex]??(-2+rackIndex*3.5);rackIndex++;
        child.position.set(rackU,1.05,8.3);child.rotation.y=0;
        original.updateMatrixWorld(true);const q=child.position.clone().applyMatrix4(original.matrixWorld);
        colliders.push({type:'box',args:[q.x,q.z,1.6,.25,anchor.yaw,q.y-1.05,q.y+1.4,'ema_rack']});
      }

      if(p.width===1.1&&p.height===1.85&&p.depth===11.5)child.position.x=-14.5;
      if(architecture&&((p.width===5.2&&p.height===3.2)||(p.width===7&&p.height===.68)||
        (p.width===.42&&p.depth===6.4)||(p.width===18.5&&p.depth===16)||
        (p.width===6&&p.height===.68&&p.depth===5.2)||(p.width===4.2&&p.height===1.15)||
        (p.width===.10&&p.height===.88&&p.depth===.46)||(p.width===.18&&p.height===1.05&&p.depth===4.8)))child.removeFromParent();
    }
  }
  // These mapped buildings form the south edge; dimensions from their footprints.
  for(const id of ['way/301527739','way/301527730']){
    const f=features.buildings.find(b=>b.id===id);if(!f)continue;
    const points=f.points.slice(0,-1),cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[2],0)/points.length;
    const g=new THREE.Group();g.name=id==='way/301527739'?'Okusha gift and reception counter':'Okusha service building';g.position.set(cx,anchor.target[1],cz);g.rotation.y=-.14;
    const local=points.map(p=>[(p[0]-cx)*.990216+(p[2]-cz)*.139543,-(p[0]-cx)*.139543+(p[2]-cz)*.990216]);
    const w=Math.max(...local.map(p=>p[0]))-Math.min(...local.map(p=>p[0])),d=Math.max(...local.map(p=>p[1]))-Math.min(...local.map(p=>p[1]));
    box(g,w,.18,d,0,.09,0,m.entryStoneMat);box(g,w,2.8,d,0,1.58,0,wood);
    for(let i=0;i<4;i++){
      const x=-w/2+(i+.5)*w/4;box(g,w/4-.16,1.7,.06,x,1.8,-d/2-.035,shutter);
      for(let j=0;j<14;j++)box(g,w/4-.16,.025,.07,x,1.05+j*.11,-d/2-.075,wood);
      box(g,w/4-.13,.10,.65,x,.95,-d/2-.3,wood);
      box(g,w/4-.2,.38,.08,x,2.85,-d/2-.04,m.plasterMat);
    }
    for(let i=0;i<=4;i++)box(g,.14,3,.14,-w/2+i*w/4,1.65,-d/2-.1,wood);
    for(const side of [-1,1]){const z=side*(d/2+.7);sheet(g,[-w/2-.5,3.05,z,w/2+.5,3.05,z,-w/2-.5,4.15,0,-w/2-.5,4.15,0,w/2+.5,3.05,z,w/2+.5,4.15,0],roof);}
    box(g,w+1.2,.14,.16,0,4.2,0,roof);
    buildSenbonRestFrontage(g,{id,width:w,depth:d},m);
    root.add(g);colliders.push({type:'box',args:[cx,cz,w/2,d/2,-.14,anchor.target[1],anchor.target[1]+4,'okusha_mapped_building']});
  }
  return {architecture:architecture?.stats??null,builtIds:architecture?.builtIds??[]};
}
