import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildKeihanStationDetailPolish,KEIHAN_DETAIL_BOARDS} from './keihan-station-detail-polish.mjs';

test('station decoration fails closed without station ownership',()=>{
 assert.equal(buildKeihanStationDetailPolish({root:new THREE.Group()}).built,false);
});
test('official platform directions remain distinct and canopy signs clear head height',()=>{
 const station={built:true,group:new THREE.Group(),spec:{platformFloor:31}},assembly={keihanStation:station};
 const before=JSON.stringify(station.spec),report=buildKeihanStationDetailPolish(assembly);
 assert.equal(report.built,true);assert.equal(report.records.length,3);
 assert.equal(KEIHAN_DETAIL_BOARDS[0].number,'2');assert.match(KEIHAN_DETAIL_BOARDS[0].subtitle,/Osaka/);
 assert.equal(KEIHAN_DETAIL_BOARDS[1].number,'1');assert.match(KEIHAN_DETAIL_BOARDS[1].subtitle,/Kyoto/);
 for(const r of report.records.slice(0,2))assert.ok(r.position[1]-r.height/2>33.4);
 assert.equal(report.stats.colliders,0);assert.equal(JSON.stringify(station.spec),before);
 assert.equal(buildKeihanStationDetailPolish(assembly),report);assert.equal(station.group.children.length,1);
 const faces=[];report.group.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry')faces.push(o);});
 assert.equal(faces.length,3);assert.equal(new Set(faces.map(o=>o.material)).size,1);
 for(const face of faces){assert.equal(face.material.isMeshBasicMaterial,true);assert.equal(face.material.toneMapped,false);assert.ok(Math.abs(face.geometry.parameters.width/face.geometry.parameters.height-6)<1e-8);}
 for(const face of faces){const uv=face.geometry.attributes.uv;for(let i=0;i<uv.count;i++)assert.ok(uv.getY(i)>=0&&uv.getY(i)<=1);}
});
