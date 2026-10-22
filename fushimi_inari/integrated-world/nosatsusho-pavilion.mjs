import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

export const nosatsushoFeatureId='way/305214607';
const NAME='Mapped Nosatsusho return pavilion R87';
const urls=['8449','8450','8455'].map(n=>`https://fushimiinari-guide.com/wp-content/uploads/IMG_${n}_20210503.jpg`);

export function buildNosatsushoPavilion(root,features,surfaces,materials,colliders){
 const existing=root.getObjectByName(NAME);if(existing)return existing.userData;
 const source=features.buildings?.find(b=>b.id===nosatsushoFeatureId);if(!source)return {builtIds:[],reason:'mapped pavilion absent'};
 let owned=false;root.traverse(o=>{if(o.userData.sourceFeature===source.id)owned=true;});if(owned)return {builtIds:[],reason:'existing feature owner'};
 const ring=source.points.slice(0,-1);if(ring.length!==5||ring.some(p=>!p.every(Number.isFinite)))return {builtIds:[],reason:'unrecognized mapped ring'};
 const [a,b,c,d,endpoint]=ring,ux=c[0]-b[0],uz=c[2]-b[2],width=Math.hypot(ux,uz),depth=Math.hypot(a[0]-b[0],a[2]-b[2]);
 if(width<2||depth<2)return {builtIds:[],reason:'degenerate pavilion'};
 const yaw=Math.atan2(-uz,ux),cx=(a[0]+b[0]+c[0]+d[0])/4,cz=(a[2]+b[2]+c[2]+d[2])/4,cos=Math.cos(yaw),sin=Math.sin(yaw);
 const local=p=>[(p[0]-cx)*cos-(p[2]-cz)*sin,(p[0]-cx)*sin+(p[2]-cz)*cos];
 const world=(x,z)=>[cx+x*cos+z*sin,cz-x*sin+z*cos],halfW=width/2-.4,halfD=depth/2-.4;
 const positions=[[-halfW,-halfD],[halfW,-halfD],[-halfW,halfD],[halfW,halfD],[-halfW,0],[halfW,0]],grounds=positions.map(([x,z])=>surfaces.terrainHeight(...world(x,z)));
 if(!grounds.every(Number.isFinite))return {builtIds:[],reason:'unresolved footing'};
 // A single inferred architectural datum keeps beams, wall panels and roof
 // horizontal; individual foundation feet reach the actual terrain samples.
 const datum=Math.max(...grounds)+.06;
 const group=new THREE.Group();group.name=NAME;group.position.set(cx,datum,cz);group.rotation.y=yaw;
 const timber=new THREE.MeshStandardMaterial({color:'#61543e',roughness:.96}),paling=new THREE.MeshStandardMaterial({color:'#8c8168',roughness:.98}),plaster=new THREE.MeshStandardMaterial({color:'#d9d6c4',roughness:.98}),roof=new THREE.MeshStandardMaterial({color:'#59877d',roughness:.86,metalness:.10,side:THREE.DoubleSide}),dark=new THREE.MeshStandardMaterial({color:'#292923',roughness:.97});
 const stone=materials.stoneMat??materials.entryStoneMat??new THREE.MeshStandardMaterial({color:'#85857a',roughness:1});
 const batches=new Map(),part=(geometry,material)=>{if(geometry.index){const old=geometry;geometry=geometry.toNonIndexed();old.dispose();}if(!geometry.getAttribute('uv')){const p=geometry.getAttribute('position'),uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/1.4,(p.getY(i)+p.getZ(i))/1.4);geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}if(!batches.has(material))batches.set(material,[]);batches.get(material).push(geometry);};
 const box=(w,h,d,x,y,z,m)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
 const beam=(a,b,w,h,m)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),v=end.clone().sub(start);if(v.length()<1e-5)return;const g=new THREE.BoxGeometry(w,v.length(),h).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize())).translate(...start.add(end).multiplyScalar(.5).toArray());part(g,m);};
 const sheet=(vertices,m,smooth=false)=>{let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));if(smooth){const old=g;g=mergeVertices(g,1e-5);old.dispose();}g.computeVertexNormals();part(g,m);};
 // Source gables are mostly straight pitched roofs, with only a shallow sag
 // and end curl. A full quadratic fall exaggerated this into a pagoda sweep.
 const roofY=(x,z)=>{const t=Math.min(1,Math.abs(x)/(width/2));return 3.86-1.34*t-.07*4*t*(1-t)+.06*t**8+.08*(Math.abs(z)/(depth/2))**8;};
 const contour=ring.map(local),triangles=THREE.ShapeUtils.triangulateShape(contour.map(p=>new THREE.Vector2(...p)),[]),skin=[],grid=.24;
 for(const indices of triangles){const tri=indices.map(i=>contour[i]);
  for(let x=Math.floor(Math.min(...tri.map(p=>p[0]))/grid)*grid;x<Math.max(...tri.map(p=>p[0]));x+=grid)for(let z=Math.floor(Math.min(...tri.map(p=>p[1]))/grid)*grid;z<Math.max(...tri.map(p=>p[1]));z+=grid){
   let polygon=clipConvex(tri,[[x,z],[x+grid,z],[x+grid,z+grid],[x,z+grid]]);if(Math.abs(polygonArea(polygon))<1e-9)continue;if(polygonArea(polygon)<0)polygon=polygon.toReversed();
   for(let j=1;j<polygon.length-1;j++){const face=[polygon[0],polygon[j+1],polygon[j]];if(Math.abs(polygonArea(face))<1e-10)continue;for(const p of face)skin.push(p[0],roofY(...p),p[1]);}
  }
 }
 sheet(skin,roof,true);
 // Exact source ring remains the sole roof boundary; repeated fascia spans
 // follow its curved section. No guessed overhang expands the footprint.
 for(let edge=0;edge<contour.length;edge++){const a=contour[edge],b=contour[(edge+1)%contour.length],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.18);
  for(let i=0;i<count;i++){const p=[a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count],q=[a[0]+(b[0]-a[0])*(i+1)/count,a[1]+(b[1]-a[1])*(i+1)/count];beam([p[0],roofY(...p)-.075,p[1]],[q[0],roofY(...q)-.075,q[1]],.12,.12,dark);}
 }
 box(.14,.16,depth-.10,0,3.96,0,dark);
 // Supported granite feet and exposed timber frame. Upper side bays remain
 // genuinely open geometry; no full-height translucent or opaque wall card.
 for(const [i,[x,z]]of positions.entries()){
  const bottom=grounds[i]-datum-.08,top=.16;box(.35,top-bottom,.35,x,(top+bottom)/2,z,stone);
  box(.18,2.26,.18,x,1.32,z,timber);box(.36,.13,.30,x,2.39,z,timber);
 }
 for(const x of [-halfW,halfW]){box(.17,.22,2*halfD,x,2.31,0,timber);box(.16,.12,2*halfD,x,2.03,0,timber);}
 for(const z of [-halfD,halfD]){
  box(2*halfW,.20,.18,0,2.41,z,timber);
  // Curved barge/truss trim stays beneath the authoritative roof profile;
  // straight diagonal chords would protrude through its concave surface.
  for(let i=0;i<24;i++){const a=-halfW+2*halfW*i/24,b=-halfW+2*halfW*(i+1)/24;beam([a,roofY(a,z)-.23,z],[b,roofY(b,z)-.23,z],.13,.13,timber);}
  box(.13,.94,.13,0,3.10,z,timber);
 }
 // The rear is photographed plaster crossed/bounded by dark timber. Rear
 // storage returns occupy only the back part of each long side, not all bays.
 box(2*halfW-.15,2.28,.075,0,1.33,-halfD,plaster);
 box(2*halfW-.20,2.20,.025,0,1.33,-halfD+.055,timber);
 for(const y of [.25,1.85,2.48])box(2*halfW,.12,.14,0,y,-halfD,timber);
 const rearEnd=-halfD+1.35,rearLength=1.35;
 for(const x of [-halfW,halfW])box(.075,2.19,rearLength,x,1.28,-halfD+rearLength/2,timber);
 box(2*halfW,.12,.16,0,2.08,rearEnd,timber);
 // Restricted low paling on both sides and across the photographed gate.
 // No floor or public interior is registered by this builder.
 for(const x of [-halfW,halfW]){
  box(.12,.12,2*halfD,x,.20,0,paling);box(.11,.10,2*halfD,x,1.16,0,paling);
  const count=Math.ceil(2*halfD/.21);for(let i=0;i<count;i++)box(.075,1.04,.13,x,.73,-halfD+(i+.5)*2*halfD/count,paling);
 }
 const gateCount=Math.ceil(2*halfW/.21);
 for(let i=0;i<gateCount;i++)box(.13,1.04,.075,-halfW+(i+.5)*2*halfW/gateCount,.73,halfD,paling);
 for(const y of [.20,1.16])box(2*halfW,.11,.12,0,y,halfD,paling);
 box(.09,1.17,.13,0,.73,halfD,timber);
 // Simplified sign backing and white folded-paper silhouettes are appearance
 // details only. No fabricated readable calligraphy or emblem is generated.
 box(.45,.65,.06,0,2.05,halfD+.035,timber);
 for(const x of [-.9,.9])sheet([x-.05,1.92,halfD+.06,x-.05,1.72,halfD+.06,x+.06,1.82,halfD+.06,x-.05,1.72,halfD+.06,x-.05,1.52,halfD+.06,x+.06,1.62,halfD+.06],plaster);
 let primitiveCount=0,totalTriangles=0;
 for(const [material,parts]of batches){primitiveCount+=parts.length;const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!geometry)throw Error('Nosatsusho batch merge failed');const mesh=new THREE.Mesh(geometry,material);mesh.name=material===roof?'Nosatsusho green curved source-ring roof':material===plaster?'Nosatsusho pale rear wall and shide':'Nosatsusho exposed timber and low boundary';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);totalTriangles+=geometry.attributes.position.count/3;}
 const pending=[];
 for(const [x,z,w,d,h,tag]of [[0,-halfD,2*halfW,.16,2.6,'rear'],[0,halfD,2*halfW,.16,1.22,'gate'],[-halfW,0,.16,2*halfD,1.22,'west-paling'],[halfW,0,.16,2*halfD,1.22,'east-paling']]){
  const [px,pz]=world(x,z);pending.push({type:'box',args:[px,pz,w/2,d/2,yaw,Math.min(...grounds)-.08,datum+h,'nosatsusho_'+tag]});
 }
 const record={builtIds:[source.id],sourceFeature:source.id,sourceRing:ring.map(p=>[...p]),approachEndpoint:[...endpoint],datum,frame:{center:[cx,cz],yaw,width,depth,halfW,halfD},materialBatches:batches.size,triangles:totalTriangles,primitives:primitiveCount,colliders:pending.length,roofBoundary:'exact mapped five-vertex ring including approach endpoint E',inferred:{eave:2.58,ridge:3.94,wallInset:.4,palingHeight:1.25,rearEnclosedDepth:rearLength},sources:urls,limits:'Mapped footprint and terminal approach retained; cardinal registration and all heights/post counts/returns are photo-inferred. No public interior, walk surface, new torii, tree/sign location, offering contents or readable inscriptions. Teichoan and pond unchanged.'};
 group.userData=record;root.add(group);colliders.push(...pending);return record;
}
