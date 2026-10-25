# R91 — Southern Shinme pavilion

22 October 2026. Bounded replacement of the generic building registered as `way/305214599`, beyond the large Tamayama south continuation gate. This is **the second horse pavilion**, not the smaller horse immediately beside Tamayama (`way/1268143670`) or an assumed identity for the old legacy horse mesh.

## Evidence and registration

- [October 2016 firsthand route and photographs](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610090000/) explicitly distinguishes the horse beside Tamayama from another horse pavilion at the southern end after turning right, with broad Okumiya stairs on the left. [Full frontal image](https://image.space.rakuten.co.jp/d/strg/ctrl/9/5293f552ad562325b1ca9e9fd0ab4dff4fc7815b.77.2.9.2.jpeg), downloaded temporarily and inspected as actual pixels, shows dark curved gable, vermilion framing, white plaster panels, central green lattice and stone base. The adjacent stair photograph independently confirms the spatial relation.
- [January 2014 firsthand walk](https://nabesan.cloudfree.jp/sk18fushimiinari.html) describes the horse at the end of the right turn and the Okumiya stair to its left. [Front close-up](https://nabesan.cloudfree.jp/shashin/kyoto/fushimiinari/IMG_1481.JPG), inspected as actual pixels, shows white standing horse, gold/black tack, green square lattice, white upper cloth, shimenawa and shide. It crops the roof and is not used to infer its shape.
- Root's June 2012 saved south StreetView image shows the small red gabled structure beyond the large gate. Read with [continuation reference](tamayama-continuation-reference-r91.md). No temporary stalls/signs from 2012 have been added.

Mapped footprint supplies centre `[94.577,-6.451]`, width `5.085891269 m`, depth `4.768626217 m`, yaw `.0438608504 rad`. The north-facing display front is inferred from the axial approach and source route relation. Association confidence is high for the southern pavilion; exact survey registration, current restoration details and historical state consistency remain unverified. Footprint coordinates are data values, not a claim of survey accuracy.

## Ownership and geometry

`tamayama-south-shinmesha.mjs` exports `buildTamayamaSouthShinmesha(root, materials, features, surfaces, colliders, options={})`. Production passes `{terrainPositions}` using the shared viewer array. On success it returns `builtIds:['way/305214599']` for the integration owner to exclude that generic building. Missing/invalid footprint or nonfinite floor fails without scene/collider mutation. Repeated invocation is idempotent. It adds no anchors, terrain edits or per-frame callbacks.

The building has source-backed curved gable, framed white enclosure, green geometric display lattice, recessed white low-poly horse, valance/rope/paper strips and stone plinth. The horse is a simplified silhouette, not a sculptural replica. Roof ridge height about 5.38 m, eave projection about .48 m, panel spacing and vertical proportions are photo estimates, not measured dimensions. Glass reflections, inscription text, small metalwork, carved gable emblem and exact roof construction are omitted rather than invented. Rear and side panel arrangement is conservative enclosure within the mapped footprint, with lower confidence than the photographed front.

Nine static material batches, 368 primitives, 4032 triangles. One box collider stays within the wall footprint; the north face is a display window, not a public doorway. Existing horse interaction remains untouched. Public continuation `way/1385037576` runs east of the pavilion.

## Review and verification

Four focused node tests pass: separate southern registration; finite positions/normals/UVs, upward actual roof triangles, batch budget, idempotency and path clearance; rendered-terrain skirt contact; invalid-input fallbacks. The mapped east continuation was sampled every .15 m at centre and +/- .45 m with the actual collision implementation; no corrections from this pavilion. This checks the new collider, not every object in the integrated precinct.

Actual module mesh exported to Blender 5.2, not an illustrated proxy: [front — archived](repository-archive.md#historical-review-evidence) (`review-r91-shinmesha/front.png`), [oblique — archived](repository-archive.md#historical-review-evidence) (`review-r91-shinmesha/oblique.png`), [counts/collider — archived](repository-archive.md#historical-review-evidence) (`review-r91-shinmesha/stats.json`). Two render/fix passes closed the side wall/roof gap and removed column ends protruding into the front gable. Source photographs remain temporary local reference files; the committed PNGs are our renders.

Independent reviewer caught one roof slope winding inward; the final pass reverses that slope and tests actual normal Y. The public-front floor sample now respects footprint rotation.

Actual integration harness supplied the shared rendered terrain array: entrance floor `50.42007334`, foundation bottom `49.781962736`; terrain-height function corners range `50.18849..50.824412`. See [seating audit — archived](repository-archive.md#historical-review-evidence) (`review-r91-shinmesha/seating.json`). The plinth skirt extends to the lowest rendered terrain triangle overlapping the footprint, with .04 m embedment. It changes no terrain height; the uphill side partly buries the plinth, consistent with a level building on sloping ground. The conservative minimum may be deeper than strictly necessary, but remains hidden and wholly within the footprint.

Native full-assembly acceptance, generic-building removal and approach/stair relationship are root integration checks still pending at this handoff. The isolated PNGs use flat ground and do not by themselves prove native seating.
