# R30 — Precinct details and first interactions

## Reference review

- User walking tour: https://www.youtube.com/watch?v=zFKeYi0AK0M . Paused at
  11:49: a seated stone kitsune, pointed ears, elongated muzzle, upright tail,
  orange bib and tiered pedestal. Early approach footage also shows paired
  guardians, lanterns, planted terraces and freestanding notices around Rōmon.
  Early seeking did not give a reliable timestamp, so none is asserted here.
- User close-up `codex-clipboard-85932d86-685f-45ba-a0ab-47ac17addb60.png`
  supplies the same fox silhouette. It is a shape reference, not a measured plan.
- [Official shrine explanation](https://inari.jp/about/history/num04/) identifies
  foxes as messengers associated with Inari. They are not dogs or cats.

No new trail connectivity was inferred from isolated frames. The mapped route
network and previous terrain work are retained. The video still needs a segment
log tying side passages and notices to mapped junctions before moving them.

## Implemented

- Two old cone placeholders on the existing Omotesando pedestals replaced with
  seated fox forms: muzzle, ears, front legs, paws, tail and orange bib. Pedestal
  placement remains inherited and unverified; these are not surveyed replicas.
  The detailed original Rōmon guardians are retained.
- Two existing temizuya ladles can lift, tilt and return using **E**, then
  **Lift and pour water**. Existing basin, water material and ambient sound remain.
- Four existing bell/rope assemblies gain finite sway and **Ring the bell**.
- One original, deliberately provisional upper-body attendant at the reception
  window demonstrates a commemorative stamp. The paper receives a small red mark;
  this is neither an official goshuin nor a downloadable souvenir.
- New actions use English labels, a seven-metre range check, and reject repeated
  triggers while active. Animation updates run only within 70 metres. There are
  no added model downloads, dependencies, crowds, skeletal mixers or GPU contexts.
- Interactive moving objects are retained outside the existing static merge.

## People asset shortlist — not imported

| Candidate | Evidence available | Remaining checks |
| --- | --- | --- |
| [Kimono Girl — Hellcutter](https://sketchfab.com/3d-models/kimono-girl-7c89fea2d8524431acd146f54fe8e58d) | Search listing offers download with CC Attribution | Detail page returned 403; inspect actual licence package, visual style, rig, polygon count and texture sizes |
| [Kimono — adityajaiswal9968](https://sketchfab.com/3d-models/kimono-b430ef733f7b4052aff820ea7864c66d) | Listing: CC Attribution, 14.7k triangles, 7.5k vertices | Clothing only; inspect topology, garment fit, attribution and licence package |

These are leads, not approved production assets. No real employee likeness is
represented. Staff roles and dress need shrine-specific references; generic
Buddhist robes are not an appropriate default for this Shinto setting.

Next asset pass: approve one realistic rigged visitor and one staff variant;
record licence/author/source per file, use shared textures and distance LOD,
then verify seated/standing scale and hand contact at the counter. Keep crowds
disabled until a measured frame-cost comparison exists.

## Verification and limits

- 78 Node tests pass, including activity retrigger/completion behavior and the
  existing route, stairs, collision and movement regressions.
- Same native browser tab reused. Walked from the Temizuya and reception
  checkpoints, opened each with E and triggered its action. Walked up the
  Ichinomine front stairs and triggered the rope action. Visual inspection found
  and corrected a lower garment projecting through the counter and a hair cap.
- Runtime inventory: two foxes, two ladles, four bells, one attendant. All three
  action panels and their responses were observed in the real viewer.
- One Ichinomine render sample: 165 reported FPS, 3.58 ms submission, 702 calls,
  3,080,911 triangles at 975×812, DPR 1. This is a point sample, not a benchmark
  or a claim of performance on other hardware.
- Local screenshots: `fushimi_inari/outputs/r30/` (ignored QA output).
- Sound callbacks are wired to the existing audio setting; audible quality was
  not independently assessed. No new field recordings were added.
- The figure remains a visible placeholder, the foxes need sculptural refinement,
  and signs, every side path, exact placements and individual stair heights are
  not closed by this revision. No claim of a complete digital twin.
