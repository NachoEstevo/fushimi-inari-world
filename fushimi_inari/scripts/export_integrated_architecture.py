"""Export individually anchored buildings, preserving source dimensions and details."""
from pathlib import Path
import bpy
from mathutils import Matrix
from math import pi
root = Path(__file__).resolve().parents[1]
out = root / "integrated-world"
out.mkdir(exist_ok=True)
zones = {
    "romon": ("Z01_", "T00_", "T01_Retaining_", "Romon_Step_", "Romon_Stair_"),
    "gehaiden": ("Z02_",),
    "naihaiden": ("Z03_Naihaiden_", "Z03_StairLantern_", "Sanctuary_Step_", "Sanctuary_Stair_"),
    "honden": ("Z03_Honden_", "Z03_Tamagaki_"),
}
for name, prefixes in zones.items():
    bpy.ops.wm.open_mainfile(filepath=str(root / "fushimi_inari_master.blend"))
    for obj in list(bpy.data.objects):
        if obj.type != "MESH" or not obj.name.startswith(prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)
    groups = {}
    for obj in list(bpy.data.objects):
        bpy.context.view_layer.objects.active = obj
        for modifier in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        mat = obj.data.materials[0].name if obj.data.materials else "Default"
        groups.setdefault(mat, []).append(obj)
    for mat, objects in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects)>1:
            bpy.ops.object.join()
        obj = bpy.context.object
        obj.name = mat
        obj.data.transform(Matrix.Rotation(pi/2,4,"Z") @ obj.matrix_world)
        obj.matrix_world = Matrix.Identity(4)
    bpy.ops.export_scene.gltf(filepath=str(out / f"{name}.glb"),export_format="GLB",export_apply=True)
    print("EXPORTED",name,len(groups))
