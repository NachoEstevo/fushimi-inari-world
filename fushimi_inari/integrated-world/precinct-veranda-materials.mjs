import * as THREE from 'three';

let sharedBoards;
function verandaBoards(){
 if(sharedBoards)return sharedBoards;
 const start=performance.now(),size=256,data=new Uint8Array(size*size*4);
 // Photographic proportions/finish, not surveyed board dimensions:
 // https://fushimiinari-guide.com/wp-content/uploads/IMG_6572_20210311.jpg
 // https://fushimiinari-guide.com/wp-content/uploads/IMG_6628_20210309.jpg
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const board=Math.floor(x/32),edge=x%32;
  let hash=Math.imul(x+71,374761393)^Math.imul(y+13,668265263);hash=Math.imul(hash^(hash>>>13),1274126177);
  const fine=(((hash^(hash>>>16))>>>0)/4294967295-.5)*5;
  const grain=Math.sin(x*Math.PI/4+Math.sin(y*Math.PI/128)*.35)*2;
  const tone=edge===0?76:112+(board%3-1)*3+fine+grain,i=(y*size+x)*4;
  data[i]=tone+5;data[i+1]=tone+2;data[i+2]=tone-4;data[i+3]=255;
 }
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(size,size);pixels.data.set(data);ctx.putImageData(pixels,0,0);
  sharedBoards=new THREE.CanvasTexture(canvas);
 }else sharedBoards=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 sharedBoards.name='Reference-guided precinct weathered veranda boards';
 sharedBoards.colorSpace=THREE.SRGBColorSpace;sharedBoards.wrapS=sharedBoards.wrapT=THREE.RepeatWrapping;
 sharedBoards.magFilter=THREE.LinearFilter;sharedBoards.minFilter=THREE.LinearMipmapLinearFilter;
 sharedBoards.generateMipmaps=true;sharedBoards.anisotropy=8;sharedBoards.needsUpdate=true;
 sharedBoards.userData={bakeMs:performance.now()-start,sourceBytes:data.byteLength};
 return sharedBoards;
}

// Only the retained upper face receives timber. Reorder existing triangle
// indices into two groups, rather than rendering BoxGeometry's six groups.
// The caller owns this geometry/material; the one atlas is shared by both sites.
export function finishPrecinctVeranda(mesh){
 if(!mesh?.isMesh||mesh.userData.precinctVerandaFinish)return false;
 const shape=mesh.geometry?.parameters;
 if(shape?.height!==.16||!((shape.width===6.8&&shape.depth===4.8)||(shape.width===6.3&&shape.depth===4.4))||Array.isArray(mesh.material))return false;
 const geometry=mesh.geometry.clone(),normal=geometry.attributes.normal,position=geometry.attributes.position,uv=geometry.attributes.uv;
 const indices=geometry.index?Array.from(geometry.index.array):Array.from({length:position.count},(_,i)=>i),sides=[],top=[];
 for(let i=0;i<indices.length;i+=3){const face=indices.slice(i,i+3);(face.every(index=>normal.getY(index)>.9)?top:sides).push(...face);}
 if(!top.length||!sides.length){geometry.dispose();return false;}
 for(const index of new Set(top))uv.setXY(index,position.getX(index)/1.28,position.getZ(index)/1.8);
 geometry.setIndex([...sides,...top]);geometry.clearGroups();geometry.addGroup(0,sides.length,0);geometry.addGroup(sides.length,top.length,1);
 const map=verandaBoards(),floor=new THREE.MeshStandardMaterial({name:'Weathered precinct veranda floor',map,bumpMap:map,bumpScale:.001,roughness:.94,metalness:0});
 mesh.geometry=geometry;mesh.material=[mesh.material,floor];mesh.userData.precinctVerandaFinish={boardWidthEstimate:.16,extraDraws:1};
 return true;
}
