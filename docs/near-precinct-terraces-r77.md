# R77 — Tamayama–Okumiya public terraces

## References inspected

User walking video [iqK2tg-TxbY](https://www.youtube.com/watch?v=iqK2tg-TxbY&t=325s), actually paused in the browser at 05:25, 05:45, 06:05, 06:15 and 06:25. June 2012 Street View was moved around the Tamayama terrace; frames show mineral courts, slab strips, transverse drains, stone stair borders, adjacent small sanctuaries and white rear boundary walls. Local reference captures are in ignored `fushimi_inari/outputs/r77/`.

05:25 establishes stone retaining edges beside the lower broad flight. 06:05 establishes the upper staircase's central brown twin handrail, corroborated by OSM way/626313768 `handrail:center=yes`, width 6 m. 06:15 includes temporary construction machinery; it is not reconstructed as permanent architecture.

## Implementation

- Additional bounded mineral apron surfaces around Tamayama and the upper Okumiya terrace. Exact paths, buildings, water and existing R76 mineral envelopes are excluded. Terrain and walking grades remain unchanged.
- Actual assembled rendered additions: Tamayama 26.44 m² and Okumiya 29.89 m². These are model areas, not surveyed measurements.
- Okumiya's apron begins on the east endpoint of the upper landing, avoiding a disconnected lower slope patch. Cells and individual triangles above 35% slope are omitted: gravel must not coat vertical terrain skirts. This threshold is a rendering guard, not an accessibility claim.
- Rough stone edges along the lower main staircase, clipped at neighbouring paths/buildings. Thickness .48 m and height .55 m are photo-inferred; the geometry is decorative/nonblocking, with no new wall colliders.
- Upper generic lateral rails replaced by one central twin-tube brown assembly. Existing stair grades/counts and lower dividing rail remain. The central assembly has colliders; dimensions are inferred.
- Reused materials and static batching; no dependencies, lights or per-frame animation added.

## Review

226 tests pass. Full actual integration, GLB geometry, production paths and adaptive terrain were exported and reviewed from four offline views. The first review exposed gravel draping over abrupt grade changes; steep regions and the lower slope extension were removed before delivery. Offline materials are simplified and are not proof of final WebGL textures. Browser walking and hardware FPS remain unverified.

Still outstanding: the neighbouring shrine row, continuous white rear wall, red enclosures near the large upper torii, drains and fine terrain transitions. Existing grade irregularities at the Tamayama apron are not claimed fixed. Hidden/occluded extents need additional reference matching before construction. Preserve distinction between confirmed object categories and inferred dimensions.
