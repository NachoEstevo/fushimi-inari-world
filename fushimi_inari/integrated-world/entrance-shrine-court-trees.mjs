import * as THREE from 'three';
import {evergreenCanopy} from './evergreen-canopy.mjs';
import {makeOmotesandoShoulderExclusion} from './omotesando-shoulders-layout.mjs';

// IMG_6470 supports mature tree silhouettes behind the three small shrines.
// Every root, height, species interpretation and branch is photo-estimated.
const trees=[
  {kind:'pine',root:[-83.6,-19.4],height:10.4},
  {kind:'pine',root:[-79.1,-19.6],height:11.2},
  {kind:'pine',root:[-75.4,-19.6],height:9.8},
  {kind:'broadleaf',root:[-69.9,-18.8],height:10.2},
];

// Needle fans replace the broad evergreen leaf silhouette on the three pines.
// A small deterministic cutout is generated locally; no new texture asset.
function pineNeedleTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');let seed=647062;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  ctx.lineCap='round';
  for(let fan=0;fan<13;fan++){
    const x=24+random()*80,y=24+random()*80,heading=random()*Math.PI*2;
    ctx.strokeStyle='#828b53';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(x-Math.cos(heading)*9,y-Math.sin(heading)*9);ctx.lineTo(x,y);ctx.stroke();
    for(let needle=0;needle<22;needle++){
      const angle=heading+(random()-.5)*4.8,length=10+random()*18;
      ctx.strokeStyle=needle%3===0?'#b2b779':needle%3===1?'#8b9b5e':'#657b44';ctx.lineWidth=.8+random()*.65;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length);ctx.stroke();
    }
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
}

