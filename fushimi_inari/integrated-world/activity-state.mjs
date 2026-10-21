// Single finite animation: repeated input cannot stack timers or sounds.
export function createActivity(duration){
  let started=-Infinity;
  return {start(now){if(now-started<duration)return false;started=now;return true;},
    progress(now){return Math.max(0,Math.min(1,(now-started)/duration));}};
}
