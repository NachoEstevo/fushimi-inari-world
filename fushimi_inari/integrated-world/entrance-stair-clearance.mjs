import * as THREE from 'three';

// Cut only the west stair corridor out of the inherited stone podium. Preserve
// interpolated normals/UVs instead of deleting entire large crossing triangles.
export function clearWestStairPodium(mesh){
  const source=mesh.geometry,index=source.index,attributes=source.attributes;
  const names=Object.keys(attributes),out=Object.fromEntries(names.map(n=>[n,[]]));
  const planes=[[0,-24.8,1],[0,-19.7,-1],[2,1.2,1],[2,14.5,-1]];
  const mix=(a,b,t)=>Object.fromEntries(names.map(n=>[n,a[n].map((v,i)=>v+(b[n][i]-v)*t)]));
  const split=(poly,axis,value,sign)=>{
    const inside=[],outside=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=(a.position[axis]-value)*sign,db=(b.position[axis]-value)*sign;
      (da>=0?inside:outside).push(a);
      if((da>=0)!==(db>=0)){const p=mix(a,b,da/(da-db));inside.push(p);outside.push(p);}
    }
    return {inside,outside};
  };
  const emit=poly=>{for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]])for(const n of names)out[n].push(...v[n]);};
  const count=index?.count??attributes.position.count;
  for(let i=0;i<count;i+=3){
    let poly=[0,1,2].map(j=>{const k=index?index.getX(i+j):i+j;return Object.fromEntries(names.map(n=>{const a=attributes[n];return[n,Array.from({length:a.itemSize},(_,c)=>a.array[k*a.itemSize+c])];}));});
    for(const plane of planes){if(poly.length<3)break;const parts=split(poly,...plane);emit(parts.outside);poly=parts.inside;}
  }
  const geometry=new THREE.BufferGeometry();for(const n of names)geometry.setAttribute(n,new THREE.Float32BufferAttribute(out[n],attributes[n].itemSize));
  geometry.computeBoundingSphere();mesh.geometry=geometry;
}
