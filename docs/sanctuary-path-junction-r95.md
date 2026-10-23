# R95 sanctuary-side paving overlap

Root's actual integrated `tamayama-choja-overlap.png` black rectangle was
diagnosed without rendering using its exact saved camera and exported triangle
JSON. At pixel `[440,550]`, two different paving triangles both intersect
`[62.7029634538,44.1222496033,-20.7081483690]`, at distances
53.14599623643824 and53.14599623643825. Neighbor pixels430/540 and450/560 show
the same duplicate plane. The separate mapped sanctuary approach apron is
0.035m below; terrain is lower again. This is a coplanar overlap, not a terrain
hole exposed by proxy removal.

The already verified Okusha algorithm now lives in the explicitly named
`path-plane-partition-r95.mjs`. Existing Okusha wrapper/bounds remain unchanged.
`partitionSanctuaryPathTrianglesR95(vertices,sourceUV=null)` reuses that core
inside independent bounds `[60,65,-24,-17]` only. It partitions overlapping
horizontal triangles at the same Y within1e-5m; different levels, slopes,
remote geometry and the lower apron remain untouched. Interpolated source UVs
are preserved. No global weld, terrain fill, walking-height or collider change.

Root chains this after existing Okusha stone/material partition; no edge/earth
change is justified by the measured hit. Exact exported-triangle regression
checks union area, pairwise non-overlap, one face at the measured pixel hit,
lower-apron retention, remote Okusha retention and metric UV preservation.
Five combined Okusha/sanctuary tests pass. A repeated operation preserves union
area but may change triangulation at numeric boundary contacts; production
rebuilds always start from canonical emitted source triangles.

Native/integrated final pixel acceptance remains root-owned. No renderer or
browser was opened here.

## Resumed production-path correction

Actual fixed-camera rerender still showed the rectangle despite helper tests: local paths emit into the precinct material bucket, whereas the first call covered only stone. The bounded partition now runs on both stone and precinct, retaining the original material. A regression through actual buildPathMeshes uses the two exported triangles and checks single ownership, area and UVs. Fresh export and unchanged camera now show continuous paving at pixel440/550. Native textured browser appearance remains unverified.
