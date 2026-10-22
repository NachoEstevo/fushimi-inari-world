# Sanctuary context R87

## Evidence and bounded correction

Inspected the actual reference pixels in `fushimi_inari/outputs/r77/video-0525.png` and `streetview-landing.png`, alongside the R68–78 implementation and reference documents. The [supplied walking video at 05:25](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=325s) visibly shows rough grey stone masonry below the shrine-row enclosure flanking the broad lower stair. The cached June 2012 Street View landing capture corroborates mineral paving, stone edges and the existing shrine-row/white-screen relationship. The [official shrine website](https://inari.jp/) was consulted for site context; it does not supply retaining-wall dimensions. A fresh video fetch was throttled; this pass used the existing captured pixels rather than claiming a new live walkthrough of both supplied panoramas.

R76–78 already supplies bounded mineral courts, a shrine row, its rear white screen, the short Okumiya red screen and lower-stair retaining edges. No additional building, hidden enclosure continuation, grass blanket, terrace or platform is justified by these pixels. R87 therefore makes a concrete correction to an existing sourced feature: its previously monolithic retaining faces receive low-poly masonry joints and shallow stone relief.

Observed: grey irregular stone masonry beside the lower broad flight. Inferred: individual stone positions/count, course heights (maximum 0.28 m), nominal lengths (0.39–0.46 m) and 8–14 mm relief. This simplified faceted pattern is not a surveyed or historically exact rubble arrangement. Hidden wall extents and unseen sanctuary structures remain unverified.

## Ownership and integration

`buildSanctuaryContextR87(root, features, network, materials, colliders)` must run immediately after `buildTamayamaStairBorders`, before static batching. It consumes that owner's actual clipped triangles and replaces the named mesh with one group containing the retained structural bed and masonry facing. The old owner is removed; there are no simultaneous duplicate wall owners. The original geometry is reused by the bed, not disposed.

Only longitudinal faces receive facing; cut faces and small closures retain the existing stone bed. Existing terrain, stair widths/counts/grades, structural mass, building/water/junction cutouts, walk samplers and colliders retain their owners. Relief is decorative and bounded to 14 mm, within the existing 140 mm stair reserve. The function is idempotent and does nothing without the correctly sourced R77 owner. It introduces no dependency, texture, light or animation.

## Cost and verification

Actual current assembled network output: 253 longitudinal faces, 1,404 inferred stones, **5,616 new facing triangles**, 5,362 retained structural-bed triangles, **10,978 total triangles** and two static material batches. Four triangles per stone avoid individually modeled backs and side skirts. Materials clone the current stone finish; vertex colors provide restrained tonal variation.

Seven focused and adjacent tests pass: owner replacement/idempotence, retained structural mesh, unchanged walking/collision ownership, finite/nondegenerate geometry, bounded stair clearance, absent-source behavior, original route/obstacle clipping and outward facing normals. The regression checks every generated front facet against the nearest original R77 outward plane; reversing the front triangle order fails it.

`fushimi_inari/outputs/r87-sanctuary/audit.mjs` runs current integration with DOM/image/canvas stubs and exports the actual owner geometry using the assembled network. Geometry review uses Blender 5.2 EEVEE with exported vertex colors and two sharp diagnostic views. Both final `masonry-review.png` and `overview-review.png` were inspected. Performance simplification reduced the facing from the first over-detailed candidate to 5,616 triangles. Final relief was reduced to 8–14 mm after hard-light review made larger facets look too pyramidal.

The isolated renders verify geometry and facing visibility, not native browser texture parity, complete surroundings, hardware FPS or walking experience. The inherited R77 stepped top/cut faces remain visible in isolation; this pass does not claim to repair their geometry or site grades. Full combined-scene acceptance belongs to the root integration review. No commit was created.
