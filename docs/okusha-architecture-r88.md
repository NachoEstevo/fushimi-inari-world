# R88 — Okusha open fore-pavilion and rear sanctuary

The existing single hall replacement now becomes a mapped two-stage composition:
an open west worship pavilion and a narrower, taller rear sanctuary to the east.
This implements Packet 1 from [the R87 structural backlog](mountain-next-packets-r87.md).
It does not complete the whole mountain precinct.

## Reference and dimensional authority

The [official Okusha exterior photograph](https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg)
was visually inspected, with context from the [official Okusha page](https://inari.jp/en/map/spot_08/).
It supports an open vermilion column/beam fore-pavilion, low lattice, white
gable/soffit, exposed rafters, hanging rope/paper and a separate rear roof.
The page explains that the rear building was relocated and a worship pavilion
placed in front in 1975. It gives no floor, roof or bay dimensions. The source
photograph is not redistributed or used as a texture.

`way/301527734` supplies the actual eight-corner footprint. Its broad western
rectangle is approximately **7.554 × 7.138 m**; its narrow eastern extension is
approximately **4.059 × 6.884 m**. The builder derives these from the checked-in
polygon, preserving one building identity. This is an OSM mapping contract, not
a measured architectural survey. The point ordering is specific to this outline;
unrecognized outline/legacy contracts fail without partial hall replacement.

The pavilion's platform is 0.16 m above the existing arrival datum; its eave is
3.35 m and ridge 4.80 m. Rear plinth/eave/ridge estimates are 0.60/4.35/6.05 m.
Roof overhang is an estimated 0.24 m. Roof curvature, column spacing, rear doors,
front entry gap, rear/side details and floor separation remain interpretations.
The central 1.92 m gap makes the existing public approach usable without claiming
that this is an exactly surveyed entrance arrangement. No inscriptions, historical
ornaments, new adjacent building or terrain elevation have been invented.

## Ownership and integration

`okusha-details.mjs` remains the court owner. It calls the new site-specific
`buildOkushaArchitecture` from `okusha-architecture.mjs`, then removes recognized
obsolete hall-only roof/base/curtain/plaque/front-panel pieces. The replacement
has an open fore-pavilion, frame, lattice, roof underside and rafters, white
gable infill, rear enclosure and separate roof, plain rear door faces, rope and
folded paper. Existing ema racks, Omokaru objects/callbacks and the candle fitting
remain in their original group; their previous court handling remains active.

The registered legacy hall **mesh object is retained**. It receives the visible
vermilion architecture batch and becomes a child of the new geographic group.
Its existing `userData.interactable` and callback remain the same object. Picking
therefore hits real visible columns/rails/walls; there is no transparent proxy,
detached old mesh or separate unregistered interaction object.

`buildOkushaCourt(root, features, anchor, materials, colliders)` retains its input
API and now returns `{architecture, builtIds}`. `architecture` is the new stats
object or null; `builtIds` contains `way/301527734` after success. No new integration
call is necessary. It still runs before floor extraction/static merging.

The new builder replaces the nearby coarse `okusha_hall` collider with **20**
structure-matched boxes: ten column bases/shafts, six lattice lengths, and four
rear enclosure walls. Public pavilion space is not covered by a giant hall box.
Overhead beams/roofs are above normal walking headroom; the rear enclosure remains
protected. The mapped Senbon exit rectangle at X 246–254 remains outside all new
architecture/collision. Source geography and court grading are unchanged.

The existing interpreted ema row had an independently reproduced exit pinch:
the middle rack at `[257.244764,58.731613]` pushed the player by 0.358813 m
at `[255.782,58.764870]`. Moving the whole row merely moved that obstruction
along the trail, so that draft was rejected. The final court owner retains the
three original rack objects/depth, spreads their local X positions to
`[-4.4,-0.2,6.2]`, and moves visible geometry and colliders together. This creates
a real gap around the mapped route. Rack placement remains interpretive rather
than a claim about historically exact furnishing positions.

## Geometry cost and review evidence

The authored architecture contains **4,520 triangles, 502 primitives merged into
6 material batches**, and 20 physical colliders. These are component counts before
the existing full-scene static merger, not measured GPU draw calls or frame time.
No new light, network texture, runtime update, dependency or transparency is added.

Three actual-geometry review/render loops were completed in **Blender 5.2.0 LTS**,
Cycles, 24 samples, 960 × 720. The first caught missing gable closures: the fore
gable now has photo-supported white infill and the rear gable closes under its
roof instead of exposing an unfinished dark opening. Roof winding was checked
and corrected for both slopes. The second renders were inspected from the front,
rear and eye-level entry. The third repeats those views with the final retained
ema arrangement after the actual integrated route audit exposed its old pinch.

These compare the actual old/new production builders on the same fixture and
geographic rigid transform. The fixture includes the original hall identities,
ema/Omokaru stand-ins, real mapped side-building geometry and court. It omits
full-scene forest, texture maps and detailed legacy fittings. Materials use
approximate diffuse colours; these are **offline component renders**, not native
browser captures, a complete geographic scene or evidence of FPS.

| Fixed pose | Before | After |
| --- | --- | --- |
| Front oblique | [before](review-r88-okusha/before-front.png) | [after](review-r88-okusha/after-front.png) |
| Rear oblique | [before](review-r88-okusha/before-rear.png) | [after](review-r88-okusha/after-rear.png) |
| Eye-level entry | [before](review-r88-okusha/before-entry.png) | [after](review-r88-okusha/after-entry.png) |

Cameras in the canonical local Three.js frame: front `[13,7,18]` toward
`[3.8,2.4,-5]`; rear `[13,8,-22]` toward `[3.8,3,-7]`; entry `[3.8,1.75,8]`
toward `[3.8,2,-5]`, 43 mm lens. Export uses actual production mesh positions,
indices and material colours; it does not redraw architecture independently.

Twelve tests pass across `okusha-architecture.test.mjs`, `okusha-arrival.test.mjs`,
`okusha-court.test.mjs` and `collision.test.mjs`. The new regressions cover real
footprint decomposition, source immutability, finite geometry, source contract
failure, exact interaction identity/picking under geographic rotation, preserved
ema/Omokaru objects, original coarse-collider removal, rear enclosure, clear
arrival, and a three-track public approach using the actual collision engine
with its 0.28 m player radius. Syntax and `git diff --check` pass.

The parent's real whole-assembly Node harness was also run after the final rack
correction. Compared with its saved HEAD baseline, Okusha → Kumataka and
Mitsutsuji → Okusha improve from one blocked sample in each direction to zero;
Senbon → Okusha remains zero. This samples the full actual integration and
walk-height/collision engine, with mocked canvas/texture loading. It proves
sampled centreline clearance, not full-width native walking or visual fidelity.
The focused regression additionally exercises the old failing location and
three adjacent exit tracks at lateral offsets of ±0.7 m.

Native full-scene visual/walking acceptance, production interaction display,
terrain seating across every side, measured roof/interior dimensions, rear
architectural details and GPU cost remain unverified. Parent integration owns
browser QA and release; this owner made no integration/viewer edits or commit.
