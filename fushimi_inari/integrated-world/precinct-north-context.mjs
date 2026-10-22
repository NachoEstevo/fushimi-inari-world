import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

export const precinctNorthContextIds=Object.freeze(['way/305214358']);
const sourceUrls=['https://www.obayashi.co.jp/works/detail/work_1443.html','https://www.mokuei.co.jp/down/public017.pdf','https://www.kyoto-ga.jp/greenery/kyononiwa/2015/09/post_12.html'];

// A source-backed exterior context upgrade, not a detailed roof/facade survey.
// The large concave OSM outline owns all geometry, including its courtyard void.
export function buildPrecinctNorthContext(root,features,surfaces,materials,colliders){
 const name='Mapped north precinct office context R83',existing=root.getObjectByName(name);if(existing)return existing.userData;
 const office=features.buildings?.find(b=>b.id===precinctNorthContextIds[0]);if(!office)return {builtIds:[],reason:'mapped office absent'};
 let owner=false;root.traverse(o=>{if(o.userData.sourceFeature===office.id)owner=true;});if(owner)return {builtIds:[],reason:'existing source-feature owner'};
 const ring=office.points.filter((p,i,a)=>i===0||p[0]!==a[0][0]||p[2]!==a[0][2]);if(ring.length<3||ring.some(p=>!p.every(Number.isFinite)))return {builtIds:[],reason:'invalid mapped office ring'};
 const samples=ring.map(p=>surfaces.terrainHeight(p[0],p[2]));if(!samples.every(Number.isFinite))return {builtIds:[],reason:'unresolved office ground'};
 // Use a least-squares grade plane for this extensive hillside compound.
 // It keeps the roof stable across terrain/path discontinuities. This is an
 // explicitly inferred massing datum, not a claim about individual floor levels.
 const cx=ring.reduce((s,p)=>s+p[0]/ring.length,0),cz=ring.reduce((s,p)=>s+p[2]/ring.length,0),cy=samples.reduce((s,y)=>s+y/samples.length,0);
 let xx=0,xz=0,zz=0,xy=0,zy=0;ring.forEach((p,i)=>{const x=p[0]-cx,z=p[2]-cz,y=samples[i]-cy;xx+=x*x;xz+=x*z;zz+=z*z;xy+=x*y;zy+=z*y;});
 const determinant=xx*zz-xz*xz;if(Math.abs(determinant)<1e-6)return {builtIds:[],reason:'degenerate mapped office ring'};
 const ax=(xy*zz-zy*xz)/determinant,az=(zy*xx-xy*xz)/determinant,datum=(x,z)=>cy+ax*(x-cx)+az*(z-cz),eave=(x,z)=>datum(x,z)+4.3;
 const segmentDistance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);};
 const distance=(x,z)=>Math.min(...ring.map((a,i)=>segmentDistance(x,z,a,ring[(i+1)%ring.length])));
 // Only mapped footway endpoints that actually meet this building justify
 // an opening. Its location/width preserve access, without asserting a door.
 const openings=[];
 for(const path of features.paths??[]){if(!['footway','path','steps','pedestrian'].includes(path.tags?.highway)||path.points.length<2)continue;
  for(const end of [0,path.points.length-1]){const p=path.points[end],q=path.points[end===0?1:end-1],length=Math.hypot(q[0]-p[0],q[2]-p[2]);if(!length||distance(p[0],p[2])>.12)continue;
   const width=surfaces.segments?.find(s=>s.id===path.id)?.width??Number.parseFloat(path.tags.width??'2');if(!Number.isFinite(width)||width<=0)continue;
   openings.push({sourcePath:path.id,point:[p[0],p[2]],direction:[(q[0]-p[0])/length,(q[2]-p[2])/length],width:width+.30});
  }
 }
 const roofY=(x,z)=>eave(x,z)+distance(x,z)*.38;
 const group=new THREE.Group();group.name=name;group.userData.sourceFeature=office.id;
 const plaster=new THREE.MeshStandardMaterial({color:'#c8c0a8',roughness:.96}),timber=new THREE.MeshStandardMaterial({color:'#514431',roughness:.95}),roofMaterial=new THREE.MeshStandardMaterial({color:'#64675e',roughness:.94,side:THREE.DoubleSide}),stone=materials.stoneMat??new THREE.MeshStandardMaterial({color:'#827e74',roughness:1});
 const batches=new Map(),part=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
 const box=(w,h,d,x,y,z,mat,yaw)=>part(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat);
 const records=[],pendingColliders=[],openingSections=[];
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],length=Math.hypot(b[0]-a[0],b[2]-a[2]);if(length<.03)continue;const count=Math.ceil(length/1.5),yaw=Math.atan2(a[2]-b[2],b[0]-a[0]);
  // Split boundary sections at opening margins, rather than deleting several
  // whole 1.5m sections and exaggerating a two-metre mapped access.
  const breaks=Array.from({length:count+1},(_,k)=>k/count);
  for(const o of openings){const [vx,vz]=o.direction,u0=(a[0]-o.point[0])*(-vz)+(a[2]-o.point[1])*vx,du=(b[0]-a[0])*(-vz)+(b[2]-a[2])*vx;if(Math.abs(du)<1e-8)continue;
   for(const side of [-1,1]){const t=(side*(o.width/2+.11)-u0)/du,v=(a[0]+(b[0]-a[0])*t-o.point[0])*vx+(a[2]+(b[2]-a[2])*t-o.point[1])*vz;if(t>0&&t<1&&v>-.4&&v<1.5)breaks.push(t);}
  }
  breaks.sort((x,y)=>x-y);
  for(let k=0;k<breaks.length-1;k++){
   const sectionLength=(breaks[k+1]-breaks[k])*length;if(sectionLength<1e-6)continue;
   const t=(breaks[k]+breaks[k+1])/2,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,ground=surfaces.terrainHeight(x,z)-.08,top=eave(x,z),height=top-ground;
   if(!Number.isFinite(ground)||height<=.2)throw Error('Office terrain is incompatible with inferred massing datum');
   const opening=openings.find(o=>{const [vx,vz]=o.direction,dx=x-o.point[0],dz=z-o.point[1],u=dx*(-vz)+dz*vx,v=dx*vx+dz*vz,half=sectionLength/2,wx=Math.cos(yaw),wz=-Math.sin(yaw),across=half*Math.abs(wx*(-vz)+wz*vx)+.10,along=half*Math.abs(wx*vx+wz*vz)+.10;return Math.abs(u)<o.width/2+across&&v>-.4-along&&v<1.5+along;});
   const lintelBottom=opening?Math.max(ground,surfaces.height?.(x,z)??ground)+2.3:ground;
   if(opening){
    openingSections.push({sourcePath:opening.sourcePath,center:[x,z],length:sectionLength,lintelBottom});
    if(top>lintelBottom)box(sectionLength,top-lintelBottom,.12,x,(top+lintelBottom)/2,z,plaster,yaw);
   }else{
    box(sectionLength,height,.12,x,(top+ground)/2,z,plaster,yaw);
    box(sectionLength,.28,.16,x,ground+.14,z,stone,yaw);
    // Plain repeated timber posts follow photographs; no guessed doors or signs.
    box(.09,height,.17,x,(top+ground)/2,z,timber,yaw);
   }
   box(sectionLength,.11,.17,x,top-.10,z,timber,yaw);
   if(top>lintelBottom)pendingColliders.push({type:'box',args:[x,z,sectionLength/2,.10,yaw,lintelBottom,top,`precinct_office_${opening?'lintel_':''}${office.id}`]});
  }
  records.push({edge:i,length,sections:breaks.length-1});
 }
 const contour=ring.map(p=>new THREE.Vector2(p[0],p[2])),triangles=THREE.ShapeUtils.triangulateShape(contour,[]),positions=[],uv=[];
 const triangle=(a,b,c)=>{
  // A common metre grid gives both sides of every source triangle edge the
  // same subdivision points. Independent recursive subdivision left T-junction
  // cracks wherever the nonlinear roof height changed along a shared edge.
  const grid=1,minX=Math.min(a[0],b[0],c[0]),maxX=Math.max(a[0],b[0],c[0]),minZ=Math.min(a[1],b[1],c[1]),maxZ=Math.max(a[1],b[1],c[1]);
  for(let x=Math.floor(minX/grid)*grid;x<maxX;x+=grid)for(let z=Math.floor(minZ/grid)*grid;z<maxZ;z+=grid){
   let polygon=clipConvex([a,b,c],[[x,z],[x+grid,z],[x+grid,z+grid],[x,z+grid]]);if(Math.abs(polygonArea(polygon))<1e-9)continue;if(polygonArea(polygon)<0)polygon=polygon.toReversed();
   for(let i=1;i<polygon.length-1;i++){const face=[polygon[0],polygon[i+1],polygon[i]];if(Math.abs(polygonArea(face))<1e-9)continue;for(const p of face){positions.push(p[0],roofY(...p),p[1]);uv.push(p[0]/2,p[1]/2);}}
  }
 };
 for(const t of triangles)triangle(...t.map(i=>[ring[i][0],ring[i][2]]));
 const skin=new THREE.BufferGeometry();skin.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));skin.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 // The clipped triangulation duplicates coincident edge vertices.
 // Share their normals before material batching expands triangles again;
 // this keeps the original roof positions/ring and removes faceted teeth.
 const smoothSkin=mergeVertices(skin,1e-5);skin.dispose();smoothSkin.computeVertexNormals();part(smoothSkin,roofMaterial);
 for(const [mat,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geo,mat);mesh.name=mat===roofMaterial?'Office concave roof context':'Office timber plaster and foundation context';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 group.userData={sourceFeature:office.id,builtIds:[office.id],roofTriangles:positions.length/9,edges:records.length,wallSections:records.reduce((s,r)=>s+r.sections,0),openings,openingSections,datum:{center:[cx,cy,cz],grade:[ax,az]},sources:sourceUrls,limits:'Exact mapped concave footprint; inferred 4.3m eaves over fitted terrain grade and inferred 0.38 pitch on clipped hipped roof. Photographs establish timber/plaster/dark roof vocabulary, not this simplified ridge network. Openings only preserve mapped path endpoints, not an asserted door/function. Garden, glazing, ornamental gables, storey transitions and private access unmodeled.'};
 colliders.push(...pendingColliders);root.add(group);return group.userData;
}
