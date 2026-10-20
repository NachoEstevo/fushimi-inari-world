# R26 — Okusha exit and paving

- User photographs establish a common frontage for both Senbon exits. The previous independent nearest-lane cutoff stopped the first row about 11 m earlier.
- Both rows now end on one frontage, 2.5 m before the mapped shared node. This setback and the 8 x 6.4 m paving apron are inferred, not surveyed dimensions.
- The apron replaces overlapping trail paving, earth strips and curbs by clipping their rendered polygons. Existing route coordinates and surrounding paths are retained; the apron participates in the existing walk-floor extraction.
- Gravel UVs now repeat every 1.5 m instead of stretching across the entire 38 m court. No additional texture or dependency was introduced.
- Additional reference: https://www.youtube.com/watch?v=zFKeYi0AK0M . Inspected paused frames around 10:00, 15:00 and 17:00 for shrine and corridor context; not the entire two-hour tour. The user-supplied reverse-view screenshot remains the direct evidence for the aligned exit.

## Validation

72 Node tests pass, including shared exit alignment, minimum gate spacing, clipping area and UV/height interpolation. Syntax and diff checks pass.
Native browser walk through the north exit: (253.63,64.26,67.56) to (241.57,64.23,67.51), then return. South exit: (253.60,64.26,69.71) to (241.58,64.23,69.65), then return. No falls or blocked crossing in these two tested passages. Browser error log empty.
Screenshot: ../outputs/r26/senbon-arrival.png (local ignored QA artifact).
No full-map walk or new FPS benchmark; surrounding architecture still simplified.
