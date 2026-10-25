# R75 — Naihaiden facade and source geometry repair

Reference: references/real_photos/11_naihaiden.jpg and https://fushimiinari-guide.com/how-to-worship-main-shrine/ (front DSC_0712_20190331, side DSC_0472_20190331). Photos inspected, not surveyed measurements.

Replaced the inherited straight rope, rectangular paper blocks and floating gold block with a sagging three-ply rope, eleven folded paper strips, tassels, curved white/red fascia, limited recessed soffit bands, floral gold fittings and simplified painted relief. Seven merged material batches, no new lights/colliders. Original roof envelope, stairs, columns and rear Honden connection remain intact.

Offline Blender 5.2 render of the actual Three.js geometry revealed inherited rafters piercing the roof at its corners. Removed only sixteen fully identified source boxes (1,728 triangles); exact retained red geometry is regression checked. Also reduced tube tessellation and confined soffit bands to the central canopy.

## Validation and boundaries

208 Node tests pass, including actual production GLB buffers, guarded removal and idempotence. Diff reviewed. Before/after renders below use the same camera and lighting. They use flat approximate material colours without production textures or browser lighting, so they verify geometry rather than in-game appearance. Browser walk/performance checks remain unverified due previous browser access denial.

This does not complete Naihaiden: the photo's central karahafu is broader/taller, the front worship opening and offering barrier remain simplified, the lantern shapes and carved figurative detail need further work. Existing nine-step flight is authored, not a verified surveyed count. Do not present this as an exact replica.

[Before — archived](repository-archive.md#historical-review-evidence) (`review-r75/before.png`)
[After — archived](repository-archive.md#historical-review-evidence) (`review-r75/after.png`)
