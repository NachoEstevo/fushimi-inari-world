# R15 — path junctions, shoulders and stone finishes

## References inspected, 2026-10-20

- Google Maps / Mitsurugi Shrine, Shigeo Sawada, March 2022, panorama `CIHM0ogKEICAgICWw_fpwwE`: grey stone torii behind the vermilion gate, curved kasagi, stepped stone altars, mossy masonry and narrow paving. [Official location](https://inari.jp/en/map/spot_14/).
- Google Maps / Fushimi Inari Shrine Tower Gate, daisuke ogawa, May 2022, panorama `CIHM0ogKEICAgID28KDmNQ`; Takanori Kono, April 2024, panorama `CIHM0ogKEICAgICj1oLznAE`: paved approach, stone pedestal and lantern, planted lateral beds. [Maps location](https://www.google.com/maps/search/?api=1&query=Fushimi+Inari+Shrine+Tower+Gate).
- Existing OSM node IDs remain the source for junction connectivity. No curve or junction was invented from visual preference. The current polylines still need localized comparison with more panoramas; straightness is not certified.

## Changes

- Curb and handrail strips open where another mapped, shared-node path occupies the mouth at the same height. Projected crossings and different-height crossings stay separate.
- Mountain stone paths receive narrow irregular earth shoulders. Small embedded rocks and fern-like understory are instanced in 128 m cells, capped at 1,200 clumps each; placement is inferred and avoids mapped surfaces, building/water bounding boxes and shrine cores. These are generic fern forms, not a botanical survey.
- Fine warm-grey gravel replaces the overly dark shared gravel finish, including retained original forecourt geometry; the terrain uses the same material. Existing courtyard extent is unchanged, not a surveyed new boundary.
- The original Mitsurugi stone torii remains in place. Its previously straight top beam now curves gently, with a granite finish matching its columns. Dimensions and location remain inherited approximations. No extra gate was inserted into a walking route.
- Original source viewers and OSM/DEM files are untouched. New scenery is batched; no dependencies or additional live 3D instances.

## Validation and limits

- 52 Node tests pass, including shared-node T-junction, unconnected crossing and elevation separation regressions. Syntax and diff checks pass.
- Browser: inspected Romon forecourt and Mitsurugi route. Walked from (1202.98, 185.63, -171.90) to (1202.91, 185.82, -174.94) without blocking.
- One visible Romon sample: 74.9 FPS, 4,754 draw calls, 29.48 M triangles at 1205x812 DPR1. This is a single live sample, not a before/after benchmark; the existing scene remains expensive.
- Full precinct is not finished. The 52 pending height profiles, known Mitsurugi lateral-access collider, individual shrine layouts, lateral Romon buildings/planting and broad terrain transitions still require work. This revision does not certify their accuracy or resolve those defects.
