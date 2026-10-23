# R95 critical upper stair architecture correction

Root's actual integrated `outputs/r95-integrated/tamayama-arrival.png` exposed
two tall blank blocks flanking the upper flight and a blank brown rectangle
covering Okumiya. Compared against fresh actual June 2012 Street View captures
`outputs/r95-references/okumiya-downhill-streetview-2012.png`,
`okumiya-side-landing-streetview-2012.png` and
`okumiya-front-landing-streetview-2012.png`.

## Underlying causes

The two mapped footprints `301527738` and `1051399549` had no source-feature
lantern owners. Viewer's generic building fallback extruded them into solid
6m-class blocks. Their real source counterparts are large roofed red-framed
lanterns on tapered grey stone plinths. Simply hiding the blocks would omit the
source architecture, so this packet builds those actual forms first.

The apparent blank Okumiya facade is a different error. Programmatic inspection
of the actual exported `outputs/r95-integrated/tamayama.json` found a mesh named
`Mapped context way/301527733` with 10 triangles. This generic fallback overlays
the existing R69 refined shrine. `excludesBuilding` relies partly on whether any
footprint vertex is within .65 times an anchor radius; that geometric heuristic
missed this shrine footprint. Existing R69 code already supplies its curved
roof, red framing, white panels and lower lattice. Changing its orientation
would conceal the underlying duplicate instead of removing it.

The preserved orientation is also consistent: R69 cancels the source object's
old quarter turn to local yaw `-.06`; geographic anchor yaw is
`-pi/2+.06`, giving net `-pi/2`. Its local +Z prayer front therefore faces
west/-X toward the upper stair. No arbitrary spin or replacement shrine is made.

## Candidate implementation

`buildOkumiyaStairLanternsR95(root,features,network,materials,colliders,{terrainPositions})`
builds the two lanterns at the actual mapped footprint centres and returns
`builtIds`. Add those IDs to viewer `excludesBuilding` only after this builder
runs. A prior positive `sourceFeature` owner is preserved. Missing actual
rendered triangle support or required materials leaves the ID unexcluded.

Each lantern has a battered stone plinth with horizontal stone collars, four
open red corner posts, recessed black lattice, deep lintels and continuous
swept gable roof planes with red eave fascia and dark ridge. Plinth footprint
2.06m, plinth top2.08m, frame about1.95m and total4.87m are photographic estimates
fitted to approximately2m mapped footprints. They are not surveyed dimensions.
No invented text, carvings, interior room, emitted light or runtime animation.
The actual footprint corners seat the base below the lowest rendered triangle
sample; no analytic DEM fallback is used. Four static batches per lantern.

The return also includes `way/301527733` **only if** an existing group with
`zone==='okumiya'` and positive `okumiyaDetail` evidence exists. This is the
conditional exclusion of a duplicate fallback, not a request to hide the real
shrine. Root owns the single integration/exclusion edit.

Three tests pass: two complete finite/budgeted footprint owners with seated
bases and idempotence; conditional shrine fallback exclusion; prior-owner and
missing-support protection. `git diff --check` passes. Actual geometry source
counts, root's next assembled render, final lantern scale/roof silhouette,
unoccluded R69 facade, route collision audit and native materials remain the
acceptance gates. No renderer/GPU was started here and no commit was made.
