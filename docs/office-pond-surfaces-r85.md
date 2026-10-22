# Horizontal office ponds R85

## Problem and source boundary

The generic viewer water used raw ground +0.30m independently at every mapped polygon vertex. This made the two office ponds slope uphill and put their water approximately 0.288m above the terrain-based bank overlays. R85 gives each of the two existing mapped polygons one horizontal water level and a bounded rendered basin.

Owned IDs are only `way/626313848` and `way/626313851`. Their full concave shore outlines remain exactly map-derived. The level/depth/liner are explicit visual inferences. [Obayashi's office exterior](https://www.obayashi.co.jp/works/detail/work_1443.html) and [Kyoto Urban Greenery Association's garden account](https://www.kyoto-ga.jp/greenery/kyononiwa/2015/09/post_12.html), inspected in the earlier office passes, establish actual garden water beside the building. They do not establish surveyed pond elevations, depths or the artificial DEM relief. No island, new pond, changed office footprint or public path is invented.

## Integration API

```js
const officePonds = buildOfficePondSurfaces(root, features, surfaces, legacy.materials);
// Once, while constructing the actual viewer terrain geometry:
const positions = officePonds.clipTerrain(rawTerrainTrianglePositions);
```

`buildOfficePondSurfaces` owns a group named `Mapped horizontal office ponds R85` with two material batches: opaque shaded water and basin/shoreline stone. Calling it again returns the existing controller. The optional fourth materials argument clones the existing stone material for the basin/liner. Wall UVs use metres along each edge and metres above the bed; basin-cap UVs use world X/Z. The source material and shared texture are never modified or disposed. A neutral fallback remains available for tests or callers without materials. This avoids an otherwise blank grey liner while keeping the same two batches and geometry. Its JSON-safe fields include `builtIds`, `ponds`, `materialBatches`, `shorelineSegments` and provenance; JSON serialization simply omits the `clipTerrain` method.

Root integration must return this controller to the viewer. The generic water loop must skip `officePonds.builtIds`. Call `clipTerrain` after the normal `terrainTriangles` generator and **before** building its BufferGeometry. It updates water/basin geometry and shoreline statistics; serialize its current dataset after that call if the final reconciled levels are needed. The same operation must run in offline exports before serializing the root and terrain.

## Geometry and ownership

Each initial level is 0.04m below the minimum sampled existing rendered shoreline (`terrainHeight -0.06m`). Shore sampling uses at most 0.5m spacing. The basin cap sits 0.35m below water; depth is inferred.

Sampler-only deformation is deliberately avoided: coarse DEM triangles can span narrow shore bends and poke through a level plane. Instead, `clipTerrain` subtracts the exact mapped pond triangles from existing rendered terrain triangles. Every retained vertex receives its height by barycentric interpolation on its original source triangle. Thus surrounding terrain retains its original piecewise planar surface, even where that differs from direct sampler evaluations.

The liner follows the actual retained mesh's shoreline edges down to the basin cap. Water levels can reconcile downward to remain at least 0.04m below the lowest actual mesh rim; repeat calls cannot progressively lower them. This closes the visible hole without a floating plane, sampler seam spikes, crossing terrain triangles or invented shoreline outside the polygon.

Broad-phase bounding boxes skip mountain triangles outside the two ponds. No terrain sampler, path sampler, walking height, collision record, office grade or bank mesh is changed. Clipping runs at construction time only. Repeated calls dispose replaced owned geometries and keep the same two meshes.

## Evidence

`node --test fushimi_inari/integrated-world/office-pond-surfaces.test.mjs` passes seven tests: independent level opaque planes; exact concave removed area and retained source-plane heights; coarse DEM liner seating; stable repeated clipping/building; both actual mapped polygons; absent/invalid context without substitutes or destructive mutation; metric wall UVs and cloned stone material without shared-texture disposal.

`outputs/r85-ponds/audit.mjs` runs actual full integration with the established DOM/canvas/image stubs, then uses the exact viewer adaptive terrain callback and final terrain sampler. It builds an isolated copy of the office, banks and pond controller for visual inspection. Actual results in `pond-audit.json`:

| Pond | Level, m | Actual rendered rim range, m | Maximum exposed liner, m |
| --- | --- | --- | --- |
| 626313848 | 45.091676 | 45.131676–45.885388 | 0.793712 |
| 626313851 | 45.916472 | 46.012028–47.078794 | 1.162322 |

These substantial liner heights reflect the coarse terrain's unresolved bank profile. They are reported explicitly and must not be presented as measured retaining walls or historical garden architecture. Further shoreline grading would need its own source-backed scope; this pass preserves existing outside grades.

The full terrain changed from 697,644 to 697,729 triangles, producing 49 shoreline segments. One local run took approximately 90ms for the clipping stage; this is an observation, not a performance guarantee. No frame-loop work is introduced.

Blender 5.2 EEVEE renders `pond-north-review.png` and `pond-south-review.png` were inspected. They show horizontal water, attached banks/liners and no protruding terrain. They verify isolated geometry using actual final terrain and exported normals, not browser lighting/material parity or surveyed historical exactness. Root's combined render and viewer water exclusion remain integration checks.

## Root integration verification

The viewer now clips its actual adaptive terrain through this module and excludes only its two built IDs from generic water. Audit metadata is refreshed after clipping. Root inspected combined office, moss-bank and pond renders from north, south, overhead and oblique cameras; the final shoreline render also imports the existing ishigaki stone color texture with the exported metric UVs. No new texture asset is introduced.

All 268 repository tests pass. Full-assembly clipping retains the finite geometry and approximate 95ms one-time cost observed in this run. No native browser walkthrough or FPS measurement was completed; the coarse-terrain bank heights above remain an explicit fidelity limitation. Existing unrelated README/social-preview work is preserved.
