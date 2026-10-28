import test from 'node:test';
import assert from 'node:assert/strict';
import {createZenJourney} from './zen-journey-state.mjs';
import {installZenJourneyUI,zenPostcardLines} from './zen-journey-ui.mjs';

function node(tag='div'){
 const listeners=new Map(),classes=new Set();
 const value={tag,children:[],dataset:{},hidden:false,open:false,attributes:{},textContent:'',
  classList:{contains:name=>classes.has(name),add:name=>classes.add(name),toggle(name,on){if(on)classes.add(name);else classes.delete(name);}},
  setAttribute(name,text){this.attributes[name]=text;},append(...items){for(const item of items){item.parent?.children.splice(item.parent.children.indexOf(item),1);item.parent=this;this.children.push(item);}},
  replaceChildren(...items){for(const child of this.children)child.parent=null;this.children=[];this.append(...items);},
  addEventListener(type,fn){listeners.set(type,fn);},dispatch(type,event){listeners.get(type)?.(event);},click(){this.onclick?.();},focus(){this.focused=true;},close(){this.open=false;},remove(){this.parent?.children.splice(this.parent.children.indexOf(this),1);},
  querySelector(selector){return this.children.find(c=>selector.startsWith('.')?c.classList.contains(selector.slice(1)):c.id===selector.slice(1))??null;}
 };Object.defineProperty(value,'className',{set(text){classes.clear();for(const c of text.split(' '))classes.add(c);},get(){return [...classes].join(' ');}});return value;
}
function fixture(options={}){
 const previous=globalThis.document,head=node(),binding=node(),top=node(),seal=node(),book=node('dialog');binding.className='journal-binding';top.className='journal-top';binding.append(top,seal);book.append(binding);
 const open=node('button');open.click=()=>{book.open=true;};const all=[];
 globalThis.document={head,createElement(tag){const value=node(tag);all.push(value);return value;},getElementById(id){return id==='journey-journal'?book:id==='journal-open'?open:null;}};
 const journey=createZenJourney({locations:{station:[0,0,0],yotsu:[200,20,0],tea:[200,20,0]}}),calls=[];
 const ui=installZenJourneyUI({journey,album:{list:async()=>[]},getContext:()=>({position:[0,1.7,0],mode:'walk'}),onReturn:()=>calls.push('train'),onIntention:id=>calls.push(id),...options});
 const find=text=>all.find(e=>e.textContent===text);
 return {ui,book,open,journey,calls,find,binding,top,seal,all,cleanup(){ui.dispose();journey.dispose();globalThis.document=previous;}};
}

test('one existing journal keeps its close header and switches accessible sections',()=>{
 const f=fixture();try{
  assert.equal(f.binding.children[0],f.top);assert.equal(f.find('Journal').attributes['aria-selected'],'true');assert.equal(f.find('Seals').attributes['aria-selected'],'false');
  assert.equal(f.all.filter(node=>node.attributes.role==='tablist').length,1);assert.equal(f.find('Options').parent.open,false);
  f.find('Seals').click();assert.equal(f.seal.parent.hidden,false);assert.equal(f.find('Seals').attributes['aria-selected'],'true');
  f.find('Journal').click();assert.equal(f.journey.snapshot().moments.aki,undefined);
  const note=f.all.find(node=>node.className==='zen-story-copy');f.journey.recordMoment('postcard',{position:[0,1.7,0],mode:'walk',intent:'interact'});assert.match(note.textContent,/platform/);
  f.journey.recordMoment('aki',{position:[0,1.7,0],mode:'walk',intent:'interact'});assert.match(note.textContent,/Yotsutsuji/);
  const sketches=f.find('Sketches');sketches.dispatch('keydown',{key:'ArrowRight',preventDefault(){}});assert.equal(f.find('Seals').attributes['aria-selected'],'true');
 }finally{f.cleanup();}assert.deepEqual(f.binding.children,[f.top,f.seal]);
});
test('ending appears only after root completes the train and continuing releases its camera owner',async()=>{
 let f;f=fixture({onContinueWalking:()=>f.calls.push('continue')});try{
  assert.equal(f.find('Postcard').hidden,true);f.find('Return by train').click();await Promise.resolve();assert.deepEqual(f.calls,['train']);assert.equal(f.journey.snapshot().visit.finishedAt,0);
  f.journey.recordMoment('return',{position:[0,1.7,0],mode:'walk',intent:'interact'});f.journey.finishVisit();f.ui.showEnding();
  assert.equal(f.book.open,true);assert.equal(f.find('Postcard').hidden,false);assert.equal(f.find('Postcard').attributes['aria-selected'],'true');assert.equal(f.find('Save postcard').disabled,undefined);
  f.find('Continue walking').click();assert.equal(f.book.open,false);assert.equal(f.journey.snapshot().visit.number,2);assert.equal(f.journey.snapshot().visit.finishedAt,0);assert.deepEqual(f.calls,['train','continue']);
 }finally{f.cleanup();}
});
test('postcard prose reflects earned moments and never invents a photo or tea stop',()=>{
 const empty={moments:{},sketches:{},photoPrompts:{},story:{complete:false}};
 assert.doesNotMatch(zenPostcardLines(empty).join(' '),/Tea at|Kyoto from Yotsutsuji/);
 assert.match(zenPostcardLines({...empty,moments:{tea:1},photoPrompts:{'kyoto-view':2}}).join(' '),/Kyoto from Yotsutsuji.*Tea at Suehiro-ya/);
});
test('observation ink stays hidden until a real validated view is recorded, then includes accessible descriptions',()=>{
 const f=fixture();try{
  const drawings=f.all.filter(e=>e.className==='zen-drawing');assert.equal(drawings.length,3);assert.ok(drawings.every(e=>e.hidden&&!e.innerHTML));
  assert.equal(f.journey.recordMoment('sketch-city',{position:[200,21.7,0],direction:[1,0,0],mode:'walk',intent:'observe',fov:45}),false);assert.equal(drawings[2].hidden,true);
  assert.equal(f.journey.recordMoment('sketch-city',{position:[200,21.7,0],direction:[-1,0,0],mode:'walk',intent:'observe',fov:45}),true);
  assert.ok(!drawings[2].innerHTML,'earned artwork does not load while the journal is closed');
  f.book.open=true;f.find('Sketches').click();
  assert.equal(drawings[2].hidden,false);assert.match(drawings[2].innerHTML,/role="img".*aria-labelledby="zen-ink-city-title zen-ink-city-desc"/);assert.match(drawings[2].innerHTML,/<title.*A city in layers<\/title>/);assert.match(drawings[2].innerHTML,/<desc.*An authored ink drawing/);assert.ok(drawings.slice(0,2).every(e=>e.hidden&&!e.innerHTML));
 }finally{f.cleanup();}
});

