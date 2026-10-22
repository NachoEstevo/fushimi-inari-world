# Romon wing roof R71

Reference: https://fushimiinari-guide.com/rohmon/ photographs IMG_6485_20210317 and IMG_6491_20210317, inspected in browser. The roof ridge spans almost the corridor length and the peaked end face sits over the outer wall. The inherited roof instead dropped halfway along the wing, with detached rectangular gable fittings.

Retargeted only the 8056 source wing-roof triangles; retained roof footprint, height and shell thickness. Replaced precisely bounded ridge fittings with a longer dark ridge, white/red end gables and small gilt fittings. Dimensions remain inferred, not surveyed; exact wing length and ornate carving still need calibration.

Detail geometry: 7910 triangles / six material batches, versus 7500 / five before. Removal of 2688 inherited fitting triangles yields a net reduction of 2278 scene triangles. No full-scene FPS claim is made. Central roof positions/normals and unrelated gold geometry are preserved by production-GLB tests.

Restarted local HTTP server on 127.0.0.1:8420 after shutdown; HTTP 200 verified. Native review caught a material-substitution mismatch and a cached layout dependency; both corrected before delivery.

Final validation: 199 tests pass. Native browser confirmed R71 reconstructed,
the longer ridge and exposed pale/red outer gable. End-view raycasts cover both
sides. The upper hip shoulder was corrected after visual review found it hiding
the gable; no roof triangles were added. Runtime material-substitution regression
is included. Local capture: fushimi_inari/outputs/r71/romon-roof-final.png.
