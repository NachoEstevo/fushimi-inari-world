import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const near=(a,b)=>Math.abs(a-b)<1e-6;
// IMG_6959_20210312: granite tapered pedestal, vermilion mesh case, dark fox,
// curved oxidized-green roof. Appearance sourced; metre dimensions inferred.
export function refineByakkoDetails(object,materials){
  if(!object?.isGroup||object.userData.zone!=='byakko')return null;
  if(object.userData.byakkoDetails)return object.userData.byakkoDetails;
  const hasBox=(w,h,d)=>object.children.some(c=>{const p=c.geometry?.parameters;return p&&near(p.width,w)&&near(p.height,h)&&near(p.depth,d);});
  if(!hasBox(4.6,.45,4.2)||!hasBox(3.4,2.65,3))return null;
  const cones=object.children.filter(c=>c.geometry?.type==='ConeGeometry'&&near(c.geometry.parameters.radius,.22)&&near(c.geometry.parameters.height,.68)&&near(Math.abs(c.position.x),1.4)&&near(c.position.y,.82)&&near(c.position.z,2.15));
  const bibs=object.children.filter(c=>{const p=c.geometry?.parameters;return c.geometry?.type==='CylinderGeometry'&&near(p.radiusTop,.16)&&near(p.radiusBottom,.20)&&near(p.height,.18)&&near(Math.abs(c.position.x),1.4)&&near(c.position.y,.72)&&near(c.position.z,2.15);});
  // The photograph establishes one caged statue, not two loose cone foxes.
  // Retire only the complete inherited placeholder pair; unrelated foxes stay.
  let removedPlaceholders=0;
  const retirePlaceholders=cones.length===2&&bibs.length===2;
  const group=new THREE.Group();group.name='Byakko photographed granite pedestal and fox case';group.position.set(-3.15,0,2.10);
  const stone=(materials.entryStoneMat??materials.stoneMat).clone();stone.color.set('#9b9d8e');stone.roughness=.96;
  const red=materials.vermilionMat??new THREE.MeshStandardMaterial({color:'#b83523',roughness:.82});
  const roof=new THREE.MeshStandardMaterial({color:'#304f49',roughness:.81,metalness:.3,side:THREE.DoubleSide});
  const dark=new THREE.MeshStandardMaterial({color:'#29302b',roughness:.97});
  const gold=materials.goldMat??new THREE.MeshStandardMaterial({color:'#b8a15b',roughness:.55,metalness:.45});
  const batches=new Map(),put=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>put(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  // Original flat platform remains untouched. This new assembly sits beside
  // it: a full photographed plinth cannot fit the inherited .6m side strips.
  box(1.50,.16,1.42,0,.08,0,stone);
  const taper=new THREE.CylinderGeometry(.80,1.025,1.52,4,1,false).rotateY(Math.PI/4);taper.scale(1,1,.95);taper.translate(0,.92,0);put(taper,stone);
  box(1.40,.21,1.32,0,1.75,0,stone);box(1.18,.12,1.12,0,1.915,0,stone);
  // Subtle horizontal masonry seam, no invented inscription or donor text.
  box(1.18,.014,1.10,0,1.02,0,stone);
  const bottom=1.98,top=3.27;
  box(1.14,.10,1.08,0,bottom+.05,0,red);
  for(const x of [-.49,.49])for(const z of [-.46,.46])box(.095,top-bottom,.095,x,(top+bottom)/2,z,red);
  for(const y of [top-.13,top+.04]){
    box(1.17,.12,.12,0,y,-.48,red);box(1.17,.12,.12,0,y,.48,red);
    box(.12,.12,.96,-.52,y,0,red);box(.12,.12,.96,.52,y,0,red);
  }
  box(.98,1.12,.045,0,2.62,-.49,red);
  // Actual fine diamond wire is an open mesh; it must not become opaque glass.
  const wires=[];
  const face=(axis,fixed)=>{
    for(const sign of [-1,1])for(let k=-22;k<=22;k++){
      const c=k*.075;
      // Clip y = sign*u + c + 2.6 against the rectangular case aperture.
      const candidates=[[-.445,sign*-.445+c+2.6],[.445,sign*.445+c+2.6],[(2.10-c-2.6)/sign,2.10],[(3.09-c-2.6)/sign,3.09]].filter(([u,y])=>u>=-.445-1e-6&&u<=.445+1e-6&&y>=2.10-1e-6&&y<=3.09+1e-6);
      if(candidates.length<2)continue;
      for(const [u,y]of [candidates[0],candidates.at(-1)])wires.push(...(axis==='x'?[fixed,y,u]:[u,y,fixed]));
    }
  };
  face('z',.482);face('x',-.512);face('x',.512);
  const wireGeo=new THREE.BufferGeometry();wireGeo.setAttribute('position',new THREE.Float32BufferAttribute(wires,3));
  const wireMesh=new THREE.LineSegments(wireGeo,new THREE.LineBasicMaterial({color:'#414a40'}));wireMesh.name='Open fine diamond wire case';group.add(wireMesh);
  // Seated fox is a restrained silhouette behind wire, not a textured cone.
  put(new THREE.SphereGeometry(.23,12,8).scale(.8,1.35,.83).translate(0,2.42,0),dark);
  put(new THREE.SphereGeometry(.15,12,8).scale(.85,1,1.08).translate(0,2.78,.06),dark);
  put(new THREE.ConeGeometry(.075,.24,8).rotateX(Math.PI/2).translate(0,2.77,.23),dark);
  for(const x of [-.10,.10]){
    put(new THREE.ConeGeometry(.065,.20,4).translate(x,2.96,.03),dark);
    box(.07,.37,.085,x,2.25,.12,dark);
  }
  put(new THREE.TorusGeometry(.17,.065,7,14,Math.PI*1.5).rotateX(Math.PI/2).translate(.13,2.15,-.12),dark);
  box(.24,.15,.03,0,2.61,.18,red);
  // Continuous segmented green gable pitches, with raised corners/end ridges.
  const positions=[];
  const roofY=(x,z)=>3.36+.52*Math.pow(Math.max(0,1-Math.abs(x)/.86),1.35)+.11*Math.pow(Math.abs(x)/.86,6)+.075*Math.pow(Math.abs(z)/.76,6);
  for(const side of [-1,1])for(let ix=0;ix<12;ix++)for(let iz=0;iz<12;iz++){
    const a=side*ix*.86/12,b=side*(ix+1)*.86/12,z0=-.76+iz*1.52/12,z1=z0+1.52/12;
    for(const [x,z]of [[a,z0],[b,z0],[b,z1],[a,z0],[b,z1],[a,z1]])positions.push(x,roofY(x,z),z);
  }
  const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));roofGeo.setAttribute('uv',new THREE.Float32BufferAttribute(positions.flatMap((v,i)=>i%3===0?[v,positions[i+2]]:[]),2));roofGeo.computeVertexNormals();put(roofGeo,roof);
  box(.13,.13,1.64,0,3.93,0,roof);
  for(const z of [-.78,.78])for(const side of [-1,1]){
    for(let i=0;i<12;i++){
      const x0=side*i*.86/12,x1=side*(i+1)*.86/12,y0=roofY(x0,z)-.055,y1=roofY(x1,z)-.055;
      const beam=new THREE.BoxGeometry(Math.hypot(x1-x0,y1-y0),.075,.075).rotateZ(Math.atan2(y1-y0,x1-x0)).translate((x0+x1)/2,(y0+y1)/2,z);put(beam,red);
    }
  }
  for(const x of [-.72,-.48,-.24,0,.24,.48,.72])for(const z of [-.65,.65])box(.055,.065,.10,x,roofY(x,z)-.08,z,gold);
  for(const [mat,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  object.add(group);
  if(retirePlaceholders)for(const c of [...cones,...bibs]){c.removeFromParent();removedPlaceholders++;}
  const metadata={source:'https://fushimiinari-guide.com/wp-content/uploads/IMG_6959_20210312.jpg',removedPlaceholders,
    dimensions:'inferred: 1.50 x 1.42m base, 3.995m total height; visual proportions only',localPosition:group.position.toArray(),
    placementRisk:'Photo establishes front-left relationship, not mapped station. Source podium side strips too narrow; accessory placed outside inherited podium at x=-3.15,z=2.10. Requires mapped-route and terrace visual clearance review.',
    proposedLocalCollider:{type:'box',args:[-3.15,2.10,.75,.71,0,0,4.05,'byakko_fox_case']},materialBatches:batches.size,wireSegments:wires.length/6};
  object.userData.byakkoDetails=metadata;return metadata;
}

// Called after geographic remapping. Geometry, footing and collision share the
// same world transform rather than independently copying source coordinates.
export function seatByakkoDetails(root,surfaces,colliders){
  const group=root.getObjectByName('Byakko photographed granite pedestal and fox case');
  if(!group)return null;
  const report=group.parent.userData.byakkoDetails;
  if(report.seated)return report;
  group.updateWorldMatrix(true,false);
  const center=group.localToWorld(new THREE.Vector3());
  const corners=[[-.75,-.71],[.75,-.71],[-.75,.71],[.75,.71]].map(([x,z])=>group.localToWorld(new THREE.Vector3(x,0,z)));
  const heights=corners.map(p=>surfaces.height(p.x,p.z));
  if(heights.some(y=>!Number.isFinite(y)))throw Error('Nonfinite Byakko footing height');
  const low=Math.min(...heights)-.04,top=Math.max(...heights)+.01;
  const target=group.parent.worldToLocal(new THREE.Vector3(center.x,top,center.z));group.position.copy(target);
  const material=group.children.find(c=>c.isMesh&&c.material.roughness===.96)?.material;
  const support=new THREE.Mesh(new THREE.BoxGeometry(1.5,top-low,1.42),material);
  support.name='Terrain seated granite footing';support.position.y=-(top-low)/2;support.receiveShadow=true;group.add(support);
  group.updateWorldMatrix(true,false);
  const e=group.matrixWorld.elements,yaw=Math.atan2(e[8],e[10]);
  colliders.push({type:'box',args:[center.x,center.z,.75,.71,yaw,low,top+4.05,'byakko_fox_case']});
  Object.assign(report,{seated:true,worldCenter:[center.x,top,center.z],footingBottom:low,terrainSpan:top-low});
  return report;
}
