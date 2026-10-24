# Shinsenjo north court R99 — guarded implementation

**Current assembled result: withheld (`built:false`).** Both original source-backed portions fail the approved numeric gates. The new owner is implemented and tested, but no new mineral mesh is admitted to the real scene by this packet. No integration/viewer, terrain, collision, walking or generic-building ownership was changed.

## API and insertion order

```js
import {
  planShinsenjoNorthCourtR99,
  buildShinsenjoNorthCourtR99,
} from './shinsenjo-north-court-r99.mjs';

// Optional read-only viability report; no mesh allocation or scene attachment.
const plan = planShinsenjoNorthCourtR99(root, features, surfaces, colliders, {
  terrainPositions: renderedTerrainPositions,
});

// Same planner gates, followed by one material-batched mesh only if viable.
const report = buildShinsenjoNorthCourtR99(
  root, features, surfaces, legacy.materials, colliders,
  {terrainPositions: renderedTerrainPositions},
);
```

Call **after** actual Mikoshiko R93, Shinkosui R96, Honden R95 tamagaki and the current named ground/paving owners exist, but **before static mesh batching erases those source geometry identities**. The builder explicitly refuses an empty/post-batch tamagaki owner. `builtIds` is always empty, even on success: this court never suppresses generic Shinsenjo305214596, replaces another building or activates the disabled R93 candidate. There is no terrain clipping callback because this is only a material skin over existing actual triangles.

Returns per-original-portion envelope, clipped polygons/area, coverage, actual terrain extrema, maximum slope, acceptance and refusal reason. Repeated successful calls return the same record. If neither whole portion passes, no material is cloned and no mesh is created or attached.

## Source and canonical extent

Sources are documented with actual inspected pixels and primary map registration in `shinsenjo-reference-registration-r99.md` and `outputs/r99-shinsenjo/`. The2016 [well/Shinsenjo firsthand account](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/) shows mineral/paved ground between the roofed well and Shinsenjo north frontage, and alongside Mikoshiko's western door bank. The [2021 court/elevator photograph](https://www.goriluckey.com/wp-content/uploads/IMG_5749_20210412.jpg) corroborates gray gravel and slab strips. Neither establishes surveyed court heights, full southern compound grade or a new public route.

The two intentionally conservative, **inferred** source envelopes derive from actual existing owners:

- North collar starts at the mapped well roof's east/south bounds, continues to Mikoshiko's mapped west bound and stops at the interpolated actual Shinsenjo north edge[62.744,22.064]→[82.047,21.674]. No rectangular mask extends through the compound.
- West Mikoshiko strip starts at the **actual R95 tamagaki geometry's eastern world bound plus .15m**, not Honden's roof bound; it ends at the minimum worldX of Mikoshiko R93's transformed outer west court edge. Its original longitudinal range is the mapped Mikoshiko roof bounds. No arbitrary truncation removes inconvenient terrain creases.

The geometry must remain available under exact named owner groups `Honden open tamagaki R95`, `Mikoshiko precinct R93` and `Shinkosui mapped roofed well R96`. Their world transforms and recorded local dimensions/court corners register cuts. Missing or changed source signatures refuse construction.

## Cuts, terrain and strict gates

Cuts preserve all mapped buildings/water, actual mapped path/junction footprints, existing3.6m sanctuary aprons, transformed tamagaki runs with clearance, the full existing Mikoshiko court, the actual inset well plinth, relevant current solid colliders, and named upward ground paving/mineral faces in the local height band. High roof/wall faces do not become broad bounding-box ground exclusions. Actual owner quads are split into their renderer fan triangles before subtraction: concave miter quads are never passed directly as convex cuts.

The planner intersects each surviving convex polygon with the **actual rendered terrain triangles**. Contact vertices include internal terrain creases and cut intersections; no regular grid resampling substitutes a coarse height function. Full covered area must match the clipped source area. Across each **entire original portion**, accepted limits are:

- relief≤.18m;
- maximum actual triangle-plane gradient≤.10;
- complete nonoverlapping coverage within numerical tolerance;
- at least1m² survives ownership cuts.

An arbitrary convex subtraction fragment is not treated as an independent physical patch. A steep fragment rejects its original portion as a whole. Only the two independently identified north/west source portions may differ in acceptance. The owner does not filter steep cells, raise tolerances, flatten terrain or accumulate tiny surviving scraps.

On a valid future scene, accepted positions lie12mm above the original rendered triangle planes; the clone of the existing gravel material uses polygon offset and1.5m metric UVs. World geometry is converted into the root's local frame before attachment. One draw/material batch, no texture/dependency/light, and no new terrain, walking sampler, floor, collider, door, route or building suppression. Existing source materials and geometries are preserved.

## Actual pre-batch viability evidence

Independent reviewer prepared the actual CPU assembly before static batching and ran this exact planner/builder. Evidence: `outputs/r99-review/actual-stage-a-module-probe.json` (reviewer-owned), compared with the initial `baseline-north-court-preflight.json`. No renderer or browser was used for this numeric probe.

