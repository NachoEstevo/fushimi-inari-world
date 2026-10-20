// Stable replacement cohorts, not per-frame randomness. These are artistic
// variations informed by references; no individual gate is claimed surveyed.
function noise(seed,index){
  let n=Math.imul(seed^index,1597334677);
  n=Math.imul(n^(n>>>16),2246822507);
  return ((n^(n>>>13))>>>0)/4294967296;
}
export function toriiVariation(seed,index,wear=.38){
  const cohort=noise(seed,Math.floor(index/9)+900);
  return {
    weathered:noise(seed,index*7)<Math.max(.12,Math.min(.72,wear+(cohort-.5)*.3)),
    width:.98+noise(seed,index*7+1)*.04,
    height:.965+noise(seed,index*7+2)*.07,
    depth:.94+noise(seed,index*7+3)*.12,
    yaw:(noise(seed,index*7+4)-.5)*.012,
    tint:.88+noise(seed,index*7+5)*.12,
  };
}
export function spacedGateStations(length,{spacing=.57,minimum=.43,margin=.65,seed=91}={}){
  if(!Number.isFinite(length)||length<=margin*2)return [];
  if(!(minimum>0&&spacing>=minimum&&margin>=0))throw new RangeError('Invalid torii spacing');
  const stations=[];
  for(let d=margin,i=0;d<length-margin;i++){
    stations.push(d);
    // Small construction/replacement groups with occasional breathing room.
    d+=Math.max(minimum,spacing*(.82+noise(seed,i)*.36))+(i%17===16?.25:0);
  }
  return stations;
}
