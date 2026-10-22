# R88 — Mitsutsuji's two-sided built street

## Registration before geometry

The [firsthand 2021 guide](https://fushimiinari-guide.com/mitamatei/)
explicitly identifies the building **left when climbing** as the shop selling
gifts, and the building on the **right** as the tatami cafe. Two independent
ground views from that page were downloaded temporarily and their actual pixels
inspected:

- [Wide uphill lane, IMG_6659](https://fushimiinari-guide.com/wp-content/uploads/IMG_6659_20210328.jpg): upper timber frontage/balcony on the left; lower dark cafe on the right; timber rafters, pale framed canopy between them; entry/upper torii outside the covered street.
- [Right cafe, IMG_7551](https://fushimiinari-guide.com/wp-content/uploads/IMG_7551_20210328.jpg): open-depth timber bays, low sill, maroon upper hanging cloth, translucent sliding end panels and roof rafters.

The already saved [2019 lane](https://livingkyo.com/wp-content/uploads/2019/07/200_43.png)
was also visually inspected and corroborates the upper left timber balcony and
one-storey right frontage. Source photos are research references, not shipped
textures. Date-specific signs, merchandise and potted plants were not copied.
See also [the independent registration record](mountain-reference-register-r88.md).

| Geographic owner | Registered lane-facing edge X/Z metres | Architecture |
| --- | --- | --- |
| Gift shop `way/301527744` | [562.872,-334.281] → [568.546,-330.218], 6.979m | Two-storey timber frontage, recessed upper balustrade, framed upper glazing, lower shadow recesses |
| Cafe `way/301527777` | [564.678,-329.294] → [575.132,-322.058], 12.714m | One-storey open-depth framed frontage, maroon cloth, framed end glazing, lower sill and rafter eave |

These lie north/left and south/right of the uphill mapped path
`1372838161`, respectively. The cafe's short western edge is **not** its lane
frontage. `301527778` / Kyoya retains its previous generic owner.

## Implementation and ownership

`buildMitsutsujiFrontages(root, features, surfaces, materials, colliders)` in
`mitsutsuji-frontages.mjs` produces the two actual polygon envelopes, source-edge
side/back walls and terrain-seated foundation skirts, separate roof ridges and
the distinct lane facades. The original building polygons own all roof corners;
the balcony is recessed inside the shop footprint. A shallow suspended eave is
the only building overhang toward the route. No ground grading or path surface
is replaced, and no shop interior is made navigable.

The pale cross-lane canopy is now assigned to these verified two facades. Its
longitudinal span is confined to their shared 2.217m map overlap, leaving the
upper stair/torii and junction open. A second geometry review corrected the
first horizontal canopy: its frame now slopes between the two eave datums,
avoiding a floating cafe-side edge. A 7×7 sample grid over the actual walking
surface gives **3.153m minimum headroom** in the integrated geometry audit.
The canopy is omitted if this drops below 2.6m.

`builtIds` contains only successfully built source footprints; root integration
uses it to suppress their old generic shells exactly once. The returned
`excludeGate(candidate)` tests the projected eight corners of the full actual
torii assembly bounds against the photographed covered street. The mountain
builder caches the union of red timber and black kasagi/end-tip geometry for
each thickness, then transforms it by each station's actual yaw and XYZ scale.
Older callers supplying only posts retain a radius+.35m fallback. Root combines
this callback with the existing Ainomine gate
exclusion before emitting inferred repeated gates. Source entry/upper torii
outside this region remain owned by the previous route system.

Floor datums use the maximum of seven terrain samples across each front plus
.16m. Final integrated floors: gift103.387m and cafe102.803m. Building heights
5.55m/3.05m, roof pitch, bay divisions, window dimensions, cloth shape and canopy
extent are photographic estimates. Hidden elevations use restrained dark
boarding. Neither height nor unseen construction is claimed to be surveyed.

## Validation and limits

Six focused tests pass, covering exact identity/edge lengths, finite meshes,
idempotence, malformed/absent-source ownership, invalid-ground failure,
1.7m-wide clear public-lane/stair sampling on four source ways, canopy headroom,
and whole-gate footprint exclusion at the street boundary. A real Three.js
full-scene harness built the packet against current integrated surfaces.

Native review raised a possible upper torii/canopy overlap. The resulting audit
checked the **actual full gate assembly**, including black kasagi end tips:
local X bounds ±2.112567m, Y up to3.450712m, before station scale/yaw. Of27
nearby candidate stations,13 are excluded both before and after adopting exact
visual corners;14 remain. Every remaining gate's complete world bounding box
was tested against all4,442 emitted architecture triangles: **zero potential
intersections**, as well as zero eave/canopy collider-bound intersections.
This conservatively rules out geometry intersection in the current scene;
no extra stations were removed merely because the native perspective looked
close. The audit is `outputs/r88-mitsu/gate-audit.mjs` with saved detailed
`gate-audit.json`. Exact bounds add robustness without changing current stations.

Final addition: **9 static material draws, 4,442 triangles and 116 solid
colliders**. No dependency, texture load, dynamic light or per-frame update is
added. Actual emitted geometry was exported and rendered in Blender5.2;
uphill/downhill and both facade close views were visually inspected after the
sloping-canopy correction. Local diagnostic artifacts are under
`fushimi_inari/outputs/r88-mitsu/`. They isolate the new architecture, so missing
ground/background in those diagnostics is not evidence about the final viewer.

Native integrated viewer appearance, exact photographic dimensions, hidden
elevations, glass/translucency, full last-metre collision outside the sampled
route envelope, and hardware FPS remain unverified. The full mountain itinerary
is not an exact replica, and this packet does not complete Kyoya or distant
Mitsutsuji shrines.
