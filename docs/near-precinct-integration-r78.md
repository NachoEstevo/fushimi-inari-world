# R78 integrated near-precinct reconstruction

Integrated the four mapped subsidiary pavilions, white rear screen, short red Okumiya screen and two inferred grated drains after final surface grading. Built pavilion IDs suppress generic context extrusions; absent or skipped footprints retain their prior context fallback. No dependencies or per-frame animation were added.

## Evidence and corrections

Reviewed the saved June 2012 Street View landing capture and the user walking video at 06:25 (https://www.youtube.com/watch?v=iqK2tg-TxbY&t=385s). Roof footprints are mapped; heights, screen offsets, finishes and drainage stations remain inferred. See the three R78 component provenance notes.

The first combined row render exposed an incorrect roof direction. Corrected ridges to run front-back, with curved front gables facing the terrace. Rebuilt and inspected the combined scene again. Four pavilions build without skips, all four generic extrusions are excluded, and both drains build against the final walking surface. Enclosures use four merged material batches; drains use three instanced batches. No measured FPS improvement is claimed.

## Verification

- 237 Node tests pass across integrated-world and geography.
- Actual full integrate() plus actual viewer path geometry and adaptive terrain exported without nonfinite vertices or collider numbers.
- Five Blender geometry review angles inspected: row, Tamayama, Okumiya, Gonden and overview. These use simplified materials and stubbed image loading, not browser shader/texture parity.
- Local HTTP server restarted; index responds HTTP 200.
- Scoped final diff reviewed; unrelated README and social metadata edits preserved.

## Remaining acceptance gaps

Native browser walking and FPS were not verified in this pass. Existing terrace grade/seam irregularities remain visible near Tamayama; adding architecture does not resolve those earlier terrain transitions. The broad raised terrace/stair proportions, historic ornamental details and exact enclosure positions still require refinement. This is an integrated architectural increment, not a claim of complete or survey-exact replication.

Ignored evidence: fushimi_inari/outputs/r78/{audit.mjs,audit.json,render.py,*-review.png,tests.txt}.
