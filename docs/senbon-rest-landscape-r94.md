# R94 — Bounded wooded backdrop behind Okusha

The inspected user court stills (`69a82189-e4d8-4f21-819a-b70a07ddd2dd`
and `3ee9aa06-bb02-4d7f-a72c-25c4ed08842b`) show broadleaf crowns immediately
behind the worship pavilion and grey service roof. The forest owner places
random broadleaf forest but excludes every anchor's radius plus 2 m;
`byId.okusha.radius=22` therefore creates a 24 m exclusion around the court.
This conflicts with a close rear wooded backdrop even though the public court
itself should remain open. The packet supplements only a bounded rear bank.

`buildSenbonRestLandscape(root, features, ground, pathDistance, materials,
colliders)` must run after `extendForest` so physical existing stems win.
It returns counts, or null when already applied. It does not modify integration;
root owns insertion and native review.

Twelve deterministic candidate stems sit east of the pavilion or south behind
the service buildings. Individual positions and tree heights are inferred,
not surveyed. Every candidate is filtered by the actual mapped building AABBs
with a 3 m margin, the actual path-distance query (minimum 5 m), finite real
ground height, and 4.8 m separation from existing tree/trunk cylinder roots and
previously accepted new stems. There is no new court paving, bank geometry,
retaining wall or invented building. The twin portals lie to the west and are
outside the bounded candidate region. Unknown path distance fails closed.

Each surviving stem uses `ground(x,z)` and has one matching trunk collider.
The crown uses five overlapping instances of `evergreenCanopy(192)` and the
existing shared `leafClusterMaterial` with its cutout texture and alpha test.
There are no polyhedral ball crowns, additional network textures, new lights or
runtime updates. Two instanced batches cover the whole packet, at most 12
stems / 60 crown clusters / 24,000 leaf-and-twig triangles. Actual counts depend
on existing forest ownership and exclusions.

Two Node tests pass against the real mapped buildings: root deduplication,
route exclusion, terrain seating, finite matrices, textured cutout material,
collider preservation and duplicate invocation. Syntax and scoped diff review
were performed. Native visual review, full route walks and whole-scene measured
GPU cost remain unverified; root reported browser policy blocking native review.
No visual acceptance claim or commit is made.
