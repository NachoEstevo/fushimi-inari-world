import {partitionSamePlanePathTrianglesR95} from './path-plane-partition-r95.mjs';

// Exact integrated-ray finding at [62.70296345,44.1222496,-20.70814837].
// Only the small flat sanctuary-side junction gets single top-face ownership.
// Existing lower apron, remote surfaces, risers and differing levels stay owned.
export function partitionSanctuaryPathTrianglesR95(vertices,sourceUV=null){
 return partitionSamePlanePathTrianglesR95(vertices,sourceUV,[60,65,-24,-17]);
}
