import * as THREE from 'three';
import {materialColor,vec3,vec4} from 'three/tsl';
import {validSeason} from './season-palette.mjs?v=24';

export function installSeasons(assembly,canopy){
  const original=assembly.legacy.foliage[2].material,meshes=[];
  const maple=original.isMeshPhysicalMaterial?new THREE.MeshPhysicalNodeMaterial():new THREE.MeshStandardNodeMaterial();
  const Type=original.isMeshPhysicalMaterial?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;
  Type.prototype.copy.call(maple,original);
  assembly.legacy.foliage[2].material=maple;
  assembly.root.traverse(o=>{if(o.material===original)o.material=maple;if(o.isInstancedMesh&&(o.material===maple||o.userData.seasonalMaple))meshes.push(o);});
  // Retain the old leaf alpha/normal maps and remove their baked red pigment.
  // NodeMaterial still applies instance tint after colorNode, preserving the
  // per-tree seasonal palette and the original leaf alpha and normal maps.
  maple.colorNode=vec4(vec3(materialColor.rgb.dot(vec3(.299,.587,.114)).mul(1.7)),materialColor.a);
  maple.needsUpdate=true;
  const select=document.createElement('select');select.id='season';select.setAttribute('aria-label','Season');
  for(const [value,text] of [['spring','Spring · fresh greens'],['autumn','Autumn · gold and amber']])select.add(new Option(text,value));
  const label=document.createElement('label');label.htmlFor='season';label.textContent='Season';
  const pane=document.getElementById('scene-settings');pane.prepend(label,select);
  let saved='spring';try{saved=validSeason(localStorage.getItem('inari-season'));}catch{}
  const tint=new THREE.Color();
  const apply=()=>{
    const season=validSeason(select.value);canopy.setSeason(season);
    meshes.forEach((mesh,j)=>{
      const sourceGroup=mesh.userData.seasonSourceGroup??j;
      for(let i=0;i<mesh.count;i++){
        const sourceIndex=mesh.userData.seasonSourceIndices?.[i]??mesh.userData.partitionSourceIndices?.[i]??i;
        const n=(Math.sin(sourceIndex*12.9898+sourceGroup*31.1)*43758.5453)%1,t=Math.abs(n);
        tint.setHSL(season==='spring'?.23+t*.07:.025+t*.105,season==='spring'?.48:.78,.43+t*.15,THREE.SRGBColorSpace);
        mesh.setColorAt(i,tint);
      }
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    });
    document.body.dataset.season=season;
    try{localStorage.setItem('inari-season',season);}catch{}
  };
  select.value=saved;select.onchange=apply;apply();
}
