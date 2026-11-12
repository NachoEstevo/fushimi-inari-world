// Walking comfort preferences, stored under one namespaced key like the other
// small viewer preferences. Unavailable or corrupted storage falls back safely.
export const WALK_SETTINGS_KEY='inari-walk-settings';
export const DEFAULT_WALK_SETTINGS=Object.freeze({sensitivity:1,invertY:false,headBob:true});
export const SENSITIVITY_MIN=.25,SENSITIVITY_MAX=2.5,LOOK_RADIANS_PER_PIXEL=.003;

export function normalizeWalkSettings(value){
  const source=value&&typeof value==='object'?value:{},sensitivity=Number(source.sensitivity);
  return {sensitivity:Number.isFinite(sensitivity)?Math.max(SENSITIVITY_MIN,Math.min(SENSITIVITY_MAX,sensitivity)):DEFAULT_WALK_SETTINGS.sensitivity,
    invertY:typeof source.invertY==='boolean'?source.invertY:DEFAULT_WALK_SETTINGS.invertY,
    headBob:typeof source.headBob==='boolean'?source.headBob:DEFAULT_WALK_SETTINGS.headBob};
}
function defaultStorage(){try{return globalThis.localStorage??null;}catch{return null;}}
export function loadWalkSettings(storage=defaultStorage()){
  try{const raw=storage?.getItem(WALK_SETTINGS_KEY);return normalizeWalkSettings(raw?JSON.parse(raw):null);}catch{return normalizeWalkSettings(null);}
}
export function saveWalkSettings(settings,storage=defaultStorage()){
  try{storage?.setItem(WALK_SETTINGS_KEY,JSON.stringify(normalizeWalkSettings(settings)));return true;}catch{return false;}
}
// Mouse deltas in pixels become yaw and pitch radians; writes into `out`.
export function lookAngles(dx,dy,settings,out={yaw:0,pitch:0}){
  const scale=LOOK_RADIANS_PER_PIXEL*(settings?.sensitivity??1);
  out.yaw=(Number(dx)||0)*scale;out.pitch=(Number(dy)||0)*scale*(settings?.invertY?-1:1);return out;
}
export function prefersReducedMotion(view=globalThis){
  try{return !!view.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;}catch{return false;}
}

export function createWalkSettings({storage=defaultStorage(),initial}={}){
  let current=initial?normalizeWalkSettings(initial):loadWalkSettings(storage);
  const listeners=new Set();
  return {
    get sensitivity(){return current.sensitivity;},get invertY(){return current.invertY;},get headBob(){return current.headBob;},
    snapshot(){return {...current};},
    set(patch){current=normalizeWalkSettings({...current,...patch});saveWalkSettings(current,storage);for(const fn of listeners)fn(current);return current;},
    subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
  };
}
