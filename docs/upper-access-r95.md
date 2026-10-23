# R95 Tamayama–Okumiya main stair sector

This packet addresses the complete main Okumiya stair's side structure and
adjoining southern woodland, rather than adding another isolated prop. The
architectural production skill/process was read. Native render acceptance stays
with root; no 3D browser or GPU session was opened here.

## Source and ownership audit

Re-inspected actual saved user-video pixels `outputs/r77/video-0605.png` and
`video-0615.png` under `fushimi_inari/`. At 06:05 the broad granite flight has a
continuous low north-side stone coping with dense woodland beyond; the central
brown twin rail already has a correct separate owner. At 06:15 the opposite
south-facing wooded bank is separated from the stair by square stone posts,
open horizontal stone rails and low stone base. Temporary crane/cones/work
materials are excluded. At 06:25 the upper gate and adjacent shrine/roofed
lantern already have owners. These are historical paused captures of
[iqK2tg-TxbY](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=365s), not new
continuous video playback.

Existing code ownership checked: `tamayama-stair-borders` owns only western
`105449693`; it does not cover upper `626313768`. `tamayama-stair-rail` owns
central dividing rails. `near-precinct-enclosures` owns a red return north of
Okumiya, not this stone stair balustrade. Stored actual assembly
`fushimi_inari/outputs/r78/okumiya-review.png` was inspected and shows the upper
flight's missing side coping/stone balustrade. That older render identifies a
code-level omission; it is not R95 final visual evidence. The global forest
starts at x110 and the accepted Tamayama south bank ends before x94, leaving
this bounded southern bank without a dedicated structural vegetation layer.

## Coherent changes

1. Both flanks of resolved `626313768` receive a continuous segmented stone
   retaining base and projecting coping, following its full flight and existing
   tread levels. Whole conflicting sections are omitted at other routes,
   building envelopes and pre-existing solids.
2. Its photographed south/+Z edge receives open square stone posts and two
   sloping horizontal stone rails. This preserves openings between members;
   no continuous opaque screen is added. Existing lanterns, torii and centre
   handrail remain under their original owners.
3. Three photo-inferred mature broadleaf/low-growth pockets at `[102,-10]`,
   `[106,-8]`, `[110,-6]` articulate the wooded south slope behind the stone
   edge. Explicit roots and deterministic leaf clouds replace generic lawn
   filling. Prior tree/solid owners suppress new trunks; actual leaf corners
   stay outside all resolved walking widths and conservative roof envelopes.

Mapped alignment, width, tread counts, public heights and terrain remain
unchanged. Stone thickness .36m, projecting cap .44m, post width .28m,
approximately 1.35m post spacing and .91m upper rail/post height above the low
base are photographic estimates. Root stations, 8.1–9.1m tree height and botanical
appearance are inferred, not a surveyed tree inventory. Source periods are mixed.

## API and verification

`buildUpperAccessR95(root,features,network,materials,colliders,{terrainPositions})`
returns `{built,edges,posts,rails,trees,growth,skipped,triangles,drawBatches,newColliders}`.
Call after final path resolution, final rendered terrain positions and prior
forest/landmark colliders are available. Required materials: existing stone plus
wood/timber/roof material. Foliage reuses the procedural cutout leaf material.
Three static material batches, no new texture asset/dependency, light or runtime
update loop. Existing populated colliders are read for duplicate avoidance;
only accepted new solids are appended. Repeated calls are idempotent.

All solid bases derive from actual rendered triangle samples. Coping and post
footprint corners are sampled individually and buried 9cm below the lowest
sample; a later check strengthened the initial centre-only post seating to
avoid exposed toes on sloping triangles. Missing support withholds the relevant
geometry. Terrain sampler construction filters only nearby actual triangles.

Four focused tests pass using real mapped features and a resolved 22-step/6m
fixture: both edge sides/open rails/vegetation/source immutability; new solid
walking clearance and finite geometry; actual foliage vertex route/roof
clearance; existing-owner suppression and missing support. Fixture remains
below 11,000 triangles and uses three batches. `git diff --check` passes.

No shared integration or viewer file was edited and no commit was made. Final
assembled triangle contacts, reference-matched stone spacing/silhouette, actual
route collision audit, native foliage appearance, night view and measured frame
cost remain root acceptance gates. This packet does not claim a surveyed or
fully accepted Tamayama–Senbon reconstruction.

## Fresh June 2012 reference check

Inspected root's new actual Street View captures
`outputs/r95-references/okumiya-downhill-streetview-2012.png` and
`okumiya-side-landing-streetview-2012.png`. Looking downhill west, the open
square-post stone fence is on image-left: the south/+Z flank used by this
builder. The opposite side has the lower stone edge and a large roofed lantern
on a tapered stone plinth. The upper terrace is paved, has a transverse grated
drain at the stair head, red timber enclosure returns and a fox pedestal beside
the plinth; abundant mature crowns close the backgrounds. No side reversal is
required. Camera lens/panorama distortion prevents extracting surveyed lengths.

The transverse drain already has a specific existing owner:
`near-precinct-drains.mjs`, `Okumiya upper landing drain`, mapped
`1392716577` station .65 and 5.8m inferred span. Existing upper landing, lantern,
fox, red enclosure and shrine owners remain responsible for their appearance
and size; this packet adds no duplicate drain, statue or plinth. The new pixels
do not establish an additional longitudinal drainage run or another railing
return, so none is fabricated.

One actual completeness gap was corrected: stone posts had solid collision but
the open rails between them did not. Each accepted rail span now has a thin
physical boundary collider across its two visible rails, outside the mapped
walking envelope. Its midpoint is independently rejected at route/roof/prior
solid conflicts, preserving existing openings. The test asserts exactly one
boundary collider per accepted visual rail span and repeats route clearance.
All four tests still pass. Geometry/material/vegetation counts are unchanged.

Remaining grounded visual gaps are the source's massive lantern plinth scales,
fox/upper-landing registration, drain continuity with the final paving, and
canopy density beyond both flanks. These require root's assembled views, because
their owners already exist and this reference pass alone does not prove a
missing production object. No blanket claim of source-exact continuity is made.
