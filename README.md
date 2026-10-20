# Fushimi Inari — preserved scene and geographic integration

Private working repository. The original Blender master, original HTML viewers,
authored texture/model assets, scene specifications and integration sources are
kept together. No public redistribution license is granted for third-party
material. Downloaded reference photographs and local captures are excluded.

Serve `fushimi_inari/` with `python -m http.server 8420 --bind 127.0.0.1`, then open
http://127.0.0.1:8420/integrated-world/index.html.

Original viewers remain in `index.html` and `interactive_viewer/index.html`.
Generate the integrated entry point with
`python fushimi_inari/scripts/build_integrated_viewer.py`.
Run tests with `node --test fushimi_inari/geography/*.test.mjs fushimi_inari/integrated-world/*.test.mjs`.

Geographic data attribution and reconstruction limits are in
`fushimi_inari/geography/manifest.json` and
`fushimi_inari/integrated-world/REFERENCES-R09.md` (and preceding revision notes). OSM-derived data is ODbL;
terrain is derived from GSI Japan. Placement, vegetation, individual torii,
terraces and unresolved stair profiles are not a measured replica.

Backups and generated screenshots stay locally in `fushimi_inari/outputs/`.
The `r03-baseline` tag preserves the integration before the torii correction.

The optional spring ambience includes a credited CC BY-SA 3.0 uguisu recording;
see `fushimi_inari/assets/audio/CREDITS.md`. It was recorded in Kantō, not Inariyama.
