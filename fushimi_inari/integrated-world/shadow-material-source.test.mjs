import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installShadowMaterialSource} from './shadow-material-source.mjs';

test(`r${THREE.REVISION} shadow uniforms require the authored source despite native override cache tracking`,{skip:!['186','187'].includes(THREE.REVISION)},async()=>{
 const [{default:NodeManager},{default:MaterialReferenceNode}]=await Promise.all([
  import('three/src/renderers/common/nodes/NodeManager.js'),import('three/src/nodes/accessors/MaterialReferenceNode.js')]);
 const renderer={},manager=new NodeManager(renderer,{});renderer._nodes=manager;
 const source=new THREE.MeshStandardNodeMaterial({color:'#609c37'}),override=new THREE.NodeMaterial();override.isShadowPassMaterial=true;
 const object=new THREE.Mesh(new THREE.BoxGeometry(),source),renderObject={renderer,scene:new THREE.Scene(),object,camera:new THREE.PerspectiveCamera(),material:override,_sourceMaterial:source};
 const reference=new MaterialReferenceNode('color','color');
 reference.updateReference(manager.getNodeFrameForRender(renderObject));assert.equal(reference.getValueFromReference(),undefined,'native frames still point at a colorless shadow override');
 const original=manager.getNodeFrameForRender,handle=installShadowMaterialSource(renderer);
 const frame=manager.getNodeFrameForRender(renderObject);reference.updateReference(frame);
 assert.equal(frame.material,source);assert.equal(reference.getValueFromReference(),source.color);
 source.color.set('#e3b953');assert.equal(reference.getValueFromReference(),source.color);
 const ordinary={...renderObject,material:source,_sourceMaterial:null};assert.equal(manager.getNodeFrameForRender(ordinary).material,source);
 handle.dispose();assert.equal(manager.getNodeFrameForRender,original);
});

for(const revision of [186,187])test(`r${revision} queued and grouped shadows resolve current source while other overrides remain native`,()=>{
 const renderer={_nodes:{getNodeFrameForRender:value=>({material:value.material})}},native=renderer._nodes.getNodeFrameForRender;
 const handle=installShadowMaterialSource(renderer,{revision}),source=new THREE.MeshStandardMaterial(),other=new THREE.MeshStandardMaterial(),override={isShadowPassMaterial:true};
 assert.equal(renderer._nodes.getNodeFrameForRender({material:override,object:{material:source}}).material,source);
 assert.equal(renderer._nodes.getNodeFrameForRender({material:override,object:{material:[other,source]},group:{materialIndex:1}}).material,source);
 renderer._currentSourceMaterial=source;
 assert.equal(renderer._nodes.getNodeFrameForRender({material:override,_sourceMaterial:other,object:{material:other}}).material,source,'active source wins over a stale cached shadow owner');
 renderer._currentSourceMaterial=null;
 assert.equal(renderer._nodes.getNodeFrameForRender({material:override,_sourceMaterial:other,object:{material:[other,source]},group:{materialIndex:1}}).material,source,'queued grouped work reads its current group owner');
 const custom=new THREE.MeshBasicMaterial();assert.equal(renderer._nodes.getNodeFrameForRender({material:custom,_sourceMaterial:source}).material,custom);
 handle.dispose();assert.equal(renderer._nodes.getNodeFrameForRender,native);
 const disabled=installShadowMaterialSource(renderer,{revision:188});assert.equal(renderer._nodes.getNodeFrameForRender,native);disabled.dispose();
});
