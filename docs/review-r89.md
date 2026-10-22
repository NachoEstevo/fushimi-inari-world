# R89 independent review

## Scope

Review Yotsutsuji, Takeya frontage and Kyoya additions, preserving domain ownership and source registration. Native walking verification is a separate acceptance item from scripted collision sweeps and checkpoint teleports. This reviewer owns only this document.

## Native walking attempt

Owned CUA Brave tab loaded the R88 local `?audit=1` viewer. Visible menu/checkpoint teleport starts walk; held W/S keys and native drag were used. Camera positions were observed read-only from the DOM dataset; no hidden scene-state mutation was used.

- Okusha: W movement from `[258.54,64.23,71.33]` through `[258.30,64.23,70.58]` to `[257.93,64.23,69.83]`. Native drag changed view. E attempts produced no panel at those aims; successful interaction remains unverified there, without diagnosing a picking failure.
- Mitsutsuji: W movement from `[556.33,104.63,-335.52]` to `[561.11,104.38,-332.70]` then `[564.27,104.14,-330.84]`, followed by S reverse to `[561.78,104.32,-332.31]`. Actual close lane/canopy pixels were inspected. Movement and following ground height were observed without a local block. This is a short lane sample, not a completed route or all-boundaries collision pass.
- Kumataka: W movement from `[534.68,68.15,-128.13]` to `[535.14,68.15,-128.89]`. Native drag aimed toward the pavilion, then E successfully displayed `Kumataka-sha and Shin-ike`, its description and historical-accuracy disclaimer. Both accessibility output and actual screenshot confirmed the panel.

No pointer lock was required. These observations close basic native movement at the three sites and one real Kumataka interaction. Whole-itinerary walking, Okusha interaction activation and close lakeside-rail passage remain unverified. No FPS claim is made from key-hold duration or travel distance.

## First module review checkpoint

Yotsutsuji retaining helper: registered source edge guarded against polygon reorder; new body and stones stay inside the annex footprint, follow finite toe samples and preserve existing forecourt/bench/route ownership. Resolved review issue: initial retaining top inset 0.33 m did not reach the original facade (inside extent 0.11 m). Top now reaches inset 0.10 m with a downward ray contact regression at 0.105 m across four stations. Four focused tests pass independently after correction.

Mitsutsuji apron alternative: Kyoya construction deferred because its sloping source frontage cannot support the photographed level facade without unresolved threshold registration. The narrow north/left mineral collar uses actual emitted path sections (including flat individual treads), clips mapped buildings/water/transverse paths and registers walking heights from its own emitted triangles. Existing tread/centreline heights and terrain data remain unchanged. Four focused tests pass independently. Full assembled/native appearance remains pending; these tests use a synthetic local seam fixture.

Takeya frontage: exact concave source ring, east-facing mapped front, grade guard, bounded recess and source-owner success IDs inspected. Resolved test failure: one clipped roof sliver collapsed to coincident vertices in Float32 storage. Builder now filters using the actual quantized vertices; unchanged strict upward/area/degeneracy tests all pass independently (five tests). Adjacent main-route/interaction ownership and missing-source fail-safe tests pass. Actual entrance/counter photographic pixels were inspected; an unrelated temporary food image was identified and is not architectural evidence.

The apron gained explicit terrain clipping for emitted paving masks; its fifth test validates preserved source DEM planes outside owned patches. All five apron tests pass independently. A narrow earth-shoulder ownership callback also suppresses the previous overlapping earth owner only for the two target source IDs on side -1, preserving prior exclusions.

Resolved P1 native final-load blocker: viewer accessed `assembly.mitsuFrontageAprons.clipTerrain`, but integration placed that record in `inventory` and omitted it from its actual returned assembly. Fresh load and explicit reload both showed the visible `Cannot read properties of undefined (reading clipTerrain)` error. Root corrected the actual return, added a producer/consumer contract audit and bumped `89-final2`; final2 subsequently loaded successfully. Historical errors remain in the tab log, but no application error appeared after the successful final2 load. Passing earlier module/repository tests had not covered this mismatch.

## Final2 native review

All 16 final focused module tests passed independently (six Takeya, six apron/shared-renderer, four retaining). Live DOM reports Takeya 5,435 triangles, seven batches, 22 colliders, 0.045 m maximum threshold rise; north apron 982 triangles/one batch over two source IDs; Yotsutsuji retaining 345 triangles/four batches, 43 stones, top 163.45 m and minimum toe 160.334903 m.

Final2 native Mitsutsuji walk reached `[561.56,104.32,-332.43]`; actual grey mineral seam replaces the earlier sawtooth brown wedges. Resolved native visual finding: narrow bright boundary slot came from the apron outer edge using raw terrain +0.014 m while rendered terrain uses -0.06 m. The final outer edge now matches rendered terrain exactly; the reviewer inspected the correction and independently reran all six apron tests, including the 0.074 m offset regression. Root reports the final offline seam render has no exposed slot. No additional native reload of that last height-only correction was performed. Nishimura-tei UI entry rendered and W movement changed camera `[801.41,165.95,-213.32]` to `[803.19,166.01,-211.40]`; this native view did not expose the close downhill retaining face, whose contact was reviewed through geometry/rays and offline renders.

Takeya native approach W reached `[537.71,68.15,-133.14]`. Native drag exposed the new timber/glazed frontage and observed `竹屋` letters, readable and nonmirrored. Resolved integration finding: legacy repeated memorial steles visibly occupied the new shop opening/recess. Root-authorized cleanup matches exact noninteractive legacy row dimensions/positions/types, then requires positive-area overlap of each transformed actual mesh footprint with the mapped Takeya ring. Ten steles, four foxes and four bibs were removed; other owners and all colliders retained. Seven focused tests pass independently. Fresh `89-clearance` native load confirmed 18 cleared meshes in live metadata; W/drag close view at `[536.54,68.15,-131.19]` shows the previous interior stele absent and the dark doorway clear. Exterior row stones remain outside the shop footprint. Full gate-geometry audit from owner reports zero actual Takeya triangle contacts with 0.05 m padding despite 14 coarse bounding-box candidates.

R89 review closure: no remaining confirmed blocker in the corrected scope. Native walking was sampled locally, not across the whole itinerary; close native downhill retaining-face review, Okusha interaction activation and night acceptance remain gaps. Historical/photographic exactness, hidden shop roof massing and deferred Kyoya frontage registration remain outside verified completion.
