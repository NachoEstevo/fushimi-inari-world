# JR Inari arrival evidence

This packet records the authored arrival from Kyoto onto JR Inari platform 2 and the east-exit walk to the existing Omotesando crossing. Geometry follows mapped footprints and historical references from 2016–2021; dimensions and train stopping position are interpretations, not a survey or a claim of current 2026 conditions.

## Final geometry views

All images are actual assembled Three.js geometry exported to Blender, rendered serially on CPU with six threads, 960 × 640 pixels and 12 samples. Simple material colors replace native textures and shaders. These are geometry diagnostics, not screenshots of the running application. In particular, white torii/sign surfaces in these images do not establish native colors. The section is an uncapped geometric cut.

| View | Purpose |
| --- | --- |
| [Moving train](moving-view.png) | Door-facing approach, one sampled position within the 24 m movement |
| [Open door](door-view.png) | Fully open selected doorway and platform-to-hall reveal |
| [Control handoff](handoff-view.png) | Actual final camera position and target toward the exit opening |
| [Platform reverse](platform-view.png) | Closed doors behind the player; diagnostic reverse camera |
| [Ticket gates](gates-view.png) | Clear hall floor and exit lane |
| [Station frontage](frontage-view.png) | Grounded foundation, stairs, south ramp and north telephone/postbox |
| [Crossing](crossing-view.png) | Connection to the retained Omotesando/first-torii approach |
| [Shops](shops-view.png) | Registered Daily Yamazaki and MIO Park frontage, based on 2021 photographs |
| [Overview](overview-view.png) | Station, train, street and crossing topology |
| [Section](section-view.png) | Train, platform, internal stairs and lower concourse |

[manifest.json](manifest.json) binds the exports to SHA256 source hashes; [cameras.json](cameras.json) records the cameras. Four specialist reviews retain findings and their later resolutions: [first person](first-person-review.md), [station](station-visual-review.md), [route](route-visual-review.md), and [layout](layout-visual-review.md). Earlier observations describe intermediate geometry and must be read with their appended resolution.

## Verification

- The final repository release test scope passed **650/650**, zero failures. The unrelated, unintegrated R103 test file was excluded. [Release log](release-tests.log).
- [Independent assembly audit](independent-audit.json): real post-batching geometry, colliders, walking-height owners, interaction preservation and moving-door retention. The public route uses center/±0.25 m lanes in both directions. These are CPU simulations, not keyboard walks.
- [Strict route-only seam audit](strict-seal-route-audit.json): 98 exact Three.js downward rays around the previously missing crossing-mouth seam, without an added intersection tolerance. This fixture is distinct from the full-assembly audit.
- [Integration review](../inari-arrival-integration-review.md) explains the final metrics, collision tolerances, source binding and historical audit passes.

Native Three.js material appearance, continuous animation/comfort, keyboard/pointer and mobile interaction, photo capture, night appearance and FPS remain unverified. The local browser restriction was respected. No deployment or production-browser acceptance is implied by this packet.

## Reproduce from the repository root

The installed repository dependencies provide Three.js. Blender 5.2 was used for the evidence. The export/audit scripts use a minimal DOM/canvas stub solely to construct CPU geometry; it does not execute or validate the product UI. Raw mesh JSON and Blender files are intentionally not committed.

```powershell
node docs/review-inari-arrival/export.mjs --refresh-cameras
Copy-Item docs/review-inari-arrival/render.py outputs/inari-arrival-review/render.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python outputs/inari-arrival-review/render.py
node docs/review-inari-arrival/audit.mjs
node docs/review-inari-arrival/strict-seal-route.mjs
$releaseTests = @((Get-ChildItem 'fushimi_inari/integrated-world/*.test.mjs' | Where-Object Name -ne 'okusha-north-boundary-r103.test.mjs').FullName) + @((Get-ChildItem 'fushimi_inari/geography/*.test.mjs').FullName)
node --test --test-concurrency=4 @releaseTests
```

Outputs are written to `outputs/inari-arrival-review/`. Keep a single renderer active. Reproduction hashes may differ after checkout line-ending conversion; compare normalized source content before interpreting that as a geometry change.
