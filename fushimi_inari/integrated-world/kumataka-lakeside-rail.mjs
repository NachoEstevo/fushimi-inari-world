import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

const NAME='Kumataka photographed lakeside paling R88';
const near=(a,b)=>Math.abs(a-b)<1e-5;
const matches=(o,w,h,d,x,y,z)=>{const p=o.geometry?.parameters;return o.isMesh&&o.geometry.type==='BoxGeometry'&&p&&near(p.width,w)&&near(p.height,h)&&near(p.depth,d)&&near(o.position.x,x)&&near(o.position.y,y)&&near(o.position.z,z);};

/**
 * The southern memorial tiers remain blocked by unresolved geographic bounds.
 * This accepted fallback refines only the existing opaque lakeside rail. Its
 * original group owns the geographic rigid transform and all ground levels.
 * Call after capture/relocation and before global material batching (or before
 * relocation); never construct a terrace polygon from building=roof 301527741.
 */
export function buildKumatakaLakesideRail(root,materials={}){
 let shrine;root.traverse(o=>{if(o.isGroup&&o.userData.zone==='kumataka')shrine=o;});
 if(!shrine)return {adapted:false,reason:'legacy Kumataka group absent',terracesBuilt:false};
 const previous=shrine.getObjectByName(NAME);if(previous)return previous.userData;
 const rail=shrine.children.find(o=>matches(o,.18,.92,16.8,2.55,1.05,0));
 const cap=shrine.children.find(o=>matches(o,.22,.10,17,2.55,1.54,0));
 const shore=shrine.children.find(o=>matches(o,1.15,1.10,18.5,2.4,.18,0));
 if(!rail||!cap||!shore)return {adapted:false,reason:'exact original rail/cap/shore signature absent',terracesBuilt:false};
 const group=new THREE.Group();group.name=NAME;const parts=staticParts(group),red=rail.material,dark=cap.material;
 const count=88,spacing=16.6/count;
 // All pieces remain inside the original x/y/z envelope, including the small
 // inherited cap. Do not enlarge this approximate shoreline or change pond
 // water, stone shore, pavilion, decking, interaction or collision ownership.
 for(const z of [-8.3,-4.15,0,4.15,8.3])parts.box(.18,.92,.18,2.55,1.05,z,red);
 for(const y of [.72,1.28])parts.box(.12,.075,16.8,2.55,y,0,red);
 for(let i=0;i<count;i++){
  const z=-8.3+(i+.5)*spacing;
  parts.box(.055,.74,.105,2.55,.96,z,red);
  // Black painted upper ends are visible in both side/rear reference views.
  // A small pentagonal head gives the observed slat silhouette, not a crest.
  const shape=new THREE.Shape();shape.moveTo(z-.0525,1.33);shape.lineTo(z+.0525,1.33);shape.lineTo(z+.0525,1.47);shape.lineTo(z,1.51);shape.lineTo(z-.0525,1.47);shape.closePath();
  const head=new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false,curveSegments:1});
  // Shape coordinates are z/y; extrusion becomes the narrow local x depth.
  head.rotateY(-Math.PI/2).translate(2.5775,0,0);parts.put(head,dark);
 }
 // A shallow closed cap retains original max height1.59m, 0.22m width and
 // 17m length. It does not claim the photographed cover's surveyed section.
 const capShape=new THREE.Shape();capShape.moveTo(-.11,1.49);capShape.lineTo(.11,1.49);capShape.lineTo(.11,1.54);capShape.lineTo(0,1.59);capShape.lineTo(-.11,1.54);capShape.closePath();
 parts.put(new THREE.ExtrudeGeometry(capShape,{depth:17,bevelEnabled:false,curveSegments:1}).translate(2.55,0,-8.5),dark);
 const stats=parts.flush();
 const record={revision:'R88',adapted:true,terracesBuilt:false,refinedOwner:'existing local lakeside rail and cap',palingCount:count,posts:5,materialBatches:stats.batches,triangles:stats.triangles,
  localEnvelope:{min:[2.44,.59,-8.5],max:[2.66,1.59,8.5]},geographicTransform:'inherited unchanged Kumataka group matrix',
  sources:['https://fushimiinari-guide.com/wp-content/uploads/P3600705_20190210.jpg','https://fushimiinari-guide.com/wp-content/uploads/P3600706_20190210.jpg'],
  observed:'vermilion vertical slats, dark pointed heads and continuous dark cover beside confined pavilion passage',
  inferred:'88 slats, five posts, cap section and all proportions constrained to existing legacy envelope; not a shoreline or dimensional survey',
  blocked:'Southern memorial terrace outer boundary, tier levels and subsidiary stair registration remain unresolved; no tiers, steps, stele removal, footings or grade patches built',
  retained:['pond/shore geometry and levels','pavilion and interactions','deck','all steles/foxes','public paths and walk samplers','all colliders']};
 group.userData=record;shrine.add(group);
 // Commit only after all replacement batches succeed. Shared legacy materials
 // are retained by the new batches; only removed geometry is disposed.
 rail.removeFromParent();cap.removeFromParent();rail.geometry.dispose();cap.geometry.dispose();return record;
}
