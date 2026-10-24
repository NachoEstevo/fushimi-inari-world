# R102 — Registered Kumataka surroundings and next-lot evidence

## New primary records

The [live OSM map API](https://api.openstreetmap.org/api/0.6/map.json?bbox=135.77825,34.96805,135.77885,34.96875) was checked on 2026-10-23. Raw response: `outputs/r102-kumataka/osm-map.json`; projected records and nearest-route distances: `registered-pois.json` in the same directory. Coordinates use the repository's equirectangular projection, origin 34.96714 / 135.77267 and radius 6378137 m.

These records establish independent rest-area targets rather than additional speculative perimeter fencing. None of the four bench IDs or vending-machine ID has an existing dedicated owner in the production modules. The geographical extractor selects particular landmark categories, so a bench can be present in current OSM while absent from the filtered `features.json` and scene. Current map retrieval verifies the records, not present-day physical condition. The bench records are version 1 from April 2022 and have no azimuth tags or matched bench photographs.

| Primary node | World X, Z (m) | Mapped description | Nearest relevant route centerline | Decision |
| --- | --- | --- | --- | --- |
| [9667109065](https://api.openstreetmap.org/api/0.6/node/9667109065.json) | 547.326910, −142.177254 | Blue metal bench, backrest, three seats | 3.557 m, onward301527750 | Implementable with inferred shoreline-parallel azimuth and whole-footprint checks |
| [9667109066](https://api.openstreetmap.org/api/0.6/node/9667109066.json) | 545.885568, −139.639169 | Wooden bench, no backrest, three seats | 3.636 m, onward301527750 | Same bounded rest-area context |
| [9667109067](https://api.openstreetmap.org/api/0.6/node/9667109067.json) | 547.044115, −139.939732 | Wooden bench, no backrest, three seats | 4.472 m, onward301527750 | Same bounded rest-area context |
| [9667109069](https://api.openstreetmap.org/api/0.6/node/9667109069.json) | 535.668459, −127.650060 | Stone bench, no backrest, three seats | 1.091 m, onward; 1.096 m, arrival | Withhold: center is too near two 2 m paths to assume a safe standard footprint; do not move it to force clearance |
| [4124716289](https://api.openstreetmap.org/api/0.6/node/4124716289.json) | 541.579786, −141.876691 | Drinks vending machine; checked September 2026 | 1.206 m, onward301527750 | Withhold: insufficient matched appearance and edge clearance; no invented brand, prices or machine orientation |
| [9667109070](https://api.openstreetmap.org/api/0.6/node/9667109070.json) | 535.303562, −126.670449 | Guidepost | 1.585 m from arrival/onward junction | Withhold: exact arm orientation and lettering must be matched to this node |
| [11782157039](https://api.openstreetmap.org/api/0.6/node/11782157039.json) | 538.332205, −130.243804 | Water tap named 浄水, note 手水, drinking_water=no | 2.030 m, onward301527750 | New source-registration issue: distinguish this actual tap coordinate from the accepted inferred shelter bay at540.817,−130.674; do not silently equate them or relocate the shelter in this furniture packet |

The three northern benches are outside the mapped pond and north of the mapped main roof, with clear space between public route and shoreline. Their physical size, support pattern and orientation remain inferred. A shoreline-parallel axis supplies a coherent minimal context; the blue backrest is placed northwest so the seat faces southeast toward water. This is not a measured bench-direction claim. The original POI centers must remain fixed; conflicting support, water, building or existing solids withhold an individual bench.

## Other independently visible surroundings

### Main arrival handrail and stone edge

Accepted [P3600669](https://fushimiinari-guide.com/wp-content/uploads/P3600669_20190210.jpg), re-inspected as pixels, shows a narrow stone stair with a brown metal handrail on the left ascending side, low stone curbs, wooded/mossy slope to the left and memorial structures beyond the right edge. Mapped `way/626313754` has width2 m, handrail=yes and handrail:left=yes. Its actual path points and shared junction already provide endpoints.

This is not wholly missing: `path-surfaces.mjs` sets its handrail flag and `path-meshes.mjs` renders rails inside both side loops. A future source-specific correction could preserve the mapped stair/left edge and improve its brown rail/support profile, while reviewing the generic opposite rail against the photograph. Do not label existing handrails absent or remove an unseen side from one crop alone. No stair count, rise, route center or torii placement should change for this finish correction.

### Pond outflow and approach-side channel

Freshly inspected images are saved under `outputs/r102-kumataka/`:

- [P3600665](https://fushimiinari-guide.com/wp-content/uploads/P3600665_20190210.jpg), `arrival-stream-P3600665.jpg`: clear shallow natural water, leafy/fern-covered banks and visible bed near the approach.
- [P3600671](https://fushimiinari-guide.com/wp-content/uploads/P3600671_20190210.jpg), `pond-outflow-P3600671.jpg`: a confined open channel with rough stone sidewalls, a round dark pipe mouth and brown rail beside the stair. The guide captions it as water flowing from the pond.

This is a larger surroundings omission than another shrine ornament. Source `way/301527767` already connects the pond corner `[542.674,−127.706]` to `[510.098,−118.889]` and is tagged stream, tunnel=yes, layer=−1. Its downstream continuation `way/301527774` is an open surveyed stream. The integrated viewer's generic water loop renders only natural=water polygons, so these stream lines do not receive an architectural channel owner.

The mapped tunnel line establishes connectivity, not the exact visible channel walls or pipe portal in P3600671. Its full approximately34 m line must not be opened into a trench through public paths. A concrete next research step is to register the photographed pipe mouth to an actual stair/culvert endpoint and inspect grade continuity; then build only the supported exposed mouth/channel interval with real downward water flow and protected path support. Existing terrain-sampled stream Y values are not reliable hydraulic levels.

### Guidepost appearance is not yet matched

[P3600746](https://fushimiinari-guide.com/wp-content/uploads/P3600746_20190210.jpg), saved as `guidepost-P3600746.jpg`, shows a black multi-arm post with white bilingual route panels and a nearby stone lantern. It is in the guide's approach sequence. This is useful appearance evidence, but no unbroken view establishes that it is node9667109070 at the Kumataka junction. Do not copy these arrows or labels onto that node without matching the junction orientation.

### Vegetation and memorial-side support

Accepted P3600669 and the independent `outputs/r99-parapet/koiwide-y31.jpg` show fern/moss ground cover and trunks rooted in the arrival/memorial slope, with rough stone support below local memorial courts. Existing R97 bank landscape specifically owns the opposite pond arc, not every approach-side understory patch. A narrow route-relative low-growth pass could use the mapped left edge of626313754, actual dry rendered terrain and existing trunk ownership to fill this independently visible approach-side habitat. Species and individual root locations are not surveyed. Do not place new trees in the narrow paving or invent the memorial terrace perimeter.

## Delivered first furniture subset

The separately authorized `kumataka-rest-furniture-r102.mjs` considers only the three northern registered bench candidates. It preserves POI centers, withholds unsupported/conflicting candidates, and leaves the stone bench, vending machine, guidepost, water tap, stream, vegetation and memorial boundaries for their explicit next contracts. Render review proved candidate9667109067 intersects an existing colliderless source stele; the corrected builder withholds it using actual transformed stone geometry. The actual-pose regression accepts the blue bench and candidate9667109066, pending full integration re-audit. No source stele is moved or removed to make room. No full-pond fence or unknown parapet endpoint is proposed.

This register and its source artifacts were produced without rendering, a local browser or an integration edit. New physical-site exactness remains limited by OSM positional accuracy, older photographs and unmeasured object dimensions.
