import * as THREE from 'three';
import {createVotiveAssets,votiveFlicker} from './candle-votives.mjs';

const flicker=(time,phase)=>.88+.12*Math.sin(time*.006+phase);
const near=(a,b)=>Math.abs(a-b)<1e-7;
const canInstance=part=>part?.isMesh&&!part.isInstancedMesh&&!part.isSkinnedMesh&&part.parent&&!part.children.length&&part.visible&&part.matrixAutoUpdate&&!Array.isArray(part.material)&&!part.material.transparent&&!part.userData.interactable&&part.onBeforeRender===THREE.Object3D.prototype.onBeforeRender;
const renderKey=part=>[part.parent.uuid,part.geometry.uuid,part.material.uuid,part.castShadow,part.receiveShadow,part.frustumCulled,part.renderOrder,part.layers.mask].join(':');

// Match only the 2 x 7 wax bodies authored by createRosokuCandleHouse. Some
// houses already had their wax statically batched by integration; leave those
// alone. An incomplete or ambiguous house is deliberately not converted.
function matchingWax(flames){
  if(flames.length!==14)return [];
  const parent=flames[0].parent,parts=[];
  for(const flame of flames){
    const shape=flame.geometry.parameters;
    if(flame.geometry.type!=='ConeGeometry'||shape.radius!==.028||shape.height!==.09||shape.radialSegments!==6||!flame.material.isMeshBasicMaterial||flame.material.color.getHex()!==0xff9d2e||!near(flame.userData.baseY,flame.position.y))return [];
    const matches=parent.children.filter(part=>{
      if(!canInstance(part)||part.geometry.type!=='CylinderGeometry'||!part.material.isMeshBasicMaterial||part.material.color.getHex()!==0xfff6e5)return false;
      const p=part.geometry.parameters;
      return p.radiusTop===.018&&p.radiusBottom===.020&&p.height===.16&&p.radialSegments===6&&p.heightSegments===1&&!p.openEnded&&p.thetaStart===0&&p.thetaLength===Math.PI*2&&
        near(part.position.x,flame.position.x)&&near(part.position.y+.12,flame.position.y)&&near(part.position.z,flame.position.z)&&
        part.quaternion.x===0&&part.quaternion.y===0&&part.quaternion.z===0&&part.quaternion.w===1&&part.scale.x===1&&part.scale.y===1&&part.scale.z===1;
    });
    if(matches.length!==1)return [];parts.push(matches[0]);
  }
  return new Set(parts).size===14&&parts.every(part=>renderKey(part)===renderKey(parts[0]))?parts:[];
}

// Retain only complete verified candle sets before integration's static batch.
// Use the same render buckets as installation so split/custom sets cannot keep
// unrelated cabinet geometry alive or imply that they will receive polish.
export function findVotiveWaxToRetain(flames){
  const buckets=new Map();
  for(const flame of new Set(flames)){
    if(!canInstance(flame))continue;
    const key=renderKey(flame);
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(flame);
  }
  return [...buckets.values()].flatMap(matchingWax);
}

