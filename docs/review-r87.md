# R87 independent review

## R86 GPU follow-up — 2026-10-22

The earlier stopped-server blocker is superseded by the authorized running server at `127.0.0.1:8420`. An owned hidden CUA in-app browser tab opened `/outputs/r86-water/compile.html` successfully. The actual browser page reported:

- Three revision 164, WebGL2, seven compiled programs, no captured shader errors.
- 1,196 changed pixels between time samples.
- Maximum RGB of zero with all scene lights disabled; zero emissive on both water materials.

The reviewer inspected the rendered day canvas and used the Night control, then inspected its black canvas. This closes compilation, rendered animation and zero-light darkness for this isolated harness. The page renders a real instanced plane with shadows enabled; its `instancing` and `shadows` report fields are constants, not separate correctness assertions. No claim of quantitative shadow correctness, full-scene GPU cost, visual fidelity, shoreline quality or whole-world night acceptance follows from this harness.

## R87 module review

Inspected the approach, sanctuary and mountain modules and their adjacent ownership/builders. All ten tests in the three `*-context-r87.test.mjs` files passed independently. These validate geometry and ownership, not browser appearance. Integration and complete-world visual review are pending. No new runtime update loop or network asset was introduced in these modules. Approach adds four instanced batches and bounded colliders; sanctuary replaces the prior owner with two batches; mountain adds two small static batches.

Resolved finding: sanctuary facing front triangles initially had winding opposite the source outward normal. With the cloned FrontSide stone material, the exterior broad faces would be culled. The implementer reversed the front/skirt order and added a source-normal orientation regression. The reviewer inspected that correction and ran the new regression successfully. No remaining blocker found in the three modules at this checkpoint.

Integration requirement: sanctuary must run after the R77 source wall is built and before static batching removes its named owner. Otherwise its deliberate missing-owner guard returns null, silently leaving the R77 appearance in place. Source appearance/provenance claims were inspected as explicit estimates; this review did not independently verify the cited reference video or image.

## Integrated native browser follow-up

Reviewed the integration diff: sanctuary runs immediately after its R77 structural owner; approach follows existing boundary ownership; mountain follows Ainomine construction. No ordering blocker found.

Loaded `http://127.0.0.1:8420/integrated-world/index.html?audit=1` through an owned CUA Brave tab (IAB was unavailable in the later inventory). Initial loading temporarily occupied the page; it subsequently completed. Actual rendered pixels were inspected at the initial Temizuya overview, then Tamayama Inari and Ainomine via the visible menu's Destination/Teleport controls. All three destinations rendered architecture, terrain and trees; no blank canvas or application shader error was observed. This is a load/checkpoint smoke test, not a complete inspection of every new wall face or walking clearance.

Read-only DOM dataset counts from the loaded current assembly: approach 34 sections, four batches, 1,632 triangles and one mapped building/water omission; sanctuary 1,404 stones on 253 faces, two batches and 10,978 total triangles; mountain two batches, four primitives and 28 triangles. Initial overview reported 2,567 draw calls; no frame-time comparison was measured. Captured console diagnostics were browser wallet-extension warnings/errors with `chrome-extension://` origins; no application/Three error appeared in that captured output. Full walking and full-scene night acceptance remain unverified.

## Second cycle — Nōsatsusho pavilion

Read `nosatsusho-registration-r87.md` and inspected the local frontal `IMG_8455` and long-side `IMG_8449` source pixels. The module's north/south ridge, green gable, open upper side bays and low paling follow those observed architectural categories; precise cardinal registration and all heights remain inferred.

Module review confirms the existing mapped ring, including terminal endpoint E, owns the roof boundary. Footings use finite sampled terrain and a single horizontal architectural datum. The front gate is inset from E, leaving the public endpoint reachable; no public interior surface is registered. Four colliders preserve the restrictive gate/side/rear boundaries. `builtIds` is returned only after a successful group/collider commit, with empty IDs for missing/invalid/other-owner cases. Integration must consume that successful result to exclude the generic owner.

Resolved P2: front paper triangles initially faced inward and would be culled from the public south approach. The implementer reversed their winding. Six scoped tests pass independently, including roof plan area/upward normals, finite/nondegenerate geometry, endpoint clearance and blocked gate, ownership/idempotence, and open upper side bays. The front-paper ray regression was tightened to require the hit beyond the front depth, preventing the shared merged rear-wall mesh from yielding a false pass; the reviewer reran all six successfully. Native pavilion integration and walking are pending at this checkpoint.

Final integration follow-up: reviewed the pavilion call after office ponds and verified `excludesBuilding` consumes the returned `nosatsushoPavilion.builtIds`, preserving generic fallback when construction does not succeed. A fresh owned CUA Brave tab completed the final scene load and rendered the Temizuya overview. Read-only live dataset confirms pavilion owner `way/305214607`, endpoint `[118.929,49.35,-60.413]`, datum `49.44221997131434`, six material batches, four colliders and 4,751 triangles. This live triangle count supersedes the earlier implementer estimate of 4,211. Captured error output again contained only wallet-extension errors, with no application/Three error. Six final module tests passed again.

The viewer has no direct Nōsatsusho checkpoint in the inspected destination menu. This final browser pass confirms final assembly/load and success metadata, not a close native pavilion appearance check or a walk to/around its gate. Those remain unverified; the isolated collider/ray tests are not a substitute. No blocker found in the final integration diff.

Final root visual correction: compared actual front/east source photographs against the pavilion front render and reduced exaggerated roof sweep to a mostly linear pitch with bounded shallow sag. Final actual front render inspected again; one added profile regression passes. Full final suite: 291 tests pass. Native scene smoke test above precedes this final roof-profile-only adjustment; final profile was checked offline, not rewalked in browser.
