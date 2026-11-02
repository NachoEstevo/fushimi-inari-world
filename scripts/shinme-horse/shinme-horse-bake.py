import bpy
import json
import sys

source_path, output_path = sys.argv[sys.argv.index('--') + 1:]
with open(source_path, encoding='utf8') as source_file:
    source = json.load(source_file)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
mesh = bpy.data.meshes.new('Editable Shinme source')
mesh.from_pydata(source['vertices'], [], source['faces'])
obj = bpy.data.objects.new('Shinme', mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=.0001)
bpy.ops.object.mode_set(mode='OBJECT')
mesh.remesh_voxel_size = .024
bpy.ops.object.voxel_remesh()
smooth = obj.modifiers.new('Soften anatomical joins', 'SMOOTH')
smooth.factor = 1
smooth.iterations = 3
bpy.ops.object.modifier_apply(modifier=smooth.name)
triangulate = obj.modifiers.new('Triangulate', 'TRIANGULATE')
bpy.ops.object.modifier_apply(modifier=triangulate.name)
decimate = obj.modifiers.new('Static triangle budget', 'DECIMATE')
decimate.ratio = min(1, 2100 / len(obj.data.polygons))
bpy.ops.object.modifier_apply(modifier=decimate.name)
result = {
    'vertices': [[v.co.x, v.co.z, -v.co.y] for v in obj.data.vertices],
    'faces': [list(p.vertices) for p in obj.data.polygons],
}
with open(output_path, 'w', encoding='utf8') as output_file:
    json.dump(result, output_file, separators=(',', ':'))
