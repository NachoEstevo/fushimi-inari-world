// Arrival controls share the existing exploration menu and camera owner.
// The timeline and handoff live in train-arrival-experience.mjs.
export function installTrainArrivalUI({experience,focusTarget,isBlocked=()=>false,labels={}}){
  const stationName=labels.stationName??'Inari';
  const preferenceKey='inari-arrival-reduced-motion';
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let saved=null;
  try{saved=localStorage.getItem(preferenceKey);}catch{}
  let reduced=saved===null?media.matches:saved==='true';
  const panel=document.createElement('section');panel.id='train-arrival';
  panel.setAttribute('aria-label','Train arrival');
  // Only Skip is visible; the phase stays available to screen readers.
  panel.innerHTML='<p id="arrival-phase" class="visually-hidden" role="status" aria-live="polite"></p><button id="arrival-skip">Skip</button>';
  document.body.append(panel);
  const options=document.createElement('div');options.className='arrival-settings';
  options.innerHTML='<h3 class="menu-section">Train arrival</h3><p id="arrival-journey"></p><p id="arrival-reference"></p><button id="arrival-replay">Replay train arrival</button><label><input id="arrival-reduced-menu" type="checkbox"> Reduce arrival motion</label>';
  document.getElementById('menu-arrival').append(options);
  const $=id=>document.getElementById(id);
  $('arrival-journey').textContent=labels.journey??'Kyoto → Inari · Platform 2';
  $('arrival-reference').textContent=labels.reference??'East entrance · References from 2016–2021';
  const checkboxes=[$('arrival-reduced-menu')];
  const sync=()=>checkboxes.forEach(input=>input.checked=reduced);sync();
  const skip=()=>experience.skip({paused:isBlocked()});
  $('arrival-skip').onclick=skip;
  $('arrival-replay').onclick=()=>{
    document.getElementById('exploration-menu').close();
    experience.start({reducedMotion:reduced});focusTarget.focus({preventScroll:true});
  };
  for(const input of checkboxes)input.onchange=()=>{
    reduced=input.checked;saved=String(reduced);sync();
    try{localStorage.setItem(preferenceKey,saved);}catch{}
    // A new accessibility preference takes effect immediately during travel.
    if(reduced&&experience.active)skip();
  };
  media.addEventListener('change',event=>{
    if(saved!==null)return;reduced=event.matches;sync();
    if(reduced&&experience.active)skip();
  });
  return {get reducedMotion(){return reduced;},update(state){
    const hadSkipFocus=document.activeElement===$('arrival-skip');
    panel.hidden=!state.active;
    document.body.classList.toggle('train-arriving',state.active);
    document.body.dataset.trainArrival=JSON.stringify({phase:state.phase,paused:state.paused,reducedMotion:state.reducedMotion,handoff:state.handoff});
    $('arrival-phase').textContent=state.handoff==='fallback'?'Arrival access unavailable. You are at Omotesando.':state.handoff==='unavailable'?'Walking access unavailable. Use Menu → Explore to continue.':state.paused?'Arrival paused':state.phase==='moving'?`Arriving at ${stationName}`:state.phase==='complete'?`Welcome to ${stationName}`:state.phaseLabel;
    if(hadSkipFocus&&!state.active)focusTarget.focus({preventScroll:true});
  }};
}
