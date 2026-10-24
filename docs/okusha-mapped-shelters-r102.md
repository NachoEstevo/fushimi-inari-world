# R102 — mapped Okusha hand-washing shelter

## Confirmed source and current omission

The actual assembled scene was checked with a geometry-only Node integration harness, not only source grep. `outputs/r102-okusha/actual-assembly-probe.json` records that `assembly.excludesBuilding(...)` is **true** for roof IDs1267862163,1051656817 and301527737. No specialized owner for the first roof exists in the earlier scene. The initial theory of an active six-metre box was therefore rejected: the confirmed shelter is **omitted** in this assembly.

Only one roof is implemented. The other two remain pending identity/form registration.

- [Primary OSM roof1267862163](https://api.openstreetmap.org/api/0.6/way/1267862163/full.json), present in checked-in features: building=roof, note=手水舎. Exact ring X/Z: [252.828,65.823], [255.191,65.801], [255.200,67.248], [252.846,67.270]. Main roof axis runs first→second vertex; ridge runs along its2.363m long dimension. Footprint depth1.447m. Geographic height values in features are not used as post contact heights.
- [Primary OSM tap11775043282](https://api.openstreetmap.org/api/0.6/node/11775043282.json), local[253.977,66.658], man_made=water_tap, note=手水, drinking_water=no. This source node is filtered out of `features.pois`; module includes the explicitly attributed immutable source point as fallback, without modifying features.
- [2020 visitor account](https://ameblo.jp/shouta09/entry-12601201317.html), [actual full shelter photograph](https://stat.ameba.jp/user_images/20200601/23/shouta09/1a/b8/j/o0800045014767795377.jpg), inspected pixels `outputs/r102-okusha/temizuya-2020.jpg`: open four-post brown timber canopy, green shallow gable roof, exposed beam/braces, white folded paper, rounded reddish-brown basin in rectangular mineral catchment. Torii/fox/stone-lantern group behind matches the mapped north exit, while shelter sits just to the left of the tunnel arrival. Do not place the shelter over an unnamed southern roof.
- [2016 visitor account](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610110000/) and actual `outputs/r102-okusha/court-8.jpg`: rounded basin, timber ladle crossbar and central stone water fitting; masonry backdrop. Exact original image URL in `outputs/r102-okusha/photo-index.json`.

Photographs establish type, orientation and composition. Dimensions beyond mapped roof plan, roof pitch, heights, basin profile and timber sections are explicitly inferred. Temporary instruction boards, donor inscriptions, individual ladles and water motion are not reproduced.

## API and root integration

`buildOkushaMappedSheltersR102(root, features, materials, ground, colliders)` from `fushimi_inari/integrated-world/okusha-mapped-shelters-r102.mjs`.

Call **before static batching**, once final Okusha paving/terrain height functions are ready. Pass **`walkHeight` as the ground argument for this paved court**: source support is the final actual triangle surface, not the lower terrain datum. The actual assembly probe gives all four source corners and post stations62.559976959228514m; raw `ground` is62.394978m and would sink feet below the paving.

On success add `builtIds` to the context-exclusion predicate, conditionally. It returns only `['way/1267862163']`, never the two unconfirmed roofs. Preserve other existing exclusion rules. Failure returns null before adding group/colliders, so it supplies no new exclusion authorization. Existing scene already excludes this ID, as established above.

Root result reporting should select scalar fields/`stats`/`builtIds`; omit returned `group` and `roofPoints` if unnecessary. No integration or viewer edits were made here.

## Geometry/contact/ownership

- Entire green roof and ridge stay inside the mapped roof ring to rounding tolerance; columns inset0.15m. The roof is shallow and open, not a closed extrusion. Estimated eave2.30m above highest post support; ridge another0.42m. Actual assembled eave64.859976959m and ridge65.279976959m.
- Each of four mineral post feet embeds3cm into its own support sample. Timber meets feet and transverse receivers; sloping braces meet those beams. Post columns extend from actual local support to the receiver, so they do not share a floating average floor.
- Catchment uses four support samples; its bottom is4cm below the lowest and its deck6cm above highest. This provides physical terrain contact rather than a hovering basin plane. Reject support spread>0.25m under catchment or>0.60m between post stations; do not silently bridge arbitrary slope. Actual supports here are level.
- Rounded basin has modeled outer/inner profile, inset dark pool, timber crossbar and central stone fitting. This is opaque static geometry without emissive material, transparency, lights or update loop.
- Five new exact-owned colliders: four small post cylinders and one basin/catchment box. Roof/shide remain overhead. No collider extends across the neighboring paths.
- No existing geometry, mesh/material identity, callback, collider, feature point, floor, UV or route is edited. There was no existing shelter callback to move. Test retains an unrelated interactable object/callback unchanged.

Actual mapped budget: **6 batches,65 primitives,1,288 triangles**. Four new static materials (timber, patinated roof, basin, dark pool), borrowed stone/paper. No dependencies.

## Verification

`node --test fushimi_inari/integrated-world/okusha-mapped-shelters-r102.test.mjs`: **2/2 pass**. Actual raw geometry tests finite/world bounds, mineral foot contact, low height, open-sided horizontal ray, unchanged existing interaction/features, fail-before-mutation, budget and idempotence. New colliders are sampled with actual `SpatialCollisionWorld` and0.28m player radius along all segments of adjacent public paths301527759,301527762 and649037627,60 intervals per segment; no displacement.

Actual CPU assembly probe independently confirms success on checked-in features/final walk heights and the1,288triangle budget. Its canvas/texture stubs are for geometry only and do not establish texture appearance. No browser, GPU or renderer was used. Root still owns integration, final native collision admission and visual/source comparison.

Independent visual review caught a real5cm underside gap in the initial lathe profile. Corrected its two bottom profile points to localY0, seating the broad bottom on the catchment deck while preserving rim, water, crossbar and tap heights. A raw basin geometry minY==deck regression now guards physical contact. Same budget and2/2 tests pass. Root must rerender the corrected bowl.

Surrounding north/southeast fence, stone terrace, lower-path connection and woodland findings are separately registered in `docs/okusha-surroundings-register-r102.md`; no arbitrary additions from those findings are included in this owner.
