# Shinsenjo grade ownership reconciliation R96

Fresh **assembled** numeric investigation, 23 October 2026. This is a read-only diagnosis and proposed ownership change, not an activation or floor survey. Harness `.tmp/r96-shinsenjo-audit.mjs` calls the actual current `integrate()` with production terrain/features and GLBs, retaining actual composed `renderedTerrainPositions`; output `.tmp/r96-shinsenjo-audit.log`. Stubbed CPU texture loaders are irrelevant to the geometry probe and do not establish visual acceptance. No Blender/browser/GPU was used.

## What is actually missing

`way/305214596` remains **eligible for the generic building layer**: `result.excludesBuilding()` returns false. The disabled R93 detailed candidate is not proof that its entire mapped footprint is empty grass. Adjacent mapped generic structures are `305214828`, `305214841` and `305214843`. A native root inspection must distinguish their actual visibility from the disabled detailed owner before calling them absent.

## Exact assembled conflict

The exact 14-edge concave ring is X61.394..91.133, Z21.674..42.557, area **417.8838455m²**. The R95 triangle-plane audit finds complete coverage by 41 composed terrain triangles:

| Quantity | Current assembled value |
| --- | ---: |
| Candidate floor, service approach | 44.122249m |
| Terrain minimum inside exact ring | 44.013730164m |
| Terrain maximum inside exact ring | 50.163790889m |
| Maximum terrain above floor | 6.041541889m |
| Maximum terrain above candidate roof | 1.446004m |
| Intrusion witness | X91.133/Z42.179 |
| Witness terrain / roof | 50.135083 / 48.689079m |

This differs from the earlier R95 raw-DEM diagnostic; these numbers are freshly sampled from actual composed render triangles. The existing builder's roof and wall dimensions are inferred, not documentary elevations.

## Owners creating the mismatch

`integration.mjs` gives Naihaiden, Honden and Gonden the shared target datum43.982249m. `precinct-grade.mjs:sanctuaryCourtBlend()` imposes a rectangular source-coordinate court and releases its influence from abs(localX)26..40 and localZ-58..-70. That authored court geometry intersects only the northern part of the mapped Shinsenjo ring. The southern/eastern returns recover raw hillside heights. This release is an unrelated rectangle, not a surveyed Shinsenjo terrace boundary.

The candidate builder then samples `surfaces.height(65.326,20.483)` outside the ring and applies that one datum to the entire irregular building. It cannot reconcile the release. Interior-only subtraction changes no exterior bank. Moving a legacy anchor cannot fix a mapped-world-footprint owner.

Representative unoffset height-field sections (rendered triangles additionally carry their established offset and tessellation):

| X | Z20.483 | Z25 | Z30 | Z35 | Z40 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 61 | 43.982249 | 44.245168 | 45.882562 | 47.398744 | 47.538000 |
| 65.326 | 43.982249 | 44.337145 | 46.197086 | 47.811491 | 47.918688 |
| 90 | 49.374709 | 49.395845 | 49.811092 | 50.120000 | 50.100000 |
| 93 | 50.548102 | 50.520982 | 50.472489 | 50.456000 | 50.421000 |

## Route and neighboring architecture constraints

Mapped `751194636` is a7.173m service stub from[65.088,13.314] to[65.326,20.483]. Quarter-metre samples are exactly44.122249m throughout. It is not a route through the building. The raw sampled source endpoint is48m, demonstrating a3.878m shared-field displacement before reaching the ring.

`1297255919` is tagged `foot=yes`, `surface=paving_stones`, `wheelchair=yes`. It runs from[71.045,1.759] through[81.609,1.714], [84.537,1.703] to[84.838,15.518]. Surface heights are44.122249,44.573127,45.957780,45.885539m. Quarter-metre sampling finds max increment0.149928m and max slope0.614453. Its current profile already needs a topology/grade review; wheelchair metadata does not prove the current generated surface is accessible.

