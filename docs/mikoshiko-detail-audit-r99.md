# R99 Mikoshiko detail audit and bounded implementation plan

Research/plan only. Inspected actual pixels in both root-supplied photographs,
existing `mikoshiko-precinct.mjs`, its tests and `docs/mikoshiko-r93.md`. No
production edit, renderer, local browser or 3D instance was used.

## Evidence

- `outputs/r99-shinsenjo/mikoshiko-court-2016.jpg`:
  [2016 photograph](https://image.space.rakuten.co.jp/d/strg/ctrl/9/8510ca7752a74472051e7d4b360d3e1c586296e7.77.2.9.2.jpeg).
  Clear high white shutters/hood on short end; long dark door facade with tall
  weathered pilasters, projecting eave framing, dark gutter/downpipe, close
  timber pickets and mineral ground. Low resolution limits hardware detail.
- `outputs/r99-shinsenjo/elevator-court-2021.jpg`:
  [2021 photograph](https://www.goriluckey.com/wp-content/uploads/IMG_5749_20210412.jpg).
  Higher-resolution same building: white paired high shutters with dark iron
  hinges and vertical handle/slit, shallow tiled hood on white brackets; dark
  long-eave gutter and corner downpipe; light entry hood and small timber gate
  at short facade. Source-access sign/arrow is visible; no new doorway function
  or public interior is inferred from its appearance alone.

URLs/hashes are recorded by root in `outputs/r99-shinsenjo/sources.json`.
Dates in these filenames are historical source labels, not verified EXIF or
current-condition evidence. Both views consistently support the main detail
categories below. The 2021 access installation must not be silently projected
back onto a chosen 2016 state.

## What exists already, versus actual gaps

| Category | Existing R93 owner | Source-backed difference |
| --- | --- | --- |
| Building footprint | Exact `way/1287564336`, W8.13046m/D16.04601m, center `[77.8095,11.8945]`, yaw0.0246013 | Preserve ring, datum and orientation contract. Western facade orientation still carries explicit inferred status. |
| White exterior | Closed plaster box, triangular end gables and plain end cornice | Exterior mass/category present. Do not add duplicate walls or generic white infill. |
| Long doors | Four inferred paired dark bays, narrow timber separators, small rectangular metal handles | Present. Photos show stronger exposed weathered posts and overhead members, but bay count/proportions remain inferred. Existing hardware should be refined in place if necessary, not duplicated as new ornaments. |
| High short-end shutters | NONE; short wall is plain | Definite missing paired WHITE shutters with black hinges/handle details. Their protective tiled hood and its two white supports are also absent. |
| Main roof | Two sloping sheets with regular narrow tile-seam beams, eaves and ridge bar | Roof mass already exists. Photo roof has richer ceramic courses/ridge ends, but this audit does not authorize rebuilding roof topology or inferring hidden geometry. |
| Long-eave drainage | NONE | Definite dark continuous external gutter/fascia line and downpipe/corner return visible in both photos. Current roof-edge seam box is not a downpipe or gutter. |
| Door eave framing | One plain long timber lintel and four basic vertical separators | Source has projecting white beam/bracket ends, white overhead soffit framing and substantial weathered upright members. Needs deliberate detail refinement within existing eave/door envelope. |
| Fence | Existing close narrow pale pickets on long west side and BOTH ends, with rails | Fence exists; do not add another. Source has weathered timber, thicker posts and low stone base, but correct offsets/openings need owner-level registration before altering fence footprint. Existing end fence lies on modeled end plane and should not be treated as a measured photo match. |
| Low entrance hood/gate | NONE on plain short end | Visible in 2021, with access-sign context. Withhold opening/porch/gate activation until elevator/entry owner and grade are confirmed by root; cannot safely overlay a public doorway on an unchanged solid wall/collider. |
| Thin horizontal short-wall trace | NONE | Matching line/bent return visible in both photos. Likely utility/conduit category, but close material/section unresolved; low priority, do not engrave it as a proven structural crack. |

## Recommended first implementation lot

Use one bounded detail owner attached to the existing R93 Mikoshiko group. It
must positively require `builtIds` containing1287564336 and the unchanged source
width/depth/orientation before building. No new base, court, roof mass, public
entry, light, dependency, route, terrain sampler or footprint is needed.

1. **High shutter assembly on the photographed short end.** Two shallow WHITE
   leaves, central seam, four dark hinge straps/knuckles and restrained vertical
   dark handle marks. Add its shallow gray tile hood and paired white support
   brackets. Suggested review dimensions, explicitly inferred:1.1–1.3m total
   shutter width,1.0–1.15m height, center around3.45m above existing floor;
   hood width1.7–1.9m, projection0.30–0.40m, top below existing4.55m eave.
   This is exterior relief only, no working/open shutter or interior implied.
2. **Long-west eave drainage.** A dark brown shallow gutter along existing
   long-eave edge plus observed corner elbow/downpipe, retained within the
   existing roof overhang or tight wall plane. Use existing pipe/metal material
   if available, otherwise a restrained existing dark material; no water
   simulation. Approximate gutter section0.08–0.12m and downpipe diameter
   0.07–0.10m are inferred, not measured. Do not place a new ground obstacle
   outside the present building/court enclosure.
3. **White bracket and weathered lintel/pilaster refinement.** Add small beam
   ends/soffit supports ABOVE the four existing dark bays, keeping the same bay
   count. Strengthen existing upright/lintel profiles inside their current
   envelope rather than adding a freestanding arcade. Keep door hardware's
   current owner; any more accurate rounded pull treatment replaces that
   hardware instead of stacking another set on it.

These three source-supported changes address the strongest omissions without
waiting for the larger elevator/bridge or court-grade decision. A small utility
trace can be deferred; the porch/entry/gate is a separate owner/grade task.

## Spatial registration and implementation gate

The current builder's local coordinates use U across width and V along depth.
The long door facade is U=`-width/2`; its existing rail is
U=`-width/2-.86`. White short walls are V=`±depth/2`. Both photos show the same
short-end shutter and visible long door side. Nearby north-court alignment
suggests the photographed end is V=`-depth/2`, but current R93 documentation
explicitly says orientation is inferred rather than camera-surveyed. Before
emitting the shutter, root must corroborate that END SIGN against the accepted
court camera/map registration. It is a one-sign gate, not permission to rotate
or translate the building.

Once end sign is verified, shutter/hood pieces can use local U≈0 and the chosen
V wall plane plus shallow outward offset. That does not change the mapped
building polygon or doors. Side gutter follows the existing long-west roof edge;
its downpipe is source-relative to the photographed end corner. Neither source
justifies a pipe at every corner or shutters on both hidden ends.

Budget target: at most3 additional static material batches, below3k added
triangles, no added public-route colliders. Reuse existing white/gray/dark/timber
palette. Preserve source geometry ownership and arrays; report inferred sizes
and historical source mismatch explicitly.

## Verification plan

- Check footprint, building transform, floor, original route/path samplers and
  source-feature exclusion remain unchanged.
- Inspect actual new triangle bounds against the current wall/overhang envelope;
  no ground element protrudes into the three protected approach/bridge routes.
- Assert idempotence and fail closed when R93 owner/signature is absent or
  photographed short-end sign is not positively supplied.
- Run existing Mikoshiko route and actual-triangle support tests plus focused
  detail geometry/material-budget tests. Do not add an opening test for a
  public doorway that is not being built.
- Root reviews matched 2016/2021 court views before visual acceptance. No test
  run or rendered comparison is claimed by this research-only packet.

Only this document was written; `outputs/r99-mikoshiko/` is reserved for a future
approved source/diff packet and contains no fabricated reference or render.

## Implemented bounded detail packet

The north-end sign was subsequently corroborated by source-view parity and
independent mapped gate/background review. `mikoshiko-details-r99.mjs` implements
the north shutter/hood, west gutter/one north downpipe and bounded existing-bay
framing details. See `mikoshiko-details-r99.md` for API,1,038-triangle/3-batch budget
and ten passing focused+base checks. Root integration/render acceptance remains
separate; entry porch/elevator and fence registration were not activated.
