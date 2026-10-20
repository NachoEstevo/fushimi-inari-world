# R25 - Senbon arrival, sanctuary sides and forest LOD

## Observations

User-supplied screenshots and the walking video https://www.youtube.com/watch?v=FmRyJ-RtBPg&t=614s show an open Okusha court, central stone paving, aggregate margins, a vermilion worship hall and dark timber counters. The paused 10:30 reverse view confirms a level apron opening directly from the twin torii tunnels. The 3:00 view shows planted margins and timber architecture around the upper precinct. Images were inspected; no personal photographs or video frames are redistributed.

Both mapped Senbon branches terminate at (250.274, 69.742), DEM height 62.394978 m. Okusha had independently sampled 66.377463 m, introducing a roughly 4 m artificial rise. The new inferred terrace shares the exit level. Its boundary blends into the surrounding DEM; this is not a surveyed height or surveyed platform polygon.

## Preserved and changed

Original source GLBs, master scene, textures and interactions are unchanged. Runtime Okusha orientation now faces the arrival; the rectangular roof and opaque blockout shell are replaced by a gable, roof planes, posts and rear/side timber walls. The original curtain, plaque, candle house, Omokaru stones and ema are retained. Ema racks and their colliders move to the court edge to free the arrival. The old retaining wall moves behind the hall.

Added two low-detail timber buildings on OSM footprints way/301527739 (gift shop) and way/301527730 (service/toilets). Counter vocabulary comes from the images, but exact window allocation, heights, roof profiles and furnishings remain inferred. This is still a simplified facade, not a finished replica.

Five mapped exterior path alignments receive wider paving aprons near Naihaiden/Honden. The upper terrace extends beyond the Honden side path. Gonden and Tamayama share the adjacent upper datum instead of separate DEM mounds. Original plinths are retained. Outer transitions beyond these approaches, especially toward the next higher precinct, still need reference-backed grading/stairs review.

## Forest and cost

Preserved cedar/maple crowns switch to 20-triangle bounds-matched crowns beyond 300 m, with hysteresis and seasonal tint. Extended detailed forest chunks stop drawing beyond their bounds plus 400 m, overlapping the aerial canopy. The far canopy has smooth lighting normals with unchanged geometry count. No asset or texture dependency was added.

At the same Overview plus two zoom increments, 1205 x 812 / DPR 1: R24 telemetry was 17,517,007 triangles / 3,062 calls. R25 final snapshot was 1,337,019 triangles / 444 calls, with 88 textures. Counts are view-specific, not a guaranteed FPS uplift or a low-end/mobile certification. Forest transitions can still be perceptible in flight.

## Validation

68 Node tests pass; new regressions verify shared tunnel/court levels, continuous terrace release, and coverage beyond Honden. Syntax and whitespace checks pass.

Native walking checks (camera XYZ metres, eye height included):
- First tunnel exit: (244.06,64.23,69.44) to (257.03,64.23,70.00).
- Second tunnel exit: (245.09,64.23,67.17) to (256.49,64.23,67.66).
- South approach: Naihaiden checkpoint via (36.35,44.21,7.52), (41.82,44.49,13.27) to (60.66,45.68,15.93).
- Final north approach: Honden (63.02,45.82,-13.04) to (62.53,45.82,-23.59).

Native screenshots reviewed for the arrival court, counters, north/south access and aerial cover. Browser logs contain earlier message-channel listener errors at 22:27; no new renderer/shader error appeared during final inspection. Not every mountain route or facade has been reviewed in this revision.
