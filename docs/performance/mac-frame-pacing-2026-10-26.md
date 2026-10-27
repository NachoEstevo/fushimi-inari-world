# Mac frame pacing — 26 October 2026

The local checkout was fast-forwarded from `802d92f` to `7c18302`; implementation is on `codex/mac-frame-pacing`. Files touched by synchronization were archived first under `.tmp/before-mac-sync-20261026-221331.tar.gz`. Existing unrelated local changes and earlier QA snapshots remain intact. This report continues `HANDOFF-MAC-PERFORMANCE.md`; it does not repeat its rejected subdivision/concurrency experiments.

## Changes and causal evidence

Every walking preparation owner previously traversed the entire visible world to collect lights. With 3,035 registered owners this delayed serial preparation considerably. `createCompilationLightIndex` discovers membership once, then checks current ancestry, visibility and camera layers on each use. Deferred preparation invalidates it before compilation, and root child additions/removals invalidate it again after activation. Live scene, camera, material, instance-buffer, render-target and shadow ownership remain unchanged. Synthetic collection timing is not a game benchmark.

Residual expensive builders were still constructing main-camera materials for bounds 161–201 m from the camera while its far plane was 100 m. Sphere/plane frustum intersection can admit objects completely beyond the actual frustum. The existing conservative static cull is now enabled by default: it skips only immutable, explicitly owned bounds wholly outside a sphere containing every far-plane corner. It does not shorten the view, alter LOD, change assets/materials, or cull shadow/reflection cameras. Photo FOV/aspect changes recompute that sphere. `?prewarmCull=0` retains a diagnostic comparison path; `prewarmHeadroom` remains off by default.

The visitor gait now reuses three matrices per rig and removes per-frame arrays/link objects. Regression tests compare exact world matrices with the previous algorithm across all three GLB rigs, moving roots, nonuniform scale and variable animation weights. This removes an allocation source; no isolated GC or FPS improvement is claimed for that change.

## Measurements

Mac M4 Pro / WebGPU / Three r180. The same 1280×720 viewport, Balanced/Natural/day, DPR 1.25, atlas 2048, live streaming/prewarm, 10-second requested anticipation and existing 16-second Mitsurugi out/back route were used. `headroom` stayed off. The comparison is sequential, one first-exposure observation per variant; OS/driver cache variance is not controlled.

| Fresh scene variant | Build observer | p99 interval | Worst interval | Builds during visible render |
|---|---:|---:|---:|---:|
| Synced baseline | On | 111.27 ms | 325.0 ms | 103 |
| Light index + rig reuse | On | 16.70 ms | 66.6 ms | 40 |
| Above + conservative static cull | On | 16.70 ms | 26.7 ms | 14 |
| Index + original static-cull pass | Off | 16.70 ms | 25.1 ms | Not observed |

A warm repeat after the light-index change had p99/worst 9.4/9.4 ms with no new builders. These are RAF intervals and CPU observations, not GPU timings. The uninstrumented first exposure for that initial pass was repeated after test processes finished; a preliminary run overlapping tests was discarded.

Normal controls were also exercised through native held keys and mouse drags, with no camera-driving audit active:

| Already prepared sector | Actual movement | p99 | Worst |
|---|---|---:|---:|
| Balanced/Natural, W/S | 7.61 m in 16.01 s | 10.2 ms | 10.4 ms |
| High/Sakura/sunset + flashlight, W/S/D/A + turns | 9.44 m, 1.56 rad | 10.3 ms | 66.4 ms |
| High repeat after mouse-control activation | 17.31 m, 1.56 rad | 10.0 ms | 16.7 ms |

The first High input capture retained two approximately 60 ms gaps near the first native mouse drag. Main-frame CPU update remained at most 1.5 ms and submission at most 8.1 ms. The repeat improved, but this does not prove the cause of those two gaps. Do not claim the whole world is hitch-free from these observations.

The portable [JSON](mac-frame-pacing-2026-10-26.json) includes settings, counts and limits. Full fresh-source preparation still performs synchronous node builds on the main thread; the change gets useful work ready earlier and avoids impossible draws, rather than changing Three's cache keys or sharing instance bindings.

## Continuous entry exposed a second bottleneck

A subsequent fresh station → Rōmon run at the existing **12 m/s inspection speed** (much faster than normal walking) still paused for 300.1 ms. Explicit refinement timings showed Romon architecture and wing passes of 104.4 and 117.4 ms. Those heavy synchronous owners were not solved by the initial mountain preparation fix.

