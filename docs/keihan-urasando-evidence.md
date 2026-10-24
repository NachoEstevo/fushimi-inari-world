# Urasando storefront evidence and ownership

Research packet for the Keihan arrival extension, 2026-10-24. This file records source registration and candidate facade treatments only; it does not certify a rendered reconstruction. The route owner implements `keihan-urasando.mjs`; root owns integration and visual review.

## Route and existing owners

`way/297888106` is the mapped pedestrian Urasando/Shinko-michi street, with source points ordered east to west: `[-58.657,-69.029] → [-62.744,-73.115] → [-84.756,-75.096] → [-124.95,-84.325] → [-151.505,-87.319]`. `way/105449676` continues northeast: `[-58.657,-69.029] → [-52.828,-65.946] → [-38.305,-49.771] → [-20.434,-25.381]`, read in walking order. Coordinates are X east / Z south, metres, in the repository projection.

Nearly every frontage below is **already built by `buildEntranceNeighborhood`**, which runs before the new Keihan builders in the current integration order. `entranceNeighborhoodLayout` includes buildings whose average point center is X −160…−18 and Z −100…0. Excluding new IDs only from the final generic context builder will leave duplicate walls, roofs and colliders. A replacement must run before the neighborhood builder so its successful `builtIds` can be removed from `neighborhoodFeatures`; alternatively add restrained overlays to the existing envelope, return no replacement IDs and do not introduce a second wall/floor owner. Avoid removing the entire neighborhood group.

Retain these specialized existing owners:

- `way/223276575`, Gishikiden: 16 m photo-estimated screened envelope, entry details and mapped canopy `way/751194634` in `entrance-neighborhood.mjs`.
- `way/260121332`, Minami Shingu: 5.2 m photo-estimated envelope, clipped tiled gable, timber facades, blinds and short striped awning in the same file.
- `way/260121327`, mapped guardhouse: replaced by the guardhouse detail builder before the neighborhood pass.
- Existing Rōmon surroundings, entrance area surfaces, mapped trees/hedges and Gishikiden access surface retain their ownership. A storefront package must not scatter replacement trees or patch over their floors.

The route owner identified two torii in fresh OSM data that are absent from the older feature snapshot; their placement belongs to that owner. The entry pine `node/9661280983` at `[-152.864,-84.792]` is already in the entrance context evidence. Do not replace the pine with an invented storefront prop.

## Observed and actionable frontages

The root-saved `outputs/keihan-arrival-review/streetview-08-urasando-entry.png` and `streetview-09-urasando-torii.png` were visually inspected. Both display **July 2025**. Their visible north and south entrance facades support anonymous facade classes, not names or unoccluded interiors. Frame 09 is less crowded and shows closed shutters, so it is the clearer geometry reference; different open/closed shop states are not proof of a single synchronized street condition.

| Source footprint | Street edge, ordered endpoints X/Z | Width | Evidence and bounded treatment |
| --- | --- | --- | --- |
| `way/296201563` | edge 2: `[-141.315,-89.712] → [-153.996,-90.803]` | 12.727845 m | First north frontage: cream plaster with dark upper timber/window grid, shallow gray tiled eaves, slate/navy awning and dusty pink short curtains in frame 08. Frame 09 clarifies a gray roller shutter, dark framed display glazing, pale diamond-pattern lower tiles and two tiled eaves. Anonymous photo-inferred registration. Existing tagged two-storey envelope is 6 m. |
| `way/305214377` | edge 2: `[-152.892,-83.69] → [-143.258,-82.978]` | 9.660274 m | First south frontage: red/brown timber, patinated green shallow canopy and low gray timber screen near the frame-08 corner; frame 09 shows cream long fascia/awning and red lanterns along the street face. Sign/tenant identity withheld. Existing untagged neighborhood envelope is 4.5 m. Pine/pole/fence boundaries must remain distinguishable from the shop. |
| `way/295577541` | edge 2: `[-116.575,-88.187] → [-123.846,-88.989]` | 7.315097 m | **Sando Chaya**, independently registered by named POI and official storefront photo. Existing mapped three-storey envelope is 9 m; only the lower observed bay should receive detailed treatment. |

The normal `[t.z,-t.x]` from the listed ordered edge tangent points toward the public street for these three rows. All other envelope dimensions, bay counts, equipment sizes and hidden surfaces remain inferences. A shallow inset display or entrance floor must use the actual paved route grade and expose a bounded sampler; it must not create an accessible invented interior or an extra coplanar road top.

