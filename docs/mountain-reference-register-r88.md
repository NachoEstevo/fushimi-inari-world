# R88 — Mountain frontage and terrace reference registration

22 October 2026. Reference support for `approach_implementation` (Mitsutsuji), `sanctuary_implementation` (Kumataka) and `mountain_implementation` (Okusha). Root owns shared integration. This pass changes this document only; temporary source images are review material, not runtime assets.

## Inspected evidence and provenance

Read [mountain-next-packets-r87.md](mountain-next-packets-r87.md), current mapped building/path records and the actual photographic pixels listed below. The earlier `.tmp/r87-mountain/` files were opened with `view_image`; new Kumataka photographs were downloaded into `.tmp/r88-refs/` and opened the same way. Filenames/page publication dates are not verified EXIF dates or proof of current restoration state. No new video playback, panorama or measured photogrammetry is claimed here.

| Source / actual pixels | Observation supporting current packet | Confidence / limits |
| --- | --- | --- |
| [Mitama lane IMG_6659](https://fushimiinari-guide.com/wp-content/uploads/IMG_6659_20210328.jpg), local `mitama-2021-lane.jpg` | Two timber fronts facing a narrow uphill lane; left has numbered Mitamatei sign, shop/counter character; right has green tea curtain and open sitting frontage; framed translucent overhead canopy spans between eaves | High for two-sided identity with guide's explicit left/right text; dimensions and attachment positions inferred |
| [Mitama cafe IMG_7551](https://fushimiinari-guide.com/wp-content/uploads/IMG_7551_20210328.jpg), local `mitama-2021-cafe.jpg` | Same right-hand cafe frontage in oblique view; raised sitting platform, timber post rhythm, dark red noren, display cases and canopy above | Confirms cafe rather than assigning the facade by a generic shop template |
| [Mitama street 200_43](https://livingkyo.com/wp-content/uploads/2019/07/200_43.png), local `mitama.jpg` | Uphill lane beyond entrance torii; upper timber balcony to left and lower cafe to right; canopy between; paved steps at entry | Historical appearance, site text identifies July 2019; no current metre survey |
| [Mitsutsuji 200_41](https://livingkyo.com/wp-content/uploads/2019/07/200_41.png), local `mitsu.jpg` | Junction landing, signs, stone posts and uphill torii branch | Does not locate shop facade by itself |
| [Kumataka otsuka 200_33](https://livingkyo.com/wp-content/uploads/2019/07/200_33.png), local `otsuka.jpg` | Rough-stone tiered retaining wall, stone tamagaki, small roofed fitting, turning narrow stairs and torii at different levels | Presence certain; exact outer compound polygon and stair identity remain unresolved |
| [Kumataka arrival P3600669](https://fushimiinari-guide.com/wp-content/uploads/P3600669_20190210.jpg) | Main stone ascent with handrail on image left; shrine/stone-fence/otsuka structures on image right; large torii over main flight | Differentiates public ascent from subsidiary memorial steps. Pixel tread count is not surveyed rise/run |
| [Takeya/shrine passage P3600730](https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg) | Timber/glass cafe to left, shrine roof/torii and stone lantern/fitting to right, narrow paved continuation between | Matches mapped Takeya west / pavilion east of onward route |
| [Southern memorial corridor P3600734](https://fushimiinari-guide.com/wp-content/uploads/P3600734_20190210.jpg) | Long narrow slab strip with shallow raised/drained stone margins, torii and memorial boundaries tight on both sides | Not a broad plaza; corridor must remain distinct from main ascent |
| [Memorial turn P3600738](https://fushimiinari-guide.com/wp-content/uploads/P3600738_20190210.jpg) | Slab strip reaches a small landing/turn, tall lantern on right and shrine ahead among trees/stone tiers | Supports local turn; cardinal registration remains unresolved |
| [Pond-side access P3600735](https://fushimiinari-guide.com/wp-content/uploads/P3600735_20190210.jpg) | Close stone monuments and tree, short irregular slab route and gravel pocket with roofed fitting/stone torii | No exact world position extracted |
| [Memorial ascent P3600744](https://fushimiinari-guide.com/wp-content/uploads/P3600744_20190210.jpg) | Steep subsidiary stone flight with raised sloping side edges; terraced shrines on one side, bamboo/soil slope on other | Must not be merged into mapped main route just because both are stairs |
| [Pavilion side P3600705](https://fushimiinari-guide.com/wp-content/uploads/P3600705_20190210.jpg) and [rear P3600706](https://fushimiinari-guide.com/wp-content/uploads/P3600706_20190210.jpg) | Narrow mineral passage between timber pavilion body and vermilion/black capped slat fence, closing at pond-facing boundary | Establish actual confined side/rear apron; does not prove a full loop pass-through |

Source pages read: [Mitamatei guide](https://fushimiinari-guide.com/mitamatei/), [Kumataka guide](https://fushimiinari-guide.com/kumatakasha/), [firsthand mountain sequence](https://livingkyo.com/4521/). Explicit walking directions and neighboring names corroborate imagery; the paragraphs below summarize only the relevant source claims.

## Mitsutsuji — exact candidate facade edges

Guide directions explicitly identify the uphill-left building as the gift/shop counter and uphill-right building as the sitting cafe. The dataset separately labels gift `way/301527744` and cafe `way/301527777`, both 三玉亭. This closes the earlier left/right identity ambiguity when combined with the mapped uphill lane direction.

Uphill mapped lane is `way/1372838161`, 2 m mapped width, `[562.187,101.95,-332.066]` → `[573.472,103.21,-325.431]`, continuing up `way/1372838158` toward `[582.977,105.14,-319.843]`. World axes are X east/Z south. Thus uphill is east/southeast; left is north/northeast and right south/southwest. The information board anchor `[556.65,102.56,-336.786]` is not the lane centre.

| Owner | Source ring / frontage | Implementation boundary |
| --- | --- | --- |
| Gift/shop `way/301527744` | Ring: A `[562.872,-334.281]`, B `[568.546,-330.218]`, C `[573.308,-336.886]`, D `[567.633,-340.938]`, A. **A–B faces the lane**, approximately 6.98 m long | This is uphill-left/northern shop facade. Balcony observed in older view may refine this side after checking preserved envelope; facade heights/bay count are estimates |
| Cafe `way/301527777` | Ring: A `[559.633,-322.003]`, B `[570.087,-314.767]`, C `[575.132,-322.058]`, D `[564.678,-329.294]`, A. **D–C faces the lane**, approximately 12.71 m long | This is uphill-right/southern cafe facade with sitting opening; A–D is short west end, **not** the long lane-facing front |
| Kyoya `way/301527778` | Separate cafe to east/uphill; no new facade edge registration accepted here | Keep existing shell unless separately matched; do not stretch either Mitama facade onto it |

The projected northern cafe edge and southern gift edge are separated by a few metres with the 2 m path between them. Do not use the broad cafe footprint dimension as clear lane width. Derive openings, eaves and any canopy from actual segment projection and preserve route envelope/headroom. The photo proves an overhead framed translucent cover; source ownership of each support and exact span ends remain inferred. Safest first implementation accepts the two verified fronts and uses a bounded attachment design labelled as inferred; no low post or support may be placed inside the route merely to resemble perspective.

Acceptance packet for `approach_implementation`: annotate these two exact edges; front/side replacement preserves each ring and excludes only built IDs once; uphill/downhill native or same-source renders show recognizable fronts on correct sides; route and entry stair mouth remain clear; view underside for canopy headroom and roof conflicts. Do not model unobserved shop interior as public walkable space.

## Kumataka — confirmed geographic separators, unresolved terrace perimeter

Mapped roof `way/301527741` is **only pavilion roof**, not the memorial terrace boundary. Ring X/Z: `[542.629,-138.815]` → `[539.098,-132.492]` → `[543.267,-130.166]` → `[546.807,-136.489]` → closure. Preserve its existing builder ownership.

Main public arrival `way/626313754` runs `[520.562,63.57,-129.565]` → `[525.333,63.90,-130.555]` → junction J `[534.683,64.85,-128.129]`. It is tagged 2 m steps with left handrail and 64 steps; these map attributes do not establish exact rendered stair count/elevation. The onward 2 m footway `way/301527750` runs J → K `[545.229,67.41,-145.584]`; `way/439990443` continues K → `[543.286,69.99,-167.458]`. Protect these corridors and their junction from new terraces.

Takeya `way/301527736` is west/left of onward J–K; pavilion roof741 is east/right. Source P3600730 explicitly matches this two-building relationship. Takeya's close lane-facing outer edge is `[534.802,-131.435]` → `[540.923,-141.643]`; pavilion's west edge is `[539.098,-132.492]` → `[542.629,-138.815]`. These are architectural footprint constraints, not room for another retaining tier between the shop and main route.

The original large otsuka image and new arrival view jointly support stepped memorial structures **to the right/south of the east-going arrival**, distinct from the main corridor and from the east/right pavilion along the northeast onward leg. This is a side-of-route registration with moderate confidence. It is **not** an exact polygon assignment of 200_33's every wall. The guide's additional southern memorial corridor views confirm multiple narrow accesses/turns and a subsidiary steep stair. They do not provide cardinal positions or mapped endpoints for each wall.

Concrete exclusion boundaries for `sanctuary_implementation`:

- No wall or terrace may consume the 2 m main route centred on arrival `626313754`, onward `301527750` or `439990443`; include the runtime player/collider clearance outside those width values as appropriate.
- Do not treat roof741 ring as terrace perimeter or extend a retaining wall along its full perimeter simply from the building tag.
- Do not remove/replace legacy repeated stones until the proposed replacement polygon is matched independently and root approves that exact owned overlap.
- Pond `way/105449705` is a separately mapped water boundary. No new shoreline, fill across water or wholesale bank grading is established by these photographs.
- Photographed memorial stair P3600744 is a separate access; no new connection to a mapped endpoint may be invented. Likewise a visually confined pavilion side/rear apron does not establish a walk-through loop.

**Current decision:** front/onward corridor identity is closed sufficiently to reject misplaced terraces. Exact outer memorial terrace bounds, retaining lengths/heights and subsidiary step interfaces remain **blocked for geometry**. An arbitrary coordinate polygon would be fabricated. The next source needed is one georeferenced panorama or aerial/ground correspondence showing J, the main arrival handrail and the lower/upper memorial stair mouths together. Root or assigned visual operator can use the actual ground views above beside the map to register endpoints; until then preserve current source terrain and record the missing tier work honestly.

## Okusha support and shared limits

`mountain_implementation` retains the R87 official Okusha open fore-pavilion/separate rear-roof packet. This pass supplies no new calibrated Okusha source and changes none of that ownership. The shared acceptance requirement is separate front/rear roof form inside mapped ownership, public approach retained, and matching collision/interaction handling.

No user video timestamp was newly inspected. Earlier selected video frames remain historical evidence only. Reference confidence differs by issue: high named Mitama left/right identity; moderate facade edge/photo registration; unresolved Kumataka complete terrace perimeter; low surveyed dimensions throughout. These differences must survive into build metadata and final reporting.
