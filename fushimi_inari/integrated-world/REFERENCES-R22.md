# Courtyard context repair — R22

References: user screenshot of the white buildings/red flickering band; [Attractions Atlas video](https://www.youtube.com/watch?v=FmRyJ-RtBPg&t=119s), paused at 01:59 (dark timber kiosk, shutters, tiled roof, gravel and paved margins), plus 02:32 (inner worship hall). The latter is reference only, not a claim of new hall geometry.

Fixed: the mapped reception's wainscot had the same width as the plaster shell, leaving coplanar end faces. Both horizontal dimensions now extend 2 cm per side. Added reception end-gable infill and timber framing, and framing/lattice to the earlier interactive reception pavilion without removing its counter or interaction.

Added a small religious-goods shop on OSM way/305214616, using its first three corners for orientation and dimensions. Shutters face the west courtyard; a stone foundation extends to the lowest sampled footprint ground. The facade vocabulary is video-derived, but assigning that specific appearance to this footprint, roof height and facade dimensions remains inferred. No additional trails or arbitrary houses were invented.

QA: 58 existing tests pass; changed modules parse; diff whitespace check passes. Browser review of the screenshot location from two camera positions confirmed the band is solid rather than flickering. Inspected the new shop, corrected the initial shutter orientation and foundation gap, then reloaded and inspected again. No console errors. Local captures: outputs/r22/courtyard.png and shop.png.

Geometry uses shared materials and the existing static batcher, without new texture maps or new shadow casters for the added shop. No controlled performance benchmark was run.

Incomplete: the legacy interactive reception pavilion and mapped reception still need spatial reconciliation. The eastward walk revealed exaggerated terrain/platform transitions (~52 m displayed near the front flank, returning to ~44 m at the shop); walking through that area is not validated as realistic. Existing slabs, voids, courtyard distribution, missing context buildings and access classification remain open. This is a visual/geometry repair checkpoint, not completion of Romon or the precinct.
