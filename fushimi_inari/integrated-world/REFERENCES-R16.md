# R16 — user photographs: entrance materials and kanagu

Primary references: eight photographs supplied by Ignacio Estevo on 2026-10-20, under Desktop/Fujimi. Photos are not copied into Git or published.

- photo_1: fine rectangular cobbles beside broad grey slabs; torii black bases and restrained leaf cover.
- photo_2: Romon stair approach, grey granular risers, dark gravel beds, gold lantern fittings and repeated small gold beam details.
- photo_3: copper roof, floral gold bargeboard fittings, red rafters and small gold beam caps.
- photo_4: framed gilded torii plaque and dense overlapping gate corridor.
- photo_5: mottled weathered stone torii, lichen and small red votive gates.
- photo_6: narrow paving strip with earth edges, irregular gate spacing and dense low vegetation. This location is not yet geolocated, so its path width is not applied globally.
- photo_7: water basin with mottled granite, wet darker edges, moss and different ladles. Basin detail remains pending.
- photo_8: grey gravel adjoining narrow-jointed large slabs, extensive floral gold roof/door fittings. Detailed gable reproduction remains pending.

## Additional photographic references found

- [Romon photo collection, Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Romon,_Fushimi_Inari-taisha)
- [Shrine gable, Gavin Li / Unsplash](https://unsplash.com/photos/bMmz0Dh5Q9Y)
- [Main precinct photographic walkthrough, Makitan2](https://4travel.jp/travelogue/11776238)
- [Daytime buildings and surrounding precinct, Annie Fairfax](https://anniewearsit.com/visiting-fushimi-inari-taisha-shrine-in-kyoto-japan/)
- [Kaguraden roof details](https://note.com/yamada_tourist/n/n5c5708b359f0)
- [Romon night illumination](https://www.pakutaso.com/en/20220933252post-42339.html)
- [Day and night precinct photographs](https://journeyrambler.com/kyoto-fushimi-inari-taisha-day-night/)

Search/image results supplement the attached photographs; they do not establish dimensions or a measured layout. No third-party image is packaged as a texture.

## Applied

- Restore grey aggregate rather than the previous uniformly pale courtyard. Distinct procedural slab and cobble textures with narrow joints. Lower-precinct mapped path surfaces use slabs; selected lateral, upward-facing original Romon paving faces use cobbles, with only two contiguous material groups.
- Retain original ground geometry and update walk-surface extraction to include the new paving materials, including multi-material meshes. Collision surfaces use a single raycast material independently of visual groups.
- Add small gilded caps, floral rosettes, plaque corner clasps and lantern mounts to Romon in original source coordinates before geographic placement. One merged geometry, no new shadow casters. Placements/dimensions are inferred from the source structure and photos, not surveyed.
- Gold finish uses softer highlights and a less dark response under the existing lighting. Original authored gold fittings remain.

## Limits

This is a scoped entrance pass, not a complete replica or a full reconstruction of all eight photographs. Roof profiles, side planting, retaining walls, fox statues and the wider ground transitions still differ visibly. No new botanical or archaeological certainty is claimed. Existing 52 height-profile reviews are unchanged.

## Validation

- 52 Node tests pass; module syntax and git diff checks pass.
- Browser: entrance inspected in overview and close orbit; no console errors. Walking check moved from (-7.37,43.30,1.24) to (-3.71,44.72,1.01), following the raised access.
- No new GPU view was opened. Added ornaments use one merged mesh and no shadow casting. A controlled before/after GPU benchmark was not run.
