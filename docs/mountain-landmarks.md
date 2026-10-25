# Mountain landmarks: Ainomine and Kumataka

Verified and implemented 21 October 2026. This records a bounded reconstruction
pass, its evidence and its remaining estimates. It does not claim that the entire
mountain circuit or the dimensions of either shrine have been surveyed.

## Reference evidence

| Primary source | Established evidence | Use in this revision |
| --- | --- | --- |
| [Official Inariyama description](https://inari.jp/en/map/spot_01/) and [official map](https://inari.jp/en/map/) | Ainomine belongs between Sannomine and Ninomine on the mountain, separate from the entrance shrines | Dedicated identity and checkpoint on the existing mountain circuit |
| [Official Ainomine page](https://inari.jp/en/map/spot_12/) | Ise no Okami; distinctive stone nune torii with paired inclined sasutsuka members | Grey stone gate with the recognizable paired diagonal members |
| [Official Ainomine photograph](https://inari.jp/en/wp-content/uploads/2016/09/ainomine.jpg) | Stone posts and lintels, small timber sanctuary, red curtains, hanging rope/paper and flanking stone lanterns | Broad architectural form at the mapped building |
| [Google Maps 360, Zen Mind Kyoto, September 2018](https://www.google.com/maps/@?api=1&map_action=pano&pano=CIHM0ogKEICAgICE3p3atQE) | Stone gate in front of the timber sanctuary, central gathering of the red curtain, white embracing-rice-sheaf crests, coloured hanging rope and vertical plaque | Refined curtain silhouette and small geometric crests; no copied photographic texture or invented lettering |
| [Official Kumatakasha page](https://inari.jp/en/map/spot_09/) | Shin-ike/Kodamagaike, stone worship area projecting toward the pond and Kumataka Okami memorial | Identity retained; no inference of a new shoreline from a facade photograph |
| [Official Kumatakasha photograph](https://inari.jp/en/wp-content/uploads/2016/09/kumatakasya.jpg) | Open dark timber frame, pitched metal roof, **vertical** gold plaque, thick straw rope and hanging fringe, coloured cloth strips and dense votive furnishings | Replace the opaque vermilion box and flat roof while retaining surrounding objects |
| Checked-in [geographic features](../fushimi_inari/geography/features.json) and [terrain](../fushimi_inari/geography/terrain.json) | OSM building/POI identity, footprints, public paths and the project's DEM heights | Placement, scale boundary, path attachment and walkability verification |

Both official photographs were opened and visually inspected in this pass. The
Ainomine official source is only 224 × 168 pixels, so it establishes broad forms rather
than fine joinery, inscriptions or exact proportions. The September 2018 Google
Maps panorama was also opened and visually inspected, resolving curtain details
that were indistinct in that photograph. A second nearby panorama by Takanori
Kono, dated April 2024, shows dense votive stones, terraces, lanterns, foxes with
red bibs and close forest; it is context for future compound work, not a survey
of the full Ainomine facade. The Kumataka official source is
603 × 768 pixels and principally shows the facade. Reference images are not
redistributed as repository assets or loaded by the scene.

The earlier [Ainomine investigation](ainomine-reference.md) remains the detailed
geographic record. Its statements that the photograph had not been inspected
and that architecture was still absent describe that earlier investigation;
the implementation and limitations recorded here supersede those two statuses.

Selected paused frames of the user-provided
[walking video](https://www.youtube.com/watch?v=iqK2tg-TxbY) were inspected at
11:15, 21:30 and 26:53. The [trail and bamboo review](mountain-trails-bamboo-r66.md)
records the visible evidence at each timestamp. The 21:30 frame adds context
for Shin-ike's worship setting and dense furnishings. These selected views and
the two panoramas do not establish complete coverage, exact dimensions or a
measured continuous route.

## Ainomine / Kada-sha

### Placement and public circulation

The new sector uses building and POI `way/626313742` (`name=荷田社`) at
`[939.488, 196.93, 0.456]`. Its four mapped footprint corners are retained.
The measured footprint in the project coordinate system is approximately
3.244 × 1.668 m; that is the OSM building footprint, not a survey of its compound.

The adjacent public route remains `way/1372826374`, north of the sanctuary.
The existing graph already connects this point to Sannomine and Ninomine.
The new shrine is a side destination; it does not turn the main trail into a
passage through the altar or rear wall. Neither source paths nor DEM data are
changed. The anchor has `radius: 0`, so adding it does not flatten a broad area
of mountain terrain through integration's anchor grading.

The building frontage is inferred from the footprint's long axis and its
relationship to the nearest public path. It faces that path. The panorama
supports the general gate-to-sanctuary arrangement, but the precise doorway
orientation, last few metres of approach and original boundary have not been
measured from the available overhead data and ground views.
This choice is recorded as an inference in the returned plan and runtime stats.

The small platform sits 0.035 m above the highest existing footprint corner.
For the checked-in terrain and path surfaces used by the isolated test, its
altitude is 197.051845 m. Five short terrain-seated treads connect its edge
toward the route. These are inferred scene geometry, not a claim about a
photographically counted original flight. Their polygons are clipped outside
the mapped 2 m public route; none covers the route with a raised cross-slab.
The last tread is 0.20 m below the platform, within the runtime's 0.24 m floor
acceptance window even before the raycast floor offset is added.

### Architecture and collision

The dedicated `mountain-landmarks.mjs` builder adds a stone nune torii, small
timber sanctuary, restrained grey pitched roof, red curtains gathered at the
centre, small white embracing-rice-sheaf crests, altar and small votive torii,
rope and paper, and two stone lanterns.
It reuses the existing fine stone material for walkable floors and shares
materials and static geometry batches for its details. It adds no light,
animated object, fetched texture, transparency layer or frame update.

The gate is approximately 3.185 m tall, with its post centres 2.20 m apart.
These dimensions are modelling estimates constrained by the small footprint,
not measurements extracted from the photograph. The crests are simplified
geometry; fine joinery and inscriptions are not reconstructed. The visible
vertical plaque remains a follow-up detail. The top lantern roofs
have upward-facing triangles and physical square roof bounds; lateral timber
screens also have colliders. Lanterns sit 0.16 m farther behind the frontage
than an initial prototype to leave the full adjacent path width clear.

There are 12 local colliders: two stone posts, two timber posts, two side
screens, a rear wall and altar, plus separate pedestal and roof boxes for each
stone lantern. The central approach remains open in front of the altar.

### Clearance from the existing mountain torii

Reviewing the new approach together with the actual mountain gate generator
found three inferred gate stations that intersected it or the sanctuary. The
builder now prepares the approach, footprint, roof and lantern envelopes once,
then supplies a small exclusion callback to `buildMountainTorii`. A 0.10 m
allowance separates posts from these surfaces. The callback runs only during
static scene construction.

| Excluded inferred station | Reason |
| --- | --- |
| `sannomine-ninomine:64` | Side approach |
| `sannomine-ninomine:65` | Side approach |
| `sannomine-ninomine:66` | Sanctuary roof / lantern envelope |

Each station is omitted before its mesh instances, inscriptions and colliders
are emitted. The checked-in network therefore generates 1,287 mountain gates
instead of 1,290; neighbouring stations 63 and 67 retain their positions. This
small opening is an integration correction around the inferred approach, not
a claim that three individually surveyed real gates are absent. Runtime
`mountainTorii.landmarkExclusions` records the affected stations and reasons.

### Integration contract

```js
import {buildAinomine} from './mountain-landmarks.mjs';
import {buildMountainTorii} from './mountain-torii.mjs?v=67-mountain';

// After makePathSurfaces; before terrain/floor extraction, forest and merging.
const ainomine = buildAinomine(root, features, surfaces, legacy.materials, colliders);
if (ainomine) {
  anchors.push(ainomine.anchor);
  byId.ainomine = ainomine.anchor;
}
const mountainTorii = buildMountainTorii(root, legacy, spatial, surfaces, colliders,
  {excludeGate: ainomine?.excludeGate});
```

The existing generic-building exclusion checks `anchor.osm`, so registering the
returned anchor excludes `way/626313742` and avoids rendering two shrines on the
same footprint. `builtIds` also exposes the same identity. The anchor includes
an exterior `checkpoint` on the public path and a `lookAt` aimed at the shrine.
It is built directly in geographic coordinates, not passed through a legacy
source-to-target relocation. Calling the builder twice on the same root returns
`null` the second time instead of duplicating geometry and colliders.

## Kumatakasha facade refinement

The source scene already contains the pond, bank and railing, deck, shrine base,
two candle houses with animated flames, basin and roof, surrounding steles and
foxes, a shrine interaction and collision volumes. Those identities and their
positions are retained. This pass refines the pavilion already present there.

`mountain-landmarks-kumataka.mjs` recognizes the exact captured Kumataka group
and its original body, flat roof, red plane and plaque. If the source structure
does not match, it returns without partially changing the group. It is also
idempotent.

The same interactive body mesh receives an open timber frame in place of the
opaque red box. The original callback, description and selectable volume are
preserved; the selection envelope is used only by raycast and is never rendered
as an invisible transparent box. The original physical collision volume still
protects the whole pavilion, as the photograph does not establish public access
through its dense worship fittings.

The original flat roof and curtain plane are removed once. Their replacement is
a pitched copper-coloured roof with narrow standing seams, timber front gable,
thick rope, 176 static straw fringe strands, folded paper and a bundle of long
coloured cloth ribbons. The original vertical plaque object, material and
calligraphy texture are retained and repositioned below the ridge. The altar
and votive furnishings are a restrained interpretation inside the old volume;
their precise arrangement is not surveyed. The old 6 × 6.8 m roof envelope is
retained, with an estimated ridge at 4.55 m above the source group datum.

The source photograph establishes metal panels, timber, vertical plaque and
straw, but not every dimension, the rear wall, the compound extent or the pond's
bank outline. No new claim of a reconstructed shoreline is made. The official
page describes a belief concerning the **echo of clapping**. The preserved
legacy source has a different account, but the integrated viewer already uses
its neutral English lake/shrine description from `interaction-english.mjs`.
The callback and interaction object were not replaced by this geometry refiner.

Integration calls the refiner before relocating the captured source group:

```js
import {refineKumatakasha} from './mountain-landmarks-kumataka.mjs';

// In moveObject, before applying the geographic rigid transform.
refineKumatakasha(object, legacy.materials);
```

The returned stats are also stored at `object.userData.kumatakaRefinement`.
The function does not accept or modify the collider collection.

## Geometry and validation

| Component | Triangles authored in this pass | Material batches before global scene merging | Other cost |
| --- | ---: | ---: | --- |
| Ainomine complete sector | 4,558 | 10 | 12 colliders; 5 small approach treads |
| Kumataka refined body and added details | 4,593 | 10 | Includes the retained interactive body; 0 new colliders |
| Combined authored geometry | 9,151 | 20 | No added runtime update or light |

Kumataka's count includes the replacement body geometry and added static details;
it excludes the existing plaque (still 12 triangles), existing deck/base,
candle houses, bank, pond and surrounding shrine objects. It removes the former
flat roof and curtain meshes and replaces the old body geometry. Batches here
are the builders' material groups, not measured full-scene GPU draw calls or FPS.
Existing integration may merge static groups into its spatial chunks.

The [Ainomine component preview — archived](repository-archive.md#historical-review-evidence) (`review-r67/ainomine-software.png`) and
[Kumataka pavilion preview — archived](repository-archive.md#historical-review-evidence) (`review-r67/kumataka-pavilion-software.png`) render the
actual production geometry with EGL/llvmpipe and approximate diffuse materials.
They are not browser captures or full-scene performance measurements. The
Kumataka preview contains 4,629 triangles because it also includes 36 triangles
from the retained platform and plaque, outside the authored-geometry total above.

The retained automated tests cover meaningful failure modes:

```sh
node fushimi_inari/integrated-world/mountain-landmarks.test.mjs
node fushimi_inari/integrated-world/mountain-landmarks-kumataka.test.mjs
```

The first file runs without Three.js and reports five passing tests: source
geography remains unchanged, all new colliders leave the mapped route clear,
the central gate approach stays open while pillars block, and approach treads
join the platform without covering the main route or requiring excavation.
It also checks existing graph connections to both neighbouring peaks. Its fifth
case captures the actual post pairs of inferred gate stations 63–67: it reproduces
the prior collision correction of more than 0.30 m, excludes exactly 64–66,
retains both neighbours and verifies 546 approach samples without interference.

The Kumataka test requires the same Three.js 0.164.1 package used by the viewer.
For a Node-only checkout without dependencies, install it locally with
`npm install --no-save --package-lock=false three@0.164.1`; the browser's existing
CDN import map is unchanged. Its two
passing tests verify the original selection distance after geographic rotation,
the visual depth of the newly open facade, identity/callback preservation,
unchanged neighbouring objects, finite geometry, idempotence and failure to
partially rewrite an unrecognized source group.

An independent Three r164 geometry audit used actual extracted floor triangles,
the runtime's `walkHeight` acceptance rule and `SpatialCollisionWorld`:

| Ainomine audit | Result |
| --- | --- |
| Side approach, 3 lanes at lateral offsets −0.45 / 0 / +0.45 m, both directions | 540 samples; 0 collision corrections; maximum height step 0.199997 m |
| Existing northern path, 3 lanes at −0.72 / 0 / +0.72 m, both directions | 13,410 samples; 0 collision corrections; maximum height step 0.159497 m |
| Authored Ainomine mesh inspection | 0 non-finite coordinates; 0 degenerate triangles; upward walkable floor normals |
| Recheck with production mountain anchor grading and neighbouring mapped paths | Same 13,950 samples; 0 m change in sampled terrain or path heights |
| Recheck with actual mountain torii colliders after the three exclusions | Same 13,950 samples; no collision corrections on the approach or northern path; checkpoint clear |

The production-grading check includes the Sannomine/Ninomine anchor blend and
the neighbouring `way/1372826375` segment. The complete tested route band falls
outside those anchors' grading influence, so the isolated approach results
also apply to this integrated mountain placement.

A separate deterministic vegetation audit ran the existing legacy builder,
integration transforms, bamboo refiner and forest extension in Three r164.
The tested corridor spans local `u = ±1.08 m`, `v = 0.12…4.107 m`, including an
extra 0.28 m around the approach. No foliage geometry or tree collider enters
it. Nearest clearances from that already expanded corridor are 0.97 m for
legacy understory, 4.55 m for refined bamboo, 4.14 m for a legacy tree collider
and 5.35 m for a generated forest collider. The nearest canopy envelope stays
0.29 m to its side and begins 8.46 m above the platform. Of 116,000 raw instances,
572 within 30 m received detailed geometry checks; the maximum horizontal
envelope of 7.283 m excludes the remaining distant instances. Image loading
was simulated for this geometry audit; it is not a browser rendering test.

The full repository pass invoked all 51 test files directly with Node: 50
files passed, with 166 individual cases passed and no executed case failed.
After correcting the gate interference, a focused rerun passed all seven
Ainomine/Kumataka cases, including one new regression, bringing the total to
167 distinct passed cases.
`first-torii-alignment.test.mjs` could not start because the large preserved
`geography/sources/osm.json` file was unavailable in the review checkout; its two
cases are not counted as passes. That source file remains unchanged in the
repository. Syntax checks passed for the new or modified JavaScript modules,
including the final gate-exclusion changes.

These results establish geometric continuity in the tested approaches. They do
not establish exact physical dimensions, photographic camera alignment, all
mountain sectors' accessibility or target-device rendering performance.
