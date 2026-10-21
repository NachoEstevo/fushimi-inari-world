import * as THREE from 'three';

export const entranceShrineEnclosureIds=Object.freeze(['way/1263631065','way/1263631066','way/1263631067','way/1263631068','way/1119273331','way/1119779132']);
const selected=new Set(entranceShrineEnclosureIds);
// Exact source linework surrounding the three mapped roadside shrine nodes.
// No point-POI is promoted to a new building, and no missing front edge is closed.
export function buildEntranceShrineEnclosures(root,barriers,ground,materials,colliders){
 const group=new THREE.Group();group.name='Mapped three-shrine rail and retaining enclosures';
 const red=new THREE.MeshStandardMaterial({color:'#a4442e',roughness:.88});
 const gray=new THREE.MeshStandardMaterial({color:'#7c7e70',roughness:.96});
 const stone=(materials.entryStoneMat??materials.stoneMat).clone();stone.color.set('#d5d7d2');stone.roughness=1;
 // IMG_6470_20210313: irregular, mottled gray stone rather than uniformly
 // white/black slabs. One tiny shared relief map changes appearance only.
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  if(ctx){
   let seed=6470;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   ctx.fillStyle='#737572';ctx.fillRect(0,0,512,512);
   // Different stone counts, widths and offsets per irregular-height row
   // avoid the conspicuous continuous vertical joints of a rectangular grid.
   const levels=[0,91,204,307,414,512];
   for(let row=0;row<levels.length-1;row++){
    const y0=levels[row],y1=levels[row+1],offset=-70-rand()*95;
    let x=offset;
    for(let stoneIndex=0;x<535;stoneIndex++){
     const width=72+rand()*103,base=141+rand()*43;
     const corners=[[x+8+rand()*15,y0+4+rand()*10],[x+width*.52,y0-3+rand()*8],[x+width-4,y0+7+rand()*9],[x+width+2-rand()*9,y1-13-rand()*7],[x+width*.46,y1-2-rand()*5],[x+4+rand()*7,y1-8-rand()*9]];
     ctx.save();ctx.beginPath();corners.forEach((p,i)=>{if(i)ctx.lineTo(...p);else ctx.moveTo(...p);});ctx.closePath();ctx.clip();
     ctx.fillStyle=`rgb(${base},${base+1},${base})`;ctx.fillRect(x-5,y0-8,width+12,y1-y0+16);
     // Broad low-contrast mineral patches remain legible at walking distance.
     for(let patch=0;patch<14;patch++){
      const shade=base+(rand()-.5)*45;ctx.fillStyle=`rgba(${shade},${shade+1},${shade},.27)`;ctx.beginPath();ctx.ellipse(x+rand()*width,y0+rand()*(y1-y0),10+rand()*27,8+rand()*20,rand()*3.14,0,Math.PI*2);ctx.fill();
     }
     ctx.restore();x+=width-1;
    }
   }
   const pixels=ctx.getImageData(0,0,512,512);
   for(let i=0;i<pixels.data.length;i+=4){const noise=(rand()-.5)*31;pixels.data[i]+=noise;pixels.data[i+1]+=noise;pixels.data[i+2]+=noise;}
   ctx.putImageData(pixels,0,0);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
   stone.map=map;stone.bumpMap=map;stone.bumpScale=.014;
  }
 }
 const batches=new Map(),dummy=new THREE.Object3D(),cube=new THREE.BoxGeometry(1,1,1),built=[];
 const put=(material,x,y,z,w,h,d,yaw=0,slope=0)=>{
  if(!batches.has(material))batches.set(material,[]);dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();const matrix=dummy.matrix.clone();matrix.elements[1]=slope*w;batches.get(material).push(matrix);
 };
 const sample=(x,z)=>{const y=ground(x,z);if(!Number.isFinite(y))throw Error('Nonfinite shrine enclosure ground');return y;};
 for(const way of Array.isArray(barriers)?barriers:barriers.ways??[]){
  if(!selected.has(way.id))continue;
  const retaining=way.tags?.barrier==='retaining_wall',tagged=Number.parseFloat(way.tags?.height),height=Number.isFinite(tagged)&&tagged>0?tagged:1.0,material=retaining?stone:way.tags?.colour==='gray'?gray:red;
  // The reference photo places the rear red rail above the 1.5m retaining
  // wall, not buried behind it. Both mapped lines retain their own X/Z.
  const seat=way.id==='way/1119273331'?1.5:0;
  let lengthTotal=0;
  for(let i=1;i<way.points.length;i++){
   const a=way.points[i-1],b=way.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<.01)continue;lengthTotal+=length;
   const yaw=-Math.atan2(dz,dx),count=Math.ceil(length/(retaining?1.1:.95)),step=length/count;
   if(retaining){
    for(let j=0;j<count;j++){
     const t0=j/count,t1=(j+1)/count,x0=a[0]+dx*t0,z0=a[1]+dz*t0,x1=a[0]+dx*t1,z1=a[1]+dz*t1,y0=sample(x0,z0),y1=sample(x1,z1),x=(x0+x1)/2,z=(z0+z1)/2,base=(y0+y1)/2,slope=(y1-y0)/step;
     put(stone,x,base+height/2,z,step,height,.24,yaw,slope);
     colliders.push({type:'box',args:[x,z,step/2,.13,yaw,Math.min(y0,y1),Math.max(y0,y1)+height,'mapped_shrine_retaining']});
    }
   }else{
    for(let j=0;j<=count;j++){
     if(j===0&&i>1)continue; // one post at each mapped corner
     const t=j/count,x=a[0]+dx*t,z=a[1]+dz*t,y=sample(x,z)+seat;
     put(material,x,y+height/2,z,.075,height,.075,yaw);
     colliders.push({type:'cylinder',args:[x,z,.054,y,y+height,'mapped_shrine_rail_post']});
    }
    // The photograph also resolves the rear rail as dense red pickets,
    // seated above stone. Keep its existing height, seat and open source ends.
    if(['way/1263631065','way/1263631066','way/1263631067','way/1119273331'].includes(way.id)){
     const pickets=Math.ceil(length/.14);
     for(let k=0;k<pickets;k++){
      const t=(k+.5)/pickets,x=a[0]+dx*t,z=a[1]+dz*t,y=sample(x,z)+seat;
      put(material,x,y+height*.49,z,way.id==='way/1119273331'?.065:.028,height*.92,way.id==='way/1119273331'?.055:.035,yaw);
     }
    }
    for(let j=0;j<count;j++){
     const t0=j/count,t1=(j+1)/count,x0=a[0]+dx*t0,z0=a[1]+dz*t0,x1=a[0]+dx*t1,z1=a[1]+dz*t1,y0=sample(x0,z0)+seat,y1=sample(x1,z1)+seat,x=(x0+x1)/2,z=(z0+z1)/2,base=(y0+y1)/2,slope=(y1-y0)/step;
     for(const fraction of [.36,.84]){
      const h=.055,level=height*fraction;put(material,x,base+level,z,step,h,.055,yaw,slope);
      // Match each actual rail, rather than making a solid wall across the
      // low open construction. Mapped source openings receive no blocker.
      colliders.push({type:'box',args:[x,z,step/2,.034,yaw,Math.min(y0,y1)+level-h/2,Math.max(y0,y1)+level+h/2,'mapped_shrine_horizontal_rail']});
     }
    }
   }
  }
  built.push({id:way.id,kind:retaining?'retaining_wall':'post_and_rail',height,heightSource:Number.isFinite(tagged)&&tagged>0?'OSM height tag':'estimated1.0m',length:lengthTotal,closed:way.points[0][0]===way.points.at(-1)[0]&&way.points[0][1]===way.points.at(-1)[1]});
 }
 for(const [material,matrices]of batches){
  const mesh=new THREE.InstancedMesh(cube,material,matrices.length);matrices.forEach((matrix,i)=>{if(matrix.elements.some(v=>!Number.isFinite(v)))throw Error('Nonfinite shrine enclosure transform');mesh.setMatrixAt(i,matrix);});mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
 }
 group.userData={ways:built,source:'geography/sources/entrance-barriers.json',provenance:'Exact six mapped fence/retaining lines, tags supply materials/colors/heights where present; untagged outer rail estimated1.0m, picket spacing and stone relief estimated from IMG_6470_20210313; no shrine bodies or basin added'};
 root.add(group);return {group,ways:built};
}
