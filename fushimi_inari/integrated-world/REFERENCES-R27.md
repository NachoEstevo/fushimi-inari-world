# R27 — Yotsutsuji outlook and photo mode

## References and scope

- JR Central, https://souda-kyoto.jp/blog/00514.html : the Yotsutsuji photograph and caption describe views over southern Kyoto.
- Japan Guide, https://www.japan-guide.com/e/e3915.html : Yotsutsuji is the viewpoint and junction before the summit loop.
- Existing OSM tea-house footprints, forecourt polygon and GSI grading are retained. Two benches and a low stone edge are interpretive fittings inside the existing forecourt, not surveyed objects. No additional lookout location or mountain-wide clearing is invented.
- The checkpoint now looks toward the city. Existing distant city geometry remains simplified; exact skyline, further viewpoints and surrounding vegetation still require work.

## Photo mode

A separate HUD button pauses movement at the current position. Pan, tilt, FOV and exposure are reversible. Grid and UI never enter the PNG. Route/landmark overlays are hidden temporarily and restored. Exports use the existing renderer at 1920 or 3840 pixels on the longest edge, then restore drawing-buffer size, pixel ratio and camera aspect in a finally block. One latest PNG blob is retained for the Open last photo link; the previous blob is released on replacement. No new renderer or dependency.

## Checks

- 72 existing/regression Node tests pass; syntax and diff checks pass.
- Browser checked pan/tilt/FOV/exposure controls, Reset, thirds grid, captures at 3840 x 2588 and 1920 x 1294, Escape, reopening, and continued walking.
- Downloaded and inspected the 3840 x 2588 PNG (15,915,940 bytes): scene pixels present, no HUD/grid/route line.
- Walked from the Yotsutsuji approach (801.41,-213.32) across the forecourt to (797.39,-216.74), and confirmed movement after closing photo mode. No new browser errors.
- QA: ../outputs/r27/photo-mode-final.png and ../outputs/r27/kyoto-photo-4k.png (ignored local files).
- Not checked on physical mobile, on low-memory GPUs, or through a complete mountain walk. No new FPS benchmark. Other viewpoints and exact urban panorama remain pending.
