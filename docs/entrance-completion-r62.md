# R62 — whole entrance completion inventory

Research and implementation record, 21 October 2026. This
package treats the whole Omotesando/three-shrine/Gishikiden/Temizuya ensemble
together. It does not declare an exact replica or authorize invented placements.
Coordinates are world X/Z metres. The inventory below preserves research
decisions; the implementation and verification summary is the current status.

## Implemented and verified in R62

- Three roadside shrines: curved roof profiles, gable infill, ridge details,
  small bells, reed screen and restrained gold/cloth details from individual
  photographed facades. Existing footprints and collision ownership retained.
- Court: exact clipped paving at diagonal path edges, preserving building and
  water exclusions. Pine needle crowns and bark replace generic broad leaves
  on the three photographed pines; the broadleaf tree remains separate.
- Mapped inscribed stone monument `node/10236493859` restored at its mapped
  position; dimensions and facing remain photographic estimates.
- Gishikiden: deeper facade fins, glazing divisions, mapped entrance canopy,
  two supports, glazed doors and paving restricted to the canopy footprint.
- Photo-registered guardhouse/toilet frontage: narrow windows, upper glazing,
  stone dado, door canopy and pitched tiled roof on its existing map polygon.
  Hidden elevations remain restrained rather than invented.
- Dry basin garden: hollow trough, companion stone lantern, low brick edge,
  bounded fine-grain green surface and a coordinated opening in the single
  source hedge. The photo establishes the ensemble, not surveyed dimensions.
- Removed obsolete exclusions for two already-deleted legacy shop footprints,
  restoring a real mapped neighbouring building without duplicating it.

Validation: 135 Node tests pass; changed modules pass syntax checks and diff
review. Native browser inspection covered the court on foot and from above,
the garden, guardhouse roof and walk from Omotesando to the covered entrance.
No console warnings or errors appeared on the final loaded scene. The basin
builder also produced six valid merged meshes in a real Three.js harness.
Geometry remains merged/instanced; no dependency or dynamic light was added.
This is not an FPS benchmark or verification of every seasonal/night view.

The whole precinct is not yet an exact replica: distant generic buildings,
unregistered ground cover beyond the photographed beds, hidden elevations and
photographic dimensional estimates remain. These are not marked complete.

## Current ownership and evidence

Omotesando already has mapped paving, shoulders, white walls, hedges, mapped
trees, parking surfaces, first-gate alignment and the relocated station. R56
removed the unsupported fourteen-lantern row and Welcome labels. R59 built
the three shrine bodies, six sourced enclosure lines, mineral court and bicycle
recess; R60/R61 added court accessories, trees, shrine detail and Gishikiden
screen massing. Do not rebuild these as missing features.

Reference anchors for a single coordinated visual pass:

- User video [00:28](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=28s)
  and [00:43](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=43s), local
  `outputs/r56/reference-0028.png` and `reference-0043.png`: white plaster
  over timber, mature broadleaf silhouettes, low stone/seto edges, narrow lights.
  The 00:28 saved frame was visually inspected in the earlier R56 audit.
