import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {okushaArchitecturePlan} from './okusha-architecture.mjs';

// Original geometry interpretations, not photographic textures. No lettering.
export const senbonRestR96Sources=[
  'https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg',
  'https://inari.jp/en/wp-content/uploads/2016/09/omokaru.jpg',
  'https://cdn.japan-travel-note.com/images/00126/38.jpg',
];

function plaque(parts,x,y,z,paper,wood){
  // Fox-head outline with two upright ears and pointed lower muzzle.
  const outline=[[-.12,.12],[-.075,.20],[-.025,.12],[.025,.12],[.075,.20],[.12,.12],[0,-.17]];
  const shape=new THREE.Shape();outline.forEach(([u,v],i)=>i?shape.lineTo(u,v):shape.moveTo(u,v));shape.closePath();
  parts.put(new THREE.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:false,curveSegments:1}).translate(x,y,z),paper);
  parts.beam([x,y+.16,z+.009],[x,y+.245,z+.009],.006,wood,.006,4);
}

/** After buildOkushaCourt and R95, before global static merging. */
export function buildSenbonRestR96(root,features,anchor,materials){
  if(root.children.some(g=>g.userData.senbonRestR96))return null;
  const plan=okushaArchitecturePlan(features,anchor?.target?.[1]);
  const hall=root.children.find(g=>g.userData.okushaArchitecture===88);
  const original=root.children.find(g=>g.userData.zone==='okusha');
  const racks=original?.children.filter(c=>{
    const p=c.geometry?.parameters;return p?.width===3.2&&p.height===2.1&&p.depth===.22;
  });
  if(!plan||!hall||racks?.length!==3)return null;
  const group=new THREE.Group();group.name='Okusha pavilion joinery and court votive details R96';
  group.userData={senbonRestR96:true,sources:senbonRestR96Sources,provenance:'Photographs inspected 2026-10-23; mapped hall and existing rack/stone positions retained. All sections, counts and spacing estimated.'};
  const paper=new THREE.MeshStandardMaterial({color:'#e6ddc9',roughness:1}),wood=new THREE.MeshStandardMaterial({color:'#494035',roughness:.98});
  const red=materials.vermilionMat,stone=materials.entryStoneMat;
  const pavilion=new THREE.Group();pavilion.position.copy(hall.position);pavilion.rotation.copy(hall.rotation);group.add(pavilion);
  const p=staticParts(pavilion),w=plan.width,d=plan.depth;
  // Photo shows a complete transverse beam grid and bracket shoulders under
  // the roof. Entire additions are above 2.8m, preserving every public opening.
  for(const z of [-d*.25,-d*.50,-d*.75]){
    p.box(w-.5,.18,.16,w/2,3.04,z,red);
    for(const x of [.23,w-.23])p.box(.48,.13,.28,x,2.91,z,red);
  }
  for(const x of [w*.25,w*.75])p.box(.14,.16,d-.45,x,3.09,-d/2,red);
  // Black drainage edge and hanging supports are visible on both long eaves.
  // They stay above the existing perimeter rails and do not create new solids.
  for(const x of [-.25,w+.25]){
    p.box(.09,.10,d+.46,x,3.43,-d/2,wood);
    for(let j=0;j<8;j++){
      const z=-d*j/7;
      p.beam([x,3.43,z],[x,3.22,z],.013,wood,.013,5);
      p.beam([x,3.22,z],[x+(x<0?.075:-.075),3.22,z],.013,wood,.013,5);
    }
  }
  const pavilionStats=p.flush();
  let plaques=0;const rackStats=[];
  for(const rack of racks){
    const detail=new THREE.Group();detail.position.copy(rack.position);detail.quaternion.copy(rack.quaternion);original.updateMatrixWorld(true);
    // Apply the existing owner's transform: racks remain exactly at their
    // accepted path-clear positions, never relocated by photographic inference.
    const owner=new THREE.Group();owner.position.copy(original.position);owner.quaternion.copy(original.quaternion);group.add(owner);owner.add(detail);
    const q=staticParts(detail);
    for(const side of [-1,1]){
      const z=side*.18;
      for(const x of [-1.53,1.53])q.box(.10,2.05,.06,x,0,z,red);
      for(let row=0;row<4;row++){
        const y=.67-row*.43;
        q.box(3.0,.065,.045,0,y+.24,z,red);
        for(let col=0;col<10;col++){
          const x=-1.32+col*.293+(row%2)*.018;
          // Reverse the complete plaque for the reverse face of the rack.
          const tmp=new THREE.Group(),r=staticParts(tmp);plaque(r,x,y,0,paper,wood);r.flush();
          for(const mesh of tmp.children){const geo=mesh.geometry.clone();if(side<0)geo.rotateY(Math.PI);geo.translate(0,0,z);q.put(geo,mesh.material);mesh.geometry.dispose();}
          plaques++;
        }
      }
    }
    rackStats.push(q.flush());
  }
  // Replace only the two recognized legacy round cap geometries. The square
  // sloping caps fit inside the existing .32m cylinder and retain pick-up orbs.
  let stoneCaps=0;
  for(const c of original.children){
    const g=c.geometry?.parameters;
    if(g?.radiusTop!==.32||g.radiusBottom!==.28||g.height!==.14||Math.abs(c.position.z-5.6)>.001||Math.abs(c.position.y-1.48)>.001)continue;
    const geo=new THREE.CylinderGeometry(.12,.31,.14,4);geo.rotateY(Math.PI/4);geo.computeVertexNormals();
    // Circumradius .31, matching the retained .32 cylinder collider.
    c.geometry=geo;c.material=stone;stoneCaps++;
  }
  group.userData.stats={pavilion:pavilionStats,racks:rackStats,plaques,stoneCaps};root.add(group);
  return {group,...group.userData.stats};
}
