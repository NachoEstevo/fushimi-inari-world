// Real, credited bird sample; synthesized breeze/chimes. The original action
// sounds remain in audio.mjs. No browser audio starts before a user gesture.
export function createAmbience(ctx,{document=globalThis.document,fetcher=globalThis.fetch}={}){
  const bus=ctx.createGain();bus.gain.value=.55;bus.connect(ctx.destination);
  let bird=null,load='loading',nextBird=0,nextChime=0,enabled=false,birdCalls=0,chimeCalls=0;
  const volumeControl=document.getElementById('ambient-volume'),windControl=document.getElementById('ambient-wind'),birdControl=document.getElementById('ambient-birds'),chimeControl=document.getElementById('ambient-chimes');
  let lastReport=-Infinity,lastNight=false,lastBreeze=0,disposed=false;
  fetcher('../assets/audio/uguisu-koba-chan.ogg').then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();})
    .then(b=>ctx.decodeAudioData(b)).then(b=>{if(!disposed){bird=b;load='ready';}}).catch(()=>{if(!disposed)load='unavailable';});
  const noise=ctx.createBuffer(1,ctx.sampleRate*8,ctx.sampleRate),data=noise.getChannelData(0);
  let brown=0;
  for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.015;data[i]=brown*4;}
  const wind=ctx.createBufferSource();wind.buffer=noise;wind.loop=true;
  const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;
  const windGain=ctx.createGain();windGain.gain.value=0;wind.connect(filter).connect(windGain).connect(bus);wind.start();
  const sources=new Set();
  function spatial(x,y,z){
    const p=ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';
    p.refDistance=5;p.maxDistance=70;p.rolloffFactor=1.2;
    p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z;p.connect(bus);return p;
  }
  function remember(source,nodes){
    sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();nodes.forEach(n=>n.disconnect());};
  }
  function chime(x,y,z){
    chimeCalls++;
    const p=spatial(x,y,z);let remaining=3;
    for(const [freq,amp] of [[1850,.015],[2760,.006],[4300,.003]]){
      const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime;
      o.frequency.value=freq;g.gain.setValueAtTime(amp,now);g.gain.exponentialRampToValueAtTime(.00001,now+3);
      o.connect(g).connect(p);sources.add(o);
      o.onended=()=>{sources.delete(o);o.disconnect();g.disconnect();if(!--remaining)p.disconnect();};
      o.start();o.stop(now+3.1);
    }
  }
  function report(force=false){
    const now=ctx.currentTime;if(!force&&now-lastReport<.25)return;lastReport=now;
    document.body.dataset.ambience=JSON.stringify({enabled,bird:load,activeSources:enabled?sources.size:0,birdCalls,chimeCalls,night:lastNight,breeze:Number(lastBreeze.toFixed(2))});
  }
  return {
    setEnabled(value){if(disposed)return;enabled=value;if(!value){for(const s of sources)s.stop();nextBird=0;nextChime=0;}report(true);},
    update(camera,night=false){
      if(disposed)return;const now=ctx.currentTime;
      const volume=Number(volumeControl?.value??55)/100;
      bus.gain.setTargetAtTime(enabled?volume:0,now,.2);
      if(!enabled)return;
      const l=ctx.listener,p=camera.position,q=camera.quaternion;
      l.positionX.value=p.x;l.positionY.value=p.y;l.positionZ.value=p.z;
      l.forwardX.value=-2*(q.x*q.z+q.w*q.y);l.forwardY.value=-2*(q.y*q.z-q.w*q.x);l.forwardZ.value=-(1-2*(q.x*q.x+q.y*q.y));
      l.upX.value=2*(q.x*q.y-q.w*q.z);l.upY.value=1-2*(q.x*q.x+q.z*q.z);l.upZ.value=2*(q.y*q.z+q.w*q.x);
      const breeze=Math.max(0,Math.sin(now*.071)+.35*Math.sin(now*.193)-.2);
      windGain.gain.setTargetAtTime(windControl?.checked===false?0:.025+breeze*.10,now,1.5);
      if(now>nextBird){
        nextBird=now+14+Math.random()*26;
        if(bird&&!night&&p.x>160&&birdControl?.checked!==false){
          const angle=Math.random()*Math.PI*2,pan=spatial(p.x+Math.cos(angle)*18,p.y+4,p.z+Math.sin(angle)*18);
          const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=bird;g.gain.value=.35;
          s.connect(g).connect(pan);remember(s,[g,pan]);s.start();birdCalls++;
        }
      }
      if(now>nextChime){
        nextChime=now+25+Math.random()*40;
        if(chimeControl?.checked&&breeze>.2){
          for(const [x,y,z] of [[806.8,167,-207.5],[815,174,-243.5]])
            if(Math.hypot(p.x-x,p.z-z)<25)chime(x,y,z);
        }
      }
      lastNight=night;lastBreeze=breeze;report();
    },dispose(){
      if(disposed)return;disposed=true;enabled=false;for(const source of sources){try{source.stop();}catch{}}sources.clear();
      wind.stop();wind.disconnect();filter.disconnect();windGain.disconnect();bus.disconnect();bird=null;
    }
  };
}
