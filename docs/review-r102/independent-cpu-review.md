# R102 independent CPU acceptance

No remaining actionable defect found after the bench support, visible-stele exclusion and basin-seat corrections. Actual combined evidence is `actual-combined.json`; earlier states remain in `before-support-fix.json` and `before-visible-stone-guard.json`. This review used Node/Three geometry and collision code, without a browser or renderer.

## Kumataka benches

The final actual assembly accepts blue node9667109065 and wooden node9667109066. Wooden node9667109067 is withheld because an existing visible stele intersects its volume. Final output is180 triangles in two static batches and two matching box colliders. Source center, material, backrest and capacity follow the mapped records. Azimuth is explicitly inferred from the adjacent shoreline, not observed in a matched photograph: yaw1.10129119, northwest blue backrest and southeast-facing seat.

The first actual audit found all12 leg bottoms40 mm above the final clipped terrain. Raw terrainHeight was66.312874 while rendered support was66.252874. The owner corrected the builder to require terrain triangle positions and use the existing interpolator, with no raw-sampler fallback. The new regression deliberately separates raw/rendered heights and checks stored leg geometry.

The corrected three-candidate audit sampled the viewer's complete clipped terrain chain and found all12 leg bottoms20 mm below actual support rays. After withholding the conflicting bench, the eight remaining legs preserve that contact. Leg supports are66.252874; the blue bench's maximum full-footprint support is66.2529683354, handled without changing its mapped position. Missing triangle/support data withholds furniture.

The visual review exposed a missing authority in the initial collider-only check: inherited visible steles have no corresponding collider at this spot. Exact exported geometry identifies stele4 at bounds[546.856384,65.896523,-140.311539] to[547.354126,67.316521,-139.678436]. Its exact source-frame convex footprint intersects bench9067 by0.1585901 m². The owner now inventories only recognized visible original stele/fox/bib geometry before batching, with actual transformed vertices and height overlap, without moving or deleting either owner. Independent export-derived convex checks confirm blue has no intersection and0.125946 m clearance to the nearest neighboring stele; an AABB alone would falsely suggest a tiny overlap. Bench9066 remains clear. Evidence: `stele-components.json` and `bench-stone-rays.jsonl`.

## Okusha shelter

The2020 source photograph was inspected directly at `outputs/r102-okusha/temizuya-2020.jpg`. It supports a low green gable, open timber posts, white folded paper and rounded basin/catchment. The existing mapped roof/tap registration establishes the owner; dimensions and construction sections beyond the roof plan remain inferred. Only roof1267862163 is built; the other two researched roofs stay unresolved.

Actual assembly.excludesBuilding is true for all three researched roof IDs before the specialized addition; the earlier six-metre-extrusion hypothesis was correctly rejected. Root now conditionally adds the built shelter ID to its existing exclusion rules without authorizing the other two roofs.

The final actual shelter uses assembly.walkHeight, with all four post seats62.559976959, eave64.859976959 and ridge65.279976959. Raw ground is165 mm lower and is unsuitable for this paved owner. Output is1,288 triangles in six batches, four post-cylinder colliders and one basin box. It has open sides and adds no light or runtime update.

The basin initially had a real50 mm gap: its lathe profile began deck+.05 while the catchment top was deck; perimeter rims did not contact its base. The owner lowered only the bottom profile stations to zero. Final merged basin geometry minimum is62.6199760437 versus deck62.6199769592, a0.916 micrometre Float32 difference, confirming physical contact without an invented support.

## Combined scope and wiring

The final two additions total1,468 triangles in eight meshes before normal batching, with seven colliders. Seven nearby public routes were sampled at center and ±0.30 m:2,928 samples with zero increased collision correction. Final collision A/B removes the exact R102 collider tags for baseline and includes all final colliders afterward. This establishes no new obstruction at the sampled route lanes, rather than a claim that every inherited diagnostic line is universally clear.

All59 interaction-object identities remain unchanged. After moving the existing office-pond clip operation before the source snapshot, original geometry/material/world-matrix identities also remain unchanged. The earlier false invariant involved only office-pond geometry updated by its own clip callback, not these R102 builders.

Final integration imports both102-release owners, calls the shelter with walkHeight and the benches with renderedTerrainPositions/water before global batching, and omits Group fields from datasets. The bench sites avoid every clipping footprint; independent final-clipped support rays confirm the same support authority at those sites. Existing terrain, path-height and generic exclusions retain their owners.

Reviewed focused tests: seven bench regressions (including actual-height separation/leg bottoms and recognized visible stone exclusion/preservation) and two shelter tests for actual bounds/contact, basin seating, open sides and adjacent route sweeps. Owning agents report all passing; root owns the release suite and visual acceptance. No production edits were made by this reviewer.
