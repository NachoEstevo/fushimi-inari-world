import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installSeasons} from './seasons-nodes.mjs';
import {subdivideShadowInstanceLeaves} from './spatial-mesh.mjs';

function dom(){
 let select;const pane={prepend(_label,s){select=s;}};
 globalThis.document={body:{dataset:{}},getElementById:()=>pane,createElement:tag=>tag==='select'?{add(){},setAttribute(){},value:''}: {}};
 globalThis.Option=class{constructor(text,value){this.text=text;this.value=value;}};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 return {get select(){return select;},cleanup(){delete globalThis.document;delete globalThis.Option;delete globalThis.localStorage;}};
}
function fixture(split){
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial(),geometry=new THREE.BoxGeometry(),source=new THREE.InstancedMesh(geometry,material,4);
 const first=new THREE.InstancedMesh(geometry,material,split?2:4);first.userData.seasonSourceGroup=0;
 if(split){first.userData.seasonSourceIndices=[0,2];const second=new THREE.InstancedMesh(geometry,material,2);second.userData.seasonSourceGroup=0;second.userData.seasonSourceIndices=[1,3];root.add(first,second);}else root.add(first);
 const d=dom(),seasons=[];installSeasons({root,legacy:{foliage:[null,null,source]}},{setSeason:s=>seasons.push(s)});
 return {root,d,seasons};
}
function colors(f){
 const colors=[];for(const mesh of f.root.children)for(let i=0;i<mesh.count;i++){const c=new THREE.Color();mesh.getColorAt(i,c);colors[mesh.userData.seasonSourceIndices?.[i]??i]=c.toArray();}return colors;
}
test('split canopy preserves exact instance colors in spring and autumn',()=>{
 const base=fixture(false),spring=colors(base);base.d.select.value='autumn';base.d.select.onchange();const autumn=colors(base);base.d.cleanup();
 const split=fixture(true);assert.deepEqual(colors(split),spring);split.d.select.value='autumn';split.d.select.onchange();assert.deepEqual(colors(split),autumn);assert.deepEqual(split.seasons,['spring','autumn']);assert.equal(document.body.dataset.season,'autumn');split.d.cleanup();
});
test('ordinary untagged meshes retain traversal and local index palette',()=>{
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial(),geometry=new THREE.BoxGeometry(),source=new THREE.InstancedMesh(geometry,material,1);
 root.add(new THREE.InstancedMesh(geometry,material,2),new THREE.InstancedMesh(geometry,material,2));const d=dom();installSeasons({root,legacy:{foliage:[null,null,source]}},{setSeason(){}});
 for(let j=0;j<2;j++)for(let i=0;i<2;i++){const n=Math.abs((Math.sin(i*12.9898+j*31.1)*43758.5453)%1),expected=new THREE.Color().setHSL(.23+n*.07,.48,.43+n*.15),actual=new THREE.Color();root.children[j].getColorAt(i,actual);assert.deepEqual(actual.toArray(),expected.toArray().map(Math.fround));}
 d.cleanup();
});
test('real shadow-only subcells share the seasonal material and exact source colors',()=>{
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial(),geometry=new THREE.BoxGeometry(),texture=new THREE.Texture(),alpha=new THREE.Texture();
 material.map=texture;material.alphaMap=alpha;material.alphaTest=.4;
 const source=new THREE.InstancedMesh(geometry,material,4);source.castShadow=true;source.userData.seasonSourceGroup=7;
 for(let i=0;i<4;i++)source.setMatrixAt(i,new THREE.Matrix4().makeTranslation(i*18,0,0));
 source.computeBoundingSphere();root.add(source);
 const matrixBefore=Array.from(source.instanceMatrix.array),stats=subdivideShadowInstanceLeaves(root,16),proxies=source.children[0].children;
 assert.equal(stats.instances,4);assert.ok(proxies.length>1);assert.equal(source.castShadow,false);assert.equal(source.layers.mask,1);
 const d=dom();installSeasons({root,legacy:{foliage:[null,null,source]}},{setSeason(){}});
 const verify=season=>{
  assert.equal(source.count,4);assert.equal(source.geometry,geometry);assert.deepEqual(Array.from(source.instanceMatrix.array),matrixBefore);
  assert.equal(source.material.map,texture);assert.equal(source.material.alphaMap,alpha);assert.equal(source.material.alphaTest,.4);
  for(const proxy of proxies){
   assert.equal(proxy.layers.mask,2);assert.equal(proxy.material,source.material);assert.equal(proxy.geometry,geometry);
   for(let i=0;i<proxy.count;i++){
    const index=proxy.userData.seasonSourceIndices[i],actual=new THREE.Color(),expected=new THREE.Color();
    proxy.getColorAt(i,actual);source.getColorAt(index,expected);assert.deepEqual(actual.toArray(),expected.toArray());
    const n=Math.abs((Math.sin(index*12.9898+7*31.1)*43758.5453)%1),palette=new THREE.Color().setHSL(season==='spring'?.23+n*.07:.025+n*.105,season==='spring'?.48:.78,.43+n*.15);
    assert.deepEqual(actual.toArray(),palette.toArray().map(Math.fround));
   }
  }
 };
 verify('spring');d.select.value='autumn';d.select.onchange();verify('autumn');d.cleanup();
});
