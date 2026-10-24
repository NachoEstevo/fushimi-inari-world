# R99 Mikoshiko floor wedge attribution

CPU rays use the exported actual triangles and the saved court2021 camera (960×640, 25 mm lens). Evidence: `wedge-rays.jsonl`. The dark floor wedges are inherited vertical curb/court sides, not the new R99 detail or mineral-court triangles.

| Pixel | First hit world XYZ | Actual owner / geometry |
|---|---|---|
| 688,453 | 71.842974,44.106719,5.919053 | White path curb side, Y43.782249–44.147247 |
| 705,451 | 71.623393,44.108246,6.222034 | Adjacent white path curb side, same vertical range |
| 644,454 | 72.549115,44.021183,6.058321 | Existing R93 Mikoshiko west court vertical edge, Y43.832249–44.072249 |
| 766,433 | 70.849949,43.948608,10.215023 | New R99 mineral court; terrain immediately below at the preserved +.012 offset |

The first two curb triangles overlap the plan area of the wider sanctuary approach apron. Their top is approximately 6 cm above that apron (44.087250). Thus the visible dark triangle is a vertically oriented side face, with an actual inherited height mismatch between separate owners; it is not same-plane double paving. The R93 west court edge also remains geometrically unchanged.

Source attribution: `path-meshes.mjs` nonmountain curb sides at lines81–91 use the +.025 lip and a foot at min(path−.30, ground−.20); `sanctuary-landing.mjs` owns the wider lower apron; `mikoshiko-precinct.mjs` line39 owns the existing west court box. All three files have zero diff against HEAD2319069 during this review. The exporter adds path meshes after integration, matching viewer composition; their absence from a prebatch architectural-owner-only probe does not indicate missing runtime geometry.

No production mutation made. This records inherited source parity and the exact current triangles; it does not claim a separately rendered historical screenshot comparison. A future circulation-surface cleanup would need explicit curb/apron ownership rules, rather than changing the new north-court slope or detail geometry.
