# R89 — registered annex retaining embankment

One source-backed structural edge replaces a suspended thin foundation beneath
the Nishimura-tei annex. The existing tea-house shells, forecourt, benches,
lookout and stair geometry remain owned by `yotsutsuji.mjs`. This is not a
reconstruction of the whole annex exterior or the complete mountain precinct.

## Source evidence and registration

Actual pixels were inspected from these photographic sources:

| Source | Evidence | Confidence / limitation |
| --- | --- | --- |
| [17 February 2013 photographer page](https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji11.html), [downhill photograph](https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji12.jpg) | Annex to the left of the descending gate/stair, rough stone embankment under its side, hedge and timber above | High for historical architectural form; dimensions and current state absent |
| [April 2024 visitor report](https://ameblo.jp/sevenforest77/entry-12850106699.html), [opposite uphill arrival photograph](https://stat.ameba.jp/user_images/20240428/13/sevenforest77/12/c8/j/o1080081015431491134.jpg) | Stone bank and hedge on the right climbing the same stair, annex roof/translucent canopy above | Corroborates side and continuing bank; people/vegetation obscure wall extent |
| [Article published February 2025, updated March 2025](https://www.japan-travel-note.com/posts/523), [same downhill angle](https://cdn.japan-travel-note.com/images/00523/26.jpg) | Same annex/stone bank/descending gates relationship, autumn vegetation | Article date is known; photograph capture date/EXIF is not established |
| [February 2024 courtyard visit](https://ameblo.jp/sevenforest77/entry-12842808795.html), [junction-side view](https://stat.ameba.jp/user_images/20240302/16/sevenforest77/8a/8d/j/o1080081015408185106.jpg) | Annex and descending stair edge together with the public forecourt | Confirms context, not retaining height |

The source photographs are not redistributed or used as textures. They support
the existence and side of the retaining structure; they do not supply exact
stone shapes, wall thickness, measured toe levels or construction date.

The matched segment belongs to **annex `way/626313775`, ring edge 5 → 6**:
`[787.155,-208.090] → [795.156,-208.078]` in geographic X/Z metres. Its mapped
length is **8.001 m**. The public west stair `way/1052553397` runs north of it,
from `[783.853,-211.051]` to `[797.017,-212.687]`. Looking downhill west places
the annex on the left; the April 2024 reverse view places its bank on the right.
This matches the two views and mapped side, with medium/high registration
confidence. It is not Okumura-tei `way/626313685` and does not justify wrapping
stonework around the entire annex or changing adjacent stair/temple parcels.

## Canonical structure and ownership

New `yotsutsuji-retaining.mjs` derives a site-specific plan from that exact ring
edge and the existing `ground` function. The builder in `yotsutsuji.mjs` replaces
only that edge's old 0.30 m-thick, constant-midpoint-bottom box. All other
foundations retain their previous implementation. A changed/unrecognized ring
or non-finite ground returns null and keeps the original foundation fallback.

The replacement has a continuous closed backing, terrain-seated sampled lower
edge, modest batter and fitted faceted fieldstone faces. All of its vertices
stay inside the existing mapped annex polygon. The structural face runs from
0.075 m inside the ring at its toe to 0.10 m at the top; the rear backing is
0.75 m inside. The existing facade extends 0.11 m inside its ring, so the top
actually meets its underside. Those thickness/batter values are estimates.

Top remains the accepted annex floor **163.45 m**. The bottom samples the lower
existing terrain at 0.10/0.75 m insets every approximately 0.62 m and extends
0.18 m below it. With the actual integrated ground function, the lowest toe is
**160.334903 m**; this is a scene-ground result, not a surveyed wall elevation.
It removes the old west-end suspended underside without flattening the hill.

The existing building-wall collider keeps its same XZ centre, width, depth and
yaw; only its lower extent reaches this new minimum toe. No new collider,
building, stair, bench, light, animation, fetched texture or dependency is added.
`buildYotsutsuji` retains its input API and returns the new `retainingEdge` stats
alongside its existing fields. Parent integration needs only to refresh its
existing `yotsutsuji.mjs` cache version, not add a new builder call.

## Geometry and review

Actual integrated component geometry: **345 triangles, 291 primitive submissions
merged into 4 material batches, 43 simplified stone faces**. Primitive submissions
include individual triangles before batching. These are component mesh counts,
not full-scene GPU draw calls or measured frame cost. Individual stone outlines,
course rhythm, mortar gaps and colours are modelling interpretations.

Three offline diagnostic render/review loops used Blender **5.2.0 LTS**, Cycles,
24 samples, 960 × 720:

1. Compared actual old/new owner geometry on the actual integrated ground. The
   old box visibly ended above the lower slope; the new backing reaches ground.
2. Independent review identified a horizontal top gap in the initial batter.
   The cap was corrected to overlap the facade underside and a downward-ray
   support regression was added. Stone base offsets break the overly regular
   course alignment seen in the first render.
3. Raised the uphill diagnostic camera because terrain obscured the lower first
   pose, and moved diagnostic illumination to the north-facing wall. Rerendered
   before/after from all three fixed cameras and inspected the final contact/toe.

| Pose | Before | After |
| --- | --- | --- |
| Front/downhill edge | [before](review-r89-yotsu/before-front.png) | [after](review-r89-yotsu/after-front.png) |
| Uphill oblique | [before](review-r89-yotsu/before-uphill.png) | [after](review-r89-yotsu/after-uphill.png) |
| Low downhill oblique | [before](review-r89-yotsu/before-downhill.png) | [after](review-r89-yotsu/after-downhill.png) |

These are actual Three.js owner meshes exported with indices and colours, plus a
patch sampled from the actual integrated ground; geometry was not redrawn in
Blender. Material maps, forest, full stair surface assembly and remaining scene
are omitted. Thus they are offline component evidence, not native browser images
or proof of full-scene photo matching. Cameras use local origin `[791,160,-208]`:
front `[-3,4,-13]` toward `[0,2,0]`, uphill `[8,7,-10]` toward `[0,2.5,0]`, and
downhill `[-9,2,-5]` toward `[0,2,0]`, 43 mm lens.

Six focused/adjacent tests pass across `yotsutsuji-retaining.test.mjs` and
`site-grading.test.mjs`: real edge registration, source immutability, finite
inside-footprint geometry, terrain-seated toe, outside-facing ray hits, actual
facade/top support contact, unchanged accepted forecourt/bench positions,
stair clearance and safe fallback for changed data. Syntax and diff checks pass.

An actual whole-assembly Node audit also reports zero blocked samples in either
direction on Mitsutsuji/Yotsutsuji, Yotsutsuji/Chaya south, Yotsutsuji/Chaya north,
Yotsutsuji/Sannomine and Gozendani/Yotsutsuji. It uses mocked canvas/texture loading
and does not establish native or full-width walking acceptance. Chaya north's
maximum sampled rise remains approximately 0.2418 m; no height change was made
here and that adjacent acceptance issue must not be hidden by the zero-blocker
result. Native visual/walking QA, current measured dimensions, full bank extent,
vegetation, adjoining foundations and exact stone inventory remain unverified.
