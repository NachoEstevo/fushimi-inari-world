import {createRecordedAudio} from './recorded-audio.mjs?v=recorded-immersion-9';
import {createAmbience} from './ambient-audio.mjs';
export function createAudio(){let audioCtx=null,audioEnabled=false,ambience=null,recorded=null;
    document.addEventListener('visibilitychange',()=>{
      recorded?.pause(document.hidden);
      if(audioCtx&&audioEnabled){if(document.hidden)audioCtx.suspend();else audioCtx.resume();}
    });
    function initAmbientAudio() {
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = audioCtx.sampleRate * 3;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 360;
      filter.Q.value = 2.0;

      const gain = audioCtx.createGain();
      gain.gain.value = 0.045;
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      // Continuous legacy noise is replaced by intermittent breeze.
      whiteNoise.disconnect();filter.disconnect();gain.disconnect();
      ambience=createAmbience(audioCtx);
      recorded=createRecordedAudio(audioCtx,{onStats:stats=>document.body.dataset.recordedAudio=JSON.stringify(stats)});
      recorded.setVolume(Number(document.getElementById('ambient-volume')?.value??55)/100);
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
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isStone ? 135 : 92, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.065);
      g.gain.setValueAtTime(0.032, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 0.07);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.075);
    }


return {arrivalSpeechActive:()=>recorded?.announcementActive??false,bell:()=>{if(audioEnabled)playBellChime();},water:()=>{if(audioEnabled)playWaterSplashSound();},
step:playFootstepTick,update:(camera,night,world)=>{ambience?.update(camera,night);if(world)recorded?.update({position:camera.position.toArray(),...world});},setRecordedVolume:value=>recorded?.setVolume(value),toggle(){initAmbientAudio();audioEnabled=!audioEnabled;ambience.setEnabled(audioEnabled);recorded.setEnabled(audioEnabled);if(audioEnabled)audioCtx.resume();else audioCtx.suspend();return audioEnabled;}};
}
