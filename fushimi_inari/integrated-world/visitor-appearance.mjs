import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

const CLOTH=new Set(['Shirt','Pants','Clothes','Band','Belt']);
const ARM=/^(UpperArm|LowerArm|Fist)[LR]$/;
const SEGMENT=/^(UpperArm|LowerArm)[LR]$/;
const LENGTH=/^(LowerArm|Fist)[LR]$/;

// One caller-owned atlas serves every garment/template. Neutral modulation
// preserves the authored palette while revealing broad yarn/fold variation.
export function createVisitorClothTexture(){
 const size=128,data=new Uint8Array(size*size*4);let mean=0;
 const hash=(x,y)=>{let n=Math.imul((x&127)+31,374761393)^Math.imul((y&127)+71,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
 const noise=(u,v)=>{
  const cells=4,x=u*cells,y=v*cells,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),sample=(a,b)=>hash((a+cells)%cells,(b+cells)%cells);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(ix,iy),sample(ix+1,iy),sx),THREE.MathUtils.lerp(sample(ix,iy+1),sample(ix+1,iy+1),sx),sy);
 };
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const macro=(noise(x/size,y/size)-.5)*.036;
  const weave=Math.sin(x*Math.PI/2)*Math.sin(y*Math.PI/2)*.009;
  const shade=.90+macro+weave+(hash(x,y)-.5)*.009,v=Math.round(shade*255),i=(y*size+x)*4;
  data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
  mean+=Math.pow((v/255+.055)/1.055,2.4);
 }
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 texture.name='Shared visitor woven cloth';texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;
 texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=4;
 texture.userData={meanLinear:mean/(size*size)};texture.needsUpdate=true;return texture;
}

// Prepare once before SkeletonUtils clones the pedestrian instances. Preserve
// shoulders and hand size; shorten only the upper/forearm lengths in bind space
// and in all exported position tracks. No correction runs in the frame loop.
export function prepareVisitorTemplate(asset,{clothTexture,armFactor=.85}={}){
 const scene=clone(asset.scene),animations=asset.animations.map(clip=>clip.clone());
 const ownedGeometries=new Set(),ownedMaterials=new Map(),skeletons=new Set();
 const ownTexture=!clothTexture;if(!clothTexture)clothTexture=createVisitorClothTexture();
 scene.updateMatrixWorld(true);
 const previousWorld=new Map();scene.traverse(o=>{if(o.isBone)previousWorld.set(o,o.matrixWorld.clone());});
 scene.traverse(o=>{if(o.isBone&&LENGTH.test(o.name))o.position.multiplyScalar(armFactor);});
 scene.updateMatrixWorld(true);
 for(const clip of animations)for(const track of clip.tracks){
  const match=track.name.match(/^([^.]+)\.position$/);
  if(match&&LENGTH.test(match[1]))for(let i=0;i<track.values.length;i++)track.values[i]*=armFactor;
 }
 const vector=new THREE.Vector3(),point=new THREE.Vector3(),sum=new THREE.Vector3();
 scene.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;
  const original=mesh.geometry,weights=original.attributes.skinWeight,indices=original.attributes.skinIndex;
  const apparel=CLOTH.has(mesh.material.name),bones=mesh.skeleton.bones;
  let armWeighted=false;
  for(let i=0;i<indices.count&&!armWeighted;i++)for(let j=0;j<4;j++)if(weights.getComponent(i,j)>0&&ARM.test(bones[indices.getComponent(i,j)].name)){armWeighted=true;break;}
  if(apparel||(armWeighted&&armFactor!==1)){
   const geometry=original.clone(),position=geometry.attributes.position;
   if(armWeighted&&armFactor!==1){
    const transforms=bones.map(bone=>{
     const compression=SEGMENT.test(bone.name)?new THREE.Matrix4().makeScale(1,armFactor,1):new THREE.Matrix4();
     return new THREE.Matrix4().copy(mesh.bindMatrixInverse).multiply(bone.matrixWorld).multiply(compression)
      .multiply(new THREE.Matrix4().copy(previousWorld.get(bone)).invert()).multiply(mesh.bindMatrix);
    });
    for(let i=0;i<position.count;i++){
     vector.fromBufferAttribute(position,i);sum.set(0,0,0);
     for(let j=0;j<4;j++){const weight=weights.getComponent(i,j);if(weight)sum.addScaledVector(point.copy(vector).applyMatrix4(transforms[indices.getComponent(i,j)]),weight);}
     position.setXYZ(i,sum.x,sum.y,sum.z);
    }
    position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
   }
   if(apparel){
    const normal=geometry.attributes.normal,uv=new Float32Array(position.count*2);
    for(let i=0;i<position.count;i++){
     uv[i*2]=(Math.abs(normal.getX(i))>Math.abs(normal.getZ(i))?position.getZ(i):position.getX(i))/.128;
     uv[i*2+1]=position.getY(i)/.128;
    }
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
   }
   mesh.geometry=geometry;ownedGeometries.add(geometry);
  }
  skeletons.add(mesh.skeleton);
  if(apparel){
   if(!ownedMaterials.has(mesh.material)){
    const material=mesh.material.clone();material.map=clothTexture;material.roughnessMap=clothTexture;material.bumpMap=clothTexture;
    material.color.multiplyScalar(1/clothTexture.userData.meanLinear);
    material.metalness=0;material.roughness=material.name==='Clothes'||material.name==='Band'?.94:1;
    material.bumpScale=material.name==='Belt'?.00008:.0003;
    material.userData={...material.userData,visitorCloth:true};ownedMaterials.set(mesh.material,material);
   }
   mesh.material=ownedMaterials.get(mesh.material);
  }
 });
 // SkeletonUtils shares the inverse array with the loaded source. Detach it
 // before calculateInverses clears/repopulates that array in Three.
 for(const skeleton of skeletons){skeleton.boneInverses=[];skeleton.calculateInverses();}
 let disposed=false;
 return {scene,animations,stats:{armFactor:armFactor,geometries:ownedGeometries.size,clothMaterials:ownedMaterials.size,textures:1},
  dispose(){if(disposed)return;disposed=true;for(const geometry of ownedGeometries)geometry.dispose();for(const material of ownedMaterials.values())material.dispose();for(const skeleton of skeletons)skeleton.dispose();if(ownTexture)clothTexture.dispose();}};
}
