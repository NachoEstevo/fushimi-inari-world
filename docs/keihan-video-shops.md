# Keihan video commerce revision

Reference: user-supplied https://www.youtube.com/watch?v=K0UC5GkHbaU&t=35s. Root revisited native player frames0:51 (dense souvenir racks/fox masks/fans/textiles),1:16/1:21 (Urasando entrance soft-serve model, shaved-ice banner, balconies and signs),1:26 (cloth-draped food table, trays, menu cards, metal cooking equipment). Retained0:44/1:04/1:14/1:24 references add context. Video is edited: adjacency and exact parcel attribution are inferred unless matched against existing geographic records.

Contract: metres, X east/Y up/Z south; preserve mapped footprints, source identities, terrain, walking surfaces, route continuity, collision ownership and audio. Three.js existing runtime. No invented named business/price claims. Reconstruct observed forms with original procedural artwork, not copied video pixels. Distinguish video-era open shops from prior shuttered Street View; avoid silently layering products over closed shutters.

Scope owners: west storefront builder; Urasando facade builder; separate bounded merchandise/detail module after final walking floor; root viewer/integration. Four review angles: station street, food counter, Urasando entrance, inner merchant lane. Root owns browser. Initial native review plus maximum3 corrections. No new dependencies, point lights, runtime texture updates or per-product Mesh trees. Target added decorative geometry below15k triangles, at most20 visible batches; distance-register close details and measure actual deltas. Tests: provenance/identity guards, footprint/route clearance, idempotence, budgets; actual-assembly route audit and native visual/performance snapshots.

## Validation

Final scope adds 8,396 triangles and 10 material batches (+2 static textures): west facades +2,304/+1; Urasando +1,572/+0; merchandise 4,520/9. Four merchandise groups register with the existing spatial render activation at 28 m, 8 m hysteresis; geometry stays resident. No new per-frame updates, lights or colliders. Existing 48 west and 181 Urasando colliders retained.

786 tests pass (unrelated pending R103 excluded). Actual assembled floors, both walking directions and three lanes: 66,468 samples across Keihan/Urasando, Keihan/Omotesando, JR and automatic egress; all failure lists empty. Root reviewed the diff and native west/food/entry/product views. Corrections: cache-consistent imports, outward canopy slope, high-contrast mask pigment ahead of the convex surface.

Native transient draw-call samples before/after: west 814/839, food 483/479, entry 1719/1726. These include moving NPCs and are observations, not a controlled FPS benchmark or evidence of faster performance. Existing world load time and frame pacing are not improved or certified by this scope. Exact product inventory and edited-video parcel attribution remain inferred.

Controlled CPU frustum inventory (GLTF loads settled equally): west 660 to 661 draws; food 329 to 330; entry 1543 to 1550; inner east-facing lane 1528 unchanged. Global mesh inventory confirms the scoped +8,396 triangles/+10 meshes; no frame-rate inference. Final native revision3 shows readable mask eyes/paint and corrected canopy seating; no new error after the earlier revision1 cache issue.