| Original portion | Clipped area | Actual coverage | Relief | Max slope | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Well→north face |18.47426255m²|18.46941562m²|.48690755m|.31923415|Reject incomplete coverage; also independently fails relief/slope |
| West Mikoshiko |21.42039181m²|21.42039181m²|.06000000m|.12485544|Reject slope |

The actual pre-batch tamagaki eastern bound plus .15m is70.82894107193. The west portion's excessive gradient includes a narrow existing grade crease near Z20..20.015; dropping its triangles would violate whole-portion acceptance. The north portion additionally has a small.00484693m² coverage discrepancy. Full north construction would remain invalid even if that discrepancy were independently resolved, because its relief and slope already exceed the approved limits.

Actual result is `ready:false`, `built:false`, `builtIds:[]`; repeated planning is identical, scene children remain1541→1541 and features, colliders and height-function identities remain unchanged. No new mineral geometry is hidden in the rejected real portions. The successful synthetic-flat tests below establish implementation behavior, not current assembled feasibility.

## Tests and remaining decision

Six focused tests cover actual mapped extent derivation with registered owner fixtures, pure planning/idempotence, input/source/material/height-function preservation, exact ownership exclusions and metric UVs, an internal terrain spike that rejects a whole portion, low-relief but excessive-gradient rejection, missing owner, incomplete/duplicate coverage, all-portions-fail nonmutation, actual named paving/collider cuts, and explicit post-batch empty-owner refusal. Nine adjacent Mikoshiko/well tests also pass: **15 tests total**. Final diff reviewed.

The next step is an explicit source/ownership replan, not integration of a claimed visual success. A new longitudinal limit or naturally disconnected component may be considered only with a recorded physical boundary and independent evidence; arbitrary clipping at Z19.9/20 or relaxed gates is not included. Shared grade correction requires its own approved source contract. The full Shinsenjo building remains withheld, with its southern/eastern grade and floor unresolved.

Only `shinsenjo-north-court-r99.mjs`, its test and this implementation document were authored. No commit, renderer/browser work or shared integration change.

## Explicitly authorized replan: correct adaptive tessellation ownership

The follow-up investigation identifies a **rendered triangle resolution error**, not a measured slope or an incorrect Mikoshiko floor. Evidence is `outputs/r99-shinsenjo/west-crease-actual.json`, `tessellation-replan.json` and the decisive full-pipeline `full-stitch-replan.json`. Harness scripts and logs are beside those records. These experiments regenerate arrays in memory only; no production terrain, integration or owner module was edited.

At X72, the existing `surfaces.terrainHeight` is exactly43.982249 from Z19 through Z22, including Z20.015. `surfaces.height` has the same value, and `surfaces.sample` returns null: no mapped road or new route occupies this witness. The rendered terrain contract subtracts .06m, giving43.922249. The west source envelope ends at mapped Mikoshiko Z20.015; its existing apron west edge ends at[72.893174469,20.040906756]. Neither physical owner ends at an arbitrary Z19.9 truncation.

`integratedTerrainTriangles` selects detail by anchor proximity or mountain-corridor proximity **at cell centres**. The cell X70..80/Z20..30 is not selected, despite the registered court reaching15mm across its northern boundary. Existing `terrainTriangles` correctly stitches its northern edge to the detailed neighbor, but the coarse fan joins those flat edge vertices to centre[75,44.546526202,25]. In particular triangles centre→[73,43.922249,20]→[72,43.922249,20] and centre→[72,43.922249,20]→[71,43.922249,20] have gradient.1248554404. Their interpolation artificially rises immediately inside the last15mm of the west envelope while the unchanged sampler remains flat. This is an adaptive resolution selection omission; the stitch algorithm itself is continuous.

### Tested correction and scope

The read-only full-pipeline candidate reuses **the existing `terrainTriangles` implementation and existing detail predicate**, adding exactly the cell whose lower-left is[70,20]. Every terrain vertex uses **the unchanged `surfaces.terrainHeight(x,z)-.06`**, including the hillslope farther south. There is no replacement plane, altered sampler, new datum, building lift or cropped source court. Existing neighbor stitching runs normally; the earlier direct cell-replacement experiment is diagnostic only and must not be copied into production because it would not stitch neighboring coarse edges.

Full-pipeline result:

| Check | Result |
| --- | --- |
| Original west envelope and cuts | unchanged |
| West area/covered area |21.4203918086/21.4203918086m² |
| West relief/max gradient |.0600000000/.0543087478 — passes original .18/.10 gates |
| North relief/max gradient |.1860787317/.1292139270 — still rejected, plus original coverage discrepancy |
| Whole-world triangle count |697644→697862, +218 |
| Locally checked internal edges |903; zero unmatched edges |
| Changed triangle count |18 removed,236 added |
| Changed projected area |325m² before and after |
| Actual changed bounds |X65..90, Z20..40 |
| Changes outside conservative guard X60..90/Z10..40 |zero triangles |

