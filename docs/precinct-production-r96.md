# R96 full route and precinct continuation

User requested substantial continuing work across Omotesando, Romon, Gehaiden, Naihaiden, Tamayama, Okumiya, paired Senbon/Okusha and Yotsutsuji, not a small technical pass. R95 is the checkpoint, not a fidelity-completion claim. Sol6.1 sector owners and two independent verification owners share one canonical scene; root integrates. One CPU Blender renderer at a time; no extra 3D browser instances.

## Work and acceptance matrix

|Sector|Source-supported R96 work|Integrated review|
|---|---|---|
|Omotesando|Threshold drain, street markings/grates, utility assembly, registered three-storey tile apartment facade; retained planted 8m avenue and first-torii crossing spawn|Aerial pavement junction repaired; unsupported wire spans removed; actual spawn collision correction 0; apartment's real recess replaces its generic shell|
|Romon|Both galleries: bracket/capital joinery, stone shoes, joint fittings, gilded gables|Actual geometry closeup reviewed; inherited route records unchanged|
|Gehaiden|Weathered timber stage, dark ceiling/joists, indigo screen borders|Front, side and ceiling reviewed; twelve duplicate legacy lamps removed while real black lanterns remain|
|Naihaiden|Suspended lantern pair, gridded transoms and rolled headers|Front and side reviewed; doorway and existing offerings preserved|
|Honden/Gonden|Side veranda returns, rear rafter ends, gold drainage, net supports; mapped Shinkosui well|Rear and well views reviewed; Shinsenjo's unresolved grade remains explicitly separate|
|Tamayama/Okumiya|North-bank mature canopy/root/understory; photo-registered Byakko red boundary returns|Open main-shrine rear/landing retained; actual terrain seating checked; stair walking lanes clear|
|Senbon/Okusha|Pavilion supports/eaves, physical ema rows, square stone profiles; mapped Omokaru relocation/canopy/boundary|Both tunnel lanes preserved; court and rear passage checked; final actual geometry review recorded below|
|Yotsutsuji|Sitting platforms/tables, drink cabinet, bench covers, bank vegetation|Arrival/aerial reviewed; source-path furniture exclusion tests pass; full city panorama unchanged|

## First integrated review

Ten initial geometry renders exposed two additional coplanar floor conflicts: Omotesando's central slab against a side footway, and a Honden-side junction. These showed that the earlier bounded corrections were insufficient. R96 now partitions shared walking tops with explicit material priority and spatially indexed candidates. Grades, sloped paths, curbs and lower layers remain intact. Diagnostic simplified palettes do not establish native materials or FPS.

Source photos and inferred dimensions are documented per module; no new unmapped buildings may be invented to fill grass. Main Okumiya rear is open gravel in inspected source, while the red enclosure belongs to smaller Byakkosha; its forecourt must stay open. The initial architectural-process ZIP was recovered previously and its installed process remains in use.

## Additional source registration and corrective rounds

The Shinkosui roofed well was identified with named OSM node 11941092061 inside roof 305214828 and an inspected 2016 photograph. Its four-post timber pavilion replaces that exact generic roof extrusion, on the existing stable court, with no new terrain plateau.

Both Omokaru stones were on the wrong side of the hall. Named OSM nodes 2697500339 and 9664306045, canopy 1051656818 and fence 1267860089 establish their actual eastern location. The original interactive orb objects and lift callbacks move with their assemblies and matching colliders; the misplaced old wall, backdrop and stele are removed by exact ownership contracts. The mapped rear-path centerline remains clear for the 0.28m player radius. Full inferred 2m path-width clearance is not asserted.

