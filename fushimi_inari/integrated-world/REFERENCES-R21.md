# Romon side facades and courtyard transition — R21

Reference: [Attractions Atlas walking tour](https://www.youtube.com/watch?v=FmRyJ-RtBPg). Paused browser comparisons around 01:20 (front wings), 01:30 (gate opening), 01:40 (courtyard threshold) and 01:45 (slabs against gravel). No video frames redistributed.

Observed: tall green lattice panels in the wings, narrow vermilion frames, white plaster strips beneath the eaves, closely repeated rafter ends. At the courtyard threshold a narrow drainage strip separates the paved approach from the gravel margins. These are appearance/proportion references, not measured elevations.

Changes: source-coordinate facade adapter with taller lattice inserts, rear/end-wall timber framing and small eave caps. Existing GLB, roof, statues, barrels and earlier terrace details remain intact. Frame and screen dimensions are inferred; the end-wall treatment is an extrapolation, not independently verified by the frontal video.

The west landing now blends into the existing courtyard height over 4 m with a smooth endpoint derivative. Threshold grates are flush detailing without new blocking colliders. The west grate placement is inferred from the central threshold construction vocabulary. Exact drain alignment and paving junctions still need a measured reference.

Validation: 58 Node tests passed, syntax checks and diff whitespace checks passed. Walked from Temizuya up the west stairs into the courtyard, and separately through the central Romon opening. No console errors on the updated page. Inspected the front/oblique wing view and courtyard arrival in the existing browser tab. Screenshot: outputs/r21/wing.png (local QA output).

Performance: facade geometry is merged into five material groups before the existing static batching; no new textures or shadow casters for that adapter. Sample at courtyard arrival: 65.2 FPS / 14.26 ms submit / 2,359 calls / 14.67 million submitted triangles, 1205×812 DPR 1. This different camera view is not an A/B comparison with R20 and does not establish low-end performance. Broader scene complexity remains a separate concern.

Still unresolved: detailed courtyard context buildings, exact side/rear wall documentation, some inherited paving overlaps and geometric/proportional differences in the gate and adjacent worship hall. This revision is not a declaration that Romon is an exact completed replica.
