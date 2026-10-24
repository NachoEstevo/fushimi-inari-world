# Recorded station audio sources

Research/download date: 2026-10-24. Ownership: this document and `fushimi_inari/assets/audio/recorded-station/`; playback belongs to the integration owner.

## Downloaded recordings

The files are the publicly served Ogg previews linked by each Freesound page, downloaded unchanged. No synthesized voice or generated oscillator sound is included. License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Preserve attribution in the experience's credits when distributing these files. The preview encoding is Freesound's; no local trimming, normalization, or remix was performed.

| Local filename | Author / source | Recorded subject | Measured file duration | Bytes | Use boundary |
| --- | --- | --- | --- | --- | --- |
| `suica-ticket-gate-hinoki-owo.ogg` | [Hinoki.owo — Card Beep in Japan Railways Ticket Gate](https://freesound.org/people/Hinoki.owo/sounds/796687/) | Passing a JR Tokyo station turnstile with Suica, according to the uploader | 3.937146 s | 33,344 | Real IC gate recording; geographically an interpretive substitute at Keihan, not evidence of that station's exact gate hardware/sound. |
| `kyoto-main-hall-lg.ogg` | [LG — 20180523 - Kyoto main railway station hall ambiance 01.wav](https://freesound.org/people/LG/sounds/462725/) | Main hall of Kyoto railway station, Sony PCM-D50 | 82.254438 s | 744,553 | Candidate only: indoor main-hall acoustics differ from Keihan Fushimi-Inari's platform. Auditory review required before use; any incidental announcement must not stand in for the requested arrival voice. |

Both downloaded files are stereo Vorbis at 48,000 Hz. Ogg page boundaries and final granule timestamps were parsed successfully; this verifies file structure and duration, not browser playback or spoken content. No exact spoken phrase has been verified in either recording. The Suica page's original WAV metadata is 24-bit, but the downloaded lossy preview has no equivalent PCM bit-depth claim.

Direct public preview URLs:

- https://cdn.freesound.org/previews/796/796687_13801325-lq.ogg
- https://cdn.freesound.org/previews/462/462725_36188-lq.ogg

SHA-256:

```text
d10764e72955047b4befa83e1572c8dafe0a7aea7ba833181a1787b370da661f  suica-ticket-gate-hinoki-owo.ogg
6616eabd3d1327e76f6025493c3e4d198dec8bc2ef000c8b9366e133332b4311  kyoto-main-hall-lg.ogg
```

## Exact Keihan Fushimi-Inari arrival announcement: unavailable in this pass

No downloadable recording with a verified reuse license **and** confirmed Fushimi-Inari arrival speech was located. This is a bounded research result, not a claim that none exists. No other station's voice, JR Inari announcement, text-to-speech, or unknown-license video rip was substituted. Therefore there is no verified spoken phrase or playable arrival-voice file to hand off.

Searches covered English/Japanese combinations of Keihan, Fushimi-Inari, 伏見稲荷駅, 放送, アナウンス, mp3, recording, license, and Creative Commons; targeted Freesound and Wikimedia Commons searches; railway announcement reference pages and official equipment information.

Useful candidates/reference limits:

- [Trinity101 — train.wav](https://freesound.org/people/Trinity101/sounds/70305/): genuine Kyoto Keihan-line train passing through an unspecified station, 11.805 s, **CC BY-NC 3.0**. Not downloaded/integrated because it introduces a noncommercial restriction; it does not establish Fushimi-Inari location or arrival speech.
- [TOA's Keihan installation report](https://www.toa.co.jp/works/transport/keihan): primary reference for multilingual station PA equipment; does not supply a reusable Fushimi-Inari announcement recording.
- [Keihan railway announcement collection](https://anntomo.image.coocan.jp/ann_tetsu_sound_keihan.htm): potential railfan contact/reference; fetch returned HTTP 403, so recording contents and reuse permission could not be verified. No file taken.
- [MrAuralization — Pedestrian Crossing Japan](https://freesound.org/people/MrAuralization/sounds/162144/): 21.752 s, CC BY 4.0, recorded near Fushimi Inari according to uploader. This is a **pedestrian crossing**, not a railway crossing alarm or station announcement. Not downloaded for the station scope.

The exact voice requires a correctly identified licensed recording or permission from a recording owner. Root can ship the recorded gate effect now while keeping arrival voice explicitly pending.

## Integration handoff

- Gate asset URL relative to `integrated-world/index.html`: `../assets/audio/recorded-station/suica-ticket-gate-hinoki-owo.ogg`.
- Load only after the user enables sound. Trigger on a successful gate passage edge, not every frame while in proximity; use bounded sources and existing mute/visibility controls.
- The ambient file is a research candidate, not approved for automatic integration. Its structure and license are verified; its acoustic fit and incidental speech are not.
- Playback, perceptual loudness, trimming to isolate the beep, and native browser timing require integration review. Record any subsequent edits in credits.

## Subsequent user-provided voices

The user supplied fushimi_jp.mp3 and Fushimi_enmp3.mp3 for Japanese-then-English arrival playback. They are now integrated as unchanged user-provided assets; the earlier public-search blocker no longer prevents the requested voice sequence. See recorded-station/arrival-voices.json.
