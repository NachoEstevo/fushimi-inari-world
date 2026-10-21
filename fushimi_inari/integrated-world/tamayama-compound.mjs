import * as THREE from 'three';
import {staticParts,shide,stoneLantern} from './mountain-landmarks-geometry.mjs';
import {TAMAYAMA_LAYOUT as L,TAMAYAMA_SOURCES,tamayamaMainRoofHeight,tamayamaKarahafuHeight,tamayamaLocalSolids} from './tamayama-compound-layout.mjs';

const REVISION='R68';
const boxMatches=(object,w,h,d)=>{const p=object.geometry?.parameters;return object.isMesh&&p?.width===w&&p.height===h&&p.depth===d;};
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.93,...extra});

function palette(materials,oldRoof){
  const roof=oldRoof.clone();roof.color.set('#555449');roof.roughness=.98;roof.metalness=0;roof.side=THREE.DoubleSide;
  const stone=(materials.entryStoneMat??materials.stoneMat).clone();stone.color.set('#9d9e92');stone.roughness=.98;
  const paper=materials.plasterMat.clone();paper.color.set('#e8e5d9');paper.side=THREE.DoubleSide;
  const tiles=materials.copperRoofMat.clone();tiles.color.set('#68736d');tiles.metalness=.03;tiles.roughness=.94;tiles.side=THREE.DoubleSide;
  return {roof,stone,paper,tiles,red:materials.vermilionMat,dark:materials.blackNemakiMat,
    wood:material('#3b3028'),green:material('#285345'),straw:material('#b8a476'),gold:materials.goldMat};
}

function curvedStrip(parts,profile,start,end,z,width,depth,mat,segments=40){
  const vertices=[];
  for(let i=0;i<segments;i++){
    const a=start+(end-start)*i/segments,b=start+(end-start)*(i+1)/segments;
    const ya=profile(a),yb=profile(b);
    for(const front of [z-depth/2,z+depth/2]){
      const p=[a,ya,front],q=[a,ya-width,front],r=[b,yb,front],s=[b,yb-width,front];
      for(const point of front<z?[p,r,q,r,s,q]:[p,q,r,r,q,s])vertices.push(...point);
    }
    const a0=[a,ya,z-depth/2],a1=[a,ya,z+depth/2],b0=[b,yb,z-depth/2],b1=[b,yb,z+depth/2];
    vertices.push(...a0,...a1,...b0,...b0,...a1,...b1);
    vertices.push(a,ya-width,z-depth/2,b,yb-width,z-depth/2,a,ya-width,z+depth/2,
      b,yb-width,z-depth/2,b,yb-width,z+depth/2,a,ya-width,z+depth/2);
  }
  parts.sheet(vertices,mat);
}

