import {createFootstepAudio} from './footstep-audio.mjs?v=complete-route-1';
import {createRecordedAudio} from './recorded-audio.mjs?v=audio-small-1';
import {createAmbience} from './ambient-audio.mjs';
import {createWalkingMusic} from './walking-music.mjs';
import {createPondSoundscape} from './pond-soundscape.mjs';
export function createAudio(){let audioCtx=null,audioEnabled=false,ambience=null,recorded=null,footsteps=null,music=null,pond=null,disposed=false;
    let musicControl=null;
    const musicPreference=()=>music?.setMusicEnabled(musicControl?.checked!==false);
    const position=[0,0,0],recordedState={position},musicState={paused:false,voice:false};
    function visibility(){
      recorded?.pause(document.hidden);music?.pause(document.hidden);
      if(document.hidden)footsteps?.stop();
      if(audioCtx&&audioEnabled){if(document.hidden)audioCtx.suspend()?.catch?.(()=>{});else audioCtx.resume()?.catch?.(()=>{});}
    }
    document.addEventListener('visibilitychange',visibility);
    function initAmbientAudio() {
      if (audioCtx) return;
      musicControl=document.getElementById('ambient-music');musicControl?.addEventListener('change',musicPreference);
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      footsteps=createFootstepAudio(audioCtx,{onStats:stats=>document.body.dataset.footstepAudio=JSON.stringify(stats)});
      footsteps.setVolume(Number(document.getElementById('ambient-volume')?.value??55)/100);
      footsteps.load();
      ambience=createAmbience(audioCtx);
      recorded=createRecordedAudio(audioCtx,{onStats:stats=>document.body.dataset.recordedAudio=JSON.stringify(stats)});
      recorded.setVolume(Number(document.getElementById('ambient-volume')?.value??55)/100);
      music=createWalkingMusic(audioCtx,{onStats:stats=>document.body.dataset.walkingMusic=JSON.stringify(stats)});
      pond=createPondSoundscape(audioCtx,{onStats:stats=>document.body.dataset.pondSoundscape=JSON.stringify(stats)});
      musicPreference();
      const volume=Number(document.getElementById('ambient-volume')?.value??55)/100;music.setVolume(volume);pond.setVolume(volume);
    }

    function playBellChime() {
      if (!audioCtx) initAmbientAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      for (const freq of [1046.5, 1318.5, 1567.98, 2093.0]) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 2.25);
      }
    }

    function playWaterSplashSound() {
      if (!audioCtx) initAmbientAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.45);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    }

    function playFootstepTick(isStone) {
      if (!audioEnabled || !audioCtx) return;
      footsteps?.play(isStone);
    }


return {arrivalSpeechActive:()=>recorded?.announcementActive??false,bell:()=>{if(audioEnabled)playBellChime();},water:()=>{if(audioEnabled)playWaterSplashSound();},
step:playFootstepTick,update:(camera,night,world)=>{
 if(disposed)return;ambience?.update(camera,night);
 if(world){
  position[0]=camera.position.x;position[1]=camera.position.y;position[2]=camera.position.z;
  recordedState.gate=world.gate;recordedState.gateState=world.gateState;recordedState.arrival=world.arrival;recordedState.rail=world.rail;recordedState.time=world.time;recordedState.paused=world.paused;
  recorded?.update(recordedState);
 }
 const phase=world?.arrival?.phase;musicState.paused=!!document.hidden||!!(world?.musicPaused??world?.paused)||!!phase&&phase!=='idle'&&phase!=='complete'&&phase!=='cancelled';
 musicState.voice=!musicState.paused&&!!recorded?.announcementActive;
 music?.update(camera.position,musicState);pond?.update(camera.position,night,musicState);
},setRecordedVolume:value=>{recorded?.setVolume(value);footsteps?.setVolume(value);music?.setVolume(value);pond?.setVolume(value);},
get enabled(){return audioEnabled;},setEnabled(value){
 if(disposed)return false;audioEnabled=!!value;if(!audioEnabled&&!audioCtx)return false;initAmbientAudio();ambience.setEnabled(audioEnabled);recorded.setEnabled(audioEnabled);music.setEnabled(audioEnabled);music.pause(document.hidden);pond.setEnabled(audioEnabled);
 if(audioEnabled&&!document.hidden)audioCtx.resume()?.catch?.(()=>{});else {footsteps?.stop();audioCtx.suspend()?.catch?.(()=>{});}return audioEnabled;
},toggle(){return this.setEnabled(!audioEnabled);},dispose(){
 if(disposed)return;disposed=true;audioEnabled=false;document.removeEventListener('visibilitychange',visibility);musicControl?.removeEventListener('change',musicPreference);
 music?.dispose();pond?.dispose();recorded?.dispose();ambience?.dispose();footsteps?.stop();audioCtx?.close?.()?.catch?.(()=>{});
}};
}
