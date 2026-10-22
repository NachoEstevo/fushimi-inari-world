# North precinct context R83

## Implemented source and limits

`precinct-north-context.mjs` upgrades **only way/305214358**, mapped 社務所 / Shrine Office. All concave exterior/inner-return positions come directly from `fushimi_inari/geography/features.json`. It does not place a new building in an empty rectangle or add a garden, pond, access route, religious function or imagined office extension.

Primary exterior references inspected:

- [Obayashi's completed shrine office project](https://www.obayashi.co.jp/works/detail/work_1443.html): completion December 2010; photograph shows dark sloping roofs, timber/plaster and multiple ornamental gables overlooking a garden. Locally inspected as `outputs/r83-context/office-obayashi.jpg`.
- [Mokuei supplier's completed office/offering-building sheet](https://www.mokuei.co.jp/down/public017.pdf): November 2010 completion data and timber/plaster/roof vocabulary. Local PDF and rendered page: `office-mokuei.pdf`, `office-mokuei.png`.
- [Kyoto Urban Greenery Association's 2015 office garden account](https://www.kyoto-ga.jp/greenery/kyononiwa/2015/09/post_12.html): identifies the remodelled complex and depicts its exterior; local `office-garden.jpg`.
- [Official precinct map](https://inari.jp/en/map/) and [official VR](https://inari.jp/vr/) were consulted for context. They do not provide surveyed office roof heights.

The module is **restrained footprint massing**, not an exact facade or roof reconstruction. Its continuous dark hipped roof is an explicit simplified substitute for the photographed multi-gable roof network. Eaves are inferred at 4.3m above a least-squares terrain grade; roof pitch is inferred 0.38. Actual stepped floors, internal structural ownership, ornament, glazing, private access and precise ridge placement remain unresolved. There is no invented readable sign or new interaction. Foundations follow actual final terrain in segments; no terrace or terrain sampler is changed.

The supplied Nippon image ([article](https://www.nippon.com/en/views/b03204/), [image](https://www.nippon.com/en/ncommon/contents/views/44939/44939.jpg)) was downloaded and inspected as `nippon-aerial.jpg`. It looks toward Romon from outside the approach and supports general grey roof vocabulary; it does **not** establish the office complex's exact individual roof geometry. The city historic aerial archive was not used as authority for current construction.

The contractor furniture-project image initially fetched from ts-create was actually a Romon photograph; it was rejected as office geometry evidence.

## Integration contract

```js
import {buildPrecinctNorthContext} from './precinct-north-context.mjs';
const northContext = buildPrecinctNorthContext(root, features, surfaces, legacy.materials, colliders);
```

Call after final terrain grades, before the existing static material batching. Add `northContext.builtIds.includes(b.id)` to `excludesBuilding` so the viewer's separate generic extrusion does not duplicate the office. The builder is idempotent and existing explicit `sourceFeature` ownership wins. It adds four material batches and bounded polygon-edge solid colliders; no broad bounding-box blocker seals its courtyard or exterior paths.

The footprint is roughly x -11.33..91.945, z -108.436..-48.658, extending beyond the requested inspection rectangle. Building its complete authoritative ring avoids cutting a real complex arbitrarily at the inspection boundary.

## Remaining concrete inventory

These nearby mapped buildings already receive **generic viewer extrusions** (`excluded:false` in r80), rather than being literally absent whenever the default surrounding-buildings layer is enabled. They are absent from older exports that serialized only `integration.root`; those exports should include the separate viewer context when judging vacancy.

| ID | Mapped label/type | Bounds x / z, m | R83 status |
| --- | --- | --- | --- |
| way/1263632487 | 社務所分室 | 47.099..59.15 / -48.647..-36.958 | Exact roof/facade attribution not established; retain generic context |
| way/305214361 | toilets | 38.214..44.143 / -48.836..-37.158 | Retain mapped generic context; no assumed entrance or sign |
| way/305214370 | unnamed | 27.477..37.639 / -44.995..-34.153 | Retain generic context pending attributable photo |
| way/305215286 | unnamed long complex | 22.113..36.535 / -76.232..-45.073 | Retain concave generic context; no inferred function |
| way/305214357 | unnamed | 14.806..27.586 / -52.576..-30.969 | Retain generic context pending roof reference |

Existing Gonden, Tamayama and four subsidiary-shrine-row owners remain untouched. No mapped boundary is replaced by this module.

## Verification

`node --test fushimi_inari/integrated-world/precinct-north-context.test.mjs`: seven tests pass, covering source identity/grounded solids, every roof triangle center inside the true concave footprint, every roof vertex matching the inferred pitched envelope, idempotency/source ownership and missing/invalid ground.

`outputs/r83-context/audit.mjs` runs the actual assembly with DOM/canvas/image stubs and builds an isolated copy using its real final surfaces, avoiding static-batching ownership loss. Actual result: one office ID built, four batches, 43 mapped boundary edges, 272 boundary collider sections including access lintels, 7,519 roof triangles. `context-audit.json` contains world geometry and provenance.

Blender 5.2 EEVEE previews `office-context-review.png` and `office-garden-review.png` were rendered; the office-context preview was inspected and corrected to remove an initially excessive flat roof plateau. These are geometry/material previews, not browser parity or a reconstruction acceptance claim. Root also inspected four combined assembly views (Gonden, office, overhead and north), then a final close view of the corrected mapped access. Geometry exports use texture stubs and omit the viewer's separate generic context layer; these do not prove browser appearance or native FPS. Native browser walkthrough and textured review remain unverified.

## Gonden offering-office court

The [approach photograph](https://fushimiinari-guide.com/wp-content/uploads/IMG_6999_20210312.jpg), inspected in the browser, shows a mineral court on both sides of the stone route, between the offering office and Gonden. R83 adds a conservative gravel overlay between the mapped offering-office eastern roof edge (way/105449708) and Gonden western roof edge, south of the existing broad staircase. This offering office is distinct from the large north-office context above.

The envelope is inferred, not surveyed. Final terrain permits 125.24 m² of the planned 125.26 m². Slopes above 35%, mapped buildings/water/paths and existing shrine collars are excluded. The authored sanctuary-path aprons are excluded at their full 3.6 m width. No terrain grade, walking height or existing staircase is modified. This is one additional surface mesh; existing material batching remains in place.

## Mapped terminal access correction

Actual assembly testing found footway `way/105449689` (mapped width 2m) terminates exactly at the office boundary vertex `[61.43, -50.506]`. The simplified solid facade initially blocked its final approximately 0.3m. The builder now preserves a visible and physical opening there, inferred solely to retain the mapped access. It does not assert a doorway type, public interior, name or function.

Boundary sections split at the opening margins. Wall panels, foundation strips, posts and low colliders are removed across the mapped corridor width plus 0.15m on each side; a small additional thickness allowance prevents rotated section ends intruding into that clear width. Only the overhead lintel remains, at least 2.3m above the existing walking surface. No new walkable interior floor or route is introduced.

## Roof surface continuity correction

Close rendering exposed dark triangular cracks and jagged shading from independently subdivided source triangles. Shared-edge T-junctions sampled different intermediate heights on the same nonlinear roof profile. The final roof uses one common metre grid clipped separately to the exact source polygon triangles, with degenerate fan faces excluded. The footprint and height function are unchanged; no duplicate roof layer is added. Roof geometry falls from 19,316 to 7,519 triangles.

Coincident vertices are welded at 1e-5 before computing shared smooth normals; later material batching preserves those normals. Regressions check identical normals at coincident positions, no duplicated faces, every internal edge shared by exactly two faces, and all unshared edges on the authoritative ring. Existing footprint, height-profile and access tests remain passing.

Updated isolated Blender renders carry the actual Three.js normal attribute through `normals_split_custom_set_from_vertices`; the original exporter omitted normals and therefore could not demonstrate the shading fix. Both `office-context-review.png` and close `office-access-review.png` were regenerated; the close image was inspected with the triangular cracks removed. Browser lighting parity remains a separate root check.

Seven module tests now pass. The added regression raycasts through the full 2.3m opening width at pedestrian height and checks solid colliders at the same positions, verifying visual and physical clearance together. `outputs/r83-context/check-paths.mjs` separately runs the actual full assembly, samples every mapped centerline at 0.1m intervals with a 0.24m pedestrian radius and 1.7m vertical envelope, and records findings in `office-collider-path-check.json`. After the correction, no office collision remains on any mapped centerline or sampled corridor margin.


## Final integration checks

The full repository suite passes 256 tests. Actual integrated geometry and collider numeric values are finite, the office's original generic extrusion is excluded, and the server responds HTTP 200. The four new office material batches and one mineral-surface mesh reuse the existing static batching pipeline; no additional animated system, dynamic light, remote runtime request or dependency is introduced. Native frame-time performance was not measured.
