# Keihan approach: source, route and ownership

This follow-up starts at **Keihan Fushimi-Inari (KH34), platform 2**, as confirmed by the user after opening Street View. JR Inari remains the separate alternate arrival. These are different stations and different approach streets.

## Source evidence

The official [Keihan station page](https://www.keihan.co.jp/traffic/station/151/info.html) and [station plan](https://www.keihan.co.jp/traffic/station/assets/pdf/info/station-151.pdf) establish the station identity and separate platforms/gates. [Fushimi Inari's official access page](https://inari.jp/access/) distinguishes Keihan from JR. The [Kyoto municipal canal museum route](https://biwakososui-museum.city.kyoto.lg.jp/walk/03/) identifies the Inari bridge and former tram terminus. The [Kyoto walking association's 2020 route](https://kyoto-gakuren.jp/wp/wp-content/uploads/2020/09/f0695215a3315b790df32528d29358a5.pdf) supports the sequence commercial street, canal bridge, JR crossing, Urasando.

Root inspected user-provided Google Street View and saved local native frames:

| Frame | Panorama | Position | Capture | Evidence used |
| --- | --- | --- | --- | --- |
| 02 bridge approach | `jdt_0bBLBQcMoedhCMDVJA` | 34.9680312, 135.7698683, east | October 2024 | Narrow asphalt, white margin marks, north-side street-food counter, bridge ahead |
| 03 bridge west | `mVT8dPF3mdWEKySYwkIvHQ` | 34.9680042, 135.7699725, east | October 2024 | Red bridge, south pedestrian strip and bollards, northwest chestnut signage |
| 04 bridge centre | `vCTQFSUYZhnjIYqJrVIRZw` | 34.9679863, 135.770072, east | October 2024 | Red horizontal rails and thin vertical balusters; dark capped end posts; JR crossing immediately east |
| 06 east street | `6ki716lGb157sL6O6f-Gqw` | 34.9678929, 135.7705127, east | **November 2020** | Shop rows, shutters, awnings, upper timber grids and twin-globe lamps |

Frame 06 changed date automatically while moving through Street View. The new scene combines that explicitly historical evidence with October 2024 views and OSM geometry; it is not represented as a single surveyed or current capture. Photos are reference material, not textures distributed with the scene.

## Canonical route

All positions use the repository's origin 34.96714, 135.77267 and radius 6378137, X east / Z south. Existing feature coordinates remain unchanged.

| Section | Source | Key X/Z |
| --- | --- | --- |
| Station owner handoff | node8818048777; footway952687115 | -301.277, -124.745 |
| Inari-shinmichi | way946510942 | -302.572,-121.327 → -230.669,-91.560 |
| Road bridge | way105449702 | -230.669,-91.560 → -212.032,-86.206 |
| Parallel south footbridge | way626177639 | -230.150,-86.473 → -211.658,-81.319 |
| JR crossing and east road | way79699849 | -212.032,-86.206 → -157.252,-85.950 |
| First track crossing | node717498925 / rail24590286 | -207.745,-85.761 |
| Second track crossing | node3338256050 / rail801938138 | -203.649,-85.382 |
| Hommachi link | way1057050892 | -157.252,-85.950 → -151.505,-87.319 |
| Urasando commercial street | way297888106 | -151.505,-87.319 → -58.657,-69.029 |
| Urasando shrine approach | way105449676 | -58.657,-69.029 → -20.434,-25.381 |

`routePoints` follows these public roads to the last supported endpoint, where integration can join the existing shrine path. It does not route south to the JR Omotesando first torii. The old JR route and its geometry remain separately owned.

## Missing bridge and canal repair

`makePathSurfaces` excludes bridge=yes, so both mapped bridge ways lacked physical tops. The new approach owns the missing bridge floors and only uncovered joins. It subtracts the exact Float32 path-top quads calculated with the same `pathOffset` miters as the existing path renderer; no blanket pavement slab replaces the street. Walking heights sample the actual emitted Float32 triangles in four-metre cells. Existing street heights remain the grade source.

The source extract [OSM map bounding box](https://api.openstreetmap.org/api/0.6/map?bbox=135.7690,34.9672,135.7723,34.9685), retrieved 2026-10-24, contains canal polygon **way310960824**, absent from the repository's water collection in this bridge area. The new five-point ring is this source polygon clipped to X[-245,-195], Z[-155,-40]; actual resulting X extent is approximately [-232.141,-210.185]. The bounded addition uses static opaque water and concrete lining. `clipTerrain(positions)` removes only that polygon from final terrain triangles and preserves the original outside triangle plane. It also rebuilds the bank rim once from intersections with those actual rendered triangles, keeping it in the same concrete batch. This closes the 9–12cm discrepancy possible when sampling the DEM beside coarse terrain triangles. Both artificial ends have lining caps. Integration must call it after the existing terrain clip chain. Existing water owners remain untouched.

Bridge deck transverse width, thickness, water level (lower road endpoint minus 2.45m), railing dimensions, bollard spacing, street-lamp locations and crossing-device offsets are **photo estimates**. Embedded track gauge 1067mm follows OSM. The crossing barriers are statically upright; there is no active crossing state, train or simulated hazard. Canal artificial ends are at the declared scope boundary, not a claim about the canal's full extent.

## Integration and checks

`buildKeihanApproach(root,features,surfaces,materials,colliders,spec)` exposes `surfaceHeight`, `clipTerrain`, `routePoints`, three camera `checkpoints`, `builtIds: []`, counts and provenance. It never replaces buildings. Station/platform and shop owners are separate. `surfaceHeight` returns null outside emitted new walk tops; water and decorative marks are not walk floors. Continuous bridge rail colliders protect the exposed sides; the bridge road and pedestrian strip remain unobstructed.

Budget: eight merged material batches, fewer than 6000 triangles, fewer than 20 colliders, no lights, no network requests, no animation/update function. Labels and storefront detail have their own bounded owner and evidence document.

Node tests cover exact route topology, disjoint surface ownership, both walk directions and ±0.25m offsets, the pedestrian bridge's longitudinally offset eastern continuation, bridge ray support, continuous rail collisions, canal clipping area, outside-plane preservation and matching bank rims, finite geometry, idempotence and failure with missing mapped source. The approach and frontages have 15 passing focused tests combined. Native walking, visual quality and final integrated performance are root-owned and are not established by these structural tests.
