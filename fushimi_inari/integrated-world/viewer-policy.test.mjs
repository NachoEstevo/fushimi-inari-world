import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./viewer.mjs',import.meta.url),'utf8');
const clearRoute=source.slice(source.indexOf('  function clearRoute(){'),source.indexOf('  function trace(){'));
function resetRoute({guided,debug=false,walkerInstalled=true}){
  const elements=new Map();let starts=0;
  const context={walking:guided,allowDebugCamera:debug,controls:{},activeRoute:[[0,0,0]],routeProgress:3,travelled:4,marker:{visible:true},routeLine:null,
    $:id=>{if(!elements.has(id))elements.set(id,{style:{}});return elements.get(id);}};
  if(walkerInstalled)context.walker={start(){starts++;context.walking=false;context.controls.enabled=false;}};
  vm.runInNewContext(`${clearRoute}\nclearRoute();`,context);
  return {context,starts};
}
test('public route replan hands the guided camera back to walking',()=>{
  const {context,starts}=resetRoute({guided:true});
  assert.equal(starts,1);assert.equal(context.walking,false);assert.equal(context.controls.enabled,false);
  assert.equal(context.activeRoute.length,0);assert.equal(context.routeProgress,0);
});
test('initial route preparation never accesses an uninstalled walker',()=>{
  const {starts}=resetRoute({guided:false,walkerInstalled:false});assert.equal(starts,0);
});
test('debug route replan preserves orbit ownership',()=>{
  const {context,starts}=resetRoute({guided:true,debug:true});assert.equal(starts,0);assert.equal(context.controls.enabled,true);
});
