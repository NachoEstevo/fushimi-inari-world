# Golden hour and bounded High lighting

The user's reference and explicit request define the direction: orange/red golden-hour light, a low red sun, 50 m more view range for Balanced and High, and soft shafts in selected wooded torii areas in High. Balanced keeps its existing material response and has no shafts. The Windows/Brave green failure is duration-dependent, not tied to a known place; it is not yet reproduced on this Mac.

## Rendering design

Use one shared sun direction for the visible disc, directional light and leaf atlas, with coherent horizon/fog colors. Balanced uses 150 m and High/Ultra 200 m. Retain existing pixel caps and shadow atlas. High station finish changes only scalar roughness/clearcoat values on existing materials, preserving identities and Balanced restoration.

For light shafts prefer a small, deterministic set of sun-aligned, camera-facing ribbons in wooded route openings. Each uses a soft analytic cross-section, end fade and near/far fade. Raster depth testing allows torii/buildings to occlude it. Reject candidates against supplied conservative roof bounds; the effect is artistic local haze rather than physically simulated volumetrics. One shared instanced draw, no new lights, shadow maps, textures, render targets or fullscreen pass. A full raymarch was rejected for cost; screen-space radial rays were rejected because they depend on seeing the solar disc. Validate visually for cards, seams, geometry penetration and excessive brightness.

## Failure investigation

Record WebGPU device loss and uncaptured errors, plus WebGL context loss, preserving Three's handling. An explicit gpuAudit query enables a bounded history and local JSON export, never remote telemetry. A real loss presents export/reload controls; do not silently restart or claim the reported green screen is fixed. Track object counts rather than claiming VRAM byte measurements.

## Acceptance

Tests cover sun/fog agreement, quality distances, material restoration/identity, bounded diagnostics and lifecycle, and shaft quality/night gating, budgets and roof rejection. Browser acceptance includes Balanced/High, day/gold/night, torii depth occlusion, walking frame intervals, a longer route, photo export and GPU logs. Windows diagnosis remains conditional on capturing the original environment.

## Unmodeled shrine context

The large plain volumes reported along the mountain route are inferred OSM extrusions, not failed downloads. Keep detailed architecture and geographic POIs. Omit unresolved religious envelopes with neither numeric height nor levels from visitor rendering and the horizon. An explicit `mappedProxies=1` inspection URL restores these envelopes. Ordinary neighborhood context and measured envelopes retain their existing rendering; do not imply that new architecture was reconstructed.

## Shader and culling budgets

Use a single dielectric lobe for the shrine painted-timber finish; remove its nearly-zero secondary clearcoat graph. Preserve authored image/normal/roughness maps and exact restoration of source ownership. Expand the static-owner cull with conservative world boxes against the actual projection, retaining the enclosing sphere fast path and excluding other cameras, animation, skin/morph and custom displacement as before.
