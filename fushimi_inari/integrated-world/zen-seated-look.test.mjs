import test from 'node:test';
import assert from 'node:assert/strict';
import {installZenSeatedLook} from './zen-seated-look.mjs';
class Target {
 constructor(){this.events=new Map();this.captured=new Set();}
 addEventListener(type,fn){if(!this.events.has(type))this.events.set(type,new Set());this.events.get(type).add(fn);}
 removeEventListener(type,fn){this.events.get(type)?.delete(fn);}
 emit(type,event={}){for(const fn of this.events.get(type)??[])fn(event);}
 setPointerCapture(id){this.captured.add(id);}
 releasePointerCapture(id){this.captured.delete(id);}
}
test('canvas drag and arrows move the seat, overlays clear input and disposal removes listeners',()=>{
 const element=new Target(),document=new Target(),view=new Target();document.defaultView=view;
 const calls=[],seat={look:(...v)=>calls.push(v)};let enabled=true;
 const input=installZenSeatedLook({element,document,seat,enabled:()=>enabled});
 element.emit('pointerdown',{button:0,pointerId:1,clientX:10,clientY:10});
 element.emit('pointermove',{pointerId:1,clientX:30,clientY:20});assert.deepEqual(calls.pop(),[-.06,-.03]);
 let prevented=0;const key={code:'ArrowLeft',target:{closest:()=>false},preventDefault:()=>prevented++};document.emit('keydown',key);input.update(.1);assert.ok(calls.pop()[0]>0);assert.equal(prevented,1);
 enabled=false;input.update(.1);assert.equal(element.captured.size,0);enabled=true;input.update(.1);assert.deepEqual(calls.pop(),[0,0]);
 document.emit('keydown',{...key,target:{closest:()=>true}});assert.equal(prevented,1);
 input.dispose();const count=calls.length;element.emit('pointermove',{pointerId:1,clientX:1,clientY:1});document.emit('keydown',key);input.update(.1);assert.equal(calls.length,count);assert.equal(prevented,1);
});
test('cancel and blur release captured pointers',()=>{
 const element=new Target(),document=new Target();document.defaultView=new Target();const input=installZenSeatedLook({element,document,seat:{look(){}},enabled:()=>true});
 const down={button:0,pointerId:2,clientX:0,clientY:0};element.emit('pointerdown',down);element.emit('pointercancel',down);assert.equal(element.captured.size,0);element.emit('pointerdown',down);document.defaultView.emit('blur');assert.equal(element.captured.size,0);input.dispose();
});
test('lost pointer capture stops the drag and permits a fresh drag',()=>{
 const element=new Target(),document=new Target();document.defaultView=new Target();const calls=[];
 const input=installZenSeatedLook({element,document,seat:{look:(...v)=>calls.push(v)},enabled:()=>true});
 element.emit('pointerdown',{button:0,pointerId:1,clientX:10,clientY:10});
 element.captured.delete(1);element.emit('lostpointercapture',{pointerId:1});
 element.emit('pointermove',{pointerId:1,clientX:100,clientY:100});assert.equal(calls.length,0);
 element.emit('pointerdown',{button:0,pointerId:2,clientX:10,clientY:10});
 element.emit('pointermove',{pointerId:2,clientX:20,clientY:10});assert.deepEqual(calls,[[-.03,-0]]);
 input.dispose();
});
test('disabled overlay events never accumulate a drag or held arrow',()=>{
 const element=new Target(),document=new Target();document.defaultView=new Target();const calls=[];let enabled=true,prevented=0;
 const input=installZenSeatedLook({element,document,seat:{look:(...v)=>calls.push(v)},enabled:()=>enabled});
 const key={code:'ArrowLeft',target:{closest:()=>false},preventDefault:()=>prevented++};
 element.emit('pointerdown',{button:0,pointerId:1,clientX:0,clientY:0});document.emit('keydown',key);
 enabled=false;element.emit('pointermove',{pointerId:1,clientX:300,clientY:300});
 document.emit('keydown',key);element.emit('pointerdown',{button:0,pointerId:2,clientX:300,clientY:300});input.update(.1);
 assert.equal(calls.length,0);assert.equal(prevented,1);assert.equal(element.captured.size,0);
 enabled=true;element.emit('pointermove',{pointerId:1,clientX:500,clientY:500});element.emit('pointermove',{pointerId:2,clientX:500,clientY:500});input.update(.1);
 assert.deepEqual(calls,[[0,0]]);input.dispose();
});
