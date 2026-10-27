import test from 'node:test';
import assert from 'node:assert/strict';
import {installJourneyJournal} from './journey-journal-ui.mjs';

function node(tag='div'){
 const listeners=new Map(),classes=new Set();return {tag,children:[],dataset:{},hidden:false,disabled:false,open:false,textContent:'',innerHTML:'',
  classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){if(on)classes.add(v);else classes.delete(v);}},
  setAttribute(name,value){this[name]=value;},append(...children){this.children.push(...children);},before(child){this.sibling=child;},replaceChildren(){this.children=[];},focus(){},remove(){},
  addEventListener(type,fn){listeners.set(type,fn);},showModal(){this.open=true;},close(){this.open=false;listeners.get('close')?.();},querySelector(id){return this.elements[id.slice(1)];},querySelectorAll(){return this.tabs??[];}};
}
function fixture(){
 const previous={document:globalThis.document,window:globalThis.window},nodes=[],menu=node(),body=node(),head=node(),listeners=new Map();
 const document={body,head,hidden:false,createElement(tag){const element=node(tag);nodes.push(element);if(tag==='dialog'){
  element.elements=Object.fromEntries(['journal-number','journal-place','journal-note','journal-discoveries','journal-seal','journal-stamp-title','journal-state','journal-collect','journal-prev','journal-next','journal-complete','journal-save','journal-close','journal-overview'].map(id=>[id,node()]));
  element.tabs=Array.from({length:5},(_,i)=>({...node('button'),dataset:{page:String(i)}}));}return element;},getElementById:()=>menu,querySelector:()=>null};
 globalThis.document=document;globalThis.window={addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type)};
 const camera={position:{x:0,y:1.7,z:0}},controls={enabled:true},walker={pause(){},releasePointerLock(){}},anchors={entrance:{target:[0,0,0]},yotsu:{target:[100,20,40]}};
 const ui=installJourneyJournal({camera,controls,walker,assembly:{spatial:{byId:anchors}},storage:null});
 return {ui,camera,document,button:menu.sibling,book:nodes.find(n=>n.tag==='dialog'),notice:body.children[1],cleanup(){ui.dispose();globalThis.document=previous.document;globalThis.window=previous.window;}};
}

test('ready notice is once per session and the open book shows progress and direct distance',()=>{
 const f=fixture();try{
  f.ui.update(0);assert.equal(f.notice.hidden,false);assert.match(f.notice.textContent,/press J/i);
  f.ui.update(3000);assert.equal(f.notice.hidden,true);f.ui.update(3500);assert.equal(f.notice.hidden,true);
  f.button.onclick();assert.match(f.book.elements['journal-overview'].textContent,/0 of 5.*0 of 4/i);assert.match(f.book.elements['journal-state'].textContent,/here/i);
  f.book.elements['journal-collect'].onclick();f.book.tabs[3].onclick();assert.match(f.book.elements['journal-state'].textContent,/straight.line/i);
 }finally{f.cleanup();}
});

test('only a captured and correctly oriented viewpoint photo adds the optional note',()=>{
 const f=fixture();try{
  f.button.onclick();f.book.elements['journal-collect'].onclick();f.book.close();
  const photo={position:[100,21.7,40],direction:[-900,0,-340],width:1920,height:1080};
  assert.equal(f.ui.recordPhoto({...photo,direction:[900,0,340]}),false);assert.equal(f.ui.recordPhoto(photo),true);assert.equal(f.ui.recordPhoto(photo),false);
  f.button.onclick();assert.match(f.book.elements['journal-overview'].textContent,/1 of 4/i);
 }finally{f.cleanup();}
});
