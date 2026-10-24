# R99 Mikoshiko details and bounded mineral court

Baseline main 2319069. User requested continued visible work and active Sol 6.1 implementation/review. Root preserved unrelated README/social metadata and existing EOL-only work.

## Implemented

- Mikoshiko north-only paired high shutters, iron fittings, shallow hood, west gutter and one north downpipe; white eave brackets and timber reveals. The 2016/2021 source photos and mapped gate corroborate the end sign. Dimensions remain inferred. Existing doors, fence, building footprint and route colliders are preserved. 1,038 triangles, three borrowed material batches, no new materials/colliders.
- Independent review caught unsupported bracket heads. Four narrow connectors now engage the existing eave receiver; actual contact regression passes.
- Existing terrain resolution produced a false crease at the west court's southern end. A resolution request derived from the mapped Mikoshiko court refines that cell with the SAME height sampler and offset. Existing neighbor stitching remains authoritative. +218 triangles; 325 m² retriangulated including neighbor fans. No new grade or flattening operation.
- West mineral court now covers 21.4203918 m² on actual rendered terrain, with .060 m relief and .05430875 maximum slope. One batch and 140 triangles, clipped against existing routes, buildings, well and actual tamagaki geometry. No new walking or collider owner.

## Withheld portions

The north collar still fails the unchanged whole-portion slope/coverage gates and is not built. The full Shinsenjo compound, elevator/bridge heights and southern terrain interface remain unresolved. New primary map evidence registers a retaining wall, gate and elevator topology but supplies no surveyed heights. The gray parapet at Nankiri Fudo is photographically confirmed, but its endpoints remain unregistered. No speculative perimeter wall was added.

## Verification

573 Node tests passed, zero failures. Independent actual-assembly review verifies owner/material/feature/collider/sampler preservation, refinement coverage and admitted/rejected court portions. Review evidence is packaged in review-r99. Root inspected two matched CPU facade views and a third elevated west-court view. New details and the bounded court pass scoped geometry review. Existing path curb faces protrude about 6 cm over a lower apron at the north junction; exact ray attribution is in review-r99/floor-wedge-attribution.md. That inherited connection remains an explicit next correction, not a clean-whole-court claim. CPU renders use diagnostic materials; native appearance, shader behavior and FPS are not established by these checks. Water remains unchanged from R98.

See mikoshiko-details-r99.md, shinsenjo-north-court-r99.md and reference-registration reports for sources, inferred dimensions and historical pre-refinement rejection records.
