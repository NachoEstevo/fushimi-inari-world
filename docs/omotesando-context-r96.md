# R96 entrance street interface

The existing R50–95 modules already own the white/timber boundary walls, hedge bases and foliage, mapped neighborhood massing, first-gate bollards, avenue trees, narrow avenue lights, bicycle recess, roadside dry basin/garden and active Temizuya details. Adding those again would duplicate owners. R96 completes four connected layers at the pedestrian-crossing arrival instead.

## Evidence inspected and selected omissions

Actual reference pixels were fetched and inspected from Townphoto's [2016 entrance street](https://townphoto.net/kyoto/k01/k01102smal.webp), [first torii looking uphill](https://townphoto.net/kyoto/k01/k01111.jpg), and [reverse approach view](https://townphoto.net/kyoto/k01/k01112.jpg). The [index](https://townphoto.net/kyoto/fushimiinari.html) explicitly dates this entrance sequence to 2016. The local copies are `outputs/r96-references/entrance-street-2016.webp`, `approach-2016.jpg`, and `approach-sun-2016.jpg`.

1. A fine metal trench grate across the avenue mouth is clearly visible in k01111. Existing R94 gutter geometry was a plain pale strip. R96 adds an 8m flush dark channel, individual narrow metal bars and edge rails at that entrance interface.
2. The street has thin white road-margin lines, visible in k01102 and k01111. R96 adds both bounded sides, interrupted at the zebra crossing; it preserves the existing crossing stripes.
3. The gutter's grate/slot language is reconstructed as four small inset drain covers within the existing gutter footprint. The precise four-cover count and positions are inferred, not individually confirmed from the photograph. No excavated channel or raised curb is introduced.
4. k01102 clearly shows a concrete roadside utility pole, horizontal arms, insulators and overhead street wires. R96 reconstructs one bounded pole assembly with two arms and six insulators. Hardware count, dimensions and placement are inferred. Overhead conductors are omitted because adjacent support registration is absent; no remote poles are invented. Its root is approximately `[-153.4614, 2.3398]`, north of the crossing, outside all mapped route widths and building bounds with clearance.

No photo-supported shop identity is invented. The tan north building in k01111 maps to apartment footprint `way/305214938`. A later R96 reinspection counted upper windows, recessed middle gallery and ground behind the hedge, resolving the apparent two/three-level discrepancy; its separate source-backed replacement is documented in `omotesando-frontage-r96.md`. Temizuya has an existing separate detailed basin/canopy owner; these references do not establish additional garden bounds there.

The requested `outputs/r56/reference-0028.png` and `reference-0043.png` are absent in this checkout, so no fresh video-frame pixel inspection is claimed. R95's existing reconstruction remains intact.

## Integration

```js
import {buildOmotesandoContextR96} from './omotesando-context-r96.mjs';
const omotesandoStreetInterface = buildOmotesandoContextR96(
  root, features, surfaces, legacy.materials, colliders
);
```

Call once after R94 arrival and mapped entrance surfaces exist. The junction frame derives from the shared OSM node `749327076` in road `79699850` and approach `105449722`. The function is idempotent, returns metadata, adds at most **4 static material draws and 1 cylindrical pole collider**, and requires no texture, canvas, light or new dependency. The materials argument maintains the existing builder API but is not consumed.

All overlay vertices independently sample `surfaces.height`; they have only 24–28mm render offsets consistent with the existing R94 stripe overlay (22mm), not fabricated terrain levels. There is no new walking height or walkable surface. The pole roots 12cm below its sampled seat; mapped path/building checks omit it when clearance fails. Its arms are overhead. Wider street conductor reconstruction is held until both adjacent supports can be source-registered.

## Verification and scope

Five focused Node tests pass: real-junction composition/batch bounds/idempotency, every flush vertex on a nonlinear slope with upward normals, collision-free approach/crossing lanes, and utility omission under mapped building conflict, and no unsupported conductor geometry. Adjacent R94/R95 arrival and corridor tests were also rerun. Final owned files were reviewed. A discovered UV mismatch between procedural overlays and cylinder geometry was corrected by consistently dropping unused UV attributes before static material batching.

No browser, GPU, Blender process or renderer was started by this packet owner. Root must inspect crossing/uphill/reverse views in the shared renderer and actual integrated terrain heights before acceptance. This packet does not claim surveyed utility locations, current street conditions, complete nearby facades, exact Temizuya landscape registration or overall entrance fidelity closure.

Review correction: the first implementation contained six short conductor spans with unsupported endpoints and a sag profile that missed the middle insulator tops. Those spans were removed. Only connected pole/crossarm/insulator hardware remains; the dark material batch now contains flush drain slots alone.
