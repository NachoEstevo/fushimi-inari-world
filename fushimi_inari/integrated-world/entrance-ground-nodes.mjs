import {attribute,varying,texture,mix,normalView,materialColor,materialNormal} from 'three/tsl';
import {makeEntranceGroundMask} from './entrance-ground.mjs';
import {terrainXZ} from './courtyard-ground-nodes.mjs';
export {makeEntranceGroundMask,makeNorthCourtGrade,makeAzumamaroCourtGrade} from './entrance-ground.mjs';

export function blendEntranceGround(geometry,material,gravel,romon,features){
 const work=entranceGroundWork(geometry,material,gravel,romon,features);let next=work.next();
 while(!next.done)next=work.next();return next.value;
}
export async function blendEntranceGroundAsync(geometry,material,gravel,romon,features,{yieldWork,now=()=>performance.now(),budgetMs=32}={}){
 if(typeof yieldWork!=='function')throw new TypeError('Entrance ground preparation requires yieldWork');
 if(!(budgetMs>0&&budgetMs<=32))throw new RangeError('Entrance ground preparation budget must be between 0 and 32 ms');
 const work=entranceGroundWork(geometry,material,gravel,romon,features);let start=now(),next=work.next();
 while(!next.done){
  if(now()-start>=budgetMs){await yieldWork();start=now();}
  next=work.next();
 }
 return next.value;
}
function* entranceGroundWork(geometry,material,gravel,romon,features){
 material.terrainGravelMap=gravel.map;
 const mask=makeEntranceGroundMask(romon,features),p=geometry.attributes.position,weights=new Float32Array(p.count),cache=new Map();
 for(let i=0;i<p.count;i++){
  if(i%256===0)yield;
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
