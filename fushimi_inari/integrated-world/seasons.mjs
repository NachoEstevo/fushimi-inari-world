import * as THREE from 'three';
import {validSeason} from './season-palette.mjs?v=24';

export function installSeasons(assembly,canopy){
  const maple=assembly.legacy.foliage[2].material,meshes=[];
  assembly.root.traverse(o=>{if(o.isInstancedMesh&&(o.material===maple||o.userData.seasonalMaple))meshes.push(o);});
  // Retain the old leaf alpha/normal maps and remove their baked red pigment.
  maple.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float leafValue=dot(diffuseColor.rgb,vec3(.299,.587,.114));
      diffuseColor.rgb=vec3(leafValue*1.7);`);
  };
  maple.customProgramCacheKey=()=> 'seasonal-maple-r24';maple.needsUpdate=true;
  const select=document.createElement('select');select.id='season';select.setAttribute('aria-label','Season');
  for(const [value,text] of [['spring','Spring · fresh greens'],['autumn','Autumn · gold and amber']])select.add(new Option(text,value));
  const label=document.createElement('label');label.htmlFor='season';label.textContent='Season';
  const pane=document.getElementById('pane-3');pane.prepend(label,select);
  let saved='spring';try{saved=validSeason(localStorage.getItem('inari-season'));}catch{}
  const tint=new THREE.Color();
  const apply=()=>{
    const season=validSeason(select.value);canopy.setSeason(season);
    meshes.forEach((mesh,j)=>{
      for(let i=0;i<mesh.count;i++){
        const n=(Math.sin(i*12.9898+j*31.1)*43758.5453)%1,t=Math.abs(n);
        tint.setHSL(season==='spring'?.23+t*.07:.025+t*.105,season==='spring'?.48:.78,.43+t*.15);
        mesh.setColorAt(i,tint);
      }
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    });
    document.body.dataset.season=season;
    try{localStorage.setItem('inari-season',season);}catch{}
  };
  select.value=saved;select.onchange=apply;apply();
}
