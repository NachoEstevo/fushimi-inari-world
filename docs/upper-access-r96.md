# R96 Okumiya main stair north woodland

## Source audit and sector ownership

Inspected all three actual June 2012 Street View pixels at
`outputs/r95-references/okumiya-{downhill,side-landing,front-landing}-streetview-2012.png`.
They show substantial mature woodland enclosing both sides of the main flight,
with crowns behind the landing shrines and lanterns. Downhill image-right is
north/-Z in the mapped eastbound stair frame. Root's R95 owner supplies south/+Z
stone balustrade and three wooded pockets; R94 supplies the east/onward pocket.
The north/-Z bank between Tamayama and upper landing has no dedicated R94/R95
vegetation owner. Global forest may already own individual trunks there.

Refreshed [Okumiya guide](https://fushimiinari-guide.com/okumiya/) on this pass.
Its route/photos place the right turn after Tamayama, further stair, two landing
shrines and onward torii route consistently. Historical video source is
[iqK2tg-TxbY](https://youtu.be/iqK2tg-TxbY?t=365); this packet uses saved actual
Street View frames and prior documented paused video references, not a new
continuous video playback or a claim of a current surveyed state.

Whole-zone omissions were checked before adding objects. Stair treads and centre
wooden handrail, low north coping, south open stone fence, roofed lantern/plinths,
foxes, drain, Byakkosha/Okumiya shrine bodies and mineral court all have existing
owners. They must not be duplicated. Source red slat enclosure wraps more than
the single near-precinct return, but exact remaining run registration needs an
assembled camera check: this packet does not guess a closed fence. Dense foliage
hides the bank ground, so exposed rock stations cannot be substantiated here and
no random boulder scatter is added.

## Coordinated additions

`upper-access-r96.mjs` adds three related missing bank layers:

1. Mature broadleaf forked trunks, branch masses and layered cutout crowns close
   the north flank background along the complete flight, with 9.5–10.4m inferred
   heights for the three normally accepted stations.
2. Four explicit basal buttresses per accepted trunk follow actual triangle
   heights at root, midpoint and toe. This gives steep-bank attachment instead
   of vertical poles with exposed bases. Their forms are interpretive botanical
   details supported by mature-tree presence, not individually resolved roots.
3. Dense irregular understory fills the lower bank behind existing boundary
   architecture, with all actual leaf vertices filtered outside route/roof
   envelopes and all crowns and low growth also filtered around prior solids and torii footprints.

Candidate root stations are `[98.5,-25.8]`, `[103.5,-25.4]`, `[109,-28.1]`,
`[117,-31.5]`. The first is withheld by real mapped public-route/roof clearance
in the fixture; it is retained as an explicit rejected candidate rather than
silently relocating a tree. Locations, botanical forms and dimensions are
inferred. No surveyed inventory or source-exact botanical claim is made.

## API and limits

`buildUpperAccessR96(root,features,surfaces,materials,colliders,{terrainPositions})`
returns `{built,trees,roots,growth,skipped,triangles,drawBatches,newColliders,...}`.
Call after resolved walking surfaces, rendered terrain and prior solid/tree/
torii owners. Every root uses rendered triangle sampling only. Existing box or
cylinder colliders suppress duplicate trunks; buttress midpoint/toe clearance
and support are independently checked. Required material is existing wood/timber/
roof; foliage reuses existing cutout material. No dependency, light, animation,
terrain edit or route-height edit is introduced. Calls are idempotent.

Seven tests pass with real mapped feature geometry: static/finite budget and
idempotence; every foliage vertex versus routes and roofs; prior forest owner
suppression; missing/partial triangle support; authoritative widened resolved
route exclusion; basal root slope contacts and suppression with preowned trunks; all actual leaf vertices versus a prior torii post footprint.
Typical fixture: 3 trees, 12 buttresses, 960 low foliage cards, 6,168 triangles,
2 static batches, 3 trunk colliders. Integration may skip existing forest roots.

No base/shared integration file was changed, no commit made, and no Blender,
GPU or local browser opened. Root owns integration, final terrain/collider audit,
canopy silhouette against reference cameras, leaf appearance, night state and
performance acceptance. This packet improves the missing north-bank enclosure;
it does not certify full Tamayama–Okumiya visual completion.

## Follow-up boundary registration

The requested second investigation is now recorded in
`docs/upper-enclosure-r96.md` with a separate `upper-enclosure-r96.mjs` owner.
Fresh front/rear guide photographs and the known Street View camera resolve the
red boundary to Byakkosha's wooded north/east edges while ruling out a red loop
behind main Okumiya. A bounded three-return proposal is implemented and tested;
its inferred endpoint registration remains a root visual acceptance gate.