The shrine refiners now expose cooperative generators. Their existing synchronous APIs drain that same logic for bakes and tests. Source-triangle signatures, filtering, attribute copies, roofs, joinery and merges yield between small pieces; the asynchronous driver groups them into a 4 ms CPU budget with a 128-step fallback, rather than creating thousands of clamped timers. Stage timing reports peaks without serializing every tiny iteration. Pre-edit digests are pinned per engine revision where needed: the original r164/r180 ConeGeometry output differs, and independent old-HEAD runs verified both expected outputs. Gehaiden and Naihaiden share the same treatment. Deferred shader submissions now prepare one leaf at a time.

Romon R95/wing steps were at most about 2 ms in the browser capture; source output is protected by pre-edit geometry digests and full synchronous/cooperative building equivalence tests. The 4 ms budget is cooperative: native copies, bounds or a single shader build cannot be interrupted.

A remaining 70 ms CPU render frame was correlated by exact timestamps with construction of mapped boundary materials outside the view. Their builder now supplies its explicit immutable root to the cull registry. Sloping walls contain affine shear: they previously had to be excluded from a sphere shortcut. They now use a conservative transformed Box3 envelope; the original sphere path remains for other owners. Tests cover visible vertices under instance/world shear, near walls, distant rejection, shadows and unchanged builder output. Animated, skinned, morph and vertex-displaced owners remain excluded.

| Fresh continuous entry, first 16 s | Worst RAF interval | Maximum CPU render submission |
|---|---:|---:|
| Initial index/cull changes, before geometry slicing | 300.1 ms | 54.9 ms |
| Romon cooperative geometry | 90.7 ms | 69.9 ms |
| All shrine slicing + serial shader batches (build observer on) | 65.7 ms | 69.9 ms |
| Explicit mapped boundary ownership | 59.2 ms | 57.2 ms |
| Final conservative affine bounds, observer off | **25.1 ms** | **17.5 ms** |

The final first segment actually moved 191.16 m with 4.26 radians of accumulated turning; p99 was 16.6 ms. The following 16 seconds moved another 191.98 m with 3.87 radians of turning; p99 was 16.51 ms, worst 25.1 ms and maximum CPU render submission 7.2 ms. Both ran with live streaming and without the build observer. These are single sequential observations; the second segment is not a matched starting pose across earlier runs. No uncaptured WebGPU error was recorded.

## Verification and reproduction

- Final general suite: 1,135 passed, 21 skipped. Final r180 suite: 132 passed. Earlier focused integration checks: 33 passed. Groups overlap; do not add the counts as distinct tests.
- Syntax, changed-file whitespace checks and static build passed. Existing untracked historical `.qa-before*` files were preserved and are included by the current build script; no deployment was made.
- Browser checks: WebGPU backend, no recorded uncaptured GPU error; normal walking/looking, High transition, Sakura/sunset/flashlight, 85° photo FOV, 180° photo pan, 3840×2160 PNG export, panoramic resize and viewport reset. These checks are local and do not establish all-sector or BFCache acceptance.

Serve `fushimi_inari` on localhost. Browser dependencies remain pinned to r180. The Mac browser's initial CDN import stalled, so QA served the identical installed r180 package from the ignored `.tmp/webgpu-runtime` directory using an ignored local server; product URLs and dependencies were not changed.

For deterministic first exposure, open `integrated-world/index.html?audit=1&intro=0&shadowAudit=1&shadowCells=legacy&shadowFreeze=0&shadowFlow=live`, select Preview start, wait 10 seconds in the same automation call, and Run shadow route. Add `pipelineAudit=1` only when identifying builders. Read `shadowRouteAudit`, `walkingPrewarmAtEnd`, and optionally `renderBuildAuditAtEnd` from body datasets. Do not add `shadowWarmup=1` to a first exposure.

For real input, add `frameAudit=1`, close any camera-driving capture, enable Walk and use Record movement 16s. The opt-in recorder leaves camera and gameplay ownership alone; it reports movement/rotation, RAF percentiles and CPU update/submission separately, aborts when hidden, and bounds stored samples. Its final dataset is `movementFrameAudit`. Normal visitors do not load this diagnostic.

Further acceptance should extend the measured continuous station approach through Senbon and longer mountain routes on the user's usual browser/resolution. Investigate any reproduced pauses with the recorder before increasing cinematic quality; maintain the current static-owner contract when adding animated/displaced assets.

Final visual export: `outputs/mac-frame-pacing-2026-10-26/romon-final-4k.png` (ignored local QA artifact). The local browser remains on the tested scene; no remote deployment or push was performed.
