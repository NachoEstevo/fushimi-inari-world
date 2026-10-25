# Validation and performance

This page retains the observations behind the README's performance figures. They describe the 24 October 2026 release work around commit `2c69161`; they do not validate subsequent uncommitted changes.

## Recorded desktop observations

- The release report recorded 823 passing tests after the Ultra resource-disposal and photo-layout changes.
- At a 1467 × 852 viewport and DPR 1, brief Rōmon samples measured approximately 101 FPS with Balanced and 63 FPS with Ultra; Shin-ike samples measured approximately 147 / 87 FPS. Moving characters and water were not frozen. These are local observations, not controlled GPU timings or hardware requirements.
- Native review covered Rōmon, Shin-ike, day/sunset/night, alpha vegetation, emissive surfaces, water and photo export. Ultra exported a 3840 × 2230 PNG and returned to viewport rendering. The desktop photo buttons were checked for equal bounds.
- A Balanced → Ultra → Balanced cycle at Kumataka returned from 156 to the original 149 textures and from 2242 to 2241 geometries. Resource counts are not memory measurements or a full-session leak test.
- Browser decoding succeeded for six rail/station clips, retaining Japanese-then-English announcement order.

Raw evidence remains in local `outputs/ultra-quality-review/`; historical diagnostic packets are archived separately. The three README WebPs are compressed copies of photographs exported from the viewer.

## Rendering and audio boundaries

Balanced is the default. Ultra adds bounded supersampling, larger shadows, ambient occlusion, stronger texture filtering and farther nearby detail. Returning to Balanced/High releases the extra postprocessing resources. These settings refine the existing scene; they do not change the accuracy of the reconstructed buildings.

The crossing recording's runtime encoding fell from 2,393,849 to 1,326,414 bytes (44.59% smaller). Full decode passed; this does not demonstrate perceptual transparency or lower decoded Web Audio memory. Original source and asset attribution are retained locally and beside the runtime assets.

## Checks for future changes

Run the focused tests for changed behavior and the relevant geography/integration suite described in [run and host](run-and-host.md). Use a real browser for materials, shaders, input, camera clearance, audio timing and UI. Compare performance at the same pose, viewport, quality and cache state, with one viewer active.

Full current-route clearance, mobile/low-end GPUs, production hosting, network latency and long-session memory behavior are not certified by these historical observations. New source or asset changes require their own validation. See [architecture](architecture.md) and [sources and reconstruction limits](sector-review.md).
