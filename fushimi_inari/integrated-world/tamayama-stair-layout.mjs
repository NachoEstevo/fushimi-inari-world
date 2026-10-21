// Continuous rail joints follow the already-resolved tread profile. Averaging
// incident tread tops avoids little horizontal rail steps at every riser.
export function tamayamaStairRailLayout(network){
  const flight=network.segments.filter(s=>s.id==='way/105449693'&&s.stair);
  if(!flight.length)return null;
  const joints=flight.map((s,i)=>[s.a[0],(s.ya+(flight[i-1]?.yb??s.ya))/2+.84,s.a[2]]);
  const last=flight.at(-1);joints.push([last.b[0],last.yb+.84,last.b[2]]);
  return {flight,joints};
}
