"""Derive a small integration asset; never save or alter the source blend."""
from pathlib import Path
import bpy
from mathutils import Matrix

root = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root / "fushimi_inari_master.blend"))
prefixes = ("Z01_", "T00_", "T01_Retaining_", "Romon_Step_", "Romon_Stair_")
for obj in list(bpy.data.objects):
    if obj.type != "MESH" or not obj.name.startswith(prefixes):
        bpy.data.objects.remove(obj, do_unlink=True)
# Keep original geometry, UVs, materials and meters. Batch only for rendering.
groups = {}
for obj in list(bpy.data.objects):
    bpy.context.view_layer.objects.active = obj
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    name = obj.data.materials[0].name if obj.data.materials else "Default"
    groups.setdefault(name, []).append(obj)
for name, objects in groups.items():
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    obj.data.transform(obj.matrix_world)
    obj.matrix_world = Matrix.Identity(4)
out = root / "integration-demo"
out.mkdir(exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out / "romon-original.glb"),
                          export_format="GLB", export_apply=True)
print("ROMON_DEMO_EXPORTED", len(groups), "material batches")
