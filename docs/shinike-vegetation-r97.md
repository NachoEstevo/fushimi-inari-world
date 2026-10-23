# R97 Shin-ike rooted legacy vegetation correction

## Verified ownership

The root's actual audit `outputs/r97-kumataka/trunk-roots-in-water.json` identifies
three legacy trunk roots inside mapped Shin-ike: `[563.793518,68.515243,-123.538750]`
(shore1.397m), `[558.678223,67.515449,-116.880966]` (shore7.941m), and
`[533.113037,66.254249,-104.193565]` (shore1.165m). The middle tree exceeds the
actual bank owner's maximum4m inset and is unsupported over open water. The
other two require an actual collar ray intersection before changing height;
shore distance alone does not establish a dry bank.

Source `legacy-builders.mjs` constructs exactly370 shared trunks: indices0â€“259
are sugi, each with two crowns at2i/2i+1 in the520-instance sugi mesh. Indices
260â€“369 are momiji, each with crown i-260 in the110-instance momiji mesh.
Those original references are `legacy.foliage[0..2]`. Every tree starts with its
trunk origin25cm below sampled ground and its corresponding crown positions
use the same X/Z and scale. Crown source vertical/scale formulas are verified
before any action, including source tilt-independent trunk scale decomposition.

## API and behavior

`repairShinikeVegetationR97(root,legacy,shinikeReport,colliders)` must run AFTER
geographic relocation, final R97 water/collar construction and prior legacy tree
clearance, BEFORE extendForest and instance partition/LOD. It returns an
idempotent report under `root.userData.shinikeVegetationR97`.

The function requires source instance counts370/520/110 and identity owner
transforms (the actual geographic transforms reside in instance matrices).
It requires the exact owned R97 bank mesh and its parent's `userData` identity
with the passed successful water report. Missing or altered ownership withholds
all work. No tree is selected from crown bounds, canopy overlap, mesh color or
a broad proximity sweep: only trunk ROOTS strictly inside the actual water
polygon become candidates.

For each candidate, known source-index crowns must match root X/Z within3mm,
source crown scale ratios within0.0002, and expected vertical source separation
within4mm. Exact `tree` cylinder colliders at the root must additionally match
source radius `.38*scale`; ambiguity or a differing same-root radius withholds
that complete tree. No collider is required when none exists.

Only the actual bank mesh is raycast, downward on CPU. A hit above water+4cm
provides a dry support height. Move the verified trunk, all its indexed crowns
and any exact corresponding collider together by the same vertical delta,
retaining the original25cm root burial. X/Z, source rotations, scales and colors
remain unchanged. A candidate beyond maximum bank inset+5cm with NO dry collar
hit is removed as one whole tree: trunk, its exact crown index pair (or single
momiji crown), and exact corresponding collider. A verified candidate with an actual collar hit at or below water+4cm is a
known wet-toe tree, so its complete owned trunk/crown/collider set is removed.
Nearbank candidates with NO actual collar hit remain explicitly skipped for
review instead of removed; absent support evidence is not treated as wet support.

Stable in-place compaction preserves every retained matrix/color and source
order, changing only active counts. It adds no geometry, material, draw batch,
light, update loop or dependency; it recomputes affected mesh bounds after the
construction-time correction. Prior zero-scale suppression is retained, not
revived. No water, bank, route or walking height is edited.

## Verification and remaining gate

Six tests pass. Literal ACTUAL audited trunk matrices are embedded so tests do
not depend on ignored audit outputs; fixture crowns follow the verified source
index/scale/height formulas. Two localized bank patches exercise seating of
both nearbank trees while the openwater complete tree is removed. Tests compare
every retained trunk and crown matrix/color, verify paired deltas and exact
collider removal, reject ambiguous ownership/changed source counts, preserve
unsupported nearbank roots and separately cover the one-crown momiji branch.
Expected three-root fixture counts are369 trunks,518 sugi crowns,110 momiji
crowns, with zero added batches. `git diff --check` passes.

These are ownership/geometry tests, not claims about actual integrated bank
heights. Root must inspect the actual integration report for collar hits and
source pairing, then rerun its actual water-root audit and final CPU/native
visual gate. No renderer, local browser, 3D export process or commit was opened
by this packet. Only this new module, its test and this document are owned here.

## Actual integration follow-up and wet-toe regression

Root's fresh actual audit verified sugi source66/crowns132–133 over open water
and sugi52/crowns104–105 on a dry collar hit67.026606m. It also verified momiji273
at `[533.113037,66.254249,-104.193565]`, but its actual collar hit was
65.33566748m against water65.31450325m: only21.164mm above the water. This is
positive wet-toe evidence, not an unknown missing ray. Leaving that tree at its
old origin would float it about0.919m above the new bank.

The bounded rule now removes such a verified whole tree and its one exact
momiji crown13 and corresponding exact `tree` collider. It never removes an
unverified pair or a nearbank tree with absent ray evidence. The focused new
regression embeds the actual momiji root matrix, source273/crown13 ownership and
the measured wet collar level, checks exact paired removal/color preservation,
and independently asserts absent-hit nearbank roots still skip. Six tests pass;
actual integrated re-audit remains root-owned. No integration, renderer or commit
was touched.
