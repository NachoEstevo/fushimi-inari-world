# R100 independent CPU review

No actionable defect found in the completed scoped module and optional curb hook. The early stair-ownership concern was resolved by invoking the hook only from curb generation; stair tops, risers and mountain curbs bypass it before triangle buffers are partitioned.

Actual full-network A/B evidence is `actual-path-ab.json`. Both builds use the same assembled surfaces, ground and legacy materials; one omits the optional hook and the other applies the prepared actual-apron cutter.

- Only the edge bucket changes: 678,263 to 678,223 triangles, minus40. All ten other buckets have identical position, normal, UV and color array hashes.
- The cutter uses13 actual apron triangles and removes1.842639 m² of redundant curb surface. The separate recognized R93 west court side loses0.253631 m² beneath that apron.
- Original camera rays688,453 and705,451 hit the inherited wedge before the hook and have no path-geometry hit afterward. These are path-only rays; no claim is made that a full scene ray becomes empty ground.
- The third witness644,454 also misses the remaining R93 source-face fragments after applying the current cutter to its exact saved triangle and actual apron triangles. Two exterior polygons remain. `court-side-witness.json` records this targeted source-face check; it is not a full-scene ray rerun.
- No hook invocation receives a stair segment. Colliders and the walking/terrain height function references remain unchanged. New geometry/material batches are not introduced.
- An ordered single-pass startup measurement was2,836.6 ms without the hook and2,619.6 ms with it. This warmup-sensitive sample does not establish a speed improvement or a stable performance delta. The hook executes297,820 times globally but the measurement does not demonstrate a regression; it performs no per-frame work.

The 3D half-plane cutter retains vertical triangles despite their zero projected XZ area and interpolates vertex components at intersections. Exterior fragments retain original winding. Source-path provenance, nonstair status, actual court region and elevation guards bound applicability. Unrelated court triangles preserve their original attribute values without transform round trips. Missing or mismatched registered owners/apron elevation fail before source geometry mutation.

Four new module tests plus ten Mikoshiko details/original-precinct tests passed:14 total in this independent run. Reviewed final module and path-meshes diff; scoped whitespace check passed. Actual feature-file parity was also checked; the script's feature comparison is against the unchanged input file, while collider and callback checks use the live assembled values.

Native appearance, the small remaining path/apron top-datum difference and full-scene rendered closure remain root-owned. No production edits, browser or renderer were used for this review.

Final root integration was reviewed afterward. The cutter prepares before static batching and installs its callback on the same surfaces object passed to viewer path construction. An initially stale diagnostic serialization was identified and corrected: assembly now exposes the live report reference and viewer publishes it immediately after buildPathMeshes, so final curb counters are retained. Cache imports are revised. No further integration finding remains.
