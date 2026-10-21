# R59 — Omotesando side shrine court and vegetation

Directly inspected in the browser:
- https://fushimiinari-guide.com/wp-content/uploads/IMG_6470_20210313.jpg
- https://fushimiinari-guide.com/wp-content/uploads/IMG_7698_20210405.jpg

The first shows three distinct small shrines, low red/gray enclosures, a stone
torii at Reikon, rough retaining stone, a rear red fence and a fine gray mineral
forecourt. The second shows dark asphalt inside the bicycle-parking entrance.
These are 2021 appearance references, not surveyed dimensions or current-state
certification. The broader source inventory is in the companion research note.

Implemented:
- Three shrine bodies at exact source POI centers, with different roof forms,
  white/vermilion versus dark timber, paired doors, plinths and stone torii.
  Architectural dimensions are explicitly estimated. Bodies and torii have
  colliders; Reikon's short stair surfaces also register walking heights.
- Six exact fence/retaining lines with source openings and available tagged
  heights. Rear red rail sits above the 1.5m retaining level seen in the photo.
- Fine gray forecourt within an estimated envelope bounded by the mapped
  retaining lines. Complete grid cells exclude mapped buildings and paths;
  terrain is unchanged. One draw, 3,258 triangles.
- Removed the exact conflicting legacy north wall and two illustrative shops,
  including three paired colliders and flagged interaction references. Other
  original shops and mapped buildings remain. The earlier ID-only overlap
  audit missed these geometrical conflicts; native review caught them.
- Bicycle parking surface follows its existing mapped polygon; asphalt finish
  is observed at its entrance, extrapolated across the small recess.
- Restored mapped-tree vertex colors: disabled vertex colors exposed a pale
  texture and washed out all nine crowns. No extra tree positions or batches.
- 238 fine grass tufts only within the two nonstone hedge footprints; narrow
  cores reveal the base strips. Botanical placement is inferred, not a new lawn.
  One draw and 1,190 triangles; stone-edged hedges unchanged.

Remaining: precise tree inventory within the shrine court, lanterns and plaques,
Gishikiden facade, the old unused basin's exact placement, and neighboring house
facades. The broad precinct is still an approximation, not an identical replica.

Validation: 129 existing Node tests passed; new modules pass syntax checks.
Native browser review caught and resolved the legacy wall/shop conflict, then
confirmed removal of exactly three wall components, two shops and three paired
colliders. Walked from the main approach into the new forecourt with no invisible
legacy blocker. No captured browser warnings/errors. No new FPS benchmark or
exhaustive night/seasonal review was performed. Preview evidence is local under
fushimi_inari/outputs/r59 (ignored).
