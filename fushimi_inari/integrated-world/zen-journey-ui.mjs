import {ZEN_INTENTIONS,ZEN_PHOTO_PROMPTS,ZEN_SKETCHES} from './zen-journey-state.mjs';

const AKI=[
 'Aki is on the station platform.',
 'Aki wants a photo of Kyoto from Yotsutsuji.',
 'Aki suggested tea at Suehiro-ya.',
 'Meet Aki again at the station.',
 'Back at the station with Aki.'
];
const SKETCH_INK=Object.freeze({
 'sketch-canal':'<svg viewBox="0 0 320 125" role="img" aria-labelledby="zen-ink-canal-title zen-ink-canal-desc"><title id="zen-ink-canal-title">Two banks, one ribbon</title><desc id="zen-ink-canal-desc">An authored ink drawing: two uneven canal banks narrow into the distance, with a few light ripples between them.</desc><path d="M15 111 49 91 88 76 130 60 163 44 183 26M91 115 121 92 151 76 176 59 196 42 207 26M27 104l18 2m27-22 17 3m26-18 13 3m17-17 11 2M109 108l15 1m18-23 11 1m18-20 9 1M9 114l26 1m31-18 16 2M196 24l18-1"/><path class="zen-ink-soft" d="m21 92 9-16m19 7 9-20m21 9 5-15m145 43-5-23m27 12-6-27m-32 8-3-14M174 21l13-4 20 2 17-2"/></svg>',
 'sketch-gates':'<svg viewBox="0 0 320 170" role="img" aria-labelledby="zen-ink-gates-title zen-ink-gates-desc"><title id="zen-ink-gates-title">The space between</title><desc id="zen-ink-gates-desc">An authored ink drawing of three nested torii frames. Open paper between the pillars emphasizes the repeating spaces along the passage.</desc><path d="M27 27q132 19 266 0M36 43h248M47 66h225M71 45l-9 113m187-113 9 113M102 61q58 9 116 0M107 74h106M113 89h94M123 75l-5 70m80-70 5 70M137 86q23 4 46 0M140 96h40M145 106h30M149 97l-2 37m26-37 2 37"/><path class="zen-ink-soft" d="m62 162 85-28m111 28-83-28M36 158l-12 4m260-4 13 4M132 148l54-1m-75 11 97-1"/></svg>',
 'sketch-city':'<svg viewBox="0 0 320 145" role="img" aria-labelledby="zen-ink-city-title zen-ink-city-desc"><title id="zen-ink-city-title">A city in layers</title><desc id="zen-ink-city-desc">An authored ink drawing with small rooftops in the foreground, a broken city horizon in the middle, and a soft line of hills behind.</desc><path d="m17 119 18-13 17 13m-13-9v20m11-14 13-9 16 9m-2 8 19-15 20 15m-12-10v20m10-17 18-12 20 12m-6 8 19-13 19 13m-13-8v16m13-18 17-12 18 12m-2 9 18-14 19 14m-9-8v17m13-18 18-12 18 12M24 135l272 1"/><path class="zen-ink-soft" d="M15 88h17v-9h12v8h18v-12h9v10h19v-6h13v8h19v-15h11v12h21v-8h10v9h21v-13h12v11h22v-7h12v8h19v-12h10v10h23M12 59l29-6 23 3 22-12 28 4 27-11 28 7 28-15 27 7 24-7 26 12 34-4M34 66l47-2m37-6 47-1m35-5 52 1"/></svg>'
});
const element=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
const button=(text,action,className)=>{const b=element('button',className,text);b.type='button';b.onclick=action;return b;};
export function zenPostcardLines(state){
 const lines=[];
 if(state.photoPrompts?.['kyoto-view'])lines.push('Kyoto from Yotsutsuji.');
 for(const [id,text]of [['tea','Tea at Suehiro-ya.'],['cat','Met the station cat.'],['aki','Met Aki.'],['drink','A drink for the walk.']])if(state.moments[id])lines.push(text);
 return lines.length?lines.slice(0,3):['Fushimi Inari, Kyoto.'];
}
function wrapText(context,text,x,y,width,lineHeight){
 let line='';for(const word of text.split(' ')){const next=line?`${line} ${word}`:word;if(context.measureText(next).width>width&&line){context.fillText(line,x,y);y+=lineHeight;line=word;}else line=next;}if(line){context.fillText(line,x,y);y+=lineHeight;}return y;
}
async function downloadPostcard(state,photo){
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;const c=canvas.getContext('2d');if(!c)throw Error('Postcard export is unavailable.');
 c.fillStyle='#eee5d1';c.fillRect(0,0,1600,1000);c.strokeStyle='#b6a88b';c.lineWidth=2;c.strokeRect(35,35,1530,930);c.beginPath();c.moveTo(850,100);c.lineTo(850,900);c.stroke();
 c.fillStyle='#3f493b';c.font='24px sans-serif';c.fillText('伏見稲荷大社 · Fushimi Inari',80,100);
 if(photo?.url){
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('This photo preview is no longer available.'));img.src=photo.url;});
  const scale=Math.min(700/image.width,540/image.height),w=image.width*scale,h=image.height*scale;c.drawImage(image,80+(700-w)/2,155+(540-h)/2,w,h);
 }else{
  c.strokeStyle='#a9493b';c.lineWidth=9;c.beginPath();c.moveTo(190,250);c.quadraticCurveTo(430,310,670,250);c.moveTo(220,325);c.lineTo(640,325);c.moveTo(260,325);c.lineTo(235,650);c.moveTo(600,325);c.lineTo(625,650);c.moveTo(250,420);c.lineTo(610,420);c.stroke();
 }
 c.fillStyle='#3f493b';c.font='27px Georgia';let y=235;
 for(const line of zenPostcardLines(state))y=wrapText(c,line,900,y,590,40)+18;
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not create your postcard.')),'image/png'));
 const url=URL.createObjectURL(blob),link=element('a');link.href=url;link.download='inariyama-postcard.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function installZenJourneyUI({journey,album,onIntention=()=>{},onWeather=()=>{},onPhoto=()=>{},onReturn=()=>{},onContinueWalking=()=>{},onOpen=()=>document.getElementById('journal-open')?.click(),getContext=()=>({})}={}){
 const book=document.getElementById('journey-journal'),binding=book?.querySelector('.journal-binding');
 if(!binding)throw Error('Install the mountain journal before your visit pages.');
 const original=[...binding.children],top=original.find(e=>e.classList.contains('journal-top')),seals=element('section','zen-seals');seals.id='zen-seals';
 const title=top?.querySelector('#journal-title'),eyebrow=top?.querySelector('.journal-eyebrow'),overview=top?.querySelector('#journal-overview'),oldTitle=title?.textContent,oldEyebrowHidden=eyebrow?.hidden;
 if(title)title.textContent='Journal';if(eyebrow)eyebrow.hidden=true;
 seals.append(...original.filter(e=>e!==top));
 const visit=element('section','zen-visit');visit.id='zen-visit';
 const style=element('link');style.rel='stylesheet';style.href=new URL('./zen-journey.css',import.meta.url).href;document.head.append(style);
 let disposed=false,selectedPhotoId,photos=[],photoSignature='',request=0,last=-Infinity,wasOpen=false,current='story';
 const status=element('p','zen-status');status.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 function announce(text){status.hidden=false;status.textContent=text;}
 const panes=Object.fromEntries(['story','photos','sketches','ending'].map(id=>{const pane=element('section','zen-pane');pane.id=`zen-${id}`;return [id,pane];}));
 const nav=element('div','zen-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Journal pages');
 const tabs=[['story','Journal'],['photos','Photos'],['sketches','Sketches'],['seals','Seals'],['ending','Postcard']].map(([id,label])=>{
  const tab=button(label,()=>selectPane(id));tab.id=`zen-tab-${id}`;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',`zen-${id}`);nav.append(tab);return {id,tab};
 });
 for(const {tab}of tabs)tab.addEventListener('keydown',event=>{const shown=tabs.filter(item=>!item.tab.hidden),index=shown.findIndex(item=>item.tab===tab);let next;
  if(event.key==='ArrowRight')next=(index+1)%shown.length;else if(event.key==='ArrowLeft')next=(index+shown.length-1)%shown.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=shown.length-1;else return;
  event.preventDefault();shown[next].tab.click();shown[next].tab.focus();
 });
 for(const [id,pane]of [...Object.entries(panes),['seals',seals]]){pane.setAttribute('role','tabpanel');pane.setAttribute('aria-labelledby',`zen-tab-${id}`);}
 binding.replaceChildren(...(top?[top]:[]),nav,visit,seals);
 const options=element('details','zen-options');options.append(element('summary','','Options'));
 const intentionGroup=element('fieldset','zen-intentions');intentionGroup.append(element('legend','zen-sr-only','Route'));const intentionInputs=[];
 for(const [index,item]of ZEN_INTENTIONS.entries()){
  const label=element('label','zen-choice'),input=element('input');input.type='radio';input.name='zen-intention';input.value=item.id;input.onchange=()=>{journey.setIntention(item.id);onIntention(item.id);};
  label.append(input,element('span','',['Free walk','Views','Summit'][index]));intentionGroup.append(label);intentionInputs.push(input);
 }
 const weatherLabel=element('label','zen-weather','Weather '),weather=element('select');weather.setAttribute('aria-label','Weather');
 for(const [id,label]of [['clear','Clear'],['drizzle','Drizzle']]){const option=element('option','',label);option.value=id;weather.append(option);}
 weather.onchange=()=>{journey.setWeather(weather.value);onWeather(weather.value);};weatherLabel.append(weather);options.append(intentionGroup,weatherLabel);visit.append(options,...Object.values(panes),status);
 function selectPane(id){
  current=id;status.hidden=true;status.textContent='';visit.hidden=id==='seals';seals.hidden=id!=='seals';options.hidden=id!=='story';if(overview)overview.hidden=id!=='seals';
  for(const [key,pane]of Object.entries(panes))pane.hidden=key!==id;
  for(const item of tabs){const selected=item.id===id;item.tab.setAttribute('aria-selected',String(selected));item.tab.tabIndex=selected?0:-1;}
  if(id==='photos'||id==='ending')refreshPhotos();
 }
 const storyCopy=element('p','zen-story-copy');
 const returnButton=button('Return by train',()=>{book.close();Promise.resolve().then(()=>onReturn()).catch(error=>announce(error.message??'Train unavailable.'));},'zen-primary');panes.story.append(storyCopy,returnButton);
 const photoGrid=element('div','zen-photo-grid'),albumStatus=element('p','zen-fine'),photoIdeas=element('details','zen-photo-ideas');photoIdeas.append(element('summary','','Photo ideas'));
 const photoLabels={
  'canal-light':['Canal','Canal bridge · 35–75°'],
  'gate-rhythm':['Senbon Torii','Along the passage · 30–70°'],
  'kyoto-view':['Yotsutsuji','Face west · 35–80°'],
  'mountain-pause':['Ichinomine','Level view · 35–80°']
 };
 const promptNodes=new Map();for(const prompt of ZEN_PHOTO_PROMPTS){const card=element('div','zen-prompt'),[label,hint]=photoLabels[prompt.id],heading=element('span','',label),action=button('Photo',()=>{book.close();onPhoto(prompt.id);});action.setAttribute('aria-label',`Photograph ${label}`);card.append(heading,element('small','',hint),action);photoIdeas.append(card);promptNodes.set(prompt.id,{heading,label});}
 panes.photos.append(button('Take photo',()=>{book.close();onPhoto(null);},'zen-primary'),albumStatus,photoGrid,photoIdeas);
 const sketchLabels={
  'sketch-canal':['Canal','Canal bridge · face the water · 35–75°'],
  'sketch-gates':['Torii','Senbon Torii · along the passage · 30–70°'],
  'sketch-city':['Kyoto','Yotsutsuji · face west · 35–80°']
 };
 const sketchNodes=new Map();for(const sketch of ZEN_SKETCHES){const card=element('article','zen-sketch'),drawing=element('div','zen-drawing'),[label,hint]=sketchLabels[sketch.id];drawing.hidden=true;
  const note=element('p','zen-fine',hint),action=button('Sketch',()=>{const ok=journey.recordMoment(sketch.id,{...getContext(),intent:'observe'});announce(ok?'Sketch saved.':hint);});action.setAttribute('aria-label',`Sketch ${label}`);
  card.append(element('span','zen-sketch-name',label),drawing,note,action);panes.sketches.append(card);sketchNodes.set(sketch.id,{drawing,note,action});
 }
 const endingPhoto=element('div','zen-ending-photo'),exportButton=button('Save postcard',async()=>{
  exportButton.disabled=true;try{await downloadPostcard(journey.snapshot(),chosenPhoto());announce('Postcard ready.');}catch(error){announce(error.message);}finally{exportButton.disabled=false;}
 },'zen-primary');
 const continueButton=button('Continue walking',()=>{journey.beginVisit?.();book.close();onContinueWalking();});
 panes.ending.append(endingPhoto,exportButton,button('Choose photo',()=>selectPane('photos')),continueButton);
 const saveState=element('p','zen-fine zen-save-state');visit.append(saveState);
 function render(){
  if(disposed)return;const state=journey.snapshot();tabs.at(-1).tab.hidden=!state.visit.finishedAt;
  for(const input of intentionInputs)input.checked=input.value===state.intention;weather.value=state.weather;storyCopy.textContent=AKI[state.story.stage];
  for(const prompt of ZEN_PHOTO_PROMPTS){const node=promptNodes.get(prompt.id);node.heading.textContent=`${state.photoPrompts?.[prompt.id]?'✓ ':''}${node.label}`;}
  for(const sketch of ZEN_SKETCHES){const node=sketchNodes.get(sketch.id),found=!!state.sketches[sketch.id];node.drawing.hidden=!found;if(found&&!node.drawing.innerHTML)node.drawing.innerHTML=SKETCH_INK[sketch.id];node.note.hidden=found;node.action.disabled=found;node.action.textContent=found?'Saved':'Sketch';}
  saveState.hidden=state.persistent;saveState.textContent=state.persistent?'':'This visit only. Browser storage unavailable.';
  const signature=state.photos.map(photo=>`${photo.id}:${photo.thumbnailId}`).join('|');if(signature!==photoSignature){photoSignature=signature;refreshPhotos();}
 }
 function chosenPhoto(){return selectedPhotoId===null?null:photos.find(photo=>photo.id===selectedPhotoId)??photos[0]??null;}
 function selectPhoto(id){selectedPhotoId=id;renderPhotoSelection();}
 function renderPhotoSelection(){
  const photo=chosenPhoto();for(const child of photoGrid.children)child.setAttribute('aria-pressed',String(child.dataset.photoId===(photo?.id??'')));endingPhoto.replaceChildren();
  if(photo?.url){const img=element('img');img.src=photo.url;img.alt='Selected postcard photo';endingPhoto.append(img);}
  else{const drawing=element('div','zen-postcard-drawing');drawing.innerHTML='<svg viewBox="0 0 180 140" role="img" aria-label="Torii drawing"><path d="M10 20q80 12 160 0M20 40h140M29 66h122M50 42l-9 91m89-91 9 91M90 42v24"/></svg>';endingPhoto.append(drawing);}
 }
 async function refreshPhotos(){
  const token=++request;try{
   const records=await album?.list?.()??[];if(disposed||token!==request)return;
   const ids=new Set(journey.snapshot().photos.map(photo=>photo.thumbnailId).filter(Boolean));photos=records.filter(photo=>ids.has(photo.id));photoGrid.replaceChildren();
   if(journey.snapshot().visit.finishedAt){const drawing=button('Drawing',()=>selectPhoto(null));drawing.setAttribute('aria-label','Use a drawing on the postcard');drawing.dataset.photoId='';photoGrid.append(drawing);}
   for(const photo of photos){const action=button('',()=>selectPhoto(photo.id)),img=element('img');img.src=photo.url;img.alt='Photo from your visit';action.dataset.photoId=photo.id;action.append(img);if(!photo.persistent)action.append(element('span','zen-fine','This visit only'));photoGrid.append(action);}
   albumStatus.hidden=photos.length>0;albumStatus.textContent=photos.length?'':'No photos yet.';
   if(selectedPhotoId!==undefined&&selectedPhotoId!==null&&!photos.some(photo=>photo.id===selectedPhotoId))selectedPhotoId=undefined;renderPhotoSelection();
  }catch{if(!disposed){albumStatus.hidden=false;albumStatus.textContent='Photos unavailable.';}}
 }
 const unsubscribe=journey.subscribe(render);selectPane('story');render();
 return {get active(){return book.open&&current!=='seals';},
  update(time){if(time-last<500)return;last=time;if(book.open&&!wasOpen){if(current==='ending'&&!journey.snapshot().visit.finishedAt)selectPane('story');render();refreshPhotos();}wasOpen=book.open;},
  showEnding(){selectPane('ending');render();if(!book.open)onOpen();},
  dispose(){if(disposed)return;disposed=true;request++;unsubscribe();if(title)title.textContent=oldTitle;if(eyebrow)eyebrow.hidden=oldEyebrowHidden;if(overview)overview.hidden=false;binding.replaceChildren(...original);style.remove();}
 };
}
