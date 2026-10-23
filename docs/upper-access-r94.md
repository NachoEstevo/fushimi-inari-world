# R94 upper Okumiya onward wooded pocket

## Ownership and source

`upper-access-r94.mjs` owns only a small wooded pocket east of mapped northbound
`way/105449724` and south of onward `way/260121354`, behind the upper gate.
It does not replace the existing Tamayama south bank, main Okumiya stair,
stone balustrade, gates, upper shrine, mineral court or public walking profiles.
Those already have independent owners. The R90–R93 reference/review documents
were read to preserve the distinction between the lower southern continuation
and the eastward Okumiya side visit.

Re-inspected actual saved source pixels
`fushimi_inari/outputs/r77/video-0625.png`: upper gate between Okumiya on the
left and roofed lantern on the right; mature leafy woodland filters the
background beyond the gate. This supports a bounded wooded background and
low growth rather than empty lawn, a fabricated building, or another stair.
The image is a historical paused capture of
[iqK2tg-TxbY at 06:25](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=385s),
not fresh playback. The existing R91 reference packet independently records
upper stair photo `IMG_6891_20210308.jpg`; a fresh web fetch of that image timed
out, so it is corroborating historical evidence only. The
[Okumiya guide](https://fushimiinari-guide.com/okumiya/) was refreshed and
confirms Tamayama right turn, further stairs, Okumiya and onward Senbon route.
No new playback of `zFKeYi0AK0M` is claimed.

Three explicit inferred root stations are `[124.5,-6.8]`, `[130,-7.8]`,
`[135,-7.4]`. They are a conservative bounded foliage envelope, not a surveyed
tree inventory, exact botanical identities, or extracted camera coordinates.
Trunk heights 7.4–8.3 m and branch envelopes are photographic estimates.

## Two construction/check passes

First pass established three static mature broadleaf trees plus irregular low
growth, using the existing leaf cutout material, existing timber material and
actual rendered terrain triangle sampler. Existing cylinder/box solids suppress
duplicate trunks; low foliage is filtered around prior solids. Missing rendered
support safely skips a pocket instead of falling back to a differently sampled
DEM. Root toes are buried 9 cm beneath the rendered plane.

Second pass independently checked actual foliage vertices against public route
widths and conservative mapped-building envelopes plus 1.25 m roof overhang and
0.16 m clearance. Filtering acts on all four actual leaf corners before geometry
emission, including high crowns. Authoritative `surfaces.segments` widths take
precedence over source widths. Construction caches only nearby route segments
and roof envelopes; this reduced the focused suite from about 70 seconds to
0.45 seconds without changing emitted fixture geometry. No runtime update loop,
light, new texture asset, dependency, terrain modification or walking-height
override is introduced.

## API and handoff

`buildUpperAccessR94(root,features,surfaces,materials,colliders,{terrainPositions})`
returns `{built,trees,growth,skipped,triangles,drawBatches,newColliders,...}`.
Pass the final **rendered** terrain positions, final walking `surfaces.segments`,
and existing populated colliders after their owners have built. Existing forest
trunks must be registered first so this bounded layer does not duplicate them.
At most three new cylinder colliders are emitted, outside public envelopes.
Repeated calls are idempotent. No integration/viewer/global terrain files edited.

Synthetic sloping-support fixture using real mapped features: 5,482 triangles,
two static batches, three trees, 960 low foliage cards, three colliders. These
are fixture counts; integration may skip trees under existing forest ownership.
Five focused tests pass: triangle seating/static budget/source immutability;
actual foliage vertex path/roof clearance; existing-owner suppression; missing
and partial support; authoritative widened walking-segment exclusion.

Root owns native visual review and integration. No 3D browser/GPU was opened.
Actual assembled terrain contact, source-camera silhouette, crown/roof fit,
complete walking collision audit, night view and performance remain unverified.
This is a bounded candidate packet, not full Tamayama–Senbon acceptance.
