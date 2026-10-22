# R87 Temizuya lateral boundary recovery

## Evidence and ownership

Inspected the actual saved frames `fushimi_inari/outputs/r56/reference-0028.png`
and `reference-0043.png` from [the supplied walking video](https://youtu.be/iqK2tg-TxbY?t=11).
The white plaster boundaries, restrained dark base treatment, clipped hedge
strips and mineral paving are visible. These views do not register additional
houses, root coordinates or a broad lawn. Existing R52–R63 modules already own
the long Omotesando wall, hedges, shops, small shrine court and approach lights.
Those were not duplicated.

The compact OSM source `geography/sources/entrance-barriers.json` contains two
previously unbuilt wall ways, both explicitly tagged white/concrete/solid:

| Source | Exact source endpoints X/Z metres | Implementation |
| --- | --- | --- |
| 1133052419 | [-16.922,22.264] to [-16.284,35.444] | Terrain-seated lateral wall, first short section excluded at mapped footprint |
| 1133052421 | [-14.979,6.145] to [-14.459,14.739] | Terrain-seated lateral wall |

Source positions and the intervening open gap remain authoritative. Height
1.65m, white-body thickness .28m, stone toe, narrow trim and shallow dark coping
are restrained estimates using the existing precinct vocabulary. They are not
surveyed or claimed to be photo-matched elevations. No speculative openings,
shops, grass, decorative plant rows or tree roots were introduced.

## Integration

`buildApproachContextR87(root, features, entranceBarriers, surfaces,
legacy.materials, colliders)` from `approach-context-r87.mjs`, after entrance
surface/collider construction. Parent integration owns that call. The builder
is idempotent and only consumes the two explicit source IDs. Existing wall
owners, mapped buildings/water and full mapped public-route widths suppress
conflicting sections. No existing owner is removed or edited.

## Verification and limits

Five dedicated Node tests pass: source endpoint/gap registration, finite
terrain-following transforms, public-route and prior-boundary exclusions,
idempotence and invalid-ground failure. A real Three.js full-scene Node harness
ran with the current integrated surface and collider data. Final result:
34 wall sections, 4 static material batches, 1,632 triangles, 34 colliders;
one 0.63m source-start section omitted to respect a neighbouring mapped
footprint. No route or existing-wall conflicts were found. No dependency,
texture request, runtime light or per-frame update is added.

Two actual-geometry diagnostic renders were generated in Blender 5.2 and
visually inspected (`outputs/r87-approach/lateral-review.png` and
`upper-review.png`). These show the two clean separate wall strips and intact
gap; they are isolated geometry views, not a full viewer or material review.
The Node texture stubs emit existing GLTF texture warnings; they do not validate
browser texture loading. Full-scene native walking, current photographic
elevation registration and an FPS comparison remain unverified. General
neighbourhood/landscape completion is not claimed.
