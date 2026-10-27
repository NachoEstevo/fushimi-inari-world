# Cinematic lighting and renderer diagnostics — 27 October 2026

## Delivered behavior

- Golden hour uses a shared world sun direction at 3.49 degrees elevation, red-orange solar disc, warmer key/fill and coherent sky/fog horizon. Day and night energy remain separate; Natural, Sakura and Dreamcore retain their modes.
- Balanced view distance is 150 m; High (including the legacy Ultra alias) is 200 m. Pixel caps and the 2048 shadow atlas are unchanged. Checkpoint preparation now uses the camera's enclosing corner radius, capped at 300 m, instead of the old 180 m ceiling.
- High adds sparse local artistic haze shafts near wooded route openings. Fifteen deterministic sites were admitted by the current crown collection. At most eight ribbons share one instanced, single-pass draw, with no new lights, textures, render targets or shadow passes. They originate at canopy height, align with the sun, soften across/along the beam and fade with distance; known conservative roof boxes reject intersections and normal depth testing provides opaque occlusion. They are disabled in Balanced and at night. This is not physically simulated, occlusion-sampled volumetric lighting.
- High station metal and green paint have a softer roughness/clearcoat response. Balanced restores the exact previous station scalar values. Existing maps/material identities remain shared. Shrine painted wood uses a single dielectric lobe, removing its nearly-zero secondary clearcoat graph while retaining authored maps and source restoration.
- The large plain shrine volumes are inferred OSM envelopes, not failed downloads. Visitor rendering omits 54 unresolved religious envelopes after detailed-building exclusions. POIs, source polygons, route topology, support/collision data and detailed architecture remain. Ordinary context retains its previous rendering. `mappedProxies=1` explicitly restores the new omitted envelopes for inspection; it does not override the older two-footprint precinct policy. No new shrine assets or surveyed facades are claimed.

## Frame-pacing protection

The new range exposed additional sphere/frustum false positives. One captured High render took 130.1 ms CPU and included an unprepared architecture owner whose bounding sphere's nearest point was 251.8 m away. A sphere enclosing all view corners cannot reject every impossible draw. Static owners now also retain conservative world boxes and test them against the actual projection frustum. Expanded bounds preserve tolerance, affine/sheared instances, photo projection changes and the existing immutable-owner contract. Shadow/reflection cameras bypass this filter; displaced, skinned, morph and animated/custom owners stay excluded. Tests reproduce an admitted sphere with every vertex beyond the far plane and preserve newly visible geometry after a projection change.

The additional boxes have a one-time installation cost. No isolated loading-time improvement is claimed. Node builds remain synchronous per individual shader; cooperative submission cannot interrupt one build. Fast routes and first exposure can still hitch, and neither this change nor the observations below establish a hitch-free world.

## Final real-control observations

Mac M4 Pro, Brave 156, WebGPU/Three r180, 1280 × 720 CSS viewport; visible selected test tab, one active game renderer, Natural/day, prepared Senbon sector. W held eight seconds followed by S held eight seconds using native input. Both captures completed normally with real displacement. High used DPR 1.5; Balanced DPR 1.0 under this browser viewport override. These are sequential observations, not matched randomized trials or Windows acceptance.

| Preset | Actual movement in ~16 s | Mean FPS | p99 interval | Worst interval |
|---|---:|---:|---:|---:|
| High | 77.93 m | 101.14 | 16.8 ms | 25.0 ms |
| Balanced | 78.16 m | 120.00 | 9.3 ms | 9.4 ms |

`frameAudit=1`, `pipelineAudit=1` and `gpuAudit=1` were enabled; observations are RAF intervals and CPU submission, not GPU timings. Raw final captures are in ignored `outputs/cinematic-lighting-2026-10-27/final-real-walking.json` and `final-real-balanced.json`.

Earlier iteration captures included 83–108 ms pauses on a 12 m/s inspection run, a 133.4 ms architecture-entry pause, and up to 383.5 ms on a fresh Brave run. Tab foreground state and compiler/driver warm-up were not held constant across those experiments; some loading waits occurred with the test tab hidden. Later controlled visible-tab iteration runs at 12 m/s retained maxima around 41 ms. These records are retained locally rather than presented as controlled before/after proof. The final warm real-control captures above do not erase cold-start limitations.

## Windows green-screen investigation

The original report is Windows / Brave / kyoto.nachoestevo.com, after walking for a while, not a specific zone. No green screen was reproduced on this Mac. The previous `gpuError` dataset only observed uncaptured WebGPU errors and could miss device loss entirely.

`renderer-health.mjs` now observes `device.lost`, uncaptured errors and WebGL context loss/restoration without replacing Three's handlers or auto-reloading. A confirmed loss stops further main-loop/prewarm updates and presents explicit export/reload controls. `gpuAudit=1` enables one sample every five seconds, a bounded 120-sample history and local JSON export. It records texture/geometry object counts, backend, quality, camera and preparation context; these are not VRAM-byte measurements. Errors are bounded to fifty records and no report is sent remotely.

A retained seven-minute iteration diagnostic showed texture object counts reaching 166 and remaining there, with no recorded GPU error/loss. A final 11.3-minute diagnostic retained 120 bounded samples, zero events and a final count of 162 textures / 1,378 geometries. Those observations does not rule out Windows memory pressure, driver failure or another cause. The root cause remains unconfirmed until a report from the affected Windows session is captured.

## Verification

- General suite: 1,145 passed, 21 skipped.
- Focused r180 suite: 101 passed. Groups overlap and must not be summed as distinct tests.
- Syntax, scoped whitespace checks and static build pass. Static build: 569 runtime files, 70.08 MB; unchanged historical local QA artifacts remain preserved under the existing build policy.
- Browser: High/Balanced and day/gold/night changes, shafts absent in Balanced/night, real W/S, photo FOV 84 degrees, 3840 × 2160 PNG export. Actual source uses import-map version `cinematic-5`.
- Final day export: ignored `outputs/cinematic-lighting-2026-10-27/final-senbon-4k.png`. Final sunset export: `outputs/cinematic-lighting-2026-10-27/final-sunset-4k.png`. Solar-disc sunset was also inspected from the Western trail overlook; it can naturally be occluded by trees from other viewpoints.
- Independent code review covered projection bounds, immutable ownership, resource disposal, policy consistency and cache aliases.

For Windows reproduction, open the published scene with `?intro=0&gpuAudit=1`, walk normally and export the local diagnostic after the symptom (before reloading if possible). Use `frameAudit=1` separately for movement timing. No claim is made that the original green-screen failure has been fixed.
