import * as THREE from 'three';
import {spatialMeshes} from './spatial-mesh.mjs';
import {panoramaVisible} from './panorama-policy.mjs';

// OSM outlines stay authoritative. Window rhythm and facade colour are inferred.
// Build once on first arrival; retain GPU buffers, but submit no draws outside
// the outlook zones. One texture/material and spatial chunks, no extra shadows.
export function installCityPanorama(scene,features,ground,excludes){
  const root=new THREE.Group();root.name='Lookout city facades';root.visible=false;scene.add(root);
  let built=false,count=0,triangles=0;
  function build(){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#d0cec5';ctx.fillRect(0,0,128,128);
    ctx.fillStyle='#777f7f';ctx.fillRect(27,35,70,49);
    ctx.fillStyle='#a7b3b2';ctx.fillRect(30,38,29,43);
    ctx.fillStyle='#d6d3c9';ctx.fillRect(61,35,3,49);
    ctx.fillStyle='#a9a89f';ctx.fillRect(22,86,80,4);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    const vertices=[],uv=[],colors=[];
    for(const b of features.buildings){
      if(count>=1800)break;
      if(excludes(b)||b.tags.religion==='shinto'||b.tags.building==='shrine'||b.tags.amenity==='place_of_worship')continue;
      const ring=b.points.slice(0,-1);if(ring.length<3)continue;
      const cx=ring.reduce((s,p)=>s+p[0],0)/ring.length;
      if(cx>450)continue;
      const heights=ring.map(p=>ground(p[0],p[2])),base=Math.min(...heights);
      if(base>100)continue;
      const h=parseFloat(b.tags.height),levels=parseFloat(b.tags['building:levels']);
      const roof=Math.max(...heights)+(Number.isFinite(h)?h:Number.isFinite(levels)?levels*3:6);
      const shade=.78+((count*37)%23)/100;
      for(let i=0;i<ring.length;i++){
        const a=ring[i],c=ring[(i+1)%ring.length],len=Math.hypot(c[0]-a[0],c[2]-a[2]);
        if(len<.5)continue;
        const q=[[a[0],base,a[2]],[c[0],base,c[2]],[c[0],roof,c[2]],[a[0],roof,a[2]]];
        const st=[[0,0],[len/3,0],[len/3,(roof-base)/3],[0,(roof-base)/3]];
        for(const j of [0,1,2,0,2,3]){vertices.push(...q[j]);uv.push(...st[j]);colors.push(shade,shade*.98,shade*.94);}
      }
      count++;
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    const material=new THREE.MeshLambertMaterial({map:texture,vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    const chunks=spatialMeshes(geo,material,256);for(const mesh of chunks.children)mesh.receiveShadow=false;
    root.add(chunks);triangles=vertices.length/9;geo.dispose();built=true;
  }
  return {update(camera,enabled){
    const active=panoramaVisible(camera.position,root.visible,enabled);
    if(active&&!built)build();
    if(root.visible!==active||!document.body.dataset.panoramaDetail)
      document.body.dataset.panoramaDetail=JSON.stringify({active,built,buildings:count,triangles});
    root.visible=active;
  }};
}
