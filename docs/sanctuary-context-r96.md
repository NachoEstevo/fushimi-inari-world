# Honden rear and side envelope R96

`refineHondenServiceEnvelopeR96(scene, materials)` adds four photographed architectural systems to the existing Honden GLB. Call after R94 rear veranda and R95 open tamagaki, before material remapping and the legacy placement matrix. This module owns no integration or terrain files.

Actual source pixels inspected: `.tmp/r94-sanctuary/rear-wide.jpg` ([P3600508_20190331](https://fushimiinari-guide.com/wp-content/uploads/P3600508_20190331.jpg)) and `.tmp/r95-sanctuary/side.jpg` ([DSC_0472_20190331](https://fushimiinari-guide.com/wp-content/uploads/DSC_0472_20190331.jpg)). The rear photograph shows red open veranda railing returning around the right corner, closely repeated eave support ends with pale/golden tips, a broad golden gutter and bent downpipe against the wall, and dark protective-net support lines with sagging ties against white upper wall panels. The side image establishes the same red/gold railing vocabulary. No readable labels or unseen interior are fabricated.

The inherited production podium and white rear wall register this packet. Their matching bounds gate construction, rejecting a different or shifted asset. All source geometry is retained. Four omissions are addressed:

- Two 8.72m side veranda returns, twelve posts with gold collars, at X +/-6.8; short corner connectors join the existing R94 rear railing without duplicating its posts.
- Forty-nine rear eave support ends across 15.84m, each with a pale/gold tip.
- One 16.4m open-top gold trough beneath the rear eave, bent three-segment downpipe, three wall brackets/bands. No buried drainage route is invented.
- Two thin upper-wall protective-net support lines and five segmented sagging ties. The fine net itself is not modeled, and no new window grid or opaque screen is introduced.

All precise dimensions, counts, downpipe X position, cable spacing and mirrored side return are inferred. The model's inherited proportions differ from the photograph. The geometries express observed categories within an existing source frame, not a measured or historically exact reconstruction. The broad apparent gold gutter colour is source-backed; precise alloy/finish is not.

The packet uses three existing material batches (vermilion, gold, black), 240 merged primitives and 4,180 triangles. All vertices have standard box/cylinder UVs; no textures, dependencies, lights, per-frame work or instancing are added. Shared material objects are reused without mutation. Bounds: X -8.25..8.25, Y4.35..8.53, Z -39.59..-29.95. These are inside the existing tamagaki exclusion X +/-10.39, Z -41.39..-23.91. Side rails stay on the existing podium. No walking network, floor sampler or collider is added; the existing sacred-enclosure exclusion remains authoritative. Therefore this packet introduces no public route obstruction; physical assembled collision behavior remains untested.

Three actual-GLB tests cover coexistence and geometry-owner preservation after R94/R95, idempotence, finite vertices/UVs/bounds, mismatched asset/shift rejection without mutation, and all geometry inside the existing public exclusion. Adjacent R94/R95 regressions also run. Final diff was inspected. No Blender, GPU, browser or alternate rendering path was used under the parent's explicit restriction. Native appearance, texture parity, potential source-detail overlap and final assembled placement remain unverified; visual acceptance is pending.

This packet completes visible Honden envelope systems. It does **not** replace surrounding empty grass with a new compound. Shinsenjo remains withheld because the R93/R95 floor/terrain mismatch lacks registered grade evidence. The photographs do not establish safe surveyed endpoints or levels for the unseen service court and retaining wall; these remain unresolved rather than fabricated.
