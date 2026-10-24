# R100 Shinsenjo north interface: door axis, mineral continuity and bank separation

Research only. Responsibility: this document and `outputs/r100-north/`.
No production, integration, terrain, renderer, 3D instance or local browser was
used. The northern rejected portion remains rejected; this packet does not
convert photographs into invented heights.

## New specific registration gain

The last mapped service approach is `way/751194636`, from
A`[65.088,13.314]` to B`[65.326,20.483]`. Continuing its PLAN AXIS, without adding
an actual path, intersects the registered Shinsenjo north face
`[62.744,22.064]→[82.047,21.674]` at
**D`[65.376721,22.010808]`**,1.528650m beyond B.

This is stronger than a generic 'door somewhere aroundX65–66': the actual2016
front well image has the Shinsenjo door behind and image-LEFT of the well. A
north-looking-south view places east/+X to image-left. D atX65.377 is east of
well centerX62.133, matching the source relationship. It also aligns with the
actual mapped terminal stub. D is a strong photo/map-correspondence candidate,
not a surveyed door center, opening width or permission to extend public access.

`outputs/r100-north/interface-register.json` records the axis construction and
keeps door floor/width, threshold rise, court floor and wall height explicitly
NULL. No original feature Y values are adopted as architectural elevations.

## Actual sources inspected

Re-inspected actual accepted source pixels:

- `outputs/r99-shinsenjo/well-court-2016.jpg` and `well-detail-2016.jpg`, from
  [2016 firsthand account](https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/).
  Direct [front-well photo](https://image.space.rakuten.co.jp/d/strg/ctrl/9/b4e858385778f35133247959df718c9f8b3882a2.77.2.9.2.jpeg).
  The door-to-well direction is explicit. Ground around the closed well is gray
  mineral gravel; a narrower slab approach leads to the timber door. A shallow
  visible threshold/platform is a separate interface from the surrounding
  exterior ground. There is no visible broad stair flight or exposed high bank
  across this particular door approach. Pixel resolution does not measure the
  small rise or prove exact coplanarity.
- `outputs/r99-shinsenjo/mikoshiko-court-2016.jpg`: mineral corridor alongside
  Mikoshiko continues toward the background Shinsenjo front; no major bank
  cuts its visible walking center. This establishes continuous circulation
  CATEGORY, not the hidden building's whole417.88m² floor datum.
- `outputs/r99-shinsenjo/elevator-court-2021.jpg`,
  [direct source](https://www.goriluckey.com/wp-content/uploads/IMG_5749_20210412.jpg):
  visible court, slab borders and storehouse toe form an exterior mineral
  interface; local rough stone/vegetation bank and upper timber boundary appear
  behind the access/gate side. The bank is a separate edge, not a reason to
  slope the entire court into an unbounded hill or make every floor identical.
  This photo does not show the west well threshold in the same calibrated view.

New independent actual photographic pixels:

- `outputs/r100-north/kyotofukoh-mikoshiko.jpg`,
  [direct image](https://kyotofukoh.jp/kyotofukohs8em033411.jpg), captioned Mikoshiko
  on [Kyotofukoh precinct record](https://kyotofukoh.jp/report166.html).
  The300×200 frontal image shows the long door bank, close fence, narrow low
  mineral/paved toe and dense background woodland. It corroborates the bounded
  exterior frontage and absence of a tall bank through that visible strip.
  It does not show the well or enough Shinsenjo threshold detail to supply
  height. The page's historical building descriptions are not grade evidence.
  Original HTML and image hash are saved under `outputs/r100-north/`.

Article/filename dates are historical context, not verified current restoration
or camera survey. Search results about upper-mountain Gozendani wells, the western
handwashing stone, unrelated named wells, or the separate Otabisho storehouse
were rejected as different objects. No new video playback is claimed.

## Distinct physical interfaces, not one guessed floor

1. **Exterior mineral court and slab approach:** visibly continuous as ground
   surfaces near the well/door corridor; current paths and accepted well/Mikoshiko
   owners are the height authority. Do not replace them with a universal flat
   plane inferred from the photographs.
2. **Shinsenjo threshold:** visible shallow transition at the door. The PLAN
   candidate D above can register where a witness should be checked, but its
   rise/width remain unmeasured. A step cannot be sized from these400px sources.
3. **Interior/whole Shinsenjo floor:** hidden and not established by seeing a
   shallow north threshold. No source here justifies activating the disabled
   full compound or propagating the local approach datum through its south wing.
4. **Bank/retaining boundary:** physically separate from the circulation center.
   The2021 visible rough stone edge cannot automatically be identified as the
   mapped eastern retaining wall1385037578 without a shared photographic control.
   The live wall line is registered in PLAN but its height/high side still lack
   measurements. Do not turn an image-left bank into a guessed line behind every
   building or use OSM way direction as a height contract.

## Why this helps the currently withheld north portion

The accepted R99 north proposal is bounded by well roof east edgeX63.948,
Mikoshiko west boundX73.545, well south boundZ19.537 and Shinsenjo's north wall.
D lies inside that horizontal range and supplies a meaningful door-axis witness,
rather than an arbitrary center sampled across the whole court.

The cached R99 full-stitch result for `well-to-north-face` is
area18.474262548m² versus covered18.469415619m², relief0.186078732m and maximum
gradient0.129213927. These are HISTORICAL CPU-probe values read from
`outputs/r99-shinsenjo/full-stitch-replan.json`, not a fresh R100 assembled run.
They fail coverage as well as the original.18m/.10 gradient guards. The new
photographs do not authorize simply relaxing those guards because the relief
miss is small. Nor does the photographed mineral surface make actual holes or
overlapping triangle coverage disappear.

## Concrete next implementation/verification contract

Keep the same original WHOLE north proposal and the existing source owner cuts.
First trace actual final terrain-triangle coverage around the registered D/B
approach: identify any missing/overlapping polygon after named well, existing
slab paths, Mikoshiko court, tamagaki and prior solids are cut. Distinguish a
real covered paving owner from a geometric hole; do not overlay both.

Use explicit witness chain A→B→D for directional comparisons, while retaining
B as the authoritative mapped path endpoint. Inspect actual final exterior
triangle heights immediately around D and north of the wall before assigning
any threshold interface. A north-face facade/threshold must remain a separate
registered owner until its height agrees with that ground. This is a diagnostic
contract, not a new walk-graph connection or a terrain-flattening instruction.

Only if the unchanged complete north portion meets original coverage/relief/
slope gates may its mineral material owner be admitted. If actual slope fails,
report the failing triangle/witness and maintain the rejection. Never carve a
convenient tiny passing fragment and call the whole court solved. The source
supports mineral continuity and localized small threshold, not a numerical
floor replacement.

This narrows the next task to a registered door/approach interface and exact
coverage/gradient causes; it does not merely repeat the old unknown whole-floor
gap. No wall height, elevator travel, bridge deck level or southern grading is
supplied or invented by this research packet.
