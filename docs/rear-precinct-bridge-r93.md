# R93 — Rear bridge source registration

22 October 2026. Research only; no speculative structure or public route added.

## Exact geographic identity

Local OSM source `fushimi_inari/geography/sources/osm.json` records way `1385037575` as `bridge=yes`, `highway=footway`, `layer=1`, joining:

- west node `12019337585`: latitude 34.9670006, longitude 135.7736; local X84.838/Z15.518;
- east node `12822895652`: latitude 34.9670027, longitude 135.7736979; local X93.769/Z15.284.

It has no material, width, railing, name or access tag. Its west approach `1297255919` is explicitly `foot=yes`, `surface=paving_stones`, `wheelchair=yes`; the bridge itself does not inherit those tags as measured construction facts. Its east approach is `1385037577`. Extracted ground heights 49.71 and 50.66 are terrain samples, not bridge deck elevations.

## New inspected appearance source

The [firsthand wheelchair-route account](https://www.goriluckey.com/archives/20170531_fushimiinaritaisha-wheelchair.html), originally dated 31 May 2017 with a later elevator update, states that an elevator behind Honden became available on 1 April 2020. Its [IMG_5749_20210412 photograph](https://www.goriluckey.com/wp-content/uploads/IMG_5749_20210412.jpg) was opened directly in a dedicated browser tab and its fully loaded pixels inspected.

Observed: a white plaster storehouse with tile roof and a long bank of dark doors, low timber pickets around a mineral court, an open pale timber gate and elevator direction sign to the left of the short facade, and an elevated pale retaining/platform edge with timber guard behind the wooded bank. The roofed vermilion votive enclosure runs beside the gate. These are useful independent context for the Mikoshiko/votive-boundary packet and evidence that modern accessibility construction exists in this precise neighborhood.

**The pictured high platform is not registered to the bridge endpoints.** It cannot yet establish bridge material, deck height, width, railing configuration or the elevator-to-deck connection. Do not infer a decorative stream bridge, and do not assume the whole facade is newly built as part of the elevator.

## Street View attempt and remaining gap

A separate Maps tab was opened at the exact west abutment, then a standard Maps panorama request used viewpoint `34.9670006,135.7736`, heading east. Maps selected panorama `CIHM0ogKEICAgIDqzbDR1AE` at `34.9669783,135.7733783`, approximately 20m west, and displayed **No hay imágenes de Street View disponibles aquí**. Its black panorama supplied no visual evidence. The user's existing Maps tab was not controlled.

Japanese searches for Mikoshiko/bridge and wheelchair/rear-Honden context yielded the elevator source above, plus the already rejected Kaguraden stage bridge and geographically distinct Jikkoku bridge. None establishes the target deck.

Implementation remains source-blocked for this bridge. Preserve `geo-core.isWalkable` and `path-surfaces.mjs` bridge exclusions. A later dedicated owner must provide deck geometry, matching walk-surface height and explicit route-graph connection; no terrain-colored ramp should silently stand in for it. Acceptance requires a source photo or panorama showing the actual endpoint relationship before choosing its dimensions and rails.
