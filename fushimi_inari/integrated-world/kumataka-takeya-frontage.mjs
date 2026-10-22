import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

export const takeyaFeatureId='way/301527736';
const NAME='Takeya mapped timber and open frontage R89';
const sourceBase='https://fushimiinari-guide.com/wp-content/uploads/';

function observedTakeyaNoren(){
 const canvas=globalThis.document?.createElement?.('canvas'),context=canvas?.getContext?.('2d');
 if(!context?.fillText)return null;
 canvas.width=1024;canvas.height=256;context.fillStyle='#495040';context.fillRect(0,0,1024,256);
 context.fillStyle='#eee9dd';context.textAlign='center';context.textBaseline='middle';context.font='100px "Yu Mincho", "Noto Serif JP", serif';
 // The two observed vertical characters are the shop name, not generated copy.
 context.fillText('竹',640,75.5);context.fillText('屋',640,180.5);
 const texture=new THREE.CanvasTexture(canvas);texture.name='Takeya observed vertical name noren';texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function conflictingLegacyStones(root,ring){
 let legacy;root.traverse(o=>{if(o.isGroup&&o.userData.zone==='kumataka')legacy=o;});if(!legacy)return [];
 const triangles=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[]).map(t=>t.map(i=>[ring[i][0],ring[i][2]])),conflicts=[];
 const near=(a,b)=>Math.abs(a-b)<1e-5;
 for(let index=0;index<28;index++){
  // These exact positions/dimensions identify the unsupported repeated row in
  // buildKumatakashaAndPond(), not a material/color or proximity selection.
  const x=-9.2-index%4*1.35,z=-8.5+Math.floor(index/4)*2.5,h=1.10+index%3*.32;
  const expected=[{kind:'stele',position:[x,h*.5+index%4*.18,z],type:'BoxGeometry',match:p=>near(p.width,.56)&&near(p.height,h)&&near(p.depth,.30)}];
  if(index%3===0){expected.push({kind:'legacy fox',position:[x+.42,.38,z],type:'ConeGeometry',match:p=>near(p.radius,.16)&&near(p.height,.48)&&p.radialSegments===6},{kind:'legacy fox bib',position:[x+.42,.32,z],type:'CylinderGeometry',match:p=>near(p.radiusTop,.13)&&near(p.radiusBottom,.16)&&near(p.height,.14)&&p.radialSegments===8});}
  for(const spec of expected){
   const object=legacy.children.find(o=>o.isMesh&&!o.userData.interactable&&o.geometry.type===spec.type&&spec.match(o.geometry.parameters)&&spec.position.every((v,i)=>near(o.position.getComponent(i),v)));
   if(!object)continue;object.updateWorldMatrix(true,false);
   const p=object.geometry.attributes.position,points=[],v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(object.matrixWorld);points.push([v.x,v.z]);}
   points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lo=[],hi=[];
   for(const q of points){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of points.toReversed()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}const footprint=lo.slice(0,-1).concat(hi.slice(0,-1));
   const area=triangles.reduce((sum,t)=>sum+Math.abs(polygonArea(clipConvex(t,footprint))),0);if(area<1e-6)continue;
   const bounds=new THREE.Box3().setFromObject(object);
   conflicts.push({object,record:{sourceIndex:index,kind:spec.kind,localPosition:[...spec.position],worldCenter:bounds.getCenter(new THREE.Vector3()).toArray(),worldBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},footprintOverlapArea:area}});
  }
 }
 return conflicts;
}

