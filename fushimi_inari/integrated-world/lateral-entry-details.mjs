import * as THREE from 'three';
import {buildAzumamaroArchitecture} from './azumamaro-architecture.mjs?v=47b';

// OSM owns position and path direction. Street View June 2012 establishes
// the stone name pillar and red torii vocabulary; dimensions and the torii's
// station on this path remain visual estimates, not surveyed geometry.
export function buildLateralEntryDetails(root,features,surfaces,m,colliders){
  const marker=features.pois.find(p=>p.id==='node/10964871774');
  const path=features.paths.find(p=>p.id==='way/105449706');
  if(!marker||!path)return null;
  const group=new THREE.Group();group.name='Azumamaro mapped lateral entrance details';root.add(group);
  const stone=m.entryStoneMat;
  const red=new THREE.MeshStandardMaterial({color:'#ac321c',roughness:.76});
  const black=new THREE.MeshStandardMaterial({color:'#272623',roughness:.86});
  const box=(w,h,d,x,y,z,mat,parent=group)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  const [mx,,mz]=marker.point,my=surfaces.height(mx,mz);
  box(.66,.18,.58,mx,my+.09,mz,stone);
  box(.43,2.35,.38,mx,my+1.355,mz,stone);
  box(.48,.10,.43,mx,my+2.58,mz,stone);
  // Canvas is optional so the geometry can also be inspected headlessly.
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=768;
    const ctx=canvas.getContext('2d');
    if(ctx){
      ctx.fillStyle='#b1b3a8';ctx.fillRect(0,0,128,768);
      ctx.fillStyle='#373933';ctx.font='86px serif';ctx.textAlign='center';
      [...'東丸神社'].forEach((letter,i)=>ctx.fillText(letter,64,150+i*155));
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const face=new THREE.Mesh(new THREE.PlaneGeometry(.34,1.95),new THREE.MeshStandardMaterial({map:texture,roughness:.96}));
      face.position.set(mx,my+1.40,mz-.196);face.rotation.y=Math.PI;group.add(face);
    }
  }
  colliders.push({type:'box',args:[mx,mz,.33,.29,0,my,my+2.65,'azumamaro_stone_marker']});
  const a=path.points[1],b=path.points[0];
  const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
  if(length<1)return {marker:marker.id,torii:false};
  // The pillar marks the entrance. Place the gate just behind it on the
  // mapped approach; do not add another shrine or alter its building footprint.
  const station=5.1,cx=a[0]+dx/length*station,cz=a[2]+dz/length*station;
  const gate=new THREE.Group();gate.position.set(cx,surfaces.height(cx,cz),cz);
  gate.rotation.y=Math.atan2(dx,dz);gate.name='Azumamaro entrance torii (visually inferred station)';group.add(gate);
  for(const x of [-1.75,1.75]){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.15,.19,3.75,12),red);
    post.position.set(x,1.875,0);post.castShadow=true;gate.add(post);
    const p=new THREE.Vector3(x,0,0).applyMatrix4(gate.matrix.compose(gate.position,gate.quaternion,gate.scale));
    // The narrow slab path is higher than its gravel shoulders. Seat each
    // foot independently rather than floating both at the path centre height.
    const bottom=Math.min(0,surfaces.terrainHeight(p.x,p.z)-.06-gate.position.y);
    box(.39,.30-bottom,.39,x,(.30+bottom)/2,0,black,gate);
    colliders.push({type:'cylinder',args:[p.x,p.z,.21,gate.position.y,gate.position.y+3.8,'azumamaro_torii_post']});
  }
  box(4.34,.24,.25,0,2.98,0,red,gate);
  // June 2012 front view: a nearly level kasagi lifts subtly at its tips.
  // Both materials share the profile so the coping seats on the red beam.
  // Widths/heights are retained; the .10m tip lift is a visual estimate.
  const curvedKasagi=(width,height,depth,centerY,material)=>{
    const shape=new THREE.Shape(),segments=32;
    const lift=x=>.10*(Math.abs(x)/2.525)**4;
    for(let i=0;i<=segments;i++){
      const x=-width/2+width*i/segments,y=centerY+height/2+lift(x);
      if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
    }
    for(let i=segments;i>=0;i--){const x=-width/2+width*i/segments;shape.lineTo(x,centerY-height/2+lift(x));}
    shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1});geometry.translate(0,0,-depth/2);
    const mesh=new THREE.Mesh(geometry,material);mesh.name='Azumamaro gently lifted kasagi';mesh.castShadow=true;mesh.receiveShadow=true;gate.add(mesh);
  };
  curvedKasagi(4.85,.26,.44,3.72,red);
  curvedKasagi(5.05,.10,.49,3.90,black);
  box(.18,.63,.19,0,3.32,0,red,gate);
  const brass=new THREE.MeshStandardMaterial({color:'#aa9050',metalness:.55,roughness:.52});
  box(.58,.75,.09,0,3.27,-.18,brass,gate);
  box(.47,.63,.04,0,3.27,-.24,black,gate);
  const architecture=buildAzumamaroArchitecture(gate,surfaces,colliders,stone,features);
  const metadata={marker:marker.id,path:path.id,torii:[cx,gate.position.y,cz],
    architecture,
    provenance:'OSM marker and path; June 2012 Street View appearance; torii station and all dimensions inferred',
    preservedBuildings:['way/305214824','way/952687113']};
  group.userData.provenance=metadata;
  return metadata;
}
