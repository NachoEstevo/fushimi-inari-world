# R96 small roofed entrance notice structure

## Evidence and interpretation

The pale block in the integrated oblique render was exporter mesh `Mapped context way/1543133162`, with bounds X-149.407…-148.458, Z4.698…6.100 and Y33.744…36.780. The source is `building=roof`, `building:levels=1`; a generic extrusion incorrectly made that open roof into a solid three-metre building.

The probable photo counterpart is the small timber roofed structure behind the left red festival banner in [Townphoto k01111.jpg](https://townphoto.net/kyoto/k01/k01111.jpg), locally `outputs/r96-references/approach-2016.jpg` (roughly pixels X115–213/Y620–800). It stands between the street-side picket fence and dense hedge, west of the tall red lantern. Visible features are a dark pitched/gabled roof with pale edge line, brown timber framing and a pale vertical panel largely occluded by the banner. The [street photograph](https://townphoto.net/kyoto/k01/k01102smal.webp) gives only a small oblique view, insufficient to resolve hidden contents or exact identity.

Correspondence is probable from spatial relationships, not a surveyed identification. The model is deliberately an uninscribed roofed panel supported by two uprights, with open lower space. It does not assert a named shrine, notice text, deity, enclosed room, four-post pedestrian canopy or temporary festival banner.

## Geometry and ownership

The exact source rectangle remains **0.949 × 1.402m**. Roof pitch, frame and panel dimensions are inferred from the occluded photograph. The eave is 2.10m and ridge 2.48m above sampled center ground; the ridge roll peaks around2.50m, below the previous3m envelope. Two timber uprights independently seat to actual sampled ground with buried bases. They support a tie, short gable rafters and ridge strut; the closed thin roof panels physically contact this frame. The pale panel has depth and timber borders, with its bottom70cm above center ground. No floating facade decal or opaque lower box remains.

```js
import {buildOmotesandoNoticeR96} from './omotesando-notice-r96.mjs';
const notice = buildOmotesandoNoticeR96(
  root, features, surfaces, legacy.materials, colliders
);
```

Call **before the frontage hedge builder** so its existing-prop exclusion sees this actual structure's collisions. Add `notice.builtIds` to generic-building exclusion only after successful creation. Returned IDs are `['way/1543133162']`; missing source returns an empty list, and changed semantics/footprint or nonfinite ground fail visibly. Repeated calls reuse the same group without adding duplicate colliders.

Measured budget: **3 static material draws, 300 triangles and 3 fixed collision boxes** (two posts, one raised panel). Every mesh/collision bound is within the mapped roof footprint. There are no textures, lights, labels, animation or dependencies. No shared integration/viewer/export file was changed.

## Verification and remaining review

Four focused tests pass for exact source width/depth and bounded budget, envelope/idempotency, actual terrain seating and raised panel/open lower region, finite geometry, fixed colliders inside the footprint, preserved approach centerline walking, and explicit missing/invalid-source behavior. Owned source/test/documentation diff reviewed.

Root's final shared renderer must inspect roof/panel proportions and relationship to hedge, apartment and lantern. Exact identity, roof orientation, timber-member sizes, panel height and current condition remain uncertain. No new browser, GPU or Blender process was started.
