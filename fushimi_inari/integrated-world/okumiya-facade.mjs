import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {roofHeight} from './roof-profile.mjs';

// Rec Lab walking tour zFKeYi0AK0M, around 10:00: three dark front bays,
// suspended brass lanterns, layered eaves. Dimensions remain photo-inferred.
export function refineOkumiya(object,materials){
  if(object.userData.zone!=='okumiya'||!object.isGroup)return;
  // Front faces the mapped western stair, as in the approach video. Adapter
  // anchor yaw is -PI/2 + .06; cancel the old compressed-layout quarter turn.
  object.rotation.y=-.06;
  const wood=new THREE.MeshStandardMaterial({color:'#302824',roughness:.91});
  const trim=new THREE.MeshStandardMaterial({color:'#635249',roughness:.84});
  const pale=new THREE.MeshStandardMaterial({color:'#e0d8c7',roughness:.95,side:THREE.DoubleSide});
  const green=new THREE.MeshStandardMaterial({color:'#416f60',roughness:.9});
  const batches=new Map();
  const part=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  const beam=(a,b,r,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),geo=new THREE.CylinderGeometry(r,r,v.length(),7);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));geo.translate(...av.add(bv).multiplyScalar(.5).toArray());part(geo,mat);};
  // Nagare profile: a longer front slope within the retained roof envelope.
  const profile=z=>roofHeight(z>=-.55?(z+.55)/3.65:(z+.55)/2.55,1.22);
  const roofY=(x,z)=>3.20+profile(z-.28)+.12*Math.pow(Math.abs(x/3.9),6);

  const roof=object.children.find(c=>c.geometry?.parameters?.width===7.8);
  if(roof){
    const geo=new THREE.BoxGeometry(7.8,.20,6.2,12,1,32),p=geo.attributes.position;
    for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+profile(p.getZ(i))+.12*Math.pow(Math.abs(p.getX(i)/3.9),6));
    geo.computeVertexNormals();roof.geometry.dispose();roof.geometry=geo;roof.position.y=3.20;
    const ridge=object.children.find(c=>c.geometry?.parameters?.width===8);
    if(ridge){ridge.position.y=4.55;ridge.position.z=-.27;ridge.material=trim;}
    for(const x of [-2.8,2.8]){
      const vertices=[];
      for(let i=0;i<16;i++){
        const a=-1.9+i*3.8/16,b=-1.9+(i+1)*3.8/16;
        const ya=roofY(x,a),yb=roofY(x,b);
        vertices.push(x,3.42,a,x,ya,a,x,yb,b,x,3.42,a,x,yb,b,x,3.42,b);
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
      g.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap((_,i)=>i%3===0?[vertices[i+2],vertices[i+1]]:[]),2));part(g,pale);
    }
  }
  // Cover only the front plaster above the retained lower lattice; preserve
  // the authored walls, collision, veranda and interactable behind this skin.
  for(const x of [-1.8,0,1.8]){
    box(1.56,1.48,.045,x,2.35,1.925,wood);
    for(let j=-3;j<=3;j++)box(.035,1.48,.05,x+j*.20,2.35,1.963,trim);
    for(const y of [1.64,2.22,3.07])box(1.60,.055,.065,x,y,1.98,trim);
  }
  for(const y of [3.16,3.38])box(6.05,.14,.22,0,y,2.02,materials.vermilionMat);
  for(let i=0;i<33;i++){
    const x=-3.55+i*7.1/32;
    box(.065,.11,1.18,x,3.45,2.60,materials.vermilionMat);
    box(.075,.115,.07,x,3.45,3.20,pale);
  }
  for(const x of [-2.7,-.9,.9,2.7]){
    box(.42,.14,.45,x,3.06,2.03,materials.vermilionMat);
    box(.58,.13,.36,x,3.22,2.03,materials.vermilionMat);
  }
  // Replace the three unsupported spheres with complete suspended fittings.
  for(const c of [...object.children])if(c.geometry?.type==='SphereGeometry'&&c.geometry.parameters.radius===.18){c.removeFromParent();c.geometry.dispose();}
  for(const x of [-1.8,0,1.8]){
    box(.022,.50,.022,x,2.97,2.23,materials.goldMat);
    box(.28,.06,.28,x,2.72,2.23,materials.goldMat);
    box(.20,.22,.20,x,2.58,2.23,wood);
    box(.29,.065,.29,x,2.44,2.23,materials.goldMat);
    for(const dx of [-.105,.105])for(const dz of [-.105,.105])box(.028,.24,.028,x+dx,2.58,2.23+dz,materials.goldMat);
  }
  if(roof){
    // Front edge has a dark fascia under the bark, including lifted corners.
    for(let i=0;i<28;i++){
      const x0=-3.9+i*7.8/28,x1=-3.9+(i+1)*7.8/28,z=3.38;
      for(const offset of [-.035,-.12])beam([x0,roofY(x0,z)+offset,z],[x1,roofY(x1,z)+offset,z],.035,trim);
    }
    // Profile-following bargeboards along both side edges, rather than flat
    // strips which would cut through the curved roof or float above it.
    for(const x of [-3.87,3.87])for(let i=0;i<28;i++){
      const z0=-2.82+i*6.2/28,z1=-2.82+(i+1)*6.2/28;
      for(const offset of [-.035,-.105])beam([x,roofY(x,z0)+offset,z0],[x,roofY(x,z1)+offset,z1],.035,trim);
    }
    // Visible parallel red/white underside on the two gable ends.
    for(const side of [-1,1])for(let i=0;i<18;i++){
      const z=-1.75+i*3.50/17;
      box(.32,.045,.035,side*2.94,roofY(side*2.94,z)-.17,z,pale);
    }
  }
  // Photograph IMG6628 shows green header inserts and round gilt joinery
  // fittings. Keep relief plain: no invented crests or painted iconography.
  for(const x of [-1.8,0,1.8])box(1.40,.11,.035,x,3.01,2.155,green);
  for(const x of [-2.7,-.9,.9,2.7])for(const y of [.79,1.58,3.12]){
    const disc=new THREE.CylinderGeometry(.045,.045,.018,10).rotateX(Math.PI/2).translate(x,y,2.105);part(disc,materials.goldMat);
  }
  // Layered bracket blocks observed immediately beneath the main header.
  for(const x of [-2.7,-.9,.9,2.7]){
    box(.26,.12,.31,x,2.94,2.07,materials.vermilionMat);
    box(.40,.08,.26,x,2.85,2.07,materials.vermilionMat);
    box(.48,.035,.20,x,2.80,2.07,trim);
  }
  const counts=[];
  for(const [mat,parts]of batches){const geo=mergeGeometries(parts);counts.push({parts:parts.length,vertices:geo?.getAttribute('position').count??0});parts.forEach(g=>g.dispose());if(!geo)throw Error('Okumiya facade merge failed');const mesh=new THREE.Mesh(geo,mat);mesh.name='Okumiya photo-backed detail batch';mesh.castShadow=true;mesh.receiveShadow=true;object.add(mesh);}
  object.userData.okumiyaDetail={revision:'R65',sources:['https://inari.jp/vr/','https://fushimiinari-guide.com/okumiya/','https://fushimiinari-guide.com/wp-content/uploads/IMG_6628_20210309.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_6627_20210309.jpg'],estimatedDimensions:true,retainedEnvelope:[7.8,6.2],roofRidgeLocalZ:-.27,materialBatches:counts.length,batches:counts,limits:'Existing compressed base and facade proportions retained; painted and animal sculpture omitted rather than fabricated; no collision or terrain changes'};

}
