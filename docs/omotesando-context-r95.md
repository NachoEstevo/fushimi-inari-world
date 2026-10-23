# R95 — Omotesando corridor proportions and planted avenue

## Source and correction

Actual pixels of `outputs/r56/reference-0028.png` and `reference-0043.png` from [the user's iqK2tg-TxbY walking video](https://youtu.be/iqK2tg-TxbY?t=28) were inspected again. They show long central granite slabs, smaller cobble sidebands, circular exposed soil wells, branched avenue trees and timber braces on young trees. [Townphoto's 2016 station-facing photograph](https://townphoto.net/kyoto/k01/k01102smal.webp), inspected during R94, establishes the entrance-side road context. [FmRyJ-RtBPg](https://www.youtube.com/watch?v=FmRyJ-RtBPg) was requested online but throttled; no fresh pixel inspection is claimed for that video.

The previous scene treated OSM way105449722's **8m public width as 8m of central slabs**, then added **2.8m cobbles on each side**, producing a 13.6m corridor. That also consumed the space where the video shows avenue trees. R95 retains the mapped 8m traversable network and grade, partitions its appearance into **4.8m slabs plus two 1.6m cobble margins**, and reconstructs the missing tree/well/support ensemble inside those margins. The 4.8m ratio is a photographic estimate, not a surveyed width.

## Four coordinated improvements

1. Continuous central slab ribbon narrowed to its photo-informed proportion. `path-meshes.mjs` emits only ±2.4m, so an old full8m slab layer is not left behind.
2. Both cobble margins are rebuilt inside ±2.4…4m. `omotesando-shoulders.mjs` replaces the old outer2.8m bands; mapped cross-path, building and water clipping remains. Heights follow the exact existing public path surface.
3. Eight branched, broadleaf avenue trees with circular earth wells and pale flush well edges at four paired stations. Species, exact count, station distances and coordinates are explicitly photo-inferred. These are **not** misrepresented as OSM tree nodes. Existing mapped trees retain ownership.
4. Six young-tree support ensembles with three timber braces and a dark trunk tie; trunks and braces have bounded collisions while preserving the tested central passage. An existing authentic kitsune pedestal locally narrows one edge of the4.8m slab strip; full-width clearance is not claimed.

Mapped walls, hedge lines, crossing routes, shop footprints, water and existing tree roots exclude candidates. No shop tenants, shop signs, extra stalls or facade details were invented. Existing canopy, roadside basin, lamps and walls retain their existing geometry.

## Root integration

Import `buildOmotesandoContextR95` from `./omotesando-context-r95.mjs` and call:

```js
const omotesandoContext = buildOmotesandoContextR95(
  root, features, barriers, surfaces, legacy.materials, colliders
);
```

Call after mapped walls/trees/shoulders are installed, using the existing entrance-barriers source object. The materials argument is retained for consistent integration but the tree ensemble owns its six materials. The builder is idempotent. Existing visual owners already consume the shared `omotesandoContextSpecR95`; no separate whole-network width change is required. New material batches:6; new collision cylinders:8. Foliage uses the existing evergreen cutout generator with branched tree structure, rather than solid geometric blobs.

## Verification and unresolved fidelity

- Five focused behavior tests and six adjacent shoulder tests pass. Checks cover public-width partition, actual emitted shoulder bounds/grade, root exclusion, geometry finiteness/idempotency, and open center/±2.1m walking lanes.
- Full real integration CPU harness accepts8 trees, keeps network widths exactly8m, and reports zero centerline collision correction with0.2m sampling. `outputs/r90/r95-omotesando-probe.mjs` is the local reproducible harness.
- Actual rendered slab geometry generated through `buildPathMeshes`:558 vertices; largest lateral distance from the mapped centerline **2.40000069m**, confirming no old8m slab ribbon remains.
- Final owned diff reviewed. No browser/GPU instance was started. Root must inspect the corrected approach from crossing, along both margins, and by Temizuya before accepting tree count, crown shapes, source registration and material transitions.

This does not close the full precinct's fidelity. Modern shop facades, exact avenue root positions, individual species/crown silhouettes and source-registered Temizuya garden extents remain unverified. The change deliberately addresses corridor proportion and the whole visible avenue layer together rather than adding isolated ornaments.

Independent-review correction: earth wells and rims no longer use flat translated instances. Their world-space vertices sample actual `surfaces.height` independently, with1mm soil and3mm flush rim offsets. A nonlinear sloped-surface regression checks every emitted vertex. Authentic kitsune placement is retained; its existing pedestal narrows a slab edge and is excluded from any full4.8m clearance claim.
