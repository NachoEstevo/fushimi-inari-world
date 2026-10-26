// The world uses a moving directional sun so its finite shadow atlas follows the
// walker. Keep the light transform and atlas synchronized: moving the camera on
// a skipped shadow frame would project an old atlas from a new origin.
export function createSunShadowSchedule({sun,intervalMs=1000/30}) {
  if(!sun?.shadow||!sun.target?.position||!sun.position)throw new TypeError('Sun shadow scheduling requires a directional light');
  if(!Number.isFinite(intervalMs)||intervalMs<0)throw new RangeError('Shadow interval must be a finite non-negative duration');
  const originalAutoUpdate=sun.shadow.autoUpdate;
  let last=-Infinity,invalidated=true,disposed=false;
  const stats={updates:0,skipped:0,intervalMs};
  sun.shadow.autoUpdate=false;
  function update(time,position,offset) {
    if(disposed)return false;
    if(!Number.isFinite(time))throw new TypeError('Shadow time must be finite milliseconds');
    // Preserve external invalidations from streaming, lighting and photo mode.
    const forced=invalidated||sun.shadow.needsUpdate;
    if(!forced&&time>=last&&time-last<intervalMs){stats.skipped++;return false;}
    sun.target.position.copy(position);sun.target.position.y-=1.7;
    sun.position.copy(sun.target.position).add(offset);
    sun.shadow.needsUpdate=true;
    last=time;invalidated=false;stats.updates++;
    return true;
  }
  return {update,stats,invalidate(){invalidated=true;},dispose(){if(disposed)return;disposed=true;sun.shadow.autoUpdate=originalAutoUpdate;sun.shadow.needsUpdate=true;}};
}
