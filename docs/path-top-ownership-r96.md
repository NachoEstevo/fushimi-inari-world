# R96 shared walking-top ownership

Four actual integrated ray findings established the same failure in different
places: Okusha, sanctuary-side paving, Honden rear, and Omotesando. At the latter,
pixel375/374 meets two path triangles at world[-73.297556,36.606998,5.608800].
The crossing joins the Omotesando central slab and footway1133052415. Independent
material-bucket partitioning cannot handle this cross-material overlap.

`partitionWalkingTopsR96` processes an explicit ordered list of walking owners:
Omotesando and Senbon authored ribbons, precinct, stone, mountain paving and
mountain treads. An8m XZ cell index with adjacent1e-5m height bins limits candidate
comparisons. Only horizontal, same-plane triangle intersections are subtracted.
Each remaining fragment retains its original material bucket and interpolated
source UVs. Original triangles define the claimed union; deterministic owner
priority preserves central ribbons at material crossings. Slopes, separate
heights, lower aprons, terrain, graph and colliders are unchanged. Existing
bounded Okusha curb/earth ownership remains independently installed.

Six focused tests cover all four measured triangle pairs, union area,
cross-material priority, UV interpolation, cell/height-bin boundaries, distinct
levels, sloped inputs and excluded curbs. Twelve existing adjacent tests passed.

A real full integration CPU build captured canonical source path buckets before
partitioning. It contained54,267 walking-top triangles; the indexed pass emitted
54,541, with11,889 candidate comparisons and306 positive overlaps. All four
measured world samples changed from two faces to one. Repeating the pass over
its complete output found zero remaining positive overlaps and retained54,541
triangles. Evidence:outputs/r96-integrated/path-top-ownership-benchmark.json.
Five timings compare this broader pass with the prior bounded stone/precinct
corrections on the same captured source, excluding clone/setup time. This is CPU
startup evidence; browser FPS and native appearance require separate review.

Root must refresh the fixed Omotesando/Honden/Okusha cameras and run release
gates before accepting visual completion. No renderer was launched here.
