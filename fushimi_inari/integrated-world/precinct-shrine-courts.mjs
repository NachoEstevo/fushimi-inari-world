import * as THREE from 'three';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathOffset} from './path-frame.mjs';

// Photo-inferred, deliberately narrow collars. Podium dimensions come from the
// retained pavilion geometry; photographs do not establish surveyed court limits.
const profiles={gonden:{half:[3.6,2.7],roofFootprint:'way/305214371',reference:'outputs/r76/gonden-side.jpg'},okumiya:{half:[3.4,2.5],roofFootprint:'way/301527733',reference:'outputs/r76/okumiya-rear.jpg'}};
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
const overlap=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
const subtract=(polygons,cuts)=>cuts.reduce((ps,c)=>ps.flatMap(p=>subtractConvex(p,c)),polygons);

export function shrineCourtPlan(zone,matrix,cuts=[]){
  const profile=profiles[zone];if(!profile)return null;
  const world=([x,z])=>[matrix[0]*x+matrix[8]*z+matrix[12],matrix[2]*x+matrix[10]*z+matrix[14]];
  const [x,z]=profile.half;
  const rect=(a,b,c,d)=>[[a,c],[b,c],[b,d],[a,d]].map(world);
  const base=rect(-x,x,-z,z),border=rect(-x-.18,x+.18,-z-.18,z+.18);
  const envelope=rect(-x-.95,x+.95,-z-.85,z+.90);
  return {envelope,base,stone:subtract([border],[base,...cuts]),gravel:subtract([envelope],[border,...cuts]),reference:profile.reference};
}

function courtCuts(features,network,region,zone){
  const cuts=[];
  for(const f of [...(features.buildings??[]),...(features.water??[])]){
    // These mapped outlines enclose the authored pavilion's overhanging roof,
    // not its ground plinth. The retained physical plinth is already cut in
    // shrineCourtPlan; cutting its own roof would erase photographed gravel
    // under the eaves. All neighbouring building and water outlines stay cut.
    if(f.id===profiles[zone].roofFootprint)continue;
    const ring=f.points.map(p=>new THREE.Vector2(p[0],p[2]));
    if(ring.length<3||!overlap(bounds(ring.map(p=>[p.x,p.y])),region))continue;
    if(ring[0].equals(ring.at(-1)))ring.pop();
    for(const t of THREE.ShapeUtils.triangulateShape(ring,[]))cuts.push(t.map(i=>[ring[i].x,ring[i].y]));
  }
  for(const [i,s] of (network.segments??[]).entries()){
    if(Math.hypot(s.b[0]-s.a[0],s.b[2]-s.a[2])<1e-6)continue;
    const w=s.width/2+.15;
    const neighbor=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
    const a=pathOffset(s.a,s.b,neighbor(network.segments[i-1],'b')),b=pathOffset(s.a,s.b,neighbor(network.segments[i+1],'a'),true);
    const cut=[[s.a[0]+a[0]*w,s.a[2]+a[1]*w],[s.b[0]+b[0]*w,s.b[2]+b[1]*w],[s.b[0]-b[0]*w,s.b[2]-b[1]*w],[s.a[0]-a[0]*w,s.a[2]-a[1]*w]];
    if(overlap(bounds(cut),region))cuts.push(cut);
    const p=s.accessJunctionTriangles??[];
    for(let j=0;j<p.length;j+=9){const t=[[p[j],p[j+2]],[p[j+3],p[j+5]],[p[j+6],p[j+8]]];if(overlap(bounds(t),region))cuts.push(t);}
  }
  return cuts;
}

function surface(polygons,network,source,name){
  const positions=[],uv=[],grid=.25;
  for(const polygon of polygons){
    const b=bounds(polygon);
    for(let x=Math.floor(b[0]/grid)*grid;x<b[1];x+=grid)for(let z=Math.floor(b[2]/grid)*grid;z<b[3];z+=grid){
      let p=clipConvex(polygon,[[x,z],[x+grid,z],[x+grid,z+grid],[x,z+grid]]);
      if(polygonArea(p)<0)p=p.toReversed();
      for(let i=1;i<p.length-1;i++){
        const tri=[p[0],p[i+1],p[i]];if(Math.abs(polygonArea(tri))<1e-9)continue;
        for(const [px,pz] of tri){const y=network.terrainHeight(px,pz)+.012;if(!Number.isFinite(y))throw Error('Nonfinite shrine court height');positions.push(px,y,pz);uv.push(px/1.5,pz/1.5);}
      }
    }
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const material=source.clone();material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.receiveShadow=true;return mesh;
}

// Call after pavilion world placement and final terrain/path refinements.
// Pure material overlays: no collider, height sampler or source geometry changes.
export function buildPrecinctShrineCourts(root,features,network,materials){
  const name='Photo-inferred Gonden Okumiya mineral collars';
  if(root.getObjectByName(name))return root.getObjectByName(name).userData;
  if(!materials.gravelMat||!materials.stoneMat)return null;
  const shrines=[];root.traverse(o=>{if(o.isGroup&&((o.userData.zone==='gonden'&&o.userData.gondenFacadeR65)||(o.userData.zone==='okumiya'&&o.userData.okumiyaDetail)))shrines.push(o);});
  const group=new THREE.Group();group.name=name;const courts=[];
  for(const shrine of shrines){
    shrine.updateWorldMatrix(true,false);const zone=shrine.userData.zone,matrix=shrine.matrixWorld.elements;
    const initial=shrineCourtPlan(zone,matrix),plan=shrineCourtPlan(zone,matrix,courtCuts(features,network,bounds(initial.envelope),zone));
    for(const kind of ['gravel','stone']){const mesh=surface(plan[kind],network,materials[kind==='gravel'?'gravelMat':'stoneMat'],`${zone} ${kind} terrain collar`);if(mesh)group.add(mesh);}
    courts.push({zone,reference:plan.reference,ownRoofFootprint:profiles[zone].roofFootprint,plinthSize:profiles[zone].half.map(v=>v*2),area:[...plan.gravel,...plan.stone].reduce((s,p)=>s+Math.abs(polygonArea(p)),0)});
  }
  if(!group.children.length)return null;
  group.userData={courts,grid:.25,heightOffset:.012,walkingUnchanged:true,limits:'Photo-inferred narrow material collars and flush stone strips; not surveyed boundaries or raised curbs. Existing Tamayama forecourt remains separately owned.'};root.add(group);return group.userData;
}
