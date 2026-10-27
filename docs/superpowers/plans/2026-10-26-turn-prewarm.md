# Turn and movement prewarming

User-approved scope: prepare batches before they appear, especially on camera turns; preserve visual quality; measure before/after and continue investigating remaining stalls.

- [x] Reproduce old policy from commit 802d92f using temporary isolated module snapshots, the same High/Sakura settings, one initial view, ten seconds of anticipation and the same 12 m out/back route.
- [x] Add regression tests for exhausted-queue refill, turn detection, coverage behind the camera, radius changes, bounded retries and admission priority.
- [x] Keep max eight pending roots and serial background compilation; separate movement cadence from backlog refill.
- [x] Register the explicitly owned Senbon, legacy and mountain torii instance batches with exact world bounds. Preserve residency/geometry ownership.
- [x] Supply camera direction, align coverage with render distance plus margin capped at 180 m, prepare both near/far LOD roots.
- [x] Measure the intermediate implementation; reject an unsupported fluency claim when shader builds and multi-second stalls persist.
- [x] Add opt-in build identity/phase/coverage observation. Determine whether missed builds were never prepared or rebuilds of prepared objects.
- [x] Skip already drawn registered batches using successful main-camera onAfterRender callbacks; retain explicit whole-LOD preparation and quality invalidation.
- [x] Measure paired first-turn runs with controlled anticipation. The latest combined experimental result remains non-fluid and p99 did not improve; do not claim completion.
- [ ] Complete warm repeats, uninstrumented runs and continuous walking QA on Mac. User requested a Mac handoff before these acceptance checks.
- [x] Run relevant regressions/build, remove only owned temporary QA snapshots, review final diff and report remaining limits.

Additional measured work: skip already drawn batches, retire two-worker experiment, provide opt-in stationary CPU headroom, conservative static color culling, register late detail/candle instances. Full state and rejected approaches are in `HANDOFF-MAC-PERFORMANCE.md`; portable paired data is in `docs/performance/prewarm-comparison-2026-10-26.json`.

Do not change Three's per-instance cache keys, materials, shadows, geometry or render distance to produce a benchmark gain. Source traces and raw measurements stay under ignored outputs/prewarm-improvement-2026-10-26/.
