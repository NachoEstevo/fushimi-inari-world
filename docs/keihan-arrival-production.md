# Keihan arrival and commercial approach

Baseline: `da6e6b9`. User correction on 2026-10-24: start the experience at Keihan Fushimi-Inari, preserve JR Inari and map its approach as an alternate. The supplied Street View is the Keihan east exit in October 2024, not JR Inari. Original social-preview edits, unintegrated R103 and local outputs remain outside this change.

## Plan and ownership

1. Follow the supplied Street View and official station plan to fix the southbound P2 circulation: step east from the carriage toward the outer wall, then turn right/south to the southern gate. Station owner supplies one canonical specification, physical surfaces and source records.
2. Join the mapped Inari-shinmichi street, canal bridge and Urasando approach to the shrine. Keep JR's separate Omotesando route. Route owner builds public surfaces and source-registered storefront details without invented business locations.
3. Measure runtime rendering and CPU walking costs before choosing optimizations. Preserve collision behavior, floor ownership and visible architectural detail. Report CPU timings separately from browser FPS.
4. Root integrates camera/UI/checkpoints and checks the actual native browser arrival and route. New architecture is reviewed from platform, exit, commercial street and shrine approach, plus layout and support probes. Initial review plus at most three correction rounds; one renderer if a CPU export is needed.
5. Review the final diff, run changed-behavior tests and repository release gates, preserve unrelated work, and deliver source-bound evidence with remaining limitations.

Station owns new `keihan-station-spec.mjs`, `keihan-station.mjs` and its tests. Route owns new `keihan-approach.mjs`, `keihan-frontages.mjs` and their tests. Performance starts with read-only measurements; root approves exact implementation ownership after evidence. Root owns shared integration, viewer, arrival UI and documentation packaging.

## Evidence and acceptance

- Existing metric coordinate system: metres, X east, Y up, Z south, WGS84 origin 34.96714 / 135.77267 with radius 6378137.
- Station, source-tagged buildings, route points and emitted floors share that frame. Historical photos and Street View establish appearance/topology, not surveyed dimensions.
- The train completes motion, braking, opening, disembarkation and closing before releasing walking. The initial platform view preserves the real wall/right-turn circulation.
- Center and lateral walking lanes must have physical support and retain effective collisions. JR and Keihan routes must connect to existing public paths without broad duplicate paving.
- Compare runtime camera, viewport, lighting and statistics before/after performance changes. Do not label the whole experience performant solely from unit tests or CPU render exports.
- Details include street profiles, gutters, signage, awnings, shop windows and registered food displays. Temporary vendor locations and food categories require visual evidence; absent measurements remain marked inferred.

## Delivered scene and review

The default arrival now uses Keihan P2. The east-facing handoff deliberately presents the wall and right-turn exit sign. The southern gate, ramp, public exit, Inari-shinmichi, canal bridges, JR crossing, Hommachi and Urasando connect to the existing Rōmon approach. The route menu offers Keihan (415 m) and JR (198 m) separately; the minimap shows the selected route. JR's train, checkpoint, original interactive sign and Omotesando access remain present.

New ownership includes the Keihan station, bounded canal/bridge/crossing, five registered commercial frontages, 105 mapped context buildings, fourteen Urasando frontage replacements and two source-registered torii. Heights and anonymous facade details remain interpretations. Google Street View changes capture dates along the route: October 2024 around the station/bridge, November 2020 on part of the east street, July 2025 in Urasando, and June 2012 at the shrine join. These are not a single contemporaneous survey. July festival lantern strings and temporary closures were omitted. Google images are reference observations only, not shipped textures.

Independent physical review covers 38,016 samples: Keihan 25,566, JR 12,204 and automatic egress 246, with no collision, missing support, body intersection or robust coplanar-top failures. Four mapped ribbon intersections use the actual emitted path tops to reconcile walking height. The source geometry is retained. See `keihan-arrival-integration-review.md` and the source-bound audit JSON.

Visual review used native browser captures of the wall-facing platform, right-turn platform/gates, exit street, bridge/canal, food counter, Urasando and Rōmon. Station, route, street-context and integration/performance specialists reviewed their boundaries. The station received one appearance/clearance correction; the urban context and narrow mineral shoulders corrected the empty neighborhood and forest-texture artifacts. Large bridge-facing elevations remain simplified, and canal vegetation is less dense than the reference. This is a geographically registered reconstruction, not a photogrammetric replica.

## Verification and performance boundary

The release suite passes **714/714 tests**, excluding the unrelated unintegrated R103 test. The subsequent appearance-only extension of the mineral shoulders through Urasando passed its four focused tests and native shader/visual review. Native UI verification completed both guided station-to-Rōmon routes, normal Keihan arrival, skip, manual right-turn/gate/ramp walking, checkpoint navigation, menu routes, resolution selection and photo-mode entry/exit. Native shader compilation succeeded without console errors. The [evidence manifest](../outputs/keihan-arrival-review/manifest.json) binds the selected source files and captures; [reproduction notes](../outputs/keihan-arrival-review/README.md) describe scope and timing.

Candle flames and the remaining unbatched wax now use their original parent/material/geometry in instances: 308 parts become 22 batches. The same-assembly CPU comparison removes 286 render candidates without changing triangles or shadows; recursive interaction still resolves to the original host. At the same native Keihan platform pose and 1280 × 720 / DPR 1, an earlier view recorded 2,535 calls / 3,718,104 triangles; the expanded final scene recorded 2,288 calls / 3,748,828 triangles. That is about 9.7% fewer calls despite added context. The saved instantaneous FPS samples are 67.6 and 73.9 respectively; these are observational samples, not a controlled frame-time benchmark, and do not establish an FPS improvement. Render submission time is CPU time, not GPU time.

Balanced rendering caps DPR at 1.25; High resolution restores the previous 1.7 cap. Both choices were exercised at native DPR 1, where they intentionally produce the same pixel ratio. High-DPI hardware and mobile performance are not verified. Materials compile before the arrival begins, which may increase initial loading time; first-load latency has not been controlled or claimed improved. No production deployment is asserted by this local verification.
