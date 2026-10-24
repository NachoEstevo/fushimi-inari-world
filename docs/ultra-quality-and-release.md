# Ultra, photo UI and October 24 release

Balanced remains the initial preset. Ultra adds bounded supersampling (1.5–2x before the four-million-pixel viewport ceiling), a 4096 px sun shadow map, a half-float composer, a 16-sample SSAO pass at 60% width/height, output tone mapping, up to 16x anisotropic filtering and 1.25x nearby detail activation. It reuses the installed Three.js r164 addons, loaded only when selected. Alpha foliage, transparent water, unlit emissive objects and overlays are excluded from the normal override to avoid opaque-card occlusion artifacts. Photo FOV updates the AO matrices; photo exports use the same pipeline. No new geometry, dynamic light count or claimed physical accuracy comes from the preset.

Resource ownership: return to Balanced/High disposes composer targets and passes, restores original anisotropy and returns sun shadows to 2048. Explicitly dispose r164 SSAOPass's omitted noise texture and SSAO material. A native Balanced → Ultra → Balanced cycle at Kumataka returned from 156 to the original 149 textures and from 2242 to 2241 geometries. Async imports use request generations so a late Ultra load cannot override another selected preset.

The photo header now shares a horizontal alignment for title and close button, with no inherited heading padding or bottom margin. The action row uses equal grid columns, equal 44px heights and zero primary-button top margin. Native desktop bounds confirmed Reset and Save at the same Y with equal width and height. Mobile layout was not separately verified.

## Evidence

- 823/823 tests passed on the final code after the disposal and photo alignment changes.
- Native comparisons at identical cameras: Rōmon, Day/Sunset/Night, and Shin-ike. Alpha vegetation, sky, emissive lights and water inspected; no browser error logs observed.
- Rōmon: Balanced 100.7 FPS / 9.24 ms CPU submission, Ultra 62.5 FPS / 15.22 ms, viewport 1467×852. Native DPR 1; Ultra 1.5. Pond: 146.5 / 86.8 FPS. Short observations, not controlled GPU timings or hardware qualification. Moving NPCs and water were not frozen.
- Ultra exported a 3840×2230 PNG and returned to viewport rendering. Final README photographs use clean Photo-mode captures and compressed WebP copies.
- Full browser decode loaded all six rail/station clips with no failures. Japanese then English schedule retained.

Local raw evidence remains under `outputs/ultra-quality-review/`; it is excluded from new Git additions. Existing tracked historical evidence is preserved.

## Runtime audio and local cleanup

The crossing recording was re-encoded from MP3 to stereo Vorbis q3, 44.1 kHz: 2,393,849 → 1,326,414 bytes, saving 1,067,435 bytes (44.59%). Source/license attribution retained. No trimming, pitch, gain or speech changes. Full FFmpeg decode passed; no perceptual transparency claim. Original source retained locally under `outputs/audio-optimization/originals/`. Transfer size falls; decoded Web Audio memory does not.

A reproducible `.tmp/r96-path-buckets.json` dump was archived losslessly and verified against its original SHA-256 before removing the uncompressed copy. 187,097,023 → 24,474,954 bytes, net 162,622,069 bytes reclaimed. Recovery instructions and manifest remain under `outputs/cleanup-2026-10-24/`. Unique references, models, video, checkpoints and historical geometry were preserved. No blanket cleanup of the approximately 6.3GB output inventory.

## Other included work

Keihan → Omotesando → shrine → full summit loop default; quieter recorded footsteps; smoother stair camera; terrain-seated torii and Yotsutsuji stair clearance; readable two-sided inscriptions; automatic Suica flaps; pause preserving movement; default chimes; day/sunset/night lighting; shop details; Okusha banks/fence/votive display; mapped Osugi destination; welcome and HUD refinements.

No production deployment, mobile/low-end GPU certification, exact historical reconstruction or exhaustive current clearance certification is claimed.
