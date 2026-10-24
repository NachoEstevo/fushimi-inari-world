# Ambience and storefront refinement — 2026-10-24

- Recorded footsteps gain: 0.32 -> 0.24; cadence unchanged (Slow .52 s, Fast .44 s, sprint .38 s).
- Window blur clears held keys and dragging without stopping Walk/Fly. Menu pauses free movement and guided routes without changing ownership; closing resumes the prior mode.
- Chimes checkbox checked by default, still subject to sound enable/mute.
- Two Keihan shop recesses: rear stock shelves and packages; soft-serve dispenser and supported worktop. Interpretive inventory, not newly verified real stock. Existing batches/colliders retained.
- Day: balanced warm sun / cooler fill. Sunset: lower warm sun and peach horizon. Night: stronger moon/fill with warm localized trail lighting.
- 91 grounded path markers in live assembly, main/return/twin paths. Two instanced meshes and one halo point draw. Three nearby shadow-free point lights reuse existing lantern positions as well; legacy lantern point lights disabled to avoid expanding shader light counts at night. Markers are interpretive, not a survey of actual installed fixtures.

Validation: 814/814 existing + new tests passed (prior unrelated r103 tests excluded as in previous verification). Final geometry-only base/worktop adjustments: 12/12 focused tests passed. Diff whitespace check passed. Browser: Day storefront, Sunset Senbon, Night Senbon/Yotsutsuji/aerial inspected; chimes checked, Escape kept Walk, W while paused left camera fixed. No browser error logs. Screenshots in outputs/ambience-polish. No FPS benchmark or auditory listening comparison; no claim of exact reconstruction. No deployment or commit.
