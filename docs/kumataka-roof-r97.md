# R97 — Continuous swept Kumataka roof and rear closure

Root's final court view showed sky through an apparent rectangular hole beneath the rear roof slope. The actual final export was inspected numerically before changing geometry. A 255-point overhead coverage probe found no missing roof-slope patches. Camera rays through court pixels (600,180) and (620,180) instead passed below the roof and exited its open rear gable. At the first pixel's footprint entry, the roof was 0.24 m above the ray; near the rear exit it remained approximately 0.58 m above it. R67 closed only the front gable, so this was a real missing upper enclosure, not a texture or shadow artifact.

[P3600730](https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg), inspected as pixels, supports a curved metal roof and swept eaves rather than a rigid triangular silhouette. [P3600706](https://fushimiinari-guide.com/wp-content/uploads/P3600706_20190210.jpg) corroborates the dark timber lakeside enclosure. Exact curvature and the hidden rear-gable boarding are inferred completion, not a surveyed or directly photographed rear elevation.

`buildKumatakaRoofR97(root)` runs after successful `buildKumatakaRegistrationR97`, before global batching. It requires that mapped owner, the exact R67 detail group, one roof batch with color `92846c` and metalness 0.22, and the exact timber/dark batches. Unknown or repeated contracts produce no change.

Only the old roof-material batch and timber/dark triangles entirely at or above local Y 3.25 m are replaced. Every original lower timber/altar triangle is preserved exactly; rope, offerings, interaction body, plaque, registered parent, floor, colliders and source footprint retain their owners. No pavilion regeneration or broad material sweep is used.

The replacement keeps the original local X envelope −8.8 to −2.8 m and half-width 3.4 m under the accepted mapped transform. Twenty strips per slope use `3.35 + 0.95(1-t)^1.45 + 0.13t^8`, where `t=abs(z)/3.4`. This reduces the ridge from 4.55 to 4.30 m while producing a concave slope and slightly raised outer edge. Metal top skin, timber underside, matching fascia, economical standing seams and both closed upper gables form a coherent roof assembly. Heights, sections, seam spacing and rear closure remain interpretations.

Three tests pass: the actual final-view rear-gap ray misses the original geometry and hits the repaired enclosure; both slopes have complete overhead coverage and upward top-skin winding; lower details remain byte-for-byte identical; callback identity survives; invalid owners remain untouched. Geometry is finite and idempotent. The replacement has **3,076 triangles in two batches**, removes **1,505 triangles**, and adds **1,571 triangles net**. No dependency, light, texture, collider or animation is added.

Root owns fresh export/render review and native appearance acceptance. This packet used no renderer, browser or commit.
