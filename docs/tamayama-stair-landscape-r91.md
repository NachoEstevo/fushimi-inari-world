# R91 — Tamayama south stair bank continuity

## Source and boundary

Reinspected actual June 2012 Google Street View pano
`MvihcVb0f466FBJebqyECg`, recorded in
`outputs/r90-tamayama/streetview-south-180.png` and
`streetview-west-270.png`. Both show irregular dense broadleaf growth behind
and above the low stake fence on the south bank of the western stair.
R90's isolated high crowns left that bank too open beneath the canopy.

The existing `tamayama-stair-landscape.mjs` remains the sole package owner.
The same three inferred mature roots, trunk dimensions, fence, landmark lantern
and all 64 colliders are retained. Crown sprays have greater overlapping
coverage. Four irregular low/middle branch masses fill between and behind those
roots, bounded to the registered bank. These are an estimated foliage envelope,
not four claimed plants or mapped botanical identities. No ornamental hedge,
extra trunk, random tree distribution or seasonal red foliage was introduced.

## Geometry and clearance

All foliage reuses the existing procedural alpha-cutout leaf material and its
one merged material batch. Total package: 16,284 triangles versus 8,224 before
(+8,060), six batches and 64 colliders unchanged. No update loop or new texture.
Nearby route and building candidates are cached once for sample clearance.
Low foliage centers retain 0.88 m clearance beyond source route/building edges;
the regression independently checks actual low leaf vertices against every
mapped route, including the broadened 4.8 m main stair. Canonical feature arrays,
terrain, stairs and public surface heights are unchanged.

## Review

Five tests pass: source alignment and solid clearance, finite geometry/source
immutability, previous-owner duplicate avoidance, idempotence/missing-source
handoff, and the new actual lower-layer vertex/public-route regression.

Actual geometry exports and fixed-camera before/after views are saved in
`outputs/r91-tamayama/`: `before/after-downstairs-review.png`,
`before/after-upstairs-review.png`, and `before/after-bank-review.png`.
Inspected the downstairs comparison and all three after views: the lower
canopy gap is reduced while the fence, stairs and lantern remain legible.
The diagnostic Blender exporter does not reproduce the native cutout texture;
its angular opaque cards are not evidence of the native leaf silhouette.
Native integrated material/view acceptance is required separately. Distant
forest beyond this bounded bank remains owned by the existing broader forest
system; this change does not claim a full reconstruction of that background.


## Second pass from native pixels

The first native west capture (`outputs/r91-tamayama/native-west.jpg`) confirmed
correct alpha textures but insufficient coverage: the registered low growth
volumes were present while the shrine wall remained legible through sparse
sprays. Comparing against the source west view identified distribution and
coverage, rather than missing bank footprint, as the bounded correction.

The second pass retains exactly the same branch volumes and root positions.
Mature branches use 180 overlapping sprays instead of 110; each lower mass uses
640 instead of 320. Spray half-width is 0.48–0.70 m. The native texture cuts each
spray into multiple small leaves; these are not solid blocking panels. Low
sample clearance increases to 0.88 m to accommodate the larger sprays. All five
tests still pass, including actual leaf vertices beyond every source walking
envelope. Final actual package count is 16,284 triangles, six batches, 64
colliders. The three after geometry views were rendered again and inspected;
path, fence and lantern retain their clear spatial relationship. Second native
capture remains the acceptance gate for the actual cutout coverage.