Bridge`1385037575` connects[84.838,15.518] to[93.769,15.284]. The generic surface field rises45.885539→50.811163m; quarter-metre max increment0.780730m and slope3.145969. These are **not a built bridge deck**: existing route/walk exclusions remain authoritative, as documented in R93. A Shinsenjo fix must not promote these field samples into a public deck.

Neighbor bounds: Mikoshiko`1287564336` X73.545..82.074/Z3.763..20.015 (owned); Kaguraden`952815193` X38.314..61.704/Z17.288..35.689 (owned); unnamed`305214828` X60.327..63.948/Z17.143..19.537 (generic); unnamed`305214841` X54.689..60.974/Z43.537..51.819 and`305214843` X71.319..77.313/Z44.984..49.070 (generic). Any transition collar must exclude these owners, not simply feather a large rectangle through them.

## Source evidence actually inspected

Actual `.tmp/r92-refs/well-context.jpg` was reopened: low white plaster/dark timber Shinsenjo wall behind a separate timber roofed well, mineral/paved foreground with flush building toe and a shallow visible threshold. It supports a **small local flat court** and material vocabulary, not the south/east wing datum or a6m retaining face. Its firsthand account is [8 October2016](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/).

The [main shrine guide](https://fushimiinari-guide.com/how-to-worship-main-shrine/) was freshly opened; its Naihaiden/Honden front/side/rear source photographs do not show the hidden Shinsenjo southern perimeter. The [official Honden description](https://inari.jp/sp/map/spot_03/) supplies architectural history, not service-court elevations. Fresh Japanese searches also found the [Kyotofukoh firsthand gallery](https://kyotofukoh.jp/report166.html), whose text names Shinsenjo but inspected page has no registered floor section or Shinsenjo south-edge photograph. None proves a surveyed building datum.

The small mapped`305214828` is geographically plausible for the pictured roofed well, near the stable service stub and northwest of the compound, but its unnamed OSM tags do **not** prove that identity. Register that correspondence before replacing it as a named well.

## Concrete reconciliation plan for root approval of ownership

1. Introduce one `shinsenjo-service-grade` owner for the exact compound plus the independently registered court/toe interface. Its canonical contract must contain building floor(s), the court polygon, external grade boundary, route mouths and provenance. Do not let builder and terrain independently choose floors.
2. Preserve the mapped stub's current44.122249m datum unless source evidence establishes a different connected precinct-level correction. Source-confirmed shared court supports only its visible northern patch currently. A whole-ring44m plateau or48m floor is presently an additional unverified inference.
3. Replace `sanctuaryCourtBlend` influence **inside that registered region only**, leaving neighboring building/paving owners and all unrelated terrain untouched. Grade transitions must be explicit bank/retaining/stair interfaces matching source rather than an arbitrary20m smoothing collar. Clip the detailed compound's interior only after the exterior interface passes.
4. Feed that single floor/grade contract to the detailed builder; suppress generic`305214596` only when it builds. Preserve closed service walls; no invented public traversal. Keep bridge excluded until an independent deck owner is established.
5. Before activation, exact-ring triangle coverage and roof clearance must pass; scan the entire exterior perimeter for bank/roof intersections and unsupported toes, preserve distant triangles, prove stub mouth height continuity, and rerun the neighboring service/wheelchair path profile regressions. Native root front, side, rear and section review remains required.

The read-only evidence establishes a shared grade boundary mismatch and a concrete correction owner, but does not justify constructing a fabricated terrace or lifting the building over its approach. No shared grade edit or activation was made during this pass.

## Subsequent well registration resolved

The identity uncertainty above was subsequently resolved in the same R96 pass: primary OSM node11941092061 is explicitly `name=神供水`, `man_made=water_well`, `pump=no` at34.9669758/135.7733513, inside roof305214828. The source roofed-well packet is now implemented and documented separately in `docs/shinkosui-well-r96.md`. It passes full assembled support/path/solid guards at the stable local court. This resolves that adjacent architectural owner without altering or concealing the still unresolved Shinsenjo southern/eastern grade interface.
