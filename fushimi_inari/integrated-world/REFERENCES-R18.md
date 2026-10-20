# R18 — Video-guided Temizuya correction

Reference: [Attractions Atlas, Kyoto Fushimi Inari Shrine Walking Tour](https://www.youtube.com/watch?v=FmRyJ-RtBPg&t=84s), inspected in the existing browser tab on 2026-10-20. Video remains paused; no video or third-party frames are redistributed.

## Observed frames

- 00:10: approach shops, stone wall with vermilion railing, slab walkway.
- Approximately 00:35: lateral stair flight beside the purification pavilion; curved verdigris roof, open timber frame, stone basin, handrail and stone retaining wall.
- 00:50: frontal entrance relationship; purification pavilion to the left, broad entrance steps, low clipped shrubs and mature pine to the right. Central slabs differ from small-block lateral paving.
- 01:24: Romon front, densely spaced rafters with gilded ends, patterned central plaque, green lattice screens and fox pedestals.
- 01:49: beyond the gate, red railing with black caps and gold fittings, slab perimeter beside dark aggregate courtyard, separate ancillary buildings.

These frames establish visible relationships and materials, not measured dimensions or a complete plan. The video does not yet validate the full mountain route. No new Street View review is claimed.

## Changed

Replaced the inherited flat-box Temizuya roof only in the integration adapter. Added a curved two-slope copper roof, seams, procedural patina, curved bargeboards, exposed vermilion framing, a shimenawa and paper streamers. The existing base, columns, basin interaction and geographic anchor remain. Roof dimensions are inferred to fit those inherited supports; exact gable shape and orientation still require refinement.

Water now uses a darker base, finer per-fragment normal variation and attenuated ripples around the existing spout. Reflection remains a small procedural environment texture; it is not a planar mirror or a simulation. No extra render pass, dependency, or viewer instance was added. New static details use the existing mesh batching.

## Validation and remaining work

52 Node tests passed. Node syntax and Git whitespace checks passed. Browser inspection covers the new roof and close-up water; final screenshots are local QA evidence. This does not establish measured architectural accuracy or performance across hardware.

Still open: pavilion/building spacing and orientation, retaining walls, lateral handrails, exact entrance pine shape, detailed Romon plaque and layered brackets. Do not treat this localized correction as completion of the entrance. Earlier R17 and terrain/profile limitations remain.
