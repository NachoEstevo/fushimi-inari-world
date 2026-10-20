import * as THREE from 'three';

// Official shrine photographs show a pink Ninomine maku versus the red summit
// curtain. Retain the authored crest and calligraphy; folds are inferred.
export function refineShrineFinishes(object,granite){
  if(!['summit','ninomine','sannomine'].includes(object.userData.zone))return;
  object.traverse(mesh=>{
    const dimensions=mesh.geometry?.parameters;
    if(mesh.geometry?.type==='BoxGeometry'&&Math.abs(dimensions.height-.17)<.001&&dimensions.width>=3.6&&dimensions.depth<.5)mesh.material=granite;
    if(mesh.geometry?.type!=='PlaneGeometry'||Math.abs(mesh.geometry.parameters.height-1.08)>.001||!mesh.material.map)return;
    const width=mesh.geometry.parameters.width;
    const folded=new THREE.PlaneGeometry(width,1.08,32,4),p=folded.attributes.position;
    for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*18)*.025);
    folded.computeVertexNormals();mesh.geometry=folded;
    if(object.userData.zone==='ninomine'){
      const source=mesh.material.map.image,canvas=document.createElement('canvas');
      canvas.width=source.width;canvas.height=source.height;
      const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
      for(let i=0;i<d.length;i+=4)if(d[i]>d[i+1]*1.35&&d[i]>d[i+2]*1.2){
        d[i]=Math.min(255,d[i]*.65+80);d[i+1]=d[i+1]*.5+95;d[i+2]=d[i+2]*.5+105;
      }
      ctx.putImageData(pixels,0,0);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      mesh.material=mesh.material.clone();mesh.material.map=texture;mesh.material.roughness=.9;
    }
  });
}
