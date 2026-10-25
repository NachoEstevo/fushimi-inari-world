import {attribute,varying,texture,mix,normalView,materialColor,materialNormal} from 'three/tsl';
import {makeEntranceGroundMask} from './entrance-ground.mjs';
import {terrainXZ} from './courtyard-ground-nodes.mjs';
export {makeEntranceGroundMask,makeNorthCourtGrade,makeAzumamaroCourtGrade} from './entrance-ground.mjs';

export function blendEntranceGround(geometry,material,gravel,romon,features){
 material.terrainGravelMap=gravel.map;
 const mask=makeEntranceGroundMask(romon,features),p=geometry.attributes.position,weights=new Float32Array(p.count),cache=new Map();
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i);
  if(Math.abs(x-romon.target[0])>100||Math.abs(z-romon.target[2])>100)continue;
  const key=`${x},${z}`;
  if(!cache.has(key))cache.set(key,mask(x,z));
  weights[i]=cache.get(key);
 }
 geometry.setAttribute('entranceGround',new p.constructor(weights,1));
 const weight=varying(attribute('entranceGround','float'),'entranceGroundWeight');
 material.colorNode=mix((material.colorNode??materialColor).rgb,texture(gravel.map,terrainXZ.div(1.5)).rgb,weight);
 material.normalNode=mix(material.normalNode??materialNormal,normalView,weight).normalize();
 material.needsUpdate=true;
}
