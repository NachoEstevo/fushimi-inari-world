# R99 — Shinsenjo north court reference registration

Research only. Own outputs are this document and `outputs/r99-shinsenjo/`. No production, viewer, cache, terrain, collider or walking code was changed. No browser, Blender, GPU or renderer was used. Architectural production guidance and its source/ownership contract were applied.

## Result

There is now an independently registered **eastern retaining-wall line, public gate, elevator and upper bridge relationship** for the rear service court. Two newly inspected 2016 photographs also strengthen registration of the **north Shinsenjo entrance and mineral court west of Mikoshiko**. A bounded north-court material/apron owner is implementable with existing-height guards. These sources still do **not** establish the full Shinsenjo compound floor, southern/eastern terrace interface or wall height. Activating the entire R93 building remains unjustified.

See the source-plan artifact [registration-plan.svg](review-r99/registration-plan.svg), numeric [registration-audit.json](review-r99/registration-audit.json), [live-map-registration.json](review-r99/live-map-registration.json), and hashed [sources.json](review-r99/sources.json). The SVG is a two-dimensional registration diagram, not a rendered reconstruction or surveyed blueprint.

## Current code and prior evidence

Read `shinsenjo-grade-reconciliation-r96.md`, `shinsenjo-precinct-r93.md`, `shinkosui-well-r96.md`, `rear-precinct-bridge-r93.md`, current `shinsenjo-precinct.mjs`, `precinct-grade.mjs`, `near-precinct-mineral-courts.mjs`, the R95 grade audit and integration call sites.

Current integration still sets `shinsenjo={built:false,builtIds:[],reason:...}`. The generic building is suppressed only if a successful detailed owner reports its ID; disabled detail is not evidence that its entire footprint is absent. The named well now has its own R96 owner. Existing mineral-court envelopes cover Gonden/office, Tamayama and Okumiya, not a registered Shinsenjo north court.

The R96 **historical assembled** audit remains useful context: candidate floor44.122249m versus exact-ring rendered terrain44.013730..50.163791m, with1.446004m maximum roof intrusion. These values were not remeasured in a new assembled world during this research pass. The offending shared `sanctuaryCourtBlend` rectangle and disabled candidate contract are still present in code. Neither a changed map nor a new photograph turns those old inferred elevations into survey data.

## New primary map evidence

