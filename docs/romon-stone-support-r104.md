# Floating stone assembly near Rōmon · R104

## Root cause

The reported hollow tray, four corner blocks, rectangular finial base and sphere belong to **the mapped Okusha hand-washing shelter**, OSM `way/1267862163`. They are the existing mineral catchment, four post shoes and small top fitting authored by `buildOkushaMappedSheltersR102`. They are not an incomplete lantern or stones belonging to Rōmon.

`integration.mjs` updated world matrices before collecting walking surfaces. It then constructed the translated/rotated Okusha shelter and Kumataka rest furniture, and finally baked static meshes using `object.matrixWorld` without another update. The new shelter's stone batch shared the existing entry-stone material, so it joined a larger batch using its still-identity matrix. Its private wood, copper and basin materials did not undergo the same merge, leaving the mineral parts detached from their correct shelter.

The misplaced stone vertices occupy approximately X `0.05…2.3131`, Y `62.5200…63.4350`, Z `0.05…1.3970`: the shelter's local horizontal coordinates with its correctly authored absolute altitude. The intended world footprint is near X `252.8…255.23`, Z `65.77…67.30` at Okusha. The screenshot camera `[5.57,64.08,4.55]` therefore sees those misplaced stones above trees at Rōmon.

## Correction

Refresh the complete root's world matrices immediately before the static batch collection/bake. No stone geometry is removed, shifted by an arbitrary vertical offset, or hidden. The shelter's original origin, roof footprint, ground samples, material, collision shapes and meshes remain authoritative. Refreshing at the batch boundary also covers other builders inserted after the earlier walking-surface snapshot.

The parent agent moved the existing batch pass into `spatial-static-batches.mjs`, with the matrix refresh at its entry. The bake uses the inverse root transform so a translated, rotated or scaled root is not applied twice. No separate repair builder is needed: a geometry correction would mask a transform lifecycle error and duplicate ownership.

## Evidence

- User attachment and `outputs/keihan-street-expansion/baseline-current.png` visibly show the detached assembly.
- A CPU probe of the complete production assembly identified 660 stone vertices in the erroneous bounds above. Texture decoding was stubbed; this probe establishes geometry attribution, not pixel appearance or performance.
- A second production-assembly probe refreshed matrices at the batch boundary. The high-stone query around Rōmon returned no matches. Native after-image review remains parent-owned.
- Existing shelter unit tests updated its world matrix before checking bounds; those isolated tests could not catch the integration's later stale-matrix bake.
- Four new tests in `spatial-static-batches.test.mjs` pass against the production batching function: the actual R102 shelter keeps all 220 stone triangles in its mapped footprint; late nested translations/rotations/nonuniform scale survive merging; a transformed root is not applied twice; retained interactive and animated meshes preserve identity. Test reference positions derive from local transforms without refreshing world matrices, so the regression does not accidentally repair the fixture before exercising the batcher.

This fix preserves the previously accepted R102 interpretation. It adds no historical or dimensional claims about the shelter.