test('ending opens through its owner callback even when the journal button is stale-disabled',()=>{
 let f,opens=0;f=fixture({onOpen(){opens++;f.book.open=true;}});try{
  f.open.disabled=true;f.open.click=()=>{if(!f.open.disabled)f.book.open=true;};
  f.journey.recordMoment('return',{position:[0,1.7,0],mode:'walk',intent:'interact'});f.journey.finishVisit();f.ui.showEnding();
  assert.equal(opens,1);assert.equal(f.book.open,true);assert.equal(f.find('Postcard').attributes['aria-selected'],'true');f.ui.showEnding();assert.equal(opens,1);
 }finally{f.cleanup();}
});

const captured=thumbnailId=>({position:[0,1.7,0],direction:[-1,0,0],mode:'walk',weather:'clear',fov:45,width:1920,height:1080,thumbnailId});
const settledPhotos=async()=>{await Promise.resolve();await Promise.resolve();};
const photoGrid=f=>f.all.find(node=>node.className==='zen-photo-grid');
const postcardPreview=f=>f.all.find(node=>node.className==='zen-ending-photo').children[0];

test('the postcard follows the latest available photo until the player makes a choice',async()=>{
 const records=[{id:'new',url:'blob:new',persistent:true,createdAt:20},{id:'old',url:'blob:old',persistent:true,createdAt:10}],f=fixture({album:{list:async()=>records}});
 try{
  f.journey.recordPhoto(captured('old'));await settledPhotos();assert.equal(postcardPreview(f).src,'blob:old');
  f.journey.recordPhoto(captured('new'));await settledPhotos();assert.equal(postcardPreview(f).src,'blob:new');
  f.journey.recordMoment('return',{position:[0,1.7,0],mode:'walk',intent:'interact'});f.journey.finishVisit();f.ui.showEnding();await settledPhotos();assert.equal(postcardPreview(f).src,'blob:new');
  assert.equal(photoGrid(f).children.find(node=>node.dataset.photoId==='new').attributes['aria-pressed'],'true');
 }finally{f.cleanup();}
});

test('an explicit drawing survives new photos and repeated album refreshes',async()=>{
 const records=[{id:'first',url:'blob:first',persistent:true,createdAt:10}],f=fixture({album:{list:async()=>records}});
 try{
  f.journey.recordPhoto(captured('first'));f.journey.recordMoment('return',{position:[0,1.7,0],mode:'walk',intent:'interact'});f.journey.finishVisit();f.ui.showEnding();await settledPhotos();
  photoGrid(f).children.find(node=>node.dataset.photoId==='').click();assert.equal(postcardPreview(f).className,'zen-postcard-drawing');
  records.unshift({id:'latest',url:'blob:latest',persistent:true,createdAt:20});f.journey.recordPhoto(captured('latest'));await settledPhotos();f.find('Photos').click();await settledPhotos();
  assert.equal(postcardPreview(f).className,'zen-postcard-drawing');assert.equal(photoGrid(f).children.find(node=>node.dataset.photoId==='').attributes['aria-pressed'],'true');
 }finally{f.cleanup();}
});

test('an explicit photo stays selected until its asset disappears, then falls back to the latest',async()=>{
 let records=[{id:'new',url:'blob:new',persistent:true,createdAt:20},{id:'old',url:'blob:old',persistent:true,createdAt:10}];const f=fixture({album:{list:async()=>records}});
 try{
  f.journey.recordPhoto(captured('old'));f.journey.recordPhoto(captured('new'));await settledPhotos();photoGrid(f).children.find(node=>node.dataset.photoId==='old').click();
  records.unshift({id:'latest',url:'blob:latest',persistent:true,createdAt:30});f.journey.recordPhoto(captured('latest'));await settledPhotos();assert.equal(postcardPreview(f).src,'blob:old');
  records=records.filter(photo=>photo.id!=='old');f.find('Photos').click();await settledPhotos();assert.equal(postcardPreview(f).src,'blob:latest');
  records=[];f.find('Photos').click();await settledPhotos();assert.equal(postcardPreview(f).className,'zen-postcard-drawing');
 }finally{f.cleanup();}
});
