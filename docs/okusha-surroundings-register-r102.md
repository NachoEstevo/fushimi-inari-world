# Okusha surroundings register R102

Historical local exports cited below are now in the verified private archive; see [recovery and original paths](repository-archive.md#historical-local-exports).

Research only, 2026-10-23. Coordinates below are local **[X east, Z south] metres**, origin latitude34.96714 longitude135.77267; R6378137 equirectangular projection. No elevation is established by these plan coordinates. No production geometry, paths, renderer or browser was changed.

## Primary map and actual scene comparison

Fetched [OSM map API](https://api.openstreetmap.org/api/0.6/map.json?bbox=135.7750,34.9661,135.7764,34.9671) and [complete Omokaru boundary way](https://api.openstreetmap.org/api/0.6/way/1267860089/full.json). Raw records, projected ways, bounded priority subset and an annotated plan are saved under `outputs/r102-okusha/`: `osm-map.json`, `fence-1267860089.json`, `registered-ways.json`, `priority-register.json`, `source-plan.svg`.

Compared actual `outputs/r96-integrated/okusha-aerial.png` and arrival image with production R88/R94/R95/R96/R101 owners. Hall and reception are detailed; R96 owns **only** the 7.412m eastern segment of way1267860089 behind the stones. R94 adds a bounded rear broadleaf bank, not the entire surrounding forest. No code owner was found for the north/southeast fence ways below. The aerial's broad open earth therefore lacks documented boundary articulation; filling it with arbitrary forest or walls would not reproduce the source.

The initial grep-only hypothesis was that generic context produced six-metre closed shells. **The actual assembled probe disproved that:** `excludesBuilding` returns true for all three small roofs1267862163/1051656817/301527737. They have no specialized owner and are omitted in the current assembly. Saved `actual-assembly-probe.json` records the actual predicate and final ground/walk heights. A new exact-ID owner is therefore an addition into omitted context, not replacement of an active shell. Conditional builtIds remain useful to prevent generic fallback in later assemblies. Do not infer actual exclusion from one anchor or the generic viewer loop alone.

## Original photographs actually inspected

1. [Official exterior](https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg), local `outputs/r101-okusha/official-okusha.jpg`: stone bank and upper vermilion paling behind/right of the sanctuary, woodland immediately behind.
2. [2019 frontal photo](https://fushimiinari-guide.com/wp-content/uploads/DSC_0616-2_20190205.jpg), local `outputs/r102-okusha/front-2019.jpg`: stone banks/upper red fences on both sides; hall, dark reception roof and ema establish orientation. Left photo side is map north because worship front faces west.
3. [2016 field account](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610110000/), images listed with original URLs in `photo-index.json`:
   - `court-8.jpg`: low rounded reddish-brown basin in rectangular mineral catchment, ladles on a timber crossbar, central stone water fitting; cobble bank behind. Article explicitly locates this hand-washing shelter near the Senbon exit.
   - `court-10.jpg`: sanctuary detail, useful to separate actual sanctuary from surrounding structures.
   - `court-11.jpg`: **north lateral bank**, broad rounded cobble face, red paling above, quantities of small donated torii on the upper shrine ledge, large torii behind, dense green bank. Camera sees the hall's lateral side. This supports treating the registered northern boundary, rather than extending the east Omokaru wall at random.
4. [2020 field account from southern lower path](https://plaza.rakuten.co.jp/asobikokoro2/diary/202001170000/), local `south-bank-4.jpg`, [original image](https://image.space.rakuten.co.jp/d/strg/ctrl/9/77c9ec54c1f327b547639b76691acdaeaab0369d.77.2.9.2.jpeg): **large cobble retaining terrace**, red upper fence and court roofs behind; lower trail in foreground; separate small torii route beyond the terrace to the right; mature trunks and woodland enclose the lower level. Author explicitly says this is the complete stone bank of the Okusha court, photographed after passing its stairway and walking east along the back path. This is strong topological evidence for the southern terrace, not a height survey.
5. [2019 onward path](https://fushimiinari-guide.com/wp-content/uploads/P3600516_20190205.jpg), local `onward-north-2019.jpg`, linked by [Neagari pine article](https://fushimiinari-guide.com/neagari-no-matsu/): north exit has paired fox statues on large mineral pedestals, stone lanterns and narrow steps between wooded banks. The article locates the pine about10m north of Okusha. Do not use this photo as a view of the southern retaining wall.

6. Follow-up [2020 complete hand-washing shelter photo](https://stat.ameba.jp/user_images/20200601/23/shouta09/1a/b8/j/o0800045014767795377.jpg), local `temizuya-2020.jpg`, from [visitor account](https://ameblo.jp/shouta09/entry-12601201317.html): confirms green shallow gable, four timber posts and source basin at roof1267862163. This resolved the initial roof-form gap; see `docs/okusha-mapped-shelters-r102.md` for the separately authorized one-shelter implementation.

No new 360 or user-video playback was performed. Supplied videos are not claimed as inspected evidence in this register.

## Implementable plan registration

All vertices and source tags are preserved in `priority-register.json`; chains below are **open**, never a perimeter closure.

| Priority / source ID | Registered chain or footprint | Interpretation and limits |
|---|---|---|
| A: way1267860090 | [261.704,60.580] → [265.326,60.714] → [274.621,60.257] → [276.227,64.487] → [276.966,64.354]; 18.206m | North bank red wood paling, mapped height1.0m. Backdrop of frontal photo's left and lateral2016. Existing east boundary ends at[276.501,66.246]; **leave the source gap** around torii node9664306034[276.920,65.222]. |
| A: remaining way1267860089 | [277.121,66.168] → [276.501,66.246] → [277.395,73.604] → [274.256,74.295] → [275.278,80.695] → [277.869,80.328] → [279.593,80.306]; full22.073m | R96 owns vertices1→2 only. Add exact other segments once, if taking ownership. Height1m is sourced, cobble-base height1.65m is **R96 interpretation of its own segment**, not transferable to every return. Leaves rear passage west of the fence. |
| A: way301527729 | [265.462,83.434] → [266.311,89.323] → [279.046,92.273] → [280.861,89.690];22.179m | Southeast terrace upper red paling. Height absent; photograph confirms fence atop cobble bank. Do not build as a same-height free-standing wall on lower ground. |
| A: ways301527726 /301527727 | cliff726 [257.499,85.950] → [265.563,89.957] → [276.054,92.373]; cliff727 [273.673,75.697] → [275.087,83.256] → [290.193,92.896] | Map calls these natural cliffs; **photo proves a built cobble terrace exists in this sector**, but does not prove every cliff vertex is masonry. Survey candidate crest/toe rays and actual court/path elevations before authored masonry. Preserve stair opening. |
| B: way1267860087 | [276.291,83.178] → [290.440,91.861] → [296.305,89.423];22.952m | Separate eastern/southeastern red paling, mapped1m high. Do not connect across source gaps or merge with301527729 by proximity. |
| B: way1267860088 | [275.661,80.940] → [277.842,80.673] → [278.088,82.710] → [275.926,82.989];6.429m | Small open enclosure around memorial node9664306043[277.121,81.853], with nearby mapped trees9664306040[276.929,83.300] and9664306041[276.984,80.874]. Their positions are sourced; memorial shape and exact trunk species are not yet photographed closely enough here. |
| A: roof1267862163 | [252.828,65.823], [255.191,65.801], [255.200,67.248], [252.846,67.270] | Mapped 手水舎; water-tap node11775043282[253.977,66.658] confirms identity. Basin shape source2016; follow-up2020 confirms roof/posts. Bounded owner now prepared separately, no extra footprint. |
| B: roof1051656817 | [272.970,61.237], [272.897,60.714], [273.955,60.558], [274.028,61.081] | Named 納札所, immediately south of north fence. Currently omitted; an eventual generic six-metre extrusion would be inappropriate. Source identifies use/footprint only; no invented cabinet contents or doors. |
| Pending: roof301527737 | [258.611,75.675], [257.982,71.757], [255.245,72.213], [255.884,76.120] | Another small roof near south/front court. Currently omitted; identity/form are unconfirmed. Do not mistake it for the mapped hand-washing shelter. |

## Connections to preserve

North passage way301527762: [256.440,64.020]→[273.782,61.393]→[275.461,72.458]→[271.848,73.014]→[259.086,74.940]→[258.538,71.334]→[257.517,71.489]. Keep full existing route/collision owner. The first segment runs immediately below north paling; the northern shrine cannot be fenced shut against it.

Southern stairway301527749 [252.490,77.345]→[253.941,84.903] and connecting path301527754 [253.941,84.903]→[254.452,88.655] join the lower142100368 path. These are a real court-to-lower-trail connection, not an optional landscaping cut. Rear spur301527758 [271.848,73.014]→[273.955,84.781]→[278.380,88.332] ends at mapped noexit node3055919075; do not force-connect it to lower trail or masonry.

## Recommended next bounded implementation

First: source-backed chōzuya filling its omitted mapped footprint is now prepared after the2020 full reference resolved its roof/posts. Next north fence0090 and remaining0089 returns require exact ownership, existing bank support heights and route clearance tests. These change visible surroundings substantially without modifying hall/paving.

Second: independently register southern terrace crest/toe to actual terrain triangles and court/lower-path levels. A mineral retaining bank with its upper railing and preserved stairway is the largest missing architectural enclosure. Do not choose a uniform height from the photograph or copy R96's east-base1.65m onto the entire slope.

Woodland: source supports dense bank vegetation behind north/east/southeast boundaries and mature trunks beside lower path, but only two individual trees in the memorial pocket are mapped here. Keep R94 rooted trees; additional inferred stems require terrain rays, public-route/building exclusion and source-bounded pockets rather than a blanket grid.

Temporal conflict: live way301527742 is now tagged construction for 奥社奉拝所授与所新築工事, check_date2026-06-15, planned completion2027-05-31. This parcel south of the hall must not be turned into an invented historical reception building or mixed unlabelled with2016–19 photographs. Existing R88 gift/toilet owners739/730 remain unchanged by this research.
