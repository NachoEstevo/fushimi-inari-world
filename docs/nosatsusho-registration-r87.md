# R87 — Nōsatsusho / Yashima branch registration

22 October 2026. Research only; no runtime files edited. This follow-up supersedes the earlier R87 text-only status for the five photographs below.

## Finding and confidence

**Identity is sufficiently corroborated to refine existing mapped owner `way/305214607`, rather than add a second pavilion.** Its explicit Japanese name `納札所`, building/shrine tag, independently named POI, footway terminating at its southern facade and location just southwest of the separately named Teichoan footprint agree with the guide's signed frontal, side and rear photographs. The building is not an unlocated missing structure. The architectural reconstruction is missing: the generic closed flat-topped extrusion does not describe the photographed open timber return pavilion, gabled green roof and gated front.

This is map/photo registration with high confidence in **identity**, moderate confidence in facade-to-map orientation, and no surveyed confidence in heights, roof spans, post count or exact fence placement. The dimensions below are footprint-derived, not measured from pictures. No new footprint, public interior or extra building is justified.

## Actual pixels inspected

Source page: https://fushimiinari-guide.com/nosatsusho/ (published May 2021 per page). Five original JPEGs were fetched with `Invoke-WebRequest` and visually inspected using `view_image`. Local review copies are ignored outputs under `fushimi_inari/outputs/r87-nosatsusho/`; third-party images are not runtime assets.

| Image URL | Direct pixel observation | Constraint / limit |
| --- | --- | --- |
| https://fushimiinari-guide.com/wp-content/uploads/IMG_8445_20210503.jpg | Brown bilingual Nōsatsusho sign beside large tree; stone fence/monument behind | Confirms signed place; the sign image alone cannot identify a building footprint |
| https://fushimiinari-guide.com/wp-content/uploads/IMG_8455_20210503.jpg | Frontal gable view: vermilion torii with black bases on granite feet; narrow slab approach through gravel; low timber front gate/fence; dark inner return opening, hanging shide and plaque; cream/timber low building to image right | Shows distinct approach and restricted/gated inner threshold. Do not make a through-walk shortcut. Torii and tree exact coordinates remain inferred |
| https://fushimiinari-guide.com/wp-content/uploads/IMG_8449_20210503.jpg | Long side: green patinated roof with shallow concave slope/upturned ends, exposed timber frame, several open bays above low vertical paling; enclosed timber portion at image left; torii to right | Contradicts a full-height solid wall all around. Side apertures are visual openings above a low barrier, not source-backed pedestrian entrances |
| https://fushimiinari-guide.com/wp-content/uploads/IMG_8450_20210503.jpg | Rear gable: large pale plaster panel crossed/bounded by timber; exposed triangular roof frame and decorative gable pendant; long side to right is open above low fence | Supports asymmetric enclosure: rear wall plus open-sided return area. Rear storage objects are incidental; they do not justify new architecture |
| https://fushimiinari-guide.com/wp-content/uploads/IMG_8471_20210503.jpg | Yashima water, irregular stone bank to image left, vegetation/reeds and low bridge/barrier in distance | Supports differentiated shoreline context only; not enough to assign this bridge to a particular mapped segment from this picture alone |

The filenames contain dates but no EXIF date was verified. Do not describe 2021 photo appearance as a surveyed current restoration state. Browser Street View and user video pixels remain uninspected by this reference agent.

## Exact mapped records and sides

Current checked-in `geography/manifest.json`: local equirectangular metres, X east, Y elevation, Z south, origin latitude 34.96714 / longitude 135.77267, vertical exaggeration 1. OSM snapshot timestamp is 2026-10-20T15:44:51Z. Terrain heights are coarse GSI-derived samples, not measured floors.

Building `way/305214607` has `building=shrine`, `name=納札所`. Matching POI records latitude **34.96770416**, longitude **135.77396722**, point `[118.338,49.18,-62.802]`. This POI centre is an index point; use the full building ring for geometry.

