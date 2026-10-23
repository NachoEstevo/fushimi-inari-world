import * as THREE from 'three';
import {pathSampler} from './spatial.mjs';
import {makeOmotesandoShoulderExclusion} from './omotesando-shoulders-layout.mjs';
import {evergreenCanopy} from './evergreen-canopy.mjs';

export const omotesandoContextSpecR95=Object.freeze({path:'way/105449722',centralSlabWidth:4.8,totalMappedWidth:8,treeOffset:3.35,wellRadius:.55,stationsFromWest:[38,60,82,104]});
const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);};
// The source width describes public path, not a surveyed central slab strip.
// Visible long slabs occupy the middle; cobbled margins hold the actual trees.
export function omotesandoContextLayoutR95(features,barriers={ways:[]},colliders=[]){
 const path=features.paths?.find(p=>p.id===omotesandoContextSpecR95.path);if(!path)return null;
 const sampler=pathSampler([...path.points].reverse()),excluded=makeOmotesandoShoulderExclusion(features),trees=[],skipped=[];
 const ways=Array.isArray(barriers)?barriers:barriers.ways??[];
 for(const station of omotesandoContextSpecR95.stationsFromWest){
  if(station>=sampler.total-15)continue;
  const p=sampler.at(station/sampler.total).point,a=sampler.at(Math.max(0,station-.1)/sampler.total).point,b=sampler.at(Math.min(sampler.total,station+.1)/sampler.total).point,dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),normal=[-dz/len,dx/len];
  for(const side of [-1,1]){
   const x=p[0]+normal[0]*side*3.35,z=p[2]+normal[1]*side*3.35,id=`photo-avenue-${station}-${side}`;
   const reason=excluded(x,z,.65)?'mapped building/water/crossing':ways.some(w=>w.points?.slice(1).some((v,k)=>distance(x,z,w.points[k],v)<.78))?'mapped boundary clearance':colliders.some(c=>c.type==='cylinder'&&/tree/.test(String(c.args.at(-1)))&&Math.hypot(c.args[0]-x,c.args[1]-z)<1.8)?'existing tree ownership':null;
   if(reason){skipped.push({id,reason});continue;}trees.push({id,root:[x,z],station,side,height:5.4+(station%3)*.3,supported:station>=60,normal});
  }
 }
 return {path,sampler,trees,skipped,spec:omotesandoContextSpecR95};
}
export function buildOmotesandoContextR95(root,features,barriers,surfaces,materials,colliders){
 const name='Omotesando photo-inferred avenue R95',old=root.getObjectByName(name);if(old)return old.userData;
 const layout=omotesandoContextLayoutR95(features,barriers,colliders);if(!layout)return {built:false,reason:'mapped Omotesando missing'};
 const group=new THREE.Group();group.name=name;const dummy=new THREE.Object3D(),batches=new Map(),up=new THREE.Vector3(0,1,0),pending=[],soilVertices=[],rimVertices=[];
 const bark=new THREE.MeshStandardMaterial({color:'#77766a',roughness:1}),support=new THREE.MeshStandardMaterial({color:'#a6a08a',roughness:1}),tie=new THREE.MeshStandardMaterial({color:'#454b37',roughness:1});
 const stone=new THREE.MeshStandardMaterial({color:'#a3a69b',roughness:1}),soil=new THREE.MeshStandardMaterial({color:'#544f3e',roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
 const ground=(x,z)=>{const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Invalid R95 avenue ground');return y;};
 const put=(key,geo,mat,matrix)=>{if(!batches.has(key))batches.set(key,{geo,mat,matrices:[]});else if(batches.get(key).geo!==geo)geo.dispose();batches.get(key).matrices.push(matrix.clone());};
 const stem=(key,a,b,r,mat)=>{const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),v=vb.clone().sub(va);dummy.position.copy(va).add(vb).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,v.clone().normalize());dummy.scale.set(r,v.length(),r);dummy.updateMatrix();put(key,new THREE.CylinderGeometry(.75,1,1,7),mat,dummy.matrix);};
 const canopy=evergreenCanopy(512),foliage=canopy.material.clone();foliage.vertexColors=true;
 // Enlarge individual cutout sprays without inflating crown envelopes.
 const leaves=canopy.geometry.attributes.position;for(let i=48;i<leaves.count;i+=6){const center=new THREE.Vector3();for(let j=0;j<6;j++)center.add(new THREE.Vector3().fromBufferAttribute(leaves,i+j));center.multiplyScalar(1/6);for(let j=0;j<6;j++){const p=new THREE.Vector3().fromBufferAttribute(leaves,i+j).sub(center).multiplyScalar(1.6).add(center);leaves.setXYZ(i+j,p.x,p.y,p.z);}}canopy.geometry.computeVertexNormals();canopy.geometry.computeBoundingSphere();
 for(const tree of layout.trees){const [x,z]=tree.root,y=ground(x,z);tree.base=y;
  // Every well vertex seats on the actual walk surface; a flat translated
  // disk would float on the graded approach. Flush offsets only prevent z-fighting.
  const drape=(geo,out,offset)=>{const g=geo.index?geo.toNonIndexed():geo,p=g.attributes.position;for(let i=0;i<p.count;i++){const px=x+p.getX(i),pz=z+p.getZ(i);out.push(px,ground(px,pz)+offset,pz);}if(g!==geo)g.dispose();geo.dispose();};
  drape(new THREE.CircleGeometry(.51,32).rotateX(-Math.PI/2),soilVertices,.001);
  drape(new THREE.RingGeometry(.51,.55,32).rotateX(-Math.PI/2),rimVertices,.003);
  stem('trunk',[x,y-.05,z],[x+.12,y+tree.height*.74,z-.06],.16,bark);
  for(let branch=0;branch<5;branch++){const angle=branch*2.4+tree.station*.07,r=.75+(branch%2)*.45,by=y+tree.height*(.54+branch*.055),bx=x+Math.cos(angle)*r,bz=z+Math.sin(angle)*r;stem('trunk',[x+.08,y+tree.height*.43,z],[bx,by,bz],.065,bark);dummy.position.set(bx,by+.35,bz);dummy.rotation.set(.08*branch,angle,.05);dummy.scale.set(1.25,1.05,1.10);dummy.updateMatrix();put('canopy',canopy.geometry,foliage,dummy.matrix);}
  if(tree.supported){for(let leg=0;leg<3;leg++){const angle=leg*Math.PI*2/3,px=x+Math.cos(angle)*.39,pz=z+Math.sin(angle)*.39;stem('support',[px,ground(px,pz),pz],[x+Math.cos(angle)*.12,y+1.75,z+Math.sin(angle)*.12],.035,support);}const ringTie=new THREE.TorusGeometry(.18,.025,5,14).rotateX(Math.PI/2);dummy.position.set(x,y+1.65,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();put('ties',ringTie,tie,dummy.matrix);}
  pending.push({type:'cylinder',args:[x,z,tree.supported ? .43 : .17,y-.05,y+tree.height*.75,'photo_omotesando_tree_r95']});
 }
 for(const [key,b]of batches){const mesh=new THREE.InstancedMesh(b.geo,b.mat,b.matrices.length);b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.name='R95 avenue '+key;mesh.castShadow=key==='trunk'||key==='support';mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);}
 for(const [key,vertices,mat]of [['soil',soilVertices,soil],['well',rimVertices,stone]]){if(!vertices.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,mat);mesh.name='R95 avenue '+key;mesh.receiveShadow=true;group.add(mesh);}
 const meta={built:true,trees:layout.trees,skipped:layout.skipped,spec:layout.spec,materialBatches:group.children.length,collidersAdded:pending.length,
 provenance:'Actual iqK2tg-TxbY reference frames00:28/00:43 show central longitudinal slabs, smaller cobble side bands, circular soil wells, young branched avenue trees and timber supporttripods. OSMway105449722 ownscenterline/publicwidth; all slab/shoulder ratios, stationpositions, roots, species and sizes are photo-inferred, not mapped or measured.',
 limits:'Source-based visual reconstruction only. No shop/facade claims; old over-wide slab/shoulder partition replaced inside mapped8m corridor; wallboundaries retained. New trees preserve the central passage; existing authentic kitsune pedestal locally narrows a slab edge, so full4.8m clearance is not claimed; mappedcrossings/buildings/water/barriers and existingtreeroots excluded. GPU silhouette, registration and material QA remain root-owned.'};
 group.userData=meta;root.add(group);colliders.push(...pending);return meta;
}
