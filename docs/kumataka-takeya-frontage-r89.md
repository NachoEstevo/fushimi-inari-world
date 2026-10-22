# Takeya frontage R89

## Verified owner and references

The shop is **existing mapped `way/301527736`**, explicitly named `竹屋` / Takeya, west of the public continuation beside Kumataka. Its complete ten-vertex concave building ring remains the geometry authority. It is not a new tea house or a southern memorial terrace.

Actual photographic pixels inspected:

- [P3600730, exterior passage](https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg): timber/glass shop to the left/west of the onward lane, broad shaded shop opening, counter frontage, timber eaves and Kumataka on the right/east.
- [P3600691, looking out](https://fushimiinari-guide.com/wp-content/uploads/P3600691_20190219.jpg): a substantial open front looks directly across the narrow paved passage toward Kumataka's torii and lantern. This rules out an entirely opaque front wall.
- [P3600721, entrance](https://fushimiinari-guide.com/wp-content/uploads/P3600721_20190219.jpg): dark divided noren with the two vertical characters `竹屋`; shimenawa/paper are visible behind it. The current component reproduces the name and cloth, not the rope or every fitting.
- [P3600714, counter](https://fushimiinari-guide.com/wp-content/uploads/P3600714_20190219.jpg): timber sales counter category. Merchandise, prices, packages, menus and furnishings are not reconstructed.

The [Takeya guide](https://fushimiinari-guide.com/takeya/) explicitly identifies the shop across from Kumataka and distinguishes sales frontage from its cafe space. The proprietor's site returned HTTP 403 during this pass; no inaccessible image was treated as inspected. A food hero image found elsewhere in research is not facade evidence. Filename dates are not verified EXIF dates or proof of current restoration state.

Together with the R88 registration, these views corroborate the **east-facing edge `[534.802,-131.435] → [540.923,-141.643]`**, source ring indices 4→5, length 11.9025 m. A 3 m opening is centered 6.8108 m along that edge by projecting the mapped Kumataka roof center. The opening width, bay positions and exact counter placement are inferred; the directional/photo registration does not measure them.

## Baseline and root integration contract

An actual full-assembly audit before wiring found `excludesBuilding(Takeya) === true`, caused by the existing Kumataka anchor-radius exclusion. Thus a generic shop extrusion was **already omitted**, rather than visibly present awaiting removal. No dedicated Takeya source-feature owner existed. This pass fills that missing mapped architecture; it does not claim to remove a rendered generic shop. The original audit remains in ignored `fushimi_inari/outputs/r89-takeya/audit-before.txt`.

`buildKumatakaTakeyaFrontage(root, features, surfaces, materials, colliders)` returns `builtIds: ['way/301527736']` only after committing the complete component. Root alone wires successful `builtIds` into generic exclusion. Missing footprint/pavilion identity, conflicting ownership, nonfinite datum or an unregistered frontage grade returns no built ID or partial geometry. Existing named ownership is idempotent.

## Geometry, grades and limits

The builder provides timber framing and lower panels, reflected opaque sliding-window glazing, a genuinely open central bay, short overhead eaves/rafters, divided dark noren and a bounded shallow counter/display recess. The observed vertical name uses one 1024×256 CanvasTexture on the existing cloth material, with correctly oriented per-panel UVs. It adds no material batch or downloaded asset and does not invent advertising text. The texture is approximately 1 MiB RGBA, about 1.33 MiB with mipmaps.

All seven resolved frontage ground/walk samples were **66.312874 m**. The shared floor/threshold datum is **66.357874 m**, a 45 mm visual rise, and the eave is **69.207874 m**. The 1.10 m threshold/recess stays inside the mapped footprint, with a bounded inner stop. No public dining-room route or unobserved interior inventory is declared. Arrival steps, adjoining paths, network heights and terrain remain unchanged. The builder declines a frontage whose sampled relief exceeds 0.18 m instead of flattening it or inventing a high step.

The **main roof skin preserves the exact full concave source ring and its 188.5 m² projected area**. The rear roof arrangement is unseen in the accepted facade photos: its shallow distance-to-edge hipped massing, roof heights and hip junctions are explicitly **inferred**, not a reproduced or surveyed Takeya roof. Smooth shared normals remove triangulation shading teeth without changing source positions. The short separate frontage eave projects 0.28 m overhead, retaining more than 2.5 m clearance over the resolved frontage; no support post or canopy is added across the public lane.

Side/rear perimeter walls close the mapped volume conservatively; no unseen door, ornamental gable or room is asserted. Foundations reach sampled terrain while glazing and eaves use a horizontal architectural datum. The Kumataka pavilion/pond, its inherited orientation, all nonconflicting memorial stones and the unresolved southern terrace boundary are retained. The Kumataka compound remains incomplete.

## Verification and review

Final component: **5,435 triangles, seven material batches and 22 colliders**. Main roof skin accounts for 2,413 triangles. Continuous perimeter blockers use one box per wall edge instead of one per foundation segment. There are no new dependencies, lights or animation loops.

Seven focused tests pass. They cover exact owner/ring/frontage and idempotence; roof projected area, upward winding, shared normals and finite/nondegenerate geometry; clear center and ±0.65 m player lanes on arrival/onward routes; unchanged walking samplers and bounded threshold; a ray-tested real opening with its inner stop; failed-build isolation; the observed two-character name sharing one cloth texture/batch; and exact transformed legacy-overlap cleanup with protected interactions and unrelated geometry retained. A clipped sliver that collapsed to identical Float32 vertices was identified numerically and removed after storage quantization; the test was not relaxed.

Full current integration supplies the surfaces used for independent component export, the actual production public-path geometry and terrain at the viewer's −0.06 m rendering offset. Blender 5.2 EEVEE front, near-J arrival perspective and rear views were inspected. Final previews are under `fushimi_inari/outputs/r89-takeya/`. The main roof's unseen massing remains deliberately conservative; the images do not establish historic roof fidelity. Offline Canvas drawing is stubbed, so native review is required for actual Japanese glyph rendering and font availability.

The **full final red and black torii visual bounds** were checked using complete instance/world matrices, not pillar radius alone. Fourteen torii parts overlap the coarse whole-shop AABB, which includes the concave outline's empty regions. Testing their eight-corner projected convex bounds with vertical intervals against every actual Takeya triangle, with 5 cm padding and gate voids conservatively included, found **zero contacts**. No Takeya-specific gate exclusion is needed by this audit. Details: ignored `gate-bounds-audit.json` and its reproducible audit script in the same output directory.


Native close review subsequently caught a real integration conflict that isolated component tests could not expose: the old illustrative repeated memorial rows penetrated the newly registered shop opening and glazing. The builder now identifies only the exact `buildKumatakashaAndPond()` row formulas, local positions and Box/Cone/Cylinder geometry signatures. It projects each actual transformed mesh to a convex footprint and requires positive area overlap with the triangulated mapped Takeya ring before removal. This is a verified building-owner conflict, not a fabricated outer memorial terrace boundary or a proximity/material sweep.

The actual full assembly removes **10 of 28 scripted steles**, zero-based indices **15, 18, 19, 21, 22, 23, 24, 25, 26, 27**, plus four associated fox meshes and four bib meshes: **18 meshes total**. Eighteen steles and six fox/bib pairs remain. Protected interaction objects, unmatched similar shapes, the pavilion and other stone owners are retained. The original repeated-row code registers no colliders, so no collider is removed by proximity; the pavilion collider remains. Every removed object's local position, world bounds and overlap area is recorded in builder metadata and ignored `legacy-overlap-audit.json`. A regression reproduces the actual geographic group transform and checks selective removal, owner preservation and idempotence. Fresh combined native review remains necessary after this fix.

Native walking/interaction acceptance, combined Kumataka orientation/last-metre composition, historical dimensions and hardware FPS are not established by these component checks. Root owns the final combined review and shared integration. This component owner made no shared integration/viewer edits or commits.
