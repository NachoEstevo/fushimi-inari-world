// Continuous rail joints follow the already-resolved tread profile. Averaging
// incident tread tops avoids little horizontal rail steps at every riser.
export function tamayamaStairRailLayout(network){
  return flightRailLayout(network,'way/105449693');
}

// OSM 626313768 explicitly records handrail:center=yes and joins the 6 m
// Okumiya upper landing 1392716577. Video 06:05 confirms the brown twin-tube
// dividing assembly on this flight; its tube spacing/height are inferred.
export function okumiyaStairRailLayout(network){
  return flightRailLayout(network,'way/626313768');
}

function flightRailLayout(network,id){
  const flight=network.segments.filter(s=>s.id===id&&s.stair);
  if(!flight.length)return null;
  const joints=flight.map((s,i)=>[s.a[0],(s.ya+(flight[i-1]?.yb??s.ya))/2+.84,s.a[2]]);
  const last=flight.at(-1);joints.push([last.b[0],last.yb+.84,last.b[2]]);
  return {flight,joints};
}
