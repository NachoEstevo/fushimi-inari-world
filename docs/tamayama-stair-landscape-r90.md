# R90 — Tamayama's south stair bank

## Actual source views and coordinates

Inspected the two actual June2012 GoogleStreetView screenshots supplied by root:
`outputs/r90-tamayama/streetview-south-180.png` and `streetview-west-270.png`,
panorama `MvihcVb0f466FBJebqyECg` near34.9674832,135.7737795. Also inspected
the saved actual user-video05:25 frame under `outputs/r77/video-0525.png`.
See [the independent reference register](tamayama-stair-reference-r90.md).

The western flight is `105449693`, not the upper Okumiya flight. Looking down
west, the planted bank and low stake fence are on the **left/south**, opposite
the roofed shrine row on the right/north. The bank has mature broadleaf cover,
irregular narrow stakes, a brown horizontal rail and a large stone lantern at
the top end. The large vermilion torii belongs to the south/right continuation
when climbing, distinct from the lower west gate. Temporary2012 stalls are not
architectural evidence and were not modelled.

Canonical access: `105449693`→`1133055112`→`1133055111`→`649175020` ends at
J[97.199,-33.841]. The right/south continuation is `1133055117`→`297888105`→
`1133055118`→`1133055119`→upper Okumiya flight`626313768`. Root/mountain agent
owns its large gate. This packet adds no gate.

## Bounded owner

`buildTamayamaStairLandscape(root,features,surfaces,materials,colliders)` in
`tamayama-stair-landscape.mjs` adds:

- Low narrow wooden/bamboo-style stakes with one brown horizontal rail, following the source stair/landing alignment at3.28m south offset, bounded to X78…93.5. This sits beyond the4.8m source-informed stair width and existing R77 stone edge. Existing rough retaining stones are preserved.
- Three restrained mature broadleaf trees at photo-inferred bank roots [83.7,-27.8], [88.8,-26.7], [92.6,-25.7]. Their placement, number,7.1…8.2m heights and botanical interpretation are estimates, **not mapped tree points or an exact-count claim**. Initial full-scene inventory found no tree colliders or legacy foliage instances in this bank. Existing tree owners within2m suppress a new root.
- One large unlit granite lantern at estimated [94.1,-28.9], terrain-seated Y49.639, height3.395m. This is the photographed bank landmark, separate from Tamayama's smaller facade lanterns nearX101.5. Duplicate-owner detection preserves any existing nearby lantern. The south-branch gate station near[97.437,-22.676] remains approximately6m away.

Public routes and building footprints exclude all new roots and fence sections.
No source path, terrain elevation, stair level/count, shrine enclosure or old
gate is edited. No random rocks, lawn, hedge, forest-floor plane or stall is
added. The existing rough stone retaining edge owns the observed stair stones;
new boulders would duplicate that owner without supporting registration.

## Verification and limits

Four dedicated tests pass: correct south-bank bounds and mapped route clearance,
finite geometry/colliders and immutable source geometry, duplicate tree/lantern
ownership, and idempotence/missing-source handling. Actual full-scene harness
result: three trees,54 low fence rail sections, one lantern, **8,224 triangles,
six static material draws and64 colliders**. The canopy reuses the existing
shared procedural cutout leaf material; no dependency, fetched texture, runtime
light or per-frame update is added.

The shared green cutouts are suitable for the supplied June views. The actual
legacy `foliage_momiji_maple.png` pixels were inspected and are red/orange autumn
leaves; selecting that material merely by array index would change the source
appearance. The bank defaults therefore do not use that red texture.

Actual emitted geometry, original path/curb/stair meshes, existing stone borders
and a source-aligned rendered terrain patch were exported for three Blender5.2
views: `upstairs-review.png`, `downstairs-review.png`, `bank-review.png` under
`outputs/r90-tamayama/`. The first review exposed overly horizontal sparse
leaf plates; the second varied leaf orientation/coverage while keeping triangle
cost fixed. These diagnostics validate arrangement and geometry, but do not
reproduce the browser's procedural foliage alpha texture or prove full-scene
photographic fidelity. Native viewer review, current-day photographic exactness,
complete court/mineral-ground coverage and measured FPS remain root acceptance.
The white triangle/fan pattern on the diagnostic stair landing is existing path
geometry/material shading; this packet does not replace it or claim it fixed.

## Related R89 outer-edge correction

The native bright line at the Mitsutsuji apron was traced to a real7.4cm mismatch:
its outer edge targeted `terrainHeight+.014` while visible DEM uses
`terrainHeight-.06`. The outer apron now meets the exact rendered DEM skin;
the source terrain heights remain unchanged. An explicit boundary regression
and all six apron tests pass. Actual geometry was re-exported and the fixed
close seam render inspected. Existing dark step/curb riser faces retain their
original owner and are not labelled holes merely because they appear dark.

## South continuation mineral court

The same June 2012 south and west views show a broad mineral court around the
large continuation gate. The green area in the previous native view came from
the R64 aesthetic precinct cover, not mapped grass landuse. The existing
`tamayama-forecourt` owner now covers a conservative estimated 6.4 m strip
following only ways 1133055117, 297888105 and 1133055118. It stops at their source
junctions and leaves the photographed south stair bank outside the footprint.
Width remains photo inferred; an exact surveyed court perimeter is unavailable.

The fifth builder argument accepts `{ terrainPositions }`, the shared rendered
DEM triangle array. Both the original shrine court and continuation are clipped
against those triangles and lie 3 mm above their actual planes. Without that
array, the continuation is withheld. Exact source paths and curbs, junctions,
buildings, water and the old shrine envelope are subtracted; walking heights,
source geometry and colliders are unchanged.

Actual source integration gives 49.06 m² added and 67.60 m² total mineral overlay,
1,911 triangles in one material batch. Six forecourt tests pass, including a
contradictory raw terrain height that proves the supplied rendered planes own
the surface. Three actual geometry views (`court-south-review.png`,
`court-reverse-review.png`, `court-edge-review.png` in outputs/r90-tamayama)
were inspected. Those diagnostic views include real terrain and path geometry,
but omit shrine bodies and the new gate; their intentional pedestal holes are
therefore visible. Native integrated acceptance remains a separate check.
