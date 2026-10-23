# R97 Kumataka review evidence

These are diagnostic renders of actual integrated Three.js geometry, exported after all R97 fixes and inspected by both root and the independent render reviewer. They are not generated illustrations or native browser screenshots. Blender 5.2 used one CPU process, six threads, 960 × 640 pixels and twelve samples. Geometry and camera placement are authoritative for this review; simplified colors omit native material textures, alpha-cutout leaves and custom shaders. White railing and foliage in these images are material stand-ins, not the intended browser colors.

## Preserved-camera comparison

|View|Before R97|Final R97|
|---|---|---|
|Arrival|[Before](before-arrival.png)|[After](kumataka-arrival.png)|
|Aerial|[Before](before-aerial.png)|[After](kumataka-aerial.png)|

The baseline water rose across the scene and obscured geometry. The final aerial shows one flat lower pond and the registered pavilion beside a clear path. The public approach retains its existing grade and steps.

## Final detail views

- [Court](kumataka-court.png): corrected pavilion orientation, continuous roof and rear-gable enclosure; supported basin shelter outside the lane.
- [Pond edge](kumataka-pondedge.png): removed floating log and unsupported trees; added dry-rooted opposite-bank woodland and low growth.
- [Shoreline reverse](kumataka-shoreline.png): attached slatted railing, supporting stone pier and closed roof end. This additional camera looks back from the pond toward the shrine and was not substituted for a baseline comparison camera.

The first rendered correction round was rejected because it exposed the floating log, open rear gable and sparse opposite bank. Those defects were addressed, freshly exported and rendered again. Final five-view inspection found no additional concrete geometry failure requiring this iteration to remain open. Native appearance, movement input and FPS remain unverified; these images do not establish complete historical fidelity. The bank's terrain profile and individual tree locations are inferred, and its wooded backdrop can receive further photographic refinement after the user's pause.

## Reproducible evidence

- [Camera poses](cameras.json) preserve the positions, targets and lenses.
- [Builder reports](build-reports.json) identify the successful water, registration, roof and vegetation owners.
- [Actual CPU audit](accepted-actual-audit.json) contains route, geometry, interaction and vegetation checks.
- [Independent review](accepted-cpu-review.md) explains the exact ownership and support findings.
- [Source hashes](source-sha256.json) bind the changed production sources and mapped features to this evidence; the recorded base commit contains unchanged dependencies.
- [Test result](tests.txt): 550 passing tests, zero failures.

See the [R97 production report](../precinct-production-r97.md) and [photographic references](../kumataka-references-r97.md) for scope, provenance and limits. External source photographs are linked, not republished in this package. Large exports and intermediate Blender files remain in local `outputs/r97-kumataka/` rather than the review commit.
