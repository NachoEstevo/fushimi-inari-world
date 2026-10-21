# Visitor models

Author: Quaternius. Pack: Ultimate Animated Character Pack (November 2019).
License: CC0 1.0, as published by the author on OpenGameArt.

- Source and license: https://opengameart.org/content/animated-characters-pack
- Archive: https://opengameart.org/sites/default/files/ultimate_animated_character_pack_by_quaternius.zip
- Downloaded: 2026-10-20
- License text: https://creativecommons.org/publicdomain/zero/1.0/legalcode

Selected sources: Casual_Male.blend, Casual_Female.blend, Kimono_Female.blend.
Adaptations: smaller head mesh, skin/hair/face/clothing materials, GLB conversion
with the original Idle skeletal animation. World instances use different heights
and animation phases. These stylized figures do not depict actual shrine staff.

Rebuild with `fushimi_inari/scripts/export_visitors.py` using Blender 5.2 with
`--disable-autoexec`. Only the selected GLBs are shipped; the source archive is
kept in ignored local outputs. Export limits weights to four influences per vertex.
Unused finger tracks from the source action do not have corresponding bones and
are omitted by the exporter; the exported body rig has 69 animation channels.

The reception instance reuses Kimono_Female with ivory/red materials, smaller hands
and a procedural two-bone reach layered over Idle for the commemorative stamp.
This wardrobe and gesture are interpretive, not a surveyed staff uniform or ritual.
