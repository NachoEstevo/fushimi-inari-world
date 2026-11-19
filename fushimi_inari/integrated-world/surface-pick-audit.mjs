import {MathUtils,Matrix4,Raycaster,Triangle,Vector2,Vector3} from 'three';

const MAX_DISTANCE = 80;
const CORRELATION_DISTANCE = 8;
const round = n => Math.round(n*1e6)/1e6||0;
const coords = vector => vector.toArray().map(round);
const excluded = (object,roots) => {
  for (let node=object;node;node=node.parent) if (roots.has(node)) return true;
  return false;
};

function ancestry(object, scene) {
  const result=[];
  for (let node=object;node&&node!==scene;node=node.parent) {
    const {zone,sourceFeature,sourceId,osmId,staticSector}=node.userData;
    result.push({id:node.id,name:node.name,type:node.type,
      ...(typeof zone==='string'?{zone}:{}),
      ...(typeof sourceFeature==='string'?{sourceFeature}:{}),
      ...(typeof sourceId==='string'?{sourceId}:{}),
      ...(typeof osmId==='string'?{osmId}:{}),
      ...(Array.isArray(staticSector)?{staticSector:[...staticSector]}:{})});
  }
  return result;
}

function footprintCorrelations(point, buildings) {
  const matches=[];
  for (const feature of buildings) {
    const ring=feature.points;
    if (!ring||ring.length<4) continue;
    let inside=false, distance=Infinity;
    for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const [ax,,az]=ring[j],[bx,,bz]=ring[i],dx=bx-ax,dz=bz-az;
      if ((az>point.z)!==(bz>point.z)&&point.x<ax+dx*(point.z-az)/dz) inside=!inside;
      const t=MathUtils.clamp(((point.x-ax)*dx+(point.z-az)*dz)/(dx*dx+dz*dz||1),0,1);
      distance=Math.min(distance,Math.hypot(point.x-ax-t*dx,point.z-az-t*dz));
    }
    if (inside||distance<=2) matches.push({id:feature.id,name:feature.tags?.name??null,
      relation:inside||distance<1e-6?'projected inside footprint':'near footprint',distance:inside?0:round(distance)});
  }
  return matches.sort((a,b)=>a.distance-b.distance).slice(0,4);
}

function closestCollider(point, colliders) {
  let nearest=null, best=CORRELATION_DISTANCE;
  for (const [index,{type,args}] of colliders.entries()) {
    let horizontal, low, high, tag;
    if (type==='box') {
      const [x,z,halfWidth,halfDepth,yaw=0,yMin=-100,yMax=500,label='box']=args;
      const dx=point.x-x,dz=point.z-z,cos=Math.cos(yaw),sin=Math.sin(yaw);
      horizontal=Math.hypot(Math.max(0,Math.abs(dx*cos-dz*sin)-halfWidth),Math.max(0,Math.abs(dx*sin+dz*cos)-halfDepth));
      low=yMin;high=yMax;tag=label;
    } else if (type==='cylinder') {
      const [x,z,radius,yMin=-100,yMax=500,label='col']=args;
      horizontal=Math.max(0,Math.hypot(point.x-x,point.z-z)-radius);
      low=yMin;high=yMax;tag=label;
    } else continue;
    const distance=Math.hypot(horizontal,Math.max(0,low-point.y,point.y-high));
    if (distance<best) {best=distance;nearest={index,type,tag,distance:round(distance),basis:'distance to collider volume'};}
  }
  return nearest;
}

function closestInteractable(point, interactables) {
  let nearest=null, best=CORRELATION_DISTANCE;
  const origin=new Vector3();
  for (const object of interactables) {
    const action=object.userData.interactable;
    if (!action) continue;
    let visible=true;
    for (let node=object;node;node=node.parent) if (!node.visible) {visible=false;break;}
    if (!visible) continue;
    object.getWorldPosition(origin);
    const distance=origin.distanceTo(point);
    if (distance<best) {best=distance;nearest={id:object.id,name:object.name,title:action.title??null,point:coords(origin),distance:round(distance),basis:'distance to interactable origin'};}
  }
  return nearest;
}

function triangleRecord(hit, direction) {
  const object=hit.object,instanceId=hit.instanceId??null,batchId=hit.batchId??null;
  const matrix=object.matrixWorld.clone();
  if (instanceId!==null||batchId!==null) {const local=new Matrix4();object.getMatrixAt(instanceId??batchId,local);matrix.multiply(local);}
  const indices=[hit.face.a,hit.face.b,hit.face.c];
  const vertices=indices.map(index=>object.getVertexPosition(index,new Vector3()).applyMatrix4(matrix));
  const normal=new Triangle(...vertices).getNormal(new Vector3());
  const horizontal=Math.hypot(normal.x,normal.z);
  return {index:hit.faceIndex,indices,vertices:vertices.map(coords),instanceId,batchId,orientation:{
    normal:coords(normal),yawDegrees:horizontal>1e-6?round(MathUtils.radToDeg(Math.atan2(normal.x,normal.z))):null,
    slopeDegrees:round(MathUtils.radToDeg(Math.acos(Math.min(1,Math.abs(normal.y))))),
    facesCamera:normal.dot(direction)<0
  }};
}

