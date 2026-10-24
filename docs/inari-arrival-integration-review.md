# JR Inari arrival integration review

Read-only initial review, 2026-10-24. No production/shared file, renderer, browser or commit used. Sources read: current viewer/integration/walking/menu/photo/HUD/collision/station owners; precinct production R96–R102; architectural environment production skill. R96–R102 remain scoped accepted packets with documented native/material/fidelity limits, not permission to move their geometry or reinterpret inferred levels as surveyed heights.

## Ownership and insertion points

- `viewer.mjs` creates the single renderer, then integrates the world, builds terrain/path/generic buildings, installs walking/HUD/photo/menu and finally calls `trace()`. Current default Omotesando spawn runs after `trace()` at the end of initialization. Replace that final spawn with arrival startup; retain the same R94 crossing as an explicit checkpoint/jump. Calling arrival earlier lets route initialization re-enable orbit controls and overwrite camera state.
- `integration.mjs` currently calls `placeMappedInariStation` after entrance paving/first torii and before neighborhood owners. It remaps the original station to `way/952687107`. Conditional `excludesBuilding` prevents the mapped station's generic shell only when placement succeeds. New station must preserve that fail-closed behavior and remove the legacy owner/collider only after its successful replacement.
- Existing station is a 17-child group: podium, solid back wall, roof, canopy, six column/base pairs and original sign. The sign belongs to `legacy.interactables`; retain its object/callback identity or explicitly preserve registry ownership. The original collider is one solid tagged `jr_inari_station`, remapped to a 24 × 5.2 m box. It will obstruct any new exit route crossing the legacy footprint unless the station owner replaces it with actual wall/column blockers.
- Static batching near integration's end merges every ordinary mesh by material/spatial cell, except original interactables and flame descendants. Do not construct moving train/doors there without an explicit animation exclusion. Build dynamic geometry after batching or give batching a precise retained-owner contract; animating an emptied parent has no effect.
- `installWalking` snapshots all colliders into `SpatialCollisionWorld` once. Build/replace all permanent station/route colliders before installing it. Updating `assembly.colliders` later does not update walking collision state.

## Camera and pause contract

The animation loop currently prioritizes guided-route motion, then photo/walker/orbit. Arrival needs one higher-priority camera owner while active; terminal free movement must release that owner once. Use the existing requestAnimationFrame and renderer. Existing delta is clamped to 0.1 s and hidden documents return before movement; retain bounded deltas and avoid wall-clock jumps on visibility return.

Menu open pauses walker and disables controls; menu close unpauses walker and can re-enable orbit. Menu movement buttons call walker.start/fly/stop directly. Checkpoint, Overview, route-follow, map-click and visit also change camera/controls. During arrival each must either cancel to a coherent final/free state or remain unavailable. Cancellation must not leave train/door progress active behind the new camera destination.

Photo mode saves camera quaternion/FOV/exposure and overlay visibility, **not position**. Pause arrival time and camera ownership while photo is active; otherwise photo close restores the old view orientation at an advanced train position. Menu and photo must each release only their own pause state; opening/closing one must not resume another still-active blocker. Replay must reset all sequence time, train transform, door transforms, camera pose and completion flags. Skip should reach one validated free-movement pose with closed doors, not merely set an elapsed timer while keeping stale geometry.

## Walking and support

`walker.teleport` accepts only positions covered by `surfaces.sample`, searches up to 2 m for an unblocked candidate and then calls `start()`, which resamples Y. Do not use it as a cinematic train-camera setter. At handoff verify actual returned pose, not only requested pose; if exact exit landing matters, prove its collision and surface coverage before invocation.

Current `walkHeight` is `surfaces.height` plus a snapshot raycast over selected legacy paving materials. Its ray starts only 0.42 m above current/base support, permits tops at most 0.24 m above that level and rejects floor hits below base −0.15 m. A new raised platform with a new material will not automatically become walkable. The route/station owners need one explicit shared support contract connecting train sill, platform, exit, street and the existing R94 crossing. Sampling only raw terrain does not prove visible pavement support.

Use the existing 0.28 m player radius and collision foot/head interval. Audit full automatic exit and onward mapped path at center and side offsets in both directions, including near platform edges, gate opening and the retained station sign. Do not solve blocked movement by dropping the player's collision radius or moving source roofs/paths.

