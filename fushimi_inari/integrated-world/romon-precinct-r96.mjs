import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {romonWingDimensions as D,romonWingLayout} from './romon-wings-layout.mjs';

// Source-frame architecture, not ground dressing. IMG6485/6487/6491 show
// open framed galleries, transverse brackets, stone shoes and decorated ends.
// Sizes inherit R71's envelope and are photo-inferred, never surveyed.
export function refineRomonPrecinctR96(scene,materials={}){
 if(scene.userData.romonPrecinctR96)return scene.userData.romonPrecinctR96;
 if(!scene.userData.romonWingDetail?.reconstructed)return {built:false,reason:'R71 reconstructed galleries required'};
 const wing=scene.getObjectByName('Romon Kairo facade refinement');
 if(!wing)return {built:false,reason:'R71 gallery geometry missing'};
 const find=pattern=>{let mat;scene.traverse(o=>{if(o.isMesh&&pattern.test(o.material?.name??''))mat=o.material;});return mat;};
 const red=materials.vermilionMat??find(/Vermilion_ShuIro/),gold=materials.goldMat??find(/Gold_Kanagu/),stone=materials.stoneMat??find(/Granite/);
 if(!red||!gold||!stone)return {built:false,reason:'Romon structural materials required'};
 const batches=new Map(),part=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);};
 const box=(w,h,d,x,y,z,m)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
 const beam=(a,b,w,d,m)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),g=new THREE.BoxGeometry(w,delta.length(),d);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));part(g.translate(...av.add(bv).multiplyScalar(.5).toArray()),m);};
 const rosette=(x,y,z,axis)=>{const g=new THREE.CylinderGeometry(.061,.061,.022,6);g.rotateX(Math.PI/2);if(axis==='x')g.rotateY(Math.PI/2);part(g.translate(x,y,z),gold);};
 let brackets=0,shoes=0,rosettes=0;
 for(const layout of romonWingLayout()){
  for(const x of layout.posts){
   // Two longitudinal ranks of columns sit on individual broad stone shoes.
   // Entire footprint remains inside the already closed gallery envelope.
   for(const z of [D.wallZ,D.courtColumnZ]){
    box(.36,.09,.36,x,D.floor+.045,z,stone);shoes++;
    box(.33,.13,.29,x,4.99,z,red);
   }
   // A visible open triangular brace, not another opaque plaster screen.
   // Two braces per transverse frame support the existing tie at y5.20.
   for(const z of [D.wallZ,D.courtColumnZ]){
    const direction=z>0?-1:1;
    beam([x,4.68,z],[x,5.13,z+direction*.77],.11,.13,red);
    box(.29,.13,.39,x,5.10,z+direction*.20,red);brackets++;
   }
  }
  // Gold hexagonal joint plates visible on the outer window wall, facing
  // the open arcade. R71's tiny circular nail heads remain untouched.
  for(const x of layout.posts)for(const y of [2.84,4.69]){rosette(x,y,D.wallZ-.109,'z');rosettes++;}
  // IMG6491 end screen has four gold framing junctions and a gilded
  // triangular verge surrounding white plaster. Keep the aperture open.
  const outer=layout.side*19.115;
  for(const z of [-1.80,1.80])for(const y of [2.84,4.69]){rosette(layout.side*19.009,y,z,'x');rosettes++;}
  // Gold edge ribbons lie against R71's existing red end-gable struts.
  // Narrow strips and discrete floral bosses approximate the broad gold
  // field; no invented historical animal/carving relief is supplied.
  for(const z of [-1.8,1.8])beam([outer,5.43,z],[outer,7.26,0],.047,.065,gold);
  for(const z of [-1.48,-.96,0,.96,1.48]){
   const y=7.26-Math.abs(z)*1.83/1.8;
   rosette(outer+layout.side*.018,y,z,'x');rosettes++;
  }
 }
 const group=new THREE.Group();group.name='Romon R96 gallery structural joinery and end fittings';let triangles=0;
 for(const [mat,parts]of batches){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(!g)throw Error('R96 gallery merge failed');const mesh=new THREE.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;triangles+=g.attributes.position.count/3;group.add(mesh);}
 const report={built:true,revision:'R96',galleries:2,transverseBracketArms:brackets,stoneColumnShoes:shoes,goldJointPlates:rosettes,gildedEndVerges:4,materialBatches:batches.size,triangles,collidersAdded:0,sourceFrame:true,dimensions:'Inherited R71 source coordinates; bracket, shoe and fitting dimensions photo-inferred',references:['https://fushimiinari-guide.com/wp-content/uploads/IMG_6485_20210317.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_6487_20210317.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_6491_20210317.jpg'],limits:'Decorative carving and measured historical joinery remain unresolved; no claim of whole precinct completeness'};
 group.userData=report;scene.add(group);scene.userData.romonPrecinctR96=report;return report;
}
