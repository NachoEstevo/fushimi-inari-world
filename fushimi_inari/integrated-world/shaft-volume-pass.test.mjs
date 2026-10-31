import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {pass} from 'three/tsl';
import {createShaftVolumePass} from './shaft-volume-pass.mjs';

test('volume dependency renders opaque depth once per frame and skips inactive frames',()=>{
 const scene=new THREE.Scene(),world=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,1),new THREE.MeshBasicMaterial());scene.add(mesh);mesh.visible=false;
 let target=null,clearAlpha=1,mrt=null,clear=new THREE.Color('red');const renders=[];
 const renderer={samples:4,getRenderTarget:()=>target,setRenderTarget:value=>target=value,getClearColor:out=>out.copy(clear),getClearAlpha:()=>clearAlpha,
  setClearColor(value,alpha){clear.set(value);clearAlpha=alpha;},clear(){renders.push('clear');},getOutputRenderTarget:()=>null,
  getDrawingBufferSize:out=>out.set(1200,800),getMRT:()=>mrt,setMRT:value=>mrt=value,
  render(value){if(value===world)assert.equal(clear.getHexString(),'ff0000','opaque pass owns its original clear color');renders.push(value===world?'world':'volume');}};
 const scenePass=pass(world,camera),effect=createShaftVolumePass({renderer,scene,camera,scenePass});
 // The real NodeFrame, rather than a fake dependency counter, verifies that
 // reaching the world both directly and via the volume cannot render it twice.
 const frame=new THREE.NodeFrame();frame.renderer=renderer;frame.frameId=1;
 frame.updateBeforeNode(effect.pass);assert.deepEqual(renders,['clear']);assert.equal(effect.pass.renderTarget.width,1);
 assert.equal(target,null);assert.equal(clearAlpha,1);assert.equal(clear.getHexString(),'ff0000');
 frame.frameId++;frame.updateBeforeNode(effect.pass);assert.deepEqual(renders,['clear']);
 mesh.visible=true;frame.frameId++;frame.updateBeforeNode(effect.pass);frame.updateBeforeNode(scenePass);
 assert.deepEqual(renders,['clear','world','volume']);assert.equal(effect.stats.width,1200);assert.equal(effect.pass.renderTarget.samples,0);
 mesh.visible=false;frame.frameId++;frame.updateBeforeNode(scenePass);frame.updateBeforeNode(effect.pass);
 assert.deepEqual(renders,['clear','world','volume','world']);assert.equal(effect.stats.active,false);
 effect.dispose();mesh.geometry.dispose();mesh.material.dispose();scenePass.dispose();
});

test('a volume render failure restores render target and clear ownership',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();scene.add(new THREE.Mesh());
 const prior=new THREE.RenderTarget(),color=new THREE.Color('red');let target=prior,alpha=.5,mrt=null;
 const renderer={getRenderTarget:()=>target,setRenderTarget:value=>target=value,getClearColor:out=>out.copy(color),getClearAlpha:()=>alpha,setClearColor(value,a){color.set(value);alpha=a;},
  getOutputRenderTarget:()=>null,getDrawingBufferSize:out=>out.set(100,100),getMRT:()=>mrt,setMRT:value=>mrt=value,render(){throw Error('volume failed');}};
 const scenePass=pass(new THREE.Scene(),camera),effect=createShaftVolumePass({renderer,scene,camera,scenePass});
 assert.throws(()=>effect.pass.updateBefore({renderer,updateBeforeNode(){}}),/volume failed/);
 assert.equal(target,prior);assert.equal(alpha,.5);assert.equal(color.getHexString(),'ff0000');
 effect.dispose();scenePass.dispose();prior.dispose();
});
