import * as THREE from 'three';
import {stonePalette,staticParts,shide,simpleOfferingTorii} from './mountain-landmarks-geometry.mjs';

const near=(a,b)=>Math.abs(a-b)<.001;
const at=(object,x,y,z)=>near(object.position.x,x)&&near(object.position.y,y)&&near(object.position.z,z);
const boxIs=(object,w,h,d)=>{
  const p=object.geometry?.parameters;
  return object.isMesh&&object.geometry.type==='BoxGeometry'&&p&&near(p.width,w)&&near(p.height,h)&&near(p.depth,d);
};

function openTimberFrame(body,palette){
  const temporary=new THREE.Group(),parts=staticParts(temporary),{wood}=palette;
  const front=-3.79,back=-7.77;
  for(const x of [front,back])for(const z of [-2.48,2.48])parts.box(.20,2.58,.20,x,2.01,z,wood);
  parts.box(.16,2.52,5.10,back,1.98,0,wood);
  for(const z of [-2.46,2.46]){
    parts.box(4.12,.18,.19,-5.8,3.22,z,wood);
    parts.box(4.02,.78,.14,-5.8,1.11,z,wood);
    parts.box(4.06,.09,.19,-5.8,1.52,z,wood);
  }
  for(const x of [front,back]){
    parts.box(.21,.20,5.22,x,3.22,0,wood);
    parts.box(.13,.13,5.06,x-.025,2.94,0,wood);
  }
  // Visible boards and small joints remain within the original protected
  // pavilion footprint. The photograph does not establish a public interior.
  for(let z=-2.36;z<2.4;z+=.19)parts.box(.014,2.37,.012,back+.087,1.96,z,wood);
  for(const z of [-2.30,2.30])parts.beam([front,2.70,z],[front,3.14,z-Math.sign(z)*.48],.045,wood);
  const stats=parts.flush(),geometry=temporary.children[0].geometry;
  geometry.translate(-body.position.x,-body.position.y,-body.position.z);
  const selectionGeometry=body.geometry,originalRaycast=body.raycast;
  body.geometry=geometry;body.material=wood;body.castShadow=body.receiveShadow=true;
  // Retain the original interactive object, callbacks and pick envelope while
  // drawing an open frame. The proxy is used only for picking, never rendered.
  // Its coarse collision volume also remains exactly as the legacy authored it.
  body.raycast=function(raycaster,intersections){
    const visual=this.geometry;this.geometry=selectionGeometry;
    try{return originalRaycast.call(this,raycaster,intersections);}
    finally{this.geometry=visual;}
  };
  return stats;
}

function pitchedRoof(parts,palette){
  const {roof,wood,dark}=palette,xBack=-8.8,xFront=-2.8,half=3.4,eave=3.35,ridge=4.55;
  const roofY=z=>{const t=Math.abs(z)/half;return eave+(ridge-eave)*(1-t)+.08*t*t*t*t;};
  const fascia=(a,b)=>{
    const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);
    const geometry=new THREE.BoxGeometry(.078,delta.length()+.008,.085);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
    parts.put(geometry.translate(...p.add(q).multiplyScalar(.5).toArray()),wood);
  };
  const seam=(x,a,b)=>{
    // Three narrow faces per standing seam; a sub-centimetre cylinder would
    // spend most of this sector's triangles on an almost invisible profile.
    const lowA=roofY(a)+.005,lowB=roofY(b)+.005,highA=lowA+.018,highB=lowB+.018,w=.009;
    parts.sheet([x-w,highA,a,x+w,highA,a,x-w,highB,b,x-w,highB,b,x+w,highA,a,x+w,highB,b],roof);
    for(const dx of [-w,w])parts.sheet([x+dx,lowA,a,x+dx,highA,a,x+dx,lowB,b,
      x+dx,lowB,b,x+dx,highA,a,x+dx,highB,b],roof);
  };
  for(const side of [-1,1]){
    for(let i=0;i<10;i++){
      const a=side*half*i/10,b=side*half*(i+1)/10;
      parts.sheet([xBack,roofY(a),a,xFront,roofY(a),a,xBack,roofY(b),b,
        xBack,roofY(b),b,xFront,roofY(a),a,xFront,roofY(b),b],roof);
    }
    parts.box(xFront-xBack+.04,.14,.11,(xBack+xFront)/2,roofY(side*half)-.03,side*half,wood);
    for(const x of [xFront+.012,xBack-.012])for(let i=0;i<10;i++){
      const a=side*half*i/10,b=side*half*(i+1)/10;
      fascia([x,roofY(a),a],[x,roofY(b),b]);
    }
    // Narrow standing seams articulate metal sheets without another texture.
    for(let x=xBack+.23;x<xFront-.1;x+=.48)for(let i=0;i<5;i++){
      const a=side*half*i/5,b=side*half*(i+1)/5;
      seam(x,a,b);
    }
  }
  parts.box(6.20,.115,.18,-5.8,ridge+.045,0,roof);
  const x=xFront-.09;
  parts.sheet([x,eave,-3.27,x,ridge-.09,0,x,eave,3.27],wood);
  parts.box(.12,.17,6.55,x,eave+.015,0,wood);
  for(let z=-2.8;z<=2.8;z+=.32){
    const top=roofY(z)-.12,h=Math.max(.04,top-eave);
    parts.box(.017,h,.013,x+.065,eave+h/2,z,dark);
  }
}