function roofs(parts,p){
  const {roof,karahafu}=L;
  // Main bark roof follows the original footprint. The separate mapped rear
  // building stays separate: this does not assume it is another sanctuary.
  const vertices=[];
  for(const [a,b]of [[roof.back,roof.ridgeZ],[roof.ridgeZ,roof.front]])for(let j=0;j<24;j++){
    const z0=a+(b-a)*j/24,z1=a+(b-a)*(j+1)/24;
    for(let i=0;i<12;i++){
      const x0=-roof.halfWidth+2*roof.halfWidth*i/12,x1=-roof.halfWidth+2*roof.halfWidth*(i+1)/12;
      for(const [x,z]of [[x0,z0],[x0,z1],[x1,z0],[x1,z0],[x0,z1],[x1,z1]])vertices.push(x,tamayamaMainRoofHeight(z,x),z);
    }
  }
  parts.sheet(vertices,p.roof);
  for(const z of [roof.back,roof.front])curvedStrip(parts,x=>tamayamaMainRoofHeight(z,x),-roof.halfWidth,roof.halfWidth,z,.15,.10,p.wood,24);
  for(const side of [-1,1]){
    const edge=[];
    for(let i=0;i<48;i++){
      const z0=roof.back+(roof.front-roof.back)*i/48,z1=roof.back+(roof.front-roof.back)*(i+1)/48;
      const x=side*roof.halfWidth,y0=tamayamaMainRoofHeight(z0,x),y1=tamayamaMainRoofHeight(z1,x);
      const a=[x,y0,z0],b=[x,y0-.16,z0],c=[x,y1,z1],d=[x,y1-.16,z1];
      for(const point of side<0?[a,b,c,c,b,d]:[a,c,b,c,d,b])edge.push(...point);
    }
    parts.sheet(edge,p.wood);
    // Close the structural gable above each retained wall, leaving no open
    // daylight gap between its top and the new curved roof.
    const closure=[],x=side*1.70;
    for(let i=0;i<32;i++){
      const z0=-1.8+2.8*i/32,z1=-1.8+2.8*(i+1)/32;
      const a=[x,2.8,z0],b=[x,tamayamaMainRoofHeight(z0,x)-.09,z0],c=[x,2.8,z1],d=[x,tamayamaMainRoofHeight(z1,x)-.09,z1];
      for(const point of side>0?[a,b,c,c,b,d]:[a,c,b,c,d,b])closure.push(...point);
    }
    parts.sheet(closure,p.wood);
  }
  parts.box(4.25,.19,.22,0,roof.ridgeY+.11,roof.ridgeZ,p.wood);
  parts.box(4.42,.075,.29,0,roof.ridgeY+.235,roof.ridgeZ,p.dark);
  for(const x of [-1.55,-.78,0,.78,1.55])parts.put(new THREE.CylinderGeometry(.038,.038,.018,10).rotateX(Math.PI/2).translate(x,roof.ridgeY+.12,roof.ridgeZ+.12),p.gold);

  const canopy=[];
  for(let i=0;i<48;i++){
    const x0=-karahafu.halfWidth+i*2*karahafu.halfWidth/48,x1=-karahafu.halfWidth+(i+1)*2*karahafu.halfWidth/48;
    for(const [x,z]of [[x0,karahafu.back],[x0,karahafu.front],[x1,karahafu.back],[x1,karahafu.back],[x0,karahafu.front],[x1,karahafu.front]])canopy.push(x,tamayamaKarahafuHeight(x,z),z);
  }
  parts.sheet(canopy,p.roof);
  // Deep dark fascia and two continuous vermilion sweeps, not individual
  // straight segments floating above or cutting through the roof curve.
  curvedStrip(parts,x=>tamayamaKarahafuHeight(x),-2.4,2.4,2.49,.17,.09,p.dark,48);
  curvedStrip(parts,x=>tamayamaKarahafuHeight(x)-.17,-2.31,2.31,2.455,.17,.12,p.red,48);
  curvedStrip(parts,x=>tamayamaKarahafuHeight(x)-.34,-1.75,1.75,2.40,.055,.085,p.wood,36);
  const tympanum=[];
  for(let i=0;i<32;i++){
    const x0=-1.68+3.36*i/32,x1=-1.68+3.36*(i+1)/32;
    const y0=Math.max(2.96,tamayamaKarahafuHeight(x0)-.39),y1=Math.max(2.96,tamayamaKarahafuHeight(x1)-.39);
    tympanum.push(x0,2.92,2.405,x1,2.92,2.405,x0,y0,2.405,x0,y0,2.405,x1,2.92,2.405,x1,y1,2.405);
  }
  parts.sheet(tympanum,p.paper);
  for(const offset of [.445,.535])curvedStrip(parts,x=>Math.max(2.94,tamayamaKarahafuHeight(x)-offset),-1.56,1.56,2.425,.035,.025,p.red,32);
  for(let i=0;i<25;i++){
    const x=-2.24+4.48*i/24;
    const geo=new THREE.BoxGeometry(.055,.065,1.46).rotateX(Math.atan(.10));
    geo.translate(x,tamayamaKarahafuHeight(x,1.77)-.22,1.77);parts.put(geo,p.red);
    // The pale rafter ends sit underneath/behind the curved front fascia;
    // they must not read as white dots painted across its vermilion face.
    parts.box(.055,.045,.035,x,tamayamaKarahafuHeight(x)-.24,2.355,p.paper);
  }
  // Plain ridge cap and restrained joinery. Carved animals, crests and donor
  // inscriptions are intentionally not invented from indistinct pixels.
  parts.box(.58,.075,.94,0,tamayamaKarahafuHeight(0)+.05,2.12,p.tiles);
  for(const x of [-1.54,0,1.54])parts.put(new THREE.CylinderGeometry(.044,.044,.018,12).rotateX(Math.PI/2).translate(x,tamayamaKarahafuHeight(x)-.255,2.535),p.gold);
}

