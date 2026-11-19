import * as THREE from 'three';
import {coarseFoliageCards,crownCardDeviation} from './foliage-card-lod.mjs';
// Support in the axis and diagonal directions estimates the outer silhouette
// change of the opaque proxy. Alpha holes still need the authored 105 m guard.
const errorCache=new WeakMap(),crownCells=new WeakMap();
function measureCrown(source,middle,proxy,offset){
  if(errorCache.has(source))return errorCache.get(source);
  const vertex=new THREE.Vector3(),direction=new THREE.Vector3();
  const support=(geometry,transform)=>{
    let furthest=-Infinity;
    for(let i=0;i<geometry.attributes.position.count;i++){
      vertex.fromBufferAttribute(geometry.attributes.position,i);
      if(transform)vertex.applyMatrix4(transform);
      furthest=Math.max(furthest,direction.dot(vertex));
    }
    return furthest;
  };
  let silhouette=0;
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
    if(!(x||y||z))continue;
    direction.set(x,y,z).normalize();
    silhouette=Math.max(silhouette,Math.abs(support(middle)-support(proxy,offset)));
  }
  const errors={card:crownCardDeviation(source,middle),silhouette};
  errorCache.set(source,errors);return errors;
}

// Bind once after forest assembly. The per-frame check handles photo-mode FOV,
// capture size and tier/DPR changes without iterating cells on normal frames.
export function createCrownProjection(scene,camera){
  const cells=[];
  scene.traverse(lod=>{
    const cell=crownCells.get(lod);
    if(!cell)return;
    const [near,middle,far]=lod.levels.map(level=>level.object);
    const error=measureCrown(near.geometry,middle.geometry,far.geometry,cell.offset);
    let largestScale=0;const instance=new THREE.Matrix4();
    for(let i=0;i<near.count;i++){
      near.getMatrixAt(i,instance);largestScale=Math.max(largestScale,instance.getMaxScaleOnAxis());
    }
    cells.push({lod,card:error.card*largestScale,silhouette:error.silhouette*largestScale,radius:near.boundingSphere.radius});
  });
  let lastHeight,lastX,lastY,lastZoom;
  return height=>{
    if(!camera.isPerspectiveCamera||!(height>0))return;
    const {elements}=camera.projectionMatrix,px=elements[0],py=elements[5],zoom=camera.zoom;
    if(height===lastHeight&&px===lastX&&py===lastY&&zoom===lastZoom)return;
    lastHeight=height;lastX=px;lastY=py;lastZoom=zoom;
    // Radial LOD distance divided by this corner factor gives a conservative
    // view-space z even for a cell at the outer edge of the frustum.
    const corner=Math.hypot(1,1/px,1/py),focal=height*py*.5;
    for(const {lod,card,silhouette,radius} of cells){
      // Three divides observed distance by camera.zoom. Cancel that here
      // because the projection matrix already includes optical zoom.
      const guard=(minimum,error,pixels)=>Math.max(minimum+radius,(radius+error*focal/pixels)*corner)/(.88*zoom);
      lod.levels[1].distance=guard(45,card,1.5);
      lod.levels[2].distance=Math.max(lod.levels[1].distance,guard(105,silhouette,8));
    }
  };
}

