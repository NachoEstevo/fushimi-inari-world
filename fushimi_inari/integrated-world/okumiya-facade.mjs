import * as THREE from 'three';
import {finishPrecinctVeranda} from './precinct-veranda-materials.mjs';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {okumiyaLayout as layout,okumiyaRailRuns,okumiyaRafter,okumiyaRoofY,okumiyaLatticeReturns,okumiyaBargeboard} from './okumiya-layout.mjs';

const near=(a,b)=>Math.abs(a-b)<1e-6;
const sourceBox=(object,w,h,d)=>object.children.find(c=>{
  const p=c.geometry?.parameters;
  return c.isMesh&&p&&near(p.width,w)&&near(p.height,h)&&near(p.depth,d);
});

// IMG_6628 / 6630 / 6974 show the front, rear and gable respectively;
// IMG_6970 shows the hanging fittings. Keep the authored pavilion identity,
// stone base, material maps and interaction while correcting its finish.
export function refineOkumiya(object,materials){
  if(object.userData.zone!=='okumiya'||!object.isGroup)return null;
  if(object.userData.okumiyaDetail?.revision==='R69')return object.userData.okumiyaDetail;

  // Match the complete source signature before changing anything. A future
  // replacement asset must not receive an accidental second architectural skin.
  const roof=sourceBox(object,7.8,.72,6.2),walls=sourceBox(object,5.6,2.95,3.8);
  const lattice=sourceBox(object,5.68,1.12,3.88),veranda=sourceBox(object,6.3,.16,4.4);
  const podium=sourceBox(object,6.8,.48,5),ridge=sourceBox(object,8,.26,.44);
  const columns=object.children.filter(c=>{
    const p=c.geometry?.parameters;
    return c.isMesh&&p&&near(p.radiusTop,.12)&&near(p.radiusBottom,.13)&&near(p.height,2.95)&&near(c.position.z,1.95);
  });
  if(!roof||!walls||!lattice||!veranda||!podium||!ridge||columns.length!==4)return null;

  // Cancel the compressed source layout's old quarter turn. The geographic
  // adapter supplies the remaining yaw and the unchanged solid collider.
  object.rotation.y=-.06;
  // IMG_6628 shows dressed matte granite. The shared paving normal has
  // aggressive grain; soften only this podium without changing its source maps.
  podium.material=podium.material.clone();podium.material.normalScale.set(.32,.32);
  podium.material.roughness=.96;podium.material.metalness=0;
  const red=materials.vermilionMat,gold=materials.goldMat;
  const wood=new THREE.MeshStandardMaterial({color:'#192127',roughness:.91});
  const trim=new THREE.MeshStandardMaterial({color:'#514037',roughness:.86});
  const pale=new THREE.MeshStandardMaterial({color:'#e4dfd3',roughness:.94,side:THREE.DoubleSide});
  const green=new THREE.MeshStandardMaterial({color:'#32685b',roughness:.91});
  const rose=new THREE.MeshStandardMaterial({color:'#ba8d86',roughness:.96,side:THREE.DoubleSide});
  const batches=new Map();
  const part=(geo,mat)=>{
    if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}
    if(!batches.has(mat))batches.set(mat,[]);
    batches.get(mat).push(geo);
  };
  const box=(w,h,d,x,y,z,mat)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  const beam=(a,b,w,d,mat)=>{
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);
    const geo=new THREE.BoxGeometry(w,v.length(),d);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));
    geo.translate(...av.add(bv).multiplyScalar(.5).toArray());part(geo,mat);
  };
  const sheet=(vertices,mat)=>{
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    const uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]+vertices[i+2],vertices[i+1]);
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();part(geo,mat);
  };
  const disc=(radius,x,y,z,mat,axis='z')=>{
    const geo=new THREE.CylinderGeometry(radius,radius,.018,12).rotateX(Math.PI/2);
    if(axis==='x')geo.rotateY(Math.PI/2);
    part(geo.translate(x,y,z),mat);
  };
  // Continuous rectangular fascia/rafter sections replace independent round
  // cylinders. The sections have a predictable outward winding in both axes.
  const ribbon=(points,width,height,axis,mat)=>{
    const rings=points.map(([x,y,z])=>axis==='x'
      ?[[x-width/2,y-height/2,z],[x+width/2,y-height/2,z],[x+width/2,y+height/2,z],[x-width/2,y+height/2,z]]
      :[[x,y-height/2,z-width/2],[x,y+height/2,z-width/2],[x,y+height/2,z+width/2],[x,y-height/2,z+width/2]]);
    const vertices=[];
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<4;j++){
      const a=rings[i][j],b=rings[i][(j+1)%4],c=rings[i+1][j],d=rings[i+1][(j+1)%4];
      vertices.push(...a,...b,...c,...c,...b,...d);
    }
    vertices.push(...rings[0][0],...rings[0][2],...rings[0][1],...rings[0][0],...rings[0][3],...rings[0][2]);
    const last=rings.at(-1);vertices.push(...last[0],...last[1],...last[2],...last[0],...last[2],...last[3]);
    sheet(vertices,mat);
  };
  const replaceGeometry=(mesh,geo)=>{mesh.geometry.dispose();mesh.geometry=geo;};

  // Asymmetric nagare roof, retaining its original horizontal envelope.
  const roofGeo=new THREE.BoxGeometry(layout.roofWidth,.20,layout.roofDepth,12,1,32);
  const positions=roofGeo.attributes.position,roofUV=roofGeo.attributes.uv;
  for(let i=0;i<positions.count;i++){
    // R65 stretched a single tile over the whole roof. Metric repeats make
    // the preserved bark image read as small courses instead of huge planks.
    const x=positions.getX(i),z=positions.getZ(i),y=positions.getY(i)+okumiyaRoofY(x,z+layout.roofCentreZ)-3.20;
    const normal=roofGeo.attributes.normal;
    if(Math.abs(normal.getY(i))>.5)roofUV.setXY(i,x/1.10,z/.72);
    else roofUV.setXY(i,Math.abs(normal.getX(i))>.5?z/.72:x/1.10,y/.72);
    positions.setY(i,y);
  }
  roofGeo.computeVertexNormals();replaceGeometry(roof,roofGeo);roof.position.y=3.20;
  // Match the bark shell subdivisions: a coarser interpolation can cross
  // through its curved underside and expose strips of the bark material.
  const soffit=new THREE.PlaneGeometry(layout.roofWidth,layout.roofDepth,12,32).rotateX(Math.PI/2);
  const soffitPosition=soffit.attributes.position,soffitUV=soffit.attributes.uv;
  for(let i=0;i<soffitPosition.count;i++){
    const x=soffitPosition.getX(i),z=soffitPosition.getZ(i)+layout.roofCentreZ;
    soffitPosition.setXYZ(i,x,okumiyaRoofY(x,z)-.11,z);soffitUV.setXY(i,x,z);
  }
  soffit.computeVertexNormals();part(soffit,red);
  // Maps stay shared; only this roof's normal intensity and roughness change.
  roof.material=roof.material.clone();roof.material.normalScale.set(.38,.38);roof.material.roughness=.94;
  const crestY=okumiyaRoofY(0,layout.ridgeZ);
  ridge.position.set(0,crestY+.13,layout.ridgeZ);ridge.material=trim;
  box(8,.06,.49,0,crestY+.26,layout.ridgeZ,trim);
  for(const x of [-3,0,3])for(const side of [-1,1])disc(.075,x,crestY+.14,layout.ridgeZ+side*.23,gold);
  for(const side of [-1,1])disc(.115,side*4.01,crestY+.13,layout.ridgeZ,gold,'x');

  // Photos show square front posts and a raised side/rear veranda. The
  // exterior stone podium and the public walkable terrain stay untouched.
  for(const column of columns)replaceGeometry(column,new THREE.BoxGeometry(.24,2.95,.24));
  veranda.position.y=layout.verandaFloor-.08;
  finishPrecinctVeranda(veranda);

  // The original koshi texture mistakenly wrapped all four plaster walls.
  // Reuse that material on the front; the real side and rear remain white.
  const latticeGeo=new THREE.BoxGeometry(5.68,1.12,.045).translate(0,0,1.942);
  const latticeUV=latticeGeo.attributes.uv;
  for(let i=0;i<latticeUV.count;i++)latticeUV.setXY(i,latticeUV.getX(i)*5.68/1.2,latticeUV.getY(i)*1.12/1.2);
  replaceGeometry(lattice,latticeGeo);

  // Short lower-lattice corner returns are visible in IMG6628/6974.
  // Reuse the front's source material and metric UVs, keeping the remaining
  // side/rear white instead of restoring the old full lattice wrap.
  for(const spec of okumiyaLatticeReturns()){
    const geo=new THREE.BoxGeometry(.045,spec.height,spec.depth),uv=geo.attributes.uv,normal=geo.attributes.normal;
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(Math.abs(normal.getX(i))>.5?spec.depth:.045)/1.2,uv.getY(i)*spec.height/1.2);
    geo.translate(spec.x,spec.y,spec.z);part(geo,lattice.material);
    box(.085,1.18,.08,spec.x,spec.y,spec.z-spec.depth/2,red);
    for(const y of [.49,1.61])box(.085,.09,spec.depth+.05,spec.x,y,spec.z,red);
  }

  for(const x of layout.frontBayCentres){
    box(1.56,1.48,.045,x,2.35,1.925,wood);
    for(let j=-8;j<=8;j++)box(.027,1.48,.043,x+j*.087,2.35,1.964,wood);
    for(const y of [1.65,1.91,2.17,2.43,2.69,2.95,3.07])box(1.60,.027,.047,x,y,1.968,wood);
    // Sloping timber guards sit in front of the dark upper lattice bays.
    for(const dx of [-.72,0,.72])beam([x+dx,1.67,2.10],[x+dx,2.21,1.99],.038,.04,trim);
    box(1.47,.04,.04,x,1.67,2.10,trim);box(1.47,.04,.04,x,2.21,1.99,trim);
  }
  for(const y of [.52,1.61,3.16,3.38])box(5.90,.13,.20,0,y,2.015,red);
  for(const x of layout.frontPostCentres)for(const y of [.79,1.58,3.12])disc(.045,x,y,2.105,gold);

  // White rear panels, vermilion wall framing and small lower side vents.
  for(const y of [.52,1.55,2.94,3.37]){
    box(5.76,.13,.12,0,y,-1.94,red);
    for(const side of [-1,1])box(.12,.13,3.86,side*2.82,y,0,red);
  }
  for(const x of layout.frontPostCentres)box(.18,2.95,.13,x,1.95,-1.94,red);
  for(const side of [-1,1]){
    for(const z of [-1.8,0,1.8])box(.13,2.95,.18,side*2.82,1.95,z,red);
    box(.035,.30,.55,side*2.905,.81,.1,trim);
    for(let i=0;i<7;i++)box(.045,.30,.022,side*2.93,.81,-.14+i*.08,red);
    for(const y of [.64,.98])box(.055,.045,.63,side*2.93,y,.1,red);
  }

  // The U-shaped railing never crosses the front interaction approach.
  for(const run of okumiyaRailRuns()){
    const at=(value,y)=>run.axis==='x'?[value,y,run.fixed]:[run.fixed,y,value];
    for(const y of [layout.verandaFloor+.10,layout.verandaFloor+.28,layout.railTop])beam(at(run.start,y),at(run.end,y),.05,.055,red);
    const count=Math.ceil((run.end-run.start)/.53);
    for(let i=0;i<=count;i++)box(.055,.48,.055,...at(run.start+(run.end-run.start)*i/count,layout.verandaFloor+.25),red);
  }
  for(const side of [-1,1])for(const z of [-2.12,1.92]){
    const x=side*3.08;
    box(.11,.59,.11,x,layout.verandaFloor+.285,z,red);
    box(.15,.08,.15,x,layout.verandaFloor+.06,z,gold);
    beam([x,layout.railTop,z],[x+side*.13,layout.railTop+.065,z],.05,.055,red);
    part(new THREE.CylinderGeometry(.075,.085,layout.verandaFloor-.49,8).translate(x,(layout.verandaFloor+.49)/2,z),red);
  }
  for(const x of [-1.55,0,1.55])part(new THREE.CylinderGeometry(.075,.085,layout.verandaFloor-.49,8).translate(x,(layout.verandaFloor+.49)/2,-2.12),red);

  for(const side of [-1,1]){
    const x=side*2.8,vertices=[];
    for(let i=0;i<16;i++){
      const a=-1.9+i*3.8/16,b=-1.9+(i+1)*3.8/16;
      vertices.push(x,3.42,a,x,okumiyaRoofY(x,a)-.11,a,x,okumiyaRoofY(x,b)-.11,b,x,3.42,a,x,okumiyaRoofY(x,b)-.11,b,x,3.42,b);
    }
    sheet(vertices,pale);
    beam([side*2.83,3.42,layout.ridgeZ],[side*2.83,okumiyaRoofY(x,layout.ridgeZ)-.17,layout.ridgeZ],.09,.09,red);
    for(const z of [-1.78,1.77])beam([side*2.83,3.42,z],[side*2.83,okumiyaRoofY(x,layout.ridgeZ)-.17,layout.ridgeZ],.075,.075,red);
  }
  // Close the short front/rear friezes under the lifted roof so the preserved
  // wall does not leave an open slit into the pavilion above its old top.
  for(const z of [-1.905,1.905]){
    const vertices=[];
    for(let i=0;i<12;i++){
      const a=-2.8+i*5.6/12,b=-2.8+(i+1)*5.6/12;
      vertices.push(a,3.42,z,b,3.42,z,a,okumiyaRoofY(a,z)-.12,z,b,3.42,z,b,okumiyaRoofY(b,z)-.12,z,a,okumiyaRoofY(a,z)-.12,z);
    }
    sheet(vertices,pale);
    ribbon(Array.from({length:13},(_,i)=>{
      const x=-2.95+i*5.9/12;return[x,okumiyaRoofY(x,z)-.18,z+(z>0?.07:-.07)];
    }),.13,.10,'z',red);
    for(const x of layout.frontPostCentres){
      const top=okumiyaRoofY(x,z)-.18;
      box(.14,top-3.38,.14,x,(top+3.38)/2,z+(z>0?.045:-.045),red);
    }
  }

  for(let i=0;i<49;i++){
    const x=-3.58+i*7.16/48,points=okumiyaRafter(x);
    ribbon(points,.055,.065,'x',red);
    const end=points.at(-1);box(.061,.073,.045,end[0],end[1],end[2]+.014,pale);
  }
  for(const side of [-1,1])for(let i=0;i<32;i++){
    const z=-2.70+i*6/31;
    const points=Array.from({length:3},(_,j)=>{
      const x=side<0?-3.87+j*1.05/2:2.82+j*1.05/2;
      return[x,okumiyaRoofY(x,z)-.126,z];
    });
    ribbon(points,.035,.03,'z',pale);
  }
  for(const offset of [-.025,-.13]){
    for(const z of [3.38,-2.82])ribbon(Array.from({length:29},(_,i)=>{
      const x=-3.9+i*7.8/28;return[x,okumiyaRoofY(x,z)+offset,z];
    }),.08,.07,'z',trim);
    for(const x of [-3.87,3.87])ribbon(Array.from({length:33},(_,i)=>{
      const z=-2.82+i*6.2/32;return[x,okumiyaRoofY(x,z)+offset,z];
    }),.08,.07,'x',trim);
  }
  // Broad pale gable fascia and the narrow red lower edge are distinct
  // from the existing dark bark margins in both side photographs.
  for(const side of [-1,1]){
    const points=okumiyaBargeboard(side);
    // Paint bands are thin outward-facing strips, not four-sided solid
    // beams. This avoids adding hidden geometry beneath the existing fascia.
    for(const [offset,height,mat]of [[0,.17,pale],[-.115,.055,red]]){
      const vertices=[];
      for(let i=1;i<points.length;i++){
        const p=points[i-1],q=points[i],x=p[0]+side*.025;
        const a=[x,p[1]+offset+height/2,p[2]],b=[x,p[1]+offset-height/2,p[2]],c=[x,q[1]+offset+height/2,q[2]],d=[x,q[1]+offset-height/2,q[2]];
        for(const v of side>0?[a,c,b,b,c,d]:[a,b,c,b,d,c])vertices.push(...v);
      }
      sheet(vertices,mat);
    }
    // Small gilt round fittings are visible; engraving is deliberately omitted.
    for(const z of [-1.65,layout.ridgeZ,1.15,2.77])part(new THREE.CircleGeometry(.066,12).rotateY(side*Math.PI/2).translate(side*3.94,okumiyaRoofY(side*3.9,z)-.23,z),gold);
  }
  for(const x of layout.frontPostCentres){
    box(.42,.14,.45,x,3.06,2.03,red);box(.58,.13,.36,x,3.22,2.03,red);
    box(.26,.12,.31,x,2.94,2.07,red);box(.40,.08,.26,x,2.85,2.07,red);
    box(.48,.035,.20,x,2.80,2.07,trim);
  }
  for(const x of layout.frontBayCentres)box(1.40,.11,.035,x,3.01,2.155,green);

  // Hexagonal hanging lanterns: light panels, cage, crown and pendant skirt.
  // These are geometry only; no additional light, timer or material map.
  for(const child of [...object.children])if(child.geometry?.type==='SphereGeometry'&&near(child.geometry.parameters.radius,.18)){
    child.removeFromParent();child.geometry.dispose();
  }
  const leaf=new THREE.Shape();leaf.moveTo(0,0);leaf.bezierCurveTo(-.055,.06,-.075,.14,0,.22);leaf.bezierCurveTo(.075,.14,.055,.06,0,0);
  for(const x of layout.frontBayCentres){
    const y=2.66,z=2.55;
    beam([x,3.13,z],[x,okumiyaRoofY(x,z)-.20,z],.014,.014,wood);
    part(new THREE.TorusGeometry(.046,.009,4,10).translate(x,3.09,z),gold);
    part(new THREE.CylinderGeometry(.157,.157,.29,6).translate(x,y,z),pale);
    for(const offset of [-.18,.18])part(new THREE.CylinderGeometry(.19,.19,.045,6).translate(x,y+offset,z),gold);
    for(let i=0;i<6;i++){
      const angle=i*Math.PI/3;
      box(.018,.34,.018,x+Math.sin(angle)*.16,y,z+Math.cos(angle)*.16,gold);
      const crown=new THREE.ExtrudeGeometry(leaf,{depth:.006,bevelEnabled:false,curveSegments:3});
      crown.rotateY(angle);part(crown.translate(x+Math.sin(angle)*.19,y+.20,z+Math.cos(angle)*.19),gold);
      const skirt=new THREE.ExtrudeGeometry(leaf,{depth:.006,bevelEnabled:false,curveSegments:3});
      skirt.rotateZ(Math.PI).rotateY(angle);part(skirt.translate(x+Math.sin(angle)*.20,y-.20,z+Math.cos(angle)*.20),gold);
    }
    part(new THREE.SphereGeometry(.13,10,6).scale(1,.4,1).translate(x,y-.25,z),gold);
  }

  // Restrained silhouette of the white carved bracket seen in IMG_6627.
  // Retain only the visible head, ear, trunk and tusk; no invented engraving.
  const head=new THREE.Shape();head.moveTo(0,-.17);head.lineTo(0,.13);
  head.bezierCurveTo(.06,.22,.14,.20,.18,.12);head.bezierCurveTo(.24,.15,.32,.13,.35,.08);
  head.bezierCurveTo(.41,.04,.49,.05,.54,.03);head.bezierCurveTo(.57,-.01,.54,-.075,.50,-.08);
  head.bezierCurveTo(.47,-.08,.45,-.04,.48,-.025);head.bezierCurveTo(.42,-.015,.39,-.02,.35,-.04);
  head.bezierCurveTo(.29,-.08,.33,-.17,.20,-.17);head.closePath();
  const mouth=new THREE.Shape();mouth.moveTo(.27,.025);mouth.bezierCurveTo(.30,.085,.39,.045,.49,.025);mouth.bezierCurveTo(.44,-.005,.32,-.03,.27,.025);
  const tusk=new THREE.Shape();tusk.moveTo(.29,.005);tusk.quadraticCurveTo(.37,.025,.42,.095);tusk.quadraticCurveTo(.385,.025,.29,-.012);tusk.closePath();
  const mirrorAndPlace=(geo,side,x,y,z)=>{
    if(side<0){
      geo.scale(-1,1,1);
      if(geo.index){const index=geo.index;for(let i=0;i<index.count;i+=3){const swap=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,swap);}}
      else for(const attr of Object.values(geo.attributes))for(let i=0;i<attr.count;i+=3)for(let k=0;k<attr.itemSize;k++){
        const a=(i+1)*attr.itemSize+k,b=(i+2)*attr.itemSize+k,swap=attr.array[a];attr.array[a]=attr.array[b];attr.array[b]=swap;
      }
      geo.computeVertexNormals();
    }
    return geo.translate(x,y,z);
  };
  for(const side of [-1,1]){
    const x=side*2.84,y=2.96,z=1.99;
    part(mirrorAndPlace(new THREE.ExtrudeGeometry(head,{depth:.10,bevelEnabled:false,curveSegments:4}),side,x,y,z),pale);
    for(const dz of [-.002,.102])part(mirrorAndPlace(new THREE.CircleGeometry(1,16).scale(.063,.045,1).translate(.108,.105,0),side,x,y,z+dz),rose);
    part(mirrorAndPlace(new THREE.ShapeGeometry(mouth,4),side,x,y,z+.103),rose);
    part(new THREE.CircleGeometry(.010,8).translate(x+side*.22,y+.075,z+.104),wood);
    part(mirrorAndPlace(new THREE.ExtrudeGeometry(tusk,{depth:.012,bevelEnabled:false,curveSegments:4}),side,x,y,z+.105),gold);
  }

  const counts=[];
  for(const [mat,parts]of batches){
    const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());
    if(!geo)throw Error('Okumiya facade merge failed');
    counts.push({parts:parts.length,vertices:geo.getAttribute('position').count});
    const mesh=new THREE.Mesh(geo,mat);mesh.name='Okumiya photo-backed detail batch';
    mesh.castShadow=true;mesh.receiveShadow=true;object.add(mesh);
  }
  const stats={
    revision:'R69',sources:[
      'https://online.bunka.go.jp/heritages/detail/260092',
      'https://inari.jp/vr/',
      'https://fushimiinari-guide.com/okumiya/',
      'https://fushimiinari-guide.com/wp-content/uploads/IMG_6628_20210309.jpg',
      'https://fushimiinari-guide.com/wp-content/uploads/IMG_6630_20210309.jpg',
      'https://fushimiinari-guide.com/wp-content/uploads/IMG_6970_20210312.jpg',
      'https://fushimiinari-guide.com/wp-content/uploads/IMG_6974_20210312.jpg',
      'https://fushimiinari-guide.com/wp-content/uploads/IMG_6627_20210309.jpg'
    ],estimatedDimensions:true,retainedEnvelope:[7.8,6.2],roofRidgeLocalZ:layout.ridgeZ,
    materialBatches:counts.length,detailTriangles:counts.reduce((n,b)=>n+b.vertices/3,0),batches:counts,
    features:{verandaFloor:layout.verandaFloor,roofRise:layout.roofRise,roofCrestY:crestY,lanterns:3,whiteBracketReliefs:2,latticeCornerReturns:2,estimatedLatticeReturnDepth:.72,paleGableBands:2},
    limits:'Source footprint, stone podium, interactive wall and coarse solid collider retained. Veranda height inferred from photos; decorative veranda is not a new walkable surface. Lantern and carving silhouettes are simplified; fine engraving and painted panels are omitted. Short lattice return depth and fascia band dimensions are photographic estimates. No extra lights or per-frame updates.'
  };
  object.userData.okumiyaDetail=stats;return stats;
}
