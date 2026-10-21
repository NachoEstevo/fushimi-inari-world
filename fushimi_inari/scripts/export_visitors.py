"""Convert selected CC0 Quaternius source characters to compact web GLBs.
Run Blender with --disable-autoexec and pass source/output directories after --.
"""
import bpy
import sys
from pathlib import Path
from mathutils import Vector

source, output = map(Path, sys.argv[sys.argv.index('--') + 1:])
output.mkdir(parents=True, exist_ok=True)
for name in ('Casual_Male', 'Casual_Female', 'Kimono_Female'):
    bpy.ops.wm.open_mainfile(filepath=str(source / (name + '.blend')))
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    arm.animation_data_clear()
    for action in list(bpy.data.actions):
        if action.name not in ('Idle', 'Walk', 'PickUp'):
            bpy.data.actions.remove(action)
    for mesh in (o for o in bpy.data.objects if o.type == 'MESH'):
        group = mesh.vertex_groups.get('Head')
        if group:
            pivot = arm.data.bones['Head'].head_local
            for vertex in mesh.data.vertices:
                weight = next((g.weight for g in vertex.groups if g.group == group.index), 0)
                vertex.co = pivot + (vertex.co - pivot) * (1 - .24 * weight)
    for mat in bpy.data.materials:
        color = tuple(mat.diffuse_color)
        if mat.name == 'Skin': color = (.58, .36, .22, 1)
        if mat.name == 'Face': color = (.025, .018, .013, 1)
        if mat.name == 'Hair': color = (.035, .023, .018, 1)
        if name == 'Kimono_Female' and mat.name == 'Clothes': color = (.34, .17, .22, 1)
        mat.use_nodes = True
        mat.node_tree.nodes.clear()
        bsdf = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = .85
        out = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
        mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bpy.context.scene.frame_set(0)
    arm.animation_data_create()
    arm.animation_data.action = bpy.data.actions.get('Idle')
    arm.animation_data.action_slot = arm.animation_data.action.slots[0]
    bpy.ops.export_scene.gltf(filepath=str(output / (name + '.glb')), export_format='GLB',
        export_animations=True, export_animation_mode='ACTIVE_ACTIONS', export_force_sampling=True,
        export_extras=False, export_cameras=False, export_lights=False)
    print('EXPORTED', name)
