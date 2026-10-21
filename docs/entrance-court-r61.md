# R61 — Shrine architecture and court materials

## Source

The [Omotesando guide](https://fushimiinari-guide.com/omotesando/) and its [three-shrine photograph](https://fushimiinari-guide.com/wp-content/uploads/IMG_6470_20210313.jpg) support dense red rear pickets, stone retaining masonry, layered eaves, paired decorated doors and timber framing. Shapes and dimensions remain interpretations of the photograph, not surveyed reproductions.

Also inspected [the entrance pillar photograph](https://fushimiinari-guide.com/wp-content/uploads/IMG_5726_20210313.jpg). It clearly shows a stone inscribed pillar and adjacent lantern, but does not establish a sufficiently precise scene position. Neither was added in this pass; the photographed local context needs matching to the entrance map first.

## Implementation

- Kumano: layered curved fascia, short rafter tails, door frames and recessed panels.
- Fujio: bark courses and layered roof edge while preserving its corrected X-axis ridge.
- Reikon: restrained timber side framing and door detail.
- Rear mapped rail: denser vertical red pickets along its original line, height and seat.
- Retaining walls: shared procedural stone colour/relief, replacing flat dark slabs and false continuous horizontal seams.
- Court: finer mineral grain and subtle bump relief; existing geometry, elevations and route exclusions unchanged.

All shrine details merge into the existing six material batches. Enclosures remain instanced. No new light, dependency, external texture request or movement/collision rule was introduced. Appearance is estimated; unseen ornament and historical prose were not fabricated.

## Verification and limits

130 geography/integrated-world tests pass. Syntax and diff checks pass. Native review of the court caught excessive regularity in the first stone pattern, prompting a final material refinement. Access was inspected from walking height. Screenshots are local under `fushimi_inari/outputs/r61/`.

No hardware FPS benchmark or nighttime review was performed. Roof curves, stone joints, door panels and exact colours still need closer reference views. This is visual refinement of the mapped court, not a claim that the whole entrance is complete.
