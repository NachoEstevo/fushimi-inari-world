# R31 — Exploration UI and stylized precinct models

The existing world, paths, seasonal controls, camera modes and activities remain in place.
This revision changes presentation and replaces the two entrance fox models and the
reception attendant. It does not claim photogrammetric accuracy.

## Design direction

Applied the requested design-taste-frontend app workflow: framed-sheet, seed
405679156, retaining the existing type stack and white/Japanese-red palette.
The central question is “Where am I, and where can I go?” A small torii mark and
large live place name provide the main visual identity.

Inventory: location identity; menu trigger; photo trigger; following minimap;
movement controls; destination list; route planner; environment and sound controls.

The review addressed three main weaknesses: low-contrast glass controls, a weak
place-title hierarchy, and visually undifferentiated buttons. The menu now uses a
white content sheet within a tinted navigation frame. Active movement modes use
dark ink; destination actions use red. Mobile navigation becomes a horizontal row.
Map colors match the light interface. Focus, disabled and selected states remain
distinct; checkpoint arrows do not alter accessible names.

## Models and cost

The original procedural kitsune has a tapered muzzle, narrow eyes, pointed ears,
paired forelegs, haunches, curved tail and a draped vermilion bib. Pedestals and
existing interaction registration are retained. The attendant has a tapered jaw,
neck, tied hair, small facial features, draped sleeves, hands and crossed collar.
The stamp activity still animates the figure and stamp.

Geometry is merged by material: four meshes per kitsune and seven for the
attendant. Existing proximity-gated animation is retained. No dependencies or
external model assets were added. This reduces submission overhead relative to
rendering each modeled detail separately; it is not a measured whole-world FPS gain.

An external candidate, [Inari Kitsune Statues](https://sketchfab.com/3d-models/inari-kitsune-statues-179b514bca304d62986570793dddb450),
was researched but not imported. The implementation remains original and stylized.

## Verification

- 78 Node tests passed; model and menu module syntax checks passed.
- Inspected UI screenshots at 1440, 768 and 390 pixels wide using the existing
  browser tab. No additional WebGL instance was opened. Restored the normal viewport.
- Reviewed final kitsune and reception views by walking in the world.
- Teleporting to reception and requesting a stamp returned the expected activity result.
- Browser console reported no errors during this review.
- Style lint: zero failures and seven warnings. Small context labels and shadows
  on overlays/crosshair are intentional. The skill's separate browser inspector
  was not run; responsive review used the existing controlled browser instead.
- Local evidence: `fushimi_inari/outputs/r31/` (generated, ignored).

Remaining limits: these are stylized figures, not production character scans or
fully rigged crowds. Mobile layout was emulated, not tested on a physical phone.
No new full-world frame-time benchmark or high-resolution photo-export benchmark
was performed in this revision.