## Environment and UI

- Existing reduced-motion handling only suppresses CSS transitions. Add explicit arrival behavior for `prefers-reduced-motion`; reduced motion and skip must still establish a valid final state and keep replay understandable.
- Night lighting updates sun/hemisphere/sky/water and **only** `legacy.lanternPointLights`. New station/train appearance needs a documented update hook or material strategy. Avoid a separate renderer, reflection capture or large new light set.
- Seasons update existing maple instances and distant canopy; new station/train materials are not automatically affected. Replay/skip must not reset light, season, audio preferences, photo FOV state or unrelated route data.
- HUD checkpoint options and quick buttons are built once during installation. Insert new station/retained Omotesando anchors before HUD installation, or intentionally update options in a single owner. Current hidden legacy place/visit controls are still moved/used by menu code.
- Keep current metadata and user's unrelated README/index/legacy EOL/R103/output changes untouched. Cache keys should refresh only edited runtime modules and their entry references.

## Required integration evidence

1. Pure sequence tests: initial moving train, monotonic slowdown, stop-before-open, open-before-exit, close-after-exit, one terminal handoff, skip/replay from every phase, paused updates and reduced motion.
2. Actual assembled support/collision audit: all automatic camera foot positions, final handoff, station exit to existing Omotesando crossing; static collision snapshot includes the final owner and excludes the replaced legacy solid.
3. Static/diff review: no animation meshes lost to merging, conditional generic exclusion, original sign interaction identity, one renderer/loop, guarded failed build, finite transforms and bounded geometry.
4. Serialized permitted visual review: initial door-facing moving view, stopped/open doorway and platform, automatic exit, closed doors, station-to-street framing, previous crossing and night. Native browser verification remains bounded by existing local-browser access restrictions; CPU/static checks cannot establish native input/appearance.

This document is integration guidance, not implementation or visual acceptance.

## Independent assembled review, second pass

Evidence: `outputs/inari-arrival-review/audit.mjs`, `independent-audit.json` and `independent-audit.log`. The report records SHA256 hashes for the five loaded station/integration source files. Actual CPU `integrate()` was run after batching, with the final rendered terrain clipping chain and existing path meshes. No renderer or browser was launched by this reviewer.

The first pass exposed platform geometry crossing the descending stair, insufficient ticket-gate clearance at ±0.25 m, and route-edge sampler/Float32 discrepancies. The station/route owners corrected their geometry and samplers before the second pass.

- Full Platform 2 → stairs → ticket gates → east exit → mapped street margin → retained crossing → first torii: **3,498 samples**, center and ±0.25 m, both directions. Zero collision correction, body intersections, missing support or unwalkable samples. Maximum sampled height step **0.150 m**; maximum absolute support difference **0.0280 m** on center and **0.044914 m** on side lanes.
- Automatic open-door disembarkation: **204 samples**, the same six lanes. Zero collision correction, body intersections or missing support; maximum support difference **0.015910 m**. Only this automatic crossing excludes the intentionally closed doorway collider.
- Station replacement dataset records **60 interactables before and 60 after**. The original station sign remains attached and occurs once in the original registry, retaining its 5.4 × 0.85 × 0.14 m geometry and interaction data. The obsolete solid station collider is absent. The closed-door collider is registered and pushes a doorway-center probe by **0.35 m**.
- The dynamic train retains **15 meshes** after static batching. Its measured world-bound center moves exactly [0,0,−3] for the test offset. Exactly the two selected door leaves move; the threshold retains its mesh.
- Constructor failures are now caught before sign transfer or legacy removal. Frontage preflight also declines before allocating geometry on invalid street/source contracts. The original sign's retained material receives the new night-lighting update.
- Sequence/adapter tests: **20 passing**, including deferred skip while menu/photo owns the pause and discarding a queued skip on cancel/replay. Code review confirms the pending handoff waits until the blocker closes.

