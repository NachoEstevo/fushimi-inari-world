import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./viewer.mjs',import.meta.url),'utf8');
const clearRoute=source.slice(source.indexOf('  function clearRoute(){'),source.indexOf('  async function trace(){'));
function resetRoute({guided,debug=false,walkerInstalled=true}){
  const elements=new Map();let starts=0;
  const context={routeRequest:0,walking:guided,allowDebugCamera:debug,controls:{},activeRoute:[[0,0,0]],routeProgress:3,travelled:4,marker:{visible:true},routeLine:null,
    $:id=>{if(!elements.has(id))elements.set(id,{style:{}});return elements.get(id);}};
  if(walkerInstalled)context.walker={start(){starts++;context.walking=false;context.controls.enabled=false;}};
  vm.runInNewContext(`${clearRoute}\nclearRoute();`,context);
  return {context,starts};
}
test('public route replan hands the guided camera back to walking',()=>{
  const {context,starts}=resetRoute({guided:true});
  assert.equal(starts,1);assert.equal(context.walking,false);assert.equal(context.controls.enabled,false);
  assert.equal(context.routeRequest,1);assert.equal(context.activeRoute.length,0);assert.equal(context.routeProgress,0);
});
test('initial route preparation never accesses an uninstalled walker',()=>{
  const {starts}=resetRoute({guided:false,walkerInstalled:false});assert.equal(starts,0);
});
test('debug route replan preserves orbit ownership',()=>{
  const {context,starts}=resetRoute({guided:true,debug:true});assert.equal(starts,0);assert.equal(context.controls.enabled,true);
});

const showRoute=source.slice(source.indexOf('  async function showRoute(){'),source.indexOf("  $('route').onclick=trace;"));
test('a stale prepared guide releases resources without replacing the current route',async()=>{
 let resolve,disposed=0,added=0;const pending=new Promise(r=>resolve=r);
 const context={routeRequest:0,activeRoute:[[0,0,0],[1,0,0]],routeLine:null,assembly:{walkHeight(){}},yieldStartupTask(){},createTrailGuide:()=>pending,scene:{add(){added++;}}};
 const result=vm.runInNewContext(`${showRoute}\nshowRoute();`,context);context.routeRequest++;
 resolve({geometry:{dispose(){disposed++;}},material:{dispose(){disposed++;}}});await result;
 assert.equal(disposed,2);assert.equal(added,0);assert.equal(context.routeLine,null);
});
test('an unavailable decorative guide preserves valid navigation controls',async()=>{
 const elements=new Map([['route-info',{textContent:'Mapped route.'}],['walk',{disabled:true}]]);let drawn=0;
 const context={routeRequest:0,activeRoute:[[0,0,0],[1,0,0]],routeLine:null,assembly:{walkHeight(){}},yieldStartupTask(){},createTrailGuide:async()=>null,
 document:{body:{dataset:{}}},$:id=>elements.get(id),profile(){},drawMap(){drawn++;},marker:{position:{set(){}},visible:true}};
 await vm.runInNewContext(`${showRoute}\nshowRoute();`,context);
 assert.equal(elements.get('walk').disabled,false);assert.equal(context.marker.visible,false);assert.equal(drawn,1);assert.match(elements.get('route-info').textContent,/unavailable/);
});
