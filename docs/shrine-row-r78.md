# Mapped subsidiary shrine row R78

## Sources and ownership

Inspected `outputs/r77/streetview-landing.png` (June 2012 supplied Street View), `video-0605.png`, `video-0615.png`, and `video-0625.png`. The landing reference establishes red-white subsidiary architecture with dark pitched roofs on a raised terrace. Video establishes local roof, frame, stone step and dark timber vocabulary; it does not survey this entire row. The user's requested three red-white plus one dark composition is a finish inference, not newly discovered documentary attribution.

Exact positions, separate footprints, unequal spacing, and row orientation come from `geography/features.json`:

| OSM ID | Mapped name | Roof width x depth, m | Actual assembled floor, m |
| --- | --- | --- | --- |
| way/305214367 | 末社 荷田舎 | 2.194 x 1.677 | 48.388 |
| way/305214360 | unnamed | 1.737 x 1.465 | 48.716 |
| way/305214365 | unnamed | 2.386 x 1.365 | 48.985 |
| way/305214364 | 両宮社 | 2.406 x 1.387 | 49.261 |

The smallest unnamed footprint receives the dark timber finish as an explicit conservative visual inference. No new religious name, dedication, historical claim, ornamental inscription, sculpture, or bell interaction is invented. Roof height (3.31m red-white, 2.66m timber), body/plinth reductions, lattice spacing, and shallow steps are inferred. Roof dimensions are inset 3cm from their mapped oriented bounds; no architectural vertex projects beyond those bounds.

Existing `north-court-buildings.mjs` owns different IDs (305214375/356/355), so remains untouched. Legacy auxiliary pavilion groups carry no source IDs and represent combined named shrines at different compressed locations; this builder does not suppress them heuristically. Existing groups explicitly claiming one of these source IDs win and are skipped. The generic viewer footprint extrusion is a separate owner and must exclude built IDs.

## Integration

Import `buildNearPrecinctShrineRow` and `nearPrecinctShrineRowIds` from `near-precinct-shrine-row.mjs`. After final surface grading, call:

```js
const shrineRow = buildNearPrecinctShrineRow(root, features, surfaces, legacy.materials, colliders);
```

Add `shrineRow.builtIds.includes(b.id)` to the viewer `excludesBuilding` predicate; prefer returned IDs so a skipped/absent footprint still receives its existing generic context. The exported complete ID list is available for diagnostics. Store the returned JSON-safe records for assembly evidence. The builder registers two bounded solid colliders per pavilion and is idempotent.

No rear white wall, public terrace, retaining staircase, red enclosure, trees, or drain is owned here. The enclosure/terrain owners can connect to the exact rear footprint bounds without competing geometry. Bodies/front steps stay within the existing roof footprint and face approximately world +Z toward the landing. Corrected roof ridges run front-back along local Z; curved transverse pitches present a prominent white/red front gable, as in the landing reference. Short recessed fascia pieces track that curved profile without piercing it.

## Verification and limits

`node --test fushimi_inari/integrated-world/near-precinct-shrine-row.test.mjs` passes 6 tests: mapped identities/proportions; finite geometry constrained to roof bounds; solid collider alignment and idempotency; absent/existing owners; invalid or unresolved terrain protection; front-back ridge and high frame vertices below the curved roof.

`outputs/r78-row/audit.mjs` runs actual full integration with the established DOM/canvas/image stubs, then reconstructs the same row against those final real surfaces in an isolated export root. This avoids losing row meshes into integration material batching. Actual assembly built all four IDs, no skips, 26 material batches. `row-audit.json` records floors and exported geometry. Blender 5.2 EEVEE rendered front and rear views via `render.py`; both images were inspected. Filename `row-rear-review.png` shows the front (+Z side); `row-front-review.png` shows the rear because Blender flips world Z into negative Y. These labels are retained to keep the evidence reproducible.

The renders verify isolated geometric form, separation and material colors, not browser texture/shader parity or integration with the final enclosure, drainage and staircase. Texture images are stubbed in offline assembly. The scene's full assembled row/corridor clearance and public walking route still require root's combined render/browser review. Historical exactness and the unnamed buildings' function remain unverified.
