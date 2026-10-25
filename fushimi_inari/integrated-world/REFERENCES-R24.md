# R24 - Upper sanctuary transition and seasons

## Reference and scope

The supplied walking video, https://www.youtube.com/watch?v=FmRyJ-RtBPg&t=134s , was paused around 2:14 and 2:39 to compare the Naihaiden approach, broad granite flight, upper landing and lateral access. It supports the surface vocabulary and relative arrangement, not exact metric elevations. The original buildings, source GLBs, textures and master scene remain intact.

The original nine-riser flight supplies the 1.6 m rise. Naihaiden and Honden now share that upper datum relative to Romon rather than independently sampling the 10 m DEM. Added central and side landing slabs and retaining faces follow the existing building frame. This does not certify all mountain terraces or the other precinct buildings; their alignment and original facade details still need further comparison.

## Terrain

Fine 1 m cells and coarse 10 m cells now share all boundary vertices. Coarse neighbours use a transition fan, preventing unmatched edges beside nonlinear terrace grading. This adds triangles only at subdivision boundaries and no new terrain draw calls. A topology regression checks that every internal triangle edge has a matching neighbour.

## Seasonal interpretation

Spring and Autumn live in Esc > Environment > Season. The saved `inari-season` value is validated; unsupported values fall back to spring. Only the original maple foliage and lightweight distant crowns change pigment. Other original trees remain evergreen. Original leaf alpha and normal textures are retained.

Regional seasonal context: https://www.kyoto.travel/en/see-and-do/events.html . A secondary visitor guide describes scattered maple and flowering trees: https://www.osaka-escape.com/guides/fushimi-inari-guide/ . These references do not establish individual trees, species counts or flowering positions. The sparse pale spring crowns at lower elevations are explicitly interpretive. No whole-mountain cherry plantation is claimed.

The aerial forest uses seeded jitter, asymmetric scales, tilted crowns and multiscale value-noise patches instead of a periodic color pattern. The final scene reports 18,745 distant crowns / 374,900 triangles, with shared geometry/materials, spatial batches, no shadows or collisions. Switching season only updates instance colors; it does not create another forest or load textures.

## Validation

- 65 Node tests pass across geography and integrated-world modules, including grade endpoints, seasonal validation and adaptive mesh topology.
- Native browser: both seasons inspected at the same overview, selection changed through the menu, persistence verified after reload.
- Native walking: ascent from (37.28, 44.22, -1.48) to (43.51, 45.71, -1.06), then descent to (35.37, 44.22, -1.91), without falling through the central stairs. Coordinates are camera positions in scene metres, including eye height.
- Fine granite and connected stair foot inspected after final terrain replacement. No console errors in the final browser session.
- Aerial render telemetry at 1205 x 812, DPR 1: 3,062 calls, 17,517,007 triangles, 1,770 geometries, 95 textures. This remains a heavy legacy scene; these counters are not a cross-device performance guarantee. Season changes add no geometry. Mobile / low-end GPU and all lateral circulation corridors are not validated.

Historical screenshot `docs/images/autumn.png` is archived locally; current README photographs replace it. Local QA captures remain in `outputs/r24/` (not committed). No third-party video frames or personal visit photos are republished.
