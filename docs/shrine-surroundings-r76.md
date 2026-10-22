# R76 — Tamayama, Gonden and Okumiya surroundings

## Evidence and scope

Reviewed the June 2012 Google Street View panorama `MvihcVb0f466FBJebqyECg` around Tamayama and the guide's side/rear photographs:

- https://fushimiinari-guide.com/gonden/ — side photo `IMG_6571_20210311.jpg`: mineral court, side plaster/red framing, low timber barrier, roofed cabinet, dark lantern and a roofed vermilion enclosure behind.
- https://fushimiinari-guide.com/okumiya/ — rear photo `IMG_6630_20210309.jpg`: gravel, stone foundation border, raised veranda and nearby Byakko.
- Tamayama sources and existing fences/lanterns remain documented in [R68](tamayama-okumiya-r68.md).

These are photographic approximations. Positions and small dimensions are inferred, not measured. Historical Street View does not establish every present-day fitting. No reference photos are shipped as application textures.

## Changes

- Tamayama's mineral forecourt extends from a 0.9 m to a 2 m inferred front margin. Its existing fences, lanterns, apron and path cuts remain owned by their original modules.
- Gonden and Okumiya get conservative gravel collars and flush stone borders conforming to the existing terrain. Retained physical plinths, neighbouring buildings, water, public paths and transition triangles are excluded. Their own mapped roof outlines are not treated as ground walls: gravel is allowed below their eaves.
- Full assembly yields 24.22 square metres at Gonden and 24.73 at Okumiya. These are model surface areas, not surveyed site areas.
- Gonden gains a photo-supported low timber barrier, roofed cabinet, unlit dark lantern and a bounded 2.4 m roofed red screen. All four pass the assembled corridor/solid placement checks.
- Gonden's photographed side has white panels, red framing and a plain red door. The interaction-bearing body and front remain intact. Gable members follow the existing roof curve; the first render exposed protruding straight chords, which were replaced by recessed short segments.
- Existing texture/material assets and static batching are reused. No dependencies, dynamic lights or per-frame animation were added. Terrain and walking height functions are unchanged.

## Validation and limits

- 218 tests passed across the integrated-world and geography suites.
- Actual integration runs with all four building GLB geometries in the offline harness. Texture/image APIs are stubbed; this is geometry validation, not browser appearance proof.
- Reviewed four offline views using actual integrated geometry, production path meshes and the viewer's adaptive terrain tessellation. Materials in these reviews are simplified; texture-backed white surfaces are not the application's finished colors.
- Tests cover exclusions, transformed seating, idempotence, finite geometry, path/solid avoidance and gable-member roof clearance. New surfaces do not introduce raised walking platforms.
- Browser walking, final WebGL textures and hardware FPS remain unverified. Fine grade irregularities already present around the Tamayama approach remain visible in the geometry review and require a separate connected-grade pass.
- The distant court boundary, unseen rear facade and continuation of the Gonden screen are not established by these views. This pass does not claim the three precincts are complete or exact.

Local review evidence and reproducible harness: `fushimi_inari/outputs/r76/` (ignored). User work in README, social preview assets and page metadata was preserved.
