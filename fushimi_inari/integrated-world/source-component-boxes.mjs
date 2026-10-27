import * as THREE from 'three';

// Find complete original connected boxes, never delete by a broad height band:
// original balusters, columns, balcony deck and all roof geometry must survive.
export function removeSourceBoxes(mesh,targets){
 const stages=removeSourceBoxesStages(mesh,targets);let step;
 do{step=stages.next();}while(!step.done);return step.value;
}
export function* removeSourceBoxesStages(mesh,targets){
 const g=mesh.geometry,p=g.attributes.position,idx=g.index,parent=new Uint32Array(p.count),weld=new Map();
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a;};
 for(let i=0;i<p.count;i++){
  parent[i]=i;const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');if(weld.has(key))join(i,weld.get(key));else weld.set(key,i);
  if((i+1)%1536===0)yield 'source-box-weld';
 }
 yield 'source-box-weld';
 const at=i=>idx?idx.getX(i):i,n=idx?.count??p.count;
 for(let i=0;i<n;i+=3){join(at(i),at(i+1));join(at(i),at(i+2));if((i+3)%1536===0)yield 'source-box-union';}
 yield 'source-box-union';
 const bounds=new Map(),v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){const k=find(i);if(!bounds.has(k))bounds.set(k,new THREE.Box3());bounds.get(k).expandByPoint(v.fromBufferAttribute(p,i));if((i+1)%1536===0)yield 'source-box-bounds';}
 yield 'source-box-bounds';
 const remove=new Set(),size=new THREE.Vector3(),center=new THREE.Vector3();let checked=0;
 for(const [id,b]of bounds){
  b.getSize(size);b.getCenter(center);
  if(targets.some(t=>Math.abs(size.x-t.size[0])<.003&&Math.abs(size.y-t.size[1])<.003&&Math.abs(size.z-t.size[2])<.003&&Math.abs(center.x-t.center[0])<.003&&Math.abs(center.y-t.center[1])<.003&&Math.abs(center.z-t.center[2])<.003))remove.add(id);
  if(++checked%512===0)yield 'source-box-match';
 }
 yield 'source-box-match';
 const retained=[];for(let i=0;i<n;i+=3){if(!remove.has(find(at(i))))retained.push(at(i),at(i+1),at(i+2));if((i+3)%1536===0)yield 'source-box-copy';}
 yield 'source-box-copy';
 const geometry=g.clone();yield 'source-box-clone';
 geometry.setIndex(retained);yield 'source-box-index';
 geometry.computeBoundingBox();geometry.computeBoundingSphere();yield 'source-box-finalize';return {count:remove.size,geometry};
}
