# R94 independent route/reference review

23 October 2026. No new viewer or GPU browser was opened. The initial scope was reference-only; root subsequently assigned the supplemental CPU route audit described below.

## Evidence actually inspected

- Live [official precinct page](https://inari.jp/trip/map01/): named topology and Okusha beyond Senbon, with Omokaru at the right/rear. Text inspection supplies identity, not dimensions.
- Live [Okumiya guide](https://fushimiinari-guide.com/okumiya/) and [Nosatsusho guide](https://fushimiinari-guide.com/nosatsusho/): Honden's left/north public approach passes beside Gonden, climbs to Tamayama, then splits right toward Okumiya/Senbon and left toward Yashima/Nosatsusho.
- Saved source pixels `fushimi_inari/outputs/r90-tamayama/streetview-south-180.png`: June 2012 Tamayama at left, separate large gate ahead, mineral court, western stair falling right, densely wooded bank and low boundary. Temporary market stalls are not permanent building evidence.
- Saved user-video pixels `fushimi_inari/outputs/r77/video-0625.png`: player visibly reads 06:25, [iqK2tg-TxbY](https://youtu.be/iqK2tg-TxbY?t=385). Paved passage through large gate between Okumiya on left and separate roofed fitting right. Reinspection of a saved frame is not fresh playback or a continuous route review.
- Requested [video at 00:11](https://youtu.be/iqK2tg-TxbY?t=11) returned metadata only; [zFKeYi0AK0M](https://www.youtube.com/watch?v=zFKeYi0AK0M) failed fetch. No new video pixels claimed.

## Concrete findings

1. Existing sector audit chooses a shortest route; it cannot certify both parallel Senbon ways. The new `r94-route-audit.mjs` explicitly samples `way/260121328` and `way/377968455` independently, forward and reverse. Existing `spatial.test.mjs` separately checks graph connectivity; that is not physical clearance.
2. Tamayama-to-Okumiya needs its own physical audit. Supplemental audit follows the registered contiguous six-way chain `1133055117 → 297888105 → 1133055118 → 1133055119 → 626313768 → 1392716577`. It does not substitute the separate lower south route `1385037576`, invent shortcuts or enter the closed shrine body.
3. Largest known withheld building remains Shinsenjo: current integration explicitly reports `built:false` because southeast ground exceeds proposed roof. Rear bridge `1385037575` remains source-blocked as documented in R93; no appearance source establishes its deck and endpoint connection. These are completeness limits; foliage or veranda refinements do not resolve them.
4. New R94 modules reviewed independently preserve narrow ownership and label inferred dimensions. Omotesando markings use actual shared mapped node; Romon strip does not mirror an unsupported south strip; Honden veranda avoids inventing a box; upper-access foliage describes inferred pockets. Source-exact dimensions and assembled visibility remain unverified.

## Supplemental audit API and tests

`auditR94Routes(features, walkHeight, obstacles, {spacing:.25, laneOffsets:[-.3,0,.3]})` uses production callbacks and returns connected-source/missing-source/disconnected-source status, then per-direction lane sample counts, height jumps, collision corrections and invalid values. Default requested offsets contain centreline only. Tamayama–Okumiya additionally requires offsets ±0.6m because its photographed central rail occupies the centreline; requested centre/±0.3m records remain visible as diagnostics. Root owns calling this with assembled runtime surfaces/colliders. It mutates no scene or source record. Clear sampled lanes are not a full-width, doorway, headroom or native walking proof.

Four focused Node tests pass: exact ways/chain sampled in both directions; the central divider remains diagnostic while obstruction of either required side lane fails; obstructed alternate tunnel cannot hide behind its neighbour; missing/disconnected sources and invalid height/collision outputs fail closed. Final added-file diff inspected. No native visual acceptance is claimed here.

### Actual upper-flight obstruction classification

Root's assembled `outputs/r90/r94-explicit.json` found 51 obstructed centre samples on the upper flight, while ±0.3m records were below the audit threshold. A separate CPU probe using the actual integration and individual production colliders (`outputs/r90/r94-rail-probe.mjs`, output `r94-rail-probe.json`) checked five stations between X103.39 and X113.67. Every detected collider was tagged `okumiya_dividing_rail`; no building or tree caused those tested corrections. Its owner is `tamayama-stair-rail.mjs`, using `way/626313768`. The mapped source explicitly carries `handrail:center=yes`.

Saved source pixels `outputs/r77/video-0605.png` were freshly inspected: the visible 06:05 frame shows broad granite stairs and the brown twin-tube central divider, with walking space both sides. This is intentional geometry and must remain solid. The collider plus player-radius envelope is approximately 0.383m from the centre, so ±0.3m can still produce small collision correction despite passing the existing 0.35m failure threshold. Required ±0.6m samples avoid this ambiguity; diagnostics retain the occupied centreline evidence. Root must refresh the actual integrated report with these required lanes before accepting passage.

## Direct Okusha source packet supplied to its owner

Live [Neagari guide](https://fushimiinari-guide.com/neagari-no-matsu/) links [Okusha frontage](https://fushimiinari-guide.com/wp-content/uploads/DSC_0616-2_20190205.jpg), [onward mountain path](https://fushimiinari-guide.com/wp-content/uploads/P3600516_20190205.jpg), and [Senbon entrance reverse context](https://fushimiinari-guide.com/wp-content/uploads/P3600642_20190205.jpg). First and third image fetches timed out here. [Official Okusha photo](https://inari.jp/wp/wp-content/themes/inari/images/trip/map01/okusyahouhaisyo.jpg) and onward-path fetches succeeded, but no pixel inference is made from their metadata. Receiving owner must inspect pixels before using them to justify construction. R94 rest-building gables follow inherited dimensions, not a freshly measured photographic survey.
