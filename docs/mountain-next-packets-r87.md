# R87 second cycle — next structural mountain packets

Planning and source inspection only. No new runtime geometry was added in this
cycle. The earlier Ainomine underside/board correction is a small component;
it does not satisfy reconstruction of the whole precinct or mountain itinerary.

## What was actually inspected

Read `okusha-details.mjs`, `okusha-court.mjs`, `yotsutsuji.mjs`, the Okusha and
Kumataka sections of `legacy-builders.mjs`, `mountain-landmarks-kumataka.mjs`,
`mountain-torii.mjs`, `integration.mjs`, `anchors.json`, and the corresponding
checked-in OSM features. Official map/pages were reopened. The following real
photographic pixels were downloaded temporarily and visually inspected; source
photos are linked rather than redistributed as repository assets.

| Photo ID | Actual photographic source | Visible evidence | Limits |
| --- | --- | --- | --- |
| OKU-OFFICIAL-01 | [Official Okusha photo](https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg), from [official page](https://inari.jp/en/map/spot_08/) | Open vermilion worship pavilion, white soffit, timber rafters, lattice enclosure, separate rear roof/building | Official current page, photograph date unknown; no measured dimensions |
| KUMA-TERRACE-2019-33 | [2019 approach photograph](https://livingkyo.com/wp-content/uploads/2019/07/200_33.png), contextual [firsthand walking report](https://livingkyo.com/4521/) | Multiple rough-stone retaining tiers, stone tamagaki, roofed timber fitting, narrow turning steps, several gate levels | Historic appearance; exact parcel boundary and stone inventory unmeasured |
| MITSU-JUNCTION-2019-41 | [2019 junction photograph](https://livingkyo.com/wp-content/uploads/2019/07/200_41.png) | T-junction landing, stone boundary posts, stair mouth, signs and torii to one side | Signs cannot define a building footprint; lighting/vegetation are date-specific |
| MITAMA-STREET-2019-43 | [2019 street photograph](https://livingkyo.com/wp-content/uploads/2019/07/200_43.png) | Close timber frontage on both sides of paved/stepped lane; left upper timber balcony, framed translucent overhead canopy | Which canopy edge belongs to which building needs footprint/panorama reconciliation |
| YOTSU-EDGE-2013-12 | [17 February 2013 photograph](https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji12.jpg), [dated photographer page](https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji11.html) | Tea-house side on tall irregular stone retaining edge; sharply descending stair/torii branch, planted shoulder and city view | Old source; not a current survey or proof of present railings |

The [official map](https://inari.jp/trip/map01/) establishes named shrine context,
not shop facades, exact heights, stair counts or cadastral boundaries. User
videos [zFKeYi0AK0M](https://www.youtube.com/watch?v=zFKeYi0AK0M) and
[FmRyJ-RtBPg at 1:24](https://youtu.be/FmRyJ-RtBPg?t=84) remain cross-check leads;
this cycle adds no verified timestamps or extracted video frames.

## Packet 1 — Okusha fore-pavilion and rear sanctuary separation

**Priority:** highest structural silhouette correction on this itinerary.

**Geographic ID:** `way/301527734`, anchor `okusha`. Its checked-in polygon is
not a simple rectangle: it includes a front broad body and a narrower rear
extension. OSM elevations range across the hillside and do not establish floors.

**Missing/incorrect structure:** the original hall was one box; the current
`buildOkushaCourt` removes that box/flat roof but replaces it with a back slab,
two full-height side slabs and one roof. This does not reproduce the officially
photographed open fore-pavilion with its separate rear roof. Existing ema,
Omokaru pair, reception/service buildings and their interactions already exist;
they are not a reason to add another generic courtyard.

**Exact future owner:** `okusha-details.mjs`, function `buildOkushaCourt`.
Replace its existing hall replacement block in place. Root owns any necessary
integration/collision handoff. Do not add a second overlapping hall in a new
module or remove the preserved interaction body without transferring selection.

**Implementation boundary:** derive front/rear volumes from this one mapped
polygon; resolve its axis against the official facade and existing shared Senbon
exit before authoring. Model open column/beam pavilion, observed white soffit,
rafter rhythm and lattice; separate rear sanctuary roof only inside the mapped
rear extension. Preserve current access routes and interactions. Roof pitch,
floor separation and structural spacing remain explicit estimates until measured.

**Confidence:** high for two-stage architectural form and open facade; medium
for polygon-to-volume correspondence; low for precise dimensions/restoration date.

**Acceptance:** before/after front, side, rear and entry views; no opaque wall
across the public pavilion entrance; all new solid geometry has matching collision;
both Senbon exits and Omokaru/ema approaches remain clear. Confirm actual source
interaction ownership before removing anything. No exact historical claim.

## Packet 2 — Mitsutsuji built street, not an empty torii junction

**Geographic IDs:** anchor `mitsu` is `node/9667109064` at
`[556.65,102.56,-336.786]`, explicitly a mapped information board named
`三ツ辻周辺案内図`, not a surveyed centre of the junction. Nearby buildings:
`way/301527744` (三玉亭 gift shop), `way/301527777` (三玉亭 cafe),
`way/301527778` (京屋 cafe). Two nearby shrine ways `626342329` and `626342331`
must not be assigned names by proximity alone.

**Missing structure:** code search finds route/torii coverage and the anchor but
no dedicated Mitsutsuji frontage builder. Generic mapped shells can supply mass,
but cannot represent the narrow two-sided timber lane, upper balcony and framed
translucent canopy seen in MITAMA-STREET-2019-43. Do not confuse Mitsutsuji with
`mitsurugi`, which is a separate summit-loop shrine.

**Exact future owner:** new `mitsutsuji-frontages.mjs`, with a site-specific
`buildMitsutsujiFrontages(root, features, surfaces, materials, colliders)` builder;
layout and tests stay adjacent. Root alone registers `builtIds` to suppress the
generic shells and adds the integration call. Do not abstract a generic shop kit
before this one street has a verified layout.

**Implementation boundary:** first reconcile both 三玉亭 footprints and their
frontage with a second ground view/panorama; the street photo alone cannot choose
which facade belongs to which footprint. Preserve mapped path polygons and DEM
source. Then implement those verified timber facades and canopy ownership only.
Keep 京屋 as existing shell until separately matched to its facade reference.
Do not place a canopy across the lane on photographic perspective alone.

**Confidence:** high for presence/type of built street, high for OSM named
footprints as dataset facts, medium/low for photo-to-exact-wall correspondence.
**Status:** architecture justified; placement handoff gate still open.

**Acceptance:** reconcile building IDs in annotated plan and two ground views;
clear all public stair mouths/branch widths; canopy must clear walking headroom
and existing gate roofs; original generic shells excluded exactly once. Render
uphill, downhill, junction and cross-lane views; do not treat route graph success
as proof of last-metre clearance or a measured shop interior.

## Packet 3 — Kumataka approach terrace structure

**Geographic ID:** `way/301527741`, anchor `kumataka`; mapped as `building=roof`.
This footprint does not define the complete terraced memorial compound.

**Missing structure:** the existing legacy group has a pond plane, straight
shore wall/rail, shrine base, 28 repeated steles and some simplified foxes. The
R67 refiner improves the pavilion only. The observed approach's stacked rough
masonry, tamagaki terrace edges and turning step structure are absent from that
repeated-stele layout. More randomly distributed stones would not solve this.

**Exact future owner:** new `kumataka-approach-terraces.mjs`, preserving the
existing `mountain-landmarks-kumataka.mjs` pavilion ownership. Root supplies the
same geographic rigid transform and exclusively owns removal/replacement of
legacy repeated steles where a verified terrace overlaps them.

**Implementation boundary:** establish the photographed approach orientation and
terrace boundary using a second view plus checked-in path/terrain polygons.
Capture which stair is public and which only accesses a memorial tier. Build
only matched retaining edges and tamagaki; do not infer an entire compound from
the `building=roof` polygon. No new pond shoreline, arbitrary broad grading,
measured stair count or unverified shrines. Keep this packet blocked from geometry
until its boundary is matched; its architectural need is verified now.

**Confidence:** high for terrace/stone-fence/turning-stair vocabulary; medium
for identification as Kumataka approach from firsthand sequence; low for exact
geographic boundary and levels. Current DEM is not a terrace-level survey.

**Acceptance:** source-matched plan, two sections, uphill/downhill ground renders;
retaining walls meet ground without suspended stele rows; mapped main route stays
clear in both directions; pond/pavilion identities and interactions retained.

## Yotsutsuji — existing coverage and next reconciliation

`yotsutsuji.mjs` already owns Nishimura-tei `way/301527779`, its annex
`way/626313775`, Okumura-tei `way/626313685`, footprint roofs, generic windows,
awnings, thin wall-edge foundations, forecourt, benches and two mapped gate
branches. It must not receive a duplicate tea house or another generic bench pass.

YOTSU-EDGE-2013-12 shows a much more specific stone retaining embankment beneath
the tea-house side and a tight descending gate/stair interface. Existing thin
foundation boxes and a 3.7 m low outlook wall do not establish that structural
edge. This is the next lower-priority packet after the three above: extend
**`yotsutsuji.mjs` only**, after matching the photographed wall to the correct
tea-house polygon edge and verifying a recent view. Preserve `yotsuForecourt`,
all existing stair mouths and the accepted city-facing lookout. High confidence
in historical retaining-edge form; current dimensions and state unresolved.

The full Okusha → Kumataka → Mitsutsuji → Yotsutsuji journey remains **incomplete**
as an architectural replica. These packets identify verified structural work and
the evidence gates needed to implement it; they are not claims of completed work.
