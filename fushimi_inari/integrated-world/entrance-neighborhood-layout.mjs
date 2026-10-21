// Retain the three remaining authored southern shop assets pending source-led replacement.
// These positions are only an overlap exclusion, never geographic authority.
const oldShopCenters=[[-89.16,20.07],[-78.68,19.45],[-68.70,18.85]];
export function entranceNeighborhoodLayout(features){
 const records=[],skipped=[];
 for(const building of features.buildings){
  if(building.tags?.building==='roof')continue; // An open mapped canopy does not justify solid walls.
  const points=building.points.slice(0,-1);if(points.length<3)continue;
  const cx=points.reduce((n,p)=>n+p[0],0)/points.length,cz=points.reduce((n,p)=>n+p[2],0)/points.length;
  const north=cx>=-160&&cx<=-18&&cz>=-100&&cz<=0,south=cx>=-160&&cx<=-20&&cz>=20&&cz<=65;if(!north&&!south)continue;
  // Conservative rectangle tests cover each retained shop's approximately
  // 4.2m world-X depth and 6.2m world-Z frontage, plus its awning.
  const xs=points.map(p=>p[0]),zs=points.map(p=>p[2]);
  const overlaps=oldShopCenters.some(([sx,sz])=>Math.min(...xs)<sx+3&&Math.max(...xs)>sx-3&&Math.min(...zs)<sz+3.6&&Math.max(...zs)>sz-3.6);
  if(overlaps){skipped.push(building.id);continue;}
  const explicit=Number.parseFloat(building.tags?.height),levels=Number.parseFloat(building.tags?.['building:levels']);
  const photographedMinami=building.id==='way/260121332',photographedGishikiden=building.id==='way/223276575';
  const height=photographedGishikiden?16:photographedMinami?5.2:Number.isFinite(explicit)&&explicit>0?explicit:Number.isFinite(levels)&&levels>0?levels*3:4.5;
  records.push({id:building.id,points,height,publicFacadeEdge:photographedMinami?1:null,heightSource:photographedGishikiden?'2021 photographs, estimated16m overall; screen bands are not storeys':photographedMinami?'2016 photograph two storeys; estimated5.2m':Number.isFinite(explicit)&&explicit>0?'OSM height':Number.isFinite(levels)&&levels>0?'OSM storeys at estimated3m':'estimated4.5m',center:[cx,cz]});
 }
 return {records,skippedLegacyShopOverlap:skipped};
}