const materialAt = hit => Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex]:hit.object.material;
const visibleMaterial = material => material?.visible&&!((material.transparent||material.alphaTest>0)&&material.opacity<=0);

export function createSurfacePicker({scene,camera,assembly,features,exclude=[],maxDistance=45}) {
  const raycaster=new Raycaster(),pointer=new Vector2(),hits=[];
  const limit=Number.isFinite(maxDistance)?MathUtils.clamp(maxDistance,0,MAX_DISTANCE):45;
  return function pick({ndc=[0,0]}={}) {
    if (!Array.isArray(ndc)||ndc.length!==2||ndc.some(n=>!Number.isFinite(n)||Math.abs(n)>1)) return null;
    const exclusions=new Set(typeof exclude==='function'?exclude():exclude);
    scene.updateMatrixWorld();camera.updateWorldMatrix(true,false);
    raycaster.layers.mask=camera.layers.mask;
    raycaster.near=Math.max(camera.near,0);
    raycaster.far=Math.min(camera.far,limit);
    raycaster.setFromCamera(pointer.fromArray(ndc),camera);
    const ray={ndc:[...ndc],origin:coords(raycaster.ray.origin),direction:coords(raycaster.ray.direction),maxDistance:raycaster.far,
      visibility:'CPU mesh intersection; fragment visibility depends on the material shader'};
    let nearest=null;
    scene.traverseVisible(object=>{
      if (!object.isMesh||!object.layers.test(camera.layers)||excluded(object,exclusions)) return;
      const materials=Array.isArray(object.material)?object.material:[object.material];
      if (!materials.some(visibleMaterial)) return;
      hits.length=0;
      raycaster.intersectObject(object,false,hits);
      const hit=hits.find(hit=>hit.face&&visibleMaterial(materialAt(hit)));
      if (hit&&(!nearest||hit.distance<nearest.distance)) {nearest=hit;raycaster.far=hit.distance;}
    });
    if (!nearest) return {ray,hit:null};
    const {object,point}=nearest, material=materialAt(nearest), ancestors=ancestry(object,scene);
    const staticBatch=ancestors.find(item=>item.staticSector);
    const owner=staticBatch??ancestors.find(item=>item.zone||item.sourceFeature||item.sourceId||item.osmId)??ancestors.slice(1).find(item=>item.name)??ancestors[0];
    return {ray,hit:{point:coords(point),distance:round(nearest.distance),object:ancestors[0],owner,
      ownerEvidence:staticBatch?'visible static batch; source mesh unavailable':'scene ancestry',ancestors,
      triangle:triangleRecord(nearest,raycaster.ray.direction),
      material:{id:material.id,name:material.name,type:material.type,index:nearest.face.materialIndex,color:material.color?.getHexString()??null},
      proximity:{footprints:footprintCorrelations(point,features?.buildings??[]),
        collider:closestCollider(point,assembly?.colliders??[]),interactable:closestInteractable(point,assembly?.legacy?.interactables??[])}}};
  };
}

export function installSurfacePickAudit({element,onPick=()=>{},isBlocked=()=>false,...options}) {
  const doc=element.ownerDocument,pickSurface=createSurfacePicker(options);
  let disposed=false;
  function pick(position) {
    if (disposed||isBlocked()) return null;
    const result=pickSurface(position);
    if (result) onPick(result);
    return result;
  }
  function onKey(event) {
    if (event.code!=='KeyI'||event.repeat||event.altKey||event.metaKey||event.ctrlKey||
      event.target?.closest?.('input,select,textarea,[contenteditable]:not([contenteditable="false"])')||isBlocked()) return;
    event.preventDefault();pick();
  }
  function onPointer(event) {
    if (!event.altKey||event.button!==0||isBlocked()) return;
    event.preventDefault();event.stopImmediatePropagation();
    if (doc.pointerLockElement===element) {pick();return;}
    const rect=element.getBoundingClientRect();
    pick({ndc:[(event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2]});
  }
  doc.addEventListener('keydown',onKey);
  element.addEventListener('pointerdown',onPointer,true);
  return {pick,dispose() {
    disposed=true;
    doc.removeEventListener('keydown',onKey);
    element.removeEventListener('pointerdown',onPointer,true);
  }};
}
