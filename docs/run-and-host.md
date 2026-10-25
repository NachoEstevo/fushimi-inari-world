# Run and host

## Local development

Use Python 3 and a desktop browser with WebGL 2. From the repository root:

```powershell
python -m http.server 8420 --bind 127.0.0.1 --directory fushimi_inari
```

Open [Inariyama Explorer](http://127.0.0.1:8420/integrated-world/index.html). The pinned Three.js CDN requires internet on first load. Start audio through the experience's Enter control or another user gesture. Stop the server with Ctrl+C when finished.

## Tests

With Node.js installed, prepare the matching local Three.js package if it is absent:

```powershell
npm install --no-save --package-lock=false three@0.164.1
node --test fushimi_inari/geography/*.test.mjs fushimi_inari/integrated-world/*.test.mjs
```

Tests check data and behavior; use a real browser for rendering, input, audio and route-clearance review. The [validation page](ultra-quality-and-release.md) records the scope of earlier checks rather than promising that every current local change passes.

## Static hosting

Serve `fushimi_inari/` as the static root and route `/` to `integrated-world/index.html`. Preserve the relative layout of runtime modules, geography and referenced assets, serve the expected content types, and allow access to the pinned external Three.js modules. No application backend is required.

Exclude raw research, local outputs, temporary files, tests and unused source/export artifacts from a deployment package only after checking runtime references. Keep the credited assets and their attribution. Validate the packaged result in a preview: initial arrival, requested resources, audio gesture, route handoff, rendering quality and image export.

Provider-specific packaging and loading experiments may exist in a local checkout. They are not required to run the committed source with the server above. Confirm deployment configuration, real network transfer and target-device behavior before publishing a hosted experience.
