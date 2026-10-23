# R97 — Kumataka architecture, entry shelter and lakeside support

## Final behavior and sources

The legacy Kumataka group faced the pond centroid. Its refined pavilion and rail inherited that approximate transform, while eight illustrative stone posts intersected public paving without having colliders. The entry shelter's roof also overlapped the onward path.

R97 registers the worship pavilion to mapped roof `way/301527741`, facing northwest across the passage toward Takeya. The separate entry shelter faces southwest toward arrival. A bounded mineral court, connected red lakeside rail and localized stone pier complete the assembly. Takeya retains its existing mapped footprint and frontage.

Inspected production code, assembled geometry, geographical features and actual photographic pixels:

- [From inside Takeya](https://fushimiinari-guide.com/wp-content/uploads/P3600691_20190219.jpg): decisive northwest worship-front bearing across the lane.
- [Arrival passage](https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg): Takeya on the west/left, shrine and southwest-facing entry shelter on the east/right.
- [Lakeside passage](https://fushimiinari-guide.com/wp-content/uploads/P3600705_20190210.jpg): red paling, dark heads and cover, confined passage and return toward the shrine.

The [reference packet](kumataka-references-r97.md) includes lower-water and pier views. Source filenames do not establish verified EXIF dates or current restoration state. OSM roof and water polygons provide mapped positions, not a cadastral or architectural survey. Photographs establish orientation, construction and material categories. Heights, sections, slat count, pier width, entry-shelter offset and short return remain inferred. No outer memorial terrace or subsidiary stair is claimed.

## API and ownership

Call `buildKumatakaRegistrationR97(root, features, surfaces, materials, colliders, {water})` after Takeya R89, rail R88 and the successful Shin-ike water owner, before static merging. Successful `builtIds: ['way/301527741']` supplies conditional generic-building exclusion.

Recognized architecture, shoreline and collision contracts are checked before mutation. The original interactive body, base, detail group, plaque and two candle-house groups move under the mapped parent; mesh identities, callbacks and local animation state survive. The parent faces `[-0.873087, -0.487564]`, centers on `[542.95025, -134.4905]`, and fits the original roof to approximately 4.774 × 7.242 m. The shrine collider follows the same transform. Source-ring irregularities and roof-edge details remain reconstruction limits.

A mineral court sits within the roof polygon at resolved floor plus 15 mm. It replaces the broad illustrative deck without flattening terrain or changing route heights. The existing base remains supported and partly buried. Unknown contracts or unsupported ground fail closed.

The new rail follows the mapped western pond bank, projected to the pavilion's lake-side endpoints, with short returns reaching its northeast and southwest body corners. There are 63 slats after the R98 southwest closure. Exact old deck, rail and shore meshes are removed after replacement geometry succeeds. New rail blockers preserve the public passage.

## Water and architectural pier

The water owner runs first and owns the horizontal water surface and natural bank collar. This packet owns only the localized stone pier beneath the new rail and return; it does not wall the entire pond.

A supplied water report must have `built: true`, contain `way/105449705` in `builtIds`, and provide a finite, plausible water level below the court. Invalid reports reject before mutation. Only calls without a report may derive a datum from the exact recognized legacy 18 × 22 m plane.

The final water level is **65.314503 m**, giving a pier toe at **65.164503 m**. Stone courses are 0.40 m wide, with a 0.43 m cap whose top is 66.412874 m. It supports slat bottoms at 66.392874 m. These dimensions and the 0.15 m submerged allowance are inferred. Registration does not alter the water mesh or terrain.

## Entry shelter and route cleanup

The original basin and roof move together to a bay derived from roof741's southwest short edge: its midpoint plus 0.75 m southwest along the long axis. The center is approximately `[540.816827, -130.674185]`, at floor 66.312874 m. This is a photograph-based relative placement, not a separately surveyed footprint.

The existing roof mesh receives a pitched 2.2 × 1.8 m gable, supported by four seated timber posts and beams. The basin retains its object identity. Posts and basin receive matching colliders. Before construction, the complete roof must have zero positive-area intersection with the actual 2 m paths expanded by a 0.28 m player radius, and with every triangle of the pond polygon. Both final overlap areas are zero. The former 0.125823 m² intrusion remains recorded as historical metadata, not scene geometry.

Exactly eight legacy steles are removed: zero-based indices **7, 10, 11, 13, 14, 16, 17 and 20**. Each requires its original formula, dimensions, position and positive footprint intersection with public paving. Foxes and bibs require their own proof; none is removed in the final assembly. Off-path objects and interactions retain their owners.

## Validation and limits

Five architecture tests pass after the R98 southwest closure; the focused run including adjacent Takeya and R88 tests passes **16 tests total**. Checks cover registration, interaction identity, conditional cleanup, finite geometry, budgets, idempotence, failed-build isolation, water-report validation, pier support and corrected shelter bounds.

The actual collision world samples arrival `626313754` and onward `301527750` at the center and ±0.65 m side lanes, using a 0.28 m player radius and displacement tolerance of 1e-6 m. The former failing point `[539.210063, -135.621878]` now has displacement below 1e-8 m; a vertical ray no longer hits pavilion architecture there. Pier-cap rays verify support under both rail segments.

The final-water test records **2,846 court/rail/pier triangles in three batches**, **72 entry timber triangles in one batch**, and a **four-triangle entry roof in one mesh**: 2,922 new triangles across five draws. The R98 return adds 528 triangles and one physical blocker to this registration packet. Existing refined pavilion geometry is reused; the separate swept-roof repair has its own budget. No dependency, network texture, light or animation loop is added.

Syntax, whitespace and the scoped final diff were checked. Root owns combined rendered source comparison and native walking/interaction acceptance. Mapped registration and automated clearance do not prove surveyed historical dimensions, native appearance or hardware performance. This packet owner performed no renderer/browser work or commit.

## R98 bounded southwest passage closure

Fresh inspection of P3600705 shows the lake fence on the left/southeast and shrine wall on the right/northwest while looking southwest along the rear passage. Its visible perpendicular terminal fence therefore establishes a southwest return, which was absent from R97's main run and northeast return. See [Shin-ike boundary research](shinike-boundaries-r98.md).

The added third segment runs from existing rail A `[543.787969, -129.901690]` to the accepted pavilion's transformed body corner at local `[-7.77, 0, -2.48]`, approximately `[543.030998, -131.420229]`. The run is about 1.70 m. The photograph supports the return's presence and orientation; its endpoint and dimensions are inferred from the registered body rather than surveyed fence linework.

This segment reuses the existing red/black slat, stone-pier and collision builder. Water and floor levels, worship orientation, entry shelter and public paths remain unchanged. Actual projected pier bounds have zero positive-area intersection with both public paths expanded by the 0.28 m player radius. Rays hit the middle slat and pier cap while passing through the adjacent real slat gap; the matching return collider follows its center and orientation. No whole-pond perimeter or separately unregistered gray parapet is constructed. Root owns the fresh combined render and final visual acceptance.
