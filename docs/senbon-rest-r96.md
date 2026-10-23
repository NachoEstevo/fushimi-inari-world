# R96 — Okusha pavilion joinery and physical votive court fittings

## Directly inspected evidence

Three public photographs were opened and inspected as pixels on 2026-10-23:

- [Official Okusha exterior](https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg): open vermilion pavilion, transverse beam grid/bracket shoulders, dark side drainage edge and repeated hanging supports. The broad public court stays open.
- [Official Omokaru stones](https://inari.jp/en/wp-content/uploads/2016/09/omokaru.jpg): square sloping stone shoulders under removable stones. This contradicts the existing plain horizontal round cap disks.
- [Japan Travel Note close ema photograph](https://cdn.japan-travel-note.com/images/00126/38.jpg): fox-head-shaped pale votive plaques suspended by dark cords in horizontal rows on red boards/framing. Handwriting and individually drawn faces are visible in the source but are not copied or invented.

The [official precinct description](https://inari.jp/en/map/spot_08/) confirms the pair of Omokaru stone lanterns behind the hall at right. It supplies no surveyed fittings dimensions. No photographic pixels are packaged or reproduced. The walking video URLs are useful wider context but were not used as dimensional evidence in this packet.

## Changes and ownership

`buildSenbonRestR96(root, features, anchor, materials)` runs after the production `buildOkushaCourt` and R95 frontage packet, before global static merging. It checks the actual mapped hall plan, the recognized existing R88 hall owner and three retained legacy rack identities before creating geometry. Unknown contracts or repeated invocation return null without partial changes.

Four coordinated details affect the existing pavilion and court furniture:

1. Three full transverse pavilion members, two longitudinal members and bracket shoulders complete the under-eave grid. They remain entirely above 2.8 m.
2. Two dark long-eave drainage edges and repeated supports articulate the pavilion silhouette. They remain above its existing perimeter rails.
3. Three retained ema racks receive framed horizontal hanging rows and 240 physical fox-shaped blank plaques with cords across their two faces. This is an interpretation of the source's physical suspension, not a claim that its exact rows occupy the existing modeled rack locations. Existing positions, textures, interaction identities and the accepted exit gap remain owned by the court owner.
4. Exactly recognized Omokaru cap disks receive four-sided sloping profiles within the retained .32 m circular collider. The original movable orb meshes, callbacks and pillar geometry are preserved. The module reports zero replacements if that specific legacy contract is absent.

Mapped footprint geography and existing furniture locations are retained. All sections, plaque count, spacing, colors, drainage dimensions and cap dimensions are photographic estimates. This does not create a new shrine, sign, backwall, service house or row of trees. Existing service buildings and their R94/R95 envelope/frontage remain separate owners. Broader court architecture is not claimed complete by this fittings packet alone.

The protected R95 court triangle cuts, walking surface positions, UV arrays, grade and branch transitions are untouched. New rack detail stays inside x +/-1.6 m and z +/- .25 m in each existing rack frame. There are no new colliders, lights, dependencies, network texture requests or frame updates. At most eleven new static batches and fewer than 18,000 triangles are enforced by tests; cap replacements retain the existing draw ownership.

## Validation and remaining gate

`node --test fushimi_inari/integrated-world/senbon-rest-r96.test.mjs` passes eight tests (two new regressions and six existing architecture/court regressions imported with the fixture). Tests exercise actual checked-in OSM features, finite geometry, budgets, collider byte preservation, exact court position/UV array and geometry identity preservation, original Omokaru interaction identity, furniture bounds, overhead clearance, duplicate invocation and fail-before-mutation contracts.

Syntax and whitespace checks passed, and all three new files were inspected. Root owns integration and serialized render review. No GPU/browser/Blender attempt, walking verification, visual match score, deployment or commit is claimed here.
