import test from 'node:test';
import assert from 'node:assert/strict';
import {isUnsupportedEntranceProp,isUnsupportedEntranceCollider} from './entrance-unsupported-props.mjs';

const mesh=(type,parameters)=>({geometry:{type,parameters}});
function lantern(x,z){return {isGroup:true,userData:{zone:'entrance'},position:{x,y:0,z},scale:{x:.96,y:.96,z:.96},children:[
  mesh('BoxGeometry',{width:.72,height:.26,depth:.72}),
  mesh('CylinderGeometry',{radiusTop:.16,radiusBottom:.20,height:.98}),
  mesh('BoxGeometry',{width:.66,height:.14,depth:.66}),
  mesh('BoxGeometry',{width:.42,height:.38,depth:.42}),
  mesh('ConeGeometry',{radius:.64,height:.36,radialSegments:6}),
  mesh('SphereGeometry',{radius:.11})]};}
const blocker=(x,z)=>({zone:'entrance',type:'cylinder',args:[x,z,.34*.96,42,42+2.2*.96,'lantern']});
const light=(x,z)=>({isPointLight:true,userData:{zone:'entrance'},position:{x,y:43.536,z},intensity:2.8,distance:12,decay:1.8});

test('only the fourteen source row lanterns, six associated lights and matching blockers are omitted',()=>{
  for(const x of [-6.8,6.8])for(const z of [10,14.5,19,24.5,29.5,34.5,40.5]){
    assert.ok(isUnsupportedEntranceProp(lantern(x,z)));
    assert.ok(isUnsupportedEntranceCollider(blocker(x,z)));
    assert.equal(isUnsupportedEntranceProp(light(x,z)),[14.5,24.5,34.5].includes(z));
  }
  for(const [x,z] of [[6.81,14.5],[6.8,14.51],[6.6,-18],[11.8,-35.5],[6.8,9.9]]){
    assert.equal(isUnsupportedEntranceProp(lantern(x,z)),false);
    assert.equal(isUnsupportedEntranceProp(light(x,z)),false);
    assert.equal(isUnsupportedEntranceCollider(blocker(x,z)),false);
  }
  const other=lantern(6.8,14.5);other.userData.zone='precinct';assert.equal(isUnsupportedEntranceProp(other),false);
  const c=blocker(6.8,14.5);c.zone='precinct';assert.equal(isUnsupportedEntranceCollider(c),false);
  const l=light(6.8,14.5);l.userData.zone='okusha';assert.equal(isUnsupportedEntranceProp(l),false);
  const altered=lantern(6.8,14.5);altered.scale.x=1;assert.equal(isUnsupportedEntranceProp(altered),false);
  const unrelated=lantern(6.8,14.5);unrelated.children[0].geometry.parameters.width=1;assert.equal(isUnsupportedEntranceProp(unrelated),false);
  const lightChanged=light(6.8,14.5);lightChanged.distance=20;assert.equal(isUnsupportedEntranceProp(lightChanged),false);
  const blockerChanged=blocker(6.8,14.5);blockerChanged.args[2]=.5;assert.equal(isUnsupportedEntranceCollider(blockerChanged),false);
});