| Vertex | X, Y, Z metres |
| --- | --- |
| A | 116.055, 49.240, -60.090 |
| B | 115.307, 48.870, -66.079 |
| C | 120.325, 49.030, -66.703 |
| D | 121.073, 49.420, -60.725 |
| E | 118.929, 49.350, -60.413 |
| closure | A |

Plan interpretation: A–B is west long side (~6.04 m); B–C is north short/rear candidate (~5.06 m); C–D is east long side (~6.02 m); D–E–A is south short/front candidate (~5.06 m). Keep E because it is the mapped footway's terminal point, not a redundant coordinate to discard while calculating access. The entire ring is map-derived; it does not distinguish roof overhang from wall envelope.

Approach `way/1133052427` (`footway`, `surface=paving_stones`) runs from `[119.777,49.95,-52.331]` to E `[118.929,49.35,-60.413]`. Its northern end meets the **southern** building edge exactly. Main branch `way/301527763` is a 2 m mapped paved footway including `[119.777,49.95,-52.331]`, linked toward Tamayama by `way/1392894129`. Thus the frontage candidate is toward +Z/south, and roof ridge should run broadly along the ~6 m north/south axis. Heights along these paths remain sampler inputs rather than a certified level-floor datum.

Adjacent eastern building `way/305214613` explicitly has `name=啼鳥菴`, `name:en=TEI-CHO-AN`. Its nearest western ring points include `[126.236,49.53,-62.762]`, `[123.718,49.17,-66.725]`, `[129.365,49.14,-71.478]`; its complete irregular footprint extends east to X157.134. This supports the pale building to the frontal photograph's right being eastern context; do not merge its roof into Nōsatsusho or instantiate it again as an invented auxiliary hall.

Yashima pond is separate mapped `way/301527735`, `name=八島ヶ池`, not either office garden pond. Its near southern tip includes `[133.333,49.31,-75.553]`, `[142.556,50.22,-73.738]`; most water extends north/west/east beyond this tip. Avoid blanket water or bank changes from the pavilion photos.

## Current representation and next implementation packet

`integrated-world/viewer.mjs` loops mapped buildings after `assembly.excludesBuilding(b)`, uses inferred 4 m height for shrine-tagged buildings without height, emits full-height perimeter walls and flat triangulated top, and merges sacred context into spatial chunks. `integration.mjs` currently has no dedicated Nōsatsusho builder/exclusion by ID. Its generic exclusion also includes anchor-radius tests; the implementing agent must verify the actual assembled `excludesBuilding` result before claiming the extrusion is rendered. There is no dedicated Nōsatsusho anchor in `anchors.json`. An assembled ownership audit is still required; source presence alone is not a native screenshot.

Assign `sanctuary_implementation` the existing feature ID and a dedicated deterministic replacement module, with root owning the final `builtIds` exclusion wiring. Scope:

1. Audit actual generic inclusion, ring and nearby colliders. Replace this ID's context representation only; keep full ring and approach E. Never remove the entire merged sacred batch.
2. Build recognizable gabled green roof, pale/timber rear gable, open timber side bays above low timber paling and south-facing gated front. Infer a single documented level datum and roof heights; do not follow each vertex's DEM height with a tilted roof.
3. Make front/side visual openness truthful while retaining the photographed barrier. The footway reaches the gate; no public pass-through interior is established. Preserve real branch walk around the pavilion and Teichoan.
4. Treat approach torii as a separate sourced object. Check mapped/legacy torii and positions before adding; photo proves its existence, not exact centre or size. Torii, tree/sign and small offerings can follow after silhouette/ownership gate.
5. Require same-ID idempotence, finite geometry, supported footing, unchanged adjacent features, retained access endpoint and no duplicate context extrusion. Inspect frontal (+Z), east long side and north rear renders using actual assembled terrain; then native walk to gate and around branch.

No confidently missing **additional building** was identified. The verified missing features are within the existing pavilion representation: shaped roof and asymmetric wall/open-bay/gate architecture. Complete rear/side cardinal assignment remains an interpretation supported by footway and neighbor registration, not calibrated photogrammetry.