// Each original candle house keeps its own parent, geometry and material.
// Optional votive polish replaces only verified cabinet assets, retaining owners.
export function installCandleFlameInstances(flames,{polish=false}={}){
  const buckets=new Map(),fallback=[],batches=[],waxBatches=[],matrix=new THREE.Matrix4(),scale=new THREE.Vector3();
  let lastTime=null,disposed=false;
  const assets=polish?createVotiveAssets():null,wickMeshes=[];
  for(const flame of new Set(flames)){
    if(!canInstance(flame)){
      if(flame?.scale)fallback.push(flame);continue;
    }
    const key=renderKey(flame);
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(flame);
  }
  for(const group of buckets.values()){
    if(group.length<2){fallback.push(...group);continue;}
    const first=group[0],parent=first.parent,mesh=new THREE.InstancedMesh(first.geometry,first.material,group.length);
    const wax=matchingWax(group),refined=Boolean(assets&&wax.length);
    if(refined){mesh.geometry=assets.flameGeometry;mesh.material=assets.flameMaterial;}
    if(wax.length){
      const source=wax[0],waxMesh=new THREE.InstancedMesh(source.geometry,source.material,wax.length);
      if(refined){
        waxMesh.material=assets.waxMaterial;
        const wicks=new THREE.InstancedMesh(assets.wickGeometry,assets.wickMaterial,wax.length);
        wicks.name='Instanced votive candle wicks';
        const pose=new THREE.Matrix4();
        wax.forEach((part,index)=>{pose.makeTranslation(part.position.x,part.position.y+.083,part.position.z);wicks.setMatrixAt(index,pose);});
        wicks.computeBoundingBox();wicks.computeBoundingSphere();wicks.layers.mask=source.layers.mask;parent.add(wicks);wickMeshes.push(wicks);
      }
      waxMesh.name='Instanced votive candle wax';waxMesh.castShadow=source.castShadow;waxMesh.receiveShadow=source.receiveShadow;
      waxMesh.frustumCulled=source.frustumCulled;waxMesh.renderOrder=source.renderOrder;waxMesh.layers.mask=source.layers.mask;
      wax.forEach((part,index)=>{part.updateMatrix();waxMesh.setMatrixAt(index,part.matrix);part.removeFromParent();});
      waxMesh.computeBoundingBox();waxMesh.boundingBox.expandByScalar(.0001);waxMesh.boundingSphere=waxMesh.boundingBox.getBoundingSphere(new THREE.Sphere());
      parent.add(waxMesh);waxBatches.push({mesh:waxMesh,parent,parts:wax});
    }
    mesh.name='Instanced votive candle flames';mesh.castShadow=first.castShadow;mesh.receiveShadow=first.receiveShadow;
    mesh.frustumCulled=first.frustumCulled;mesh.renderOrder=first.renderOrder;mesh.layers.mask=first.layers.mask;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
    const bounds=new THREE.Box3(),box=new THREE.Box3();
    const records=group.map((flame,index)=>{
      flame.updateMatrix();mesh.setMatrixAt(index,flame.matrix);mesh.getMatrixAt(index,matrix);
      bounds.union(box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix));
      // The previous loop assigns scale.y absolutely; authored X/Z scale and
      // rotation must remain intact rather than multiplying the old Y scale.
      scale.copy(flame.scale);scale.y=1;
      const base=new THREE.Matrix4().compose(flame.position,flame.quaternion,scale);
      for(const amount of [.76,1]){matrix.copy(base);for(let row=0;row<4;row++)matrix.elements[4+row]*=amount;bounds.union(box.copy(mesh.geometry.boundingBox).applyMatrix4(matrix));}
      return {flame,index,base,refined};
    });
    // The fixed envelope contains every flicker phase and Float32 rounding.
    mesh.boundingBox=bounds.expandByScalar(.0001);mesh.boundingSphere=bounds.getBoundingSphere(new THREE.Sphere());
    for(const {flame}of records)flame.removeFromParent();parent.add(mesh);
    batches.push({mesh,parent,records});
  }
  const stats={flames:flames.length,instancedFlames:batches.reduce((n,b)=>n+b.records.length,0),batches:batches.length,fallbackFlames:fallback.length,instancedWax:waxBatches.reduce((n,b)=>n+b.parts.length,0),waxBatches:waxBatches.length,removedDrawCalls:batches.reduce((n,b)=>n+b.records.length-1,0)+waxBatches.reduce((n,b)=>n+b.parts.length-1,0)-wickMeshes.length,wickBatches:wickMeshes.length,updates:0};
  return {stats,meshes:[...batches,...waxBatches].map(b=>b.mesh).concat(wickMeshes),
    update(time){
      if(disposed||!Number.isFinite(time)||time===lastTime)return stats;lastTime=time;
      for(const batch of batches){
        const values=batch.mesh.instanceMatrix.array;
        for(const {flame,index,base,refined}of batch.records){
          const amount=(refined?votiveFlicker:flicker)(time,flame.userData.phase??0),offset=index*16+4;
          for(let row=0;row<4;row++)values[offset+row]=base.elements[4+row]*amount;
        }
        batch.mesh.instanceMatrix.needsUpdate=true;
      }
      for(const flame of fallback)flame.scale.y=flicker(time,flame.userData.phase??0);
      stats.updates++;return stats;
    },
    dispose(){
      if(disposed)return;disposed=true;
      for(const {mesh,parent,records}of batches){
        mesh.removeFromParent();mesh.dispose();
        for(const {flame,refined}of records){if(lastTime!==null)flame.scale.y=(refined?votiveFlicker:flicker)(lastTime,flame.userData.phase??0);flame.updateMatrix();parent.add(flame);}
      }
      for(const {mesh,parent,parts}of waxBatches){mesh.removeFromParent();mesh.dispose();for(const part of parts)parent.add(part);}
      for(const wick of wickMeshes){wick.removeFromParent();wick.dispose();}
      assets?.dispose();
    }
  };
}
