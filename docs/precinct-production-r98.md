# R98 — Readable Shin-ike water and resumed workflow

The user resumed work after the R97 pause and reported that the pond did not read as water. Inspection found a muted, relatively rough standard material with tiny normal perturbations but no environment reflection. R97's horizontal level, mapped shoreline, terrain cut, architecture and walking surfaces remain unchanged.

Shin-ike alone now uses a physical dielectric material with water IOR 1.333, zero metalness, roughness 0.15 in daylight / 0.14 at golden hour / 0.17 at night, and stronger analytical normal ripples. Its olive palette remains; the existing generic pond/lake settings are preserved. There is no transmission render pass or vertex displacement.

The user subsequently reported that the water looked quite good and requested slightly more transparency. Shin-ike now uses 92% opacity, no depth writes and a single transparent pass for its double-sided horizontal surface. An opaque dark silt backing covers exactly the mapped polygon 0.6 m below the surface, adding only eighteen triangles and preventing the terrain cut from showing a void. This depth is a visual substrate, not a bathymetric survey. The accepted gloss, reflections and ripples remain unchanged; transparency still needs user visual feedback.

The user's additional boundary question triggered a fresh photographic audit. Independent wide views show natural wooded opposite banks, not a continuous red perimeter fence. The photographed rear passage does show a southwest terminal return missing from R97. That short 1.70 m closure is now attached to the existing rail, masonry and registered pavilion, adding 528 triangles and one collider without new draw batches. Full public-path footprints plus player margin remain clear. A separate gray parapet near Nankiri Fudo is observed but its endpoints remain unregistered, so it was not invented. See [boundary references](shinike-boundaries-r98.md).

`shinike-reflections.mjs` captures the actual scene surroundings into a 128-pixel cube and prefilters it for the physical material. The sky dome remains within the capture far plane. Water surfaces, route overlays, visitor groups and personal flashlight are excluded during capture; original visibility and renderer state are restored afterward. The existing forest chunks are temporarily culled around the pond instead of the main camera. No arbitrary hidden architecture is enabled.

Capture is deferred until the camera enters a 220 m radius. It runs once per lighting/season/building-toggle/canopy-toggle combination encountered, then reuses the texture across frames and camera movement. It uses six scene views plus PMREM filtering, not six total GPU draws. Only one filtered environment is retained; superseded resources are disposed. There is no recurring reflection pass or additional geometry. A failed refresh retains the last working reflection and does not retry every frame.

The independent reviewer reproduced two real failure cases in the installed Three r164 PMREM implementation: a blur exception left `autoClear` false and abandoned an unpublished output target. The final implementation restores that state and tracks the synchronous conversion's first bound output so it can be released even if conversion throws. Regression tests execute the installed CubeCamera and PMREM control paths with a fake renderer, covering both failure and success, ownership, method/state restoration and cache frequency. They do not compile GLSL or execute native GPU rendering.

## Verification and limits

- Reflection/material focused suite: 13 passing tests.
- Full repository suite: **560 passed, zero failed**, using `node --test --test-concurrency=4 fushimi_inari/integrated-world/*.test.mjs fushimi_inari/geography/*.test.mjs`.
- Fresh assembled geometry: 36 connected route checks remain zero-shove with valid heights; the third rail return, fixed water level, exact backing and original shrine callback all pass. Evidence is packaged in `docs/review-r98/`.
- Viewer/module syntax and completed diff reviewed independently.
- Local server restarted on port 8420 after the user reported it was down; HTTP 200 and the `98-water2` version were verified.
- The user confirmed that the new reflected water looked quite good. No independent native browser appearance or FPS measurement is claimed; the prior browser access restriction remains respected. Diagnostic CPU geometry renders only review the added rail, not the shader/reflection change.
- A single local cube is an approximation: it has no planar-reflection parallax, changing visitor reflections or continuously refreshed shadows. It reuses the existing main-view shadow cache to avoid six new shadow-map renders. First capture and mode changes incur an unmeasured one-time GPU cost; steady frames only sample the filtered map and update ripple uniforms.

The user requested resumption of the established multi-agent production flow. The existing continuation heartbeat was reactivated, preserving its schedule and scope. The latest foreground priority is visual feedback on the water; broader precinct limitations from R96/R97 remain outstanding rather than being declared complete.
