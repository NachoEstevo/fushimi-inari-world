# Tamayama Inari and Okumiya — R68

This pass concentrates on the two shrines near the beginning of the climb and their existing access paths. It builds on main `140adeb2ee5a3947e252ea61207c66eedf899ff9`, including the R65 Okumiya facade and R66 western access. It does not regenerate the legacy builders or replace geographic source data.

## Tamayama Inari

`way/305214602` retains its geographic anchor and original interactive body. The facade now faces west, towards the mapped prayer approach. Its former local rotation left the building oblique to that approach.

The reconstruction adds the curved karahafu canopy, dark fascia, red ribs, pale tympanum, green diagonal lattice, lower black-and-white lattice, open slat fences with grey coping, four stone lanterns and two red timber lanterns. The rope has two pairs of folded paper strips. The original plaque texture and interaction callback remain attached to their original meshes.

The existing apron keeps its mesh, material and elevation, but its width changes from 5.6 m to 3.7 m. This follows the photographed platform between the front posts and removes its overlap with the neighbouring mapped shrine `way/1268143670`. The lanterns stand on separate pedestals.

The old 4.8 × 4.4 m collision envelope blocked the end of public footway `way/1133053715`. It is replaced with 24 bounded solids for the actual body, posts, offering box, fences and lanterns. They use the same world transform as the rendered building. The closed body remains solid while the approach and gaps between objects are accessible.

The rear roof keeps the inherited 4.8 × 4.4 m envelope. Its relationship to adjacent building `way/305214601` is not confirmed, so that building is not moved, suppressed or reinterpreted.

## Okumiya

The original pavilion, interaction, stone podium and horizontal roof envelope are retained. Photo-supported changes include:

- Square front posts, three dark lattice bays and inclined wooden guards.
- The original lower koshi texture restricted to the front. The previous mesh incorrectly wrapped it around all four walls.
- White side and rear panels with vermilion framing and small side vents.
- A raised decorative veranda, supports and a U-shaped perimeter railing.
- Three hexagonal hanging lanterns with crowns, skirts and suspension fittings.
- Two simplified white bracket reliefs following the photographed head, trunk and tusk silhouettes.
- Continuous fascia sections, a red soffit and rafters following the roof curve.

The geometric roof crest rises from local Y 4.42 m to 5.0176 m, while both eave levels and the 7.8 × 6.2 m plan remain unchanged. The roof material keeps its existing bark maps, with metric UV repeats and a lower normal-map intensity applied only to this roof. This removes the giant plank-like texture scale left by R65's replacement geometry.

The veranda floor at local Y 1.61 m and the additional roof rise are **photo-inferred proportions**, not measured dimensions. The veranda is decorative, inside the existing solid envelope; it does not create a new public walking surface. Painted ornament, fine engraving and detailed sculptural carving remain incomplete.

## Access continuity and navigation

Two broad landings overlapped their narrower branches at different heights. Nearest-centreline sampling could therefore switch abruptly from one plane to another. The new module clips the overlapping strips and creates local triangulated transitions. Rendering and walking query the same triangles; the existing terrain support is kept below them.

| Reviewed location | Before | R68 |
| --- | ---: | ---: |
| Tamayama approach blockage at the end of `1133053715` | About 0.955 m of collision displacement | No displacement on the tested approach lanes |
| Tamayama landing `1133055112` | Maximum 0.373929 m height change per 7 cm sample | 0.038485 m |
| Okumiya landing `1392716577` | Maximum 0.346215 m height change per 7 cm sample | 0.024912 m |

These are sampled model measurements, not measurements of the real site. The remaining small increments include the existing sloping profiles. The original stair levels, tread counts, widths and mapped coordinates are retained. The Tamayama side stair's tread is explicitly reserved rather than covered by the broader landing.

Only 13 path segments are marked. Their 801 triangles replace 26 original paving triangles; the patch uses existing material batches and adds no colliders. Unmarked routes retain the old path rendering and sampling behavior.

Both shrines now have reviewed exterior checkpoints, with camera targets facing the buildings. Checkpoint Y comes from the assembled walkable surface, and the orbit visit respects that Y:

| Place | Checkpoint X / Z | Reviewed walking Y |
| --- | --- | ---: |
| Tamayama Inari | 100 / −33.979 | 50.218651 m |
| Okumiya | 118.4 / −15.941 | 53.173063 m |

The integration exposes `inventory.nearPrecinct` and corresponding body datasets for inspection. Cache versions of the entry page, viewer, integration, path surfaces, path meshes and shrine facade are advanced together to `68-near-precinct`.

