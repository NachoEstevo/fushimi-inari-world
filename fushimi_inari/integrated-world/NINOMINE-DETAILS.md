# Ninomine detail refinement

`refineNinomine(object, materials)` applies only once to a legacy group tagged
`userData.zone = 'ninomine'`. Call after `refineShrineFinishes`, before the adapter
transforms/rebatches the group. No dependencies beyond the existing Three.js.

## References inspected

- Local user image `C:/Users/nacho/Desktop/Fujimi/photo_5_2026-10-20_17-41-36.jpg`:
  weathered grey stone, rounded/irregular stone monument heads, open miniature
  vermilion offerings and dark top beams. Photograph was visually inspected;
  its precise location within the mountain is unverified.
- [Official Ninomine page](https://inari.jp/en/map/spot_11/) confirms the site's
  identity. Its linked [photograph](https://inari.jp/en/wp-content/uploads/2016/09/ninomine.jpg)
  was opened as a reference; no image is copied into the product.
- Root supplied observations from the Shin Kane, February 2020 Google Maps
  panorama: inclined stone stair cheeks, tall vermilion lanterns, red banner,
  dense stone monuments. I did not independently inspect that interactive
  panorama; the cheek profile follows those observations. Existing lanterns
  remain handled by shrine-lanterns; no unverified banner/text was added.

## Changes and inferred dimensions

Existing miniature offerings retain transforms and gain open centers, a red
central support and black caps, using shared geometries. Existing subsidiary
steles gain rounded shoulders within their authored bounding dimensions and
subtle vertex mineral/moss coloration. No new names/inscriptions or monuments.

Existing 0.68 x 1.26 x 2.61 m stair cheeks retain their entire footprint and base;
their upper edge descends 0.84 m toward the first tread. Those dimensions come
from the legacy scene, and the slope is inferred. The 3.6 m stair width, treads,
apron, monument positions, overall group transform and colliders are untouched.
Rounded heads use more vertices but no extra draw call per monument; each
offering adds one small cap mesh that the integration batcher can merge.

## Verification

2026-10-21: Node geometry harness using the viewer's Three.js 0.164.1 passed:
finite position attributes; unchanged placements; unchanged stair geometry;
preserved stele height/cheek footprint; idempotency; non-Ninomine isolation.
Harness used temporary copies with local imports, outside the repository.
Final diff reviewed. No browser/render/collider acceptance performed by this
specialist; root owns integration and visual checks. Photographic exactness,
survey dimensions and physical wear distributions remain unverified.
