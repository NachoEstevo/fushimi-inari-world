// Estimate from two supplied June 2012 courtyard views, anchored to the mapped
// reception frontage. These are not surveyed dimensions or present-day claims.
export function northCourtPlantingLayout(features){
  const hall=features.buildings.find(b=>b.id==='way/105449708');
  const shops=features.buildings.find(b=>b.id==='way/305214356');
  const stairs=features.paths.find(p=>p.id==='way/1106589424');
  if(!hall||!shops||!stairs)return null;
  const west=Math.min(...hall.points.map(p=>p[0]));
  const front=hall.points.filter(p=>p[0]<west+.8);
  const midZ=(Math.min(...front.map(p=>p[2]))+Math.max(...front.map(p=>p[2])))/2;
  return {center:[west-5.6,midZ+.36],radii:[2.5,2.1],curbHeight:.22,
    hallId:hall.id,shopId:shops.id,stairsId:stairs.id,estimated:true};
}
export function ellipseBoundary(spec,angle){return [spec.center[0]+Math.cos(angle)*spec.radii[0],spec.center[1]+Math.sin(angle)*spec.radii[1]];}
