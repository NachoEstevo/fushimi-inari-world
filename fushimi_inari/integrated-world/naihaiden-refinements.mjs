import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Source frame matches naihaiden.glb, before geographic mapping. Directly
// inspected 11_naihaiden.jpg establishes curved red/white soffit strips, gold
// floral fittings, carved painted brackets and a sagging rope with folded paper.
// Retain inherited main roof, rear junction, columns, podium and lanterns.
const ropeY=x=>6.77+.58*Math.pow(Math.abs(x)/4.65,3);
const frontY=x=>7.75+.87*Math.pow(Math.max(0,(Math.cos(x/3.036*Math.PI)+1)/2),1.35)*(Math.abs(x)<3.036?1:0)+.348*Math.pow(Math.abs(x)/6.9,2);

// build_fushimi_inari_scene.py creates 33 straight rafters on EACH pitch.
// The four outermost stations at either gable extend above the curved copper
// eave. Match only those 16 bevelled source boxes in their original frame.
export function isNaihaidenExposedRafterTriangle(vertices){
  const stations=[-6.6,-6.1875,-5.775,-5.3625,5.3625,5.775,6.1875,6.6];
  return stations.some(x=>vertices.every(([px,y,z])=>Math.abs(px-x)<.038&&y>=7.589&&y<=8.191&&((z>=-23.953&&z<=-21.982)||(z>=-30.418&&z<=-28.447))));
}

function cutTriangles(mesh,accept){
  const source=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry;
  const p=source.attributes.position,keep=[];let removed=0;
  for(let i=0;i<p.count;i+=3){const vertices=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]);if(accept(vertices))removed++;else keep.push(i,i+1,i+2);}
  if(!removed){if(source!==mesh.geometry)source.dispose();return {removed:0};}
  const geometry=new THREE.BufferGeometry();
  for(const [name,a]of Object.entries(source.attributes)){const array=new a.array.constructor(keep.length*a.itemSize);for(let i=0;i<keep.length;i++)for(let k=0;k<a.itemSize;k++)array[i*a.itemSize+k]=a.array[keep[i]*a.itemSize+k];geometry.setAttribute(name,new THREE.BufferAttribute(array,a.itemSize,a.normalized));}
  if(source!==mesh.geometry)source.dispose();geometry.computeBoundingSphere();return {removed,geometry};
}

