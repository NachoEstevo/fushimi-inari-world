# Shared shaded water appearance R86

## Integration

```js
const pondMaterial = createWaterAppearance({kind:'pond'});
const lakeMaterial = createWaterAppearance({kind:'lake'});
// Share each material among the matching water meshes.
const pond = pondMaterial.userData.waterAppearance;
pond.setMode('day'); // same mode names as the existing sky: day, gold, night
pond.update(elapsedSeconds);
```

The factory returns a `MeshStandardMaterial`, with the controller attached to `material.userData.waterAppearance`. The controller exposes `kind`, `mode`, stable `uniforms`, `setMode()` and `update()`. Use the existing scene animation/lighting registry rather than creating another loop. Two kinds share the same shader source/program cache key, with different uniform wave scales and palettes.

`pond` is jade green; `lake` is blue-green with longer ripples. Both are opaque, double-sided and lit by ordinary scene lights/shadows. Native roughness and color respond to day/gold/night. Emissive remains exactly black in every mode; there is no shader emission, unlit highlight overlay, reflection render pass, screen-space reflection or additional texture/dependency.

## Shader behavior

Installed Three.js is 0.164.1. The module uses its actual standard shader hooks, retains its standard light accumulation, and fails explicitly if the expected hooks disappear.

The vertex hook only exports world XZ coordinates after the same model, batching and instancing transforms used by the standard renderer. It does not modify `position`, `transformed`, projection, water levels, polygon edges or shoreline geometry.

The fragment hook evaluates two analytic sine waves in world XZ. Their analytic slopes are transformed into **view space** using `mat3(viewMatrix)`, then projected into the tangent plane of the current standard surface normal before perturbation. The existing `normal_fragment_maps` hook remains intact. `faceDirection` handles double-sided normal orientation. This avoids confusing a world-space normal with the view-space normal used by Three's lighting, and also supports a slightly tilted existing generic lake mesh.

A small multiplicative diffuse variation supplies broad water tone and fine wave variation. It still passes through the standard light/shadow calculation, so it cannot remain bright with all scene lights/environment removed. Ripple amplitudes affect normals only.

All four custom uniform objects retain identity. Updating time or mode does not set `material.needsUpdate`, allocate per-frame shader objects or recompile. Invalid kinds, mode names and nonfinite/negative times are rejected. Controller functions are omitted by ordinary JSON serialization of userData; serialized metadata is not a substitute for recreating the factory's shader hook when loading a material.

## Verification

`node --test fushimi_inari/integrated-world/water-appearance.test.mjs`: five tests pass. They cover distinct opaque standard materials/zero emission, injection into the real installed shader library without displacement or removal of standard lighting, stable uniforms/program cache across updates and modes, independently compiled shader variants sharing one controller, unsupported hook failure, and camera-rotation equivariance of the view-space tangent perturbation.

`outputs/r86-water/compile.html` is a real Three r164 WebGL test page, not a CPU shader approximation. It creates pond/lake materials plus an instanced mesh, enables shadows, captures compiler/linker errors, checks rendered pixels change with time, and verifies all-light-disabled output is black. It provides day/night buttons and a visible JSON result.

An authorized CUA browser attempt opened the dedicated QA URL at `http://localhost:8420/outputs/r86-water/compile.html`, but the browser returned `net::ERR_CONNECTION_REFUSED`. This was a connectivity failure, not successful GPU compilation. Root subsequently confirmed that the server was stopped and automatic approval denied restarting it. No alternate command, port, server, headless browser or policy bypass was attempted. GPU compilation and final visual acceptance therefore remain explicitly unverified; the passing Node tests are shader-source/control validation, not GPU compilation.


## Scene wiring and limits

R86 applies pond water to the two mapped office ponds and lake water to the existing remaining mapped water batch. Geometry, terrain cuts, shorelines and walking remain unchanged. The viewer collects unique controllers once and updates them from its existing animation loop and lighting selector. Temizuya keeps its inlet ripple and existing reflection environment, now with stable time uniforms and reduced environment intensity at night. No additional draw calls or reflection passes are introduced by this appearance change. Actual GPU cost and visual quality are not yet measured.

Full repository suites: 273 tests passed; viewer and entrance module syntax checks passed. Restarting the stopped local server was rejected by automatic approval review with `blocked by policy`; no alternate server or browser bypass was attempted. Native scene review remains unverified.
