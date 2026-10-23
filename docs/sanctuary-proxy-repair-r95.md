# R95 baseline Naihaiden–Honden public route conflict

## Evidence and diagnosis

All 24 R94/R95 sector audit records were identical, so the 50 blocked samples
per direction between Naihaiden and Honden were baseline conflicts. A fresh
read-only actual assembly CPU probe attributed the reported route examples to
`south_subshrine` at `[47.004965,12.902238]` and `shinmesha` at
`[64.578286,11.626332]`. These are **not** established restricted sacred-space
colliders. Public source ways `105449677` and `751194635` pass this area; no
mapped building footprint occupies those blocker positions.

The source is `legacy-builders.mjs`'s compressed illustrative south-east shrine
row: two groups at source X15.4/Z−24.8 and−29.8 plus the horse group at
X15.4/Z−35.2. Their inherited `precinct` scope chooses the nearest source
Naihaiden/Honden anchor, leaving these illustrative copies on the mapped public
route. The graph itself does not need redirection or deletion.

Real named replacement locations already exist north of the western stair:
Choja `305214359` at X73.682–76.866/Z−45.407…−41.144, Kada `305214367`,
Gosha row `305214365`, Ryogu `305214364`, plus dedicated southern horse
`305214599` around X95/Z−7. The latter four have dedicated existing owners.
Choja had only a generic mapped building fallback and therefore needs a real
mapped owner before its misplaced illustrative copy may be removed.

Fresh source checked:
[Pakutaso photo81555](https://www.pakutaso.com/20221009297post-42558.html),
published24October2022. Page names the left-to-right order Choja, Kada, Gosha,
Ryogu. The actual photograph was downloaded temporarily to
`.tmp/r95-choja-source.jpg` and visually inspected: Choja is the left narrow
red/white shrine with raised stone base, dark prayer front, gold hanging bell,
long front nagare roof and ridge across its width. This is appearance/category
evidence, not a calibrated survey or an exact restoration-period match.

## Narrow correction and APIs

`buildMappedChojaR95(root,features,materials,colliders,{terrainPositions})`
builds a conservative Choja interpretation inside its actual mapped roof
footprint. Returned `builtIds:['way/305214359']` may be excluded from generic
viewer fallback only on success. Actual rendered triangle samples seat its
foundation; a level front datum and buried lower skirt preserve the hillside
support. It retains actual physical podium/body colliders at the mapped shrine.
Red/white walls, dark front, small offering box, swept roof, ridge and bell are
photo-informed. Roof height/proportions and hidden side details remain inferred;
no invented lettering or carved exactness. Initial structural review closed
the plaster-to-roof side/back gaps and kept fascia inside the roof footprint.

`clearMisplacedSanctuaryProxiesR95(root,colliders,{anchors:spatial.anchors})`
then removes exactly the two old illustrative shrine groups and one horse
group, with their three paired old colliders. Before any mutation, it requires
positive mapped Choja/Kada/Gosha/Ryogu/horse owners, the original full geometry
signature, the exact transformed original source station, and exactly one
matching tagged collider per group. Any missing owner, changed signature,
duplicate or ambiguous pairing fails closed atomically. Unrelated groups,
colliders, actual replacement bodies and restricted owners remain intact.

Call after mapped row, dedicated south horse and mapped Choja builders, before
the existing `legacyShrineConflictRemoved` interactable pruning and before
static mesh batching. Removed source children receive that existing prune flag;
the routine is idempotent. No graph, public path coordinate, terrain grade,
access restriction or legitimate shrine collision is changed.

Three tests pass: exact targeted removal with unrelated owners/colliders
preserved; atomic missing-owner/signature/duplicate-pair failures and repeated
invocation; mapped Choja finite within-footprint geometry, seated foundation,
real physical colliders and missing-support protection. Root owns integration,
repeat actual sector/explicit route audits and visual review. No renderer or GPU
was started. No claim of route closure is made until those integration gates pass.

## Actual Choja eave correction

Inspected root's `outputs/r95-integrated/tamayama-choja-front.png`. The apparently
protruding flat eave was a real structural mismatch: exact exported-triangle
rays through pixels680/309 and740/309 hit the fascia, while its actual roof edge
was10.45cm above the fascia top (world50.4188 versus50.3143m). The initial roof
sampled only its two width endpoints, while the fascia used centre height.
The roof now samples twelve cross-width divisions and the fascia follows
twenty-four corresponding stations instead of one flat beam. Roof footprint
and public geometry remain unchanged. A fourth test samples actual emitted roof
triangles at the fascia top and requires <3cm separation; all four tests pass.
Root must refresh the fixed Choja-front view to accept the visible junction.
