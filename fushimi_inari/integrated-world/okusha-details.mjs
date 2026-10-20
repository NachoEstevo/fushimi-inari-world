import * as THREE from 'three';
import {okushaArrival} from './okusha-arrival.mjs';
// Existing Omokaru stones, ema, railings and interactions remain in their group.
export function buildOkushaCourt(root,features,anchor,m,colliders){
  const wood=new THREE.MeshStandardMaterial({color:'#4c3b2b',roughness:.9});
  const shutter=new THREE.MeshStandardMaterial({color:'#8c7860',roughness:.88});
  const roof=m.roofMat.clone();roof.color.set('#56615d');roof.side=THREE.DoubleSide;
  const box=(g,w,h,d,x,y,z,mat)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=h>.3;g.add(o);return o;};
  const sheet=(g,vertices,mat)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap((v,i)=>i%3===0?[v/2,vertices[i+2]/2]:[]),2));geo.computeVertexNormals();const o=new THREE.Mesh(geo,mat);o.receiveShadow=true;g.add(o);};
  const court=new THREE.Group();court.name='Connected Okusha arrival court';court.position.set(259,anchor.target[1],69);court.rotation.y=-.14;
  const apron=box(court,38,.12,20,0,0,0,m.gravelMat);
  // The gravel tile represents 1.5 m, not the full 38 m courtyard.
  // Keep metric UVs on this mesh; changing the shared texture would affect other precincts.
  const positions=apron.geometry.attributes.position,uv=apron.geometry.attributes.uv;
  for(let i=0;i<positions.count;i++)uv.setXY(i,positions.getX(i)/1.5,positions.getZ(i)/1.5);
  uv.needsUpdate=true;
  box(court,15,.025,3,-2,.075,0,m.precinctPaving);
  root.add(court);
  const r=okushaArrival;
  const arrival=box(root,r.maxX-r.minX,.08,r.maxZ-r.minZ,(r.minX+r.maxX)/2,anchor.target[1]+.10,(r.minZ+r.maxZ)/2,m.precinctPaving);
  arrival.name='Flush Senbon exit paving';
  const ap=arrival.geometry.attributes.position,au=arrival.geometry.attributes.uv;
  for(let i=0;i<ap.count;i++)au.setXY(i,(ap.getX(i)+arrival.position.x)/2,(ap.getZ(i)+arrival.position.z)/2);
  au.needsUpdate=true;
  const original=root.children.find(o=>o.isGroup&&o.userData.zone==='okusha');
  if(original){
    let rackIndex=0;
    for(let i=colliders.length-1;i>=0;i--){const c=colliders[i];if(c.args.at(-1)==='ema_rack'&&Math.hypot(c.args[0]-anchor.target[0],c.args[1]-anchor.target[2])<35)colliders.splice(i,1);}

    // Replace only the flat roof and opaque blockout shell, retaining detailed fittings.
    for(const child of [...original.children]){
      const p=child.geometry?.parameters;
      if(!p)continue;
      if(p.width===3.2&&p.height===2.1&&p.depth===.22){
        child.position.set(-2+rackIndex++*3.5,1.05,8.3);child.rotation.y=0;
        original.updateMatrixWorld(true);const q=child.position.clone().applyMatrix4(original.matrixWorld);
        colliders.push({type:'box',args:[q.x,q.z,1.6,.25,anchor.yaw,q.y-1.05,q.y+1.4,'ema_rack']});
      }

      if(p.width===1.1&&p.height===1.85&&p.depth===11.5)child.position.x=-14.5;
      if((p.width===5.2&&p.height===3.2)||(p.width===7&&p.height===.68)||(p.width===.42&&p.depth===6.4)||(p.width===18.5&&p.depth===16))child.removeFromParent();
    }
    box(original,.18,3.1,4.4,-8.3,2.15,-1.2,wood);
    for(const z of [-3.4,1])box(original,5.2,3.1,.14,-5.8,2.15,z,wood);
    for(const z of [-3.4,-1.2,1])box(original,.22,3.35,.22,-3.15,2.2,z,m.vermilionMat);
    box(original,.25,.25,5,-3.15,3.9,-1.2,m.vermilionMat);
    for(const side of [-1,1]){
      const z0=-1.2,z1=z0+side*3.7;
      for(let i=0;i<8;i++){
        const a=i/8,b=(i+1)/8,ya=5.25-1.25*a+.25*a*a,yb=5.25-1.25*b+.25*b*b,za=z0+(z1-z0)*a,zb=z0+(z1-z0)*b;
        sheet(original,[-9.5,ya,za,-1.8,ya,za,-9.5,yb,zb,-9.5,yb,zb,-1.8,ya,za,-1.8,yb,zb],roof);
        const beam=box(original,.22,Math.hypot(zb-za,yb-ya)+.035,.22,-1.78,(ya+yb)/2,(za+zb)/2,roof);beam.rotation.x=Math.atan2(zb-za,yb-ya);
      }
    }
    const plaster=m.plasterMat.clone();plaster.side=THREE.DoubleSide;
    sheet(original,[-1.9,4.1,-4.9,-1.9,5.25,-1.2,-1.9,4.1,2.5],plaster);
    box(original,8,.13,.16,-5.65,5.28,-1.2,roof);
    for(const z of [-3.4,-1.2,1]){const boss=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),m.goldMat);boss.position.set(-2.98,3.88,z);original.add(boss);}

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
    root.add(g);colliders.push({type:'box',args:[cx,cz,w/2,d/2,-.14,anchor.target[1],anchor.target[1]+4,'okusha_mapped_building']});
  }
}
