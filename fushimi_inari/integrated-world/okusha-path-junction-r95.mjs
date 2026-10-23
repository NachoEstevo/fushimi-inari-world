import {partitionSamePlanePathTrianglesR95} from './path-plane-partition-r95.mjs';

// Source ways301527759/301527762 overlap on the shared court datum. Preserve
// their emitted union once within the verified Okusha court bounds only.
export function partitionOkushaPathTrianglesR95(vertices,sourceUV=null){
  return partitionSamePlanePathTrianglesR95(vertices,sourceUV,[237,282,54,84]);
}
