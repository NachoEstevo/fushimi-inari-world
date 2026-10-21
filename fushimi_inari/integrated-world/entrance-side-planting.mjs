import * as THREE from 'three';
import {entryWallRuns,entryGardenTiers} from './entrance-layout.mjs';

// R52 inspected rgcocc/20220924195102 shows two clipped terrace hedges behind
// Temizuya. Photo_2 keeps stair/lantern flanks gravel. Only existing authored soil
// tiers receive added plants; plant species, density and heights are inferred.
export function buildEntranceSidePlanting(root,romon){
  if(!romon)return null;
  const group=new THREE.Group();group.name='Entrance perimeter bed understory';
  const leafGeometry=new THREE.BufferGeometry(),positions=[];
  // Three small, pointed evergreen leaves per spray, no transparent cards or
  // round crown shells. A small centre ridge catches light on each leaf face.
  for(let leaf=0;leaf<3;leaf++){
    const a=leaf*2.39996,cx=Math.cos(a)*.044,cz=Math.sin(a)*.044;
    const tip=[cx+Math.cos(a)*.09,.025+leaf*.017,cz+Math.sin(a)*.09];
    const left=[cx+Math.sin(a)*.033,leaf*.017,cz-Math.cos(a)*.033];
    const right=[cx-Math.sin(a)*.033,leaf*.017,cz+Math.cos(a)*.033];
    const stem=[cx-Math.cos(a)*.045,leaf*.017,cz-Math.sin(a)*.045];
    const ridge=[cx,.022+leaf*.017,cz];
    for(const triangle of [[stem,left,ridge],[left,tip,ridge],[tip,right,ridge],[right,stem,ridge]])for(const p of triangle)positions.push(...p);
  }
  leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));leafGeometry.computeVertexNormals();
  const leafMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.93,side:THREE.DoubleSide});
  const shrubs=[],cover=[];let seed=40217;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const [start,end] of entryWallRuns)for(const {front,back,top} of entryGardenTiers){
    // Front-edge soil remains legible. Rear sprays rise above the existing low
    // clipped hedge; their centres and entire leaf extents stay inside each bed.
    const innerStart=start+.28,innerEnd=end-.28;
    const shrubCount=Math.floor((innerEnd-innerStart)/.72);
    for(let i=0;i<shrubCount;i++){
      const x=innerStart+(i+.5)*(innerEnd-innerStart)/shrubCount;
      const z=back+.38+(random()-.5)*.08,h=.34+random()*.23;
      for(let n=0;n<48;n++){
        const angle=n*2.39996,r=Math.sqrt(random()),v=random();
        shrubs.push([x+Math.cos(angle)*r*.23,top-.05+v*h,z+Math.sin(angle)*r*.12,random()*6.28,.80+random()*.44]);
      }
    }
    const count=Math.ceil((end-start)*(front-back)*15);
    for(let i=0;i<count;i++){
      const x=innerStart+random()*(innerEnd-innerStart),z=back+.20+random()*(front-back-.40);
      cover.push([x,top-.07+random()*.045,z,random()*6.28,.58+random()*.24]);
    }
  }
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  const batch=(plants,name,lightness)=>{
    const mesh=new THREE.InstancedMesh(leafGeometry,leafMaterial,plants.length);
    plants.forEach(([x,y,z,yaw,scale],i)=>{
      dummy.position.set(x,y,z);dummy.rotation.set(Math.sin(i)*.28,yaw,Math.cos(i)*.18);dummy.scale.setScalar(scale);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);color.setHSL(.24+(i%5)*.007,.23+(i%4)*.025,lightness+(i%7)*.012);mesh.setColorAt(i,color);
    });
    mesh.name=name;mesh.receiveShadow=true;mesh.castShadow=false;mesh.computeBoundingSphere();group.add(mesh);
  };
  batch(shrubs,'Irregular evergreen understory behind existing clipped hedge',.17);
  batch(cover,'Fine low groundcover confined to existing terrace soil',.20);
  // Same canonical local-to-world transform as buildEntranceBoundaries; no new
  // collider or terrain surface is needed within those already blocked beds.
  group.position.fromArray(romon.target);group.rotation.y=romon.yaw;
  group.translateX(-romon.source[0]);group.translateY(-romon.source[1]);group.translateZ(-romon.source[2]);root.add(group);
  const metadata={beds:entryWallRuns.length*entryGardenTiers.length,shrubSprays:shrubs.length,groundcoverSprays:cover.length,
    provenance:'R52 Temizuya photo rgcocc/20220924195102; user photo_2 gravel stair flank. Leaves stay inside existing inferred entryGardenTiers; botanical placement and height inferred.'};
  group.userData.provenance=metadata;return metadata;
}
