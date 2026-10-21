# R53 — Mapped approach boundaries

Retrieved 2026-10-21 from the OpenStreetMap API:
https://api.openstreetmap.org/api/0.6/map?bbox=135.7708,34.9666,135.7732,34.9680

The prior Overpass snapshot omitted barriers. Two Overpass hosts failed (406/timeout); the direct map endpoint returned actual barrier ways. `geography/sources/entrance-barriers.json` retains only way IDs, tags and local X/Z geometry. Contributor account metadata and the raw XML are not published. Attribution remains OpenStreetMap contributors / ODbL in the viewer.

Selected white walls: 1133052410, 1133052420, 1133052413, 1133052417. Selected hedges: 1133052411, 1133052412, 1133053711. Source endpoints, returns and gaps are retained; no connecting wall is invented across entrances. Tagged height 1.5 m is retained for 1133052417; other wall heights of 2.1 m and hedge heights of 0.9 m are visual estimates. White upper surfaces, low dark boarding and tile cap vocabulary refer to the visually inspected [2024 approach photograph](https://ameblo.jp/numa0119/entry-12843088966.html); construction details are not surveyed.

The new boundaries follow existing ground rather than creating level podiums. Geometry is instanced by material, with segment collisions. Surrounding trees, buildings and stalls are not certified by this wall dataset and remain separate work.

Shoulder correction: mirrored sides now have upward triangle normals. A spatially binned sampler registers the actual rendered triangle heights with walking; excluded gaps fall back to the previous surface. Local exclusion prefiltering avoids scanning unrelated precinct features during construction.

Visual corrections: the first preview exposed repetitive stair-step wall tops. Sloped prisms replaced flat sections. The second preview exposed coarse terrain berms imprinting waves on wall caps; cap alignment is treated as an inferred straight elevation profile per mapped segment, with independently seated footings. This does not establish real-world wall elevations or correct all surrounding terrain.

Validation: 113 Node tests passed; syntax/diff checks passed. Native walking inspected the side shoulder and confirmed a solid north boundary stops lateral movement (camera remained around X -85.7, Z 3.3 during continued left input). A previous traversal through the mapped gap near X -74 remained open. The implementation uses seven material/geometry batches for four wall and three hedge ways; no FPS benchmark is claimed. Existing README/index/social-preview changes are excluded from this work.

Final native review: continuous wall caps confirmed in outputs/r53/omotesando-boundaries.png; no captured browser warnings or errors. Coarse ground transitions and existing approach trees remain visible fidelity gaps. No measured frame-rate comparison was performed.
