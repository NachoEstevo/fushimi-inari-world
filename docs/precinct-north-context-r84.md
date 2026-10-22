# Office garden frontage refinement R84

R84 refines the same mapped office owner `way/305214358`; its complete main roof ring, conforming tessellation, roof-height formula, source ownership, 272 colliders and mapped terminal access opening remain unchanged.

## Photographic attribution

The following local source pixels were inspected again:

- `outputs/r83-context/office-obayashi.jpg`: [Obayashi completed office project](https://www.obayashi.co.jp/works/detail/work_1443.html), showing muted green-grey lower glazing, dark timber posts/sills, pale upper panels and a shallow continuous lower roof overlooking the garden.
- `outputs/r83-context/office-garden.jpg`: [Kyoto Urban Greenery Association garden account](https://www.kyoto-ga.jp/greenery/kyononiwa/2015/09/post_12.html), showing the same architectural language beside the water.
- `outputs/r83-context/office-mokuei.png`: [Mokuei completed timber-work sheet](https://www.mokuei.co.jp/down/public017.pdf), supporting plaster/timber panel rhythm and lower roof/eave treatment. The offering-office counter photographs are not applied indiscriminately to the large office.

Facade placement is attributed using the mapped office boundaries immediately beside its two mapped garden ponds:

| Office ring edge endpoints x,z | Mapped pond | Inferred bays |
| --- | --- | --- |
| 70.270,-108.436 → 70.699,-90.759 | way/626313848 | 9 |
| 67.360,-90.670 → 67.926,-67.293 | way/626313851 | 12 |

This is a geospatial/photographic attribution of the garden-facing side, not a surveyed match of every photographed window to its position. The exact count and dimensions remain inferred. Other office frontages receive no new glazing, door or functional claim. If either pond feature is missing, its frontage detail is omitted.

## Changes

The two selected frontages receive opaque muted green-grey glass panels, dark lower timber panels, narrow mullions, sills and upper horizontal framing around the retained pale plaster band. Generic posts at 1.5m intervals are replaced only on these frontages by the approximately 1.9m inferred bay rhythm. Each complete frontage shares one horizontal datum sampled at its mapped edge center; windows, sills, rails, posts and lower eaves stay level instead of stepping at every bay. Foundations continue to follow terrain.

Lower glass height is inferred at 1.95m. The shallow lower eave depth is 0.44m, with a maximum approximately 0.40m projection beyond the mapped facade plane. These small photographed eaves are facade details; the exact main roof footprint and structural/collision envelope remain unchanged. They are overhead at approximately datum +2.92m and add no walk surface or low obstruction. Garden-bank planting should respect this projection near the facade.

Glazing is opaque: no room layout, interior view, operable opening, furnishing, readable inscription or new interaction is invented. No ornamental roof gables or stepped storeys are reconstructed in this pass.

The complete office has six material batches: retained plaster, timber, stone and main roof, plus glazing and shallow eave roof. Existing static batching can merge these normally. No new dependency is introduced.

## Verification

`node --test fushimi_inari/integrated-world/precinct-north-context.test.mjs` passes **10 tests**. Added regressions confine every glazing vertex to the two attributed frontage planes, require the six-batch limit, verify opaque glazing and omit that detail without its mapped pond. A further regression checks the common window/eave level across every bay of each frontage. Existing main-roof footprint/height, coincident normal, watertight topology, ownership and visible/physical access-opening regressions remain passing.

`outputs/r84-context/audit.mjs` runs actual integration with existing DOM/canvas/image stubs, then exports an isolated same-source office against the final real terrain. `context-audit.json` records both frontages and their exact generated geometry. Blender 5.2 EEVEE renders use actual exported custom normals.

Both `garden-facade-review.png` and `garden-wing-review.png` were inspected: the lower glazing, timber rhythm and pale upper band are visible; the corrected main roof remains free of triangular cracks. This verifies the isolated facade geometry/material treatment, not browser texture parity, exact historical facade dimensions or the root's combined bank/pond composition.

## Mapped garden banks and final integration

`office-garden-banks.mjs` adds 103.02 m² of narrow moss margins along the two existing mapped pond outlines, plus 11 low bank stones. The 0.8 m margin and individual stone positions are inferred from the garden photographs, not surveyed. Rounded joins close gaps between shoreline segments. Water, mapped roofs and walking corridors are subtracted, steep banks rejected, and stone footprints checked for supported ground. The bank geometry uses two meshes/materials, no additional lights or animations and no new dependencies.

No new pond or island is invented. Existing viewer water rendering is unchanged: its terrain-relative level and full shoreline appearance still require a native browser review. The offline review exports architecture and bank geometry, not the full textured garden or animated water. This stage does not claim that the garden is complete or an exact replica.

All 261 repository tests pass. Actual integration reports finite bank geometry and retains existing walking samplers. Root reviewed the final horizontal facade render and combined architecture/bank views. Browser walkthrough, full textured composition and native FPS remain unverified. Existing unrelated README/social-preview work is preserved.
