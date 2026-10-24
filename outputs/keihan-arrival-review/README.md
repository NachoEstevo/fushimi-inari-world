# Keihan arrival verification

Native browser evidence and independent CPU assembly checks for the Keihan default arrival and alternate JR approach. Source baseline: `da6e6b98fefea5b8d212ff6e0915671b6218e858`. The final `manifest.json` records working-source SHA-256 values, staged Git blob IDs, evidence hashes, capture dimensions and scope boundaries.

## Reproduce

From the repository root, with the existing local Three.js 0.164.1 installation:

```powershell
$releaseTests = @((Get-ChildItem 'fushimi_inari/integrated-world/*.test.mjs' | Where-Object Name -ne 'okusha-north-boundary-r103.test.mjs').FullName) + @((Get-ChildItem 'fushimi_inari/geography/*.test.mjs').FullName)
node --test --test-concurrency=4 @releaseTests
node outputs/keihan-arrival-review/audit.mjs
node outputs/inari-followup-performance/candle-benchmark.mjs
python -m http.server 8420 --bind 127.0.0.1 --directory fushimi_inari
```

Open `/integrated-world/index.html`, complete arrival, walk east to the wall, turn right/south and leave through the gate and ramp. Follow the Keihan itinerary to Rōmon; repeat with the JR itinerary. Checkpoints provide direct views of the exit, canal bridge and Urasando. Exercise High resolution/Balanced rendering and photo-mode entry/exit.

## Evidence scope

- `release-tests.log`: 714 passing tests. The unrelated, unintegrated R103 test is excluded. The last appearance-only street-shoulder extension subsequently passed its four focused tests and native shader/visual review.
- `independent-audit.json`: final physical assembly check of 38,016 route/egress samples, with no failures. It precedes the final appearance-only shoulder extension, which changes no geometry, colliders or walking heights. The harness uses CPU canvas/image stubs and makes no renderer or FPS claim.
- `native-final-keihan-tour.json` and `native-final-jr-tour.json`: both UI-driven tours reached the same Rōmon destination and showed `Restart route`.
- `native-keihan-before.json` and `native-final-platform.json`: same platform pose at 1280 × 720 / DPR 1, before and after detail/performance work. Calls fell from 2,535 to 2,288. FPS samples are instantaneous observations; they do not establish a controlled improvement.
- `native-final-platform.png` and `native-final-urasando.png`: final appearance reload at 1397 × 852. Their viewport differs from the earlier platform performance JSON. `native-final-urasando.json` records the final street camera and runtime sample. `native-final-romon.png` predates only the street-shoulder appearance extension.
- `native-final-console.json`: empty warning/error log after the final shader reload and Urasando inspection.
- Other selected native images document earlier station/bridge/canal/food-counter review. Their original terrain appearance may predate the last shoulder correction.
- `candle-benchmark.mjs/json`: reproducible final same-assembly candle comparison. The earlier flames-only/first reports and native flames-only sample are retained as explicitly intermediate evidence.

Google Street View screenshots are local research references only and are not included in this evidence commit or shipped as scene textures. Reference URLs and interpretation boundaries are documented in `docs/keihan-*-evidence.md` and `docs/keihan-arrival-production.md`.

The native page includes the user's separate, unstaged social metadata; it has no runtime effect on this scene. The manifest identifies the staged HTML blob separately. High-DPI/mobile performance, controlled first-load latency and production deployment remain unverified.
