// June 2012 supplied Street View MvihcVb0f466FBJebqyECg shows a broad
// divided access, rather than the 2 m centreline-width placeholder in OSM.
// 4.8 m is a photographic estimate, not a survey. Source data stays intact.
const WIDE=new Set(['way/105449693','way/1133055112','way/1133055111','way/649175020']);
export function tamayamaAccessFeatures(features){
  return {...features,paths:features.paths.map(path=>WIDE.has(path.id)?{
    ...path,tags:{...path.tags,width:'4.8'},
  }:path)};
}
