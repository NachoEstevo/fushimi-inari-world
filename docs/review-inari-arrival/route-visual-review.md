# Route and shops visual review — specialist C

Reviewed root-rendered `outputs/inari-arrival-review/shops-view.png` and `crossing-view.png`, their full camera definitions, the canonical station/route specification and the actual source photographs. No independent renderer or browser was opened. The export manifest identifies route hash `384b5c95...` before the final 102-triangle road-edge seal; the shops hash `56913cc7...` matches the frozen storefront. The crossing image is therefore valid for the overall arrangement, not proof of the later exact seal.

Reference pixels inspected: Townphoto 2016 `k01101.jpg`, `k01102.jpg`, `k01105.jpg`, `k01106.jpg`; 2019 station ramp; 2021 Daily Yamazaki `IMG_5720_20210418.jpg` and MIO Park `IMG_5722_20210418.jpg`. Their URLs and dates are in `docs/inari-station-route-evidence.md`. Geometry units/placement remain authoritative; the images establish appearance and observed object categories.

## Findings

1. **P2 — Continuous open slot below the Daily glazing.** In `shops-view.png`, the full storefront has a dark horizontal gap beneath its framed glass. This is an actual geometry discontinuity: the visible shop floor is at `floor`, whereas the rear glazing starts at `floor + 0.125 m`; the lower frame starts at `floor + 0.135 m`. The source photograph shows the pale lower frame/base meeting the paved threshold. Minimal correction: fill only this 0.125 m base interval with the observed pale lower-frame material, at the same recessed glazing plane. Do not raise the floor or change the shop footprint/route. Acceptance: a horizontal ray through the Daily bay at `floor + 0.06 m` meets its base closure rather than the distant building shell; the same shops camera no longer shows a continuous open slot. Preserve the bounded floor sampler, all public-route collider checks and the confirmed Daily/MIO ordering.

**Resolution implemented after root approval:** a 0.125 m pale base closure now occupies only the existing recessed glazing plane, adding 12 triangles and no collider/material batch. Three horizontal regression rays at 20%, 50% and 80% of the Daily bay, 0.06 m above the unchanged floor, meet the closure within 0.60 m. All 14 route/frontage tests pass. Footprint, floor sampler, route and colliders are unchanged. Frontage hash is now `2146aee5f72a0c520612545986abaac24663efdf46421df29561b4c3d6ca38cf`. The earlier finding and measurements are retained above; the named PNG paths are updated by the final root render reviewed below.

## Scoped acceptance

The dated source ordering is readable: Daily is south of MIO, with the two stacked capsule cabinets and white drinks cabinet at the adjoining MIO opening. Recesses, framing, sign bands, physical lettering and the upper galleries read as geometry. The equipment remains inside the opening and does not visibly consume the walking margin. The three-storey envelope and unmapped rear details remain the documented estimates, not exact facade reconstruction.

The crossing camera shows a continuous visual approach and the existing open curb mouth, with the first torii beyond the street. Its source-backed drain/curb arrangement remains distinct from the new margin owner. No broad new slab, invented storefront row or newly placed festival banners appear. White torii/paving and simplified vegetation/materials in these CPU views are known exporter limitations, so this review does not treat their colours as native-material regressions.

Native textures, glass rendering, input walking and FPS are unverified. Final exact crossing-edge acceptance belongs to the focused post-seal geometry audit and re-export, not to the pre-seal image.

## Final same-camera review — 2026-10-24

Inspected the final root-rendered `shops-view.png` (local file time 00:49:35) and `crossing-view.png` (00:49:24), using the unchanged diagnostic cameras. The final export manifest binds them to route hash `bb1fdeddeef823bb42ab32bfea3b4c9d902f3cb71c981f1cd15a045e7aee2306` and frontage hash `2146aee5f72a0c520612545986abaac24663efdf46421df29561b4c3d6ca38cf`.

The Daily lower frame now visibly meets the threshold; the former continuous open slot is closed. Glazing/frosted bands, readable sign, Daily/MIO order, recessed equipment and the adjacent public margin remain intact. This resolves the sole P2 finding from this specialist's initial review. No further storefront production change is requested.

The final crossing image shows the completed mouth joining the inherited road/approach with no visible opening or broad overlay. The exact boundary seal itself is additionally covered by the focused geometry/ray regressions; this image establishes its visible continuity at the prescribed camera, not submillimetre precision by pixels alone. The curb aperture, crossing markings, drain and first-torii approach retain their arrangement. No blocking visual defect is observed in these two final CPU views.

Scoped visual acceptance is complete for this owner. Native textures, glass/shaders, browser walking and FPS remain outside the evidence provided by these simplified CPU renders.
