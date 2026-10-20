import os
import math
import bpy
import bmesh
from mathutils import Matrix, Vector

BASE_DIR = r"d:\GithubProjects\3Dexploration\fushimi_inari"
BLEND_PATH = os.path.join(BASE_DIR, "fushimi_inari_master.blend")
OUT_GLB = os.path.join(BASE_DIR, "assets", "models", "Fushimi_Inari_Interactive_Fast.glb")

bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)

# 1. Remove duplicate/blocking objects so only the authentic Lower Precinct architecture remains:
#    - Remove Z04_* (Stage 03 Senbon Torii, replaced by the full mountain trail in Three.js)
#    - Remove Env_*, Light_Gobo_*, Global_Atmosphere_*, Z01_Topiary_*, Z01_Plaza_Shrub_*, T03_Slope_*
#    - Remove oversized 52m-wide slabs (T00_Approach_Plaza, T01_Main_Court_Slab, T02_Sanctuary_Slab)
#    - Remove Z03_Tamagaki_* (which previously boxed in the Honden and blocked lateral passage)
REMOVE_PREFIXES = (
    "Volume_Box",
    "Global_Atmosphere",
    "Light_Gobo",
    "Env_Cedar",
    "Env_Bamboo",
    "Env_Canopy",
    "Z01_Topiary",
    "Z01_Plaza",
    "T03_Slope",
    "Z04_",
    "T00_Approach_Plaza",
    "T01_Main_Court_Slab",
    "T02_Sanctuary_Slab",
    "Z03_Tamagaki",
)

to_remove = []
for obj in list(bpy.data.objects):
    if obj.type != "MESH":
        to_remove.append(obj)
        continue
    if any(obj.name.startswith(pfx) or pfx in obj.name for pfx in REMOVE_PREFIXES):
        to_remove.append(obj)

for obj in to_remove:
    bpy.data.objects.remove(obj, do_unlink=True)

print(f"Removed {len(to_remove)} helper/duplicate objects.")


# 2. Helper to build clean, metric-UV courtyard terraces, lateral bypass avenues, and stairs
#    in Blender's (+X processional, +Y North/Left, +Z Up) space before rotating +90 deg around Z.
def ensure_metric_uv(obj, scale_m=2.0):
    if obj.type != "MESH" or not obj.data.polygons:
        return
    mesh = obj.data
    if "UVMap_Metric_1m" not in mesh.uv_layers:
        uv_layer = mesh.uv_layers.new(name="UVMap_Metric_1m")
    else:
        uv_layer = mesh.uv_layers["UVMap_Metric_1m"]
    mesh.uv_layers.active = uv_layer

    bm = bmesh.new()
    bm.from_mesh(mesh)
    uv_lay = bm.loops.layers.uv.get("UVMap_Metric_1m") or bm.loops.layers.uv.active
    for face in bm.faces:
        n = face.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for loop in face.loops:
            v = loop.vert.co
            if az >= ax and az >= ay:
                u, w = v.x / scale_m, v.y / scale_m
            elif ax >= ay:
                u, w = v.y / scale_m, v.z / scale_m
            else:
                u, w = v.x / scale_m, v.z / scale_m
            loop[uv_lay].uv = (u, w)
    bm.to_mesh(mesh)
    bm.free()


def add_walkway_box(name, size_xyz, loc_xyz, mat_name, uv_scale=2.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx, sy, sz = size_xyz
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(0.012, min(sx, sy, sz) * 0.18), segments=2, profile=0.5)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc_xyz
    mat = bpy.data.materials.get(mat_name)
    if mat:
        mesh.materials.append(mat)
    ensure_metric_uv(obj, uv_scale)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# Build authentic walkable Fushimi Inari Taisha terraces & lateral Senbon Torii Sando corridors:
# T00 Approach Plaza (X=-23..-2.5, Y=-18..18, top Z=0.0)
add_walkway_box("Walk_T00_Gravel_Court", (21.0, 36.0, 0.40), (-13.0, 0.0, -0.20), "MAT_Courtyard_Gravel_Dark", uv_scale=2.5)
add_walkway_box("Walk_T00_Flagstone_Center", (20.0, 9.2, 0.05), (-12.5, 0.0, 0.01), "MAT_Flagstone_Walkway", uv_scale=2.0)

# T01 Main Precinct Courtyard (X=-2.5..19.6, Y=-18..18, top Z=1.60)
add_walkway_box("Walk_T01_Gravel_Court", (22.2, 36.0, 1.65), (8.5, 0.0, 0.775), "MAT_Courtyard_Gravel_Dark", uv_scale=2.5)
# Wide Flagstone Bypass Avenues on North (Left, Y=+9.2) and South (Right, Y=-9.2) around Ge-haiden!
for side_s, y_ave in [(1, 9.2), (-1, -9.2)]:
    tag = "North" if side_s > 0 else "South"
    add_walkway_box(f"Walk_T01_Bypass_Ave_{tag}", (21.5, 5.2, 0.05), (9.2, y_ave, 1.62), "MAT_Flagstone_Walkway", uv_scale=2.0)
