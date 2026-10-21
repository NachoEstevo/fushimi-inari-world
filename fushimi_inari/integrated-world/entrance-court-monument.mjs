import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const entranceCourtMonumentId='node/10236493859';
const sourcePhoto='https://fushimiinari-guide.com/wp-content/uploads/IMG_5726_20210313.jpg';

// The mapped stele is distinct from the legacy first-torii monument. Its photo
// shows a narrow granite shaft seated in irregular masonry, not a tiled plinth.
export function buildEntranceCourtMonument(root,features,surfaces,materials,colliders){
  if(root.getObjectByName('Mapped shrine court granite monument'))return null;
  const poi=features.pois.find(p=>p.id===entranceCourtMonumentId);
  if(!poi||poi.tags.inscription!=='官幣大社　稲荷神社')return null;
  const [x,,z]=poi.point;
  const samples=[[-.60,-.43],[.60,-.43],[-.60,.43],[.60,.43],[0,0]].map(([dx,dz])=>surfaces.height(x+dx,z+dz));
  if(!samples.every(Number.isFinite))throw Error('Nonfinite court monument ground');
  const low=Math.min(...samples)-.10,seat=Math.max(...samples),baseTop=seat+.44;
  const group=new THREE.Group();group.name='Mapped shrine court granite monument';
  const stone=(materials.entryStoneMat??materials.stoneMat).clone();stone.color.set('#a0a18f');stone.roughness=1;
  const rockMat=stone.clone();rockMat.color.set('#72796c');
  // Shaft and restrained cap share a single static mesh. All dimensions are
  // photographic estimates; X/Z alone is sourced, and terrain owns the seat.
  const parts=[new THREE.BoxGeometry(.46,2.92,.37).translate(x,baseTop+1.46,z),
    new THREE.BoxGeometry(1.06,.10,.73).translate(x,baseTop-.045,z),
    new THREE.BoxGeometry(.92,Math.max(.1,seat-low+.24),.62).translate(x,(low+seat+.24)/2,z)];
  const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  const shaft=new THREE.Mesh(geometry,stone);shaft.castShadow=true;shaft.receiveShadow=true;group.add(shaft);
  const rockGeo=new THREE.IcosahedronGeometry(1,0),rocks=new THREE.InstancedMesh(rockGeo,rockMat,9),dummy=new THREE.Object3D();
  for(let i=0;i<9;i++){
    const angle=i/9*Math.PI*2,rx=x+Math.cos(angle)*.45,rz=z+Math.sin(angle)*.31;
    const ground=surfaces.height(rx,rz);if(!Number.isFinite(ground))throw Error('Nonfinite court monument footing');
    dummy.position.set(rx,(ground-.06+baseTop-.03)/2,rz);
    dummy.rotation.set(.12*Math.sin(i*2),angle+.24,.10*Math.cos(i*3));
    dummy.scale.set(.27+(i%3)*.025,Math.max(.16,(baseTop-ground+.04)/2),.23);
    dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=true;rocks.receiveShadow=true;group.add(rocks);
  // The photograph and OSM inscription agree. Only that wording is rendered;
  // date, notice sticker and unreadable small lettering are not fabricated.
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1536;const ctx=canvas.getContext('2d');
    if(ctx){
      ctx.clearRect(0,0,256,1536);ctx.fillStyle='#484940';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='64px serif';
      [...'官幣'].forEach((s,i)=>ctx.fillText(s,180,110+i*95));
      [...'大社'].forEach((s,i)=>ctx.fillText(s,76,110+i*95));
      ctx.font='172px serif';[...'稲荷神社'].forEach((s,i)=>ctx.fillText(s,128,470+i*265));
      const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
      const face=new THREE.Mesh(new THREE.PlaneGeometry(.405,2.69),new THREE.MeshStandardMaterial({map,transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
      face.position.set(x,baseTop+1.54,z+.186);group.add(face);
    }
  }
  group.userData={sourceFeature:poi.id,sourcePhoto,inscription:poi.tags.inscription,
    placement:'Exact OSM X/Z; terrain-seated; south-facing inscription inferred toward avenue',
    dimensions:'Photo-estimated shaft .46 x 2.92 x .37 m and irregular base; not surveyed',
    adjacentLantern:'Not added: photograph does not independently locate its offset/orientation'};
  root.add(group);
  colliders.push({type:'box',args:[x,z,.64,.46,0,low,baseTop+2.92,'mapped_court_monument']});
  return {id:poi.id,position:[x,baseTop,z],...group.userData};
}
