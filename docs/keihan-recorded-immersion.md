# Keihan street reference and recorded audio revision

Contract: existing metre/X-east/Y-up/Z-south frame and mapped owners remain authoritative. Fix Omotesando crossing at node749327076 (ways79699850/105449722) against Street View, retaining road/curb/walking floors. Revisit Keihan-to-shrine route references before adding observed details. New decorative dimensions remain inferred. No invented surveyed businesses.

Audio: prefer real downloadable recordings with source, license, author and modifications recorded. No synthetic replacement represented as an actual Keihan announcement or Suica. Lazy buffer loading after user enables sound; bounded active sources, distance attenuation, event-edge triggering, visibility pause and mute handling. Root owns audio.mjs/viewer.mjs/integration.mjs and event wiring. Preserve user social metadata, README and pending R103 work.

Review angles: Omotesando zebra; station/gates; commercial street; railway crossing. Initial native review plus up to three correction rounds. Exclusive workers may implement only assigned files. Root integrates and validates actual browser, relevant tests and final diff. Four specialists cover the references and critique; root controls the shared browser.

## Integrated result and boundaries

- Corrected zebra orientation and clipped the overlapping Omotesando paving against its mapped Hommachi road owner. Paint follows asphalt elevation; collision ownership is unchanged; the final walking sampler now follows the emitted asphalt inside this junction.
- Added six service covers, twelve drainage grates, four overhead service cables and one original illustrated food-counter fascia. Nine batches, 1,262 triangles; five distance-controlled detail groups. Object families are observed; offsets, dimensions and artwork remain interpreted.
- Revisited Google Street View from Keihan station through the bridge, JR crossing, commercial lane and Hommachi turn (October 2024 / July 2025 imagery). Example commercial reference pano RrKHxtiLLPph0MGSr6r82g at 34.9678972,135.7707927; current screenshot saved as streetview-frontages.png. Zebra direction also checked against the retained station-facing 2016 Townphoto reference.
- Four sourced field recordings are wired, alongside two user-supplied arrival voices: Odakyu rolling, JR Nambu door warning, a field recording near Fushimi Inari, and a Tokyo Suica gate. They are credited interpretations, not exact Keihan recordings. Gate playback is triggered once on passage and fades with distance. Door warning ends at the end of closing. The complete crossing recording is distance-based ambience, not a synchronized isolated bell stem.
- Six buffers load after sound activation; loops are bounded, menu/photo/visibility pauses stop playback, mute stops sources, and Sound volume controls recordings. No synthetic replacement is used for missing recordings. Existing ambient wind/chimes/footsteps retain their prior implementation.
- The user subsequently supplied Japanese and English arrival MP3s. Their original bytes are preserved and scheduled Japanese first, then English after a 250 ms gap, during the moving approach. Both voices finish before doors open. The normal pre-opening interval is eleven seconds; reduced-motion mode retains a ten-second stationary interval. Door opening additionally waits for pending/playing speech, including slower decoding. Skip, replay, mute and pause cancel pending speech. Kyoto hall and Italian brake recordings remain unused research candidates.

## Validation

778 automated tests passed (all project test files except the unrelated pending R103 scope). Actual-assembly route audit: 66,468 samples across both station routes, Omotesando and automatic egress; no blocked, non-walkable, unsupported, body-intersecting or duplicate-top samples. Evidence and source hashes: outputs/keihan-recorded-immersion/independent-audit.json.

Native browser validation verifies decoded files and source/event execution; it does not establish perceptual loudness, clean loop seams, isolated Suica beep timing, or precise audiovisual synchronization. Those require listening and mix refinement. No new FPS improvement is claimed from this revision.

## User-supplied walking video

Reference: [Tokyo Up & Down Walks — station to shrine](https://www.youtube.com/watch?v=K0UC5GkHbaU&t=35s). Native player frames inspected at 0:39 (grooved metal ramp / lateral yellow guidance), 0:44 (station exit), 0:54 (street edge), 1:04 (JR crossing / pale control cabinets), 1:14 (Hommachi intersection facing Urasando), 1:24 (Urasando shop displays), 1:34 (stone torii) and 1:54 (precinct join). This is sampled visual review, not uninterrupted real-time viewing. The video's Urasando continuation is distinct from the requested right turn south toward Omotesando.

Implemented from this evidence: ramp material with original 512x256 color/relief textures on the same two existing triangles, one extra material batch; two crossing control cabinets with doors, hinges, locks, ventilation and terrain-reaching bases (four batches / 312 triangles). Shape families are observed; dimensions and exact offsets are inferred. No video image or audio was extracted into shipped assets. Further shop signs and frontage layouts visible in the video remain opportunities for reconstruction, not claimed complete here.

Final native views accepted: crosswalk-final.png (orientation/asphalt), ramp-final.png (same ramp geometry with visible longitudinal guidance), rail-cabinets-final.png (grounded roadside cabinets), food-detail-final.png (fascia). Before the subsequent voice addition, the browser decoded all four field clips with no failures; rolling/crossing loops active at the JR checkpoint, volume slider changed to56, no console errors. Prior same-audio-code traversal recorded doors1/gate1 and completed Keihan to Romon through Omotesando.

Voice files supplied by the user: fushimi_jp.mp3 (3.553 s decoded) and Fushimi_enmp3.mp3 (5.799 s decoded), both mono44100Hz. FFmpeg decoded both fully without errors. Original hashes/provenance are in assets/audio/recorded-station/arrival-voices.json; no third-party license is inferred for these supplied files.

Final voice timing verified in native browser revision9: JA3.55265s, gap0.25s, EN5.79917s; opening phase reported activeShots0 and failed[]. No console errors. Evidence: voice-final-proof.json. The earlier walking/asphalt gap and raised gutter were corrected; final physical audit has zero failures in all four routes.