## Sando Chaya

Fresh OSM node `12308812101`, latitude 34.9679735 / longitude 135.7713499, is tagged `name=Sando Chaya`, `amenity=restaurant`, `cuisine=coffee_shop;ice_cream;tea` and links the official site. Projecting through the repository manifest gives `[-120.42505657,-92.78479558]`. A point-in-polygon check confirms it lies inside `way/295577541`; no embedded map viewport center was used as a POI.

The current [official shop page](https://sandow.jp/chaya/) identifies the red parasol and the shop's amazake, hiyashiame, mochi and matcha sweets. The [official cafe page](https://sandow.jp/chaya/cafe/) corroborates the address at Fukakusa Kaidocho 1-10. Prices and hours are irrelevant to the reconstruction and should not be copied into signs.

The [official storefront photograph](https://sandow.jp/common/img/img_chaya_access.jpg), inspected locally at `C:/Users/nacho/AppData/Local/Temp/keihan-route-references/sando-chaya-access.jpg`, shows:

- Red paper parasol with dark pole, above the frontage seating.
- Open dark-timber entrance, short white noren with the confirmed shop name, cream round lanterns and visible lamp shapes.
- Reed blind at the left and a small glass takeaway display below it.
- Pale timber benches carrying red cushions and dark small seat pads.

The [official close-up](https://sandow.jp/common/img/img_sprt_home01_pc.jpg), saved as `sando-chaya-official.jpg` in the same temporary directory, independently shows the short white noren and black/red printing. These official photos have no established capture date; a page's present availability is not proof of the 2025 inventory. Use a simple original name label, not a reproduced advertising photograph. Use geometry for bulb/lantern shapes, not new point lights. Keep parasol pole, bench and display within a safely inset footprint bay and away from the clear public route. Hidden tables, kitchen, complete menu and today's stock are not established.

## Middle row and shrine-side candidates

These are exact source edges adjacent to the commercial route. Their existence and orientation are verified from the current feature file. The later root-saved `streetview-10-urasando-shops.png` and `streetview-11-urasando-bend.png` were inspected; both display **July 2025**. They show a continuous north-side row of pale gray horizontal roller shutters, narrow timber/dark jambs, shallow muted red awnings, upper timber or pale plaster facades, and small metal threshold ramps. This supports a bounded **row-level anonymous appearance** on footprints 645/646/643/640/641/638/639, without names, copied advertisements, merchandise or a claim that the exact bay count/colors have cadastral precision.

Frame 11 has one green awning nearest the camera, but its exact parcel cannot be assigned from the available camera metadata. Omit that variation until the panorama location is fixed rather than guessing which shop gets it. The red lantern lines and red/white temporary poles are a July festival state; root selected a spring setting, so omit festival lantern strings, cones and temporary barriers. The attached storefront lantern sequence also appears continuous with that festival treatment and should be omitted from these new rows unless independently established as permanent. The underlying low rough-stone south boundary is visible, but it belongs to the route/boundary owner rather than a storefront builder.

The listed 644/372 faces are near or beyond the stone torii. Frames 10/11 do not establish their facade appearance. Root later supplied `streetview-13-shrine-join.png`, panorama BShS8eT2lnI77nYaOks0yg, at 34.9677744,135.7720457, with a **June 2012** capture date. It was inspected and confirms the tree-lined shrine join, stone lanterns and historic shop/precinct context; root retained those existing owners and explicitly ended this extension at the observed Urasando row. No new 644/372 detail is claimed. The precise latitude/longitude supplied for panorama 10 was marked approximate after an advance, so it is not used here to assign individual signboards to parcels.

| Source footprint | Candidate edge and endpoints X/Z | Width | Current envelope |
| --- | --- | --- | --- |
| `way/296201558` | 2: `[-136.298,-89.835] → [-140.476,-90.28]` | 4.201632 m | 6 m, tagged 2 levels |
| `way/296201560` | 1: `[-125.515,-89.378] → [-136.298,-89.835]` | 10.792680 m | 6 m, tagged 2 levels |
| `way/305214369` | 0: `[-143.258,-82.978] → [-133.534,-82.098]` | 9.763738 m | 4.5 m, inferred |
| `way/305214378` | 0: `[-133.534,-82.098] → [-126.309,-81.274]` | 7.271836 m | 4.5 m, inferred; next edge 1 also fronts the bend |
| `way/305213645` | 1: `[-106.44,-83.768] → [-116.119,-86.072]` | 9.949445 m | 4.5 m, inferred |
| `way/305213646` | 8: `[-96.679,-82.109] → [-106.44,-83.768]` | 9.900980 m | 4.5 m, inferred |
| `way/305213643` | 0: `[-85.012,-79.983] → [-95.037,-80.584]` | 10.042999 m | 4.5 m, inferred |
| `way/305213640` | 0: `[-77.997,-78.914] → [-83.835,-79.159]` | 5.843139 m | 4.5 m, inferred |
| `way/305213641` | 4: `[-72.022,-77.957] → [-78.042,-78.191]` | 6.024546 m | 4.5 m, inferred |
| `way/305213638` | 2: `[-65.809,-77.367] → [-72.022,-77.957]` | 6.240951 m | 4.5 m, inferred |
| `way/305213639` | 2: `[-62.872,-77.078] → [-65.809,-77.367]` | 2.951185 m | 4.5 m, inferred |
| `way/305213644` | source edge 3 **reversed**: `[-49.699,-72.246] → [-56.769,-77.1]` | 8.575909 m | 4.5 m, inferred; named gift shop in source, photographed facade unverified |
| `way/305214372` | 0: `[-36.325,-52.365] → [-43.003,-65.178]` | 14.448829 m | 4.5 m, inferred; edge midpoint is 5.00 m from path 105449676 |
| `way/305214376` | nearest is 0: `[-18.573,-46.676] → [-22.861,-54.335]` | 8.777655 m | **Withhold:** edge midpoint is 14.62 m from path 105449676; not a direct street frontage |

The last ring's source winding differs: `[t.z,-t.x]` on its original edge 3 points into the building, so reverse that frontage basis if it is used. This is a candidate near the shrine-side bend, not authority to add a new business sign from distant pixels.

## Nezameya withheld

Fresh OSM node `2656063064`, latitude 34.9678430 / longitude 135.7708671, projects to `[-164.46809672,-78.25760203]` and is inside `way/305214374`. Its actual property is southwest of the Hommachi/Urasando junction, outside this packet's X −155…−20 core. Its north frontage is edge 2, `[-176.309,-80.896] → [-163.884,-80.662]`, 12.427203 m.

The supplier's [Nezameya listing](https://www.kikumasamune.co.jp/ajinamise/detail.html?id=1327) corroborates the restaurant identity and address and supplies a small [storefront photo](https://www.kikumasamune.co.jp/ajinamise/shop_img/1327/tenpo1.jpg). The photo shows pale timber upper windows, a green canopy and dark timber lower bays, but is undated. This is a supplier-hosted listing, not Nezameya's own official site.

The current `legacy-builders.mjs` already assigns the Nezameya identity to an authored southern shop away from this true registered corner. Do not silently create another named Nezameya here. Root/route owner chose to withhold this named frontage for this extension until identity ownership is explicitly repaired.

## Implemented bounded owner and verification

`keihan-urasando.mjs` replaces fourteen source footprint shells: the two entry parcels, Sando Chaya, four intermediate entry-row parcels and the seven north-row parcels through 305213639. Frames 09/10/11 support the anonymous shutter/awning class; the individual bay count remains inferred. Existing source envelope heights are preserved. No new name texture, price board or unseen roof form is introduced. The two mapped torii use exact source post axes; their height and beam proportions are photo estimates. Entry red-pillar black bases and the pair of permanent stone lanterns follow frame09. The duplicate entry torii node is counted once, as the same gate as way952687112.

The final expanded budget authorized by root is fewer than 20,000 triangles and at most ten draws. The implementation uses eight shared material batches, no new lights and no dynamic updates. Slate paving joints are thin static marks on existing path grades; they do not replace the walking floor. The Sando public recess has one real, bounded footprint floor; the parasol, bench and case are inset. Existing neighborhood and generic owners must exclude the fourteen `builtIds` only after successful preflight. Gishikiden, Minami and the unobserved faces beyond the stone torii retain their previous owners.

Six passing focused tests cover source footprint retention and ownership exclusions, untouched specialized neighbors, actual ray support for the tea-shop recess, path centre and ±0.5m shoulder clearance, both mapped torii and their post collisions, finite geometry, fixed budgets, idempotence and fail-closed missing source. Source inspection and CPU geometry checks alone do not establish native appearance, exact historical fidelity or frame-time performance.
