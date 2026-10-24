# R103 — registered north Okusha boundary

## Evidence and period

This owner treats **only** red timber paling `way/1267860090`. [Primary full way](https://api.openstreetmap.org/api/0.6/way/1267860090/full.json) checked2026-10-23, saved verbatim `outputs/r103-okusha/north-fence-source.json`. Tags establish barrier=fence, colour=red, fence_type=paling, material=wood, height=1.0m. Nodes11775032017→11775032016→11775032015→11775032014→11775032013 form an **open**18.2064847m chain.

Actual period photographs already inspected:

- [2016 north lateral view](https://image.space.rakuten.co.jp/d/strg/ctrl/9/642ccdca653a77e5b98dccdfb6dea9dae5b2cfff.77.2.9.2.jpeg), local `outputs/r102-okusha/court-11.jpg`, in [original field account](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610110000/): cobble bank, red paling on top, miniature donated torii and large torii beside the sanctuary. This establishes pre-construction presence/type; exact historical vertex coordinates are not surveyed by the image.
- [2019 frontal view](https://fushimiinari-guide.com/wp-content/uploads/DSC_0616-2_20190205.jpg), local `outputs/r102-okusha/front-2019.jpg`: stone bank and red upper paling north/left of west-facing hall. This agrees with the mapped north chain and existing hall orientation.
- [Official exterior](https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg), local `outputs/r101-okusha/official-okusha.jpg`: confirms the same red/stone/woodland enclosure vocabulary.

No2027 construction parcel, inferred reception building, new gate, stone-wall height or full perimeter closure is included. The source photos show a mineral retaining bank; **its complete vertical reconstruction is still pending** separate crest/toe registration. This fence is a bounded improvement over existing modeled ground, not a claim that the full source bank has been reproduced.

## Exact registration and existing R96 ownership

Local `[X east,Z south]` metres, origin34.96714,135.77267, R6378137. Immutable source coordinates exported by the module:

```
[261.703963542,60.580066890]
[265.325563986,60.713650279]
[274.621309206,60.257240367]
[276.226854995,64.487381016]
[276.965770955,64.353797627]
```

R96 `restboundary-r96.mjs` owns a different way1267860089 segment, `[276.500528,66.246229]→[277.394525,73.604447]`. R103 never appends, rebuilds, moves or changes that owner. The1.95m source gap to its northern endpoint remains open around torii node9664306034 `[276.920,65.222]`. No connecting segment is generated. Nearby vegetation/paths/buildings remain untouched.

## API and physical support

`buildOkushaNorthBoundaryR103(root, features, materials, colliders, {terrainPositions, walkHeight})`, in `fushimi_inari/integrated-world/okusha-north-boundary-r103.mjs`.

Call after R96/court grading and final height functions, before static batching. Pass actual `renderedTerrainPositions` and existing `walkHeight`. The existing R96 owner is required; repeated/unknown/missing terrain/route-conflicting calls return null before adding geometry or collision. No generic building exclusion IDs are returned: this is a fence, not a building replacement.

Actual terrain triangles are bounded to the18m sector and sampled through existing `makeShoulderTriangleHeight`; no DEM or average-floor substitution. Every board and post samples its own center plus four **actual footprint corners**. Bottom is the minimum actual triangle support minus2.5cm. Wood therefore penetrates physical support on a slope instead of hovering above the lower side. If a footprint sample is unknown, the entire bounded owner is skipped.

`walkHeight` may set visible top datum above lower terrain at the already paved court, bounded to at most0.40m above triangle support. The source1m fence section is measured from that existing datum; its concealed lower wood extends into terrain below paving. No new pier, terrace, earth fill or floating plinth is introduced. Rail pieces follow the supported stations at0.18/0.82m above datum;14 posts and104 pales share one borrowed vermilion material. Timber sections/pitch and posttop1.07m are estimates.

Actual CPU assembly probe, `outputs/r103-okusha/actual-assembly-probe.json`, confirms built=true: source length18.2064847275m,1 static batch,326 primitives,4,744 triangles,18 added colliders (four source-segment boxes plus14 post cylinders). Actual terrain/visible datum range62.293844709–62.559976959m. No new material, light, texture, update loop or dependency.

## Paths and tests

Before geometry creation, all support stations must remain at least7cm outside the inferred/sourced public route half-width. Actual minimum centerline-to-route-edge residual is9.3234cm; post circumradius8.5cm remains outside it. Paths301527762,301527759 and1051656816 preserve their existing geometry and heights.

`node --test fushimi_inari/integrated-world/okusha-north-boundary-r103.test.mjs`: **4/4 pass**. Tests source length/open endpoints/R96 gap, idempotence, immutable features/prior owner, finite actual geometry/budget, actual vertex lower envelope, unknown support/route-conflict rejection, and actual post corners on sloping triangles. Collision tests use `SpatialCollisionWorld` with0.28m player radius at80 intervals per adjacent path segment, sampling centerline and both usable width margins `(width/2 - playerRadius)`; no player displacement.

Actual production CPU assembly test also succeeds. No integration/viewer edits, renderer or local browser were used. Root owns integration, serialization excluding returned `group`, render/source comparison and final visual admission. The modest fence does not resolve the separately documented missing stone-bank height or donated torii display.

## Integration follow-up — 24 October 2026

The root integration now calls this owner after final terrain grading and before static batching. The browser review and release scope are summarized in [the release notes](ultra-quality-and-release.md). The earlier paragraph records the isolated module handoff, not the current integration state.
