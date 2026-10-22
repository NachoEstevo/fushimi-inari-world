# R93 — Gonden bounded rear service landscape

Implementation: `fushimi_inari/integrated-world/gonden-rear-landscape.mjs`.

Source: actual pixels `.tmp/r92-refs/gonden-rear.jpg`, IMG_6572_20210311.jpg, and `docs/gonden-rear-reference-r92.md`. Photograph establishes narrow gravel service ground, a low timber foreground barrier and dense trees beyond a retaining/stone boundary. It does not establish surveyed dimensions or exact root/fence coordinates.

The module owns only a 5.2m by 1m mineral strip outside the existing rear roof edge, a 0.91m low timber end boundary, and five inferred slender background tree silhouettes. It uses the actual Gonden matrix to locate the rear, without assuming a cardinal direction from the map alone. Inherited facade, veranda, cabinets, lantern and roofed side screen remain with their existing owners. No retaining wall, stone fence or adjacent building is invented; those need stronger registration. Estimated tree heights 6.6–7.7m and 0.66m boundary height are photographic interpretation.

Integration call after `buildGondenSurroundings` and after all relevant public surface segments exist:

```js
import {buildGondenRearLandscape} from './gonden-rear-landscape.mjs?v=93';
const record=buildGondenRearLandscape(root,features,surfaces,legacy.materials,colliders,{terrainPositions:renderedTerrainPositions});
document.body.dataset.gondenRearLandscape=JSON.stringify(record);
```

The terrain argument must be the actual rendered world-space non-indexed triangle positions, including the viewer terrain vertical offset. The existing shared `makeShoulderTriangleHeight` sampler seats roots and boundary feet. Terrain triangles are first filtered to this small neighborhood, then clipped in Gonden coordinates for mineral geometry; clipping preserves original triangle planes plus a 0.018m overlay offset. Raw DEM or bilinear height fallback is deliberately unavailable.

Existing mineral and roof/timber materials are reused. Crowns reuse the existing shared `leafClusterMaterial` cutout evergreen spray material, with deterministic vertex-colored leaf cards (2,200 crown triangles total). The Node-only test fallback is an untextured double-sided vertex-color material. Mineral geometry carries world-meter UVs matching its world X/Z coordinates. Three static material batches maximum; no lights, textures, animation or dependencies. Tree roots and the short timber barrier receive colliders. Existing surface segments suppress ground/objects at public routes; existing solid colliders suppress furniture/root duplication. Main passage is not closed with a full rear fence.

Validation:
ode --test fushimi_inari/integrated-world/gonden-rear-landscape.test.mjs` passes five focused tests (triangle-plane ground/root seating and idempotence; public corridor clearance; existing tree avoidance; missing terrain/tilted-transform guard). Production assembled visual review is owned by root and remains required. Crowns are simplified layered cutout evergreen sprays and require source-matched rear/side inspection before fidelity acceptance.

Actual integrated roots reported by root review are approximately X69.9–74.7 / Z−26.4, rather than the earlier guessed east-side coordinates. All placement follows the actual shrine matrix; document estimates do not override the assembled transform.
