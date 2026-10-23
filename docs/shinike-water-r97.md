# Shin-ike single flat water owner R97

API: `buildShinikeWaterR97(root, features, materials, {terrainPositions})`. Root calls it after the existing R88 rail and **before** the R97 architecture registration. It requires only the exact legacy water plane and actual composed terrain, not the old shore wall or any new pavilion. On success, root must exclude returned `builtIds: ['way/105449705']` from generic viewer water and chain `clipTerrain` through the viewer's terrain callbacks. The architecture owner receives the successful water report to register its pier bottom. No integration/viewer files were edited by this packet.

## Evidence and corrected ownership

Read `docs/kumataka-references-r97.md`, actual owner audit, existing legacy builder, office-pond clipping and water appearance implementations. Actual `outputs/r97-kumataka-references/DSC_0009_20190202.jpg` pixels were inspected: olive/gray-green water sits below a rough stone shrine projection; natural wooded/sloped banks enclose the pond. This supports lower flat water and subdued colour, not a tilted blue pool or a new continuous stone retaining wall. Exact colour, bank slopes and absolute elevation are inferred. No new user-video viewing claim.

The former generic viewer put each water vertex at `ground+.3`, giving the SAME pond66.612874..70.122795m. The retained18×22m legacy plane independently sat at65.716520516m. This packet replaces those two conceptual owners with one exact mapped horizontal mesh. It removes only the uniquely recognized legacy `PlaneGeometry(18,22)` with four vertices, local[10.5,-.18,0], rotationX-PI/2, physical material roughness.07, under the Kumataka owner; unrelated planes remain. Generic exclusion remains root-owned. All coverage/clipping/annulus gates finish before the old plane is removed.

## One fixed datum, with the actual low-shore constraint

Preserving65.716520516m directly failed the actual composed triangle check. Lowest retained shore is **65.354503252m**, at **[537.275134125,-116.0]** on the western mapped boundary; mapped polygon-vertex heights had missed that crease. Raising a berm would invent outside grading. Root approved:

`waterLevel = min(legacyWaterLevel, minActualRetainedShore - .04)`

This is computed **once at successful construction**. `clipTerrain` and repeated calls never lower it again. Report fields retain `waterLevel`, `legacyWaterLevel`, `minRetainedShore`, and `minShoreWitness`. On the current cached actual composed terrain:

- Final water65.314503252m; inherited plane65.716520516m.
- Approximately0.998371m below the current nearby shrine court66.312874m.
- Actual shoreline65.354503252..69.774504645m.
- Maximum represented natural-bank drop4.460001393m.

Absolute water level and grade difference are inferred physical reconciliation, not surveyed hydrology. The photo establishes relative lower water, while actual triangle geometry establishes safe assembly contact.

## Exact wet polygon and bounded natural bank

Uses the actual20-vertex OSM 新池 ring, area1818.685657m², X530.013..575.269/Z-149.803..-70.666. Source Y values are discarded as terrain samples. The flat water triangulates the whole exact ring, with18 triangles. Existing `clipMitsuTerrain` performs the exact polygon subtraction; every retained exterior triangle fragment stays on its original plane and distant triangles remain byte-identical. No outside height field, public route, walking sampler or plateau is introduced.

A single triangulated **inward natural-bank annulus** joins actual terrain-split boundary vertices to a submerged toe. Toe points move toward the mapped polygon centroid by `min(4m, max(.35m, drop*1.25), .3*distanceToCentroid)`, remaining inside the wet ring. Its ordered inner ring is checked for self-intersections and full containment. Annulus triangles are clipped to the exact wet polygon. Projected triangles remain disjoint, avoiding per-edge overlapping strips. The water mesh continues under this collar; therefore the **visible bank/water inset is inferred**, up to4m, rather than a surveyed replacement waterline. Neutral earth/rock finish expresses the source wooded bank, without inventing a four-metre masonry wall or exterior berm. The actual photographed stone projection and railing remain separate architectural owners.

An initial repeated subtraction design caused excessive geometry fragmentation in a test and was replaced before integration by the bounded annulus. Current actual-terrain probe builds in approximately93ms on this machine; that timing excludes full world assembly and is not a frame-time benchmark.

## Materials, rendering and walking

Two static batches:18 water triangles and1328 natural-bank triangles in the actual current terrain probe. Water has3m-scale UVs; bank2m-scale UVs. `water-appearance.mjs` adds only `kind:'shinike'`: subdued olive day/gold/night colours, roughness.34(.38 night), metalness.04, calm existing pond-scale analytic normals. Existing pond/lake preset values stay unchanged. No vertex displacement, reflection render pass, textures, light, transparency layer or per-frame geometry is introduced. The photographed forest reflection is appearance evidence; this packet does not implement scene reflections.

