# Mac frame pacing implementation plan

**Goal:** Reduce walking/turning stalls without lowering rendering quality.

**Architecture:** Retain the live r180 scene/camera/render target and serial compilation. Reuse an explicitly invalidated light membership index; evaluate visibility/layers on each use. Preserve shader and instance buffer cache ownership. Measure the existing 16-second route in the same Mac WebGPU tab, separating first exposure, warm repeats, and instrumentation.

**Tech stack:** Three r180 WebGPU, Node tests, local Python server and browser diagnostics.

- [x] Fetch and fast-forward main to 7c18302, preserving original touched files in ignored .tmp archive. Work on codex/mac-frame-pacing.
- [x] Read HANDOFF-MAC-PERFORMANCE.md and reproduce first-exposure route on Mac: Balanced/Natural, DPR 1.25, 10-second anticipation, default prewarm flags, build observer enabled. p99 111.27 ms, worst 325 ms. CPU submission and RAF intervals are distinct.
- [x] Independently audit preparation/cache ownership (Terra 6.1) and game loop/allocations (Sol 6.1).
- [x] Write failing regressions for reusable light discovery, hierarchy/layers/visibility changes, invalidation and state restoration.
- [x] Implement createCompilationLightIndex/getLights in scoped-compilation.mjs; preserve uncached default for other callers.
- [x] Integrate lazy light index in viewer, invalidate deferred additions before compilation; first read occurs after normal light installation.
- [x] Compare the same route after a fresh reload, then warm repeats and runs without build observer. Retain metrics and limits under docs/performance/.
- [x] Reduce measured avoidable rig allocations, preserving exact gait matrices and multi-rig independence; run focused regressions.
- [x] Review production diff and run rendering/navigation regressions and static build. Visual review of route/quality/flashlight and resize; report remaining stalls honestly.

No engine cache-key hacks, concurrency increase, geometry/material reductions, experimental culling default changes or new dependencies.

Measured final defaults without build observer: first-exposure p99 16.7 ms, worst 25.1 ms. Native W/S warm capture: p99 10.2 ms, worst 10.4 ms; High/Sakura/sunset/flashlight repeat with native turns: p99 10.0 ms, worst 16.7 ms. The first High mouse-control capture retained a 66.4 ms gap; do not omit it. Details in docs/performance/mac-frame-pacing-2026-10-26.md and JSON.

- [x] Enable conservative static-owner cull by default after measured comparison and photo/resize review; retain prewarmCull=0 for QA.
- [x] Add opt-in frameAudit=1 capture for real gameplay without taking camera ownership; bounded storage and actual movement/turn telemetry.
- [x] Check fresh continuous station approach. Found 300 ms geometry spikes; split source/geometry stages, budget task slices, compile deferred shaders serially, and register explicit affine-safe mapped boundary ownership. Final two 16 s segments each peaked at 25.1 ms.
- [x] Finish final full verification and browser handoff: 1,135 general tests pass (21 skipped), 132 r180 tests pass; static build and 4K visual export pass.
- [x] Create the local commit with only this task's source, tests and performance documentation.

- [x] Preserve pre-edit geometry digests for modified refiners; retain shared synchronous/cooperative implementation and fail-closed source signatures.
- [x] Add CPU-work-ranked frames and a shared timestamp origin to optional audits, so a slow frame is not attributed to the next RAF's flags.
