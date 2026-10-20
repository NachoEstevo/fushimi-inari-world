# R28 — Outlook access and bounded urban detail

- Preserve the accepted Yotsutsuji forecourt, previous benches and all original
  architecture. Add one west-facing timber seat with a backrest, stone supports,
  collision and a small planted margin. Placement is interpretive.
- Expose Kojingamine and the western trail outlook in Checkpoints. Use existing
  OSM POIs `node/749327432` and `node/9673171303`, and their nearest connected
  walkable trail nodes. No new hillside flattening or fabricated path links.
- The [official Kojingamine description](https://inari.jp/sp/map/spot_17/)
  identifies a view toward central/northern Kyoto behind Tanaka-sha. The western
  trail outlook remains descriptively labelled rather than assigned a new name.
- Lazy city facade overlay uses the existing OSM outlines and the same building
  height calculation as the base scene. Muted window rhythm and colour variation
  are inferred, not surveyed facades. At most 1,800 lowland buildings; one small
  repeating texture/material, spatial chunks and no additional shadow passes.
- Activate within 135 m of the outlooks, retain until 180 m, require camera
  elevation 115–340 m and the Buildings setting. Outside this area the detail
  group submits no draw calls. Buffers remain resident after first activation.
  `data-panorama-detail` reports activation, building and triangle counts.

## Validation and limitations

75 automated tests pass, including real-map connectivity for both new outlooks
and activation/hysteresis/disabled-setting regressions. Syntax and diff checks
pass. Existing server restored on localhost:8420 after the PC restart.

Native visual/walking QA and GPU timings remain pending: browser access to the
restored error-page tab was rejected by the browser security policy. The user
must reload that tab before native review can resume. These additions do not
establish exact skyline fidelity, surveyed lookout dimensions or measured FPS.
