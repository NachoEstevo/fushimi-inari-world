import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installWalking} from './walking.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {createWalkSettings} from './walk-settings.mjs';

function fixture({height=()=>0,colliders=[],canMove=()=>true,segment={kind:'stone'},allowDebugCamera=false,headBob=false,gamepad}={}){
  const saved={document:globalThis.document,location:globalThis.location,addEventListener:globalThis.addEventListener},els=new Map(),events=new Map(),steps=[],heightQueries=[],moves=[];
  globalThis.document={createElement(){return {append(){},setAttribute(){},hidden:false};},querySelector(){return null;},body:{append(){},dataset:{},classList:{add(){},remove(){},contains(){return false;}}},getElementById(id){if(!els.has(id))els.set(id,{hidden:false,textContent:''});return els.get(id);}};
  globalThis.location={search:''};globalThis.addEventListener=(type,fn)=>events.set(type,fn);
  const camera=new THREE.PerspectiveCamera(),controls={enabled:true,target:new THREE.Vector3()};camera.position.set(0,1.7,0);camera.lookAt(1,1.7,0);
  let time=0;
  const assembly={colliders,spatial:{main:[],returning:[]},surfaces:{segments:[],sample:()=>({segment}),height},walkHeight(x,z,previous){heightQueries.push({x,z,previous});return height(x,z);}};
  const walker=installWalking({camera,controls,renderer:{domElement:{addEventListener(){}}},ground:height,assembly,audio:{step(stone){steps.push({time,stone});}},onStart(){},allowDebugCamera,settings:createWalkSettings({storage:null,initial:{headBob}}),...(gamepad?{gamepad}:{}),canMove(from,to){moves.push({from:[...from],to:[...to]});return canMove(from,to);}});
  walker.start();
  return {camera,walker,steps,heightQueries,moves,key(code,down=true){events.get(down?'keydown':'keyup')({code,target:{},preventDefault(){}});},tick(dt){time+=dt;walker.update(dt);},restore(){for(const [k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}

test('stairs retain exact support for collision, gates and the next floor query while only the eye eases',()=>{
  const heights=[],original=SpatialCollisionWorld.prototype.resolvePlayer;
  SpatialCollisionWorld.prototype.resolvePlayer=function(x,y,z,...args){heights.push(y);return original.call(this,x,y,z,...args);};
  const f=fixture({height:x=>x>=.05?.18:0});
  try{
    // Acceleration eases the first frames, so walk until the tread is crossed.
    f.key('KeyW');for(let i=0;i<30&&f.camera.position.x<.05;i++)f.tick(1/60);
    assert.ok(f.camera.position.x>=.05);assert.ok(f.camera.position.y>1.7&&f.camera.position.y<1.88);
    f.tick(1/60);
    assert.equal(heights.at(-1),1.88);assert.equal(f.moves.at(-1).from[1],1.88);assert.equal(f.heightQueries.at(-1).previous,.18);
    f.key('KeyW',false);for(let i=0;i<12;i++)f.tick(1/60);const x=f.camera.position.x;
    for(let i=0;i<60;i++)f.tick(1/60);
    assert.equal(f.camera.position.x,x);assert.ok(Math.abs(f.camera.position.y-1.88)<1e-8);assert.equal(f.steps.length,0);
  }finally{f.restore();SpatialCollisionWorld.prototype.resolvePlayer=original;}
});
test('blocked walls and rejected gates never emit steps; sliding uses accepted displacement',()=>{
  for(const options of [{canMove:()=>false},{colliders:[{type:'box',args:[.48,0,.2,10,0,-1,4,'wall']}]}]){
    const f=fixture(options);try{f.key('KeyW');for(let i=0;i<120;i++)f.tick(1/60);assert.ok(Math.abs(f.camera.position.x)<1e-9);assert.equal(f.steps.length,0);}finally{f.restore();}
  }
  const f=fixture({colliders:[{type:'box',args:[.48,0,.2,10,0,-1,4,'wall']}]});
  // Sliding keeps the accepted tangential speed (5/sqrt(2) m/s); the into-wall part is dropped every frame, so the ramp is a little longer than 150 ms.
  try{f.key('KeyW');f.key('KeyD');for(let i=0;i<60;i++)f.tick(1/60);assert.ok(Math.abs(f.camera.position.x)<1e-9);assert.ok(f.camera.position.z>3);assert.equal(f.steps.length,1);}finally{f.restore();}
});
test('a blocked step leaves no stored velocity pushing into the wall or gate',()=>{
  for(const options of [{canMove:()=>false},{colliders:[{type:'box',args:[.48,0,.2,10,0,-1,4,'wall']}]}]){
    const f=fixture(options);
    try{f.key('KeyW');for(let i=0;i<30;i++)f.tick(1/60);f.key('KeyW',false);const before=f.moves.length;
      for(let i=0;i<30;i++)f.tick(1/60);
      assert.equal(f.moves.length,before,'no further collision attempts after release');assert.ok(Math.abs(f.camera.position.x)<1e-9);
    }finally{f.restore();}
  }
});
test('eased velocity converges to pace speed and stops sooner than it starts',()=>{
  const f=fixture();
  try{f.key('KeyW');f.tick(.05);const early=f.camera.position.x;assert.ok(early>0&&early<5*.05);
    for(let i=0;i<30;i++)f.tick(1/60);const x=f.camera.position.x;f.tick(.1);assert.ok(Math.abs(f.camera.position.x-x-.5)<1e-9,'full walking speed');
    f.key('KeyW',false);const releasedAt=f.camera.position.x;f.tick(.1);f.tick(.1);
    assert.ok(Math.abs(f.camera.position.x-releasedAt-5*.11/2)<1e-9,'linear 110 ms stop');
  }finally{f.restore();}
});
test('head bob moves only the view; collision and stairs use the unbobbed eye and offsets clear on pause',()=>{
  const heights=[],original=SpatialCollisionWorld.prototype.resolvePlayer;
  SpatialCollisionWorld.prototype.resolvePlayer=function(x,y,z,...args){heights.push(y);return original.call(this,x,y,z,...args);};
  const f=fixture({headBob:true});
  try{
    f.key('KeyW');let maxY=0,maxSide=0;
    for(let i=0;i<120;i++){f.tick(1/60);maxY=Math.max(maxY,Math.abs(f.walker.viewOffset.y));maxSide=Math.max(maxSide,Math.abs(f.camera.position.z));}
    assert.ok(maxY>.006&&maxY<=.0095+1e-9,`vertical ${maxY}`);assert.ok(maxSide>.002&&maxSide<=.0055+1e-9,`lateral ${maxSide}`);
    assert.ok(heights.every(y=>y===1.7),'collision eye stays physical');
    assert.ok(Math.abs(f.camera.position.y-f.walker.viewOffset.y-1.7)<1e-9);
    f.walker.pause(true);assert.deepEqual(f.walker.viewOffset,{x:0,y:0,z:0});assert.ok(Math.abs(f.camera.position.y-1.7)<1e-9);assert.ok(Math.abs(f.camera.position.z)<1e-9);
    f.walker.pause(false);f.key('KeyW',false);for(let i=0;i<60;i++)f.tick(1/60);assert.deepEqual(f.walker.viewOffset,{x:0,y:0,z:0});
  }finally{f.restore();SpatialCollisionWorld.prototype.resolvePlayer=original;}
});
test('head bob stays zero when disabled in settings or under reduced motion',()=>{
  const saved=globalThis.matchMedia;
  for(const reduced of [false,true]){
    if(reduced)globalThis.matchMedia=()=>({matches:true});
    const f=fixture({headBob:reduced});
    try{f.key('KeyW');for(let i=0;i<90;i++){f.tick(1/60);assert.deepEqual(f.walker.viewOffset,{x:0,y:0,z:0});}}finally{f.restore();if(saved===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=saved;}
  }
});
test('gamepad stick walks at analog speed, sprints, interacts and opens the menu only while active',()=>{
  const pad={connected:true,axes:[0,-.575,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  const listeners={};let menus=0;
  const gamepadEvents={addEventListener(type,fn){listeners[type]=fn;}};
  return import('./gamepad-input.mjs').then(({createGamepadInput})=>{
    const gamepad=createGamepadInput({getGamepads:()=>[null,pad],events:gamepadEvents});listeners.gamepadconnected();
    const f=fixture({gamepad});
    try{
      f.walker.setMenuHandler(()=>{menus++;f.walker.pause(true);});
      for(let i=0;i<60;i++)f.tick(1/60);
      const x=f.camera.position.x;f.tick(.1);assert.ok(Math.abs(f.camera.position.x-x-.25)<1e-6,'half deflection after dead zone gives half speed');
      pad.buttons[9].pressed=true;f.tick(1/60);assert.equal(menus,1);assert.equal(f.walker.paused,true);
      f.tick(1/60);f.tick(1/60);assert.equal(menus,1,'paused walker does not poll');
      f.walker.pause(false);f.tick(1/60);assert.equal(menus,1,'held Start does not retrigger after resume');
    }finally{f.restore();}
  });
});
test('walking is frame-rate independent and stair material reaches the unchanged audio API',()=>{
  for(const hz of [30,60,120])for(const pace of ['slow','fast'])for(const boost of [false,true]){
    const f=fixture({segment:{kind:'earth',stair:true}});
    try{f.walker.setPace(pace);f.key('KeyW');if(boost)f.key('ShiftLeft');for(let i=0;i<hz;i++)f.tick(1/hz);
      const interval=boost?.38:pace==='fast'?.44:.52;
      // The 150 ms linear ramp costs exactly half its duration at full speed.
      assert.ok(Math.abs(f.camera.position.x-(pace==='fast'?8:5)*(boost?1.5:1)*(1-.075))<1e-8);assert.equal(f.steps.length,pace==='slow'&&!boost?1:2);assert.ok(f.steps.every(s=>s.stone));
      assert.ok(f.steps[0].time>=interval-1e-9&&f.steps[0].time<interval+1/hz+1e-9);
      for(const m of f.moves)assert.ok(Math.hypot(m.to[0]-m.from[0],m.to[2]-m.from[2])<=.12+1e-9);
    }finally{f.restore();}
  }
});
test('pause, teleport and flight transitions clear cadence and reset the visual eye',()=>{
  const f=fixture({allowDebugCamera:true,height:x=>x>=1?.18:0});
  try{
    f.key('KeyW');for(let i=0;i<20;i++)f.tick(1/60);
    f.walker.pause(true);f.tick(.1);f.walker.pause(false);f.key('KeyW');f.tick(1/60);assert.equal(f.steps.length,0);
    assert.equal(f.walker.teleport([2,0,0],[3,0,0]),true);assert.equal(f.camera.position.y,1.88);f.key('KeyW');f.tick(1/60);assert.equal(f.steps.length,0);
    f.walker.fly();f.key('KeyR');f.tick(.1);assert.ok(f.camera.position.y>1.88);f.walker.start();assert.equal(f.camera.position.y,1.88);
    for(let i=0;i<60;i++)f.tick(1/60);assert.equal(f.steps.length,0);
  }finally{f.restore();}
});