The extra325m² scope includes the100m² detailed cell and adjacent coarse fan re-stitching. **It is not accurate to say rendered terrain outside the21.42m² mineral strip stays identical.** Geometry outside the declared stitch influence stays identical, and the underlying height functions stay identical everywhere. Re-triangulation changes interpolation inside the bounded patch, including its neighboring fan triangles; this is the explicit visual footprint requiring root review. The current experiment changes no scene object and calls no builder on the refined candidate, so the real scene remains unmodified.

### Concrete implementation contract for root

1. Root owns the shared `terrain-triangles.mjs` change. Add a narrowly bounded optional detail-cell input to `integratedTerrainTriangles` (fifth argument), default empty, combined with its current predicate. Keep `terrainTriangles`, its interpolation callback and -.06 offset unchanged. Use terrain's own grid coordinates; refuse a requested cell not aligned to `xmin/zmin/step` rather than approximate it.
2. Activate `[70,20]` only with registered Shinsenjo305214596, well305214828 and Mikoshiko1287564336 footprints matching the R99 source coordinates; derive the cell from the west envelope's Z20.015 crossing and the terrain grid. This cell request owns resolution only. It must not change any feature, level, path profile, collider or generic-building ID. Root may keep the request in an explicit R99 helper rather than make terrain code understand building names.
3. Compute the actual rendered array once through that normal pipeline. After real R93/R95/R96 owners exist, call the unchanged R99 planner/builder before static batching. Require the original whole-west .18/.10/full-coverage gates. Admit **west only** on current evidence. Keep north withheld and `builtIds:[]`; this does not solve or enable the full Shinsenjo building.
4. Regression gates: unchanged original detail behavior when no extra cells; exact vertex/surface agreement with sampler-.06; closed internal edges through every affected neighbor; symmetric triangle difference restricted to the recorded bounds; unchanged route height function identity and numeric samples on751194636/1297255919/751194635/751194637/1106589423; unchanged building, well, tamagaki and Mikoshiko geometry/colliders. Reject construction if current actual extents or gates differ.
5. Root then performs its serialized visual review of the21.42m² mineral strip, its15mm boundary contact and the bounded surrounding interpolation changes. No native appearance, reflected material, texture fidelity or route visual result is claimed by these CPU probes.

Existing inspected2016 well/Mikoshiko photographs supply the mineral-court vocabulary and owner adjacency; they do not supply elevations. This correction is justified by actual code/sampler/triangle inconsistency, not a fabricated photographic height measurement. The registered retaining wall/elevator/bridge remains an independent later packet requiring vertical evidence. No new public path, southern enclosure or unobserved patio is included.

### Authorized implementation of the resolution contract

Root subsequently authorized the shared terrain-resolution change. The implemented API is now:

```js
import {shinsenjoNorthCourtTerrainDetailR99,
        buildShinsenjoNorthCourtR99} from './shinsenjo-north-court-r99.mjs';
const renderedTerrainPositions = integratedTerrainTriangles(
  terrain, anchors, pathDistance, surfaces.terrainHeight,
  {detailBounds: shinsenjoNorthCourtTerrainDetailR99(features)},
);
// After the actual R93/R95/R96 owners exist, before static batching:
const northCourtR99 = buildShinsenjoNorthCourtR99(
  root, features, surfaces, legacy.materials, colliders,
  {terrainPositions: renderedTerrainPositions},
);
```

The fifth argument defaults to empty and leaves old behavior identical. Bounds are finite ordered `[minX,maxX,minZ,maxZ]`; intersected cells use the existing detailed1m tessellation and automatic neighbor stitches. The helper requires all three mapped owners and derives the transformed **existing Mikoshiko R93 west court** from `mikoshikoLayout`, including its existing1.05m court width. No cell X/Z is hardcoded. This resolves the pre-terrain/architecture construction order without making terrain code interpret shrine identities. It replaces the proposed optional aligned-cell input in the numbered research contract above; arbitrary court bounds are registered in world space and cell alignment is derived by the terrain's grid itself.

The strict planner and builder acceptance logic is unchanged: a successful west original portion does not admit north or the complete Shinsenjo. The whole west strip passes independently; arbitrary clipped fragments remain ineligible as separate acceptance units. `builtIds:[]`, source owners, walking functions, sampler values and colliders retain their existing contract. Root owns integration and final rendered terrain use; this agent did not edit integration/viewer.

The implementation adds a ninth focused terrain/owner test: default behavior equality, bounds validity, exact sampler-.06 values, all internal stitched edges, exterior topology guard and registered helper fail-closed behavior. Alongside the nine adjacent well/Mikoshiko tests,18 tests pass. The original fail-closed assembled result earlier in this document records the unrefined baseline; the refined acceptance is conditional on the API above being used, and is not a claim that production integration or native visual review has happened.