function clippedDiagonal(parts,x0,y0,x1,y1,z,width,mat){
  const dx=x1-x0,dy=y1-y0,length=Math.hypot(dx,dy);
  if(length<.005)return;
  parts.put(new THREE.BoxGeometry(width,length,.024).rotateZ(-Math.atan2(dx,dy)).translate((x0+x1)/2,(y0+y1)/2,z),mat);
}

function facade(parts,p){
  const {porch}=L;
  // Photographed closed sanctuary front: green diamond lattice over square
  // black/white lower panels, framed by pale narrow end strips.
  parts.box(2.73,.80,.025,0,.91,1.018,p.paper);
  for(let i=0;i<=25;i++)parts.box(.043,.83,.033,-1.365+2.73*i/25,.91,1.043,p.dark);
  for(let i=0;i<=7;i++)parts.box(2.77,.043,.035,0,.51+.80*i/7,1.044,p.dark);
  parts.box(2.67,.77,.024,0,1.73,1.018,p.dark);
  const left=-1.29,right=1.29,bottom=1.385,top=2.075;
  for(const slope of [-1,1])for(let offset=-3;offset<4;offset+=.20){
    const points=[];
    for(const x of [left,right]){const y=slope*x+offset;if(y>=bottom&&y<=top)points.push([x,y]);}
    for(const y of [bottom,top]){const x=(y-offset)/slope;if(x>left&&x<right)points.push([x,y]);}
    if(points.length===2)clippedDiagonal(parts,...points[0],...points[1],1.05,.026,p.green);
  }
  for(const x of [-1.37,1.37])parts.box(.075,.83,.05,x,1.73,1.055,p.green);
  for(const y of [1.335,2.125])parts.box(2.81,.065,.06,0,y,1.058,p.green);
  for(const x of [-1.53,1.53])parts.box(.14,.82,.03,x,1.73,1.035,p.paper);
  for(const x of [-1.7,1.7])parts.box(.115,2.59,.12,x,1.515,1.04,p.red);
  for(const y of [.30,2.33,2.71])parts.box(3.43,.12,.13,0,y,1.08,p.wood);
  // Narrow dark upper transom: no extra curtain or invented interior display.
  for(const x of [-1.36,-.68,0,.68,1.36])parts.box(.055,.44,.06,x,2.43,1.085,p.wood);

  for(const side of [-1,1]){
    const x=side*porch.postX;
    parts.box(.31,.13,.31,x,.285,porch.postZ,p.stone);
    parts.box(porch.postWidth,porch.postTop-.30,porch.postWidth,x,(porch.postTop+.30)/2,porch.postZ,p.red);
    parts.box(.40,.12,.38,x,2.71,porch.postZ,p.red);
    parts.box(.50,.11,.35,x,2.85,porch.postZ,p.red);
    parts.box(.37,.07,.48,x,2.97,porch.postZ,p.red);
    parts.box(.10,.12,1.30,x,2.88,1.60,p.red);
  }
  parts.box(3.40,.16,.25,0,2.85,porch.postZ,p.red);
  curvedStrip(parts,x=>3.035+.065*(1-(x/1.36)**2),-1.36,1.36,2.435,.08,.028,p.green,20);
  // Existing calligraphy/map remains the authored asset; do not recreate text.
  for(const x of [-.205,.205])parts.box(.024,.735,.035,x,3.08,2.59,p.gold);
  for(const y of [2.71,3.45])parts.box(.435,.025,.035,0,y,2.59,p.gold);

  const ropeZ=2.13,ropeY=x=>2.68-.09*(1-(x/1.47)**2);
  for(let i=0;i<20;i++){
    const a=-1.47+2.94*i/20,b=-1.47+2.94*(i+1)/20;
    parts.beam([a,ropeY(a),ropeZ],[b,ropeY(b),ropeZ],.035,p.straw,.035,7);
  }
  for(const x of [-.68,.68]){
    // Both photographs show a paired folded-paper cluster on each side of
    // the plaque. Mirror the second existing shide template to leave the
    // characteristic diamond gaps, without an alpha card or extra material.
    const mirrored={sheet:(vertices,mat)=>parts.sheet(vertices.map((value,index)=>index%3===0?2*x-value:value),mat)};
    shide(parts,x-.105,2.60,ropeZ+.05,.75,p.paper);
    shide(mirrored,x-.105,2.60,ropeZ+.05,.75,p.paper);
  }
  for(const x of [-1.15,-.38,.38,1.15]){
    parts.beam([x,ropeY(x)-.02,ropeZ],[x,2.16,ropeZ+.025],.025,p.straw,.012,7);
    for(const offset of [-.055,0,.055])parts.beam([x,2.49,ropeZ],[x+offset,2.16,ropeZ+.025],.009,p.straw,.005,5);
  }
  // The current 2025 reference has a dark offering box. Its shallow volume
  // stays against the closed gate, leaving the mapped public endpoint clear.
  const o=L.offering;
  parts.box(o.width,o.height,o.depth,...o.center,p.wood);
  parts.box(1.00,.055,.28,0,1.015,1.08,p.dark);
  for(const x of [-.36,.36])parts.box(.065,.15,.20,x,.295,1.08,p.wood);
  for(const x of [-.22,-.11,0,.11,.22])parts.box(.024,.008,.20,x,1.046,1.08,p.wood);
  parts.put(new THREE.CylinderGeometry(.043,.043,.014,12).rotateX(Math.PI/2).translate(0,.66,1.205),p.gold);
}

