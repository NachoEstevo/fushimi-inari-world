import fs from 'node:fs';import * as THREE from 'three';
import {buildTamayamaSouthShinmesha} from '../../fushimi_inari/integrated-world/tamayama-south-shinmesha.mjs';
const features=JSON.parse(fs.readFileSync('fushimi_inari/geography/features.json')),root=new THREE.Group(),colliders=[];
const stats=buildTamayamaSouthShinmesha(root,{},features,{height:()=>0},colliders);
root.updateMatrixWorld(true);const meshes=[];root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;meshes.push({vertices:Array.from({length:a.count},(_,i)=>{const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);return [p.x-stats.center[0],p.y,p.z-stats.center[1]];}),indices:null,color:o.material.color.toArray()});});
fs.mkdirSync('.tmp/r91-shinme',{recursive:true});
fs.writeFileSync('.tmp/r91-shinme/after.json',JSON.stringify(meshes));fs.writeFileSync('.tmp/r91-shinme/stats.json',JSON.stringify({stats,colliders},null,2));console.log(stats);