Root rejected the first Omokaru closeup as visually insufficient. A clearer [frontal photograph](https://cdn.japan-travel-note.com/images/00523/22.jpg), from [the firsthand visit](https://www.japan-travel-note.com/posts/523), establishes square pedestals, open lantern chambers, shallow swept caps, smaller liftstones, packed varied cobbles, timber braces, central sign and offering chest. These were rebuilt within the registered footprint. Two more review findings were corrected: disconnected brace tips now attach to the long eave beams, and steep stone caps now have the reference's lower silhouette while preserving the original interactive stone seat/lift callback.

The apparent apartment storey contradiction was resolved by re-examining both Townphoto entrance views: top windows, recessed middle gallery and ground level behind the hedge are separately visible. A new source-facing south/west facade replaces only way/305214938's generic shell, retaining its exact footprint and existing estimated 9m envelope. Its balcony depth is actual geometry. The source-visible clipped hedge adds two foliage batches, bringing this owner to seven static meshes and 6,426 triangles. Four full-wall colliders and three hedge runs preserve the public approach. Hidden ground-floor shop names, doors and rooms remain unspecified.

The final entrance comparison exposed a second problem: mapped roof way/1543133162 was being extruded as a solid three-metre block. The probable photo counterpart has a small pitched roof, timber frame and pale panel. It now uses that restrained appearance, with two seated uprights and an open lower area, inside the exact mapped footprint. Its identity is unconfirmed; no shrine name, inscription or hidden room was invented. The final preserved-camera entrance pair confirms the block is gone and the new hedge remains beside the approach.

A final Omokaru source comparison replaced the lanterns' thin open columns with compact stone chambers and real small apertures. A subsequent render exposed coincident corner faces; those were rebuilt with disjoint wall ownership and an actual triangle-overlap regression. Original interactive stones and callbacks remain attached to their registered positions.

Actual camera-ray review found two more lower sanctuary apron overlaps near the well after the first shared walking-top correction. They are now partitioned inside their own lower apron owner, retaining material, UVs and elevation. The final well-context image confirms both black patches disappeared. The same review identified twelve obsolete cream Gehaiden lamps below the actual black zodiac fixtures; only their exact 36 legacy parts were removed after the replacement's successful construction.

## Verification and limits

- Full repository command: `node --test --test-concurrency=4 fushimi_inari/integrated-world/*.test.mjs fushimi_inari/geography/*.test.mjs`: **520 passing, 0 failing**.
- Actual CPU assembly reports all R96 builders present, their conditional generic-building exclusions active and Gehaiden cleanup successful.
- All 24 saved route records match R95. Twenty-two have clear sampled centerlines; Gonden–Tamayama and Honden–Okumiya retain their original inspection flags. Exact attribution found only the two dividing rails. A separate audit of both complete connected routes transitions onto either side of those rails, in both directions: zero blocked or invalid samples and maximum vertical step 0.156201m. Gonden requires a 0.186m correction to its audit start outside the building's player-clearance radius. Independent paired Senbon lanes also pass. See [route-inspect-review-r96.md](route-inspect-review-r96.md). These are sampled collision/surface simulations, not native browser walks.
- Starting crossing is [-157.407, 33.664626, 10.342], with zero collision correction. Its markings retain the requested 90-degree orientation. Viewer initialization teleports there after route initialization; no camera restoration overrides it.
- Independent final review checked integration ordering, source-owner mutation guards, interactive identity, collider relocation, UVs and the cache refresh.
- Performance measurements and qualifications are in [performance-review-r96.md](performance-review-r96.md). New builders add static geometry with no new animation loops or PointLights. Browser FPS was not measured.
- Geometry was exported from the actual integrated scene and reviewed through serialized Blender 5.2 CPU renders. Their diagnostic palette omits native Three.js textures, alpha cutouts and custom shaders. The local browser access restriction was respected; native appearance and interaction remain unverified.

Selected renders, exact cameras, audit evidence and source hashes are packaged in [review-r96 — archived](repository-archive.md#historical-review-evidence) (`review-r96/README.md`).

This is a substantial verified checkpoint, **not a claim that all requested sectors are identical to the real site**. Outstanding priorities are Shinsenjo's shared court/terrain boundary, unregistered frontage proportions, remaining exact architectural motifs/materials and native visual verification. [shinsenjo-grade-reconciliation-r96.md](shinsenjo-grade-reconciliation-r96.md) contains the measured conflict and ownership plan. Hidden walls, terrace endpoints and floors must be registered before that compound is activated; grass is not authority for inventing a building or wall.
