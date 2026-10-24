# R99 Mikoshiko north shutters and west eave detail lot

Implements the bounded lot from `mikoshiko-detail-audit-r99.md` on the existing
R93 owner only. Actual 2016/2021 source pixels were inspected before building;
no renderer or local browser was used by this owner.

## North-end sign confirmed

With the accepted west-facing long door facade, the 2021 photograph's SHORT face
front and LONG face receding on image-RIGHT implies a northwest viewpoint and
therefore the NORTH short end, localV=`-depth/2`. A southwest viewpoint would
place the west long facade on image-left. Independent reviewer corroborated the
same parity against mapped gate12822895657 `[81.609,1.714]` northeast of the
north wall and Shinsenjo background atZ21+. Current transform gives north-end
center about`[77.61214,3.87392]`, south-end`[78.00686,19.91508]`, yaw+0.0246013.
Only north shutters/hood are emitted; the building is not rotated or moved.
This is a corroborated sign relative to existing registration, not a surveyed
camera/height reconstruction.

Sources: [2021 court](https://www.goriluckey.com/wp-content/uploads/IMG_5749_20210412.jpg)
and [2016 court](https://image.space.rakuten.co.jp/d/strg/ctrl/9/8510ca7752a74472051e7d4b360d3e1c586296e7.77.2.9.2.jpeg).
Local images remain under `outputs/r99-shinsenjo/`; URLs and hashes are in its
`sources.json`. Historical dates/conditions are not presented as current survey.

## Implemented

- Closed paired white high shutters, surrounding shallow white frame, dark
  center join, four hinge fittings and restrained vertical handles. Assembly
  width1.22m/height1.07m at3.45m above existing floor is inferred from photographs.
- Dark shallow tiled protective hood,1.84m wide/0.38m projection, with white
  brackets. Individual small ribs reproduce a tile rhythm without another roof
  mass or dependency. The shared dark material is deliberately used for hood,
  iron and drainage to respect the three-batch limit.
- Open shallow west-eave gutter channel beneath existing eave, plus ONE observed
  north-corner elbow/downpipe and small fixings. Section/radius are inferred;
  no pipe is invented at hidden corners and no water simulation is introduced.
- Four white overhead beam/bracket ends following the EXISTING inferred door
  bays, plus thin contiguous timber jamb/lintel reveals. These refine present
  members without duplicating full posts, doors, hardware sets or fencing.

The small 2021 entry porch/gate/access installation remains a separate grade/
elevator owner task. Existing walls stay closed; no interior or public doorway
is asserted. Main roof mass, picket layout, foundation, court, terrain clip and
mapped routes remain unchanged.

## API / ownership

`buildMikoshikoDetailsR99(root,features)` returns `{built,revision,shortEnd,
shutter,hood,gutter,downpipe,brackets,uprights,batches,triangles,...}`.
Call AFTER `buildMikoshikoPrecinct`, BEFORE global static batching. It requires
the actual mapped built R93 owner with the original center/yaw/floor/width/depth,
unit scale and the original source white/dark/timber palette signatures. Missing,
shifted or post-batched ownership fails closed with no partial object.

It appends one child group to that owner, borrowing its three existing materials
without mutating them. No old geometry/door/fence mesh or collider is changed.
No new material, light, texture, dependency, runtime loop or collider is added.
Calls are idempotent. Root alone owns integration and generic building exclusion.

## Budget and verification

**1,038 triangles,63 construction primitives,3 static batches,0 new materials,
0 new colliders.** Dimensions and detail spacing remain photo-inferred.

Five focused tests plus all five existing Mikoshiko tests pass: ten total.
Focused checks prove unchanged source features/old geometry/material identities/
transform/colliders and idempotence; finite actual vertices within wall/eave
bounds and north-only high shutters; every new low vertex outside protected
route widths with20cm shoulder allowance; missing/shifted/palette-altered owner
withholds geometry. Existing tests cover both approach directions/shoulders,
actual triangle foundation and terrain-cut preservation. `git diff --check`
passes.

Root still must inspect the assembled matched court view for shutter scale,
gutter registration, bracket/roof fit and native material appearance. Static
geometry tests do not certify source-exact architectural dimensions. No browser,
renderer, integration/viewer edit or commit was made by this component owner.

Independent actual prebatch review verified owner/geometry/material/collider
preservation and caught a22cm vertical gap between the upper bracket head and
the original R93 eave-beam underside. Four bounded white receiver uprights now
connect header height4.20m to4.49m, overlapping the recognized eave underside
4.475m by15mm. The new actual-vertex attachment regression verifies this contact
at every bay. Final component is1,038 triangles/63 primitives/3 batches; ten
combined tests pass. No separate roof or support post footprint was added.