export function buildEntranceShrineCourtTrees(root,features,surfaces,colliders){
  const excluded=makeOmotesandoShoulderExclusion(features,[-86,-68,-22,-16]);
  const wood=[],leaves=[],pineLeaves=[],reports=[],dummy=new THREE.Object3D();
  const beam=(a,b,r)=>{
    const delta=b.clone().sub(a);
    dummy.position.copy(a).add(b).multiplyScalar(.5);
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
    dummy.scale.set(r,delta.length(),r);dummy.updateMatrix();wood.push(dummy.matrix.clone());
  };
  const spray=(x,y,z,sx,sy,sz,angle,pine=false)=>{
    dummy.position.set(x,y,z);dummy.rotation.set(.34*Math.sin(angle),angle,.28*Math.cos(angle));
    dummy.scale.set(sx,sy,sz);dummy.updateMatrix();(pine?pineLeaves:leaves).push(dummy.matrix.clone());
  };
  trees.forEach(({kind,root:[x,z],height},index)=>{
    // These roots were checked against source enclosure/retaining linework:
    // minimum centreline distances are 1.40, 1.14, 1.10 and .70m respectively.
    // Radius .22m keeps trunks clear. Source building/path rejection is live.
    if(excluded(x,z,.3)){reports.push({kind,root:[x,z],omitted:'mapped footprint or path conflict'});return;}
    const ground=surfaces.terrainHeight(x,z);
    if(!Number.isFinite(ground))throw new Error('Nonfinite photo-estimated court tree ground');
    const point=(dx,y,dz)=>new THREE.Vector3(x+dx,ground+y,z+dz);
    beam(point(0,-.025,0),point(.10,height*.50,.04),.22);
    beam(point(.10,height*.50,.04),point(-.12,height*.78,.09),.135);
    beam(point(-.12,height*.78,.09),point(.12,height-.25,.03),.075);
    if(kind==='pine'){
      for(let tier=0;tier<5;tier++){
        const y=height*(.40+tier*.135),reach=2.35-tier*.22;
        const bias=Math.sin(index*1.9+tier*2.1)*.55;
        const arms=tier%2===0?5:4;
        for(let arm=0;arm<arms;arm++){
          const angle=arm*Math.PI*2/arms+tier*.91+index*.6;
          const dx=Math.cos(angle)*reach*.48+bias,dz=Math.sin(angle)*reach*.38;
          const rise=Math.sin(angle*2.1+tier)*.25;
          beam(point(-.05,y-.48,.04),point(dx,y+rise-.10,dz),.045-tier*.005);
          // Overlapping, tilted three-dimensional lobes keep the pine tier
          // open at its edges while avoiding a single nearly flat leaf sheet.
          spray(x+dx,ground+y+rise,z+dz,reach*.72,.56+(arm%3)*.13,reach*.60,angle,true);
        }
      }
    }else{
      for(let branch=0;branch<13;branch++){
        const angle=branch*2.3999632297,r=branch<8?1.35:.65;
        const dx=Math.cos(angle)*r,dz=Math.sin(angle)*r*.83,y=height-1.1-(branch%3)*.72;
        beam(point(.03,height*.53,.04),point(dx,y-.35,dz),.065);
        spray(x+dx,ground+y,z+dz,1.65,1.65,1.45,angle);
      }
    }
    colliders.push({type:'cylinder',args:[x,z,.25,ground,ground+height*.55,'photo_estimated_court_tree_trunk']});
    reports.push({kind,root:[x,ground,z],height,positionSource:'photo-estimated, not OSM'});
  });
  if(!leaves.length&&!pineLeaves.length)return null;
  const group=new THREE.Group();group.name='Photo-estimated mature tree backdrop behind entrance shrines';
  const barkMap=new THREE.TextureLoader().load(new URL('../assets/textures/nanobanana/bark_mossy_roots_color.png',import.meta.url).href);
  barkMap.colorSpace=THREE.SRGBColorSpace;barkMap.wrapS=barkMap.wrapT=THREE.RepeatWrapping;barkMap.repeat.set(1,5);barkMap.anisotropy=4;
  const bark=new THREE.MeshStandardMaterial({color:'#a9a79a',map:barkMap,bumpMap:barkMap,bumpScale:.055,roughness:1});
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.78,1,1,7),bark,wood.length);
  wood.forEach((matrix,i)=>trunks.setMatrixAt(i,matrix));
  trunks.name='Court tree trunks and open branches';trunks.castShadow=trunks.receiveShadow=true;trunks.computeBoundingSphere();group.add(trunks);
  const canopy=evergreenCanopy(64),leafMaterial=canopy.material.clone();leafMaterial.vertexColors=true;
  const pineMaterial=leafMaterial.clone();pineMaterial.map=pineNeedleTexture();pineMaterial.alphaTest=.25;
  const pineCrowns=new THREE.InstancedMesh(canopy.geometry,pineMaterial,pineLeaves.length);
  pineLeaves.forEach((matrix,i)=>pineCrowns.setMatrixAt(i,matrix));
  pineCrowns.name='Irregular open pine tiers with fine radial needle fans';pineCrowns.receiveShadow=true;pineCrowns.castShadow=false;pineCrowns.computeBoundingSphere();group.add(pineCrowns);
  const crowns=new THREE.InstancedMesh(canopy.geometry,leafMaterial,leaves.length);
  leaves.forEach((matrix,i)=>crowns.setMatrixAt(i,matrix));
  crowns.name='Fine cutout pine tiers and broadleaf crown sprays';crowns.castShadow=false;crowns.receiveShadow=true;crowns.computeBoundingSphere();group.add(crowns);
  const metadata={trees:reports,foliageInstances:leaves.length+pineLeaves.length,pineInstances:pineLeaves.length,woodInstances:wood.length,
    triangles:(leaves.length+pineLeaves.length)*(64*2+16)+wood.length*28,batches:3,
    provenance:'Directly inspected IMG_6470_20210313: radial pine needles, irregular open crowns, grey textured trunks, broadleaf backdrop and bare mineral court. All roots, heights and botanical forms photo-estimated. Rear understory ground is obscured in this photo, so no new shrubs, gardens or lawn inferred. No mapped-tree claims, lights or elevation changes.'};
  group.userData.provenance=metadata;root.add(group);return metadata;
}
