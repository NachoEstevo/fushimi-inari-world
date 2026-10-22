# Gonden rear facade — R92

The brown rear in the supplied screenshot belongs to the existing Gonden, rather than a separate unidentified building. Its retained wall mesh was assigned timber on every face by `gonden-facade.mjs`; the earlier surroundings refinement covered only the opposite, local +X side.

## Evidence and reconstruction

[The Gonden guide](https://fushimiinari-guide.com/gonden/) explicitly describes five rear pillar bays. Its [rear photograph IMG_6572](https://fushimiinari-guide.com/wp-content/uploads/IMG_6572_20210311.jpg) shows white plaster, vermilion posts and horizontal members, and a low rear veranda balustrade. The [side photograph IMG_6571](https://fushimiinari-guide.com/wp-content/uploads/IMG_6571_20210311.jpg) supplies adjacent structural context. Inspected local copies are in `fushimi_inari/outputs/r92-gonden/`.

The existing wall now uses plaster; six posts define five rear bays. A low balustrade fits the inherited 6.8 × 4.8 m veranda. The opposite local -X gable receives white infill and red structural framing. Short upper framing segments follow the existing curved roof profile. Existing timber front panels remain unchanged. Geometry is merged into the existing material batches.

Rear bay widths and rail dimensions are photographic proportions fitted to the inherited model, not surveyed measurements. Continuing the white/red structural finish onto the opposite gable is an inference from the photographed rear corner; its carvings and openings are unverified. No rear door, window, neighboring structure, footprint expansion or new access route is invented. The close neighboring building visible in the rear photograph is not reconstructed by this change; the scene's separation remains approximate.

## Ownership and validation

Only the facade owner and its new regression test change. The interaction-bearing wall retains its identity and callback. Placement, roof shape, collision and surroundings ownership remain unchanged. The existing `gondenFacadeR65` marker is retained for compatibility; its metadata records the new rear evidence and limits.

`node --test fushimi_inari/integrated-world/gonden-facade.test.mjs fushimi_inari/integrated-world/gonden-surroundings.test.mjs`: 10 tests pass. Regressions raycast the five plaster bays and six posts, verify opposite-side materials, test finite geometry and curved-roof clearance, retain the veranda envelope, and check idempotency/unrelated objects. Integrated visual review is owned by the main task and independent reviewer; this document does not claim a completed native render review.
