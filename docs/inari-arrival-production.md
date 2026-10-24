# JR Inari arrival production

Baseline: `2177145`, shared local checkout. The unrelated social metadata, legacy EOL change and unintegrated R103 packet remain outside this change.

## Spatial and sequence contract

- Metres; existing projected Three.js world, Y up, X east, Z south. The station specification owns rail and building frames separately. Live mapped station/platform footprints and the JR West station plan take precedence over the old generic station.
- Travel from Kyoto toward Uji/Nara, platform 2. The platform-2 side gives access to the east station exit without crossing the tracks. Building and platform heights are estimated, not surveyed.
- Begin inside a moving carriage facing its east door; decelerate, stop, open, automatically step onto the platform, close behind the player, then hand over walking. The 16-second timeline has explicit cancellation, skip, replay and reduced-motion behavior.
- The public route joins the existing Omotesando crossing and keeps its original checkpoint as a direct jump. New surfaces own only their actual station/forecourt footprints; terrain is not accepted as a substitute for paving.
- Menu, photo mode and hidden-tab state pause the arrival. Navigation cancels it before another mode takes the camera. Animated train descendants stay outside static geometry batching.

## Ownership and acceptance

Station owner: `inari-station-arrival-spec.mjs`, `inari-station-arrival.mjs`, station evidence and tests. Route owner: station route/frontages and source registration. Sequence owner: pure timeline, camera handoff adapter and behavioral tests. Root owns integration, viewer/UI, release review and serialized renders. Independent reviewer owns only its review report.

1. Verify official platform/direction and photo/map registration; freeze canonical frames and access interfaces.
2. Implement the continuous train/platform/gates/street/Omotesando route; test real collision and height sampling in both directions.
3. Add observed architectural equipment and supported frontages. Record missing or unregistered shops/food stalls instead of inventing them.
4. Inspect actual geometry from train door, platform, gates, frontage, crossing and overview/section. One Blender CPU process, six threads, 960×640, 12 samples. Initial pass plus at most three correction rounds.
5. Review final diff and run the repository release tests. Publish only this packet after verification.

The local browser automation restriction remains in force. CPU renders establish geometry only; native Three.js shaders, UI interaction, walking feel and FPS require separate native verification. No extra renderer, browser bypass, autonomous heartbeat or changes to water are authorized by this packet.

## Final implementation and review

The default start now runs the full 16-second train arrival: a 24 m approach at an authored initial speed of 4.8 m/s, braking, stopped dwell, sliding-door opening, automatic disembarkation and closing behind the player. Control is handed to the existing walker at P2, looking toward the gate opening. Skip, replay and a saved reduced-motion preference share the existing menu. Menu/photo state and hidden tabs pause arrival; navigation releases the arrival camera before changing modes. Existing lighting, seasons and the original Omotesando checkpoint remain available.

The station and separately mapped railway frames replace only the identified legacy station. The original interactive sign object is retained. Static batching preserves the train and its two animated selected leaves. The public route follows the platform stair, ticket gates, east exit, three exterior steps or the south ramp, then the west Hommachi margin north to the unchanged crossing. The mapped building north of the station contains source-backed Daily Yamazaki/MIO Park details; unregistered shops and food stalls were withheld.

Four specialists reviewed first-person framing, station architecture, route/frontages and layout/integration. The bounded visual pass corrected a platform/stair intersection, gate clearance, the crossing-mouth seam, a floating foundation, overlapping hall/upper-landing tops, the shop glazing base and the final exit framing. The fourth selected door of car 2 provides the gate reveal. The derived lateral correction is 0.585249 m; the modeled door gap is 0.16 m. Over the selected straight car, clearance to the curved mapped platform varies from about 0.01118 to 0.93246 m. That limitation and inferred train type, stop, levels and dimensions remain explicit in the source evidence.

## Final validation

- **650/650 release tests pass**, zero failures, after the last upper-landing and handoff-target correction. Unintegrated R103 was excluded. Syntax checks and diff whitespace checks pass.
- Final assembled CPU audit at **2026-10-24 03:55:32 UTC**: **3,360 public-route samples**, center/±0.25 m in both directions, with zero collision corrections, body intersections, missing support or unwalkable points. Maximum step 0.150 m; maximum support difference 44.914 mm at the side samples.
- **204 automatic egress probes**: center clear, no body intersections or missing support. Side witnesses have up to 6.778 mm correction against the platform safety boundary; this is below the explicit 10 mm audit threshold and is not described as zero.
- **98 strict full-assembly crossing-mouth probes** pass with no edge tolerance. The largest difference is 12.486 mm at existing decorative gutter tops. A separate route-only Three.js ray fixture passes the same 98 locations with maximum difference 1.62e-8 m.
- **21 hall and nine upper-landing points** each have exactly one physical top. The final audit retains **60/60 interactions**, the original sign once, 15 dynamic train meshes and exactly two moving selected door leaves.
- Ten final CPU geometry views were generated from the frozen source. Root confirmed the removed upper-landing black patch and the final handoff facing the exit; fixed-camera facade, gates, shops, crossing, overview and section support the scoped geometry review. The [evidence packet](review-inari-arrival/README.md) contains images, source hashes, cameras, audit results, scripts, release log and specialist findings/resolutions.

This is implemented and tested source with bounded geometry evidence. Native keyboard/mobile walkthrough, continuous motion comfort, native materials/signs/glass, night appearance, photo output, FPS and deployment remain unverified. References span 2016–2021 and do not establish an exact 2026 reconstruction. Unrelated social-preview work, the R103 packet, water and other precinct owners were preserved.
