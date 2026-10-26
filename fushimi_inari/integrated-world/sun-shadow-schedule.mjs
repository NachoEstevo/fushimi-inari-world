const CADENCES={balanced:{moving:1000/15,idle:200},high:{moving:1000/30,idle:100}};
// Light and target only move on atlas refreshes, keeping projection synchronized.
export function createSunShadowSchedule({sun,quality='high',teleportDistance=8}) {
  if(!sun?.shadow||!sun.target?.position||!sun.position)throw new TypeError('Sun shadow scheduling requires a directional light');
  if(!Object.hasOwn(CADENCES,quality))throw new RangeError('Unknown shadow quality');
  if(!Number.isFinite(teleportDistance)||teleportDistance<=0)throw new RangeError('Teleport distance must be positive and finite');
  const originalAutoUpdate=sun.shadow.autoUpdate;
  let last=-Infinity,invalidated=true,disposed=false,previousPosition=null,previousOffset=null;
  const stats={updates:0,skipped:0,intervalMs:CADENCES[quality].idle,quality,moving:false};
  sun.shadow.autoUpdate=false;
  function update(time,position,offset) {
    if(disposed)return false;
    if(!Number.isFinite(time))throw new TypeError('Shadow time must be finite milliseconds');
    const distanceSquared=previousPosition?previousPosition.distanceToSquared(position):0;
    const moving=distanceSquared>1e-10;
    const offsetChanged=previousOffset&&!previousOffset.equals(offset);
    const teleported=distanceSquared>teleportDistance*teleportDistance;
    previousPosition??=position.clone();previousPosition.copy(position);
    previousOffset??=offset.clone();previousOffset.copy(offset);
    stats.moving=moving;stats.intervalMs=CADENCES[quality][moving?'moving':'idle'];
    const forced=invalidated||sun.shadow.needsUpdate||offsetChanged||teleported;
    if(!forced&&time>=last&&time-last<stats.intervalMs){stats.skipped++;return false;}
    sun.target.position.copy(position);sun.target.position.y-=1.7;
    sun.position.copy(sun.target.position).add(offset);
    sun.shadow.needsUpdate=true;
    last=time;invalidated=false;stats.updates++;
    return true;
  }
  return {update,stats,setQuality(next){
    if(!Object.hasOwn(CADENCES,next))throw new RangeError('Unknown shadow quality');
    if(next===quality)return;
    quality=next;stats.quality=quality;stats.intervalMs=CADENCES[quality][stats.moving?'moving':'idle'];invalidated=true;
  },invalidate(){invalidated=true;},dispose(){if(disposed)return;disposed=true;sun.shadow.autoUpdate=originalAutoUpdate;sun.shadow.needsUpdate=true;}};
}
