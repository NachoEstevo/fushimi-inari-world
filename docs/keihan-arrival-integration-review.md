# Keihan arrival integration and complete-route review

Baseline `da6e6b9`, reviewed 2026-10-24. The corrected journey starts on Keihan Fushimi-Inari P2, southbound from Gion. It disembarks east toward the real outer wall, turns right/south to the separate gate, then follows Inari-shinmichi, the canal bridge and Urasando to the shrine. JR Inari remains an independent alternate through Omotesando. **The wall-facing handoff is required behavior**, not a camera defect.

The final actual-assembly CPU audit at **2026-10-24 04:39:10 UTC** passes all three sampled journeys. Root owns the native browser, final appearance/performance comparison and release decision. This reviewer launched no browser or renderer; these results are numerical geometry/collision evidence, not native FPS or visual acceptance.

## Implemented ownership

Under explicit root authorization, this reviewer authored four new production files only:

- `station-approach-routes.mjs` and its test: returns independent Keihan/JR `{points,stops}` routes, or `null` for an unavailable route. Both start at their platform, retain every authored corner, follow actual graph segments to canonical exterior Rōmon `assembly.spatial.main[0]`, and obtain every height from `assembly.walkHeight`. Three-dimensional point spacing is at most 2 m. Unmapped/disconnected joins, unsupported samples and invalid floors fail closed; input owners are preserved.
- `station-approach-surface-fixes.mjs` and its test: reads existing emitted path-group triangles in four exact, source-registered junction disks. It wraps the existing walking sampler so feet follow the higher visible ribbon there, without changing geometry, materials, source features, colliders, other floor ownership or unrelated positions. Root installs the wrapper immediately after `buildPathMeshes`, before the walker and complete-route helper.

The reviewer also owns this report and `outputs/keihan-arrival-review/audit.mjs`. Station, approach/frontages, performance visibility and shared viewer/integration changes remain their respective owners' work. Unrelated social-preview, legacy EOL and R103 work was preserved.

The route helper closes the mapped Keihan gate-footway join through its actual middle corner `[-304.141,-128.596]`, rather than inventing a straight diagonal from ramp foot to exit. The final Urasando continuation follows mapped nodes through `[-19.905,-20.561]`, `[-19.659,-16.13]` and `[-18.3,1.959]` to exterior Rōmon. JR retains every Omotesando bend before reaching that same canonical path node.

## Findings and resolutions

| Finding | Resolution and status |
|---|---|
| Initial P2 rail-safety edge crossed the selected automatic doorway | Station owner reconciled its selected opening and closed-door blocker. Final automatic probes exclude only the intentional closed-door collider and have zero correction. Closed. |
| Station sampler/public-exit join and bridge omitted by ordinary bridge-tag filtering | Approach owner supplies explicit physical bridge/join tops and bounded samplers; final route has support everywhere tested. Terrain clipping matches viewer order: office → Mitsu → Mikoshiko → Shinsenjo → Shin-ike → Keihan. Closed within sampled routes. |
| Closest-centerline walking height put feet below another visible sloped ribbon | Prebatch attribution proved the higher faces did not belong to legacy architecture or terrain. They appear only after `buildPathMeshes`: Hommachi/Inari-shinmichi, two Omotesando footway junctions, and the final Urasando junction. The bounded emitted-top sampler closes the measured 79–183 mm differences without moving source geometry. Closed. |
| Apparent duplicate tops at graph joins | Matching Y at a single point can be an intersection of different sloped planes. The final diagnostic requires matching planes and a robust interior witness outside Float32 boundary-rounding distance. No robust duplicate area is witnessed along the final routes. See precision limit below. |
| Camera/menu/photo ownership, replay and JR preservation | Existing deferred skip and sole-camera-owner contracts were retained. The audit confirms the Keihan dynamic hierarchy and original JR sign/registry survive assembly. Root owns actual UI/native validation. |

The surface correction uses four registered shared nodes, not a general terrain patch:

