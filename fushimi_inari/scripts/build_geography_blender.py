"""Blender blockout from the SAME frozen geometry used by the web viewer.
Run: blender --background --python scripts/build_geography_blender.py
Never opens or overwrites fushimi_inari_master.blend.
"""
import json
import math
from pathlib import Path
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "geography"
OUT = ROOT / "outputs" / "geography"
OUT.mkdir(parents=True, exist_ok=True)
t = json.loads((DATA / "terrain.json").read_text())
features = json.loads((DATA / "features.json").read_text(encoding="utf-8"))
manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1
scene["geography_manifest"] = json.dumps(manifest, ensure_ascii=False)
scene["coordinate_contract"] = "meters; Blender [east, north, GSI elevation] = viewer [x,-z,y]; vertical exaggeration 1"


def ground(x, z):
    u = min(t["cols"]-1, max(0, (x-t["xmin"])/t["step"]))
    v = min(t["rows"]-1, max(0, (z-t["zmin"])/t["step"]))
    c, r = min(t["cols"]-2, math.floor(u)), min(t["rows"]-2, math.floor(v))
    a, b, i = u-c, v-r, r*t["cols"]+c
    h = t["heights"]
    if a+b <= 1:
        return h[i]+(h[i+1]-h[i])*a+(h[i+t["cols"]]-h[i])*b
    return h[i+t["cols"]+1]+(h[i+t["cols"]]-h[i+t["cols"]+1])*(1-a)+(h[i+1]-h[i+t["cols"]+1])*(1-b)


def mesh(name, verts, faces, color):
    data = bpy.data.meshes.new(name)
    data.from_pydata(verts, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.color = (*color, 1)
    return obj


verts = [(t["xmin"]+c*t["step"], -(t["zmin"]+r*t["step"]), t["heights"][r*t["cols"]+c])
         for r in range(t["rows"]) for c in range(t["cols"])]
faces = []
for r in range(t["rows"]-1):
    for c in range(t["cols"]-1):
        i = r*t["cols"]+c
        faces.extend([(i, i+t["cols"], i+1), (i+1, i+t["cols"], i+t["cols"]+1)])
terrain = mesh("GSI_DEM10B_Terrain_1to1", verts, faces, (.34, .43, .30))
terrain["source"] = manifest["sources"]["gsi"]
terrain["sampling_m"] = t["step"]

verts, faces = [], []
for path in features["paths"]:
    tags = path["tags"]
    if tags.get("tunnel") == "yes" or tags.get("bridge") == "yes":
        continue
    for a, b in zip(path["points"], path["points"][1:]):
        steps = max(1, math.ceil(math.hypot(b[0]-a[0], b[2]-a[2])/3))
        length = math.hypot(b[0]-a[0], b[2]-a[2])
        if length < .001:
            continue
        # Cartographic line, not a claim about measured road width.
        dx, dz = -(b[2]-a[2])/length*.7, (b[0]-a[0])/length*.7
        for s in range(steps):
            corners = []
            for f, side in [(s/steps, 1), ((s+1)/steps, 1), ((s+1)/steps, -1), (s/steps, -1)]:
                x, z = a[0]+(b[0]-a[0])*f+dx*side, a[2]+(b[2]-a[2])*f+dz*side
                corners.append((x, -z, ground(x,z)+.35))
            offset = len(verts)
            verts.extend(corners)
            faces.append(tuple(offset+i for i in range(4)))
paths = mesh("OSM_Path_Network_Cartographic_Lines", verts, faces, (.85, .66, .38))
paths["source"] = "OpenStreetMap contributors / ODbL; 1.4m display line, not surveyed width"

for sacred in (False, True):
    verts, faces = [], []
    for building in features["buildings"]:
        tags = building["tags"]
        is_sacred = tags.get("building") == "shrine" or tags.get("religion") == "shinto" or tags.get("amenity") == "place_of_worship"
        if is_sacred != sacred:
            continue
        ring = building["points"][:-1]
        try:
            height = float(tags["height"])
        except (KeyError, ValueError):
            try:
                height = float(tags["building:levels"])*3
            except (KeyError, ValueError):
                height = 4 if sacred else 6
        base = min(ground(p[0],p[2]) for p in ring)
        roof = max(ground(p[0],p[2]) for p in ring)+height
        offset, n = len(verts), len(ring)
        verts.extend((p[0],-p[2],base) for p in ring)
        verts.extend((p[0],-p[2],roof) for p in ring)
        for i in range(n):
            j = (i+1)%n
            faces.append((offset+i,offset+j,offset+n+j,offset+n+i))
        faces.append(tuple(offset+n+i for i in range(n)))
    obj = mesh("OSM_Sacred_Footprints" if sacred else "OSM_Surrounding_Buildings", verts, faces,
               (.65,.22,.12) if sacred else (.55,.59,.56))
    obj["height_status"] = "OSM height where available; otherwise levels*3m or inferred 4m sacred/6m ordinary. Blockout only."

camera_data = bpy.data.cameras.new("Geography_Review")
camera = bpy.data.objects.new("Geography_Review",camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.type = "ORTHO"
camera_data.clip_end = 10000
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "OBJECT"
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.display.shading.background_type = "WORLD"
scene.world = bpy.data.worlds.new("Geography_World")
scene.world.color = (.06,.09,.07)
scene.render.resolution_x = 1200
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "Standard"
for name, pos, target, scale in [
    ("overview",(-1000,-2100,1700),(580,320,100),3500),
    ("north-plan",(580,320,3500),(580,320,0),3500),
    ("east-slope",(3200,320,900),(580,320,100),3500),
    ("shrine-to-summit",(-1100,320,600),(580,320,100),3500),
]:
    camera.location = pos
    camera.rotation_euler = (Vector(target)-camera.location).to_track_quat("-Z","Y").to_euler()
    camera_data.ortho_scale = scale
    scene.render.filepath = str(OUT / f"{name}.png")
    bpy.ops.render.render(write_still=True)
camera.location = (-1000,-2100,1700)
camera.rotation_euler = (Vector((580,320,100))-camera.location).to_track_quat("-Z","Y").to_euler()
camera_data.ortho_scale = 3500
bpy.ops.wm.save_as_mainfile(filepath=str(DATA / "fushimi_geography.blend"))
print("GEOGRAPHY_COMPLETE", len(t["heights"]), "terrain samples;", len(features["paths"]), "source ways")
