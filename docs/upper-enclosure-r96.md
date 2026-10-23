# R96 Byakkosha wooded boundary registration

## Second source pass

This packet explicitly revisits the largest unresolved boundary omission after
`upper-access-r96`: the landing's red slat fence. It does not use uncertainty as
an excuse to fill a perimeter. Actual root Street View frames were re-inspected:
`outputs/r95-references/okumiya-front-landing-streetview-2012.png`,
`okumiya-side-landing-streetview-2012.png`, and downhill. The front frame shows
red open slats behind the small Byakkosha and beside its wooded shoulder. It
also shows a different stone fence behind the main shrine. The red runs must
therefore be registered to the smaller northern shrine, not a generic loop
around both buildings.

Fresh public guide photos were fetched and their actual pixels inspected:
[front, IMG_6623_20210309](https://fushimiinari-guide.com/wp-content/uploads/IMG_6623_20210309.jpg)
and [rear, IMG_6630_20210309](https://fushimiinari-guide.com/wp-content/uploads/IMG_6630_20210309.jpg).
Local copies are `outputs/r96-upper-references/okumiya-{front,rear}-guide-2021.jpg`.
The rear image is decisive: the MAIN Okumiya rear has open gravel at its raised
stone foundation, not a red fence loop. The photograph also confirms that the
smaller shrine stands beyond its northern side. The front source shows red
slats at the torii-facing side; that short southern return already belongs to
`near-precinct-enclosures` and is not repeated here. Sources mix June 2012 and
March 2021 states; exact period consistency remains unverified.

## Registration and explicit inference

The manifest defines X east, Z south, origin `[34.96714,135.77267]`, Earth radius
6378137 and equirectangular longitude scale cos(origin latitude). Root's supplied
Street View camera `[34.9672975,135.7739711]` converts to local
`[118.6917969,-17.5328198]`. Heading 90 looks east. Mapped Byakkosha
`way/301527731`, bounds X121.821–127.176 Z-28.843–-25.804, is image-left/north;
main Okumiya `way/301527733`, bounds X120.325–128.699 Z-20.182–-11.021, is
image-right/south. The actual R95 integrated aerial and camera JSON were
inspected to confirm that this interpretation matches the authored assembly.

The proposed bounded U fragment uses Byakkosha's mapped bounds and inferred
photo offsets. It has three deliberately incomplete woodland-facing returns:

| Run | Start X,Z | End X,Z |
| --- | --- | --- |
| north woodland | 117.421,-30.493 | 128.976,-30.493 |
| rear/east of Byakkosha | 128.976,-30.493 | 128.976,-21.904 |
| short west shoulder | 117.421,-30.493 | 117.421,-26.143 |

These coordinates are a reviewable photo-based proposal, not measured fence
endpoints. West offset 4.4m and east offset 1.8m are relative to the mapped
Byakkosha walls; north offset1.65m and south termination3.9m similarly derive
from its bounds. The whole southern forecourt and southwest stair-to-shrine
mouth remain open. No crossbar closes the public approach; no red main-shrine
rear perimeter is invented. The existing short southern return retains its
owner.

## API, actual support and acceptance

`buildUpperEnclosureR96(root,features,network,materials,colliders,{terrainPositions})`
is idempotent and returns `{built,runs,sections,skipped,triangles,drawBatches,
newColliders,...}`. Use final rendered terrain and resolved walking segments.
Build after existing solid, lantern, statue and enclosure owners, BEFORE new
R96 foliage so those plants can exclude its boundary colliders.

Sections are at most .75m long. Their complete cap/base footprint is removed
on any resolved route or actual junction-triangle overlap, conservative 1.25m
roof-envelope overlap or prior solid conflict. All four terrain contact corners
must exist; base follows the highest sample while stone foot extends8cm below
the lowest. There is no DEM fallback, path-height edit, runtime loop, added
light, dependency or texture. Existing stone, vermilion and roof materials form
three static batches. Open .062m slats, .145m approximate spacing and1.425m total
height are inferred from source appearance. Horizontal rails and dark cap sit
above a low stone base, with one boundary collider per accepted section.

Five tests pass: bounded registered topology/open forecourt; every full section
versus real mapped public paths and conservative roofs; no unsupported or prior
owner duplication; authoritative resolved junction triangles; mapped endpoint
registration. `git diff --check` passes. A separate nonrendered probe loaded the
ACTUAL `outputs/r95-integrated/tamayama.json` terrain mesh named
`Actual clipped rendered terrain at -0.06`: all34 proposed sections have support,
base elevations51.7432–53.5718m,3,672 triangles/3 batches. This establishes
rendered-plane seating only; it does not prove final assembly collision or
reference-matched fence location.

Root owns visual source-camera validation and may adjust inferred endpoints
following that view. No native render, Blender/GPU or local browser was opened,
no base/shared file edited and no commit made. Full source-exact sector
acceptance remains incomplete until the new boundary is reviewed in assembly.