- [Omotesando guide](https://fushimiinari-guide.com/omotesando/) and
  [three-shrine frame](https://fushimiinari-guide.com/wp-content/uploads/IMG_6470_20210313.jpg),
  documented in R59–R61: entire small court, three shrines, rear vegetation,
  masonry and furnishings. Earlier notes describe inspected pixels; this audit
  does not claim a new image inspection or independent dimensional survey.
- Gishikiden sources and historical-condition caveats are in
  `docs/entrance-gishikiden-r60-research.md`. OSM `way/223276575` still carries
  `building=construction`, `construction=hotel`, name 儀式殿. A photograph-led
  envelope must not be sold as a verified present-day operating use.
- User `photo_2_2026-10-20_17-41-36.jpg`: Rōmon stair, gravel flank and granite
  transitions. `photo_1` shows Azumamaro, not all of Omotesando.

## Actionable visible gaps: one coordinated package

| # | Gap / existing code ownership | Concrete next implementation or acceptance work | Source/location confidence |
| --- | --- | --- | --- |
| 1 | **Three retained interpretive shop assets and overlap exclusions.** `entrance-neighborhood-layout.mjs` still excludes mapped buildings against five historical shop centres, despite R59 removing two shop bodies | Reconcile its `oldShopCenters` with actual surviving groups. Audit each skipped source ID and restore any footprint suppressed by a now-absent shop. Preserve surviving user-visible assets until matched to a real building; replace each only with explicit ownership transfer | Centres stored as [−89.35,−7.96], [−78.34,−8.22], [−89.16,20.07], [−78.68,19.45], [−68.70,18.85] are **legacy overlap estimates**, not surveyed buildings. Concrete source/code discrepancy; visual severity must be checked |
| 2 | **Gishikiden top silhouette remains a single interpreted envelope.** `entrance-neighborhood.mjs` uses screen fins and open rails | Compare both documented R60 viewpoints at once, fit stepped upper masses and rail levels within the same polygon. Preserve single-ID 16 m estimated height until references warrant correction; twenty bands must never become twenty floors | `way/223276575`, X −87.676…−58.767, Z −60.602…−31.147. Footprint high; elevation/roof setbacks estimated; R60 explicitly leaves upper setbacks unresolved |
| 3 | **Gishikiden approach and rear access lack completed visual correspondence** | Walk mapped access `way/626313860` from Omotesando to its north endpoint in both directions. Seat adjoining wall bases, retain source gaps and identify entrance glazing/canopy only when a reference locates it. Do not add a door at a guessed centre | Existing 5 m footway [−36.280,3.918] → [−57.471,−36.457], intermediate bends retained. Geometry high; designation of final doorway unconfirmed |
| 4 | **Three-shrine mineral court/access junction still has inferred apron limits** | Review the whole junction from avenue → branch → shrine fronts, including off-centre passage, slope breaks and wall feet. Refine the apron boundary against source wall ends; avoid tiny separate patches. Keep the main route and actual shrine step surfaces authoritative | Branch `way/1133052415` [−73.144,6.724] → [−73.399,−7.670]; court envelope X −85.4…−69.2, Z −20.5…−4 is inferred. Shrine POIs: Kumano [−81.190,−16.820], Fujio [−77.139,−16.676], Reikon [−72.487,−16.587] |
| 5 | **Court tree locations, lantern positions and cabinet/board clearances remain approximate** | Register the full court accessories/tree group against the same IMG_6470 view rather than adding more fixtures. Match visible inter-shrine gaps, rear crown silhouettes and court margin as one composition; do not silently describe these roots as OSM trees | Existing tree roots [−83.6,−19.4], [−79.1,−19.6], [−75.4,−19.6], [−69.9,−18.8] are photo-estimated. Stone lanterns [−79.1,−14.25], [−74.9,−14.25] and tall end lanterns [−84.3,−14.1], [−69.6,−14.1] also approximate. Bodies already built |
| 6 | **Temizuya transition remains separated from its exact mapped point by an inferred adapter** | Review canopy-to-corridor clearance, basin approach and the full 3 m lateral route in one view. Preserve `mappedTarget` provenance and improve ground/stone junctions before moving the pavilion again. Check no copied canopy duplicates source roof | POI `node/10564318622` [−6.951,−14.338]; source roof `way/105449723` X −18.053…−11.357, Z −12.880…−4.787; roof identity unresolved. Route `way/899428253` [−18.300,1.959] → [−19.905,−20.561] is mapped. `separatedTemizuya()` remains video-inferred |
| 7 | **Unfinished neighbourhood facades flatten the lateral scene into generic masses** | Prioritize the already named guardhouse and the directly photographed Minami building as a coupled street edge. Refine only observed public-facing surfaces. Unnamed houses retain neutral massing until images are registered; no invented shops/signs | Guardhouse `way/260121327`: X −43.961…−26.145, Z −24.045…−13.626. Minami `way/260121332`: X −51.578…−29.028, Z −41.121…−21.418. Minami's R58 roof/facade already authored; guardhouse is not proven to be the user's unidentified shop |
| 8 | **Approach lighting/garden widths remain unregistered along the full avenue** | Compare both R56 frames from fixed matched views; register each visible narrow light before adding it. Audit old tall sugi independently against mapped trees; retain sourced camphor and broadleaf positions. Complete wall/hedge/shoulder seating together | Avenue `way/105449722`, X −157.407…−18.300, width 8 m. White wall `1133052410`, hedge lines `1133052411/12`, `1133053711` already owned. Source coordinates strong; fixture count/stations and garden widths unresolved. Do not recreate repeated stone lanterns |
| 9 | **Entrance pillar and unused basin remain missing, but placement is unresolved** | Match source guide frames to wall ends, gates and mapped routes before modelling. Inventory both separately; do not replace the purification basin or move the first-gate monument to make them appear present | Named shrine-court pillar `node/10236493859` [−70.288,−5.944] is independently mapped, but [IMG_5726](https://fushimiinari-guide.com/wp-content/uploads/IMG_5726_20210313.jpg) must be matched before asserting same photographed pillar. Old basin [IMG_7702](https://fushimiinari-guide.com/wp-content/uploads/IMG_7702_20210405.jpg): existence supported, precise X/Z not established; hold placement |

## Completion gates for the whole package

Use one set of fixed view poses: station/first torii toward Rōmon, midway
avenue, three-shrine court facing north, north court facing avenue, Gishikiden
approach north endpoint, Temizuya arrival and Rōmon stair flank. For each,
compare supported geometry, paving, foliage silhouette and wall seating with
the registered reference. Follow with continuous main-avenue and both lateral
walks, checking source openings, stairs and off-centre collision.

Review ownership/exclusions before adding geometry; historical inventory text
is not current completion status. No single test or screenshot certifies all
these routes. Measure performance on the same full views, and check night and
seasonal states once appearance/geometry settles. No new dependencies, large
photo textures or generic abstraction are required by this inventory.

The strongest immediate broad change is **ensemble correction of existing
ownership, silhouettes and surface junctions**, followed by reference-registered
details. Features with unknown locations remain explicit holds within the same
package rather than guessed decoration or claims of complete reconstruction.

## R62 continuation: unused basin registration

Actually inspected both guide photographs in this continuation:
[IMG_7702](https://fushimiinari-guide.com/wp-content/uploads/IMG_7702_20210405.jpg)
and [IMG_7705](https://fushimiinari-guide.com/wp-content/uploads/IMG_7705_20210405.jpg).
Local reference copies are under ignored `outputs/r62/basin-7702.jpg` and
`basin-7705.jpg`; neither is a project texture or publishable asset.

Two independent visible relationships are now established:

1. The rectangular dry basin and tall stone lantern occupy the **same long,
   brick-edged planting strip**. IMG_7705 includes the basin farther along the
   strip beyond the lantern, separated by clipped shrubs. They must not be
   built as two disconnected garden islands.
2. The basin is immediately in front of a mature flowering cherry, with red
   timber railing behind the planting and a low tiled wall behind its lateral
   left side in IMG_7702. Its front sits behind the brick curb and public paved
   frontage; it is not centred on a walking route or part of Temizuya's canopy.

The guide text independently locates it on the **left/north side before the
second torii**, distinguishes it from the active purification pavilion and
identifies it as unused. The photograph confirms a hollow dry trough; no water
animation, ladles or new public purification interaction is justified.

Possible registration search area is X approximately −60…−48, Z −12…−3:
mapped tree `node/10564299665` is at [−58.621,−5.354], hedge
`way/1133052439` runs [−53.822,−11.655]→[−48.805,−3.184], and source tiled
wall candidate `way/1133052438` is farther behind the approach. This is a
**search hypothesis**, not an accepted basin coordinate: the tree lacks cherry
species tags and the pictured brick curb is not independently mapped. The
guardhouse `way/260121327` and second torii `way/359847610` constrain the
surrounding scene but do not uniquely locate the basin from these two photos.

Therefore no `entrance-roadside-basin.mjs` was authored. Next registration must
show the garden bed and one identified mapped wall return, tree trunk or gate
in the same continuous video/Street View view. Only then should the paired
basin/lantern/curb ensemble receive a recorded inferred placement. This hold
avoids turning a plausible neighbourhood into an invented exact position.

### Registration resolved by two additional wide views

The earlier hold above was revisited rather than treated as permanent. Actually
inspected [DSC_0516-1](https://www.goriluckey.com/wp-content/uploads/DSC_0516-1.jpg)
and [DSC_0537-2](https://www.goriluckey.com/wp-content/uploads/DSC_0537-2.jpg),
linked from the [2017 cherry reference](https://www.goriluckey.com/archives/20170310_fushimiinari-sakura.html).
The first includes the same lantern, dry trough, clipped shrubs and brick edge
with the distinctive Gishikiden facade and its entrance drive directly behind.
The second looks from that cherry bed toward the second torii and Rōmon. This
registers the **ensemble** on the west side of Gishikiden's eastern approach,
along mapped hedge `1133052439`, rather than assigning it to the guardhouse.

`entrance-roadside-basin.mjs` now offers the hollow dry trough, seated on terrain,
at estimated station .45 along that hedge and 1.10 m into the garden side:
approximately X −52.51 / Z −7.28. The long axis follows the source hedge. Exact
station, inset and 1.90 × .80 × .72 m dimensions remain explicit photographic
estimates. The two wide views resolve which bed owns it; they do not establish
centimetric coordinates, a complete brick-bed outline or seasonal tree roots.
No lettering, water, ladles or active purification interaction was invented.
The nearby lantern and further bed context remain separately owned work.

The continued ensemble pass now includes the photographed companion lantern,
an estimated 2.60 m garden-side strip following hedge2439, and two low brick
courses at its front. The lantern is estimated at station .87 along the same
line, inset 1.10 m; it is not a mapped lantern point. Existing hedge geometry
is not duplicated. Source building, water and path exclusions conservatively
clip every ground cell and brick section; the lantern is omitted if its full
footprint conflicts. The green surface is muted low moss/grass appearance
supported by the photos, not a general grass landuse polygon or invented lawn
over neighbouring access. No seasonal cherry tree is added at an unregistered
root. These new forms are static merged batches; there are no point lights.
