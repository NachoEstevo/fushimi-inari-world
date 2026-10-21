import {mappedStationPlacement,mappedStationId} from './station-placement-layout.mjs';
export {mappedStationId};

// Relocate only the authored station group, retaining its seventeen components,
// sign interaction and dimensions. The mapped footprint supplies XZ and heading;
// the public-front floor elevation remains a shared-surface estimate.
export function placeMappedInariStation(root,features,surfaces,colliders){
 const placement=mappedStationPlacement(features);if(!placement)return {placed:false,reason:'mapped train station missing'};
 const candidates=[];
 root.traverse(o=>{
  if(!o.isGroup||o.userData.mappedStationPlaced)return;
  const podium=o.children.find(c=>c.geometry?.parameters?.width===24&&c.geometry.parameters.depth===5.6);
  const roof=o.children.find(c=>c.geometry?.parameters?.width===25.2&&c.geometry.parameters.depth===6.8);
  if(podium&&roof)candidates.push(o);
 });
 if(candidates.length!==1)return {placed:false,reason:'unique original station group not found'};
 const station=candidates[0],matching=colliders.filter(c=>c.type==='box'&&c.args.at(-1)==='jr_inari_station');
 if(matching.length!==1)return {placed:false,reason:'unique original station collider not found'};
 const [x,z]=placement.center,yaw=placement.yaw,c=Math.cos(yaw),s=Math.sin(yaw),frontX=x-s*2.8,frontZ=z-c*2.8,base=surfaces.height(frontX,frontZ);
 station.removeFromParent();station.position.set(x,base,z);station.rotation.set(0,yaw,0);root.add(station);
 // Original collider is .4m behind the station origin, not at its frontage.
 const collider=matching[0],args=[...collider.args];args[0]=x+s*.4;args[1]=z+c*.4;args[4]=yaw;args[5]=base;args[6]=base+5;collider.args=args;
 station.name='JR Inari station on mapped footprint';station.userData={...station.userData,mappedStationPlaced:true,sourceFeature:mappedStationId,placementProvenance:'OSM building footprint center/long edge; original station geometry retained; floor inferred from public-front surface'};
 return {placed:true,...placement,base,components:station.children.length};
}
