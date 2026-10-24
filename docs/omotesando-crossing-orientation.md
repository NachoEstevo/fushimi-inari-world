# Omotesando crossing orientation

Canonical contract: `docs/keihan-recorded-immersion.md`. Owner: `omotesando-arrival-r94.mjs`; road and walking surfaces retain their existing owners.

## Evidence and diagnosis

The inspected local reference `outputs/r96-references/entrance-street-2016.webp` is the station-facing Townphoto photograph, originally sourced from https://townphoto.net/kyoto/k01/k01102smal.webp. JR Inari is on the left and the first Omotesando torii on the right. Its white bands run parallel to the road and repeat across the road between the two entrances. Opening the original URL through the web tool failed during this review; the local reference pixels were inspected directly. Root owns the current Street View comparison and native scene review.

The existing marking did the reverse: long bands across the road, repeated along it. Its old regression explicitly required that mistaken orientation. The OSM junction anchor remains node 749327076, shared by ways 79699850 and 105449722, in the existing X-east/Y-up/Z-south metre frame.

## Scoped correction

Six bands now repeat along the `across` axis at 0.9 m spacing. Each band spans 0.43 m across the road and 3.6 m along it. Count and dimensions are retained inferred values, not surveyed measurements. The pattern occupies 4.93 m across the 6 m road and 3.6 m along the road, inside the existing 5 m flush curb aperture. Its painted surface stays 0.022 m above the sampled road surface.

No road geometry, gutter, curb, collision, spawn or shared integration changes. Walking support is corrected locally as described below. The marking uses the existing batched surface builder and its slope subdivision. Rotating the bands increases the paint geometry from 12 to 96 triangles because the longer axis is subdivided every 0.5 m; the three draw batches remain unchanged.

## Native review correction: approach pavement over asphalt

`outputs/keihan-recorded-immersion/crosswalk-review.png` confirmed correct orientation but showed the east bands on a pale paving wedge. The approach's last segment ends at the shared road center node, so `path-meshes.mjs` emitted the Omotesando slab ribbon over half the street. The walking-top partition does not include the street bucket. Moving the markings would incorrectly move them away from the mapped junction.

With root's expanded ownership assignment, the Omotesando ribbon is now clipped against the actual Hommachi road segment footprints, including their existing miter offsets. Only those two mapped owners participate. Clipping interpolates original heights and UVs and emits the surviving triangles into the existing Omotesando batch; no covering layer is added. R94 paint samples the road's segment profile instead of the nearest centerline (which can be the sloping approach). The final independent audit found 36 support gaps after this correction: the old nearest-approach walking height remained about 6 cm above the exposed asphalt (example x=-154.85, z=10.46). Preserving that height was therefore incompatible with accurate support. The existing station-approach surface-fix owner now permits lowering only at this mapped junction, within the actual road footprint and its 4.3 m junction disk. It derives the mitered road planes from canonical segments and requires matching actual emitted support triangles; no synthetic floor or overlay is created. Outside the footprint, when support is absent, or for an elevated floor beyond the existing 24 cm correction guard, the original sampler remains authoritative. Collider ownership is unchanged.

## Verification

`node --test fushimi_inari/integrated-world/omotesando-arrival-r94.test.mjs`: 5/5 pass. Regression checks actual emitted vertices for each band's two extents and center spacing, paint height, gutter clearance, curb-aperture clearance, unchanged gutter/curb dimensions and positions, and immutable geographic input. Existing tests retain slope/upward-normal, idempotence, shared-node and invalid-height coverage.

After the native correction, 17/17 tests pass across `omotesando-arrival-r94`, `omotesando-road-ribbon`, `sanctuary-path-junction-r95` and `mitsu-frontage-aprons`. The added production-builder regression inspects the actual emitted Omotesando mesh vertices; geometric regressions establish zero overlap with the road footprint, interpolation of heights/UVs, preserved remote area, no mutation of segment inputs, road-seated paint and preservation of the underlying sampler. A further six surface-fix tests pass, including lowered support at the reported coordinate, road/disk boundary guards, disconnected geography, absent render support and protection of higher floors.

Code diff reviewed; `git diff --check` passes. Native visual acceptance remains with root after reloading the integrated scene; tests alone do not establish the final camera appearance.
