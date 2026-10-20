# R17 — Entrance, basin and reception

Date: 2026-10-20. Scope: preserve the original scene and add entrance detail; not a survey-complete reconstruction.

## Evidence and interpretation

- User visit photos 2, 3 and 8 guide gilded fittings, floral ornaments and pendant gable decoration. Photos 3 and 8 depict other lower-precinct architecture: their decorative vocabulary is adapted to the inherited Romon roofs, not proof of identical ornaments or dimensions there.
- User photo 7 guides mottled granite, wet edges, moss and two different ladles. Its precise basin location is unverified. The existing Temizuya placement, roof and interaction root remain intact.
- User photo 1 guides the approach's distinction between paving, planted edges and shop fronts. Existing five shop shells and interactions are retained; their compressed placement and historical names have not been surveyed anew.
- [Official precinct map](https://inari.jp/trip/map01/) and local OSM building `way/105449708` identify the Juyosho footprint. Two wings approximate its L shape. Counter spacing, height, signs, furnishings and the particular goshuin window remain inferred.
- [Reception-office photograph, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Reception_office_of_Fushimi_Inari_Grand_Shrine.jpg), photographed by そらみみ on 2019-02-01, CC BY-SA 4.0. Visually inspected for reception architecture. This is a prayer/offering reception pavilion; it does not establish the exact facade of the mapped Juyosho or the goshuin window position. Photo camera coordinates were not used as building coordinates.
- [Tabifun shrine photographs](https://tabifun.com/ja/articles/kyoto_fushimi) and [Temizuya photo article](https://cocc-rg.hatenablog.jp/entry/2022/09/15/073000) provide additional basin/pavilion context.

External photographs are linked as references, not bundled as textures. Personal photos are not copied to the repository. README images are direct screenshots of this viewer.

## Implementation

- Six merged gable ornament assemblies: curved trim, floral fittings and perforated pendants. Original roof geometry stays intact.
- Hollow basin with floor and walls, procedural granite, wet edges, moss, drainage strips, bamboo spout and two ladles. Water uses small shader ripples and an inexpensive approximate environment reflection, not live scene reflections.
- Original Romon shrubs gain bent leaf geometry distributed over their existing surfaces, with a bounded sampling budget and a dark interior. Locations remain unchanged; this does not establish botanical accuracy.
- Existing approach shops gain counters, lattice and display props. A mapped reception building gains two collision volumes and its own checkpoint; the generic OSM shell is excluded to avoid duplication.
- Static additions use the existing batching pipeline. No new dependencies or additional viewer instances.

## Validation

- 52 Node tests passed, including source-viewer preservation, route connectivity, stairs, flight and collision regressions.
- Browser inspection in the existing IAB tab: Romon overview, reception checkpoint/forward and backward movement, Temizuya checkpoint and free-flight close-up. Saved three README captures.
- Final loaded scene has no new console errors. An earlier indexed/non-indexed gable merge error was corrected before the final reload.
- One Temizuya telemetry sample: 178 draw calls, 435,046 triangles, 1,633 geometries, 95 textures at 1205 × 812 and pixel ratio 1. This is a single-view sample, not a frame-time benchmark or evidence of performance on other hardware.

## Remaining gaps

The basin water still reads relatively flat in shade. Romon roof/fronton proportions, side-building silhouettes, shop placement, surrounding gray placeholder buildings and ground transitions need further matching. Reception details are illustrative, not an exact facade reconstruction. No new Street View traversal or measured architectural dimensions were obtained in this pass. The 52 unresolved stair profiles and known Mitsurugi lateral-access collider remain open; this pass does not close them.