## References and confidence

The visible architecture was compared with the following sources, accessed on 21 October 2026:

1. [Tamayama photograph by Jakub Hałun, 14 July 2010, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:20100714_Kyoto_Fushimi_Inari_1728.jpg). Frontal canopy, fences, lantern arrangement, lattice and approach platform.
2. [Tamayama photograph by zubotty, Pakutaso 81556, published 25 April 2025](https://www.pakutaso.com/20250410115post-42559.html). The visible photograph was inspected in the browser. It corroborates the canopy profile, green lattice, rope and folded paper; the offering furniture differs from 2010.
3. [Okumiya photographic guide](https://fushimiinari-guide.com/okumiya/), including its front, side, rear, lantern and bracket photographs. The photographed shrine sign also describes the three-bay nagare construction and bark roofing.
4. [Official Fushimi Inari virtual experience](https://inari.jp/vr/), including its official description of Okumiya. The linked Matterport entrance model and floor plan were inspected for site context, not used as a source of measured dimensions.
5. The supplied Google Street View panorama `MvihcVb0f466FBJebqyECg`, June 2012, at approximately 34.9674832, 135.7737795, for the western Tamayama approach and court context. Existing R66 provenance is recorded in [tamayama-access-r66.md](tamayama-access-r66.md).

The cultural-heritage portal record linked in the component's provenance was unavailable during the final review because the portal redirected to a maintenance notice. No new dimensions are attributed to that record. External photographs were used for visual reference; none were added as application assets.

## Runtime cost and asset reuse

| Component | Main baseline triangles | R68 triangles | R68 local meshes |
| --- | ---: | ---: | ---: |
| Tamayama | 120 | 10,888 | 13 |
| Okumiya, including the R65 refinement | 9,420 | 14,496 | 17 |

Tamayama's added geometry is merged into 10 material batches; Okumiya's added detail uses 7. The normal integration batching pass still runs afterwards. These are component counts, not measured draw calls for a camera view.

The pass reuses the existing bark, red timber, lattice, plaque, stone and paper materials/maps and the shared stone-lantern and folded-paper helpers. It introduces no texture downloads, lights, animation loops or work per frame. No FPS result is claimed from geometry counts.

## Validation

- **182 individual tests passed across 53 executable test files**, including 15 new shrine/access regressions.
- One existing file, `first-torii-alignment.test.mjs`, could not start because the large original `geography/sources/osm.json` is absent from this local checkout. Its source and test were not changed to hide that limitation.
- The new regressions cover source identity and callbacks, retained texture maps, idempotence, finite nondegenerate geometry, roof/soffit contact, collision clearance, neighbour separation, shared render/walking heights, clipping and isolation of unrelated routes.
- The full-assembly access audit finds no collision displacement along the Tamayama prayer approach or its narrowed apron. The apron remains a real approximately 0.105 m step. Across 4,628 intersections between the corrected pavement triangles and the adaptive terrain triangles, none are buried; the smallest reviewed clearance is approximately 0.0113 m. The central dividing stair rail remains intentionally solid, with clear walking lanes on either side.
- The complete production integration and path-mesh builders also run in a CPU audit with finite geometry and clear exterior checkpoints. That audit deliberately omits the four unchanged large main-building GLBs and retains the original reception attendant instead of its textured GLB upgrade. Canvas drawing is stubbed. This checks integration and geometry, not the missing assets or browser rendering.
- Component previews use EGL software rendering of the production geometry. Okumiya includes the production colour maps; Tamayama uses approximate diffuse materials, so its retained plaque appears blank only in the preview.
- A complete browser walkthrough and hardware FPS measurement remain unverified in this environment. The connected browser cannot reach the local development files, and the full scene's large GLBs are not available in this checkout.

### Review images

[Tamayama frontal geometry review — archived](repository-archive.md#historical-review-evidence) (`review-r68/tamayama-front.png`)

[Okumiya pedestrian approach geometry review — archived](repository-archive.md#historical-review-evidence) (`review-r68/okumiya-approach.png`)

Additional views: [Tamayama oblique — archived](repository-archive.md#historical-review-evidence) (`review-r68/tamayama-oblique.png`), [Okumiya rear — archived](repository-archive.md#historical-review-evidence) (`review-r68/okumiya-rear.png`).

Detailed numeric results and limitations: [validation.json — archived](repository-archive.md#historical-review-evidence) (`review-r68/validation.json`).
