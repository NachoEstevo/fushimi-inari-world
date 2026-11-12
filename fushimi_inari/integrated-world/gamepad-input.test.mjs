import test from 'node:test';
import assert from 'node:assert/strict';
import {createGamepadInput,stickResponse,GAMEPAD_DEAD_ZONE} from './gamepad-input.mjs';
function rig(){
  const listeners={},pad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};let calls=0;
  const input=createGamepadInput({getGamepads:()=>{calls++;return [null,pad];},events:{addEventListener(type,fn){listeners[type]=fn;}}});
  return {input,pad,listeners,get calls(){return calls;}};
}
test('stick dead zone is radial, rescaled from zero and curved for fine look',()=>{
  const out={x:0,y:0};
  stickResponse(.1,.1,GAMEPAD_DEAD_ZONE,1,out);assert.deepEqual(out,{x:0,y:0});
  stickResponse(GAMEPAD_DEAD_ZONE+.0001,0,GAMEPAD_DEAD_ZONE,1,out);assert.ok(out.x>0&&out.x<.001);
  stickResponse(1,0,GAMEPAD_DEAD_ZONE,1.7,out);assert.equal(out.x,1);
  stickResponse(.575,0,GAMEPAD_DEAD_ZONE,1.7,out);assert.ok(Math.abs(out.x-Math.pow(.5,1.7))<1e-12);
  stickResponse(1,1,GAMEPAD_DEAD_ZONE,1,out);assert.ok(Math.abs(Math.hypot(out.x,out.y)-1)<1e-12,'diagonal stays within unit speed');
  stickResponse(NaN,undefined,GAMEPAD_DEAD_ZONE,1,out);assert.deepEqual(out,{x:0,y:0});
});
test('no polling until a pad connects, and disconnect clears state',()=>{
  const r=rig();r.input.poll();assert.equal(r.calls,0);assert.equal(r.input.state.connected,false);
  r.listeners.gamepadconnected();r.pad.axes[1]=-1;const state=r.input.poll();assert.equal(r.calls,1);assert.equal(state.moveY,-1);
  assert.equal(r.input.poll(),state,'state object is reused');
  r.listeners.gamepaddisconnected();assert.equal(r.input.poll().moveY,0);assert.equal(r.calls,2);
});
test('buttons report presses on edges only and a reset primes held buttons',()=>{
  const r=rig();r.listeners.gamepadconnected();
  r.pad.buttons[0].pressed=true;assert.equal(r.input.poll().interact,false,'first poll primes');
  r.pad.buttons[0].pressed=false;r.input.poll();r.pad.buttons[0].pressed=true;assert.equal(r.input.poll().interact,true);assert.equal(r.input.poll().interact,false,'held is not repeated');
  r.pad.buttons[9].pressed=true;assert.equal(r.input.poll().menu,true);r.input.reset();assert.equal(r.input.poll().menu,false);
  r.pad.buttons[1].value=.9;assert.equal(r.input.poll().back,true);
  r.pad.buttons[7].value=.8;assert.equal(r.input.poll().sprint,true);r.pad.buttons[7].value=.2;assert.equal(r.input.poll().sprint,false);
});
test('missing Gamepad API or a throwing getter is harmless',()=>{
  const listeners={},input=createGamepadInput({getGamepads(){throw Error('blocked by policy');},events:{addEventListener(t,f){listeners[t]=f;}}});
  listeners.gamepadconnected();assert.equal(input.poll().connected,false);
  assert.equal(createGamepadInput({getGamepads:()=>null,events:null}).poll().connected,false);
});
