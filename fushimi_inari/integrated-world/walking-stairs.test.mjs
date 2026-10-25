import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installWalking} from './walking.mjs';
import {SpatialCollisionWorld} from './collision.mjs';

function fixture({height=()=>0,colliders=[],canMove=()=>true,segment={kind:'stone'},allowDebugCamera=false}={}){
  const saved={document:globalThis.document,location:globalThis.location,addEventListener:globalThis.addEventListener},els=new Map(),events=new Map(),steps=[],heightQueries=[],moves=[];
  globalThis.document={createElement(){return {append(){},setAttribute(){},hidden:false};},querySelector(){return null;},body:{append(){},dataset:{},classList:{add(){},remove(){},contains(){return false;}}},getElementById(id){if(!els.has(id))els.set(id,{hidden:false,textContent:''});return els.get(id);}};
  globalThis.location={search:''};globalThis.addEventListener=(type,fn)=>events.set(type,fn);
  const camera=new THREE.PerspectiveCamera(),controls={enabled:true,target:new THREE.Vector3()};camera.position.set(0,1.7,0);camera.lookAt(1,1.7,0);
  let time=0;
  const assembly={colliders,spatial:{main:[],returning:[]},surfaces:{segments:[],sample:()=>({segment}),height},walkHeight(x,z,previous){heightQueries.push({x,z,previous});return height(x,z);}};
  const walker=installWalking({camera,controls,renderer:{domElement:{addEventListener(){}}},ground:height,assembly,audio:{step(stone){steps.push({time,stone});}},onStart(){},allowDebugCamera,canMove(from,to){moves.push({from:[...from],to:[...to]});return canMove(from,to);}});
  walker.start();
  return {camera,walker,steps,heightQueries,moves,key(code,down=true){events.get(down?'keydown':'keyup')({code,target:{},preventDefault(){}});},tick(dt){time+=dt;walker.update(dt);},restore(){for(const [k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}

test('stairs retain exact support for collision, gates and the next floor query while only the eye eases',()=>{
  const heights=[],original=SpatialCollisionWorld.prototype.resolvePlayer;
  SpatialCollisionWorld.prototype.resolvePlayer=function(x,y,z,...args){heights.push(y);return original.call(this,x,y,z,...args);};
  const f=fixture({height:x=>x>=.05?.18:0});
  try{
    f.key('KeyW');f.tick(1/60);
    assert.ok(f.camera.position.y>1.7&&f.camera.position.y<1.88);
    f.tick(1/60);
    assert.equal(heights.at(-1),1.88);assert.equal(f.moves.at(-1).from[1],1.88);assert.equal(f.heightQueries.at(-1).previous,.18);
    f.key('KeyW',false);const x=f.camera.position.x;
    for(let i=0;i<60;i++)f.tick(1/60);
    assert.equal(f.camera.position.x,x);assert.ok(Math.abs(f.camera.position.y-1.88)<1e-8);assert.equal(f.steps.length,0);
  }finally{f.restore();SpatialCollisionWorld.prototype.resolvePlayer=original;}
});
test('blocked walls and rejected gates never emit steps; sliding uses accepted displacement',()=>{
  for(const options of [{canMove:()=>false},{colliders:[{type:'box',args:[.48,0,.2,10,0,-1,4,'wall']}]}]){
    const f=fixture(options);try{f.key('KeyW');for(let i=0;i<120;i++)f.tick(1/60);assert.ok(Math.abs(f.camera.position.x)<1e-9);assert.equal(f.steps.length,0);}finally{f.restore();}
  }
  const f=fixture({colliders:[{type:'box',args:[.48,0,.2,10,0,-1,4,'wall']}]});
  try{f.key('KeyW');f.key('KeyD');for(let i=0;i<60;i++)f.tick(1/60);assert.ok(Math.abs(f.camera.position.x)<1e-9);assert.ok(f.camera.position.z>3.5);assert.equal(f.steps.length,1);}finally{f.restore();}
});
test('walking is frame-rate independent and stair material reaches the unchanged audio API',()=>{
  for(const hz of [30,60,120])for(const pace of ['slow','fast'])for(const boost of [false,true]){
    const f=fixture({segment:{kind:'earth',stair:true}});
    try{f.walker.setPace(pace);f.key('KeyW');if(boost)f.key('ShiftLeft');for(let i=0;i<hz;i++)f.tick(1/hz);
      const interval=boost?.38:pace==='fast'?.44:.52;
      assert.ok(Math.abs(f.camera.position.x-(pace==='fast'?8:5)*(boost?1.5:1))<1e-8);assert.equal(f.steps.length,pace==='slow'&&!boost?1:2);assert.ok(f.steps.every(s=>s.stone));
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
