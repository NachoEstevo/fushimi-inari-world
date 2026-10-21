# R50 — North courtyard planting reference

Research date: 2026-10-21. Research only; no scene geometry changed.

## Visually confirmed placement

Google Street View panorama `Hxe6vNFETmV1ZbnXg6QiPQ`, June 2012, facing approximately 46 degrees, provides a clear contextual view:

https://www.google.com/maps/@?api=1&map_action=pano&pano=Hxe6vNFETmV1ZbnXg6QiPQ&heading=46&pitch=0

Local review capture (ignored, not redistributed): `fushimi_inari/outputs/r50/planter-context.png`.

- A curved stone-edged planted island stands in front of the red hall, between the northern timber shop frontage and the stair flight to the right of the hall.
- The foreground stone-paved crossing passes in front of the island. The island sits within the surrounding dark granular courtyard surface, not in the middle of that paved route.
- Its edge consists of short pale vertical stone segments with a narrow cap. The image establishes a rounded footprint, but perspective alone does not establish a circle versus an oval.
- Low clipped shrubs occupy the island. A taller tree has drooping branches and visible supports. Species is not established.
- A substantial stone lantern is on the left side of the planting in this view. A white temporary/event sign obscures part of its lower section.
- A separate timber-framed noticeboard stands to the left of the island, outside its border.
- The red building's shallow front steps and the higher stair flight to its right must remain distinct, with circulation around the planting unobstructed.
- No fountain is visible in this island.

The historical imagery selector exposed only June 2012 at this panorama. Present-day persistence and dimensions are not independently confirmed. Do not treat the map-center coordinates in the browser URL as surveyed object coordinates.

## Other sources checked

- Official precinct map: https://inari.jp/trip/map01/ — useful for named building relationships, not a measured planting plan.
- Photographic precinct account: https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/ — search index mentions a tree, stone lantern and poem stone. Full page timed out during this pass; no asserted match to this island.
- Stone-lantern inventory: https://kawai24.sakura.ne.jp/kyou-husimiinari-isidourou.html — describes a 221 cm historical lantern to the right of the main sanctuary. Identity with this island lantern is unproven; do not reuse its measurements here.
- Kyoto greenery association: https://www.kyoto-ga.jp/greenery/kyononiwa/2015/09/post_12.html — describes the shrine office garden, a different setting. Do not import its pond or garden layout into the public court.
- User walking tours remain comparison candidates: https://www.youtube.com/watch?v=FmRyJ-RtBPg and https://www.youtube.com/watch?v=zFKeYi0AK0M. No new video frame was verified in R50; the first video's web fetch was throttled.

## Reconstruction constraints

The relative location and component list are now observed, not invented. Before committing geometry, match the red hall frontage and adjacent stair to the existing scene footprint, then estimate the island bounds from at least two viewpoints. Record those bounds as an estimate, not a survey. Preserve the paved crossing, shop access and stair approach. Avoid assigning a tree species, exact diameter or permanent sign text without additional evidence.

## R51 implementation

The estimated island is anchored to mapped reception footprint `way/105449708`, shop `way/305214356` and stair `way/1106589424`. Center approximately `[18.2,-21.60]` in scene X/Z; ellipse radii 2.5/2.1 m. These are reconstruction estimates from the contextual and closer views, not surveyed dimensions. Low segmented curb, clipped hedge, supported drooping tree and stone lantern are included. The historical event sign is omitted because its text and current presence are unverified.

Three placement tests cover relative position, clearance from four mapped routes and missing-source behavior. Full suite: 107 passing tests. Browser inspection identified overly sparse square foliage; rounded leaf geometry and a continuous clipped hedge core replace it. Geometry is merged by material and foliage instanced; no new dependencies or lights. Hardware performance was not benchmarked.

Known adjacent mismatch: the existing reception facade and roof still do not match the red hall in the photograph. The existing large conifers and terrain beyond the northern frontage also need a separate evidence-backed pass. This planting addition does not certify the whole courtyard as an exact replica.
