import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';
import {evergreenCanopy} from './evergreen-canopy.mjs';

function mappedPineNeedleTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');let seed=647063;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  ctx.lineCap='round';
  for(let fan=0;fan<14;fan++){
    const x=23+random()*82,y=23+random()*82,heading=random()*Math.PI*2;
    ctx.strokeStyle='#7d8456';ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(x-Math.cos(heading)*9,y-Math.sin(heading)*9);ctx.lineTo(x,y);ctx.stroke();
    for(let needle=0;needle<24;needle++){
      const angle=heading+(random()-.5)*4.7,length=9+random()*19;
      ctx.strokeStyle=needle%3===0?'#b5bc83':needle%3===1?'#8a9c61':'#667c45';ctx.lineWidth=.8+random()*.6;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length);ctx.stroke();
    }
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map;
}

// Exact OSM roots, inferred mature crowns. No new islands, lawn or forest fill.
export function buildEntranceMappedTrees(root,data,features,surfaces,colliders){
  const nodes=(data.greenery??[]).filter(n=>n.tags?.natural==='tree'&&n.point);
  const group=new THREE.Group();group.name='Mapped entrance specimen trees';
  const branches=[],crowns=[],pineCrowns=[],built=[],skipped=[],dummy=new THREE.Object3D();
  const barkMap=new THREE.TextureLoader().load(new URL('../assets/textures/nanobanana/bark_mossy_roots_color.png',import.meta.url).href);
  barkMap.colorSpace=THREE.SRGBColorSpace;barkMap.wrapS=barkMap.wrapT=THREE.RepeatWrapping;barkMap.repeat.set(1,5);barkMap.anisotropy=4;
  const up=new THREE.Vector3(0,1,0),bark=new THREE.MeshStandardMaterial({color:'#aaa699',map:barkMap,bumpMap:barkMap,bumpScale:.05,roughness:1});
  // Keep the generator's green per-leaf pigment and brown twigs. Disabling
  // vertex colors exposed the pale mask texture and made every tree look white.
  const crown=evergreenCanopy(384),leaves=crown.material.clone();leaves.vertexColors=true;
  // The shared canopy generator compensates card size for its sample count:
  // merely increasing leafCount preserves almost the same sparse coverage.
  // Enlarge each six-vertex cutout spray around its own centre, retaining the
  // irregular 3D distribution and fine outline while closing the see-through gaps.
  const positions=crown.geometry.attributes.position;
  for(let first=48;first<positions.count;first+=6){
    const center=new THREE.Vector3();
    for(let j=0;j<6;j++)center.add(new THREE.Vector3().fromBufferAttribute(positions,first+j));
    center.multiplyScalar(1/6);
    for(let j=0;j<6;j++){
      const point=new THREE.Vector3().fromBufferAttribute(positions,first+j).sub(center).multiplyScalar(1.85).add(center);
      positions.setXYZ(first+j,point.x,point.y,point.z);
    }
  }
  positions.needsUpdate=true;crown.geometry.computeVertexNormals();crown.geometry.computeBoundingSphere();
  const stem=(a,b,r)=>{
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va);
    dummy.position.copy(va).add(vb).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,d.clone().normalize());dummy.scale.set(r,d.length(),r);dummy.updateMatrix();branches.push(dummy.matrix.clone());
  };
  for(const node of nodes){
    const [x,z]=node.point;
    if(colliders.some(c=>c.type==='cylinder'&&['tree','forest_tree','mapped_entrance_tree'].includes(c.args.at(-1))&&Math.hypot(c.args[0]-x,c.args[1]-z)<1.2)){
      skipped.push({id:node.id,reason:'Existing detailed tree root within1.2m'});continue;
    }
    const index=built.length,camphor=node.tags.species==='Cinnamomum camphora',pine=node.tags.genus==='Pinus';
    const tagged=parseFloat(node.tags.height),height=Number.isFinite(tagged)&&tagged>2?tagged:camphor?9.4:7.3+(index%4)*.57;
    const y=surfaces.terrainHeight(x,z);if(!Number.isFinite(y))throw Error('Nonfinite mapped tree ground '+node.id);
    let clearance=Infinity;
    for(const path of features.paths){
      const half=pathWidth(path.tags)/2;
      for(let i=1;i<path.points.length;i++){
        const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
        clearance=Math.min(clearance,Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz)-half);
      }
    }
    const radius=Math.max(.065,Math.min(camphor?.34:.22,clearance-.12));
    const lean=.20*Math.sin(index*2.3),forkY=y+height*.57;
    stem([x,y-.04,z],[x+lean,forkY,z+.10],radius);
    if(pine)stem([x+lean,forkY,z+.10],[x+lean*.6,y+height*.88,z+.12],radius*.52);
    if(pine){
      // IMG_6470 shows dense radial needles at irregular horizontal branch ends,
      // with exposed trunk gaps between tiers, rather than broad leaf lobes.
      for(let tier=0;tier<5;tier++){
        const cy=y+height*(.40+tier*.13),reach=1.9-tier*.16;
        for(let arm=0;arm<3;arm++){
          const angle=arm*Math.PI*2/3+tier*.87+index*.77,r=reach*.48;
          const cx=x+Math.cos(angle)*r+Math.sin(tier*2.1)*.20,cz=z+Math.sin(angle)*r*.8,rise=Math.sin(angle*1.8)*.15;
          stem([x+lean,cy-.30,z+.10],[cx,cy+rise-.12,cz],radius*(.27-tier*.025));
          dummy.position.set(cx,cy+rise,cz);dummy.rotation.set(Math.sin(angle)*.30,angle,Math.cos(angle)*.24);
          dummy.scale.set(reach*.76,.55+(arm%2)*.15,reach*.64);dummy.updateMatrix();pineCrowns.push(dummy.matrix.clone());
        }
      }
    }
    const count=pine?0:camphor?7:5,spread=camphor?3.2:2.6;
    for(let k=0;k<count;k++){
      const angle=k*2.39996+index*.77,r=k===0?0:spread*(.48+(k%3)*.12);
      const cx=x+Math.cos(angle)*r,cz=z+Math.sin(angle)*r,cy=y+height*(.69+(k%3)*.055);
      stem([x+lean,forkY,z+.10],[cx,cy-.14,cz],radius*.34);
      dummy.position.set(cx,cy,cz);dummy.rotation.set(.15*Math.sin(k+index),angle,.12*Math.cos(k-index));
      // Small deterministic asymmetry avoids identical crown lobes while
      // retaining the established broadleaf coverage and source root.
      const taper=.93+.08*Math.sin(k*2.1+index*.73);
      dummy.scale.set(spread*(.63+(k%2)*.1)*taper,height*.25,spread*(.56+(k%3)*.06)*taper);dummy.updateMatrix();crowns.push(dummy.matrix.clone());
    }
    if(clearance>.12)colliders.push({type:'cylinder',args:[x,z,radius,y,y+height*.65,'mapped_entrance_tree']});
    built.push({id:node.id,root:[x,y,z],height,heightSource:Number.isFinite(tagged)?'OSM height tag':'visual estimate',species:node.tags.species??node.tags.genus??'unspecified',appearance:pine?'mapped Pinus, photo-informed irregular branch tiers with radial needle cutouts':camphor?'mapped camphor, inferred dense pruned crown':'inferred dense pruned broadleaf crown',pathClearance:clearance,colliderRadius:clearance>.12?radius:0});
  }
  if(branches.length){
    const mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.72,1,1,8),bark,branches.length);branches.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;mesh.name='Mapped tree trunks and exposed branching';mesh.computeBoundingSphere();group.add(mesh);
  }
  if(crowns.length){
    const mesh=new THREE.InstancedMesh(crown.geometry,leaves,crowns.length),color=new THREE.Color();
    crowns.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,color.setHSL(.24+(i%4)*.006,.10,.72+(i%5)*.035));});
    mesh.castShadow=false;mesh.receiveShadow=true;mesh.name='Mapped tree leafy crowns and open pine tiers';mesh.computeBoundingSphere();group.add(mesh);
  }
  if(pineCrowns.length){
    const pine=evergreenCanopy(96),pineMaterial=pine.material.clone();pineMaterial.vertexColors=true;
    pineMaterial.map=mappedPineNeedleTexture();pineMaterial.alphaTest=.25;
    const mesh=new THREE.InstancedMesh(pine.geometry,pineMaterial,pineCrowns.length);
    pineCrowns.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.castShadow=false;mesh.receiveShadow=true;mesh.name='Mapped Pinus fine radial needle branch tiers';mesh.computeBoundingSphere();group.add(mesh);
  }
  root.add(group);const metadata={trees:built,skipped,drawBatches:group.children.length,crownSpraysPerCluster:384,sprayCoverageScale:1.85,
    pineClusters:pineCrowns.length,pineSpraysPerCluster:96,
    triangles:branches.length*32+crowns.length*(384*2+16)+pineCrowns.length*(96*2+16),
    provenance:'entrance-context-r55.json exact OSM tree node roots and available botanical tags. IMG_6470_20210313 informs pine needle fans, open branch tiers and grey textured bark; heights and crown spread remain inferred. No tree coordinates invented.'};group.userData.provenance=metadata;return metadata;
}
