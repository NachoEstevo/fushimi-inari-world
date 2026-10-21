# R33 — Reception, ground cover and outlooks

- The counter now has a real wall opening and recessed backdrop. The former solid building/decal facade occluded the new attendant when positioned behind the counter; the opening fixes this without moving her through the facade.
- Reception reuses the accepted CC0 Quaternius Kimono_Female asset. Its private materials use ivory/red, hands are reduced, and a two-bone reach overlays the original idle animation. The registered interaction root, stamp, page, cooldown and seal are preserved. The previous model remains available if loading fails.
- Ground cover blends green tones with the existing fine surface detail. A per-vertex mask excludes urban lowlands, path margins and steep banks. Courtyard gravel overrides this layer. This is an inferred vegetation envelope, not a surveyed lawn map. No new grass objects or texture downloads are added; existing terrain chunking stays intact.
- Kojingamine and the western viewpoint now face southwest, following the `direction` tags on OSM nodes `749327432` and `9673171303` in the checked-in geographic data. Small openings in generated forest improve the view. Opening widths are interpretive; mapped paths, heights and original buildings remain unchanged.
- City facade detail retains its proximity gate. No additional character files or dependencies are shipped.

## Verification

84 Node tests pass, including bare-path/urban/slope exclusions, green outlook margins, bounded southwest view openings and existing mapped route connectivity. JavaScript syntax checks and `git diff --check` pass.

The existing browser tab was reused for visual inspection of the attendant and ground materials, the three outlook checkpoints, a short movement check at the western outlook, and requesting a commemorative stamp through E. Local captures are in `fushimi_inari/outputs/r33/` (ignored). A reserved GLSL identifier was caught in the first preview and corrected; no later shader compilation error was observed.

This is not a full walking audit or a stable FPS benchmark: the browser frame rate varied with app activity during inspection. The urban panorama remains an approximation of mapped building volumes, and some tree silhouettes and shrine details still need refinement. Character clothing and the stamp gesture are stylized interpretations.

The README now identifies the integrated viewer as the maintained source. The historical bootstrap script does not reproduce later revisions and must not overwrite it.
