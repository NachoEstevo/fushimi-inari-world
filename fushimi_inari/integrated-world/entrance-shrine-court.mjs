import * as THREE from 'three';
import {makeOmotesandoShoulderExclusion} from './omotesando-shoulders-layout.mjs';

// IMG_6470 shows a fine grey mineral forecourt, not turf. These apron limits are
// inferred within the mapped outer retaining wall way/1119779132, not surveyed.
const courtBounds=Object.freeze([-85.4,-69.2,-20.5,-4.0]);

export function buildEntranceShrineCourt(root,features,surfaces){
  // The shoulder helper normally exempts its own main avenue. This court has
  // no such exemption: retain that path's geometry under a local exclusion ID.
  const exclusionFeatures={...features,paths:(features.paths??[]).map(path=>
    path.id==='way/105449722'?{...path,id:'court-exclusion-main-avenue'}:path)};
  const excluded=makeOmotesandoShoulderExclusion(exclusionFeatures,courtBounds);
  const [left,right,back,front]=courtBounds,grid=.4,offset=.025,positions=[],uv=[];
  let cells=0;
  const cell=(x,z,bx,bz,depth=0)=>{
    // Half-diagonal padding guarantees the complete quad clears every source
    // footprint/corridor; sampling just its corners can miss narrow crossings.
    if(excluded((x+bx)/2,(z+bz)/2,Math.hypot(bx-x,bz-z)/2)){
      // Refine boundary cells only: keep the conservative source clearance,
      // but avoid broad sawtooth strips of exposed soil beside the paving.
      if(depth<2&&[[x,z],[bx,z],[bx,bz],[x,bz]].some(([px,pz])=>!excluded(px,pz,0))){
        const mx=(x+bx)/2,mz=(z+bz)/2;
        cell(x,z,mx,mz,depth+1);cell(mx,z,bx,mz,depth+1);
        cell(x,mz,mx,bz,depth+1);cell(mx,mz,bx,bz,depth+1);
      }
      return;
    }
    const corners=[[x,z],[bx,z],[bx,bz],[x,bz]];
    for(const i of [0,2,1,0,3,2]){
      const [px,pz]=corners[i],y=surfaces.terrainHeight(px,pz)+offset;
      if(!Number.isFinite(y))throw new Error('Nonfinite shrine court terrain at '+px+','+pz);
      positions.push(px,y,pz);uv.push(px/1.6,pz/1.6);
    }
    cells++;
  };
  for(let x=left;x<right-1e-6;x+=grid)for(let z=back;z<front-1e-6;z+=grid)
    cell(x,z,Math.min(x+grid,right),Math.min(z+grid,front));
  if(!cells)return null;
  const pixels=new Uint8Array(128*128*4);let seed=647059;
  for(let i=0;i<pixels.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const grey=128+seed%19;
    pixels[i]=grey;pixels[i+1]=grey+1;pixels[i+2]=grey;pixels[i+3]=255;
  }
  const map=new THREE.DataTexture(pixels,128,128,THREE.RGBAFormat);
  map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;
  const material=new THREE.MeshStandardMaterial({map,color:'#ffffff',roughness:1,
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Fine grey mineral apron before three entrance shrines';
  mesh.receiveShadow=true;mesh.castShadow=false;
  mesh.userData={bounds:[...courtBounds],grid,boundaryGrid:grid/4,offset,cells,triangles:cells*2,
    provenance:'IMG_6470 mineral courtyard appearance; bounds inferred from mapped retaining wall way/1119779132 and front edge. All mapped buildings, water and paths excluded with whole-cell clearance. Ground unchanged; no lawn or collider.'};
  root.add(mesh);return mesh;
}
