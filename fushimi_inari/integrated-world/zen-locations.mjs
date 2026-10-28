export function zenJourneyLocations(assembly,shop,streetCommerce){
 const by=assembly.spatial.byId,station=assembly.keihanStation??assembly.inariStation;
 const point=id=>by[id]?.checkpoint??by[id]?.target;
 const result={station:[station?.spec.publicExit?.position,station?.spec.route?.platformDoor,point('keihan_drinks')].filter(Boolean),yotsu:point('yotsu'),summit:point('summit'),senbon:point('senbon'),canal:point('inari_bridge'),drink:(streetCommerce?.machines??[]).map(machine=>machine.spec.position)};
 if(assembly.spatial.twins?.[0])result.senbon={point:assembly.spatial.twins[0].at(.04).point,target:assembly.spatial.twins[0].at(.14).point};
 const bridge=assembly.keihanApproach?.bridge,canalPoint=point('inari_bridge');
 if(canalPoint&&bridge?.west&&bridge?.east){
  const dx=bridge.east[0]-bridge.west[0],dz=bridge.east[1]-bridge.west[1],length=Math.hypot(dx,dz);
  if(length>1){const x=(bridge.east[0]+bridge.west[0])/2,z=(bridge.east[1]+bridge.west[1])/2;
   result.canal=[-1,1].map(side=>({point:canalPoint,target:[x-side*dz/length*10,canalPoint[1],z+side*dx/length*10]}));}
 }
 result.tea=[point('chaya_n'),point('chaya_s'),point('yotsu')].filter(Boolean);
 if(shop?.stats.built){const {a,b}=shop.stats.front;result.tea.push([(a[0]+b[0])/2,shop.stats.floor,(a[2]+b[2])/2]);}
 // Explicit public approach checkpoints, not arbitrary building centres.
 result.postcard=[point('keihan_food'),point('inari_bridge'),...result.station].filter(Boolean);return result;
}