function ropeAndFringe(parts,palette){
  const {straw,paper,red,dark,metal}=palette,x=-3.20,start=-2.62,end=2.62;
  const y=z=>3.28-.10*(1-(z/2.62)**2);
  for(let i=0;i<26;i++){
    const a=start+(end-start)*i/26,b=start+(end-start)*(i+1)/26;
    parts.beam([x,y(a),a],[x,y(b),b],.078,straw);
  }
  // Dense, uneven straw fringe is a major photographed feature. Two-segment
  // strips share one opaque, double-sided material and one static batch.
  for(let i=0;i<176;i++){
    const z=start+(end-start)*(i+.5)/176,seed=Math.sin((i+1)*127.1)*43758.5453,r=seed-Math.floor(seed);
    const root=y(z)-.04,length=.36+.48*r+.13*Math.cos(z*2.8),w=.007+.007*r;
    const bend=(r-.5)*.08,points=[[x+.015,root,z],[x+.045,root-length*.48,z+bend*.4],[x+.025,root-length,z+bend]];
    for(let j=1;j<points.length;j++){
      const a=points[j-1],b=points[j];
      parts.sheet([a[0],a[1],a[2]-w,a[0],a[1],a[2]+w,b[0],b[1],b[2]-w,
        b[0],b[1],b[2]-w,a[0],a[1],a[2]+w,b[0],b[1],b[2]+w],straw);
    }
  }
  for(const z of [-2.15,-.81,.65,1.95])shide(parts,x+.10,y(z)-.08,z,.62,paper,'x');
  const ropeX=-3.07,ropeZ=-.76;
  parts.put(new THREE.SphereGeometry(.125,12,8).scale(1,.9,1).translate(ropeX,3.01,ropeZ),metal);
  // The photo shows a bundle of long coloured cloth strips, not a uniformly
  // coloured cylinder. Folded ribbons add this silhouette without alpha maps.
  for(const [ribbon,material]of [straw,paper,red,straw,dark,paper,red].entries()){
    const dz=(ribbon-3)*.027;
    for(let i=0;i<14;i++){
      const point=j=>[ropeX+.022*Math.sin(j*.55+ribbon),2.90-j*.145,ropeZ+dz+.012*Math.sin(j*.48+ribbon)];
      const a=point(i),b=point(i+1),w=.017;
      parts.sheet([a[0],a[1],a[2]-w,a[0],a[1],a[2]+w,b[0],b[1],b[2]-w,
        b[0],b[1],b[2]-w,a[0],a[1],a[2]+w,b[0],b[1],b[2]+w],material);
    }
  }
  parts.box(.08,.12,.24,ropeX,.82,ropeZ,straw);
}

