# R97 Shin-ike bounded opposite-bank landscape

## Source and omission

Inspected actual root final `outputs/r97-kumataka/final/kumataka-aerial.png` and
`kumataka-pondedge.png`, then compared actual saved source
`outputs/r97-kumataka-references/DSC_0009_20190202.jpg`. The final assembly has
widely separated tall trees over largely bare opposite slopes. The source has
continuous layered woodland down toward the opposite/side banks, enclosing the
pond and masking background sky/ground. The separate source view
`P3600707_20190210.jpg` also shows dense mixed leafy forest around the pond.
Sources: [wide pond](https://fushimiinari-guide.com/wp-content/uploads/DSC_0009_20190202.jpg),
[through fence](https://fushimiinari-guide.com/wp-content/uploads/P3600707_20190210.jpg).
No new video playback, native rendering or local browser was used.

Existing `forest.mjs` excludes every water/building's axis-aligned bounding box
plus2m, samples an illustrative grid, and uses large regional buckets/LOD. This
can leave the irregular pond's nearby banks sparse despite forest being present
in code. Its roots/colliders remain independent owners. This packet fills only
an explicit opposite-bank arc; it does not replace the whole regional forest,
remove crowns, repair legacy floating roots or touch the fallen log.

## API and spatial contract

`buildShinikeBankLandscapeR97(root,features,network,legacy,colliders,
{terrainPositions,water:shinikeReport})` returns
`{built,seed,trees,growth,skipped,triangles,drawBatches,newColliders,...}`.
Call after final water/bank construction, existing forest/tree/solid ownership,
and final terrain clipping; before final render review. The source trunk is
`legacy.foliage[0].geometry/material`. No dependency or downloaded runtime asset
is introduced. Repeated calls are idempotent.

Candidate stations follow mapped ring edges3–17, opposite/east/north/south sides.
The west/shrine-facing sector remains open. Trees use6.5m arc spacing and2m
outward setback; shrubs3.2m spacing and1.35m setback. These are deterministic,
photo-inferred roots and proportions, not a surveyed tree inventory. Maximum18
trees and45 shrubs prevent an unbounded generic forest fill. Public routes,
resolved junction triangles and conservative building roofs remain exclusions.
Existing cylinder/box solids suppress new nearby trunks, preserving regional
forest ownership; no old instance/color/collider is edited.

Tree roots must be outside the actual water ring with at least1.08m shoreline
clearance. Their center and four footprint support stations sample ONLY actual
rendered terrain triangles. Missing support, wet ground or more than.85m relief
across the footprint withholds that tree. The flared base is buried20cm below
the lowest support. Individual tree roots never use a walking-height callback,
DEM fallback or a guessed pond/collar level.

High leafy crowns MAY overhang water, matching photographed enclosure and
reflections; root selection is never inferred from canopy overlap. Three
irregular overlapping crown masses per accepted tree form a layered crown.
Their conservative3.1m horizontal envelope preserves public route/head space,
actual junctions and roofs. Whole-source transformed leaf vertices are tested.
The implementation does not create trees inside open water or broadly delete
canopies which happen to project across it.

Low growth separately requires dry outside-water placement, all four actual
terrain support samples, at most.85m local relief and its whole.95m exclusion
envelope. Its actual lowest crown vertex is anchored8cm INTO the lowest center/corner
support, so leaf cards intersect the natural slope rather than hovering over
the lower side. Uphill foliage can naturally intersect soil; no visible gap is
introduced to protect cards from burial. This is shrub grounding, not a new
terrain surface or path patch.

## Appearance and quantified budget

The original source flared sugi trunk geometry/material is reused unchanged.
Leaves follow existing `evergreen-canopy.mjs` volumetric cutout-spray pattern at
96 cards/192 triangles per cluster; `leafClusterMaterial()` shares the existing
procedural texture/material. Seed9717 is fixed. Varied evergreen-like greens
match the source's leafy season; no autumn red momiji, new light, animation,
per-frame update, water reflection pass or fog is added. Botanical species and
individual branch positions are inferred.

Exactly THREE possible instanced batches: trunks, mature crown clusters, and
low growth. Maximum counts18 trunks +54 crown clusters +45 shrubs give
**22,896 triangles** with the actual216-triangle source trunk, comfortably below
the requested35k bound. No new LOD manager is added for this small bounded owner;
meshes use existing `nearForest` visibility semantics. Actual integration may
emit fewer instances due to prior forest/route/roof/support exclusions. At most
18 new trunk cylinders are added, rooted outside water and routes.

## Verification and remaining review

Seven tests pass with real source mapped paths/water/buildings and a sloping
actual-triangle fixture: bounded budget/source immutability/idempotence; every
actual transformed foliage vertex versus routes and water rules; prior exact
forest-root suppression; missing/wet terrain and authoritative widened walking
segments; deterministic matrices/green season/finite instance bounds and ground
support; resolved junction-triangle exclusion; every transformed low-crown minimum
vertex8cm below actual minimum support. The actual source trunk's216-tri
primitive dimensions are represented in the budget fixture. Characteristic
high crown overhang is positively asserted while all roots and low foliage
remain dry. `git diff --check` passes.

Root owns final integration counts and source-camera canopy density review,
actual terrain contact, native cutout appearance, shrine visibility and frame
cost. No final assembled visual acceptance is claimed here. Only the new bank
module, its test and this document were edited by this packet; no integration,
legacy-vegetation repair, log, renderer or commit was touched.

Final code review confirmed existing culling semantics: integration collects each
`nearForest` mesh's world bounding sphere into `forestChunks`; viewer hides it
when camera distance reaches sphere radius+400m. The new three batches use this
existing mechanism. Crown vertex greens and the shared cutout leaf material are
intentional evergreen-like source-season choices, verified by the deterministic
color test. After review, low growth's actual minimum transformed vertex now
sits8cm inside minimum support; seven tests pass. Work stops at this requested
iteration; integration/render/commit remain root-owned.
