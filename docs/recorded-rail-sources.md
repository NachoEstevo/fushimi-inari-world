# Recorded railway sources

Verified 2026-10-24. Assets are under `fushimi_inari/assets/audio/recorded-rail/`; `manifest.json` records URLs, SHA-256, byte size, duration, level analysis and candidate gains. Four files total 3,099,711 bytes. No dependencies or runtime code added.

## Source and attribution

| File | Author / source | License | Content and limits |
| --- | --- | --- | --- |
| `fushimi-inari-crossing-mrauralization.mp3` | [Railroad Crossing Japan — MrAuralization](https://freesound.org/people/MrAuralization/sounds/162068/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Author identifies a crossing near Fushimi Inari, Kyoto. Exact crossing and railway operator are not established. Recorded with Zoom H1; uploaded 2012. |
| `odakyu-rail-joints-cassiopeia-sweet.ogg` | [Rail Joint sound OER HiSE — Cassiopeia sweet](https://commons.wikimedia.org/wiki/File:Rail_Joint_sound_OER_HiSE.ogg) | Public domain, author's PD-self declaration on source page | Odakyu EMU 10000 rail joints, 2011-09-22. Interpretive rolling layer, not Keihan or JR. |
| `nambu-205-door-alarm-hitachi-train.ogg` | [Nambu branch Line 205 — Hitachi-Train](https://commons.wikimedia.org/wiki/File:Nambu_branch_Line_205.ogg) | Public domain, author's PD-self declaration on source page | JR Nambu 205 alarm, 2009-11-10. Optional door-alarm reference, not Keihan or JR Nara. |
| `gorizia-train-braking-radio-fragola.mp3` | [train-braking.wav — Radio_fragola_gorizia](https://freesound.org/people/Radio_fragola_gorizia/sounds/400093/) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Zoom H4n recording in Gorizia, Italy; uploaded 2017. Optional generic brake, never describe as Japanese railway recording. |

The MP3 files are Freesound's publicly available HQ previews, downloaded unchanged; their original WAV downloads require login and were not used. Commons OGG originals are unchanged. No trimming, normalization, synthesis or resampling was applied. Runtime gain, fading, looping or segmentation should be identified as playback modifications in visible credits.

Required visible attribution for the CC BY item: **“Railroad Crossing Japan” by MrAuralization, via Freesound, CC BY 4.0. Public MP3 preview; playback gain/fades adjusted. Recorded near Fushimi Inari; exact crossing unverified.** Link the title and license to the URLs above. Credit the other authors alongside it for traceability, although their public-domain declarations do not require attribution. No endorsement is implied.

## Playback candidates

| Recording | Container duration | Format | Suggested segment | Initial linear gain |
| --- | ---: | --- | --- | ---: |
| Fushimi crossing | 105.43 s | MP3, 44.1 kHz stereo | Full 0–105.403 s source span | 0.14 |
| Odakyu rail joints | 8.74086 s | Vorbis, 44.1 kHz mono | Full recording, short edge fades | 0.10 |
| Nambu door alarm | 13.06 s | Vorbis, 44.1 kHz stereo | Full one-shot, optional | 0.12 |
| Gorizia brake | 20.53 s | MP3, 44.1 kHz stereo | Full 0–20.492 s source span, optional | 0.035 |

**Not listened to perceptually.** All four files passed complete FFmpeg decode and level analysis. Mean / peak dBFS respectively: crossing −27.1 / 0.0; rolling −21.1 / −0.2; alarm −12.7 / −0.3; brake −8.9 / 0.0. Gains are conservative starting points, not a validated mix. The brake source is particularly loud. MP3 container duration includes encoder padding.

Do not invent a clean bell-only or pass-by segment from amplitude alone. Keep the complete crossing recording until native listening identifies useful sections. Its existing recorded train/crossing chronology cannot be claimed synchronized to the simulated train. Prefer distance-based ambience with soft entrance/exit, and audition any loop seam; avoid stacked overlapping copies. The interpreted rolling layer can follow train proximity. Alarm and brake candidates are optional and should only fire at an appropriate actual event, never on every animation frame.

Root owns runtime selection, lazy loading, event guards and browser QA. Final acceptance still needs native listening for audibility, unwanted speech/traffic, clipping, loop seams and timing against the simulation.