function interiorOfferings(parts,palette){
  const {shaded,stone,dark,red,wood}=palette;
  parts.box(1.27,.50,2.05,-6.74,.97,0,shaded);
  parts.box(1.40,.13,2.21,-6.74,1.285,0,stone);
  parts.box(.28,1.14,.80,-7.16,1.92,0,shaded);
  parts.put(new THREE.CylinderGeometry(.40,.40,.28,12,1,false,0,Math.PI)
    .rotateZ(Math.PI/2).rotateX(Math.PI/2).translate(-7.16,2.49,0),shaded);
  for(const z of [-.57,.57]){
    const temporary=new THREE.Group(),p=staticParts(temporary);
    simpleOfferingTorii(p,0,0,0,1.13,red,dark);p.flush();
    for(const mesh of temporary.children){
      mesh.geometry.rotateY(Math.PI/2).translate(-6.04,1.35,z);
      parts.put(mesh.geometry,mesh.material);
    }
  }
  parts.box(.52,.32,1.53,-5.90,1.10,0,wood);
  for(let z=-.64;z<.7;z+=.13)parts.box(.48,.027,.038,-5.9,1.274,z,dark);
}

/**
 * Refine the captured Kumataka group BEFORE integration's rigid relocation.
 * Existing water, bank, platform, candles, steles, interactions and colliders
 * remain the same objects. Dimensions reuse the source pavilion envelope;
 * roof pitch, straw, joinery and altar fittings are photographic estimates.
 */
export function refineKumatakasha(object,materials){
  if(object.userData?.zone!=='kumataka'||!object.isGroup)return null;
  if(object.userData.kumatakaRefinement)return object.userData.kumatakaRefinement;
  const body=object.children.find(c=>boxIs(c,4.2,2.9,5.2)&&at(c,-5.8,1.85,0)&&c.userData.interactable);
  const roof=object.children.find(c=>boxIs(c,6,.62,6.8)&&at(c,-5.8,3.45,0));
  const curtain=object.children.find(c=>c.geometry?.type==='PlaneGeometry'&&near(c.geometry.parameters.width,4.4)&&
    near(c.geometry.parameters.height,1.10)&&at(c,-3.62,2.55,0));
  const plaque=object.children.find(c=>boxIs(c,.10,.85,.45)&&at(c,-3.45,3.18,0));
  // Avoid partially changing an unrelated/future source structure.
  if(!body||!roof||!curtain||!plaque)return null;
  const palette=stonePalette(materials);
  palette.wood.color.set('#494536');palette.shaded.color.set('#565c50');
  palette.roof.dispose();palette.roof=(materials.copperRoofMat??materials.roofMat??palette.wood).clone();
  palette.roof.color.set('#92846c');palette.roof.roughness=.81;palette.roof.metalness=.22;palette.roof.side=THREE.DoubleSide;
  const frameStats=openTimberFrame(body,palette);
  roof.removeFromParent();roof.geometry.dispose();curtain.removeFromParent();curtain.geometry.dispose();
  const details=new THREE.Group();details.name='Kumataka photographed timber pavilion and straw fringe';
  const parts=staticParts(details);
  pitchedRoof(parts,palette);ropeAndFringe(parts,palette);interiorOfferings(parts,palette);
  const detailsStats=parts.flush();object.add(details);
  // The official image shows a vertical plaque suspended over the rope.
  // Preserve the existing vertical calligraphy texture, material and object.
  plaque.geometry.dispose();plaque.geometry=new THREE.BoxGeometry(.10,1.22,.67);plaque.position.set(-2.735,3.77,0);
  const stats={batches:frameStats.batches+detailsStats.batches,primitives:frameStats.primitives+detailsStats.primitives,
    triangles:frameStats.triangles+detailsStats.triangles,removedMeshes:2,preservedInteraction:true,
    addedColliders:0,source:'https://inari.jp/en/map/spot_09/',
    photo:'https://inari.jp/en/wp-content/uploads/2016/09/kumatakasya.jpg',
    provenance:'Facade materials, open timber structure, pitched roof, vertical plaque and straw fringe observed in the official photo. Dimensions and internal fittings estimated within the existing pavilion footprint; shoreline not re-surveyed.'};
  object.userData.kumatakaRefinement=stats;return stats;
}
