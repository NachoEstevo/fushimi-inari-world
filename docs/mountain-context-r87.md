# R87 — bounded Ainomine roof and facade completion

This is a small corrective pass on the existing Ainomine sanctuary, not a new
mountain compound or a surveyed reconstruction. Okusha, Kumataka and Yotsutsuji
already have dedicated builders and retained site furnishings. Adding another
generic collection around them would duplicate existing work.

## Evidence and canonical geometry

- [Official precinct map](https://inari.jp/trip/map01/) was reopened in this pass.
  It establishes Ainomine's mountain context and the special stone gate.
- [Official Ainomine page](https://inari.jp/en/map/spot_12/) and its
  [224 × 168 photograph](https://inari.jp/en/wp-content/uploads/2016/09/ainomine.jpg)
  were opened; the photograph was visually inspected. Timber roof edges and a
  small central vertical board are visible. Fine joinery and lettering remain
  unresolved. The source photograph is not redistributed or used as a texture.
- Existing [landmark documentation](mountain-landmarks.md),
  [Ainomine geographic record](ainomine-reference.md), and
  [R28 outlook contract](r28-outlooks.md) were reviewed to avoid duplication.
- The two user videos remain research leads; no new timestamp or video-frame
  evidence is claimed by this correction.

`mountain-context-r87.mjs` consumes the existing `buildAinomine` result and its
canonical `plan.roof`; it does not derive placement from material colours or
repeat footprint dimensions. It adds two timber underside sheets 0.065 m below
the existing roof and a restrained vertical timber board in front of the gable.
All dimensions are modelling estimates. The board has no invented inscription.
The existing stone nune torii, paired struts, curtains, roof finish, eave beams,
mapped building, terrain, approaches and colliders are retained.

The addition has **28 triangles, 4 primitives and 2 static material batches**.
It adds no building, collider, light, animation, texture fetch or runtime update.
The lowest added vertex is 2.335 m above the platform. The board projects only
0.065 m beyond the existing front roof plane. Native frame cost is unmeasured.

## Integration contract

```js
import {refineMountainContextR87} from './mountain-context-r87.mjs';
const ainomine = buildAinomine(root, features, surfaces, legacy.materials, colliders);
const mountainContextR87 = refineMountainContextR87(ainomine);
```

Call before static scene merging. The return is `{group, stats}` or `null` for
an absent/unrecognized/already refined shrine. Calling twice adds no duplicates.
Shared integration and viewer files were deliberately not edited by this owner.

## Review passes and evidence

1. Structural/code review replaced a draft colour-based geometry lookup with
   direct consumption of `plan.roof`. This keeps footprint ownership in the
   existing landmark layout.
2. Actual production geometry was exported from Three.js and rendered in Blender
   **5.2.0**, Cycles, 16 samples, 800 × 700. Two views were inspected. Review
   removed redundant fascia because existing eave beams already close that edge,
   and moved the board 0.016 m forward to clear the existing gable plane.
3. The corrected geometry was exported/rendered again. The low angle was
   inspected; no new roof silhouette, route obstruction or floating edge was
   observed. The board is naturally heavily occluded by the existing gate from
   the frontal view. Enlarging it for visibility would distort the small source.

The following are **clay component renders**, not native browser captures. The
export retains actual mesh positions and topology; Blender's default material
shading makes these unsuitable for colour/material acceptance.

| Pose | Before | After |
| --- | --- | --- |
| Front | [before](review-r87-mountain/before-front.png) | [after](review-r87-mountain/after-front.png) |
| Low oblique | [before](review-r87-mountain/before-underside.png) | [after](review-r87-mountain/after-underside.png) |

Fixed camera positions in shrine-local Three.js metres: front `[1,2.6,7]`,
target `[0,1.6,0]`; low oblique `[2.5,1.3,5]`, target `[0,2,0]`; lens 47 mm.
Component height uses a constant test ground only; these renders do not verify
the full geographic scene or source terrain seating.

Seven tests pass across `mountain-context-r87.test.mjs` and
`mountain-landmarks.test.mjs`. They cover finite geometry, roof envelope,
headroom, unchanged original objects/colliders, idempotence, missing-shrine
handling, existing mapped route clearance, approach and torii exclusions.
`git diff --check` passes. Native browser walking, full-scene visual acceptance,
GPU timings, exact inscriptions and measured architectural dimensions remain
unverified. This bounded addition does not establish complete mountain fidelity.
