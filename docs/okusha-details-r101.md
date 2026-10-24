# Okusha attached architectural fittings R101

## Evidence inspected

Actual pixels inspected on 2026-10-23, not inferred from search snippets:

| Source | Local copy | Observed |
|---|---|---|
| [Official exterior](https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg) | `outputs/r101-okusha/official-okusha.jpg` | Vermilion pendant beneath front gable; rear sanctuary side has a dark upper bay with red upright lattice. Pavilion has open sides; forest surrounds the back. |
| [February 2019 front](https://fushimiinari-guide.com/wp-content/uploads/DSC_0616-2_20190205.jpg), linked by [guide article](https://fushimiinari-guide.com/reiwa-goshuin/) | `outputs/r101-okusha/court-2019.jpg` | Frontal gable pendant with a small gold fitting; three circular scroll shapes on the front ridge terminal; existing side ema racks; stone bank with upper red railing on both flanks. |
| [May 2019 counter](https://fushimiinari-guide.com/wp-content/uploads/P3620366_20190503.jpg), same article | `outputs/r101-okusha/counter-2019.jpg` | Two small hanging metal lanterns attached below reception eaves, with decorative lower feet, metal roof and perforated body. Counter shutters, white upper strip and roof drainage are already R94–96 owners. |

The official older oblique view has a less conspicuous ridge terminal than the 2019 front image. R101 follows the resolved 2019 scroll profile. No claim that every photograph represents one unchanged historical state.

## Existing ownership and exclusions

Reviewed actual `okusha-architecture.mjs`, `okusha-details.mjs`, `senbon-rest-r94/r95/r96.mjs`, `senbon-rest-landscape-r94.mjs` and `restboundary-r96.mjs`. R88 already owns mapped eight-corner pavilion/sanctuary, roofs, rafters, king posts, red lattice and shimenawa. R94–96 own reception boards/panels/courses, pavilion joinery/drainage, straw pendants, physical ema and Omokaru enclosure. R101 adds none of those again.

The source surroundings show bank, red railing and dense vegetation, but the photos alone do not register the whole bank's endpoints/heights. No extra rear/side wall, service building, tree row, tent, cones or sign text is introduced here. The low central worship barrier, rope and offering chest visible in the frontal photo are not added across R88's intentional public opening without a separate route/interaction registration.

## Implemented batch

`buildOkushaDetailsR101(root, features, anchor, materials)` from `fushimi_inari/integrated-world/okusha-details-r101.mjs`, called **after `buildSenbonRestR96` and before static batching**. Root integration remains separate.

1. Front gable pendant and small gold hexagonal fitting attach to the existing king post; local positive Z is the mapped front in the existing architecture plan.
2. Three-scroll dark ridge terminal attaches at existing ridge top, front Z +0.24. No second roof or new outline footprint.
3. Upper dark/red sanctuary lattice sits against each existing sanctuary side wall. Only the forward 2.5 m bay is treated; minimum support is the actual opaque host wall. The visible side is observed; bilateral treatment is an explicit symmetry inference. Exact pitch, height and section sizes are estimates.
4. Two reception lanterns are placed at ±0.28 of the existing counter width and Z `-depth/2 - 0.42`. The photograph establishes the pair on this frontage; exact station spacing is inferred. Each hanger intersects the actual R88 roof plane using `4.15 - 1.10*abs(z)/(depth/2+0.7) + 0.015`, rather than using a generic height. Lowest geometry is above local Y 2.1 m.

Host transforms are copied from existing hall/reception objects. No existing mesh, material, matrix, collision, callback, feature, floor or UV is mutated. All-or-nothing host checks and idempotence run before mutation. No lights, textures, transparency or update loop. Budget with actual mapped footprint: **5 static batches / 1,896 triangles**. Shared vermilion/gold materials plus one new dark metal material.

## Verification

`node --test fushimi_inari/integrated-world/okusha-details-r101.test.mjs`: **8/8 pass**, including six imported architecture regressions and two focused R101 tests. Checks existing object identities/transforms/materials/interactions, collision/feature immutability, correct host transforms, finite/bounded actual vertices, minimum clearance, hanger/roof contact, budget, idempotence and unknown-host rejection.

No renderer or browser used. Final integrated appearance and source comparison remain root-owned visual verification; sizes and ornament shape are approximations, not a measured architectural survey.