- `79699849 × 79699850`, node 717498947 at `[-157.252,-85.95]`, radius 3.3 m.
- `105449722 × 626313859`, node 5912935259 at `[-62.762,5.811]`, radius 4.3 m.
- `105449722 × 626313860`, node 5912935260 at `[-36.28,3.918]`, radius 4.3 m.
- `105449676 × 626313855`, node 749327117 at `[-20.434,-25.381]`, radius 1.3 m.

Only **268 upward emitted triangles in 80 two-metre cells** are retained. A candidate top must lie between the original owner height and +0.24 m; overhead rails/decorations and downward faces are excluded. Other source heights and the previous-height argument are preserved.

## Final independent evidence

Evidence: `outputs/keihan-arrival-review/independent-audit.json` and log, source-bound attribution in `surface-attribution.json`, and the two helper test files. The earlier partially corrected audit is retained as `independent-audit-before-final-fixes.json`.

| Actual CPU probe | Samples | Collision/body/missing-support failures | Maximum support difference | Maximum sampled step |
|---|---:|---:|---:|---:|
| Keihan P2 → south gate → bridge → Urasando → Rōmon | 25,566 | 0 | 52.890 mm | 135.814 mm |
| JR P2 → east gate → Omotesando → Rōmon | 12,204 | 0 | 44.887 mm | 199.293 mm |
| Keihan automatic open-door egress | 246 | 0 | 15.625 mm | 0.625 mm |

All probes use center and ±0.25 m lanes in both directions. They also report zero unwalkable points and zero robust coplanar-top witnesses. The stated gates are 10 mm collision correction, 55 mm support difference and 240 mm sampled step; the JR maximum step follows an existing visible crossing ribbon, not a newly authored stair.

Deliberate forward walking from the required east-facing handoff reaches `keihan-p2-outer-wall` at about 6.9 m. Its right vector is approximately `[-0.0352,+0.9994]` in XZ: south, matching the clear gate route. The actual automatic center and every sampled lateral lane remain free of collision corrections.

The assembly retains **60 interactions**, successful JR ownership and its original station sign once in the registry. Keihan retains **18 train meshes**, two moving selected leaves (`car 6 / door 2`), its threshold, exact tested world-offset motion and a registered closed-door collider. The closed doorway-center probe corrects by 0.33 m as expected.

**11/11 focused helper tests pass.** They cover real mapped corners and disconnected joins, owner/source preservation, canonical height calls, bounded 3D spacing, the two captured Float32 regression triangles, source guards, higher-owner preservation and rejection of overhead/downward support. Final diff/whitespace review covers only the four assigned new modules/tests.

Final helper SHA256 identities:

- Routes: `3fe136b453514f83b5967cb63c61d187fd77f869906102f0dea7dc482a02b79b`.
- Surface fixes: `2cd340f687e32671531c16d732d8265eae2215ea89a68306314d1483c9e5ea17`.

The JSON records all inspected integration/viewer/station/approach source hashes. Its integration hash matches the current loaded source, including the early Urasando and late street-context owners.

## Precision and remaining verification

Broad support intersection uses actual Float32 emitted triangles with 30 micrometres of edge tolerance. Coplanar diagnostics require matching plane slopes and an interior margin of two Float32 relative epsilons at the world-coordinate scale. A retained JR pavement boundary has a measured 3.64 mm² projected overlap, 1.61 micrometres of height difference and witnesses only about 4–5 micrometres from its edge. That is within source vertex quantization here; it is recorded rather than promoted to a large-area duplicate-floor claim or repaired by moving unrelated geometry. This review does not assert bit-perfect tiling at every legacy edge.

The complete sampled routes now have no blocking numerical defect. These results do not prove every unsampled street edge, exact historical dimensions, current shop conditions, native materials/glass/signs, comfortable continuous motion or acceptable frame time. Root's now-working native browser is the authority for those remaining checks; the historical JR browser-unavailable statement does not apply to the current permission state. No performance improvement is inferred from this CPU audit.