export function refineNaihaiden(scene,materials={}){
  if(scene.userData.naihaidenRefinement)return scene.userData.naihaidenRefinement;
  const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const rope=meshes.find(m=>m.material?.name==='MAT_Straw_Shimenawa'),white=meshes.find(m=>m.material?.name==='MAT_White_Shikku_Plaster');
  const roof=meshes.find(m=>m.material?.name==='MAT_Copper_Patina_Green');
  if(!rope||!white||!roof||rope.geometry.attributes.position.count!==68)return null;
  rope.geometry.computeBoundingBox();const rb=rope.geometry.boundingBox;
  if(Math.abs(rb.min.z+23.77)>.002||Math.abs(rb.max.x-3.8)>.002)return null;
  const paper=cutTriangles(white,vertices=>vertices.every(([x,y,z])=>Math.abs(x)<=3.14&&y>=6.12&&y<=6.78&&z>=-23.52&&z<=-23.41));
  if(!paper.removed)return null;
  const goldSource=meshes.find(m=>m.material?.name==='MAT_Gold_Kanagu_Leaf');
  const plaque=goldSource?cutTriangles(goldSource,vertices=>vertices.every(([x,y,z])=>Math.abs(x)<=1.205&&y>=8.605&&y<=9.095&&z>=-22.215&&z<=-21.885)):{removed:0};
  const redSource=meshes.find(m=>m.material?.name==='MAT_Vermilion_ShuIro');
  const exposedRafters=redSource?cutTriangles(redSource,isNaihaidenExposedRafterTriangle):{removed:0};
  // Sixteen bevelled boxes x108 triangles is the complete production signature.
  // A topology change must not partially strip some other structural member.
  if(exposedRafters.removed!==1728){exposedRafters.geometry?.dispose();exposedRafters.geometry=null;exposedRafters.removed=0;}
  const group=new THREE.Group();group.name='Naihaiden photo-backed curved soffit and prayer facade';
  const red=materials.vermilionMat??new THREE.MeshStandardMaterial({color:'#bb3820',roughness:.71});
  const pale=new THREE.MeshStandardMaterial({color:'#e5dfd1',roughness:.95,side:THREE.DoubleSide});
  const straw=new THREE.MeshStandardMaterial({color:'#b6a477',roughness:.98});
  const gold=materials.goldMat??new THREE.MeshStandardMaterial({color:'#bda354',metalness:.65,roughness:.38});
  const green=new THREE.MeshStandardMaterial({color:'#377568',roughness:.87});
  const dark=new THREE.MeshStandardMaterial({color:'#292c29',roughness:.91});
  const pink=new THREE.MeshStandardMaterial({color:'#b17871',roughness:.91});
  const batches=new Map(),part=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!geo.attributes.uv)geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  const tube=(points,r,mat,segments=80)=>part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,4,false),mat);
  // Front eave follows the inherited copper roof height rather than applying
  // another full roof or touching its back junction with Honden.
  for(const [drop,height,mat]of [[.15,.11,dark],[.27,.15,pale],[.44,.16,red],[.55,.045,dark]]){
    const points=[];for(let i=0;i<=100;i++){const x=-6.55+i*13.1/100;points.push([x,frontY(x)-drop,-21.965]);}
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1];part(new THREE.BoxGeometry(Math.hypot(dx,dy)+.007,height,.085).rotateZ(Math.atan2(dy,dx)).translate((a[0]+b[0])/2,(a[1]+b[1])/2,a[2]),mat);
    }
  }
  // Eight receding curved soffit bands provide actual depth below the canopy.
  for(let row=0;row<8;row++){
    const z=-22.12-row*.19,points=[];
    for(let i=0;i<=52;i++){const x=-2.85+i*5.7/52;points.push([x,frontY(x)-.72,z]);}
    tube(points,.045,row%2?pale:red,40);
  }
  // Three-ply, shallow-catenary rope, rising into its end ties. No duplicate
  // straight inherited cylinder remains behind it.
  for(let ply=0;ply<3;ply++){
    const points=[];for(let i=0;i<=140;i++){const x=-4.65+i*9.3/140,a=x*17+ply*Math.PI*2/3;points.push([x,ropeY(x)+Math.sin(a)*.047,-23.38+Math.cos(a)*.047]);}tube(points,.033,straw,220);
  }
  const paperPositions=[];
  for(let i=0;i<11;i++){
    const x=-3.95+i*.79,y=ropeY(x)-.08,z=-23.27;
    // Five alternating folded rectangular legs form each paper lightning strip.
    for(let fold=0;fold<5;fold++){
      const yy=y-fold*.132,xx=x+(fold%2?.07:-.01),zz=z+(fold%2?.018:-.018);
      const corners=[[xx-.055,yy,zz],[xx+.055,yy-.065,zz],[xx+.015,yy-.205,zz-.025],[xx-.095,yy-.14,zz-.025]];
      for(const k of [0,1,2,0,2,3])paperPositions.push(...corners[k]);
    }
  }
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(paperPositions,3));pg.computeVertexNormals();part(pg,pale);
  for(const x of [-4.65,-3.15,-1.58,0,1.58,3.15,4.65]){
    const y=ropeY(x)-.11;
    for(let i=0;i<17;i++){const d=(i-8)*.012;tube([[x+d,y,-23.37],[x+d*1.6,y-.36,-23.35],[x+d*2.0,y-.59,-23.33]],.0035,straw,3);}
  }
  // Five discrete rosettes, gold rafter tips and shallow scrolls reflect the
  // photographed vocabulary. Botanical carving is simplified, not exact art.
  for(const x of [-5.6,-3,0,3,5.6]){
    const y=frontY(x)-.37;
    part(new THREE.CylinderGeometry(.12,.12,.045,20).rotateX(Math.PI/2).translate(x,y,-21.9),gold);
    for(let petal=0;petal<12;petal++){const a=petal*Math.PI/6;part(new THREE.SphereGeometry(.042,6,4).scale(.75,1.8,.35).rotateZ(a).translate(x+Math.sin(a)*.15,y+Math.cos(a)*.15,-21.87),gold);}
    for(const side of [-1,1])tube([[x+side*.16,y-.13,-21.88],[x+side*.34,y-.18,-21.88],[x+side*.39,y-.03,-21.88],[x+side*.27,y+.02,-21.88]],.019,gold,18);
  }
  for(const x of [-4.8,-2.4,0,2.4,4.8]){
    box(.28,.09,.29,x,7.13,-23.65,gold);
    box(.19,.16,.25,x,7.02,-23.64,red);
    for(const side of [-1,1])tube([[x,7.03,-23.45],[x+side*.19,6.94,-23.45],[x+side*.26,7.03,-23.45]],.022,green,14);
  }
  // Coloured gable relief occupies the inherited triangular pediment face;
  // no historic text or emblem is fabricated.
  for(const side of [-1,1])for(let i=0;i<8;i++){
    const x=side*(.38+i*.22),y=7.53+(1-i/8)*.38;
    part(new THREE.SphereGeometry(.11,7,4).scale(1.3,.48,.28).rotateZ(side*(.4+i*.08)).translate(x,y,-23.58),green);
    part(new THREE.SphereGeometry(.055,7,4).scale(1,1,.4).translate(x+side*.08,y+.06,-23.54),pink);
  }
  for(const [mat,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  // Commit only after all replacement batches exist. Preserve the original
  // white mesh identity, with every non-paper triangle byte-for-byte retained.
  white.geometry=paper.geometry;rope.removeFromParent();scene.add(group);
  if(plaque.geometry)goldSource.geometry=plaque.geometry;
  if(exposedRafters.geometry)redSource.geometry=exposedRafters.geometry;
  const report={reference:'references/real_photos/11_naihaiden.jpg; https://fushimiinari-guide.com/how-to-worship-main-shrine/',paperTrianglesRemoved:paper.removed,goldPlaqueTrianglesRemoved:plaque.removed,exposedRafterTrianglesRemoved:exposedRafters.removed,shide:11,tassels:7,ropePlies:3,materialBatches:batches.size,
    provenance:'Photo appearance; inherited source frame and roof envelope. Depths, curve profile, ornament geometry and dimensions inferred; carvings abstracted. Rear Honden connection, main roof and existing lanterns untouched.',bounds:'front detail only x[-6.65,6.65], z[-23.85,-21.8]; existing source footprint retained',collidersAdded:0};
  scene.userData.naihaidenRefinement=report;return report;
}
