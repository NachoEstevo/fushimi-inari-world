# Mugi station cat

- Original model: **Cat**, by **byzmod3d**.
- Original author publication: [Low Poly Animal Pack (WIP), OpenGameArt](https://opengameart.org/content/low-poly-animal-pack-wip), published May 12, 2026. The author identifies the cat as complete in the May 14 comment.
- Downloaded directly from the author's attached [cat_news_0.blend](https://opengameart.org/sites/default/files/cat_news_0.blend) on October 28, 2026.
- License: **CC0 1.0 Universal**, explicitly stated in the publication and attribution notice. [Public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
- Original source SHA-256: `f105013b2fc013dd950510e3dcba6e21b3cc6643bd3c987f7bc550e6b210bc69`.

Local adaptation preserves the author's coat geometry and palette in one vertex-color material, with muted gray/pink inner ears. Lower-leg proportions are shortened with a continuous height transform and matching normals, giving the original long-legged pose a more grounded domestic-cat silhouette. The cat faces -Z, has a 0.50 m nose-to-tail bind footprint and is approximately 0.338 m tall. Paw soles retain one support plane. No image textures or lights were added.

The source contains no skeleton or animation clips. The local adaptation adds a 26-joint skin, one blink morph target and four authored clips: breathing/weight settling, a brief paw stretch, sniffing the offered hand, and relaxed petting with small alternating paw presses. Paw inverse kinematics are baked offline so the runtime only blends clips. The tail now belongs to the pelvis rather than the old combined head mesh. A separate gaze joint keeps camera tracking independent of animation blending.

`Mugi.glb`: 360,060 bytes; `Mugi.glb.gz`: 102,090 bytes, deterministic lossless gzip transport. 3,772 triangles, one skinned mesh primitive, one material, zero image textures. GLB SHA-256: `6f3d9c119c51d2794b0f62a9a6f7f2e5f6d32dd52b813802afbbd86a51afa90b`.

The local adaptation is also dedicated to the public domain under CC0 1.0.