export function buildKumatakaTakeyaFrontage(root,features,surfaces,materials,colliders){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const feature=features.buildings?.find(b=>b.id===takeyaFeatureId);if(!feature)return {builtIds:[],reason:'Takeya footprint absent'};
 let owned=false;root.traverse(o=>{if(o.userData.sourceFeature===feature.id)owned=true;});if(owned)return {builtIds:[],reason:'existing source-feature owner'};
 const ring=feature.points.slice(0,-1);if(ring.length!==10||ring.some(p=>!p.every(Number.isFinite)))return {builtIds:[],reason:'unrecognized mapped Takeya ring'};
 const a=ring[4],b=ring[5],length=Math.hypot(b[0]-a[0],b[2]-a[2]),ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length,cx=ring.reduce((s,p)=>s+p[0]/ring.length,0),cz=ring.reduce((s,p)=>s+p[2]/ring.length,0);
 const sign=Math.sign(-uz*(cx-a[0])+ux*(cz-a[2])),nx=-uz*sign,nz=ux*sign,yaw=-Math.atan2(uz,ux),at=(s,d,y=0)=>[a[0]+ux*s+nx*d,y,a[2]+uz*s+nz*d];
 const samples=Array.from({length:7},(_,i)=>{const p=at(length*i/6,0);return surfaces.terrainHeight(p[0],p[2]);});
 if(!samples.every(Number.isFinite))return {builtIds:[],reason:'unresolved frontage ground'};
 // The current resolved frontage is level. Do not flatten another assembly's
 // slope or invent a high public step to satisfy an architectural datum.
 if(Math.max(...samples)-Math.min(...samples)>.18)return {builtIds:[],reason:'frontage grade requires separate threshold registration'};
 const floor=Math.max(...samples)+.045,eave=floor+2.85;
 const pavilion=features.buildings?.find(b=>b.id==='way/301527741'),center=pavilion?.points.slice(0,-1).reduce((s,p)=>[s[0]+p[0]/(pavilion.points.length-1),s[1]+p[2]/(pavilion.points.length-1)],[0,0]);
 if(!center)return {builtIds:[],reason:'facing pavilion registration absent'};
 const opening=Math.max(2.5,Math.min(length-2.5,(center[0]-a[0])*ux+(center[1]-a[2])*uz)),openingWidth=3.0,left=opening-openingWidth/2,right=opening+openingWidth/2;
 const group=new THREE.Group();group.name=NAME;const parts=staticParts(group);
 const timber=new THREE.MeshStandardMaterial({color:'#554331',roughness:.96}),boards=new THREE.MeshStandardMaterial({color:'#36352c',roughness:.97}),roof=new THREE.MeshStandardMaterial({color:'#49514b',roughness:.94,side:THREE.DoubleSide}),glass=new THREE.MeshStandardMaterial({color:'#64706a',roughness:.48,metalness:.04}),fabric=new THREE.MeshStandardMaterial({color:'#495040',roughness:1,side:THREE.DoubleSide}),shadow=new THREE.MeshStandardMaterial({color:'#20241f',roughness:1});
 const nameTexture=observedTakeyaNoren();if(nameTexture){fabric.map=nameTexture;fabric.color.set('#ffffff');}
 const stone=(materials.stoneMat??materials.entryStoneMat??new THREE.MeshStandardMaterial({color:'#87877a'})).clone();stone.roughness=1;
 const put=(w,h,d,s,y,inset,m)=>parts.put(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(...at(s,inset,y)),m);
 const pending=[],collider=(s,inset,hw,hd,lo,hi,tag)=>{const p=at(s,inset);pending.push({type:'box',args:[p[0],p[2],hw,hd,yaw,lo,hi,`takeya_${tag}`]});};
 // Exact footprint perimeter, with only its registered east front opened.
 // Foundations reach actual resolved ground, while roof and glazing stay level.
 for(let edge=0;edge<ring.length;edge++){
  if(edge===4)continue;const p=ring[edge],q=ring[(edge+1)%ring.length],len=Math.hypot(q[0]-p[0],q[2]-p[2]),count=Math.ceil(len/.8),angle=-Math.atan2(q[2]-p[2],q[0]-p[0]),bottoms=[];
  for(let k=0;k<count;k++){
   const x=p[0]+(q[0]-p[0])*(k+.5)/count,z=p[2]+(q[2]-p[2])*(k+.5)/count,bottom=Math.min(floor-.08,surfaces.terrainHeight(x,z)-.08);
   if(!Number.isFinite(bottom)||bottom>=eave)throw Error('Unresolved Takeya perimeter support');
   parts.put(new THREE.BoxGeometry(len/count,floor-bottom,.12).rotateY(angle).translate(x,(floor+bottom)/2,z),stone);
   parts.put(new THREE.BoxGeometry(len/count,eave-floor,.10).rotateY(angle).translate(x,(floor+eave)/2,z),boards);
   bottoms.push(bottom);
  }
  pending.push({type:'box',args:[(p[0]+q[0])/2,(p[2]+q[2])/2,len/2,.08,angle,Math.min(...bottoms),eave,'takeya_perimeter']});
 }
 for(const [start,end]of [[0,left],[right,length]]){
  const bays=Math.max(1,Math.round((end-start)/1.25)),bay=(end-start)/bays;
  for(let i=0;i<bays;i++){
   const s=start+(i+.5)*bay;
   put(bay-.08,.62,.10,s,floor+.35,.075,timber);
   // Opaque reflected glazing describes photographed sliding timber/glass
   // without exposing an invented dining-room layout behind every window.
   put(bay-.12,1.28,.026,s,floor+1.32,.03,glass);
   for(const offset of [-bay/2,0,bay/2])put(.055,1.38,.065,s+offset,floor+1.32,-.005,timber);
   for(const y of [.65,1.32,1.99])put(bay,.055,.065,s,floor+y,-.005,timber);
   collider(s,.06,bay/2,.08,floor-.08,eave,'glazing');
  }
 }
 for(const s of [0,left,right,length]){put(.15,2.67,.17,s,floor+1.38,.07,timber);collider(s,.07,.075,.085,floor-.08,eave,'post');}
 put(length,.18,.20,length/2,floor+2.65,.07,timber);put(length,.16,.14,length/2,floor+2.28,.06,timber);
 // Photo P3600691 looks out through this broad opening toward Kumataka.
 // Only a bounded 1.1m display recess is represented, never a public interior.
 put(openingWidth,.045,1.10,opening,floor-.0225,.56,stone);
 put(openingWidth,2.15,.08,opening,floor+1.12,1.14,shadow);collider(opening,1.14,openingWidth/2,.04,floor-.08,eave,'recess-stop');
 put(.72,.83,.52,right-.44,floor+.415,.70,timber);put(.78,.055,.56,right-.44,floor+.86,.70,boards);collider(right-.44,.70,.39,.28,floor,floor+.9,'counter');
 // The observed two-character name shares the existing cloth material/batch.
 for(let i=0;i<4;i++){
  const s=left+(i+.5)*openingWidth/4,w=openingWidth/4-.045,vertices=[],uv=[];
  for(const [u,v]of [[-1,1],[-1,0],[1,1],[1,1],[-1,0],[1,0]]){const position=s+u*w/2;vertices.push(...at(position,-.012+.018*Math.cos(i),floor+1.95+v*.52));uv.push(1-(position-left)/openingWidth,v);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));parts.put(geometry,fabric,false);
 }
 // Short overhead eave only: no low post or across-lane canopy is inferred.
 const p0=at(0,.10,floor+2.69),p1=at(length,.10,floor+2.69),p2=at(length,-.28,floor+2.59),p3=at(0,-.28,floor+2.59);
 parts.sheet([...p0,...p3,...p1,...p1,...p3,...p2],roof);
 for(let s=.3;s<length;s+=.43)parts.beam(at(s,.09,floor+2.59),at(s,-.25,floor+2.49),.025,timber,.025,5);
 // Full concave source ring is retained. Unseen rear roof junctions use
 // explicitly inferred shallow hipped massing, rather than invented gables.
 const distance=(x,z)=>Math.min(...ring.map((p,i)=>{const q=ring[(i+1)%ring.length],dx=q[0]-p[0],dz=q[2]-p[2],t=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[2])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-p[0]-dx*t,z-p[2]-dz*t);}));
 const roofY=(x,z)=>eave+Math.min(1.10,distance(x,z)*.32),contour=ring.map(p=>[p[0],p[2]]),triangles=THREE.ShapeUtils.triangulateShape(contour.map(p=>new THREE.Vector2(...p)),[]),skin=[],grid=.45;
 for(const indices of triangles){const tri=indices.map(i=>contour[i]);for(let x=Math.floor(Math.min(...tri.map(p=>p[0]))/grid)*grid;x<Math.max(...tri.map(p=>p[0]));x+=grid)for(let z=Math.floor(Math.min(...tri.map(p=>p[1]))/grid)*grid;z<Math.max(...tri.map(p=>p[1]));z+=grid){
  let polygon=clipConvex(tri,[[x,z],[x+grid,z],[x+grid,z+grid],[x,z+grid]]);if(Math.abs(polygonArea(polygon))<1e-9)continue;if(polygonArea(polygon)<0)polygon=polygon.toReversed();
  for(let j=1;j<polygon.length-1;j++){
   // At world x≈530m, Float32 quantization can collapse submillimetre clipped
   // slivers even when their original double-precision area was positive.
   // Filter the actual stored vertices, not only the pre-upload polygon.
   const face=[polygon[0],polygon[j+1],polygon[j]].map(p=>[Math.fround(p[0]),Math.fround(roofY(...p)),Math.fround(p[1])]);
   const [a,b,c]=face,ny=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);if(ny<=1e-8)continue;
   for(const p of face)skin.push(...p);
  }
 }}
 const roofGroup=new THREE.Group(),roofParts=staticParts(roofGroup),rawSkin=new THREE.BufferGeometry();rawSkin.setAttribute('position',new THREE.Float32BufferAttribute(skin,3));
 const smoothSkin=mergeVertices(rawSkin,1e-5);rawSkin.dispose();smoothSkin.computeVertexNormals();roofParts.put(smoothSkin,roof);
 const roofStats=roofParts.flush();roofGroup.children[0].name='Takeya exact concave main roof skin';group.add(roofGroup);
 const stats=parts.flush();
 const legacyConflicts=conflictingLegacyStones(root,ring);
 const record={builtIds:[feature.id],sourceFeature:feature.id,sourceRing:ring.map(p=>[...p]),frontage:{a:[...a],b:[...b],length,inward:[nx,nz],openingCenter:opening,openingWidth,projection:'mapped facing Kumataka roof center'},floor,eave,materialBatches:stats.batches,triangles:stats.triangles+roofStats.triangles,mainRoofTriangles:roofStats.triangles,colliders:pending.length,clearedLegacyStones:legacyConflicts.map(c=>c.record),clearedLegacyColliders:0,observedName:nameTexture?'竹屋':null,threshold:{depth:1.10,maximumRise:floor-Math.min(...samples),publicInterior:false},sources:['https://fushimiinari-guide.com/takeya/',...['P3600730_20190210.jpg','P3600721_20190219.jpg','P3600691_20190219.jpg'].map(n=>sourceBase+n)],limits:'Named mapped shop and east frontage registered; heights/bay counts/opening width and precise counter position inferred. Main roof hipped geometry is conservative unseen massing, not surveyed roof reconstruction. Only observed shop name is lettered; no menu/prices, dining-room inventory, public indoor route, terrace geometry or terrain/path changes. Only exact unsupported legacy repeated-stone/fox meshes overlapping this registered shop footprint are cleared; pavilion and all other stones retained.'};
 for(const conflict of legacyConflicts){conflict.object.removeFromParent();conflict.object.geometry.dispose();}
 group.userData=record;root.add(group);colliders.push(...pending);return record;
}
