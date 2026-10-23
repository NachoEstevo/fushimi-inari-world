# Shinkosui roofed well R96

`buildShinkosuiWellR96(root, features, surfaces, materials, colliders, {terrainPositions})` replaces only the generic roof owner `way/305214828` when `builtIds` contains it. Root owns integration and must add this conditional generic exclusion. Call after neighboring court/building owners and before generic buildings. No existing source file or terrain was edited.

## Primary geographic registration, not a guessed small building

The local OSM extract identifies `way/305214828` as **building=roof**, with geographic vertices latitude34.9669645..34.966986 and longitude135.7733313..135.773371. A fresh primary [OpenStreetMap node11941092061](https://api.openstreetmap.org/api/0.6/node/11941092061) returned latitude**34.9669758**, longitude**135.7733513**, `man_made=water_well`, `name=神供水`, `pump=no`. That point is inside the roof ring. The complete live bounding-map response is cached `.tmp/r96-well-live-osm.xml`; it establishes the named well-to-roof correspondence that the original local extract lacked. Two failed Overpass attempts supplied no evidence; the successful source was OSM's primary map API.

Actual `.tmp/r92-refs/well-context.jpg` pixels were inspected again. The [firsthand2016 account](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/) identifies this well as 神供水 and places Shinsenjo behind/left and Mikoshiko east of the well. The photo shows a separate low timber pavilion, muted weathered pitched/gabled roof, four stout posts, dense pale-brown square pickets/rails around its closed base, low mineral toe and restrained golden gable fittings. These relations agree with the mapped well northwest of Shinsenjo and west of Mikoshiko. This is distinct from Mitsurugi's mountain well and the public temizuya; no such imagery was used.

Code/owner search found no existing305214828/神供水/Shinkosui owner. The old `legacy-builders` well is part of Mitsurugi's upper-mountain compound, not this mapped lower precinct location. Current `excludesBuilding` returns false for305214828, so integration must suppress its generic proxy only upon this builder's success.

## Geometry and physical contract

Exact mapped roof center[62.133,18.340], width3.59416082m, depth2.36006864m, yaw0.00945993rad. Roof plan and orientation derive from the ring. The physical fence is inset .33m at each width end and .28m at each depth side. A single closed fence collider stays inside the mapped eave. Four posts,52 pickets, rails, perimeter beams, two thick pitched roof panels, repeated under-eave rafters, ridge and restrained golden end fittings form a complete pavilion. The low stone toe is bounded beneath that inset fence. No new broad court, grass clearing, well shaft, pump, animated water, draw bucket, inscription or public gate is invented.

All heights, picket counts, pitch, roof rise, inferred bark/wood finish and precise gold fittings are appearance estimates. Eave2.18m, ridge2.94m above local floor; fence1.43m maximum. The photograph does not establish measured heights or current conservation condition. The closed interior intentionally does not expose invented well contents.

Four static material batches,120 primitives,1,888 triangles, metric face UVs at1.5m. Existing stone/gold reused where supplied; two cohesive brown timber/muted roof materials supply the photographed vocabulary. No textures, dependencies, lights or per-frame work. The optional `wellTimberMat`/`wellRoofMat` allow caller material ownership.

The builder requires actual rendered-triangle support across the whole exact roof ring; coverage, overlapping coverage, unavailable support, more than .18m relief, unregistered floor, mapped walking corridor overlap and existing-solid overlap all reject without mutation. It never moves the roof opportunistically or changes terrain. Floor sampling uses the stable existing local court, not the distant Shinsenjo stub's higher path top.

Fresh actual `integrate()` invocation passes: floor43.982249m, rendered support43.922249m across the full ring, relief below1e-12m. Terrain/floor difference .06m is the established rendered offset. The service stub751194636 stays east of the inset fence, with its full1.8m walking width and .12m guard untouched. All existing colliders are checked before the new fence is installed. Existing generic exclusion is still root-owned.

## Verification

Four focused tests use actual mapped features and verify source envelope, geometry UVs/finite bounds, batching, idempotence/collider ownership, missing/mismatched source rejection, incomplete or steep terrain, unsupported floor, actual service-stub clearance and an intentional route conflict. The complete actual assembled CPU audit also succeeds after all current neighboring owners. Final source/diff reviewed.

No Blender/browser/GPU or alternate rendering was used. Native appearance, roof material/curvature match and assembled collision/visual acceptance remain root review. Source and dimensions distinguish direct OSM registration from inferred appearance. No commit or shared integration edit was made.
