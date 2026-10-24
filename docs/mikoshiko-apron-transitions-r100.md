# Mikoshiko apron transitions R100

This packet reconciles **internal vertical edges** with the actual wider sanctuary apron. It does not change the heights of the path ribbon, apron, court, terrain or walking sampler. The R99 floor-wedge attribution and saved triangle rays identify the white curb cap/side at44.147247 and the R93 west court side below44.072249. The apron is at44.087250. The 2021 registered court photograph supports continuous paved/mineral circulation; it supplies no surveyed elevation. Existing source heights remain authoritative.

## API and order

```js
import {prepareMikoshikoApronTransitionsR100}
  from './mikoshiko-apron-transitions-r100.mjs';
// After named apron and Mikoshiko exist; before static batching:
const transitions = prepareMikoshikoApronTransitionsR100(root);
if (transitions.built) {
  surfaces.partitionApronEdgesR100 = transitions.partitionEdges;
}
// Existing viewer buildPathMeshes consumes the optional callback.
// Read transitions.report after path construction for final curb metrics.
```

Root owns integration/viewer changes. `path-meshes.mjs` has one narrowly scoped optional callback: `partitionApronEdgesR100(vertices, segment) -> vertices`. It runs only while emitting **nonmountain, nonstair curb caps and outer sides**, before their shared edge bucket is batched and its fallback metric UVs/normals generated. Stair tops/risers never enter the callback. Other buckets and all source segment objects remain untouched. With the callback absent, existing output stays unchanged.

The helper captures the actual named apron mesh triangles before batching; no mapped centreline, rectangle or midpoint substitutes for their outline. It requires the actual built Mikoshiko owner, its registered court dimensions/floor and a compatible apron level. The local region follows the existing court and one existing apron half-width1.8m around it. The apron support planes must be floor+.105±.003m; changed/missing owner signatures refuse construction. Triangle clipping uses the actual triangle union, not the region box.

Only five mapped approach owners can provide curbs:105449677/105449728/751194635/751194637/1106589423. Source segment provenance and `!stair` are mandatory, along with local position and original curb elevation guards. The old curb apex is floor+.165±.003m; unrelated levels and deeper retaining faces are preserved. These height checks supplement source identity rather than replace it.

## Exact clipping and existing court face

The cutter subtracts each apron triangle's three vertical half-plane prisms from the source triangle in **3D**, interpolating XYZ and any additional vertex attributes at intersections. A vertical curb triangle with zero XZ area remains valid; area/winding decisions use its actual3D area. Partial boundary pieces retain source Y and winding. No topological fill, terrain cover, level approximation or new batch hides the removed faces.

Only the original R93 court's outer-west vertical face is eligible for the second correction: localX=`courtBoundsLocal[0]`, within its original longitudinal bounds, between the recorded foundation bottom and floor+.09. This face lies below the actual apron where they intersect. Those hidden portions are removed; its uncovered exterior remains. The court top, private pickets, building, all other triangle positions/UVs/normals, materials and colliders are retained. Untouched triangles copy original attribute values directly. Actual registered downward probes at all three saved wedge locations confirm the apron covers those XZ points; the R93 face witness[72.549115,6.058321] is included. Evidence: `outputs/r100-mikoshiko/apron-registration.json`.

The path top remains35mm above the older apron top. R100 removes the redundant curb lip and buried court side without inventing a surveyed flush datum or modifying walking. No new ramp, route, step, railing, planting, texture or geometry batch is added. The source-backed scope is redundant internal edge removal, not a rebuild of the full compound.

## Verification

Four focused tests pass: degenerate-XZ vertical clipping; partial boundary and exterior preservation; exact retention of unrelated court triangle attributes/materials; source/stair/height guards and fail-closed missing/changed apron registration. Fourteen adjacent walking-top, Okusha-junction and Mikoshiko tests also pass:18 total. Final scoped diff and whitespace check reviewed.

Independent actual-network A/B review completed: only the edge bucket changes,678263→678223 triangles (−40). All ten other bucket position/normal/UV/color hashes remain identical. Thirteen captured apron triangles remove1.842639m² of redundant curb surface, and the recognized court face loses.253631m² below the apron. Original path-only camera rays688,453 and705,451 no longer hit curb geometry. A separate exact source-face check on the saved R93 triangle leaves two exterior fragments, and ray644,454 no longer hits that original court face (`outputs/r100-review/court-side-witness.json`). The full-scene ray was not rerun, so final appearance is not claimed. No stair segment enters the hook, and live collider/function identities remain unchanged. Evidence: `outputs/r100-review/actual-path-ab.json` and `independent-cpu-review.md` (reviewer-owned). The reviewer separately ran14 module/Mikoshiko tests successfully. Native rendering/browser review and the preserved35mm top-datum separation remain root-owned. No renderer, browser, GPU or commit was used here.
