import * as THREE from 'three';

// Find complete original connected boxes, never delete by a broad height band:
// original balusters, columns, balcony deck and all roof geometry must survive.
export function removeSourceBoxes(mesh,targets){
 const g=mesh.geometry,p=g.attributes.position,idx=g.index,parent=Array.from({length:p.count},(_,i)=>i),weld=new Map();
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');if(weld.has(key))join(i,weld.get(key));else weld.set(key,i);}
 const at=i=>idx?idx.getX(i):i,n=idx?.count??p.count;
 for(let i=0;i<n;i+=3){join(at(i),at(i+1));join(at(i),at(i+2));}
 const bounds=new Map(),v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){const k=find(i);if(!bounds.has(k))bounds.set(k,new THREE.Box3());bounds.get(k).expandByPoint(v.fromBufferAttribute(p,i));}
 const remove=new Set(),size=new THREE.Vector3(),center=new THREE.Vector3();
 for(const [id,b]of bounds){b.getSize(size);b.getCenter(center);if(targets.some(t=>size.toArray().every((v,i)=>Math.abs(v-t.size[i])<.003)&&center.toArray().every((v,i)=>Math.abs(v-t.center[i])<.003)))remove.add(id);}
 const retained=[];for(let i=0;i<n;i+=3)if(!remove.has(find(at(i))))retained.push(at(i),at(i+1),at(i+2));
 const geometry=g.clone();geometry.setIndex(retained);geometry.computeBoundingBox();geometry.computeBoundingSphere();return {count:remove.size,geometry};
}
