import test from 'node:test';
import assert from 'node:assert/strict';
import {installDrinkMachineService} from './drink-machine-service.mjs';
function fixture(doc=null){
 const sounds=[],state={selected:0,phase:'ready'},events=[],original={directAction(){state.phase='ready';events.push(state.selected);return {event:{type:'drink.collected'}};}};
 const machine={spec:{id:'station',position:[0,0,0]},group:{userData:{interactable:original}},controller:{state,select(){state.selected=(state.selected+1)%4;},dispense(){state.phase='dispensed';}}};
 let blocked=false;const api=installDrinkMachineService({commerce:{machines:[machine]},camera:{position:{x:0,y:1.7,z:1}},walker:{mode:'walk',pause(){}},document:doc,onSound:event=>sounds.push(event),getBlocked:()=>blocked});
 return {api,machine,original,events,sounds,blocked:v=>blocked=v};
}
test('selection dispenses the chosen product only after preparation and collection remains owned by commerce',()=>{
 const f=fixture();assert.equal(f.api.order('station','coffee'),true);assert.equal(f.machine.controller.state.selected,2);assert.equal(f.api.order('station','water'),false);
 f.api.update(20,{blocked:true});assert.equal(f.machine.controller.state.phase,'ready');f.api.update(NaN);f.api.update(20);assert.equal(f.machine.controller.state.phase,'ready');
 for(let i=0;i<18;i++)f.api.update(.1);assert.equal(f.machine.controller.state.phase,'dispensed');assert.equal(f.api.order('station','water'),false);
 const result=f.machine.group.userData.interactable.directAction();assert.equal(result.event.type,'drink.collected');assert.deepEqual(f.events,[2]);assert.equal(f.machine.controller.state.phase,'ready');f.api.dispose();assert.equal(f.machine.group.userData.interactable,f.original);
});
test('blocked and remote selections do not start a vend and disposal never leaves a wrapped owner',()=>{
 const f=fixture();f.blocked(true);assert.equal(f.api.order('station','water'),false);f.blocked(false);assert.equal(f.api.order('station','missing'),false);f.api.dispose();f.api.dispose();assert.equal(f.api.order('station','water'),false);
});

function documentFixture(){
 const nodes=[],doc={body:{append(){}},createElement(tag){const listeners=new Map(),node={tag,children:[],open:false,setAttribute(){},append(...items){this.children.push(...items);},querySelector(){return this.children.find(n=>n.tag==='div')?.children[0];},focus(){},remove(){},addEventListener:(t,f)=>listeners.set(t,f),showModal(){this.open=true;},close(){this.open=false;listeners.get('close')?.();},listeners};nodes.push(node);return node;}};return {doc,nodes};
}
test('closing or cancelling the product menu never dispenses and selection restores walking',()=>{
 const d=documentFixture(),f=fixture(d.doc),dialog=d.nodes.find(n=>n.tag==='dialog');
 assert.equal(f.api.open('station'),true);assert.equal(f.api.active,true);dialog.listeners.get('cancel')({preventDefault(){}});assert.equal(f.api.active,false);assert.equal(f.api.stats.pending,0);assert.equal(f.machine.controller.state.phase,'ready');
 assert.equal(f.api.open('station'),true);d.nodes.find(n=>n.tag==='div').children[1].onclick();assert.equal(f.api.active,false);assert.equal(f.api.stats.pending,1);assert.equal(f.machine.controller.state.selected,1);f.api.dispose();assert.equal(f.machine.group.userData.interactable,f.original);
});

test('physical collection and foley follow accepted actions, never cancelled or repeated ones',()=>{
 const f=fixture();assert.equal(f.api.collect('station'),null);f.blocked(true);f.api.order('station','coffee');assert.equal(f.sounds.length,0);f.blocked(false);
 assert.equal(f.api.order('station','coffee'),true);assert.deepEqual(f.sounds.map(s=>s.type),['vending.select']);f.api.order('station','water');
 f.api.update(.1,{blocked:true});assert.equal(f.sounds.length,1);for(let i=0;i<18;i++)f.api.update(.1);
 assert.deepEqual(f.sounds.map(s=>s.type),['vending.select','vending.dispense']);assert.deepEqual(f.sounds[0].position,[0,0,0]);
 assert.equal(f.api.collect('station').event.type,'drink.collected');assert.equal(f.api.collect('station'),null);f.api.dispose();
});
