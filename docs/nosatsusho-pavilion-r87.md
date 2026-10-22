# Nōsatsusho pavilion — R87 second cycle

## Source and ownership

This replaces the architectural representation of **existing mapped `way/305214607`**, named `納札所`; it does not add another building. Registration and exact source records are in [nosatsusho-registration-r87.md](nosatsusho-registration-r87.md).

All five actual reference photographs were inspected from the local research packet:

- [IMG 8445](https://fushimiinari-guide.com/wp-content/uploads/IMG_8445_20210503.jpg): signed identity beside a tree; no dimensional authority.
- [IMG 8455](https://fushimiinari-guide.com/wp-content/uploads/IMG_8455_20210503.jpg): south-facing gable candidate, low gated timber front, dark inner return area, hanging paper and plaque, separate approach torii.
- [IMG 8449](https://fushimiinari-guide.com/wp-content/uploads/IMG_8449_20210503.jpg): green curved roof, exposed timber bays above low paling and enclosed rear-side portion.
- [IMG 8450](https://fushimiinari-guide.com/wp-content/uploads/IMG_8450_20210503.jpg): pale rear wall bounded/crossed by timber, roof frame and open side.
- [IMG 8471](https://fushimiinari-guide.com/wp-content/uploads/IMG_8471_20210503.jpg): pond bank context, insufficient to register another bridge or pavilion feature.

The dated filename is not a verified EXIF date or a statement about current restoration condition. Identity is corroborated; front/rear cardinal registration is inferred from the mapped terminal footway and neighboring Teichoan. No height, post count, pitch or wall thickness is surveyed.

Before this builder was wired, an actual current `integrate()` audit reported `excludesBuilding(way/305214607) === false`, so the viewer would include its generic closed flat-topped shrine extrusion. It found **no collider within 5 m of the indexed pavilion center**. This is recorded in ignored `fushimi_inari/outputs/r87-nosatsusho-build/ownership-before.txt`; it corrects any assumption that the generic context extrusion already supplied a physical gate.

## Geometry and contract

`nosatsusho-pavilion.mjs` exports `nosatsushoFeatureId` and `buildNosatsushoPavilion(root, features, surfaces, materials, colliders)`. The root integration must exclude generic context **only using the successful returned `builtIds`**. Missing/invalid/already-owned features return an empty list. An existing named pavilion returns its record without duplicating geometry or blockers.

The green roof skin uses the exact five-vertex mapped ring, including approach endpoint E. It is triangulated and clipped on a common local grid; all triangles face upward, and projected area matches the source polygon. Smooth production normals cross duplicate grid vertices. The ridge runs along the long north/south building axis. A dark fascia follows the same curved boundary, with approximately 6 cm trim thickness outside the skin. The main roof does not acquire an invented overhang or altered source ring.

One inferred horizontal datum is **49.44221997 m** in the current assembled scene, derived from the maximum of six terrain samples beneath the posts plus 6 cm. Individual stone feet extend below their local samples. The roof is not tilted to follow the source ring's DEM heights. Skin eave/ridge proportions are approximately 2.58/3.94 m above datum; the narrow ridge cap reaches 4.04 m. Wall/post lines are inset 0.40 m from the roof bounds. These are inferred reconstruction dimensions, not measurements of the shrine.

The pavilion has exposed timber framing, genuinely open upper side bays, low side paling and a gated front, a pale rear wall and short enclosed rear-side returns. A dark inner rear finish supplies the photographed shaded front appearance; that finish and 1.35 m return depth remain inferred. The plaque has a plain backing and paper has simplified white silhouettes; readable calligraphy, sculptural emblems, returned objects and furnishings are not invented.

Four new bounded colliders follow the photographed front gate, side barriers and rear wall **inside the existing roof ring**. The endpoint E and outer public branch remain clear. The gated interior is not declared a public passage, and no new walking surface or height sampler is added. Existing colliders are retained. Neighboring `way/305214613` Teichoan, paths, pond, sign/tree placement and approach torii remain under their existing owners. No separate torii was added without a mapped/legacy registration audit.

## Verification and review

The final assembled pavilion reports **4,751 triangles, six static material batches and four colliders**. It introduces no assets, texture downloads, dependency, light, timer or per-frame work.

Seven focused tests pass. They cover exact source ownership/ring/E and idempotence; projected roof area and upward normals; finite, nondegenerate geometry and batch/triangle bounds; unchanged feature/walk samplers; gate stop with clear mapped endpoint/branch; ray-tested open side bays, closed rear and front-visible paper; and a roof-profile regression bounding midpoint sag below 12 cm. The paper regression qualifies the hit's local front Z, so a hit against the rear wall in the same material batch cannot falsely pass it.

Actual current integration was executed with DOM/canvas/image stubs, and production pavilion geometry/custom normals were exported with the current terrain sampler at the viewer's −0.06 m rendering offset. Blender 5.2 EEVEE renders were inspected from south/front, east/long side and north/rear: `fushimi_inari/outputs/r87-nosatsusho-build/front-review.png`, `east-review.png` and `rear-review.png`. Preview corrections removed straight truss chords and frame caps/upper beams that crossed the roof, retained smooth production normals, and softened the initially excessive quadratic sweep to a mostly linear pitch with approximately 10 cm midpoint sag and 6 cm end curl. The documented ridge/eave heights and mapped roof ring remain unchanged. The independent reviewer identified front-paper winding; it was corrected and regression-tested.

After root integration began batching the new owner, the group-only exporter omitted its shared-material stone feet because those meshes moved into the global stone batch. Earlier unbatched renders showed them; final local renders therefore assess pavilion silhouette, aperture and facade geometry rather than proving final support appearance. The production tests retain foundation geometry. Root's combined scene review must include that separate batch.

Native browser walking around the pavilion, final texture/lighting parity, hardware FPS, exact historical dimensions and surveyed restoration accuracy remain unverified by this component pass. No commit was created and shared integration files were not edited by this component owner.
