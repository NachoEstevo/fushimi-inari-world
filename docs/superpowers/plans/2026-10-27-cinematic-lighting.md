# Cinematic lighting implementation plan

> **For agentic workers:** execute the independent components with subagents and integrate/review in this chat. User already authorized autonomous Terra/Sol delegation and implementation.

**Goal:** improve sunset and selected High lighting while protecting walking frame pacing, and provide actionable evidence for the Windows green failure.

**Architecture:** shared sun constants; bounded local instanced shafts; scalar quality material response; independent local renderer-health observer. Existing quality, preparation, photo and ownership controls remain responsible for the renderer.

**Tech Stack:** Three r180, TSL, WebGPU/WebGL fallback, Node built-in tests, existing static build.

- [x] Read and pin existing behavior; preserve unrelated EOL changes. Fetch remote before integration.
- [x] Add failing then passing tests for renderer loss observation, bounded export history and listener cleanup. Implement renderer-health.mjs; preserve device callbacks.
- [x] Add coherent sun/fog and +50 m viewing tests. Implement shared atmosphere-profile and changes in sky-nodes, route-lighting-nodes, viewing-distance and leaf-light direction.
- [x] Test High/Balanced station finish round trips with unchanged map/material identity; implement setQuality scalar updates and connect appearance.prepare.
- [x] Add shaft tests for hard resource limits, deterministic route/canopy admission, conservative roof rejection, Balanced/night suppression and disposal. Implement local-sun-shafts.mjs with one instanced analytic ribbon mesh and no extra render pass.
- [x] Integrate viewer: initial shaft install, time/quality changes, high compilation, update and disposal; install renderer-health after camera/quality and stop updates after confirmed device/context loss.
- [x] Update import-map cache versions for all changed runtime aliases and add relevant policy checks.
- [x] Run targeted Node r180 and general checks, then static build. Inspect local browser day/gold/night in both presets, walk and measure frame intervals. Check shaders and GPU errors; capture PNGs.
- [x] Independently review code and limitations; write measured report. Commit only scoped files; verify remote integration if pushed.

Test runtime: `node --loader ./.tmp/webgpu-runtime/loader.mjs --test <webgpu test files>`; renderer-health uses plain `node --test`. Tests requiring the legacy engine remain on the existing legacy runner. Never run benchmarking concurrently with tests.

Additional completed scope: omit unmodeled religious context envelopes from visitor/horizon rendering, preserve geographic records and add inspection opt-in; add tight conservative static-box frustum rejection after a recorded far-plane false positive; remove the redundant shrine-paint clearcoat lobe.

Windows symptom acceptance remains pending: this Mac cannot reproduce the original Windows/Brave session. The delivered monitor records the required device/context loss and bounded history without claiming a root-cause fix. No live Windows reproduction is marked complete.
