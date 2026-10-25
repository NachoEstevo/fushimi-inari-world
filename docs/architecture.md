# Architecture

The active experience is a static Three.js application rooted at `fushimi_inari/integrated-world/`. It shares mapped geography with the separate geography viewer; source Blender scenes, exporters and the original viewer are retained for development.

| Area | Ownership |
| --- | --- |
| `integrated-world/index.html`, `viewer.mjs` | Browser entry point, renderer, frame loop and interaction/UI coordination |
| `integrated-world/integration.mjs` and sector modules | Assemble architecture, terrain-facing details, routes and scene registrations |
| `integrated-world/walking.mjs` and collision/surface modules | Movement and support against the authoritative scene surfaces |
| `integrated-world/world-detail-chunks.mjs` | Visibility of nearby rendered detail, separate from collision/support ownership |
| `integrated-world/render-quality.mjs` | Rendering presets and ownership/disposal of optional postprocessing resources |
| `geography/` | Terrain data, mapped paths/buildings, coordinates and routing inputs |
| `assets/` | Textures, building/visitor models and credited audio |
| `scripts/` inside `fushimi_inari/` | Source preparation, exporters and development audits |

Paths above are relative to `fushimi_inari/`. Keep scene generation in its owning sector modules; the viewer coordinates the experience. Rendering visibility must not remove walking support or change the mapped route graph. Generated rendering batches may have different lifetimes from the underlying collision and surface data.

Source geometry, shared textures and audio may be reused by multiple parts of the scene. Changes to loading or disposal must preserve that ownership and test transitions between rendering presets and visited zones. Visibility culling alone is not proof of lower resident memory.

Historical revision names in modules identify their development lineage, not separate applications. Do not rerun the historical `build_integrated_viewer.py` bootstrap over the current implementation. Use the existing modules and preserve source asset credits.

See [run and host](run-and-host.md), [sources and limits](sector-review.md) and [validation](ultra-quality-and-release.md).