Root can update the material through mesh `Shin-ike flat olive-gray water R97`, using its existing `material.userData.waterAppearance.update()`/`setMode()` controls. Bank mesh is `Shin-ike bounded inward natural bank collar R97`. No new collider or walk surface is added. The exact pond/bank domain excludes the actual arrival626313754, onward301527750 and upper439990443 corridors at2m width plus.26m player margin. Existing generic/legacy collision ownership is root-reviewed separately; this packet only replaces water geometry.

## Verification and remaining gate

Nine focused tests cover actual mapped ring, only exact legacy-plane removal, source/datum/coverage failure without mutation, single horizontal level, deterministic low-shore policy and no repeated descent, exact cut area/exterior planes/distant triangles, bank containment/disjoint projection/UVs, center downward ray to exposed water below court, and the three actual route corridors. Six water appearance tests and seven adjacent office-pond regressions pass:22 tests total.

Actual assembly produced a regional triangle cache in `outputs/r97-kumataka/actual-water-region-terrain.json`. The final production builder was then probed against those unchanged actual triangles and the recorded legacy-plane signature; `outputs/r97-kumataka/water-owner-audit.json` records the successful result. A downward ray atX550/Z-110 hits the flat water at65.314506531m (Float32), matching the fixed double-precision datum within4micrometres. No central bank occlusion. This is an actual terrain geometry check, not native visual acceptance.

Final source/diff reviewed. No Blender, browser, GPU, viewer/shared integration edit or commit. Root still owns assembled rendering, bank appearance/slope review, source-photo comparison, generic-water exclusion, material mode updates and full route/player QA.

## Final floating-log correction

Root inspected the assembled final image and recorded `outputs/r97-kumataka/final/fallen-log-owner.json`: an inherited storm-fallen illustrative cylinder remained above the corrected lower water. The reference research marks storm-fallen wood as temporary, so this packet does not invent a new faithful present-day placement. After successful water construction only, it now removes the **unique** exact original cylinder: radii .18/.26m, length6.8m, eight radial segments, closed full cylinder, unit scale, local[8.2,-.08,-2.5], rotation[0,.42,PI*.47] under the original Kumataka zone. Its actual world root must also match[550.806547704,65.816520516,-122.636690312] within25mm and lie inside the exact pond. Ambiguous, displaced or unrelated objects remain. The report records `removedLegacyLogs`0/1; repeated calls do not remove further objects. Failed water construction preserves both old water and log. Two additional tests verify unique removal, unrelated/other-owner preservation, ambiguity/displacement preservation and failure nonmutation. Root owns the final image recheck; no new rendering was performed here.
## R98 slight transparency after accepted reflection update

The user accepted the reflected/glossy water appearance and requested only slightly more transparency. Shin-ike now uses **opacity .92**, native normal alpha blending, `transparent=true`, `depthWrite=false`, and `forceSinglePass=true` for the horizontal double-sided surface. The installed Three version supports this flag. Its native OPAQUE shader define is disabled for transparent materials; native fragment output retains `diffuseColor.a`. This prevents the back/front double transparent pass from accidentally making the plane almost opaque. Opacity/depth flags remain stable across all lighting modes and time updates.

The liked optical settings are preserved: IOR1.333, specularIntensity1, metalness0, roughness day.15/gold.14/night.17, existing olive palette and analytic ripple amplitudes .014/.009. Root-owned static environment texture/intensity are retained. Other pond/lake presets remain opaque with their prior material/depth settings. No transmission pass, vertex displacement or new reflection capture is introduced by this change. These current settings supersede the original R97 material numbers above.

To avoid revealing the terrain cut or sky through the new alpha, one opaque dark-silt visual backing follows **the exact same mapped ring and18-triangle tessellation**, fixed **.6m below water**. Name: `Shin-ike bounded dark silt visual backing R98`; `userData.shinikeSubmergedBacking=true`. It uses a dark neutral silt finish, roughness1, metalness0, opacity1 and depth writing. The offset is solely a visual enclosure, **not a surveyed pond depth**. No stones, deep objects or invented underwater contents are added. The backing remains inside the existing pond owner and changes no terrain, colliders, public surface or fixed water level.

Current owner budget is **three material batches**:18 water triangles, unchanged natural-bank geometry (1328 triangles in the earlier actual-terrain probe), and18 backing triangles. The report includes `bedLevel`, `backingDepth:.6` and `backingTriangles:18`. Root still owns reflected-scene capture and native visual review.

Two additional behavior tests verify native alpha settings, single-pass behavior/configuration, stable opacity/environment/modes, full backing coverage, exact mapped containment, unchanged water datum, opaque depth-writing backing and a center ray hitting water then backing .6m below. Nine appearance, ten Shin-ike owner and seven office-pond tests pass: **26 total**. Final diff reviewed; no browser, renderer, shared viewer/cache edit or commit.
