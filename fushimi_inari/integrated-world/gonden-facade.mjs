import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Photographic envelope refinement, not a measured reconstruction. Call before
// moveObject's world transform. The exact legacy signatures limit ownership.
export function refineGondenFacade(object,materials){
 if(!object.isGroup)return false;
 const groups=[];object.traverse(g=>{
  if(!g.isGroup||g.userData.gondenFacadeR65)return;
  const has=(w,h,d)=>g.children.some(m=>{const p=m.geometry?.parameters;return p?.width===w&&p.height===h&&p.depth===d;});
  if(has(6.2,3.1,4.2)&&has(8.4,.75,6.6)&&has(7.4,1.05,.16))groups.push(g);
 });
 for(const group of groups){
  const match=(w,h,d)=>group.children.find(m=>{const p=m.geometry?.parameters;return p?.width===w&&p.height===h&&p.depth===d;});
  const oldRoof=match(8.4,.75,6.6),wall=match(6.2,3.1,4.2);
  const roof=oldRoof.material.clone();roof.color.set('#524b3a');roof.roughness=.97;roof.metalness=0;roof.side=THREE.DoubleSide;
  const timber=new THREE.MeshStandardMaterial({color:'#65412c',roughness:.90});
  const red=materials.vermilionMat,black=materials.blackNemakiMat,gold=materials.goldMat,white=materials.plasterMat;
  // IMG_6572_20210311 explicitly shows the rear's white plaster and five red
  // structural bays. Keep the interaction-bearing wall, not the former brown
  // placeholder finish on every unseen face. Front door panels remain timber.
  wall.material=white;
  for(const dimensions of [[8.4,.75,6.6],[8.6,.28,.46],[7.4,1.05,.16],[7.5,.10,.20],[6.28,.95,4.28]])match(...dimensions)?.removeFromParent();
  const batches=new Map();
  const part=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  const cylinder=(r0,r1,h,x,y,z,mat)=>part(new THREE.CylinderGeometry(r0,r1,h,8).translate(x,y,z),mat);
  // The inherited 8.4 x 6.6m roof plan stays fixed. A short ridge and a long,
  // gently easing front pitch follow both inspected photographs. Rise is inferred.
  const ridgeZ=-.60,ridgeY=5.45;
  const profile=(z)=>{const front=z>=ridgeZ,t=Math.abs(z-ridgeZ)/(front?3.55-ridgeZ:ridgeZ+3.05);return ridgeY-1.64*(1-Math.pow(1-t,2))+.14*Math.pow(t,8);};
  const halfWidth=z=>{const t=Math.abs(z-ridgeZ)/(z>=ridgeZ?3.55-ridgeZ:ridgeZ+3.05);return 3.10+1.10*Math.pow(t,.65);};
  const positions=[],uv=[];
  const strip=(za,zb)=>{
   const a=[-halfWidth(za),profile(za),za],b=[halfWidth(za),profile(za),za],c=[-halfWidth(zb),profile(zb),zb],d=[halfWidth(zb),profile(zb),zb];
   for(const p of [a,c,b,b,c,d]){positions.push(...p);uv.push(p[0]/2,p[2]/2);}
  };
  for(const [start,end]of [[-3.05,ridgeZ],[ridgeZ,3.55]])for(let i=0;i<24;i++)strip(start+(end-start)*i/24,start+(end-start)*(i+1)/24);
  const skin=new THREE.BufferGeometry();skin.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));skin.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));skin.computeVertexNormals();part(skin,roof);
  // Thick dark roof margins, with the same profile rather than detached boxes.
  const fascia=[];
  for(const sign of [-1,1])for(let i=0;i<48;i++){
   const z=-3.05+6.6*i/48,q=-3.05+6.6*(i+1)/48,a=[sign*halfWidth(z),profile(z),z],b=[sign*halfWidth(q),profile(q),q];
   for(const p of [a,[a[0],a[1]-.18,a[2]],b,b,[a[0],a[1]-.18,a[2]],[b[0],b[1]-.18,b[2]]])fascia.push(...p);
  }
  const edge=new THREE.BufferGeometry();edge.setAttribute('position',new THREE.Float32BufferAttribute(fascia,3));edge.setAttribute('uv',new THREE.Float32BufferAttribute(fascia.flatMap((_,i)=>i%3===0?[fascia[i],fascia[i+2]]:[]),2));edge.computeVertexNormals();part(edge,black);
  // Plain structural gable closures avoid open holes above the retained
  // body. They carry no invented carvings or rear facade decoration.
  const gables=[],gableUV=[];
  for(const x of [-3.1,3.1])for(let i=0;i<24;i++){
   const z=-2.1+4.2*i/24,q=-2.1+4.2*(i+1)/24,a=[x,3.77,z],b=[x,profile(z)-.10,z],c=[x,3.77,q],d=[x,profile(q)-.10,q];
   const points=x>0?[a,b,c,c,b,d]:[a,c,b,c,d,b];for(const p of points){gables.push(...p);gableUV.push(p[2],p[1]);}
  }
  const closure=new THREE.BufferGeometry();closure.setAttribute('position',new THREE.Float32BufferAttribute(gables,3));closure.setAttribute('uv',new THREE.Float32BufferAttribute(gableUV,2));closure.computeVertexNormals();part(closure,white);
  for(const z of [-3.05,3.55])box(8.4,.18,.17,0,profile(z)-.08,z,black);
  box(6.38,.24,.24,0,ridgeY+.10,ridgeZ,black);
  for(const x of [-2.05,-1.025,0,1.025,2.05]){const g=new THREE.CylinderGeometry(.052,.052,.025,12).rotateX(Math.PI/2).translate(x,ridgeY+.10,ridgeZ+.135);part(g,gold);}
  // Five bays and six columns are visible in the front photograph. Front is
  // local +Z in the authored group, already oriented by its existing transform.
  for(let i=0;i<6;i++){
   const x=-3.1+i*1.24;box(.14,2.94,.19,x,2.28,2.63,red);
   box(.27,.12,.29,x,3.72,2.63,red);box(.35,.10,.35,x,3.84,2.63,red);
  }
  for(const y of [.80,1.62,3.60])box(6.34,.12,.18,0,y,2.64,red);
  for(let bay=0;bay<5;bay++){
   const x=-2.48+bay*1.24;
   box(1.08,.51,.065,x,1.18,2.77,white);
   for(let k=0;k<=8;k++)box(.027,.52,.035,x-.54+k*.135,1.18,2.818,black);
   for(let k=0;k<=4;k++)box(1.10,.027,.035,x,.925+k*.128,2.82,black);
   box(1.08,1.89,.03,x,2.62,2.125,timber);
   for(let k=0;k<8;k++)box(.025,1.85,.028,x-.49+k*.14,2.62,2.155,red);
   for(const y of [1.85,2.38,2.93,3.43])box(1.06,.027,.03,x,y,2.16,timber);
   for(const y of [1.74,3.49])for(const dx of [-.45,.45])box(.045,.045,.035,x+dx,y,2.18,gold);
   // Small hanging bells are observed; there is no added light or interaction.
   cylinder(.008,.008,.47,x,3.24,2.81,black);
   cylinder(.045,.080,.12,x,2.96,2.81,gold);
   cylinder(.015,.015,.13,x,2.84,2.81,black);
  }
  // Exposed eave rafter ends: repeated pieces are merged by shared material.
  for(let x=-4.02;x<4.1;x+=.18){box(.065,.085,.38,x,3.73,3.40,red);box(.065,.055,.055,x,3.74,3.61,white);}
  for(const x of [-2.0,2.0]){
   cylinder(.008,.008,.28,x,3.50,2.96,black);
   box(.21,.32,.18,x,3.20,2.96,white);
   for(const dx of [-.12,.12])box(.025,.38,.23,x+dx,3.20,2.96,red);
   for(const y of [3.02,3.38])box(.27,.035,.24,x,y,2.96,red);
   box(.35,.06,.31,x,3.44,2.96,black);
  }
  // Photographed rear: six posts define five closed plaster bays. There is no
  // rear door/window in this evidence, so none is reconstructed.
  for(let i=0;i<6;i++)box(.14,2.98,.14,-3.1+i*1.24,2.28,-2.15,red);
  for(const y of [.80,2.79,3.72])box(6.34,.12,.14,0,y,-2.15,red);
  // The opposite gable's plain white/red structural treatment continues the
  // visible rear corner; its finer carvings and openings remain unverified.
  for(const z of [-2.03,0,2.03])box(.10,2.78,.13,-3.16,2.36,z,red);
  for(const y of [1.02,2.79,3.71])box(.10,.13,4.22,-3.16,y,0,red);
  box(.10,profile(-.6)-.30-3.77,.12,-3.16,(profile(-.6)-.30+3.77)/2,-.6,red);
  for(const [a,b]of [[-2.03,-.60],[-.60,2.03]]){const count=Math.ceil((b-a)/.14);for(let i=0;i<count;i++){
   const za=a+(b-a)*i/count,zb=a+(b-a)*(i+1)/count,ya=profile(za)-.30,yb=profile(zb)-.30;
   part(new THREE.BoxGeometry(.10,Math.hypot(zb-za,yb-ya),.11).rotateX(Math.atan2(zb-za,yb-ya)).translate(-3.16,(ya+yb)/2,(za+zb)/2),red);
  }}
  // A low rear balustrade fits the retained 6.8 x 4.8m veranda, not a new
  // footprint. Rounded decorative ends/embossed goldwork are not fabricated.
  for(const y of [1.16,1.60])box(6.60,.075,.075,0,y,-2.36,red);
  for(let i=0;i<=20;i++)box(.055,.52,.065,-3.25+i*6.5/20,1.35,-2.36,red);
  for(const x of [-3.25,3.25])box(.10,.65,.10,x,1.34,-2.36,red);
  for(const [material,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
  group.userData.gondenFacadeR65={references:['Pakutaso81550','Commons Fushimi Inari-taisha Gonden.jpg (2019)','https://fushimiinari-guide.com/wp-content/uploads/IMG_6572_20210311.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_6571_20210311.jpg'],roofPlan:[8.4,6.6],estimatedRidgeHeight:ridgeY,estimatedBayWidth:1.24,frontBays:5,rearBays:5,rearFinish:'Photographed white plaster/vermilion framing and low balustrade',placementAndColliderUnchanged:true,limits:'Photographic proportions; rear spacing fitted to inherited envelope. Opposite gable structural finish inferred from photographed rear corner; carvings, unseen openings and close neighbouring structure not reconstructed'};
 }
 return groups.length>0;
}
