import {ZEN_INTENTIONS,ZEN_PHOTO_PROMPTS,ZEN_SKETCHES} from './zen-journey-state.mjs';

const AKI=[
 ['An old postcard','At the station, Aki carries a postcard that has never been sent. “I thought I would know what to write when I arrived.”'],
 ['A little room for a view','“Would you bring back one view?” Aki asks. “Something you would want to remember.” A westward photo at Yotsutsuji can become part of this small story.'],
 ['One moment is enough','With Kyoto held in a photograph, the postcard feels less empty. Aki suggests a pause for tea before the way back.'],
 ['The way back','“I kept trying to fit the whole mountain on this card,” Aki says. “Perhaps one moment is enough.” Return to the station whenever you feel ready.'],
 ['A postcard, finally','On the way back, Aki finds the words: “I took the long way. I thought of you.” The old postcard has somewhere to go.']
];
const MOMENTS=[['aki','Aki’s old postcard','The beginning of a fictional encounter.'],['cat','The station cat','A brief hello beside the station.'],['tea','A tea pause','A little time at a tea-house setting.'],['drink','Something for the path','A drink for the walk.'],['map','A map unfolded','A moment to find your bearings.'],['postcard','A postcard stamped','A small red mark, pressed onto paper.']];
const SKETCH_INK=Object.freeze({
 'sketch-canal':'<svg viewBox="0 0 320 125" role="img" aria-labelledby="zen-ink-canal-title zen-ink-canal-desc"><title id="zen-ink-canal-title">Two banks, one ribbon</title><desc id="zen-ink-canal-desc">An authored ink drawing: two uneven canal banks narrow into the distance, with a few light ripples between them.</desc><path d="M15 111 49 91 88 76 130 60 163 44 183 26M91 115 121 92 151 76 176 59 196 42 207 26M27 104l18 2m27-22 17 3m26-18 13 3m17-17 11 2M109 108l15 1m18-23 11 1m18-20 9 1M9 114l26 1m31-18 16 2M196 24l18-1"/><path class="zen-ink-soft" d="m21 92 9-16m19 7 9-20m21 9 5-15m145 43-5-23m27 12-6-27m-32 8-3-14M174 21l13-4 20 2 17-2"/></svg>',
 'sketch-gates':'<svg viewBox="0 0 320 170" role="img" aria-labelledby="zen-ink-gates-title zen-ink-gates-desc"><title id="zen-ink-gates-title">The space between</title><desc id="zen-ink-gates-desc">An authored ink drawing of three nested torii frames. Open paper between the pillars emphasizes the repeating spaces along the passage.</desc><path d="M27 27q132 19 266 0M36 43h248M47 66h225M71 45l-9 113m187-113 9 113M102 61q58 9 116 0M107 74h106M113 89h94M123 75l-5 70m80-70 5 70M137 86q23 4 46 0M140 96h40M145 106h30M149 97l-2 37m26-37 2 37"/><path class="zen-ink-soft" d="m62 162 85-28m111 28-83-28M36 158l-12 4m260-4 13 4M132 148l54-1m-75 11 97-1"/></svg>',
 'sketch-city':'<svg viewBox="0 0 320 145" role="img" aria-labelledby="zen-ink-city-title zen-ink-city-desc"><title id="zen-ink-city-title">A city in layers</title><desc id="zen-ink-city-desc">An authored ink drawing with small rooftops in the foreground, a broken city horizon in the middle, and a soft line of hills behind.</desc><path d="m17 119 18-13 17 13m-13-9v20m11-14 13-9 16 9m-2 8 19-15 20 15m-12-10v20m10-17 18-12 20 12m-6 8 19-13 19 13m-13-8v16m13-18 17-12 18 12m-2 9 18-14 19 14m-9-8v17m13-18 18-12 18 12M24 135l272 1"/><path class="zen-ink-soft" d="M15 88h17v-9h12v8h18v-12h9v10h19v-6h13v8h19v-15h11v12h21v-8h10v9h21v-13h12v11h22v-7h12v8h19v-12h10v10h23M12 59l29-6 23 3 22-12 28 4 27-11 28 7 28-15 27 7 24-7 26 12 34-4M34 66l47-2m37-6 47-1m35-5 52 1"/></svg>'
});
const element=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
const button=(text,action,className)=>{const b=element('button',className,text);b.type='button';b.onclick=action;return b;};
export function zenPostcardLines(state){
 const lines=['A little note from Inariyama.'];
 for(const [id,text]of [['cat','A cat kept me company for a moment.'],['tea','I stopped for tea.'],['drink','I picked up a drink for the path.'],['map','I unfolded the map and took my time.']])if(state.moments[id])lines.push(text);
 if(state.photoPrompts?.['kyoto-view'])lines.push('I brought back a photograph from Yotsutsuji.');
 if(Object.keys(state.sketches??{}).length)lines.push('I kept a few small observations in my journal.');
 lines.push(state.story?.complete?'Aki finally found a few words for the old postcard.':'There are still small things waiting for another walk.');
 return lines;
}
function wrapText(context,text,x,y,width,lineHeight){
 let line='';for(const word of text.split(' ')){const next=line?`${line} ${word}`:word;if(context.measureText(next).width>width&&line){context.fillText(line,x,y);y+=lineHeight;line=word;}else line=next;}if(line){context.fillText(line,x,y);y+=lineHeight;}return y;
}
async function downloadPostcard(state,photo){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;const c=canvas.getContext('2d');if(!c)throw Error('Postcard export is unavailable.');
 c.fillStyle='#eee5d1';c.fillRect(0,0,1600,1000);c.strokeStyle='#b6a88b';c.lineWidth=2;c.strokeRect(35,35,1530,930);c.beginPath();c.moveTo(850,100);c.lineTo(850,900);c.stroke();
 c.fillStyle='#3f493b';c.font='24px sans-serif';c.fillText('INARIYAMA · A WALK TO REMEMBER',80,100);
 if(photo?.url){
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('This photo preview is no longer available.'));img.src=photo.url;});
  const scale=Math.min(700/image.width,540/image.height),w=image.width*scale,h=image.height*scale;c.drawImage(image,80+(700-w)/2,155+(540-h)/2,w,h);
  c.font='22px sans-serif';c.fillText('A photograph from this virtual walk',80,745);
 }else{
  c.strokeStyle='#a9493b';c.lineWidth=9;c.beginPath();c.moveTo(190,250);c.quadraticCurveTo(430,310,670,250);c.moveTo(220,325);c.lineTo(640,325);c.moveTo(260,325);c.lineTo(235,650);c.moveTo(600,325);c.lineTo(625,650);c.moveTo(250,420);c.lineTo(610,420);c.stroke();
  c.fillStyle='#6a705d';c.font='22px sans-serif';c.fillText('A small drawing for an unhurried visit',80,745);
 }
 c.fillStyle='#3f493b';c.font='38px Georgia';c.fillText('A note from the mountain',900,165);c.font='27px Georgia';let y=235;
 for(const line of zenPostcardLines(state))y=wrapText(c,line,900,y,590,40)+18;
 c.font='20px sans-serif';c.fillStyle='#777962';c.fillText('A virtual keepsake · Fushimi Inari experience',80,900);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not create your postcard.')),'image/png'));
 const url=URL.createObjectURL(blob),link=element('a');link.href=url;link.download='inariyama-postcard.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function installZenJourneyUI({journey,album,onIntention=()=>{},onWeather=()=>{},onPhoto=()=>{},onReturn=()=>{},onOpen=()=>document.getElementById('journal-open')?.click(),getContext=()=>({})}={}){
 const book=document.getElementById('journey-journal'),binding=book?.querySelector('.journal-binding');
 if(!binding)throw Error('Install the mountain journal before your visit pages.');
 const original=[...binding.children],top=original.find(e=>e.classList.contains('journal-top')),seals=element('section','zen-seals');seals.id='zen-seals';
 seals.append(...original.filter(e=>e!==top));
 const visit=element('section','zen-visit');visit.id='zen-visit';
 const style=element('link');style.rel='stylesheet';style.href=new URL('./zen-journey.css',import.meta.url).href;document.head.append(style);
 let disposed=false,selectedPhotoId=null,photos=[],photoSignature='',request=0,last=-Infinity,wasOpen=false,current='story',section='visit';
 const status=element('p','zen-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 function announce(text){status.textContent=text;}
 function tabs(labels,activate){
  const nav=element('div','zen-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label',labels[0][0]==='visit'?'Journal sections':'Your visit pages');const buttons=labels.map(([id,title])=>{
   const b=button(title,()=>activate(id));b.id=`zen-tab-${id}`;b.setAttribute('role','tab');b.setAttribute('aria-controls',`zen-${id}`);nav.append(b);return b;
  });
  buttons.forEach(b=>b.addEventListener('keydown',e=>{const visible=buttons.filter(t=>!t.hidden),i=visible.indexOf(b);let n;if(e.key==='ArrowRight')n=(i+1)%visible.length;else if(e.key==='ArrowLeft')n=(i+visible.length-1)%visible.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=visible.length-1;else return;e.preventDefault();visible[n].click();visible[n].focus();}));
  return {nav,buttons,select(id){buttons.forEach(b=>{const chosen=b.id===`zen-tab-${id}`;b.setAttribute('aria-selected',String(chosen));b.tabIndex=chosen?0:-1;});}};
 }
 const outer=tabs([['visit','Your visit'],['seals','Seals']],id=>{section=id;outer.select(id);visit.hidden=id!=='visit';seals.hidden=id!=='seals';});
 for(const [node,id]of [[visit,'visit'],[seals,'seals']]){node.setAttribute('role','tabpanel');node.setAttribute('aria-labelledby',`zen-tab-${id}`);}
 binding.replaceChildren(...(top?[top]:[]),outer.nav,visit,seals);outer.select('visit');seals.hidden=true;
 const intro=element('p','zen-intro','Choose a way to walk, or follow your own curiosity. Every encounter and keepsake is optional.');visit.append(intro);
 const intentionGroup=element('fieldset','zen-intentions');intentionGroup.append(element('legend','','Today, I would like to…'));const intentionInputs=[];
 for(const item of ZEN_INTENTIONS){const label=element('label','zen-choice'),input=element('input');input.type='radio';input.name='zen-intention';input.value=item.id;input.onchange=()=>{journey.setIntention(item.id);onIntention(item.id);};const copy=element('span');copy.append(element('strong','',item.title),element('small','',item.note));label.append(input,copy);intentionGroup.append(label);intentionInputs.push(input);}visit.append(intentionGroup);
 const weatherLabel=element('label','zen-weather','Scene weather '),weather=element('select');weather.setAttribute('aria-label','Scene weather');for(const [id,title]of [['clear','Clear'],['drizzle','Light drizzle']]){const option=element('option','',title);option.value=id;weather.append(option);}weather.onchange=()=>{journey.setWeather(weather.value);onWeather(weather.value);};weatherLabel.append(weather);visit.append(weatherLabel);
 const panes=Object.fromEntries(['story','photos','sketches','ending'].map(id=>{const pane=element('section','zen-pane');pane.id=`zen-${id}`;return [id,pane];}));
 const inner=tabs([['story','Encounters'],['photos','Photographs'],['sketches','Observations'],['ending','Postcard']],id=>selectPane(id));visit.append(inner.nav,...Object.values(panes),status);
 for(const [id,pane]of Object.entries(panes)){pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby',`zen-tab-${id}`);}
 function selectPane(id){current=id;for(const [key,pane]of Object.entries(panes))pane.hidden=key!==id;inner.select(id);if(id==='photos'||id==='ending')refreshPhotos();}
 const storyTitle=element('h3'),storyCopy=element('p','zen-story-copy'),read=button('Read the remembered postcard',()=>{
  const state=journey.snapshot();if(state.moments.aki)announce(AKI[state.story.stage][1]);
 });
 panes.story.append(element('span','journal-eyebrow','AKI AND THE UNSENT POSTCARD'),storyTitle,storyCopy,read,element('p','zen-fine','Aki is a fictional traveler created for this experience. Every encounter is optional.'));
 const momentNodes=new Map();const momentList=element('div','zen-moments');
 for(const [id,title,note]of MOMENTS){const p=element('p'),heading=element('strong','',title),text=element('span','',note);p.append(heading,text);momentList.append(p);momentNodes.set(id,p);}panes.story.append(momentList);
 const returnButton=button('Return by train',()=>{book.close();Promise.resolve().then(()=>onReturn()).catch(error=>announce(error.message??'The train is unavailable right now.'));},'zen-primary');
 panes.story.append(element('p','zen-fine','Back near the station? Leave when you feel ready. Your small discoveries stay with you.'),returnButton);
 const photoGrid=element('div','zen-photo-grid'),albumStatus=element('p','zen-fine');panes.photos.append(element('h3','','An invitation to look'),element('p','','Frame a quiet moment by the canal, a rhythm of gates, Kyoto below, or a pause near the summit. Leave a little room for what catches your eye.'));
 const promptNodes=new Map();for(const prompt of ZEN_PHOTO_PROMPTS){const card=element('article','zen-prompt'),heading=element('strong','',prompt.title),note=element('p','',prompt.hint),action=button('Open photo mode',()=>{book.close();onPhoto(prompt.id);});card.append(heading,note,action);panes.photos.append(card);promptNodes.set(prompt.id,heading);}panes.photos.append(element('h3','','Your small album'),albumStatus,photoGrid);
 const sketchNodes=new Map();panes.sketches.append(element('h3','','Look a little closer'),element('p','','Find each place, pause to look, and add a few lines to your journal.'));
 for(const sketch of ZEN_SKETCHES){const card=element('article','zen-sketch'),drawing=element('div','zen-drawing');drawing.hidden=true;const heading=element('h4','',sketch.title),note=element('p','',sketch.hint),action=button('Record this observation',()=>{const ok=journey.recordMoment(sketch.id,{...getContext(),intent:'observe'});announce(ok?'An observation and ink sketch added to your journal.':`${sketch.hint} Use a level view with a field of view of 35–70°.`);});card.append(heading,drawing,note,action);panes.sketches.append(card);sketchNodes.set(sketch.id,{drawing,note,action});}
 const endingCopy=element('div','zen-postcard-copy'),endingPhoto=element('div','zen-ending-photo'),exportButton=button('Save postcard PNG',async()=>{
  exportButton.disabled=true;try{await downloadPostcard(journey.snapshot(),photos.find(p=>p.id===selectedPhotoId));announce('Your postcard PNG is ready to save.');}catch(error){announce(error.message);}finally{exportButton.disabled=false;}
 },'zen-primary');
 const continueButton=button('Continue walking',()=>{journey.beginVisit?.();book.close();});
 panes.ending.append(element('span','journal-eyebrow','A SMALL THING TO TAKE HOME'),element('h3','','A postcard from your visit'),endingPhoto,endingCopy,element('p','zen-fine','Choose any available photo in Photographs, or keep the simple drawing. Saving is optional.'),exportButton,continueButton);
 const saveState=element('p','zen-fine zen-save-state');visit.append(saveState);
 function render(){
  if(disposed)return;const state=journey.snapshot();
  inner.buttons.at(-1).hidden=!state.visit.finishedAt;
  for(const input of intentionInputs)input.checked=input.value===state.intention;weather.value=state.weather;
  const [title,copy]=AKI[state.story.stage];storyTitle.textContent=title;storyCopy.textContent=copy;read.hidden=!state.moments.aki;
  for(const [id,node]of momentNodes){node.classList.toggle('is-found',!!state.moments[id]);node.setAttribute('aria-label',`${MOMENTS.find(m=>m[0]===id)[1]}${state.moments[id]?' · remembered':' · waiting along the way'}`);}
  for(const prompt of ZEN_PHOTO_PROMPTS)promptNodes.get(prompt.id).textContent=`${state.photoPrompts?.[prompt.id]?'✓ ':''}${prompt.title}`;
  for(const sketch of ZEN_SKETCHES){const node=sketchNodes.get(sketch.id),found=!!state.sketches[sketch.id];node.drawing.hidden=!found;if(found&&!node.drawing.innerHTML)node.drawing.innerHTML=SKETCH_INK[sketch.id];node.note.textContent=found?sketch.note:sketch.hint;node.action.disabled=found;node.action.textContent=found?'Observation remembered':'Record this observation';}
  endingCopy.replaceChildren(...zenPostcardLines(state).map(text=>element('p','',text)));
  saveState.textContent=state.persistent?'Your moments are saved in this browser.':'Your moments stay in this visit. Browser storage is unavailable.';
  const signature=state.photos.map(p=>`${p.id}:${p.thumbnailId}`).join('|');if(signature!==photoSignature){photoSignature=signature;refreshPhotos();}
 }
 function selectPhoto(id){selectedPhotoId=id;for(const child of photoGrid.children)child.setAttribute('aria-pressed',String(child.dataset.photoId===(id??'')));endingPhoto.replaceChildren();const photo=photos.find(p=>p.id===id);if(photo?.url){const img=element('img');img.src=photo.url;img.alt='Your selected photograph for this postcard';endingPhoto.append(img);}}
 async function refreshPhotos(){
  const token=++request;try{
   const records=await album?.list?.()??[];if(disposed||token!==request)return;
   const ids=new Set(journey.snapshot().photos.map(p=>p.thumbnailId).filter(Boolean));photos=records.filter(p=>ids.has(p.id));photoGrid.replaceChildren();
   const drawing=button('Use the simple drawing',()=>selectPhoto(null));drawing.dataset.photoId='';photoGrid.append(drawing);
   for(const photo of photos){const action=button('',()=>selectPhoto(photo.id)),img=element('img');img.src=photo.url;img.alt='A photograph saved from your walk';action.dataset.photoId=photo.id;action.append(img,element('span','',photo.persistent?'Saved in this browser':'This visit only'));photoGrid.append(action);}
   albumStatus.textContent=photos.length?`${photos.length} small photo preview${photos.length===1?'':'s'} · up to 12 kept. Original PNGs are saved separately through Photo mode.`:'No photo previews yet. Save a photograph in Photo mode to add one. Previews may be unavailable after browser storage is cleared.';
   if(selectedPhotoId&&!photos.some(p=>p.id===selectedPhotoId))selectedPhotoId=null;selectPhoto(selectedPhotoId);
  }catch{if(!disposed)albumStatus.textContent='Photo previews are unavailable. Your written moments are still here.';}
 }
 const unsubscribe=journey.subscribe(render);selectPane('story');render();
 return {get active(){return book.open&&section==='visit';},
  update(time){if(time-last<500)return;last=time;if(book.open&&!wasOpen){if(current==='ending'&&!journey.snapshot().visit.finishedAt)selectPane('story');render();refreshPhotos();}wasOpen=book.open;},
  showEnding(){section='visit';outer.select('visit');visit.hidden=false;seals.hidden=true;selectPane('ending');render();if(!book.open)onOpen();},
  dispose(){if(disposed)return;disposed=true;request++;unsubscribe();binding.replaceChildren(...original);style.remove();}
 };
}