Support intersection uses actual emitted triangles and a **30 micrometre edge tolerance** for Float32 boundaries. Two neighborhood probes intentionally within that tolerance of a stair riser report the upper edge while the sampler selects the lower tread; these are boundary diagnostics, not the persistent 15 cm platform/stair intersection found in the first pass. A separate strict ray from the route owner identifies a submillimetre inherited crossing-mouth seam between averaged crossing axes and the existing road miter: pavement returns at ±1 mm. Its exact correction and final visual disposition remain root-owned. Do not infer perfect surface continuity from the tolerant sample pass.

Native appearance, keyboard/pointer behavior, photo output, dynamic visitor rigs and FPS remain unverified by this CPU review. Root owns the final serialized visual views, remaining crossing decision and release acceptance.

## Final frozen-source audit

The final actual assembly was audited at **2026-10-24 03:45:09 UTC**, after the selected opening moved to car 2 / door 4, the inferred rail-frame lateral correction became approximately **0.585249 m**, the crossing-mouth seal was corrected against actual road quads, and the hall's overlapping landing tongue was replaced by two external tongues. The root also added the shop kickplate. `independent-audit.json` now records this final snapshot and the hashes of all five relevant source files; the preceding second-pass metrics are historical.

- **3,360 public-route samples** across center/±0.25 m and both directions: zero collision correction, body intersections, missing support or unwalkable samples. Maximum sampled step remains **0.150 m**. Maximum absolute support difference remains **28.0 mm center / 44.914 mm sides**.
- **204 automatic egress samples**: zero body intersections or missing support. Center has zero collision correction. One physical +0.25 m side strip has up to **6.778 mm** correction against an existing P2 navigation safety edge, below the explicit 10 mm audit gate; its reversed equivalent produces the same result. The actual automatic camera center is clear. Exact per-collider attribution is recorded in `auto-lateral-correction.json`; do not describe all lateral corrections as zero. Maximum support difference is **15.910 mm**.
- **98 strict assembled crossing-mouth neighborhood samples**, including ±50 micrometres, ±0.1 mm and ±1 mm in both horizontal axes: zero failures with **no barycentric edge tolerance**. Maximum difference to the highest actual rendered top is **12.486 mm**, at existing decorative gutter geometry. Independent strict Three.js rays against the route-only emitted mesh also pass all 98 locations with maximum height difference **1.62e-8 m**. The previously reported missing-top seam is corrected within this checked domain.
- **21 irregular hall-floor probes** count strictly interior upward triangles at the exact public level: maximum one top per sample, zero duplicate points. This specifically checks the coplanar tongue overlap that a single highest-hit support query could not detect.
- Replacement remains **60 → 60 interactions**, original sign attached/registered once, obsolete station solid absent, and closed-door collider present. The train retains 15 postbatch meshes, exactly the two car 2 / door 4 leaves animate, and the threshold remains attached. Recorded world-bound movement still matches the test offset exactly.

The independent layout/section visual review is in `docs/review-inari-arrival/layout-visual-review.md`. Final root-owned images and their native/material limitations remain separate from these numerical acceptance results.

## Final landing and handoff-target recheck

The last frozen assembly was re-audited at **2026-10-24 03:55:32.926 UTC**, after removing a duplicate upper-stair landing box and retargeting the unchanged platform handoff position toward `stairBottom`.

All previous numerical results remain unchanged: 3,360 public-route samples have zero collision correction/body intersections/missing support; 204 egress samples retain zero center correction and at most 6.778 mm of attributed lateral safety-edge correction; all 98 strict crossing-mouth probes pass. The new **nine upper-landing probes each count exactly one upward P2-level top**, with zero missing or duplicate tops. The 21 hall-floor probes also remain exactly one top each. All preservation and train/door motion checks remain unchanged.

Updated SHA256 source identities:

- `inari-station-arrival.mjs`: `563d7b0d88b97a1116ad6b7b9d630834a5238c91b7fc780b3822f8c8631c9514`
- `inari-station-arrival-spec.mjs`: `667c525c04de96d7de3040d4564e128a57d74099af7573a28fd3d176c46bfd5f`

Integration, route and frontage hashes remain the same as the preceding snapshot and are recorded together in the final `independent-audit.json`. No blocking numerical regression found. No production source was changed, and no renderer or browser was launched by the reviewer; the harness constructs the actual CPU assembly. Native QA remains unavailable.
