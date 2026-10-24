# R99 independent CPU review

Current integrated assembly and final owned modules reviewed without browser, GPU or renderer. No remaining actionable defect found in the scoped changes.

## Mikoshiko details

The 2021 photograph (`outputs/r99-shinsenjo/elevator-court-2021.jpg`) shows the short shutter face with the long west doorway face receding right. The mapped northeast gate and Shinsenjo context corroborate the north end, local V negative, using the existing R93 transform. North wall center is approximately world [77.61214, 43.98225, 3.87392], outward direction [-0.024599, -0.999697] in XZ. This is relative registration, not surveyed camera recovery.

Actual prebatch build: 1,038 triangles, three borrowed material batches, no new materials or colliders. Repeat call returns the same report. Source geometry/materials/matrices, owner transform/floor, features, colliders and height function identities remain unchanged. The review identified a gap between projecting bracket heads and the existing eave receiver; the owning agent added four narrow connectors. Their top 4.49 overlaps the actual R93 receiver underside 4.475 by 15 mm; the final regression verifies the geometry contact. No new doorway or accessible porch is claimed.

Evidence: `mikoshiko-details-actual-probe.json`. Vertex-distance checks are supporting evidence, not a substitute for triangle clearance; focused tests additionally check the low detail envelope against protected routes.

## Terrain resolution and court

Fresh integrated prebatch comparison: 697,644 baseline terrain triangles versus 697,862 refined triangles, +218. Eighteen original triangles become 236, with exactly 325 m² replaced and 325 m² added. Every newly sampled vertex matches the unchanged terrainHeight(x,z) minus 0.06 contract. The request derives from the existing Mikoshiko west court bounds, rather than a new elevation or expanded architectural footprint.

The west mineral court accepts 21.4203918 m² with 0.060 m relief and maximum slope 0.05430875; it builds 140 triangles in one material batch. The north portion stays excluded: 0.18608 m relief, maximum slope 0.12921 and incomplete coverage. Whole-portion limits remain 0.18 m and 0.10. Features, colliders and height function references are unchanged. The sacred boundary uses actual tamagaki geometry and runs, not the Honden roof bounds.

Evidence: `refined-stage-a-module-probe.json`. The prior failed coarse-terrain probe remains historical evidence and is superseded for acceptance by this refined probe.

## Verification and limits

Nineteen focused tests passed across Mikoshiko details, original Mikoshiko precinct, north court and terrain triangles. These cover fail-closed owners/palette, idempotence, source preservation, eave attachment, protected routes, whole-part interior slope rejection and stitched nonlinear adaptive terrain. Final source/diff was inspected. Native appearance, photographic fidelity of inferred dimensions and rendered material appearance remain unverified here; root owns rendering and release acceptance.
