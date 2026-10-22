# Near precinct refinement R69

This pass follows R68 without changing the mapped routes, stair counts or DEM.

## Photo-backed changes

- Tamayama: bounded grey mineral ground around the existing lantern bases,
  following the material visible in guide photograph `IMG6591_20210308.jpg`.
  Extent is inferred from the current lanterns, fence and apron; it is not a
  surveyed courtyard boundary. The overlay excludes buildings, water, pedestal
  bases, the stone apron, path ribbons and the R68 junction triangles. It adds
  one static material batch and no walking-height or collision changes.
- Okumiya: short lower lattice returns, pale/red gable fascia and small gilt
  fittings from the front and side photographs on
  https://fushimiinari-guide.com/okumiya/. The retained roof envelope and
  interactive body are unchanged. Fine carving remains simplified.
- Temizuya: pale soffit, curve-following red rafters, dark fascia and restrained
  bearing blocks, based on `DSC_0677-2_20190331.jpg`. See
  [canopy reference](temizuya-canopy-reference.md). Water and interactions are
  unchanged; dimensions remain estimates inside the existing pavilion.

## Native review

The former Tamayama and Okumiya checkpoints were collision-free but placed the
camera against their lattice facades. Native walking review established clearer
arrival points at X/Z 96.05/-33.979 and 114.75/-15.941 respectively, on the
existing approaches. Heights still come from the assembled walking surface.

Tamayama was checked from its checkpoint and by walking toward and away from the
apron. Okumiya was checked from the approach and oblique side view. Native
captures are local under ignored `fushimi_inari/outputs/r69/`. Source reference
photographs are not shipped as textures or repository assets.

Temizuya was also checked from the arrival point and from below its front eave.
Review found and corrected insufficient roof-width subdivision: the copper,
soffit and rafters now share the same transverse corner-lift profile. Roof and
soffit normals face in opposite directions. The final full Node suite passes
193 cases, including geometry, clearance and idempotence regressions; the native
console recorded no warnings/errors during this review. Three.js 0.164.1 was
installed only into ignored local node_modules for tests, matching the viewer.

## Limits

These are bounded fidelity improvements, not completion of the precinct. The
remaining small shrines, complete mineral court extent, retaining walls and
drainage still need reference-based reconstruction. No measured FPS improvement
or surveyed architectural accuracy is claimed.
