# Connected lower court and aerial context — R23

## References inspected

- [Google Maps satellite, Inariyama at zoom 16](https://www.google.com/maps/@34.9677,135.7815,16z/data=!3m1!1e3): continuous eastern woodland, densely built western neighbourhoods and clearings around compounds.
- [Google Maps satellite, lower precinct at zoom 18](https://www.google.com/maps/@34.9672,135.7738,18z/data=!3m1!1e3): roofs, circulation between buildings and separation of the urban edge from the forest.
- [Attractions Atlas walking video, paused at 01:48](https://www.youtube.com/watch?v=FmRyJ-RtBPg&t=108s): Gehaiden rail, podium and surrounding paved court. Earlier user photographs and R20–22 observations remain applicable.

Satellite imagery is a visual reference only; no Google image tiles were copied into the scene. Buildings use the existing OSM footprint dataset. Heights without metadata and distant roof forms are estimates. Woodland placement and its western edge are inferred from the satellite view, not surveyed tree positions or the legal estate boundary. An attempt to obtain additional OSM woodland polygons failed (HTTP 406, then alternate endpoint timeout); no missing response was treated as data.

## Changes

- Removed the old procedural ridge sampler from the lower-precinct height adapter. Its flat strip ended at local x=±22 m, but the geographic adapter sampled beyond it, creating false hills beside Romon.
- Connected the lower court to a shared Romon datum and aligned Gehaiden's architectural base to it, retaining its authored pedestal. This is a video-guided reconstruction decision, not a surveyed absolute elevation.
- Removed only the two generic T00 outdoor floor material batches from the runtime Romon import. Terrain and mapped paths own those surfaces now. Original GLBs, Blender source and detailed architecture remain unchanged.
- Replaced triangle-centroid gravel selection with a continuous material blend. This removes the sawtooth material boundary without adding terrain subdivisions.
- Enabled the existing surrounding OSM buildings by default, darkened simplified roofs and split the geometry into 256 m culling cells. Nearby cells are hidden so approximate massing does not mask the detailed precinct. Distant crowns use 192 m cells to bound draw calls.
- Added 18,770 distant canopy instances (375,400 triangles total), shared geometry/material, no shadows, no colliders and no extra texture images. Near-camera cells are hidden. Both context layers can be disabled under Menu → Routes → Layers and sources.

## Validation and limits

61 Node tests passed, including new level continuity and courtyard regressions. Syntax and diff-whitespace checks passed. Browser shader compilation succeeded. The first console check was empty; a later check included three asynchronous message-channel closure errors, without an application stack or WebGL shader failure. Their origin was not established.

Walked the Romon entrance to the hall, its side bypass, the former high flank toward the shop, and the western Temizuya stair/landing into the court. At the former false hill near (-12.59,25.07), eye height was 42.57 m versus approximately 53.46 m in R22. The final western landing inspection reached (-2.01,44.22,-20.10) without a drop through the floor. These are sampled walk checks, not validation of every path.

Live overview sample at 1205×812, pixel ratio 1: about 78 FPS, 3,930 draw calls, 18.01 million triangles for the entire existing scene plus context. Both context layers disabled at the same view yielded about 98 FPS and 3,276 calls. Larger final context cells reduced the full-view count to 3,510 calls; its point sample was about 68 FPS, so this does not establish an FPS improvement. These short local measurements are not a controlled benchmark or cross-device guarantee. Much of the original scene remains expensive. New canopy geometry itself is bounded as above.

Captures: `outputs/r23/courtyard.png`, `outputs/r23/aerial.png`, `outputs/r23/aerial-close.png`; last render sample in `outputs/r23/render-stats.json`.

Still incomplete: the transition to the upper sanctuary remains too coarse; several inherited platforms, reception placement, facade proportions and small side passages need further reference reconciliation. The far city is footprint massing, not individually reconstructed houses. Context cells change discretely with distance. Romon and the entire precinct are not declared complete or a pixel-perfect replica.