// A cheap crown occupies the same bounds as every preserved tree: distant
// culling must not erase the low-elevation woods absent from the hill envelope.
// Callers that build one LOD per cell pass shared resources so every cell
// reuses a single proxy geometry, material and card set. canopyProxy:false
// keeps a far proxy out of canopy sampling when its near crown already counts.
export function createForestLODResources(maple=false){
  return {geo:new THREE.IcosahedronGeometry(1,0),mat:new THREE.MeshLambertMaterial({color:maple?'#ffffff':'#35492a'}),middleGeometries:new Map()};
}
export function preservedForestLOD(chunks,maple=false,{resources=createForestLODResources(maple),canopyProxy=true}={}){
 const {geo,mat,middleGeometries}=resources;
  for(const near of [...chunks.children]){
    if(!near.geometry.boundingBox)near.geometry.computeBoundingBox();const box=near.geometry.boundingBox,center=box.getCenter(new THREE.Vector3()),scale=box.getSize(new THREE.Vector3()).multiplyScalar(.5);
    const offset=new THREE.Matrix4().makeTranslation(...center.toArray()).multiply(new THREE.Matrix4().makeScale(...scale.toArray()));
    if(!middleGeometries.has(near.geometry))middleGeometries.set(near.geometry,coarseFoliageCards(near.geometry));
    const middleGeometry=middleGeometries.get(near.geometry);
    const middle=middleGeometry?new THREE.InstancedMesh(middleGeometry,near.material,near.count):null;
    if(middle){
      middle.name='Preserved forest · textured middle crown';middle.receiveShadow=near.receiveShadow;
      if(near.instanceColor)middle.instanceColor=near.instanceColor.clone();
      // The near crown already owns canopy occlusion; do not count this LOD twice.
      middle.userData.seasonalMaple=maple;
    }
    const far=new THREE.InstancedMesh(geo,mat,near.count),matrix=new THREE.Matrix4();
    for(let i=0;i<near.count;i++){near.getMatrixAt(i,matrix);middle?.setMatrixAt(i,matrix);far.setMatrixAt(i,matrix.multiply(offset));}
    far.userData.seasonalMaple=maple;if(canopyProxy)far.userData.precinctCanopy=true;
    // Both LODs describe the same source trees, regardless of cell partition.
    if(maple)for(const mesh of [middle,far].filter(Boolean)){mesh.userData.seasonSourceIndices=Object.freeze([...(near.userData.seasonSourceIndices??near.userData.partitionSourceIndices??Array.from({length:near.count},(_,i)=>i))]);if(near.userData.seasonSourceGroup!==undefined)mesh.userData.seasonSourceGroup=near.userData.seasonSourceGroup;}
    far.computeBoundingSphere();
    const position=near.boundingSphere.center.clone(),lod=new THREE.LOD();lod.position.copy(position);
    near.position.copy(position).negate();far.position.copy(near.position);
    if(middle){middle.position.copy(near.position);middle.computeBoundingSphere();}
    // LOD measures distance to the cell center, not its closest crown. Include
    // the whole cell radius so a distant cell center cannot simplify nearby
    // trees. Account for hysteresis too: returning from the far level must
    // restore detailed foliage before any crown enters the 45 m foreground.
    // The previous 300 m guard kept full crowns beyond the walker's entire
    // view budget; this retains nearby path detail while using the existing
    // solid crown proxy for distant cover.
    const hysteresis=.12,distance=(45+near.boundingSphere.radius)/(1-hysteresis);
    lod.addLevel(near,0);
    if(middle){
      // Keep the same near protection. Textured whole cards bridge the old
      // solid-crown/detail jump; opaque cover is reserved for farther woods.
      crownCells.set(lod,{offset});
      lod.addLevel(middle,distance,hysteresis);
      lod.addLevel(far,(105+near.boundingSphere.radius)/(1-hysteresis),hysteresis);
    }else lod.addLevel(far,distance,hysteresis);
    chunks.add(lod);
  }
  return chunks;
}
// Distant trunks stand under closed canopy: a five-sided taper with the same
// bark material replaces the modelled trunk outside the foreground. The proxy
// spans the source bounds, so instance matrices and ground contact are shared.
export function trunkProxyGeometry(source){
  if(!source.boundingBox)source.computeBoundingBox();
  const box=source.boundingBox,size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  // Root flare widens the bounds; the visible shaft is far narrower.
  const radius=Math.max(size.x,size.z)*.5,geometry=new THREE.CylinderGeometry(radius*.34,radius*.62,size.y,5,1,true);
  geometry.translate(center.x,center.y,center.z);
  return geometry;
}
export function trunkLOD(near,proxy){
  if(!near.boundingSphere)near.computeBoundingSphere();
  const far=new THREE.InstancedMesh(proxy,near.material,near.count),matrix=new THREE.Matrix4();
  for(let i=0;i<near.count;i++){near.getMatrixAt(i,matrix);far.setMatrixAt(i,matrix);}
  far.name='Forest trunks · distant taper';far.receiveShadow=near.receiveShadow;far.userData.forestProxy=true;
  const position=near.boundingSphere.center.clone(),lod=new THREE.LOD();lod.name='Forest trunks · distance LOD';lod.position.copy(position);
  near.position.copy(position).negate();far.position.copy(near.position);far.computeBoundingSphere();
  // Same foreground guarantee as the crowns: no simplified trunk within 45 m.
  const hysteresis=.12;
  lod.addLevel(near,0);lod.addLevel(far,(45+near.boundingSphere.radius)/(1-hysteresis),hysteresis);
  return lod;
}