function fences(parts,p){
  const f=L.fence;
  for(const side of [-1,1]){
    const cx=side*f.centerX;
    for(const y of [.33,1.40])parts.box(f.width,.12,.17,cx,y,f.z,p.red);
    for(let i=0;i<12;i++){
      const x=cx-f.width/2+.10+(f.width-.20)*i/11;
      parts.box(.083,1.17,.11,x,.94,f.z,p.red);
    }
    for(const x of [cx-f.width/2,cx+f.width/2]){
      parts.box(.15,1.40,.16,x,.92,f.z,p.red);
      parts.box(.23,.12,.24,x,.28,f.z,p.stone);
    }
    parts.box(f.width+.08,.11,.25,cx,1.58,f.z,p.wood);
    // Low tiled gabled cap, grey in both inspected photographs. The fence
    // sits 0.40 m forward of the body origin to clear mapped shrine 1268143670.
    const half=f.width/2+.12,z0=f.z-.21,z1=f.z+.21,ridge=1.80,eave=1.65;
    parts.sheet([cx-half,eave,z0,cx-half,ridge,f.z,cx+half,eave,z0,cx+half,eave,z0,cx-half,ridge,f.z,cx+half,ridge,f.z,
      cx-half,ridge,f.z,cx-half,eave,z1,cx+half,ridge,f.z,cx+half,ridge,f.z,cx-half,eave,z1,cx+half,eave,z1],p.tiles);
    for(const z of [z0,z1])parts.box(2*half,.07,.065,cx,eave,z,p.tiles);
    parts.box(2*half,.07,.09,cx,ridge,f.z,p.tiles);
    for(let i=0;i<14;i++){
      const x=cx-half+2*half*i/13;
      for(const sign of [-1,1])parts.beam([x,ridge+.015,f.z],[x,eave+.015,f.z+sign*.21],.012,p.tiles,.012,6);
    }
  }
}

