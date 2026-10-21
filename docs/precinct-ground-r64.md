# R64 — Entrance to Okumiya ground treatment

User-requested green grass/moss appearance around Omotesando, Honden, Gonden
and Okumiya. This is an aesthetic treatment, not a surveyed lawn map or a claim
that all these parcels are grass in reality.

## Implementation

- Reuses the terrain mesh and spatial chunks; no added meshes, textures or draw calls.
- Adds one float vertex attribute and bounded procedural grass pigment to the terrain shader.
- Spatially indexed exclusions preserve mapped buildings, water, full path widths,
  parking and dated brownfield polygons. Existing courtyard and entrance gravel
  shader layers remain higher priority.
- Soft boundaries, two patch scales and fine grain reduce the repeated brown
  leaf-litter appearance. Steep banks retain exposed ground.
- Removes a broad rectangular central-court exclusion that left artificial dirt
  margins near Honden; the existing rotated gravel shader owns that boundary.

## Validation

- 137 Node tests pass, including footprint, road-width, parking, water, distant
  terrain and steep-bank exclusions.
- Native browser review of the entrance, Honden/Gonden and Okumiya; short walking
  checks at Honden and Okumiya. No browser warning/error logs observed.
- Local captures: `fushimi_inari/outputs/r64/okumiya-green.png` and
  `fushimi_inari/outputs/r64/honden-gonden-green.png` (ignored output artifacts).
- Reviewed scoped diff; unrelated README, HTML and social assets preserved.

## Remaining limits

Existing elevated path edges, simplified shrine surroundings and unsupported
platform transitions are still visible. This change does not alter collision,
terrain height or architecture. No quantified GPU timing claim: shader work
increases slightly despite unchanged geometry and draw-call count. Exact real
planting boundaries and seasonal turf variations remain unverified.
