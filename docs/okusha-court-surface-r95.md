# R95 — Okusha court/path datum correction

Historical local exports cited below are now in the verified private archive; see [recovery and original paths](repository-archive.md#historical-local-exports).

The root's actual integrated geometry renders (`outputs/r95-integrated/okusha-
aerial.png` and `okusha-arrival.png`) showed dark strips around the pavilion and
at court/path joins. Both pixels and the exported actual triangle payload were
inspected. Continuous rendered terrain exists underneath those strips: they are
not missing terrain polygons or deliberately black paving. The court owner did,
however, contain a real structural mismatch: its mineral top was datum +0.06 m
and its central ribbon +0.0875 m, while arrival and mapped path surfaces use
datum +0.14 m. This exposes disconnected roadbed/edge faces and shadows.

The replacement preserves the same 38 × 20 m court rectangle at `[259,69]`, yaw
−0.14. Both existing mineral and ribbon surfaces now use +0.14 m. It subtracts
the actual source public-path ribbons (including stone curb envelopes), the
arrival rectangle, and the ribbon from the mineral region before triangulation.
Thus this does not place a second coplanar gravel plane over the mapped paving.
No extra footprint, building, platform, terrain flattening or collider is added.
The pavilion's +0.16 m platform retains a 0.02 m reveal above the court.
The original apron perimeter remains closed down to rendered terrain at −0.06 m;
the top-sheet replacement therefore introduces no floating outside apron edge.

`buildOkushaCourtSurfacesR95(court, features, materials)` replaces the old apron
box and ribbon box inside `buildOkushaCourt`; root requires no new integration
call. Existing material identity and metric 1.5 m UV scale are retained, so the
global floor extractor recognizes these surfaces.

Sixteen tests passed across the new surface tests and adjacent architecture/R95
frontage tests (the shared fixture causes six architecture checks to run twice).
New checks use the real mapped features, verify no intersection with incoming/
outgoing path or arrival cutouts, bounded footprint, disjoint mineral/ribbon
regions, upward normals, finite geometry and a bounded triangle count.
Syntax and final scoped diff checks pass.

The actual full integration CPU probe confirms datum 62.394978 m and mapped-path
tops 62.534978 m. Public outgoing samples `[255.782,58.76487]`,
`[270,61]`, `[273.782,61.393]` remain at walk height 62.534978 m. The arrival sample
`[253,68]` now resolves to 62.559977 m, incorporating the existing global floor
clearance of 0.025 m. Pavilion floor samples remain 62.579977 m (platform +0.16 m
plus that same clearance); foundations/thresholds are therefore not buried.
The 0.025 m clearance is the global walking contract, not a new height offset.

No Blender/native render was started by this owner. Root must re-export and
inspect the same two fixed poses to confirm that the visible dark strips were
fully resolved; the diagnostic evidence establishes the structural mismatch
and correction, not native material or visual acceptance.

Round 3 subsequently isolated a second, primary cause of the wide dark strips:
two mapped public-path sheets overlap at exactly the same height. See
[the path-junction correction](okusha-path-junction-r95.md). The grade correction
alone did not clear the visible strips and is not claimed as their final fix.

Round 4 exact-camera rays identified the last ownership mismatch: raw OSM line
quad clipping did not match the renderer's resampled/mitered path footprints.
The production call now passes the resolved network as the sixth argument to
`buildOkushaCourt`, and the court uses the same `pathOffset` quads at exactly
the public width. It no longer removes an extra 0.13 m curb margin: at junctions
the route owner can omit a covered curb, and removing that nonexistent cap area
left terrain exposed. Raised curb caps remain 0.025 m above the court and need
no coplanar cutout. Float32-degenerate clipped triangles are excluded.

The real formerly overlapping right-plinth point `[258.838210,70.945635]` now
belongs only to mapped stone. The former right-junction gap at common floor
`[257.029339,72.468605]` now belongs to exactly one court face. These are explicit
regression points. Actual exported-camera rays also confirm pixel `[145,465]`
now encounters a court face instead of the low pavilion sidewall behind the gap.
These are geometry results, pending the root's refreshed fixed-camera render.

The exact-quad render then exposed a concave-miter case. A renderer quad can be
concave at a resampled bend; passing it whole to a convex subtraction routine
left a new large overlap triangle. The cut plan now consumes the renderer's two
actual convex fan triangles per quad. Tests cover the newly observed worldpoints
`[257.200921,70.768457]` and `[257.267525,71.267982]`, every court polygon against
every rendered path cut, and a 12,160-point grid across the complete original
38 × 20 m footprint. The plan has exact court-or-path ownership throughout.

An independent **actual exported geometry** grid then found 26 coplanar contacts
between the new floor and the underside of R94 service-building mineral plinths.
A pre-static-merge object hook identified the precise source owner, avoiding a
global visual patch. Those side/rear plinth undersides move from +0.14 to +0.12 m
while their +0.34 m tops, footprints and collisions stay fixed. Tests explicitly
preserve these bounds.

After the final CPU export, the 12,160-point common-plateau geometry grid reports
**zero coplanar overlaps**. Forty-five western samples are not on that exact
plateau because they occupy the real graded Senbon approach; examples resolve
to 62.509907 and 62.517692 m. A separate grid including emitted sloped near-ground
floors (excluding terrain) confirms **zero uncovered samples** over the entire
court footprint. This second coverage probe counts multiple vertically separated
floor/plinth layers, so its multi-hit count is not a coplanar-overlap measure.
Evidence is `okusha-floor-grid.json`, `okusha-all-walking-floor-grid.json`,
`okusha-newtriangle-after.jsonl` and `.tmp/r95-western-owner.log`.

Geometry is frozen pending the root's final fixed-camera visual review. No
Blender/GPU process was launched by this owner.
