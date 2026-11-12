# Run and host

## Local development

Use Python 3 and a desktop browser with WebGL 2. From the repository root:

```powershell
python -m http.server 8420 --bind 127.0.0.1 --directory fushimi_inari
```

Open [Inariyama Explorer](http://127.0.0.1:8420/integrated-world/index.html). The pinned Three.js CDN requires internet on first load. Start audio through the experience's Enter control or another user gesture. Stop the server with Ctrl+C when finished.

## Tests

With Node.js installed, install the pinned dev dependencies (`three` 0.164.1 for the tests, `three-runtime` = three 0.187.0 and esbuild for the release build):

```powershell
npm install
npm test            # runtime tests
npm run test:build  # release build tests
```

Tests check data and behavior; use a real browser for rendering, input, audio and route-clearance review. The [validation page](ultra-quality-and-release.md) records the scope of earlier checks rather than promising that every current local change passes.

## Static hosting

The published build is produced by `npm run build` (`scripts/build-static.mjs`). It bundles `integrated-world/viewer.mjs` with esbuild, resolving modules through the page's own import map (same `?v=` keys and remaps the browser applies) and bundling Three.js from `three-runtime` instead of the CDN. Content-hashed `bundle-*.js` chunks are written beside `dist/integrated-world/index.html`, audit and capture modules stay lazy chunks, and the import map is removed from the built page. Only requested assets are copied; `dist/build-manifest.json` lists files, chunks and sizes. Preview it with `python -m http.server 8431 --bind 127.0.0.1 --directory dist` and open `/integrated-world/index.html`. Vercel runs `npm ci` and `npm run build`; `vercel.json` marks the hashed chunks immutable. `--source <dir> --out <dir>` builds another checkout, such as a clean `git archive` export.

For the unbundled source:
Serve `fushimi_inari/` as the static root and route `/` to `integrated-world/index.html`. Preserve the relative layout of runtime modules, geography and referenced assets, serve the expected content types, and allow access to the pinned external Three.js modules. No application backend is required.

Exclude raw research, local outputs, temporary files, tests and unused source/export artifacts from a deployment package only after checking runtime references. Keep the credited assets and their attribution. Validate the packaged result in a preview: initial arrival, requested resources, audio gesture, route handoff, rendering quality and image export.

Provider-specific packaging and loading experiments may exist in a local checkout. They are not required to run the committed source with the server above. Confirm deployment configuration, real network transfer and target-device behavior before publishing a hosted experience.
