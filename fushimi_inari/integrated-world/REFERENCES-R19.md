# R19 — Romon separation and west stair boundary

Reference: [Attractions Atlas walking tour](https://www.youtube.com/watch?v=FmRyJ-RtBPg), paused again at 00:30 and approximately 00:54, then returned to the lateral view. The lateral view shows the pavilion in front of the corridor, a retaining wall with planted strips, and a separate broad side staircase with a thin metal handrail. The frontal view confirms that the central stair should remain open. No video frames are redistributed.

## Sourced versus inferred

Local OSM `way/626313854` supplies the western stair alignment, width=4 and handrail=yes. `way/626313865` has handrail=no. Only the western stair receives new rails. Two-sided rail placement, heights and post spacing are inferred.

The Temizuya POI previously placed the inherited roof partly inside the corridor roof. Its mapped coordinate is retained in `mappedTarget`; the integration moves the pavilion forward to Romon-local z=9.1, retaining its lateral offset. This provides 1.9 m clearance between the inherited roof envelopes. It is a model fit informed by the video, not a measured relocation. Basin, roof, props, interaction and collider use the same anchor transform.

Two stone wall runs stop outside the central staircase and western stair corridor. Course dimensions and coping are inferred; the real planting/wall tiers remain more complex.

## Stair correction

The inherited stone podium crossed the western OSM stair, producing a large visible barrier. Only the corridor x=-24.8..-19.7, z=1.2..14.5 is clipped from the integrated stone mesh, interpolating UVs and normals at cuts. The original GLB stays unchanged. The local ground profile joins forecourt zero to the inherited 1.6 m terrace between z=13.8 and z=1.89; these heights are model datums, not measured stair heights. Stair surfaces and handrails sample that same profile.

## Checks and limits

55 Node tests pass, including new regressions for roof separation, wall clearances and the bounded western stair grade. Syntax and diff whitespace checks pass. Browser checks cover front/pavilion views and lateral movement to the west stair. Static detail uses existing batching; no new dependency, extra rendering pass or extra world instance.

Remaining: exact terrace heights and tread count, the full lateral stair landing junction, real two-tier planting, building silhouettes, pine forms and unfinished surrounding buildings. The entrance is improved but is not a complete measured replica. A hardware-wide performance benchmark and a complete walk of all precinct routes were not performed.
