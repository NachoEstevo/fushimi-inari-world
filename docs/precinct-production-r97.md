# R97 — Kumataka-sha and Shin-ike correction

Continues the substantial precinct work in R96 (`b29b80a`). The user identified stone posts obstructing the path, an elevated blue pond, a misplaced and rotated pavilion, missing railing and an incomplete small rest area. Sol 6.1 owners handled source research, architecture, water and vegetation; separate owners audited the actual assembled geometry and exported it for one serialized CPU renderer.

## Source and placement

The [reference packet](kumataka-references-r97.md) records ten inspected photographs, the official shrine description and mapped feature identities. The photograph taken from inside Takeya establishes that Kumataka's worship front faces northwest across the lane toward the shop. The southwest gable belongs to the small water-basin shelter. The pond photograph establishes lower olive-gray water, a localized stone projection with red railing and a densely wooded opposite bank. No newly watched video or live Street View inspection is claimed for this packet.

The original pavilion and interactive callback now occupy mapped roof `way/301527741`; Takeya's independently registered footprint is preserved. Eight precisely identified legacy stone markers intersected the public path and were removed. The small basin and its supported pitched shelter move together into the southwest bay, clear of the path and pond. The lakeside railing follows the mapped western shoreline beside the pavilion, with a short connected return and supporting masonry. See [registration](kumataka-registration-r97.md).

## Pond and bank

The previous generic water mesh sampled the terrain at every vertex: one pond varied by **3.51 m** in height and overlapped a second legacy plane. There is now one horizontal water surface over the mapped Shin-ike polygon, with muted day/gold/night colors and the existing analytical ripple shader. Its fixed elevation is **65.314503 m**, approximately **1 m below the shrine court**. It is derived from the lowest retained shoreline and the previous water datum, not a surveyed water level.

Terrain is cut only inside the exact pond polygon. A bounded inward natural bank joins the retained terrain to the water; outside terrain and walking heights are unchanged. The stone pier is a separate architectural owner whose toe lies 15 cm below the final water. No reflection render pass, new light or per-frame geometry update was introduced. The photographed forest reflections are not implemented by this change. See [water ownership](shinike-water-r97.md).

## Further corrections after image review

Lowering the water exposed additional old geometry. Exact source-index pairing identified two unsupported trees; their trunks, crowns and corresponding colliders were removed together. Another tree was seated on the actual bank with its original 25 cm root burial. An independently identified legacy fallen log was also removed after the successful water build; unrelated logs and ambiguous signatures are retained. See [vegetation repair](shinike-vegetation-r97.md).

The first court image also revealed sky through the pavilion's rear gable. Actual rays showed complete roof slopes but a missing upper rear enclosure. A focused roof replacement closes that gap and gives the roof continuous swept slopes, matching fascia and restrained standing seams. Lower altar details and the original interaction remain intact. Hidden rear boarding and exact curvature are explicitly inferred. See [roof review](kumataka-roof-r97.md).

The real photographs show a wooded enclosure, while the first assembled images still showed a bare opposite bank. Seventeen dry-rooted trees, 51 crown instances and 40 low-growth clusters now fill that bounded opposite-bank arc. Roots use actual terrain; high canopy may overhang water, while low growth and trunks remain dry. Low growth intersects its lowest sampled support by 8 cm, avoiding floating foliage on slopes. Three instanced batches add **21,144 rendered triangles** and use the existing distance-culling mechanism. No new update loop is added. See [bank landscape](shinike-bank-landscape-r97.md).

## Verification

- Full repository test command: `node --test --test-concurrency=4 fushimi_inari/integrated-world/*.test.mjs fushimi_inari/geography/*.test.mjs`: **550 passed, zero failed**.
- Fresh integrated construction confirms the new owners succeed; the generic duplicate pond is excluded and terrain clipping runs in the viewer's final chain.
- **36 actual route checks** cover the complete Okusha–Kumataka–Mitsu sequence and adjoining source paths, center and ±0.3 m offsets, both directions. Every sample has zero collision correction and valid height; maximum sampled steps remain below 0.4 m.
- Downward rays at the former stone and pavilion obstructions are clear. The original shrine object, interaction registry membership and callback identity are preserved.
- Exact tree/crown pairing, actual bank seating, low-growth support, distance-culling membership, finite geometry, owner guards, failed-build preservation and the completed diff were independently reviewed.
- Render evidence uses actual integrated Three.js geometry in Blender 5.2 CPU, one process at a time. Its simplified materials omit native textures, leaf cutout alpha and custom water shaders. It does not establish native browser appearance, walking input, interactions or FPS.

Selected images, camera poses, actual audit records and source hashes are in [review-r97 — archived](repository-archive.md#historical-review-evidence) (`review-r97/README.md`). Absolute water elevation, natural-bank profile, individual tree positions and unobserved roof details remain interpretations. This checkpoint does not claim that the whole site is identical to reality.

The user requested a pause after these iterations. Finish visual acceptance and the reviewed release, then pause the existing continuation heartbeat; do not open another reconstruction round automatically. The R96 Shinsenjo grade and other documented broader precinct limitations remain separate outstanding work.
