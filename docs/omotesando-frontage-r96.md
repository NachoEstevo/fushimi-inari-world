# R96 north entrance apartment frontage

## Source registration and three-storey interpretation

Reinspected actual pixels in [Townphoto k01111.jpg](https://townphoto.net/kyoto/k01/k01111.jpg) (`outputs/r96-references/approach-2016.jpg`) and [k01102smal.webp](https://townphoto.net/kyoto/k01/k01102smal.webp) (`entrance-street-2016.webp`). The first looks east/uphill through the first torii: the long tan building is north/left of the avenue, with its western end immediately beside the street. The street photograph looks north and shows the same tan upper window band behind the first torii's north side.

The source footprint `way/305214938` matches those relationships: X -152.518…-133.844 and Z -3.651…2.104. Its south frontage is 18.655m long, bordering the north side of the Omotesando whose western centerline is around Z10.7. First torii `way/359847609` has its northern mapped endpoint at [-138.652,5.021], immediately south of this frontage and within its east/west span. The western street/avenue junction is [-157.407,10.342], west of both building and torii. This is consistent with both photo headings. The OSM footprint and registration are the authority; appearance dimensions remain estimates.

The earlier two-storey reading counted only the **upper window band** and **recessed middle balcony/window band**. The ground level is largely behind the clipped hedge; k01102 also shows people and entrance activity beneath the middle balcony fascia. Three levels are therefore compatible with the photo, not contradicted by it. R96 preserves the existing mapped three-storey envelope at the existing estimated 3m/storey (9m overall). This is not a survey of floor heights.

## Replacement geometry

The existing `entrance-neighborhood.mjs` has no apartment-specific facade owner: its special cases are Gishikiden and Minami, while this ID receives generic plaster walls and flat cap. The new module replaces that whole generic footprint, not an overlay over its solid shell.

- Tan small-ceramic-tile shell with deterministic real-world-scale tile map and subtle bump, not giant arbitrary blocks.
- Public-facing south and west facades have real 0.64m gallery recesses: separate floor/ceiling slabs, end cheeks, rear middle-level glazing, front solid fascia and pale metal rail. No full-height wall remains behind the recessed band.
- Upper-floor dark window bays sit in openings between actual sill/head panels and vertical returns; glass and framing have depth. Six south bays and two west bays are inferred subdivisions, not individually surveyed opening counts.
- Shallow dark parapet and flat roof remain within the inherited 9m silhouette and source footprint. Hidden north/east walls remain restrained; no hidden room layout or invented shop is added.
- Ground walls seat to actual `surfaces.height` at sub-0.5m intervals, with 7cm buried bases and a shared horizontal storey datum. No terrain, elevated podium or new walking surface is created.

Ownership audit found the existing mapped hedge way/1133052411 begins east of this frontage at X-135.851 and runs to X-127.422; it does not cover the dense row visible in front of this building. R96 therefore adds the missing photo-supported row, detailed below. No speculative doorway, gate, merchandise or tenant sign is added.

## Root integration and ownership

```js
import {buildOmotesandoFrontageR96} from './omotesando-frontage-r96.mjs';
const apartment = buildOmotesandoFrontageR96(
  root, features, surfaces, legacy.materials, colliders
);
// Exclude apartment.builtIds from generic entrance neighborhood input.
```

Build before the generic neighborhood, and remove `apartment.builtIds` from the features passed to that owner. Returned `builtIds` is `['way/305214938']` only after successful creation. The original features object is not mutated. Missing source returns an empty list. Repeated build reuses the existing group and does not add collisions twice.

Budget: **7 static material meshes, 6,426 triangles and 4 full-edge wall colliders plus 3 nominal hedge-run colliders**, one 64px deterministic DataTexture, no external texture dependency, no lights or animation. Wall colliders stay inside the actual shell footprint. Root must exclude the generic owner; otherwise its opaque shell would fill the gallery recess.

## Verification and limits

Six focused tests pass: preserved footprint/9m envelope/material budget/idempotency; true gallery depth and front rail separation; buried terrain seats plus collision-free mapped road/approach centerlines; explicit failure on missing source/nonfinite ground. Existing R94/R95/R96 street tests pass alongside these tests (19 total).

Owned diff reviewed; no browser, Blender, GPU or renderer started. Root's shared crossing/uphill and reverse street renders remain required. Source window counts, ceramic color, balcony depth, precise floor heights and current condition remain inferred. This resolves the previous storey interpretation hold without claiming precise facade measurement.

Collision budget correction: visual ground-toe segmentation remains unchanged, but each straight edge now owns one collider using the minimum of all its sampled buried bases. This replaces 100 adjacent subsection colliders with four full-edge boxes inside the same shell footprint. Regression checks all four source edges, full lengths, buried lower bounds, shared top datum and unchanged road/approach clearance.


## Final source-ground ownership correction

Actual integrated oblique pixels exposed a blank lower wall. The existing mapped hedge is east of the apartment, so this was a missing source-visible layer, not export omission. A clipped photo-inferred hedge now runs within X-151.9 to-136.5, centered around Z3.76 with an inferred height near1.7m. Small leaf sprays cover a narrow dark core, with independently sampled buried terrain seats. Source gaps are inferred around the separate mapped roof footprint way/1543133162 (X-149.407 to-148.458, Z4.698 to6.10), the northern first-torii root, and every supplied existing prop collider; public route widths are excluded. Two foliage batches and three nominal continuous-run colliders (existing prop exclusions can split runs) complement the four building-wall colliders. No already-mapped eastern hedge is duplicated.

The pale standalone block in the integrated image is exactly exporter mesh Mapped context way/1543133162, bounds[-149.406998,33.743904,4.698] to[-148.457993,36.780289,6.10]. Its source is building=roof, building:levels=1; generic export/viewer extrusion turned an open roof into a three-metre solid box. This module preserves its footprint/gap and does not delete it. Root owns correcting that shared context interpretation.
