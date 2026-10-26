# Movement Hitches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attribute walking and turning stalls in the normal viewer.

**Architecture:** Observe the existing browser renderer through CDP CPU profiling and tracing. Keep application behavior unchanged during initial attribution; use one reversible ablation to verify a candidate.

**Tech Stack:** Three r180 WebGPU, CUA CDP, Node/PowerShell offline trace analysis.

## Global Constraints

- No permanent visual quality reduction, new dependency, second simultaneous renderer, or unrelated file changes.
- Keep traces and screenshots under ignored `outputs/movement-hitches-2026-10-26/`.
- CPU submit time is not GPU duration. Cold exposure and warm repeats are separate.

### Task 1: Reproduce and capture

**Files:** Read `fushimi_inari/integrated-world/viewer.mjs`, `walking-prewarm.mjs`, `texture-streaming.mjs`; create ignored CPU/trace evidence.

**Interfaces:** CDP `Profiler.enable/start/stop`, `Tracing.start/end`, observed browser controls and DOM datasets.

- [x] Read current camera, renderer backend and prewarm DOM telemetry.
- [x] Capture CPU sampling with streaming/prewarm active on the existing deterministic camera route; document that normal WASD input could not be held through the available browser input API.
- [x] Save CPU profiles and verify motion/nonzero render activity. A browser trace stream was not recovered and is excluded from evidence.
- [x] Repeat the same route with warm caches; retain poses and duration.

### Task 2: Attribute and confirm

**Files:** Create ignored `analysis.json` and `report.md`; change no production source unless evidence requires a bounded follow-up.

- [x] Rank sampled CPU stacks: synchronous node graph construction dominated first exposure; distinguish visible render, shadow and compileAsync ancestry.
- [x] Add a tested opt-in build observer and identify costly repeated instanced material builds. Verify r180 cache behavior in real source; do not change engine cache keys.
- [x] Control the timing of the candidate by preparing the same seven views before measuring. Preserve quality and the live prewarm flow; repeat hot and document remaining builds and pauses.
- [x] Review final diff, stop profiling and preserve the user tab. Report confirmed findings separately from suspects and any remaining stalls.

Results and exact limitations: `outputs/movement-hitches-2026-10-26/report.md`. This experiment does not implement a production speed fix. Follow-up: bounded prewarm coverage/refill policy with regression tests and continuous-walking QA.