function lanterns(parts,p){
  for(const [x,z,seat,scale]of L.stoneLanterns){
    // Reuse the existing stone-lantern form through a transform adapter. All
    // four photographed lanterns remain static material batches.
    const transform=geometry=>geometry.scale(scale,scale,scale).translate(x,seat,z);
    const scaled={
      box:(w,h,d,u,y,v,mat)=>parts.put(transform(new THREE.BoxGeometry(w,h,d).translate(u,y,v)),mat),
      put:(geometry,mat)=>parts.put(transform(geometry),mat),
      sheet:(vertices,mat)=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));return parts.put(transform(geometry),mat);},
      beam:(a,b,r,mat,top=r)=>{
        const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);
        const geometry=new THREE.CylinderGeometry(top,r,delta.length(),8).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())).translate(...av.add(bv).multiplyScalar(.5).toArray());
        return parts.put(transform(geometry),mat);
      }
    };
    stoneLantern(scaled,0,0,0,{stone:p.stone,shaded:p.stone,dark:p.dark});
  }
  for(const [x,z]of L.timberLanterns){
    parts.box(.68,.16,.68,x,.08,z,p.stone);parts.box(.53,.14,.53,x,.23,z,p.stone);
    parts.box(.26,2.34,.26,x,1.47,z,p.red);
    for(const y of [.73,2.38])parts.box(.29,.05,.29,x,y,z,p.red);
    parts.box(.88,.12,.85,x,2.62,z,p.red);parts.box(.68,.10,.65,x,2.74,z,p.red);
    parts.box(.63,.64,.57,x,3.07,z,p.paper);
    for(const dx of [-.36,.36])parts.box(.10,.82,.65,x+dx,3.10,z,p.red);
    for(const dy of [2.74,3.43])parts.box(.79,.095,.68,x,dy,z,p.red);
    for(const face of [-1,1]){
      for(const dx of [-.20,0,.20])parts.box(.025,.60,.028,x+dx,3.08,z+face*.294,p.green);
      for(const y of [2.88,3.08,3.28])parts.box(.60,.025,.029,x,y,z+face*.295,p.green);
    }
    const roof=[];
    for(const side of [-1,1]){
      const a=[x,3.70,z-.45],b=[x,3.70,z+.45],c=[x+side*.57,3.43,z-.45],d=[x+side*.57,3.43,z+.45];
      roof.push(...a,...b,...c,...c,...b,...d);
      parts.beam([x,3.69,z+side*.46],[x-.56,3.43,z+side*.46],.035,p.wood,.035,6);
      parts.beam([x,3.69,z+side*.46],[x+.56,3.43,z+side*.46],.035,p.wood,.035,6);
    }
    parts.sheet(roof,p.tiles);
    parts.box(.075,.08,.98,x,3.73,z,p.tiles);
    for(const dx of [-.36,.36])parts.box(.085,.08,.04,x+dx,3.37,z+.355,p.gold);
  }
}

