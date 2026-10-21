# R32 — Visitors, temizuya and night exploration

Five visitors at the reception now load three external CC0 Quaternius character
models: casual male, casual female and kimono female. Each has its own skeleton
and animation mixer; geometry/material resources are shared between clones.
Idle clips run at offset phases/speeds. These are waiting visitors, not a roaming
crowd. At 85 metres their rendering and animation updates stop. Models load in the
background without blocking entry to the world.

The reception attendant retains the stamp interaction and now has a shorter neck,
smaller nose, separate head and shoulder joints, subtle idle motion and a stamp
gesture. It remains an original stylized model rather than a downloaded character.

Night uses 480 shader points with varied sizes, bright cores, soft additive halos
and mild scintillation. This replaces the initial blurred stars painted on the sky.
One additional draw call is visible only at night. The sky is decorative, not an
astronomically accurate star chart. The personal flashlight follows the camera;
toggle with **L** or **Environment → Personal light**. Shadows are disabled for
this light to avoid an additional shadow-map pass.

Entrance reference: [TABI FUN visit photographs](https://tabifun.com/ja/articles/kyoto_fushimi).
The temizuya photo was inspected visually: bamboo rails, cross-rests, dark lashings,
an instruction placard, stone basin and trimmed hedges behind. Added the rack and
placard within the inherited basin footprint, and adjusted the existing shrub
leaf colors. Dimensions and exact planting species remain unverified. No photos
were imported as textures or redistributed.

External asset sources, adaptations and license: [visitor credits](../fushimi_inari/assets/models/visitors/CREDITS.md).
The newer Universal Base Characters download through itch.io did not complete in
the controlled browser; the integrated assets come from the author's directly
downloadable 2019 pack on OpenGameArt, not that newer pack.

Validation: 81 Node tests pass, including three asset checks for skin weights,
animation channels and a 1 MB per-character size ceiling. Final assets total about
1.18 MB. Reviewed imported figures, updated night sky and flashlight in the same
world tab; verified the water interaction still returns its action result. Browser
logs included unrelated asynchronous message-channel errors; no GLB loading or
shader compilation errors were observed. Full-world FPS and physical mobile GPU
performance were not benchmarked. Local captures are in `outputs/r32` under the
Fushimi project (ignored). Newer, more realistic human models remain a future
upgrade; this pack is deliberately cartoon styled.
