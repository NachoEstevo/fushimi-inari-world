import {JOURNAL_KEY,JOURNEY_STAMPS,JOURNEY_DISCOVERIES,createJourneyJournal,journalDiscoveryForInteraction} from './journey-journal.mjs';

const glyph='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 5c-3-2-7-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15M6 8h3m-3 4h3m6-4h3m-3 4h3"/></svg>';
const seal=index=>`<svg viewBox="0 0 160 160" aria-hidden="true"><rect x="14" y="14" width="132" height="132" rx="${index===4?54:5}"/><rect x="21" y="21" width="118" height="118" rx="${index===4?48:2}"/><path d="M42 54q38 10 76 0M45 66h70M47 82h66M56 67l-4 45m52-45 4 45M80 67v15"/>${index>=2?'<path d="m38 115 25-23 17 13 23-20 23 30"/>':''}<text x="80" y="41" text-anchor="middle">INARIYAMA</text><text x="80" y="133" text-anchor="middle">${JOURNEY_STAMPS[index].mark}</text></svg>`;

export function installJourneyJournal({camera,assembly,walker,controls,isBlocked=()=>false,storage:providedStorage}={}){
  let storage=providedStorage;
  if(storage===undefined){try{storage=window.localStorage;}catch{storage=null;}}
  const progress=createJourneyJournal({storage});
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./journey-journal.css',import.meta.url).href;document.head.append(style);
  const button=document.createElement('button');button.id='journal-open';button.className='icon-button';button.type='button';button.innerHTML=glyph;button.setAttribute('aria-label','Journey journal · J');button.title='Journey journal · J';
  document.getElementById('menu-open').before(button);
  const book=document.createElement('dialog');book.id='journey-journal';book.setAttribute('aria-labelledby','journal-title');
  book.innerHTML=`<div class="journal-binding"><div class="journal-top"><div><span class="journal-eyebrow">INARIYAMA · A WALK TO REMEMBER</span><h2 id="journal-title">Your mountain journal</h2></div><button type="button" id="journal-close" aria-label="Close journal">×</button></div><div class="journal-spread"><section class="journal-writing"><span id="journal-number" class="journal-eyebrow"></span><h3 id="journal-place"></h3><p id="journal-note"></p><div id="journal-discoveries"></div></section><section class="journal-imprint"><div id="journal-seal"></div><h3 id="journal-stamp-title"></h3><p id="journal-state" role="status" aria-live="polite"></p><button type="button" id="journal-collect">Collect this seal</button><p class="journal-small">A virtual keepsake of this experience.</p></section></div><p id="journal-complete" hidden>Five marks, one mountain. Your journal is complete. Optional moments are yours to discover on the way down.</p><div class="journal-bottom"><button type="button" id="journal-prev" aria-label="Previous page">←</button><nav aria-label="Journal pages">${JOURNEY_STAMPS.map((s,i)=>`<button type="button" data-page="${i}" aria-label="${s.place}">${i+1}</button>`).join('')}</nav><button type="button" id="journal-next" aria-label="Next page">→</button></div><p id="journal-save" class="journal-small"></p></div>`;
  const toast=document.createElement('p');toast.id='journal-notice';toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.append(book,toast);
  const $=id=>book.querySelector(`#${id}`);
  const anchors=assembly.spatial.byId;
  const locations=Object.fromEntries(JOURNEY_STAMPS.slice(1).map(s=>[s.id,anchors[s.id]?[anchors[s.id].target]:[]]));
  // The first mark is available at the station, with existing fallback starts.
  locations.departure=[assembly.keihanStation?.spec?.publicExit?.position,assembly.inariStation?.spec?.publicExit?.position,anchors.entrance?.target,anchors.romon?.target].filter(Boolean);
  let page=0,last=-Infinity,signature='',wasControlsEnabled=false,noticeUntil=0;
  const context=()=>({position:[camera.position.x,camera.position.y,camera.position.z],locations,blocked:isBlocked()||document.hidden});
  function render(force=false){
    const state=progress.snapshot(),available=progress.available(context());
    button.dataset.ready=String(available.length>0);button.disabled=isBlocked();
    const nextSignature=JSON.stringify([page,state,available]);if(!force&&nextSignature===signature)return;signature=nextSignature;
    button.setAttribute('aria-label',`Journey journal · ${Object.keys(state.stamps).length} of 5 seals · J`);
    if(!book.open)return;
    const stamp=JOURNEY_STAMPS[page],earned=!!state.stamps[stamp.id],ready=available.includes(stamp.id);
    $('journal-number').textContent=`PAGE ${String(page+1).padStart(2,'0')} / 05`;
    $('journal-place').textContent=stamp.place;$('journal-note').textContent=earned?stamp.note:stamp.hint;
    $('journal-stamp-title').textContent=stamp.title;$('journal-seal').innerHTML=seal(page);$('journal-seal').classList.toggle('is-earned',earned);
    $('journal-state').textContent=earned?'A mark from your journey.':ready?'You are here. Leave a mark on this page.':!state.stamps.departure?'Begin with the first page near the station.':'This page is waiting along the trail.';
    $('journal-collect').hidden=earned;$('journal-collect').disabled=!ready;
    $('journal-prev').disabled=page===0;$('journal-next').disabled=page===4;
    for(const tab of book.querySelectorAll('[data-page]')){const i=Number(tab.dataset.page);tab.setAttribute('aria-current',i===page?'page':'false');tab.classList.toggle('is-earned',!!state.stamps[JOURNEY_STAMPS[i].id]);}
    $('journal-complete').hidden=!state.complete;
    $('journal-save').textContent=state.persistent?'Saved automatically in this browser.':'Your progress stays in this visit. Browser storage is unavailable.';
    const notes=$('journal-discoveries');notes.replaceChildren();
    for(const discovery of JOURNEY_DISCOVERIES.filter(d=>d.page===page)){
      const p=document.createElement('p');p.className='journal-discovery';const found=!!state.discoveries[discovery.id];p.classList.toggle('is-found',found);
      const heading=document.createElement('strong');heading.textContent=found?`✦ ${discovery.title}`:'A small discovery';
      const text=document.createElement('span');text.textContent=found?discovery.note:discovery.hint;p.append(heading,text);notes.append(p);
    }
  }
  function open(){
    if(isBlocked()||book.open||document.querySelector('dialog[open]'))return;
    const ready=progress.available(context())[0];
    const next=JOURNEY_STAMPS.findIndex(s=>ready?s.id===ready:!progress.snapshot().stamps[s.id]);page=next<0?4:next;
    wasControlsEnabled=controls.enabled;walker.pause(true);controls.enabled=false;walker.releasePointerLock?.();
    book.showModal();document.body.classList.add('journal-open');render(true);$('journal-close').focus();
  }
  function close(){book.close();}
  button.onclick=open;$('journal-close').onclick=close;
  book.addEventListener('cancel',event=>{event.preventDefault();close();});
  book.addEventListener('close',()=>{document.body.classList.remove('journal-open');walker.pause(isBlocked());controls.enabled=wasControlsEnabled&&!isBlocked();button.focus();});
  book.addEventListener('click',event=>{if(event.target!==book)return;const r=book.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();});
  $('journal-prev').onclick=()=>{page=Math.max(0,page-1);render(true);};$('journal-next').onclick=()=>{page=Math.min(4,page+1);render(true);};
  for(const tab of book.querySelectorAll('[data-page]'))tab.onclick=()=>{page=Number(tab.dataset.page);render(true);};
  $('journal-collect').onclick=()=>{if(progress.collect(JOURNEY_STAMPS[page].id,context())){render(true);(page<4?$('journal-next'):$('journal-close')).focus();$('journal-seal').animate?.([{transform:'scale(1.12)',opacity:.4},{transform:'scale(1)',opacity:1}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:260});}};
  const onKey=event=>{if(event.code!=='KeyJ'||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;if(document.querySelector('dialog[open]')&&!book.open)return;event.preventDefault();if(book.open)close();else open();};
  const onStorage=event=>{if(event.key===JOURNAL_KEY){progress.sync(event.newValue);render();}};
  window.addEventListener('keydown',onKey);window.addEventListener('storage',onStorage);
  render();
  return {get active(){return book.open;},update(time){if(time-last<500)return;last=time;render();if(!toast.hidden&&time>noticeUntil)toast.hidden=true;},
    recordInteraction(object){
      if(context().blocked)return;
      const id=journalDiscoveryForInteraction(object?.userData?.interactable);
      if(id&&progress.discover(id)){const discovery=JOURNEY_DISCOVERIES.find(d=>d.id===id);toast.textContent=`Journal · ${discovery.title}`;toast.hidden=false;noticeUntil=performance.now()+2800;render();}
    },dispose(){window.removeEventListener('keydown',onKey);window.removeEventListener('storage',onStorage);if(book.open)book.close();button.remove();book.remove();toast.remove();style.remove();}
  };
}
