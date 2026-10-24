import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {heightAt} from '../../fushimi_inari/geography/geo-core.mjs';
import {makePathSurfaces} from '../../fushimi_inari/integrated-world/path-surfaces.mjs';
import {buildInariStationRoute} from '../../fushimi_inari/integrated-world/inari-station-route.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),features=read('fushimi_inari/geography/features.json'),terrain=read('fushimi_inari/geography/terrain.json');
const root=new THREE.Group(),surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z)),route=buildInariStationRoute(root,features,surfaces);root.updateMatrixWorld(true);
const offsets=[-.001,-.0001,-.00005,0,.00005,.0001,.001],ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),samples=[];
for(const [cx,cz]of [[-160.40713737668898,10.09365402964061],[-160.4069995440519,10.343653991644937]])for(const dx of offsets)for(const dz of offsets){
 const x=cx+dx,z=cz+dz,y=route.surfaceHeight(x,z);ray.set(new THREE.Vector3(x,y+.05,z),down);ray.near=0;ray.far=.1;const hit=ray.intersectObject(root,true)[0];samples.push({center:[cx,cz],offset:[dx,dz],point:[x,y,z],hit:hit?.point.y??null,gap:hit?y-hit.point.y:null});
}
const failures=samples.filter(s=>!Number.isFinite(s.point[1])||s.hit===null||Math.abs(s.gap)>1e-5),report={checkedAt:new Date().toISOString(),scope:'Independent strict THREE.Raycaster against final route mesh only; real features and baseline makePathSurfaces/DEM fixture, not full integrate; no tolerance band added',routeSourceSha256:createHash('sha256').update(fs.readFileSync('fushimi_inari/integrated-world/inari-station-route.mjs')).digest('hex'),count:samples.length,maximumAbsoluteGap:Math.max(...samples.filter(s=>s.hit!==null).map(s=>Math.abs(s.gap))),failures,samples};
fs.writeFileSync('outputs/inari-arrival-review/strict-seal-route-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({count:report.count,maximumAbsoluteGap:report.maximumAbsoluteGap,failures,routeSourceSha256:report.routeSourceSha256},null,2));process.exitCode=failures.length?1:0;
