# R96 CPU/source performance and arrival review

Reviewed 2026-10-23, without browser or renderer. Evidence is
`fushimi_inari/outputs/r90/r95.json`, final `r96-reviewdatasets.json`, `r96-start.json`, current
integration/viewer/builders, and the shared-path benchmark. Regional export
manifests are deliberately not summed: regions overlap and exported material
records/instances are not GPU draw calls; older regional files also predate
the final well/rest corrections.

## Measured owner reports

These are gross builder-emitted triangles and material batches before final
integration merging, not net scene growth or visible draw calls.

|R96 owner|Triangles|Batches|
|---|---:|---:|
|Romon gallery fittings|2,208|3|
|Gehaiden stage/ceiling/borders|3,660|4|
|Naihaiden frontage detail|3,052|4|
|Honden envelope|4,180|3|
|Shinkosui well|1,888|4|
|Yotsutsuji context|4,074|8|
|Upper enclosure|3,672|3|
|Upper access|5,712|2|
|Okusha rest pavilion plus three racks|10,828|11|
|Omokaru boundary/canopy plus two lanterns|14,898|11|
|Registered apartment frontage and hedge|6,426|7|
|Mapped roofed notice|300|3|
|Reported subtotal|60,898|63|

Omokaru includes its separately reported two 300-triangle lantern batches;
the parent report is 14,298 triangles. Apartment and notice counts come
directly from the final runtime datasets, including the clipped frontage hedge.
The apartment's single 64px DataTexture is static. Omotesando context reports
another 4 batches but no triangle count. Gehaiden
cleanup removes 36 old meshes/twelve lanterns; its report confirms zero removed
PointLights. Other source refinements also remove old geometry, so the gross
subtotal cannot be presented as net growth. Final datasets increase from 78 to 92 keys.

The 54,267-triangle canonical walking-top capture becomes54,541 triangles after
shared ownership (+274). Across five CPU runs the broader pass takes49–112ms,
median67ms, versus35–47ms, median38ms, for the prior bounded corrections.
All four measured duplicate points become single faces; a repeated complete
output pass finds zero positive overlaps. This measures startup geometry work,
not frame rate. See `outputs/r96-integrated/path-top-ownership-benchmark.json`.

## Runtime ownership and culling

R96 modules contain no animation loop, update callback, interval or new
PointLight. Geometry is built once. Integration batches static details by 128 m
spatial cell, material identity, geometry attributes/indexing and shadow flags;
interactive objects/descendants and animated candle flames retain identities.
This limits batching scope and preserves the relocated Omokaru callbacks.

The viewer retains its existing per-frame systems and forest visibility loop
(bounds radius + 400 m). Regional building backdrop cells are hidden nearby
(bounds radius + 100 m). New static architecture has ordinary Three frustum
culling, not a new custom per-frame distance loop. Extra geometry, materials,
colliders and extracted walking-floor meshes still carry real rendering and
collision/raycast cost; no measured browser FPS or GPU draw-call comparison
exists in this review. The new modules' lack of update loops is not an FPS claim.

## Routes and arrival

All 24 saved sector records are structurally identical between R95 and
R96: 22 sampled-centerline-clear and 2 inspect. Existing inspect routes remain
Gonden→Tamayama (24 blocked samples each direction) and Honden→Okumiya
(75 each direction); they must not be described as 24 clear routes. Independent
paired stair walking lanes distinguish legitimate central-rail diagnostics.

The measured arrival file places the crossing at [-157.407,33.664626,10.342],
collision correction 0, looking toward [-138.295876,10.764595]. Viewer initializes
Romon/orbit controls and calls trace first, then performs the crossing teleport
last. Successful teleport clears movement keys, sets walking mode, disables
orbit controls and uses the requested look direction. No persisted camera
restore was found in the viewer/menu/walking flow. Failure explicitly retains
the Romon fallback rather than claiming crossing arrival.

The current crossing layout implements the requested90° marking rotation:
3.6m long bands span the road's across vector, while their centers advance
along the road in 0.9 m steps. Gutters and curbs keep their road orientation.
Existing emitted-geometry tests check these vectors and walking teleport.

## Source/material limits

R96 source packets distinguish mapped footprints/POIs from photo-inferred
heights, spacing, counts, joinery and hidden-side symmetry. Romon decorative
carving, Gehaiden brocade motifs, exact material reflectance/weathering,
Naihaiden recess depth and unsurveyed fittings remain approximate. Honden side
returns are partly inferred; well internals/current condition and Omokaru roof
heights/joinery are unmeasured. Yotsutsuji furniture/species/placement and
Omotesando utility hardware are estimates; unsupported conductors are omitted.
CPU diagnostic colors do not establish native textures, alpha cutouts, shadows,
appearance equivalence or a historically measured reconstruction.
