# R78 near-precinct drainage detail

`buildNearPrecinctDrains(root, features, surfaces, legacy.materials)` should run after final walking/path junction refinements. It adds no collider and changes no surface sampler or terrain.

The reviewed `outputs/r77/streetview-landing.png` shows dark transverse drainage within stone landing paving, with a narrow stone surround. Video frames at 325, 365 and 385 seconds corroborate the landings, steps and stone vocabulary; they do not establish precise drain coordinates. Two short reconstructed stations are explicitly inferred: 45% along Tamayama's mapped approach `way/1133053715`, and 65% along Okumiya's upper landing `way/1392716577`. They are not survey measurements or a complete drainage network.

Each run is transverse to its identified mapped lane, stopping 10 cm inside its edges. The 20 cm dark channel has open metal bars at approximately 8 cm spacing, two longitudinal metal edges and 8 cm stone surrounds. Three instanced material batches follow the R72 drain pattern. Geometry tops sample the final walking surface separately, rising at most 6 mm. Runs are declined if adjacent 8 cm centerline samples jump by more than 8 cm, avoiding bridges over unresolved grade discontinuities.

Tests cover scope, finite matrices, flush top placement, idempotency, unchanged source data and walking function, and rejection of a discontinuous walking plane. Actual browser appearance and physical walking acceptance remain unverified. No additional terrain-transition correction is included: the available evidence does not justify changing established walking grades through a decorative drain module.
