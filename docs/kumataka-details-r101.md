# R101 — Photographed Kumataka entry-pavilion fittings

The registered southwest entry pavilion had a pitched roof, four posts, beams and the retained basin, but lacked the conspicuous fittings visible in [P3600730](https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg). That photograph was inspected directly at `outputs/r97-kumataka-references/P3600730_20190210.jpg`. Its small foreground gable shows timber fascia/framing, a sagging straw rope, pale folded paper and long straw bundles. The full Kumataka/Shin-ike R97–R99 reference documents were read to preserve the distinction between this registered pavilion and the unregistered southern parapet.

`buildKumatakaDetailsR101(root)` runs after the existing R97 registration and before global batching. It requires the mapped Kumataka owner, the exact named southwest entry group, the retained 1.5 × 0.82 × 1.1 m basin contract and the recognized pitched-roof batch. Unknown or repeated contracts return null without partial changes.

The packet adds a front gable tie and central member, narrow roof-edge timber, a ridge support and two short front knee braces. Rope endpoints meet the front tie; the rope sags beneath it and carries two pale folded-paper elements and two groups of long straw strands. Rear-edge timber is restrained completion under the already accepted roof, rather than a claim to a photographed rear elevation.

All new geometry stays inside the accepted 2.2 × 1.8 m roof footprint, between local Y 1.68 and 2.65 m. Placement, timber sections, paper count, rope dimensions and strand spacing are inferred from the photo. The existing owner name is retained; this packet does not independently establish the basin's ritual use. No label, inscription, crest, tool or basin contents are invented. Water, rails, parapet endpoints, terrain, source transforms, colliders and interactions keep their existing owners.

The result is **680 triangles and 75 primitives in three static material batches**: timber, straw and paper. No dependency, texture, light or per-frame update is added. The returned `group` is an in-memory scene object; root should omit it when serializing the accompanying metadata.

Three focused tests pass. They verify the original roof/basin and callback identities, unchanged bay transform, finite geometry and budget, actual straw-bundle ray hits, duplicate invocation and failed-contract isolation. Projected detail bounds are evaluated at the real accepted world bay and have zero positive-area intersection with the full public paving expanded by the 0.28 m player radius. A world-coordinate sanity assertion guards against accidentally transforming the bound twice.

Syntax, whitespace and the scoped final files were reviewed. No integration/viewer edit, renderer, local browser or commit was performed. Root owns combined source-versus-render review and native walking/interaction acceptance; automated bounds do not establish final visual fidelity or surveyed dimensions.