/** Before geographic relocation. Exact legacy signature; never match neighbours. */
export function refineTamayama(object,materials){
  if(!object.isGroup||object.userData.zone!=='tamayama')return null;
  if(object.userData.tamayamaDetail)return object.userData.tamayamaDetail;
  const find=(w,h,d)=>object.children.find(child=>boxMatches(child,w,h,d));
  const body=find(3.4,2.6,2.8),apron=find(5.6,.22,4.8),oldRoof=find(4.8,.58,4.4),plaque=find(.52,.92,.10);
  const lattice=find(3.46,1.15,2.86),frontRoof=find(2.4,.45,1.2);
  const wings=object.children.filter(child=>boxMatches(child,2.4,1.35,.18)||boxMatches(child,2.55,.18,.42));
  if(!body||!apron||!oldRoof||!plaque||!lattice||!frontRoof||wings.length!==4)return null;

  const p=palette(materials,oldRoof.material),detail=new THREE.Group();detail.name='Tamayama photographed compound detail';
  const parts=staticParts(detail);
  roofs(parts,p);facade(parts,p);fences(parts,p);lanterns(parts,p);
  const statistics=parts.flush();
  // Commit only after construction succeeds. Keep the selectable body and its
  // callback, original paving material, and authored plaque texture intact.
  object.rotation.y=-.06;
  body.material=p.wood;
  plaque.position.set(0,3.08,2.535);plaque.scale.set(.78,.78,1);
  // The old apron reached inside mapped neighbour 1268143670 after correct
  // orientation. The photographed platform is between the lanterns. Retain
  // the same floor mesh/material and top datum while reducing only its width.
  const oldApronGeometry=apron.geometry;
  apron.geometry=new THREE.BoxGeometry(L.apron.width,L.apron.height,L.apron.depth);
  const uv=apron.geometry.attributes.uv,position=apron.geometry.attributes.position,normal=apron.geometry.attributes.normal;
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    if(Math.abs(normal.getY(i))>.5)uv.setXY(i,x/1.6,z/1.6);
    else if(Math.abs(normal.getX(i))>.5)uv.setXY(i,z/1.6,y/1.6);
    else uv.setXY(i,x/1.6,y/1.6);
  }
  oldApronGeometry.dispose();
  for(const child of [oldRoof,lattice,frontRoof,...wings]){object.remove(child);child.geometry.dispose();}
  object.add(detail);
  const record={revision:REVISION,id:L.id,references:[...TAMAYAMA_SOURCES],estimatedDimensions:true,
    retained:['interactive body','authored plaque texture','apron material and height'],
    facadeDirection:'west',roofPlan:[4.8,4.4],apronPlan:[L.apron.width,L.apron.depth],stoneLanterns:4,timberLanterns:2,
    materialBatches:statistics.batches,primitives:statistics.primitives,triangles:statistics.triangles,
    localSolids:tamayamaLocalSolids(),builtIds:[],
    limits:'Photographic proportions, not a survey; adjacent rear building and unseen carvings left unaltered.'};
  object.userData.tamayamaDetail=record;
  return record;
}

/**
 * After geographic relocation AND legacy collider mapping, before floor
 * extraction. Render and collision use the exact same group matrix. Returned
 * records are JSON-safe; no additional public floor is introduced here.
 */
export function buildTamayamaCompound(root,features,surfaces,materials,colliders){
  let group=null;
  root.traverse(object=>{if(object.isGroup&&object.userData.zone==='tamayama'&&object.userData.tamayamaDetail)group=object;});
  if(!group)return {revision:REVISION,adapted:false,builtIds:[]};
  if(group.userData.tamayamaColliderDetail)return group.userData.tamayamaColliderDetail;
  group.updateWorldMatrix(true,false);
  const m=group.matrixWorld,e=m.elements;
  const scaleX=Math.hypot(e[0],e[1],e[2]),scaleY=Math.hypot(e[4],e[5],e[6]),scaleZ=Math.hypot(e[8],e[9],e[10]);
  if(![...e].every(Number.isFinite)||Math.abs(e[1])+Math.abs(e[4])+Math.abs(e[6])+Math.abs(e[9])>1e-6||Math.abs(e[0]*e[8]+e[2]*e[10])>1e-6)
    throw Error('Tamayama collision requires a finite upright rigid transform');
  const yaw=Math.atan2(e[8],e[10]);
  const records=group.userData.tamayamaDetail.localSolids.map(solid=>{
    const p=new THREE.Vector3(solid.center[0],0,solid.center[1]).applyMatrix4(m);
    return {type:'box',args:[p.x,p.z,solid.half[0]*scaleX,solid.half[1]*scaleZ,yaw,p.y+solid.bottom*scaleY,p.y+solid.top*scaleY,`tamayama_compound_${solid.id}`]};
  });
  let replaced=0;
  for(let i=colliders.length-1;i>=0;i--)if(colliders[i].args.at(-1)==='tamayama_inari'){colliders.splice(i,1);replaced++;}
  colliders.push(...records);
  const record={revision:REVISION,adapted:true,builtIds:[],replacedLegacyColliders:replaced,registeredColliders:records.length,
    bodyCenter:new THREE.Vector3(0,0,-.4).applyMatrix4(m).toArray(),yaw,
    materialBatches:group.userData.tamayamaDetail.materialBatches,triangles:group.userData.tamayamaDetail.triangles,
    ground:'retained apron and existing mapped paths',sources:[...TAMAYAMA_SOURCES]};
  group.userData.tamayamaColliderDetail=record;return record;
}
