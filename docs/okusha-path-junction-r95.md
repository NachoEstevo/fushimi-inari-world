# R95 — Exact ownership of overlapping Okusha path ribbons

The same fixed-camera integrated render still showed wide black strips after
the court height correction. Actual camera rays through the exported production
triangles identified the root cause rather than treating it as a hole to cover:
mapped ways `301527759` and `301527762` both emitted coplanar stone at the joins.
At arrival pixels `[45,478]`, `[100,479]`, `[640,479]` and `[700,483]`, two distinct
top triangles occupied exactly the same height, 62.534976959228516 m, and the same
stone material. Continuous real terrain exists below. The duplicate sheets can
self-shadow in the diagnostic renderer and compete for depth in WebGL.

`partitionOkushaPathTrianglesR95(vertices, sourceUV?)` partitions only horizontal
coplanar stone triangles inside the existing Okusha court envelope X 237–282,
Z 54–84. Stable original emission order supplies ownership. Each later triangle
subtracts prior same-height triangle footprints. The union remains paved once;
there is no added surface, offset, random platform or deleted public area.
Distinct heights and outside geometry pass through. UVs at new clipped vertices
are barycentric interpolations of the original triangle, preserving mountain
material scale/orientation.

`path-meshes.mjs` calls this after the stone and mountain-paving batches merge.
This placement matters: the historic material boundary at X 255 puts the actual
offending court triangles in `mountainPaving`. Partitioning only `buckets.stone`
would miss the defect. The walking network, widths, grades, terrain and collision
owners remain untouched.

Two tests pass, covering deterministic union area, idempotence, distinct heights,
outside scope, exact UV planes and the actual two mapped path geometries using
the production normal and arrival-clipping functions. Pairwise remaining
triangle-overlap area is zero; both exact black-strip worldpoints retain one
surface. The CPU integration/export was rerun, and registered-camera rays through
the new actual JSON now hit one path face at every listed pixel with unchanged
surface height and colour. Evidence: `outputs/r95-integrated/okusha-ray-probe.mjs`
and `okusha-ray-after.jsonl`. Syntax/diff checks passed.

No Blender/GPU process was started by this owner. The root must render the same
fixed cameras to confirm the visual strips disappear. The prior 8 cm court
height correction addressed a real secondary grade mismatch; it alone did not
resolve the duplicate mapped-path sheets.

Round 4 also partitions the bounded `edge` bucket before its UV/material setup:
actual duplicated raised curb caps at camera pixel `[590,508]` occupied
62.55997848510742 m. The exact cap pair is now a regression; its union stays at
the same raised lip height with zero overlapping area. Registered camera rays
after the new CPU export show one cap there. Separate remaining cross-owner
court/path slivers are addressed by the resolved-network court cut plan, as
documented in the court-surface packet.

Final whole-footprint review also found overlapping earth shoulders where the
two Senbon lanes converge west of the apron. The same bounded same-material
partition now covers the earth bucket. This removed sixteen additional sampled
coplanar duplicates without changing the earth/path union, network or grade.
