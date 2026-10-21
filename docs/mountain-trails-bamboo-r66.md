# Mountain trails and jointed bamboo — r66

Implemented 21 October 2026 against upstream `43e4afa`, preserving the concurrent
Gonden/Okumiya and Tamayama access work. This pass improves the existing mountain trail geometry and
the existing bamboo instances. It does not claim a surveyed digital twin or a
completed reconstruction of the entire precinct.

## Scope and evidence

The path adapter applies only to stone segments whose **both** endpoints are in
`x = 255…1450 m`, `z = −620…360 m`, and whose lower surface elevation is at least
60 m. The two Senbon paths are excluded explicitly. This is an implementation
boundary beyond the lower precinct, not a claimed historic site boundary.

The checked-in [OSM features](../fushimi_inari/geography/features.json),
[GSI terrain](../fushimi_inari/geography/terrain.json) and existing path profiles
remain the source for route positions and grades. No source path or DEM is edited.
The original entry HTML, interactive viewer, generated legacy builder and binary
assets remain unchanged. The integrated entry HTML only advances its viewer
cache version; the entrance architecture and UI design are preserved.

Selected frames were inspected in the supplied
[4K HDR JAPAN walking video](https://www.youtube.com/watch?v=iqK2tg-TxbY):

| Video time | Visible evidence used as context |
| --- | --- |
| [11:15](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=675s) | Aggregate landing, metal grates, granite borders and ascending steps near the Neagari-matsu sign |
| [21:30](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=1290s) | Shin-ike worship setting: dense votive stones, lanterns, small offering torii and vermilion rails with dark post caps |
| [26:53](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=1613s) | Rising torii corridor, dark post bases on stone footings, rectangular grey paving/steps and close vegetation |

These are visual observations, not photogrammetric measurements. They guide
material distinctions and the relationship between path, stone edge and slope.
They do not establish the exact length, tread count or drainage arrangement of
every mapped path. Existing authored stair profiles retain their original heights.

## Bamboo

The adapter refines the original **160 clumps / 640 culms** in place. It keeps the
mapped culm instance transforms and existing bamboo leaf atlas and normal map.
The original smooth stems now have 18 node stations per culm: shallow radial
relief, a pale node band and a narrow darker sheath scar. Internodes shorten near
the ends, culms vary modestly in height/radius and bend slightly.

One shared 128 × 1024 canvas texture provides longitudinal fibres and bands at
the same stations as the geometry. There is no separate mesh for every ring.
Sixteen small branches per clump start at actual nodes. Leaf cards follow the
same branch curves and culm transforms in both detail levels; the old independent
crown yaw/height offset is removed so foliage does not float above the stems.

The existing instance batches are partitioned into 64 m cells. Each cell uses
one near/far level at a time, with a 32 m threshold padded by its bounding radius
and 14% hysteresis. The far level retains the same plant envelope and texture
bands, with simplified stems/branches and two crossed leaf cards per spray.

| Per original clump | Near | Far |
| --- | ---: | ---: |
| Culms and branches | 4,992 triangles | 512 triangles |
| Leaves | 192 triangles | 64 triangles |
| **Total** | **5,184 triangles** | **576 triangles** |

The far level uses 88.9% fewer triangles than the new near level. This comparison
is between the two new levels, not a claim that the old smooth bamboo had the
same cost. No new groves, lights, wind simulation or update loop are added.
Actual plant locations and botanical dimensions remain interpretive. In
particular, the [official Miyuki description](https://inari.jp/en/map/spot_18/)
identifies black bamboo there; that evidence is not used to recolour every grove
or invent the unverified extent of a Miyuki planting.

The [component close-up](review-r66/bamboo-close-software.png) and
[whole-plant comparison view](review-r66/bamboo-full-software.png) were rendered
from the exact production geometry with EGL/llvmpipe. They use approximate diffuse
lighting/materials and are **not browser screenshots or full-scene FPS evidence**.

## Mountain paths

- Soil shoulders meet local ground at both ends instead of floating at a fixed
  offset from the adjacent tread. They are omitted at other paths, large drops,
  or folded mitres where a shoulder would cross itself.
- Paving UVs follow distance along the mapped path. Tread wear faces the actual
  riser in both ascent and descent; no visual displacement changes walking height.
- Treads use a small procedural wear tile; risers share the existing granite
  material with a darker vertex colour. Retaining faces reuse the existing mossy
  stone texture. Paving shares the existing flagstone batch.
- Mountain edge subdivisions use up to 0.9 m strips instead of 0.45 m. Both ends
  and the middle are checked at connected junctions so the longer strip cannot
  seal a branch opening. The existing spatial culling remains in place.

Runtime counts are available in `document.body.dataset.mountainPaths`; bamboo
counts are in `assembly.inventory.forest.bamboo` / the inventory DOM dataset.

## Geometry and performance checks

The comparison below builds the complete checked-in path network using the
original DEM, the same Three.js 0.164.1 geometry code and identical camera inputs.
Local production terrace grading can change the precise runtime geometry totals.

| Complete path geometry | Before | After |
| --- | ---: | ---: |
| Triangles | 1,206,593 | 1,082,233 |
| Spatial material batches | 719 | 789 |

This removes **124,360 triangles (10.3%)** while adding 70 batches for the material
distinctions. Sharing paving and riser materials reduced that increase from 112
to 70 during review. Fewer triangles alone do not prove a frame-time improvement.

Estimated visible path batches at eye-level checkpoints, with FOV 45°, 16:9
aspect ratio and eye height 1.7 m:

| Camera | Before | After |
| --- | ---: | ---: |
| Kumataka | 201 | 219 |
| Yotsutsuji | 246 | 270 |
| Sannomine | 101 | 113 |
| Ainomine | 76 | 93 |
| Summit | 232 | 249 |

Across 120 sampled views (12 headings, two inclinations and five checkpoints),
the largest increase was 47 batches. These are frustum-based submission
estimates, without terrain occlusion or GPU timings. No new distance cutoff is
introduced for trails, because it could remove distant paths in flight views.

In the protected lower area `x < 240 m`, all **498,411 path triangles** retain
exactly the same positions, normals and UVs as the baseline, compared with an
order-independent triangle hash. New vertex colours there are all white.

## Verification and limits

Direct Node tests pass: bamboo profile **5/5**, mountain path layout **6/6**,
existing path frame **4/4**, junction **3/3**, and stair profile **9/9**. The new
tests cover connected branches, valid node profiles, bounds/budget, protected
scope, grounded shoulders, junction clearance and texture direction.

Independent checks with Three r164 found no non-finite buffers, degenerate
bamboo triangles or winding/normal mismatches. Partition and LOD preserve world
transforms under transformed parents and non-uniform scales. Both detail levels
fit inside the near bounding spheres used by the existing forest culling.

The cloud test browser could not create a WebGL context. The connected desktop
browser could inspect the reference video and Google Maps, but could not reach
the local preview host. Four preserved large entrance GLBs also could not be
retrieved through the available connector. Those original repository assets
are not removed or replaced. Therefore this pass does not claim full-scene visual
acceptance, a completed continuous in-browser walk, or measured target-device FPS.

For a browser check in a normal clone, start the existing static server, open
`fushimi_inari/integrated-world/index.html`, inspect bamboo near/far transitions,
and walk the Kumataka → Yotsutsuji → Sannomine → Ainomine → summit circuit. The
existing [bamboo diagnostic](../fushimi_inari/tests/bamboo-details.html) isolates
the two detail levels for a closer inspection.
