# Temizuya canopy fidelity pass

Source photo actually viewed: https://fushimiinari-guide.com/wp-content/uploads/DSC_0677-2_20190331.jpg, linked as 手水舎 from https://fushimiinari-guide.com/omotesando/.

The photograph shows oxidized copper roofing with a dark edge, lifted outer corners, a pale soffit, red roof framing with pale/gold-toned end grain, and layered bearing blocks. Earlier video source FmRyJ-RtBPg (00:35–00:50) remains the original canopy reference; it was not independently re-watched in this pass.

`refineTemizuyaCanopy(group)` retains its current hook from entrance-refinements.mjs. No new integration call is required. Added parts live under `Temizuya photo-backed canopy`; repeat calls return before adding duplicates.

The copper envelope remains 6.2 x 4.6 m. Estimated corner lift is 0.10 m at the outer width. A pale soffit follows the same surface 0.085 m below it. Red rafters now follow that actual curved surface instead of the earlier fixed-angle straight bars. Double dark fascia follows the lifted edge. Restrained stepped bearing blocks use the observed vocabulary without inventing carved animals or inscriptions.

All owned canopy detail pieces now merge by the existing five materials. The retained original columns, basin, water shader, ladles, interactions, colliders, transform, terrain, rope positions and streamers remain under their previous owners. No new structures or placements are introduced. Runtime metadata records material batches, source pieces and vertex count.

Validation: node syntax check; roof-profile test. These checks do not validate final rendering. Root owns native QA, especially front soffit contact, corner lift and rafter contact when looking up from the basin.

Review correction: roof and soffit now use a 24-by-32 grid so interior X vertices follow the same corner-lift function as rafters and standing seams. Top triangle normals face upward; soffit triangles explicitly reverse winding and recompute downward normals. Focused Three.js geometry tests verify interior height, centre/corner difference, opposite face normals, retained basin identity and repeated-call idempotency. These tests create no renderer or WebGL context.