Fetched the [primary OSM map response](https://api.openstreetmap.org/api/0.6/map?bbox=135.7730,34.96665,135.77395,34.96725), saved unchanged as `live-osm.xml`. Project conversion uses existing `build_geography.py`: origin34.96714/135.77267, R6378137, X east/Z south. Coordinates below are deterministic mapped coordinates rounded to millimetres for matching code, **not millimetre survey accuracy**.

| Owner | Direct source tags/topology | Registered local coordinates |
| --- | --- | --- |
| `way/1385037578` | `barrier=retaining_wall` | W0[79.383,-1.648] → W1[81.564,-1.648] → W2[86.280,-1.737] → W3[86.526,27.952] |
| `way/1385037579` | red wooden paling fence | [81.564,-1.648] → [81.609,1.714] → [81.673,3.763] |
| `node/12822895657` | `barrier=gate`, shared with that fence and public north route | [81.609,1.714] |
| `node/12019337585` | `highway=elevator`, `wheelchair=yes`, `access=yes`, named for wheelchair/mobility access | [84.838,15.518] |
| `way/1385037575` | `bridge=yes`, `layer=1`; starts at **the elevator node itself** | [84.838,15.518] → [93.769,15.284] |
| `way/1297255919` | `foot=yes`, `wheelchair=yes`, paving stones | [71.045,1.759] → [81.609,1.714] → [84.537,1.703] → elevator[84.838,15.518] |

The retrieved retaining wall is36.587859m long in plan. The bridge crosses its long arm at **[86.422629,15.476481]**, just1.585173m along the bridge from the elevator. This makes the topology explicit: **a vertical elevator plus an upper bridge crossing a retaining boundary**, not a steep terrain ramp connecting two ground samples. The node and barrier records were absent from the project's existing raw `sources/osm.json` lookup; the derived `features.json` additionally has no barrier collection. Their omission explains why older review knew a bridge line but lacked this boundary/elevator registration.

Important stop point: wall W3 is **3.518388m short** of the nearest Shinsenjo ring point[86.598253,31.469646]. Do not invent a wall spur across that gap. The wall line does not encircle the whole building or provide a southern terrace boundary. No `height`, `ele`, wall-side level, elevator travel or bridge-deck level is supplied in the retrieved records. OSM wall orientation alone is not treated as a measured high/low side contract.

Also, the live map contains two objects named 神供水: the roofed well `node11941092061` inside roof305214828, and a separate stone handwashing/artwork node11740378090 westward near Kaguraden. Name-only image searches must not merge them. The already accepted roofed-well identity continues to use the `water_well` node inside its roof polygon.

## Actual photographic observations and registration

All four following image files were downloaded from the original public image URLs and their actual pixels inspected. See `sources.json` for URL/hash. Dates are article/filename context, not independently checked EXIF or proof of current conservation state.

### Well / Shinsenjo north front, 2016

[Original firsthand article](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/), files `well-court-2016.jpg` and newly inspected `well-detail-2016.jpg` (`b4e858385778f35133247959df718c9f8b3882a2...jpeg`).

Observed: timber roofed well with closed pickets, gray mineral ground and narrow slab paving; behind/left, a timber double door in pale plaster/dark timber framing; its threshold is shallow in the visible patch. The author's caption explicitly identifies the well and the building behind/left as Shinsenjo. The frontal well image gives a clearer door-to-well relationship than the previously used oblique image.

Registered facts: well roof305214828 spans X60.327..63.948/Z17.143..19.537. Shinsenjo's north mapped edge runs from[62.744,22.064] to[82.047,21.674]. Service stub751194636 ends at[65.326,20.483], aimed toward that north edge. **Inference:** the visible door is near the stub's continuation toward the north face, around X65–66/Z22. This is a strong plan correspondence, not a surveyed door opening or authorization to extend the public route through a service building. Exact door width and elevation remain unknown. The images do not show the southern return at Z32..42.6.

### Mikoshiko west mineral corridor, 2016

Newly inspected `mikoshiko-court-2016.jpg`, from the same article's [8510ca7752a74472051e7d4b360d3e1c586296e7 image](https://image.space.rakuten.co.jp/d/strg/ctrl/9/8510ca7752a74472051e7d4b360d3e1c586296e7.77.2.9.2.jpeg).

Observed: long dark door bank on the storehouse, a low close timber fence and stone toe, mineral/paved corridor alongside, and pale/dark-timber building frontage at the far end. The visible corridor has no multi-metre stair or bank through its walking centre. The caption locates Mikoshiko east of the well.

Mapped Mikoshiko1287564336 is X73.545..82.074/Z3.763..20.015. **Inference:** the visible long door bank/corridor is its western side and the far building is the northern Shinsenjo frontage. That agrees with the well relationship and actual ring order. It supports a continuous northern **court category**, not one floor datum for the hidden entire417.88m² compound.

### Elevator access court, 2021

[Firsthand accessibility article](https://www.goriluckey.com/archives/20170531_fushimiinaritaisha-wheelchair.html), actual [IMG_5749_20210412.jpg](https://www.goriluckey.com/wp-content/uploads/IMG_5749_20210412.jpg), saved `elevator-court-2021.jpg`.

Observed: broad gray gravel foreground, slab strips, white Mikoshiko short facade and long dark door bank behind low timber pickets; a light timber gate with wheelchair/elevator arrow; a raised wooded bank, stonework and pale upper edge/wood guard behind the gate. The rear right background shows the pale/dark timber frontage south of the storehouse. Text reports an elevator open since1April2020.

**New mapped correspondence:** the gate/fence node on the north route and elevator east of Mikoshiko explain the photographed entry direction. Viewing direction from the northwest toward southeast is inferred from the two storehouse facades and neighboring buildings; no camera pose or image scale was measured. The image does not show the elevator cabin, actual upper bridge endpoints or the whole36.6m retaining face. The visible stonework supports a retaining category locally; it does not prove every hidden wall segment has identical masonry or a particular height.

### Sources that did not close the grade gap

The [official map page](https://inari.jp/trip/map01/) was read and its `trip_map.jpg` inspected: this is a stylized mountain/route graphic, without a usable Shinsenjo footprint or court levels. The Apricity2016 travel article names Shinsenjo in its numbered plan legend but supplies no useful registered court photograph. Direct access to the Nicklee page was blocked; no browser workaround or alternate access was attempted, and no unseen photo is cited. Searches for the exact building/well repeatedly returned unrelated mountain offering halls and the different Nyakuichi 神供水; those were rejected. No new reliable southern/eastern facade photo or measured section was found.

## Concrete implementable ownership plan

### A — Bounded north-court surface owner, available for the next implementation pass

Create one `shinsenjo-north-court` material/apron owner, keeping its identity separate from the disabled full building and future elevator/retaining structure.

1. Register the above source roof/ring/gate/wall IDs in a small immutable layout packet. Do not silently patch global OSM export or promote source-vertex DEM Y values to floor heights.
2. Define a conservative **well-to-north-facade collar**: X between the well's east roof bound63.948 and Mikoshiko's west bound73.545; north limit at the well's south roof bound19.537; southern limit is the actual interpolated Shinsenjo north edge, not a bounding-box line through the compound. These extents are an explicitly inferred evidence envelope. Clip every mapped roof, current well base, existing service-stub corridor/curbs and all existing mineral owners. Do not open a door or add a public route.
3. Define the **west-Mikoshiko mineral strip** from the mapped west facade's Z3.763..20.015 extent, terminating at the existing Mikoshiko R93 court's west boundary. Its other side must derive from the actual Honden enclosure/paving owner, with a clearance margin; do not use only Honden's mapped roof box, because its authored tamagaki extends beyond that box. Subtract actual fence/post/paving/court geometry envelopes to prevent overlap or duplicated gravel. If no coherent width survives, refuse that portion and report it.
4. Drape only onto the existing **actual rendered triangles**, using the existing floor/court owner. Require full clipped-area coverage, no path/solid overlap and gentle final slope; preserve current surfaces/walking functions. If the source-backed patch has more than .18m relief or exceeds a conservative .10 final slope, fail closed rather than hiding a shared-grade mound under gravel. The slope/relief limits are proposed engineering gates, not surveyed landscape facts.
5. Reuse gravel and narrow stone-paving vocabulary observed in the2016/2021 photos; one or two static material batches, metric UVs, no invented planters, service doors, inscriptions or historic objects. Return accepted polygons/areas and suppression reasons. No suppression of generic305214596 follows from a successful court patch.
6. Validate exact source footprint preservation, terrain/contact extrema, existing path mouths/colliders, repeat-call stability and no ownership duplication. Root then reviews the registered north/west court views. This yields a real bounded improvement without falsely claiming the compound's grade is solved.

This stage deliberately handles only the visible northern court. Its acceptance requires numerical inspection of the current assembled triangles during implementation; this research pass did not build that scene or declare those proposed guards already passing.

### B — Future east retaining/elevator owner, plan registered but height contract still incomplete

A single owner must own retaining wall1385037578, gate1385037579/12822895657, lower north/east passage1297255919, elevator12019337585 and upper bridge1385037575. Their newly confirmed shared topology prevents modeling the bridge as a steep ground ramp. Retain current bridge walking exclusion until an actual deck and elevator-level contract exists. Existing low service-court evidence can constrain the lower arrival relationship; it does not supply the upper deck datum, elevator travel, rails or wall high/low side heights. Register these before geometry or collision integration. The endpoint W3-to-Shinsenjo gap remains open evidence, not permission to extend the wall.

### C — Full Shinsenjo candidate, still withheld

To activate the entire irregular building, resolve: (i) whether northern and southern wings share one internal floor or step; (ii) southern perimeter bank/toe beyond Z32 and around Z42.6; (iii) eastern exterior bank at X90..91 and its relation to wall W3; (iv) source-supported full roof decomposition and heights; (v) a consistent lower/upper court contract against the bridge/elevator owner. None is supplied by the new map tags or the inspected north-front photos. An arbitrary flattening collar, roof lift,48m DEM floor substitution or invented6m retaining wall would still conceal the unresolved interface.

## Verification and handoff boundary

Parsed the live XML, converted coordinates using the existing project formula, numerically checked bridge/wall crossing and the3.518m unresolved endpoint gap, generated/parsed the SVG XML, and hashed six source files. Production call sites and relevant ownership functions were read. No software tests were needed for this documentation-only packet; no structural, native visual or walking acceptance is asserted. All stage-A dimensions and gates are proposals for the next implementation pass. Existing work and shared files are preserved.
