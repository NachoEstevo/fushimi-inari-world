import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {northCourtPlantingLayout,ellipseBoundary} from './north-court-planting-layout.mjs';

// Supplied June 2012 planter-context and north-close show an oval-looking low
// stone edge, clipped hedge, supported drooping tree and stone lantern. Species,
// dimensions and precise footprint are unresolved; retain that uncertainty.
export function buildNorthCourtPlanting(root,features,surfaces,materials,colliders){
  const spec=northCourtPlantingLayout(features);if(!spec)return null;
  const [cx,cz]=spec.center,base=surfaces.height(cx,cz),group=new THREE.Group();
  group.name='Observed north-court planted island (estimated bounds)';group.position.set(cx,base,cz);group.userData={...spec,reference:'June 2012 supplied planter-context/north-close; estimated dimensions, unidentified tree species'};
  const stone=materials.entryStoneMat,soil=new THREE.MeshStandardMaterial({color:'#514d39',roughness:1}),bark=new THREE.MeshStandardMaterial({color:'#625b44',roughness:1}),wood=new THREE.MeshStandardMaterial({color:'#8c8064',roughness:.96}),green=new THREE.MeshStandardMaterial({color:'#4b652b',roughness:1,side:THREE.DoubleSide});
  const batches=new Map(),part=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat,yaw=0)=>part(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat);
  const cylinder=(rt,rb,h,x,y,z,mat,n=10)=>part(new THREE.CylinderGeometry(rt,rb,h,n).translate(x,y,z),mat);
  const beam=(a,b,r,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),geo=new THREE.CylinderGeometry(r,r*.92,v.length(),8);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));geo.translate(...av.add(bv).multiplyScalar(.5).toArray());part(geo,mat);};
  const bed=new THREE.CylinderGeometry(1,1,.10,48);bed.scale(spec.radii[0]-.13,1,spec.radii[1]-.13);bed.translate(0,.13,0);part(bed,soil);
  // Separate short granite risers follow the shared ground at every segment.
  for(let i=0;i<48;i++){
    const a=i*Math.PI*2/48,b=(i+1)*Math.PI*2/48,pa=ellipseBoundary(spec,a),pb=ellipseBoundary(spec,b),x=(pa[0]+pb[0])/2,z=(pa[1]+pb[1])/2,ground=surfaces.height(x,z)-base,length=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]),yaw=Math.atan2(-(pb[1]-pa[1]),pb[0]-pa[0]);
    box(length-.012,.21,.16,x-cx,ground+.105,z-cz,stone,yaw);box(length-.008,.045,.21,x-cx,ground+.225,z-cz,stone,yaw);
    colliders.push({type:'box',args:[x,z,length/2,.13,yaw,base+ground,base+ground+.26,'north_court_planter_curb']});
  }
  const hedgeCore=new THREE.MeshStandardMaterial({color:'#52682e',roughness:1});
  for(let i=0;i<48;i++){
    const a=i*Math.PI*2/48,geo=new THREE.IcosahedronGeometry(1,1);
    geo.scale(.35,.20,.30);geo.translate(Math.cos(a)*spec.radii[0]*.81,.40,Math.sin(a)*spec.radii[1]*.81);
    part(geo,hedgeCore);
  }
  green.color.set('#b1bf8e');
  let seed=51029;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const leafMatrices=[],leafColors=[],dummy=new THREE.Object3D();
  const leaf=(x,y,z,scale=1)=>{dummy.position.set(x,y,z);dummy.rotation.set(rand()*2,rand()*6.28,rand()*3);dummy.scale.set(.11*scale,.055*scale,1);dummy.updateMatrix();leafMatrices.push(dummy.matrix.clone());leafColors.push(new THREE.Color().setRGB(.34+rand()*.12,.43+rand()*.15,.12+rand()*.08));};
  // Clipped low hedge ring; foliage cards retain small irregular leaf edges.
  for(let i=0;i<2400;i++){
    const angle=rand()*Math.PI*2,rad=.76+rand()*.14,x=Math.cos(angle)*spec.radii[0]*rad,z=Math.sin(angle)*spec.radii[1]*rad,y=.29+rand()*.36;
    leaf(x,y,z,1.1);
  }
  // Uneven trunk/forks and hanging branchlets reflect the observed silhouette,
  // without claiming a botanical species or filling the court with mature trees.
  beam([.38,.15,.18],[.49,2.65,.05],.13,bark);beam([.49,2.65,.05],[.18,4.48,-.10],.085,bark);
  for(let b=0;b<9;b++){
    const angle=b*Math.PI*2/9+.22,endX=.18+Math.cos(angle)*(1.35+rand()*.55),endZ=-.1+Math.sin(angle)*(1.12+rand()*.42),top=4.0+rand()*.75;
    beam([.32,3.30,.02],[endX*.63,top,endZ*.63],.043,bark);beam([endX*.63,top,endZ*.63],[endX,top-.55,endZ],.025,bark);
    // Leaf-bearing sprays cover the upper limbs as well as hanging tips.
    for(let l=0;l<180;l++){
      const t=.35+rand()*.65;
      leaf(endX*t+(rand()-.5)*.75,top-.55*t+(rand()-.5)*.50,endZ*t+(rand()-.5)*.75,1.05);
    }
    for(let twig=0;twig<4;twig++){
      const tx=endX+(rand()-.5)*.40,tz=endZ+(rand()-.5)*.40,bottom=top-1.15-rand()*.80;
      beam([endX,top-.50,endZ],[tx,bottom,tz],.009,bark);
      for(let l=0;l<22;l++){const t=rand();leaf(endX+(tx-endX)*t+(rand()-.5)*.15,top-.50+(bottom-top+.50)*t,endZ+(tz-endZ)*t+(rand()-.5)*.15,.9);}
    }
  }
  for(const a of [.35,2.45,4.55]){
    const x=.4+Math.cos(a)*1.15,z=.1+Math.sin(a)*.85;beam([x,.20,z],[.48,2.62,.06],.035,wood);
    cylinder(.07,.07,.12,.48,2.60,.06,bark,8);
  }
  // Lantern on the reference-left side, entirely within the planting edge.
  const lx=-1.12,lz=-.25;
  box(.68,.13,.68,lx,.22,lz,stone);cylinder(.24,.31,.22,lx,.39,lz,stone,8);cylinder(.16,.19,.92,lx,.93,lz,stone,8);cylinder(.33,.20,.18,lx,1.48,lz,stone,8);box(.59,.12,.59,lx,1.62,lz,stone);
  for(const x of [-.22,.22])for(const z of [-.22,.22])box(.065,.40,.065,lx+x,1.87,lz+z,stone);
  const cap=new THREE.CylinderGeometry(.07,.49,.22,4);cap.rotateY(Math.PI/4);cap.translate(lx,2.18,lz);part(cap,stone);cylinder(.09,.14,.17,lx,2.36,lz,stone,8);cylinder(.035,.09,.12,lx,2.50,lz,stone,8);
  for(const [mat,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  const leaves=new THREE.InstancedMesh(new THREE.CircleGeometry(.5,6),green,leafMatrices.length);leafMatrices.forEach((m,i)=>{leaves.setMatrixAt(i,m);leaves.setColorAt(i,leafColors[i]);});leaves.receiveShadow=true;leaves.name='Batched low hedge and drooping tree leaves';group.add(leaves);
  root.add(group);return group;
}
