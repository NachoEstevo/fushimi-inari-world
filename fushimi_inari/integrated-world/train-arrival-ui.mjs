// Arrival controls share the existing exploration menu and camera owner.
// The timeline and handoff live in train-arrival-experience.mjs.
export function installTrainArrivalUI({experience,focusTarget,isBlocked=()=>false}){
  const preferenceKey='inari-arrival-reduced-motion';
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let saved=null;
  try{saved=localStorage.getItem(preferenceKey);}catch{}
  let reduced=saved===null?media.matches:saved==='true';
  const panel=document.createElement('section');panel.id='train-arrival';
  panel.setAttribute('aria-label','Train arrival');
  panel.innerHTML='<span class="eyebrow">JR Nara Line · Inari</span><p id="arrival-phase" role="status" aria-live="polite"></p><p id="arrival-help"></p><div class="arrival-actions"><button id="arrival-skip">Skip arrival</button><button id="arrival-dismiss" hidden>Explore</button></div><label><input id="arrival-reduced" type="checkbox"> Reduce arrival motion</label>';
  document.body.append(panel);
  const options=document.createElement('div');options.className='arrival-settings';
  options.innerHTML='<h3>Arrive by train</h3><p>Kyoto → Inari · Platform 2<br>East entrance · References from 2016–2021</p><button id="arrival-replay">Replay train arrival</button><label><input id="arrival-reduced-menu" type="checkbox"> Reduce arrival motion</label>';
  document.getElementById('pane-0').append(options);
  const $=id=>document.getElementById(id);
  const checkboxes=[$('arrival-reduced'),$('arrival-reduced-menu')];
  const sync=()=>checkboxes.forEach(input=>input.checked=reduced);sync();
  function dismiss(){panel.hidden=true;focusTarget.focus({preventScroll:true});}
  const skip=()=>experience.skip({paused:isBlocked()});
  $('arrival-skip').onclick=skip;
  $('arrival-dismiss').onclick=dismiss;
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
    panel.hidden=!state.active&&state.phase!=='complete';
    document.body.classList.toggle('train-arriving',state.active);
    document.body.dataset.trainArrival=JSON.stringify({phase:state.phase,paused:state.paused,reducedMotion:state.reducedMotion,handoff:state.handoff});
    $('arrival-phase').textContent=state.paused?'Arrival paused':state.phaseLabel;
    $('arrival-help').textContent=state.handoff==='fallback'?'Arrival access unavailable. You are at Omotesando.':state.handoff==='unavailable'?'Walking access unavailable. Use Menu → Checkpoints to continue.':state.active?'The doors will open at Inari. You will step onto the platform automatically.':'WASD to walk · Drag to look · Follow the exit toward the shrine';
    const hadSkipFocus=document.activeElement===$('arrival-skip');
    $('arrival-skip').hidden=!state.active;$('arrival-dismiss').hidden=state.active;
    if(hadSkipFocus&&!state.active)$('arrival-dismiss').focus();
  }};
}