# Transverse Flagstone Plazas in front of Ge-haiden (X=4.8) and behind Ge-haiden (X=18.4) connecting the lateral avenues
add_walkway_box("Walk_T01_Cross_Front", (4.2, 23.6, 0.05), (4.8, 0.0, 1.62), "MAT_Flagstone_Walkway", uv_scale=2.0)
add_walkway_box("Walk_T01_Cross_Rear", (3.2, 23.6, 0.05), (18.2, 0.0, 1.62), "MAT_Flagstone_Walkway", uv_scale=2.0)

# Lateral Bypass Staircases (X=19.6..22.2, Z=1.6..3.2) on North (Y=+9.2, width 5.4m) & South (Y=-9.2, width 5.4m)
for side_s, y_st in [(1, 9.2), (-1, -9.2)]:
    tag = "North" if side_s > 0 else "South"
    for s in range(9):
        sx = 19.6 + (s + 0.5) * (2.6 / 9.0)
        sz_top = 1.6 + (s + 1) * (1.6 / 9.0)
        h_step = sz_top - 1.55
        add_walkway_box(f"Walk_Bypass_Step_{tag}_{s:02d}", (2.6 / 9.0 + 0.04, 5.4, h_step), (sx, y_st, 1.55 + h_step * 0.5), "MAT_Granite_Stone_Moss", uv_scale=1.8)

# T02 Sanctuary Terrace (X=22.2..39.5, Y=-14.5..14.5, top Z=3.20)
add_walkway_box("Walk_T02_Sanctuary_Court", (17.4, 29.0, 1.70), (30.8, 0.0, 2.35), "MAT_Granite_Stone_Moss", uv_scale=2.5)
# Wide Flagstone Corridors flanking Nai-haiden & Honden along Y=+9.2 and Y=-9.2 (X=22.2..39.5, Z=3.22)
for side_s, y_cor in [(1, 9.2), (-1, -9.2)]:
    tag = "North" if side_s > 0 else "South"
    add_walkway_box(f"Walk_T02_Honden_Bypass_{tag}", (17.4, 5.0, 0.05), (30.8, y_cor, 3.22), "MAT_Flagstone_Walkway", uv_scale=2.0)
# Transverse Flagstone Plaza behind Honden (X=38.0..41.5, Y=-11.8..11.8, Z=3.22) converging into Senbon Torii Approach!
add_walkway_box("Walk_T02_Rear_Convergence_Plaza", (3.8, 23.6, 0.06), (39.6, 0.0, 3.22), "MAT_Flagstone_Walkway", uv_scale=2.0)

# Low decorative vermilion fence ONLY directly alongside Honden inner sanctum (X=29.5..38.0, Y=+-6.6),
# leaving X=22.2..29.5 (Nai-haiden front plaza) AND Y=+-6.8..+-14.0 (5m wide lateral avenues) 100% OPEN!
for side_s, fy in [(1, 6.6), (-1, -6.6)]:
    add_walkway_box(f"Walk_Honden_SideRail_{side_s}", (8.5, 0.14, 1.15), (33.8, fy, 3.2 + 0.575), "MAT_Vermilion_ShuIro", uv_scale=1.0)


# 3. Reload updated PBR textures from disk
for img in bpy.data.images:
    try:
        img.reload()
    except Exception:
        pass


# 4. Apply all modifiers and group meshes by material name
bpy.ops.object.select_all(action="DESELECT")
mat_groups = {}
for obj in list(bpy.data.objects):
    if obj.type == "MESH":
        bpy.context.view_layer.objects.active = obj
        for mod in list(obj.modifiers):
            try:
                bpy.ops.object.modifier_apply(modifier=mod.name)
            except Exception:
                pass
        mat_name = obj.data.materials[0].name if obj.data.materials else "MAT_Default"
        mat_groups.setdefault(mat_name, []).append(obj)

print(f"Grouping {sum(len(v) for v in mat_groups.values())} meshes into {len(mat_groups)} material batches...")

rot_z90 = Matrix.Rotation(math.pi * 0.5, 4, "Z")

for mat_name, objs in mat_groups.items():
    if not objs:
        continue
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = f"Batch_{mat_name}"
    joined.data.name = f"Mesh_{mat_name}"

    # Transform mesh into world space and rotate +90 deg around Z in Blender
    # so that Blender (+X processional, +Y North/Left, +Z Up) exports to Three.js as:
    #   x_three = -Y_old (Left = -X, Right = +X)
    #   y_three = +Z_old (Elevation in meters)
    #   z_three = -X_old (Processional axis from z=+21.5 Outer Torii -> z=0 Romon -> z=-12.5 Gehaiden -> z=-34 Honden -> z=-40 Senbon Torii)
    joined.data.transform(rot_z90 @ joined.matrix_world)
    joined.matrix_world = Matrix.Identity(4)

bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=False,
    export_apply=True,
    export_texcoords=True,
    export_normals=True,
    export_materials="EXPORT",
)
print("Exported aligned interactive GLB:", OUT_GLB, "Size MB:", round(os.path.getsize(OUT_GLB) / (1024 * 1024), 2))
