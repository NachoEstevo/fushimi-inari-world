// These small, unclassified OSM footprints sit beside the Naihaiden approach.
// OSM supplies building=yes but no type/height. The existing facade reference
// (fushimiinari-guide.com/wp-content/uploads/DSC_0712_20190331.jpg) does not
// support the former solid 6m blocks. Keep their source records for surveying;
// do not assert a building, roof or statue by drawing an invented extrusion.
export const UNRESOLVED_APPROACH_PROXIES=new Set(['way/305214366','way/305214610']);
export function omitUnverifiedPrecinctProxy(building){
 const tags=building.tags??{};
 return UNRESOLVED_APPROACH_PROXIES.has(building.id)&&tags.building==='yes'
  &&!tags.height&&!tags['building:levels']&&!tags.name;
}

// A sourced footprint is still useful map data, but an inferred flat 4 m box
// is not a modeled shrine. Visitor rendering omits only these unresolved
// religious envelopes; POIs, walking/collision data and detailed models remain.
// The viewer's explicit mappedProxies=1 inspection mode retains the volumes.
export function omitUnmodeledShrineProxy(building){
 const tags=building.tags??{},sacred=tags.building==='shrine'||tags.religion==='shinto'||tags.amenity==='place_of_worship';
 return sacred&&!Number.isFinite(Number.parseFloat(tags.height))&&!Number.isFinite(Number.parseFloat(tags['building:levels']));
}
