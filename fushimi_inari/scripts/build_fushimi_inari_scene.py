import bpy
import bmesh
import math
import os
import sys
import json
import numpy as np
from mathutils import Vector, Matrix, Euler

BASE_DIR = r"d:\GithubProjects\3Dexploration\fushimi_inari"
SPEC_PATH = os.path.join(BASE_DIR, "scene-spec.json")
TEX_DIR = os.path.join(BASE_DIR, "assets", "textures")
MODEL_DIR = os.path.join(BASE_DIR, "assets", "models")
OUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

with open(SPEC_PATH, "r", encoding="utf-8") as f:
    SPEC = json.load(f)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh, do_unlink=True)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat, do_unlink=True)


def get_or_create_collection(name, parent=None):
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    col = bpy.data.collections.new(name)
    if parent is None:
        bpy.context.scene.collection.children.link(col)
    else:
        parent.children.link(col)
    return col


def link_to_collection(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


def ensure_metric_uv(obj, scale_m=1.0):
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


def ensure_cylinder_uv(obj, height_m=3.0, radius_m=0.15):
    """
    Fix Ticket T04 (Specialist 03):
    Place UV seam on the +X back face so the -X camera-facing surface maps cleanly
    to u = 0.50 without seam discontinuity, and enable smooth shading.
    """
    mesh = obj.data
    if "UVMap_Metric_1m" not in mesh.uv_layers:
        uv_layer = mesh.uv_layers.new(name="UVMap_Metric_1m")
    else:
        uv_layer = mesh.uv_layers["UVMap_Metric_1m"]
    mesh.uv_layers.active = uv_layer

    bm = bmesh.new()
    bm.from_mesh(mesh)
    uv_lay = bm.loops.layers.uv.get("UVMap_Metric_1m") or bm.loops.layers.uv.active
    zs = [v.co.z for v in bm.verts]
    zmin, zmax = min(zs), max(zs)
    dz = max(0.01, zmax - zmin)
    for face in bm.faces:
        face.smooth = True
        u_vals = []
        for loop in face.loops:
            v = loop.vert.co
            # Seam at +X (v.x > 0, v.y = 0); -X camera face is u = 0.50
            ang = (math.atan2(v.y, -v.x) + math.pi) / (2.0 * math.pi)
            u_vals.append(ang)
        # Prevent wrap-around across seam on back face
        if max(u_vals) - min(u_vals) > 0.5:
            u_vals = [u + 1.0 if u < 0.5 else u for u in u_vals]
        for loop, u in zip(face.loops, u_vals):
            vv = (loop.vert.co.z - zmin) / dz
            loop[uv_lay].uv = (u, vv)
    bm.to_mesh(mesh)
    bm.free()


# ==============================================================================
# MATERIALS (5-CHANNEL PBR + CALIBRATED LINEAR ALBEDO + WEAR NODES)
# ==============================================================================
MATERIALS = {}


def create_pbr_material(name, tex_folder=None, base_rgba=(0.55, 0.04, 0.01, 1.0), rough=0.30, metal=0.0, emission_strength=0.0, wear_tint=None, bump_noise_scale=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (900, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (550, 0)
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    bsdf.inputs["Base Color"].default_value = base_rgba
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal

    if emission_strength > 0.0:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = base_rgba
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength

    uv_node = nodes.new("ShaderNodeUVMap")
    uv_node.uv_map = "UVMap_Metric_1m"
    uv_node.location = (-750, 0)

    # Procedural micro-roughness grunge (Visual Guidelines Category 2: LINEAR_LIGHT factor 0.28)
    noise_grunge = nodes.new("ShaderNodeTexNoise")
    noise_grunge.inputs["Scale"].default_value = 18.0
    noise_grunge.inputs["Detail"].default_value = 6.0
    noise_grunge.location = (-450, -320)
    links.new(uv_node.outputs["UV"], noise_grunge.inputs["Vector"])

    # Pointiness edge wear mask
    geom_node = nodes.new("ShaderNodeNewGeometry")
    geom_node.location = (-450, 320)
    ramp_wear = nodes.new("ShaderNodeValToRGB")
    ramp_wear.location = (-180, 320)
    ramp_wear.color_ramp.elements[0].position = 0.48
    ramp_wear.color_ramp.elements[1].position = 0.64
    links.new(geom_node.outputs["Pointiness"], ramp_wear.inputs["Fac"])

    if bump_noise_scale > 0.0 and not tex_folder:
        n_bump = nodes.new("ShaderNodeTexNoise")
        n_bump.inputs["Scale"].default_value = bump_noise_scale
        n_bump.inputs["Detail"].default_value = 8.0
        n_bump.location = (-200, -450)
        links.new(uv_node.outputs["UV"], n_bump.inputs["Vector"])
        bump_node = nodes.new("ShaderNodeBump")
        bump_node.inputs["Strength"].default_value = 0.55
        bump_node.inputs["Distance"].default_value = 0.02
        bump_node.location = (180, -450)
        links.new(n_bump.outputs["Fac"], bump_node.inputs["Height"])
        links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])

    if tex_folder:
        folder_path = os.path.join(TEX_DIR, tex_folder)
        bc_path = os.path.join(folder_path, f"{tex_folder}_BaseColor.png")
        rg_path = os.path.join(folder_path, f"{tex_folder}_Roughness.png")
        mt_path = os.path.join(folder_path, f"{tex_folder}_Metallic.png")
        nm_path = os.path.join(folder_path, f"{tex_folder}_Normal.png")

        if os.path.exists(bc_path):
            tex_bc = nodes.new("ShaderNodeTexImage")
            tex_bc.image = bpy.data.images.load(bc_path)
            tex_bc.location = (-400, 150)
            links.new(uv_node.outputs["UV"], tex_bc.inputs["Vector"])

            if wear_tint:
                mix_bc = nodes.new("ShaderNodeMix")
                mix_bc.data_type = "RGBA"
                mix_bc.blend_type = "MIX"
                mix_bc.inputs["Factor"].default_value = 0.16
                mix_bc.inputs[7].default_value = wear_tint
                mix_bc.location = (180, 180)
                links.new(ramp_wear.outputs["Color"], mix_bc.inputs["Factor"])
                links.new(tex_bc.outputs["Color"], mix_bc.inputs[6])
                links.new(mix_bc.outputs[2], bsdf.inputs["Base Color"])
            else:
                links.new(tex_bc.outputs["Color"], bsdf.inputs["Base Color"])

        if os.path.exists(rg_path):
            tex_rg = nodes.new("ShaderNodeTexImage")
            tex_rg.image = bpy.data.images.load(rg_path)
            tex_rg.image.colorspace_settings.name = "Non-Color"
            tex_rg.location = (-400, -80)
            links.new(uv_node.outputs["UV"], tex_rg.inputs["Vector"])

            mix_rg = nodes.new("ShaderNodeMix")
            mix_rg.data_type = "RGBA"
            mix_rg.blend_type = "LINEAR_LIGHT"
            mix_rg.inputs["Factor"].default_value = 0.28
            mix_rg.location = (180, -80)
            links.new(tex_rg.outputs["Color"], mix_rg.inputs[6])
            links.new(noise_grunge.outputs["Fac"], mix_rg.inputs[7])
            links.new(mix_rg.outputs[2], bsdf.inputs["Roughness"])

        if os.path.exists(mt_path):
            tex_mt = nodes.new("ShaderNodeTexImage")
            tex_mt.image = bpy.data.images.load(mt_path)
            tex_mt.image.colorspace_settings.name = "Non-Color"
            tex_mt.location = (-400, -260)
            links.new(uv_node.outputs["UV"], tex_mt.inputs["Vector"])
            links.new(tex_mt.outputs["Color"], bsdf.inputs["Metallic"])

        if os.path.exists(nm_path):
            tex_nm = nodes.new("ShaderNodeTexImage")
            tex_nm.image = bpy.data.images.load(nm_path)
            tex_nm.image.colorspace_settings.name = "Non-Color"
            tex_nm.location = (-400, -480)
            links.new(uv_node.outputs["UV"], tex_nm.inputs["Vector"])

            nm_node = nodes.new("ShaderNodeNormalMap")
            nm_node.inputs["Strength"].default_value = 0.90
            nm_node.location = (180, -450)
            links.new(tex_nm.outputs["Color"], nm_node.inputs["Color"])
            links.new(nm_node.outputs["Normal"], bsdf.inputs["Normal"])

    MATERIALS[name] = mat
    return mat


def init_materials():
    # Linear-calibrated physically accurate materials (Ticket T01 across all 4 Specialists)
    create_pbr_material("MAT_Vermilion_ShuIro", "Vermilion_ShuIro", (0.56, 0.032, 0.008, 1.0), 0.28, 0.0, wear_tint=(0.24, 0.04, 0.01, 1.0))
    create_pbr_material("MAT_Torii_Kanji_Column", "Torii_Kanji_Column", (0.56, 0.032, 0.008, 1.0), 0.28, 0.0)
    create_pbr_material("MAT_Hiwadabuki_Bark_Roof", "Hiwadabuki_Bark_Roof", (0.025, 0.018, 0.014, 1.0), 0.80, 0.0, wear_tint=(0.06, 0.045, 0.035, 1.0))
    create_pbr_material("MAT_Granite_Stone_Moss", "Granite_Stone_Moss", (0.18, 0.18, 0.17, 1.0), 0.82, 0.0, wear_tint=(0.09, 0.14, 0.07, 1.0))
    create_pbr_material("MAT_Gold_Kanagu_Leaf", "Gold_Kanagu_Leaf", (0.85, 0.55, 0.08, 1.0), 0.18, 0.94)
    create_pbr_material("MAT_Black_Lacquer_Nemaki", None, (0.012, 0.012, 0.015, 1.0), 0.28, 0.20)
    create_pbr_material("MAT_White_Shikku_Plaster", None, (0.78, 0.74, 0.68, 1.0), 0.78, 0.0)
    create_pbr_material("MAT_Copper_Patina_Green", None, (0.06, 0.26, 0.16, 1.0), 0.45, 0.30, bump_noise_scale=24.0)
    create_pbr_material("MAT_Dark_Bronze_Kitsune", None, (0.045, 0.050, 0.045, 1.0), 0.34, 0.72)
    create_pbr_material("MAT_Kitsune_Red_Bib", None, (0.55, 0.02, 0.02, 1.0), 0.60, 0.0)
    create_pbr_material("MAT_Sudare_Bamboo_Blind", None, (0.24, 0.14, 0.06, 1.0), 0.74, 0.0, bump_noise_scale=65.0)
    create_pbr_material("MAT_Straw_Shimenawa", None, (0.38, 0.26, 0.10, 1.0), 0.85, 0.0, bump_noise_scale=35.0)
    create_pbr_material("MAT_Blue_Hengaku_Plaque", None, (0.015, 0.04, 0.14, 1.0), 0.32, 0.15)
    create_pbr_material("MAT_Lantern_Warm_Glow", None, (0.98, 0.82, 0.52, 1.0), 0.25, 0.0, emission_strength=2.2)
    create_pbr_material("MAT_Pebble_Jari_Dark", None, (0.035, 0.036, 0.040, 1.0), 0.88, 0.0, bump_noise_scale=90.0)
    create_pbr_material("MAT_Flagstone_Walkway", None, (0.26, 0.25, 0.24, 1.0), 0.64, 0.0, bump_noise_scale=16.0)
    create_pbr_material("MAT_Courtyard_Gravel_Dark", None, (0.095, 0.098, 0.102, 1.0), 0.90, 0.0, bump_noise_scale=75.0)
    create_pbr_material("MAT_Forest_Soil_Moss", None, (0.032, 0.052, 0.024, 1.0), 0.92, 0.0, bump_noise_scale=28.0)
    create_pbr_material("MAT_Cedar_Trunk_Bark", None, (0.055, 0.028, 0.015, 1.0), 0.88, 0.0, bump_noise_scale=32.0)
    create_pbr_material("MAT_Bamboo_Culm_Green", None, (0.065, 0.18, 0.042, 1.0), 0.38, 0.0)
    create_pbr_material("MAT_Foliage_Canopy", None, (0.028, 0.088, 0.022, 1.0), 0.68, 0.0, bump_noise_scale=20.0)


# ==============================================================================
# PRIMITIVE & ARCHITECTURAL BUILDER HELPERS
# ==============================================================================
def make_box(name, size_xyz, loc_xyz, mat_name, col, rot_xyz=(0, 0, 0), bevel=0.015):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx, sy, sz = size_xyz
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=min(bevel, min(sx, sy, sz) * 0.2), segments=2, profile=0.5)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc_xyz
    obj.rotation_euler = rot_xyz
    if mat_name in MATERIALS:
        mesh.materials.append(MATERIALS[mat_name])
    ensure_metric_uv(obj, 1.0)
    link_to_collection(obj, col)
    return obj


def make_cylinder(name, radius_bottom, radius_top, height, loc_xyz, mat_name, col, segments=28, rot_xyz=(0, 0, 0), cyl_uv=False):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segments, radius1=radius_bottom, radius2=radius_top, depth=height)
    for v in bm.verts:
        v.co.z += height * 0.5
    for f in bm.faces:
        f.smooth = True
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc_xyz
    obj.rotation_euler = rot_xyz
    if mat_name in MATERIALS:
        mesh.materials.append(MATERIALS[mat_name])
    if cyl_uv:
        ensure_cylinder_uv(obj, height, radius_bottom)
    else:
        ensure_metric_uv(obj, 1.0)
    link_to_collection(obj, col)
    return obj


def make_foliage_dome(name, radius_xyz, loc_xyz, mat_name, col, seed=1):
    """Organic displaced icosphere cluster for Japanese sugi cedar & karikomi topiary shrubs (Fixes Specialist 01 & 04)."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
    rx, ry, rz = radius_xyz
    for v in bm.verts:
        nx, ny, nz = v.co.x, v.co.y, v.co.z
        ripple = 1.0 + 0.16 * math.sin(nx * 5.0 + seed) * math.cos(ny * 5.0 - seed) + 0.10 * math.sin(nz * 7.0 + seed * 2)
        v.co.x = nx * rx * ripple
        v.co.y = ny * ry * ripple
        v.co.z = nz * rz * ripple
    for f in bm.faces:
        f.smooth = True
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = loc_xyz
    if mat_name in MATERIALS:
        mesh.materials.append(MATERIALS[mat_name])
    ensure_metric_uv(obj, 2.0)
    link_to_collection(obj, col)
    return obj


def create_japanese_roof(name, width_x, length_y, height_z, loc_xyz, col, style="irimoya", gold_crests=5, karahafu_front=False, roof_mat="MAT_Hiwadabuki_Bark_Roof"):
    """
    Create an authentic curved Japanese roof mesh with:
      - Support for 'hogyo' pyramidal lantern roofs (no oversized ridge beam/onigawara, Specialist 01 & 04 fix)
      - Proportional scaling of Ridge_Beam, Onigawara, and flush Kamon crests by scale_f = min(1.0, height_z / 4.0)
      - Full-depth inclined Taruki rafters spanning from building core to outer eaves with gold Tarukibana tips
      - Triangular Irimoya gable pediments with gold bargeboard kanagu trim
    """
    nx, ny = 28, 36
    bm = bmesh.new()

    x_min = -width_x * (0.58 if style == "nagare" else 0.50)
    x_max = width_x * (0.45 if style == "nagare" else 0.50)
    y_min, y_max = -length_y * 0.50, length_y * 0.50

    xs = [x_min + (x_max - x_min) * i / (nx - 1) for i in range(nx)]
    ys = [y_min + (y_max - y_min) * j / (ny - 1) for j in range(ny)]

    top_grid = []
    bot_grid = []
    scale_f = min(1.0, height_z / 3.8)
    thickness = max(0.10, 0.38 * scale_f)

    for i, x in enumerate(xs):
        row_t = []
        row_b = []
        ux = (x / abs(x_min)) if x < 0 else (x / max(0.01, x_max))
        for j, y in enumerate(ys):
            uy = y / (length_y * 0.5)
            px = abs(ux)
            if style == "hogyo":
                py = abs(uy)
                r_eff = min(1.0, max(px, py) * 0.72 + math.sqrt(px * px + py * py) * 0.28)
            elif style == "nagare":
                py = max(0.0, (abs(uy) - 0.78) / 0.22)
                r_eff = min(1.0, math.sqrt(px * px + py * py * 0.85))
            else:
                py = max(0.0, (abs(uy) - 0.38) / 0.62)
                r_eff = min(1.0, math.sqrt(px * px + py * py * 0.85))

            z = height_z * ((1.0 - r_eff) ** 1.38)
            corner = (px ** 2) * (abs(uy) ** 2)
            z += 0.42 * scale_f * corner

            if style == "nagare" and x < 0:
                z -= 0.28 * (abs(ux) ** 1.5)

            if karahafu_front and x < -width_x * 0.20 and abs(uy) < 0.44:
                cusp = math.cos((uy / 0.44) * math.pi) * 0.5 + 0.5
                eave_blend = min(1.0, abs(x) / (width_x * 0.5))
                z += 1.05 * scale_f * (cusp ** 1.35) * eave_blend

            vt = bm.verts.new((x, y, z))
            vb = bm.verts.new((x, y, z - thickness))
            row_t.append(vt)
            row_b.append(vb)
        top_grid.append(row_t)
        bot_grid.append(row_b)

    for i in range(nx - 1):
        for j in range(ny - 1):
            bm.faces.new((top_grid[i][j], top_grid[i + 1][j], top_grid[i + 1][j + 1], top_grid[i][j + 1]))
            bm.faces.new((bot_grid[i][j], bot_grid[i][j + 1], bot_grid[i + 1][j + 1], bot_grid[i + 1][j]))

    for i in range(nx - 1):
        bm.faces.new((top_grid[i][0], bot_grid[i][0], bot_grid[i + 1][0], top_grid[i + 1][0]))
        bm.faces.new((top_grid[i][-1], top_grid[i + 1][-1], bot_grid[i + 1][-1], bot_grid[i][-1]))
    for j in range(ny - 1):
        bm.faces.new((top_grid[0][j], top_grid[0][j + 1], bot_grid[0][j + 1], bot_grid[0][j]))
        bm.faces.new((top_grid[-1][j], bot_grid[-1][j], bot_grid[-1][j + 1], top_grid[-1][j + 1]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    roof_obj = bpy.data.objects.new(name, mesh)
    roof_obj.location = loc_xyz
    mesh.materials.append(MATERIALS[roof_mat])
    ensure_metric_uv(roof_obj, 2.0)
    link_to_collection(roof_obj, col)

    if style == "hogyo":
        return roof_obj

    # Proportional Ridge Beam (Mune) + Flush Golden Kamon Crests + Proportional End Oni-gawara
    ridge_len = length_y * (0.52 if style == "irimoya" else 0.82)
    ridge_z = loc_xyz[2] + height_z + 0.14 * scale_f
    rw = 0.52 * scale_f
    rh = 0.42 * scale_f
    make_box(f"{name}_Ridge_Beam", (rw, ridge_len, rh), (loc_xyz[0], loc_xyz[1], ridge_z), "MAT_Black_Lacquer_Nemaki", col)
    make_box(f"{name}_Ridge_Gold_Cap", (rw * 1.06, ridge_len + 0.15 * scale_f, 0.06 * scale_f), (loc_xyz[0], loc_xyz[1], ridge_z + rh * 0.52), "MAT_Gold_Kanagu_Leaf", col)

    for end_s in [-1, 1]:
        ey = loc_xyz[1] + end_s * (ridge_len * 0.5 + 0.12 * scale_f)
        make_box(f"{name}_Onigawara_{end_s}", (0.65 * scale_f, 0.32 * scale_f, 0.68 * scale_f), (loc_xyz[0], ey, ridge_z + 0.10 * scale_f), "MAT_Black_Lacquer_Nemaki", col)
        # Flush gold crest disc on Onigawara
        make_cylinder(f"{name}_Oni_GoldCrest_{end_s}", 0.12 * scale_f, 0.12 * scale_f, 0.06 * scale_f, (loc_xyz[0] - 0.34 * scale_f, ey, ridge_z + 0.14 * scale_f), "MAT_Gold_Kanagu_Leaf", col, segments=16, rot_xyz=(0, math.pi * 0.5, 0))
        # Triangular Irimoya gable pediment with dark lattice & gold Gegyo bargeboard ornament
        if style == "irimoya" and height_z >= 2.0:
            make_box(f"{name}_Gable_Pediment_{end_s}", (width_x * 0.36, 0.18, height_z * 0.38), (loc_xyz[0], ey - end_s * 0.15, loc_xyz[2] + height_z * 0.62), "MAT_Black_Lacquer_Nemaki", col)
            make_box(f"{name}_Gable_GoldGegyo_{end_s}", (width_x * 0.38, 0.22, 0.16 * scale_f), (loc_xyz[0], ey - end_s * 0.22, loc_xyz[2] + height_z * 0.78), "MAT_Gold_Kanagu_Leaf", col)

    if gold_crests > 0:
        for k in range(gold_crests):
            ky = loc_xyz[1] - ridge_len * 0.38 + k * (ridge_len * 0.76 / max(1, gold_crests - 1))
            # Flush 6cm disc on the West & East faces of the ridge beam
            for face_s in [-1, 1]:
                make_cylinder(f"{name}_Kamon_{k}_{face_s}", 0.13 * scale_f, 0.13 * scale_f, 0.04 * scale_f, (loc_xyz[0] + face_s * (rw * 0.51), ky, ridge_z + 0.02 * scale_f), "MAT_Gold_Kanagu_Leaf", col, segments=16, rot_xyz=(0, math.pi * 0.5, 0))

    # Full-depth inclined under-eave rafters (Taruki + Gold Tarukibana tips) for temple roofs
    if height_z >= 2.0:
        n_rafters = int(length_y * 2.4)
        rafter_len = min(2.2, width_x * 0.24)
        for r_i in range(n_rafters):
            ry = loc_xyz[1] + y_min + 0.30 + r_i * ((length_y - 0.6) / max(1, n_rafters - 1))
            for side_s, edge_x in [(-1, x_min), (1, x_max)]:
                rx_mid = loc_xyz[0] + edge_x - side_s * (rafter_len * 0.48)
                rz_mid = loc_xyz[2] + 0.14
                tilt_y = side_s * 0.26
                make_box(f"{name}_Taruki_{r_i}_{side_s}", (rafter_len, 0.075, 0.085), (rx_mid, ry, rz_mid), "MAT_Vermilion_ShuIro", col, rot_xyz=(0, tilt_y, 0), bevel=0.005)
                tip_x = loc_xyz[0] + edge_x + side_s * 0.02
                tip_z = loc_xyz[2] - 0.12
                make_box(f"{name}_Tarukibana_{r_i}_{side_s}", (0.04, 0.08, 0.09), (tip_x, ry, tip_z), "MAT_Gold_Kanagu_Leaf", col, rot_xyz=(0, tilt_y, 0), bevel=0.002)

        for side_x in [x_min + 0.06, x_max - 0.06]:
            make_box(f"{name}_Copper_Gutter_{side_x:.1f}", (0.12, length_y * 0.98, 0.08), (loc_xyz[0] + side_x, loc_xyz[1], loc_xyz[2] - 0.06), "MAT_Copper_Patina_Green", col)

    return roof_obj


# ==============================================================================
# MODULAR ASSETS: MYOJIN TORII, KITSUNE STATUE, STANDING & HANGING LANTERNS
# ==============================================================================
def create_myojin_torii(name, loc_xyz, span_y, height_z, col_radius, col, rot_z=0.0, has_plaque=False, use_kanji_mat=True, submerge_stone_base=False):
    cx, cy, cz = loc_xyz
    cos_r, sin_r = math.cos(rot_z), math.sin(rot_z)

    def xform(lx, ly, lz):
        return (cx + lx * cos_r - ly * sin_r, cy + lx * sin_r + ly * cos_r, cz + lz)

    col_mat = "MAT_Torii_Kanji_Column" if use_kanji_mat else "MAT_Vermilion_ShuIro"
    half_span = span_y * 0.5
    base_z0 = 0.0 if submerge_stone_base else 0.14

    for side in [-1, 1]:
        ly = side * half_span
        if not submerge_stone_base:
            make_cylinder(f"{name}_StoneBase_{side}", col_radius * 1.38, col_radius * 1.28, 0.16, xform(0, ly, 0.0), "MAT_Granite_Stone_Moss", col, segments=24)
        # Black Nemaki sleeve (24% height matching Torii_Kanji_Column texture)
        nemaki_h = height_z * 0.24
        make_cylinder(f"{name}_Nemaki_{side}", col_radius * 1.04, col_radius * 1.02, nemaki_h, xform(0, ly, base_z0), "MAT_Black_Lacquer_Nemaki", col, segments=32)
        # Vermilion Hashira shaft with Kanji UV centered on -X face
        # Slight inward yaw so left/right columns angle their calligraphy slightly toward tunnel center
        inward_yaw = rot_z + (-0.12 if side == 1 else 0.12) if use_kanji_mat else rot_z
        make_cylinder(f"{name}_Hashira_{side}", col_radius, col_radius * 0.94, height_z - base_z0, xform(0, ly, base_z0), col_mat, col, segments=32, rot_xyz=(0, 0, inward_yaw), cyl_uv=True)

    nuki_z = height_z * 0.77
    nuki_len = span_y * 1.34
    make_box(f"{name}_Nuki", (col_radius * 1.15, nuki_len, col_radius * 1.35), xform(0, 0, nuki_z), "MAT_Vermilion_ShuIro", col, rot_xyz=(0, 0, rot_z))
    for side in [-1, 1]:
        for w_s in [-1, 1]:
            wy = side * half_span + w_s * (col_radius * 1.12)
            make_box(f"{name}_Kusabi_{side}_{w_s}", (col_radius * 1.35, 0.08, col_radius * 1.55), xform(0, wy, nuki_z), "MAT_Black_Lacquer_Nemaki", col, rot_xyz=(0, 0, rot_z))

    strut_z = height_z * 0.86
    make_box(f"{name}_Gakuzuka", (col_radius * 1.1, col_radius * 1.5, height_z * 0.18), xform(0, 0, strut_z), "MAT_Vermilion_ShuIro", col, rot_xyz=(0, 0, rot_z))

    if has_plaque:
        make_box(f"{name}_Plaque_Frame", (col_radius * 1.4, col_radius * 2.4, height_z * 0.20), xform(-col_radius * 0.6, 0, strut_z), "MAT_Gold_Kanagu_Leaf", col, rot_xyz=(0, 0, rot_z))
        make_box(f"{name}_Plaque_Face", (col_radius * 1.48, col_radius * 2.0, height_z * 0.16), xform(-col_radius * 0.65, 0, strut_z), "MAT_Blue_Hengaku_Plaque", col, rot_xyz=(0, 0, rot_z))

    kasagi_len = span_y * 1.48
    segs = 18
    for layer_name, z_off, h_thk, mat_n, len_scale in [
        ("Shimaki", height_z * 0.93, col_radius * 1.15, "MAT_Vermilion_ShuIro", 0.95),
        ("Kasagi_Body", height_z * 0.975, col_radius * 1.25, "MAT_Vermilion_ShuIro", 1.00),
        ("Kasagi_BlackCap", height_z * 1.015, col_radius * 0.62, "MAT_Black_Lacquer_Nemaki", 1.03),
    ]:
        bm = bmesh.new()
        L = kasagi_len * len_scale
        w_x = col_radius * (1.75 if "Kasagi" in layer_name else 1.45)
        rings = []
        for s in range(segs + 1):
            u = -1.0 + 2.0 * s / segs
            yy = u * (L * 0.5)
            curve_z = (abs(u) ** 2.4) * (col_radius * 2.1)
            flare_x = w_x * (1.0 + 0.12 * (abs(u) ** 2))
            v0 = bm.verts.new((-flare_x * 0.5, yy, -h_thk * 0.5 + curve_z))
            v1 = bm.verts.new((flare_x * 0.5, yy, -h_thk * 0.5 + curve_z))
            v2 = bm.verts.new((flare_x * 0.5, yy, h_thk * 0.5 + curve_z))
            v3 = bm.verts.new((-flare_x * 0.5, yy, h_thk * 0.5 + curve_z))
            rings.append((v0, v1, v2, v3))
        for s in range(segs):
            a0, a1, a2, a3 = rings[s]
            b0, b1, b2, b3 = rings[s + 1]
            bm.faces.new((a0, b0, b1, a1))
            bm.faces.new((a1, b1, b2, a2))
            bm.faces.new((a2, b2, b3, a3))
            bm.faces.new((a3, b3, b0, a0))
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        m = bpy.data.meshes.new(f"{name}_{layer_name}")
        bm.to_mesh(m)
        bm.free()
        o = bpy.data.objects.new(f"{name}_{layer_name}", m)
        o.location = xform(0, 0, z_off)
        o.rotation_euler = (0, 0, rot_z)
        m.materials.append(MATERIALS[mat_n])
        ensure_metric_uv(o, 1.0)
        link_to_collection(o, col)


def create_kitsune_on_pedestal(name, loc_xyz, col, holds="key", facing_rot_z=math.pi):
    cx, cy, cz = loc_xyz
    make_box(f"{name}_Pedestal_Tier1", (1.95, 1.95, 0.55), (cx, cy, cz + 0.275), "MAT_Granite_Stone_Moss", col)
    make_box(f"{name}_Pedestal_Tier2", (1.62, 1.62, 0.52), (cx, cy, cz + 0.81), "MAT_Granite_Stone_Moss", col)
    make_box(f"{name}_Pedestal_Tier3", (1.32, 1.32, 0.48), (cx, cy, cz + 1.31), "MAT_Granite_Stone_Moss", col)
    make_box(f"{name}_Bronze_Plinth", (1.08, 0.88, 0.22), (cx, cy, cz + 1.66), "MAT_Dark_Bronze_Kitsune", col, rot_xyz=(0, 0, facing_rot_z))

    fz = cz + 1.77
    cos_r, sin_r = math.cos(facing_rot_z), math.sin(facing_rot_z)

    def fx(lx, ly, lz):
        return (cx + lx * cos_r - ly * sin_r, cy + lx * sin_r + ly * cos_r, fz + lz)

    make_cylinder(f"{name}_Haunches", 0.30, 0.24, 0.58, fx(-0.14, 0, 0.0), "MAT_Dark_Bronze_Kitsune", col, segments=20)
    make_cylinder(f"{name}_Chest", 0.25, 0.20, 0.68, fx(0.08, 0, 0.35), "MAT_Dark_Bronze_Kitsune", col, segments=20, rot_xyz=(0, -0.22, facing_rot_z))
    for sy in [-0.14, 0.14]:
        make_cylinder(f"{name}_FrontLeg_{sy:.2f}", 0.075, 0.06, 0.72, fx(0.22, sy, 0.0), "MAT_Dark_Bronze_Kitsune", col, segments=14)
    make_cylinder(f"{name}_White_Collar", 0.22, 0.19, 0.10, fx(0.14, 0, 0.82), "MAT_White_Shikku_Plaster", col, segments=18)
    make_cylinder(f"{name}_Red_Bib", 0.27, 0.21, 0.34, fx(0.16, 0, 0.52), "MAT_Kitsune_Red_Bib", col, segments=18)
    make_cylinder(f"{name}_Head", 0.18, 0.15, 0.28, fx(0.16, 0, 0.92), "MAT_Dark_Bronze_Kitsune", col, segments=18)
    make_box(f"{name}_Snout", (0.34, 0.14, 0.13), fx(0.32, 0, 1.03), "MAT_Dark_Bronze_Kitsune", col, rot_xyz=(0, 0, facing_rot_z))
    for sy in [-0.11, 0.11]:
        make_cylinder(f"{name}_Ear_{sy:.2f}", 0.06, 0.01, 0.24, fx(0.12, sy, 1.16), "MAT_Dark_Bronze_Kitsune", col, segments=12)
    make_cylinder(f"{name}_Tail_Base", 0.16, 0.24, 0.55, fx(-0.36, 0, 0.18), "MAT_Dark_Bronze_Kitsune", col, segments=18, rot_xyz=(0, -0.35, facing_rot_z))
    make_cylinder(f"{name}_Tail_Tip", 0.24, 0.04, 0.48, fx(-0.44, 0, 0.68), "MAT_Dark_Bronze_Kitsune", col, segments=18)

    if holds == "key":
        make_box(f"{name}_Granary_Key", (0.10, 0.46, 0.05), fx(0.44, 0.0, 0.98), "MAT_Gold_Kanagu_Leaf", col, rot_xyz=(0.25, 0, facing_rot_z))
    else:
        make_cylinder(f"{name}_Sacred_Jewel", 0.09, 0.02, 0.16, fx(0.44, 0.0, 0.96), "MAT_Gold_Kanagu_Leaf", col, segments=14)


def create_vermilion_standing_lantern(name, loc_xyz, col, scale=1.0):
    """
    Create the vermilion standing lantern (Toro) with pyramidal Hogyo copper-green roof
    topped by a central gold Giboshi finial (Fixes Specialist 01 Defect 3).
    """
    cx, cy, cz = loc_xyz
    s = scale
    make_box(f"{name}_StonePlinth", (0.95 * s, 0.95 * s, 0.35 * s), (cx, cy, cz + 0.175 * s), "MAT_Granite_Stone_Moss", col)
    make_cylinder(f"{name}_Post", 0.14 * s, 0.13 * s, 1.85 * s, (cx, cy, cz + 0.35 * s), "MAT_Vermilion_ShuIro", col, segments=20)
    make_box(f"{name}_Platform", (0.88 * s, 0.88 * s, 0.16 * s), (cx, cy, cz + 2.22 * s), "MAT_Vermilion_ShuIro", col)
    make_box(f"{name}_Platform_Gold", (0.94 * s, 0.94 * s, 0.05 * s), (cx, cy, cz + 2.32 * s), "MAT_Gold_Kanagu_Leaf", col)
    make_box(f"{name}_LightChamber", (0.54 * s, 0.54 * s, 0.58 * s), (cx, cy, cz + 2.64 * s), "MAT_Lantern_Warm_Glow", col)
    for sx in [-0.27 * s, 0.27 * s]:
        for sy in [-0.27 * s, 0.27 * s]:
            make_box(f"{name}_Frame_{sx:.2f}_{sy:.2f}", (0.05 * s, 0.05 * s, 0.62 * s), (cx + sx, cy + sy, cz + 2.64 * s), "MAT_Vermilion_ShuIro", col)
    # Pyramidal Hogyo copper roof (zero oversized Onigawara blocks!)
    create_japanese_roof(f"{name}_CopperRoof", 1.42 * s, 1.42 * s, 0.56 * s, (cx, cy, cz + 2.98 * s), col, style="hogyo", gold_crests=0, roof_mat="MAT_Copper_Patina_Green")
    make_cylinder(f"{name}_Finial_Giboshi", 0.09 * s, 0.02 * s, 0.26 * s, (cx, cy, cz + 3.52 * s), "MAT_Gold_Kanagu_Leaf", col, segments=14)


def create_stone_lantern_ishidoro(name, loc_xyz, col, scale=1.0):
    cx, cy, cz = loc_xyz
    s = scale
    make_box(f"{name}_Base", (0.75 * s, 0.75 * s, 0.25 * s), (cx, cy, cz + 0.125 * s), "MAT_Granite_Stone_Moss", col)
    make_cylinder(f"{name}_Shaft", 0.16 * s, 0.14 * s, 0.95 * s, (cx, cy, cz + 0.25 * s), "MAT_Granite_Stone_Moss", col, segments=14)
    make_box(f"{name}_Ukebana", (0.68 * s, 0.68 * s, 0.16 * s), (cx, cy, cz + 1.28 * s), "MAT_Granite_Stone_Moss", col)
    make_box(f"{name}_Hibukuro_Glow", (0.40 * s, 0.40 * s, 0.36 * s), (cx, cy, cz + 1.54 * s), "MAT_Lantern_Warm_Glow", col)
    for sx in [-0.19 * s, 0.19 * s]:
        for sy in [-0.19 * s, 0.19 * s]:
            make_box(f"{name}_StonePillar_{sx:.2f}_{sy:.2f}", (0.06 * s, 0.06 * s, 0.38 * s), (cx + sx, cy + sy, cz + 1.54 * s), "MAT_Granite_Stone_Moss", col)
    make_cylinder(f"{name}_Kasa_Roof", 0.58 * s, 0.12 * s, 0.36 * s, (cx, cy, cz + 1.73 * s), "MAT_Granite_Stone_Moss", col, segments=8)
    make_cylinder(f"{name}_Hoju", 0.10 * s, 0.02 * s, 0.20 * s, (cx, cy, cz + 2.09 * s), "MAT_Granite_Stone_Moss", col, segments=12)


def create_hanging_lantern_tsuridoro(name, loc_xyz, col, rod_len=1.25, scale=1.0):
    """
    Create a dark bronze hexagonal lattice hanging lantern (Tsuri-doro)
    with long suspension rod, wider roof canopy than bottom ring, and 6 vertical bronze frame ribs
    (Fixes Specialist 02 Defect 3 & Specialist 03 Defect 4).
    """
    cx, cy, cz = loc_xyz
    s = scale
    # Slender vertical suspension rod from eave purlin down to lantern canopy
    make_cylinder(f"{name}_Rod", 0.014 * s, 0.014 * s, rod_len, (cx, cy, cz - rod_len), "MAT_Dark_Bronze_Kitsune", col, segments=8)
    top_z = cz - rod_len
    # Hexagonal pitched roof canopy (wider than base)
    make_cylinder(f"{name}_Canopy", 0.26 * s, 0.06 * s, 0.15 * s, (cx, cy, top_z - 0.12 * s), "MAT_Dark_Bronze_Kitsune", col, segments=6)
    # Warm backlit shoji paper core
    make_cylinder(f"{name}_Core", 0.13 * s, 0.12 * s, 0.26 * s, (cx, cy, top_z - 0.36 * s), "MAT_Lantern_Warm_Glow", col, segments=6)
    # 6 vertical bronze lattice ribs around the core
    for k in range(6):
        ang = k * (math.pi / 3.0)
        rx = cx + 0.132 * s * math.cos(ang)
        ry = cy + 0.132 * s * math.sin(ang)
        make_cylinder(f"{name}_Rib_{k}", 0.012 * s, 0.012 * s, 0.28 * s, (rx, ry, top_z - 0.37 * s), "MAT_Dark_Bronze_Kitsune", col, segments=6)
    # Narrower bottom base plate
    make_cylinder(f"{name}_BottomRing", 0.15 * s, 0.16 * s, 0.05 * s, (cx, cy, top_z - 0.40 * s), "MAT_Dark_Bronze_Kitsune", col, segments=6)


# ==============================================================================
# ZONE BUILDERS (ROUND 02 GAUNTLET INTEGRATED)
# ==============================================================================
def build_site_terraces_and_stairs(col):
    # T00 Approach Plaza (X=-22..-2.5, Z=0.0)
    make_box("T00_Approach_Plaza", (19.5, 52.0, 0.6), (-12.25, 0.0, -0.3), "MAT_Courtyard_Gravel_Dark", col)
    make_box("T00_Processional_Path", (17.0, 9.2, 0.04), (-11.0, 0.0, 0.02), "MAT_Flagstone_Walkway", col)

    # T01 Main Precinct Court (X=-2.5..22.0, Z=1.6) — Dark gravel court + light granite walkway aprons (Fixes Specialist 02 Defect 5)
    make_box("T01_Main_Court_Slab", (24.5, 52.0, 2.2), (9.75, 0.0, 0.5), "MAT_Courtyard_Gravel_Dark", col)
    make_box("T01_Gehaiden_Flagstone_Apron", (12.8, 16.4, 0.04), (12.5, 0.0, 1.62), "MAT_Flagstone_Walkway", col)
    make_box("T01_Axial_Walkway_To_Stairs", (22.5, 7.6, 0.04), (9.5, 0.0, 1.62), "MAT_Flagstone_Walkway", col)

    # Stepped granite retaining walls along X=-3.4..-2.5 with Karikomi topiary shrubs (Fixes Specialist 01 Defect 5)
    for side_s, y_pos in [(1, 15.2), (-1, -15.2)]:
        tag = "N" if side_s > 0 else "S"
        make_box(f"T01_Retaining_Lower_{tag}", (1.2, 20.2, 0.92), (-3.1, y_pos, 0.46), "MAT_Granite_Stone_Moss", col)
        make_box(f"T01_Retaining_Upper_{tag}", (0.8, 20.2, 1.68), (-2.5, y_pos, 0.84), "MAT_Granite_Stone_Moss", col)
        for sh_i in range(6):
            sy_b = side_s * (6.2 + sh_i * 2.1)
            make_foliage_dome(f"Z01_Topiary_Shrub_{tag}_{sh_i}", (0.75, 0.85, 0.55), (-3.3, sy_b, 1.05), "MAT_Foliage_Canopy", col, seed=sh_i + 10)
            make_foliage_dome(f"Z01_Plaza_Shrub_{tag}_{sh_i}", (0.65, 0.70, 0.45), (-4.2, sy_b + side_s * 0.4, 0.35), "MAT_Foliage_Canopy", col, seed=sh_i + 20)

    # Romon 11-step Granite Staircase (X=-6.5..-2.5, Y=-4.8..4.8, Z=0.0..1.6)
    for s in range(11):
        sx = -6.5 + (s + 0.5) * (4.0 / 11.0)
        sz = (s + 1) * (1.6 / 11.0)
        make_box(f"Romon_Step_{s:02d}", (4.0 / 11.0 + 0.04, 9.2, sz), (sx, 0.0, sz * 0.5), "MAT_Granite_Stone_Moss", col)
    for sy in [-4.85, 4.85]:
        make_box(f"Romon_Stair_Cheek_{sy:.1f}", (4.4, 0.45, 1.75), (-4.5, sy, 0.875), "MAT_Granite_Stone_Moss", col)

    # T02 Sanctuary Terrace (X=22.0..44.0, Z=3.2)
    make_box("T02_Sanctuary_Slab", (22.0, 52.0, 3.8), (33.0, 0.0, 1.3), "MAT_Granite_Stone_Moss", col)
    for s in range(9):
        sx = 19.6 + (s + 0.5) * (2.6 / 9.0)
        sz = 1.6 + (s + 1) * (1.6 / 9.0)
        make_box(f"Sanctuary_Step_{s:02d}", (2.6 / 9.0 + 0.04, 8.6, sz - 1.6), (sx, 0.0, 1.6 + (sz - 1.6) * 0.5), "MAT_Granite_Stone_Moss", col)

    # T03 Senbon Torii Slope (X=44.0..74.0, dark mossy forest soil flanks & recessed below tunnel ramp — Fixes Specialist 03 & 04)
    for k in range(15):
        kx = 44.0 + (k + 0.5) * 2.0
        kz = 3.05 + k * (2.75 / 14.0)
        make_box(f"T03_Slope_Tier_{k:02d}", (2.15, 52.0, kz + 0.5), (kx, 0.0, (kz - 0.5) * 0.5), "MAT_Forest_Soil_Moss", col)


def build_z01_romon_gate(col):
    """
    Zone 01 with all Specialist 01 fixes:
      - Unobstructed Kitsune & Standing Lantern lateral alignment
      - Recessed ground-floor Zuijin alcoves behind green Renji-goshi bars
      - Central pillar hanging lanterns (Kake-doro) & blue Noren crests
      - Complete 2nd-floor Koran balcony balusters & intermediate rails + balcony support brackets
      - 3-tier Tokyo bracket assemblies + straw-wrapped Komodaru sake barrels with blue/gold crests
    """
    create_myojin_torii("Z01_Outer_Grand_Torii", (-21.5, 0.0, 0.0), span_y=7.8, height_z=8.8, col_radius=0.40, col=col, has_plaque=True, use_kanji_mat=False)

    # Flanking Standing Lanterns & Inward-Angled Kitsune Guardians (Ticket T02)
    create_vermilion_standing_lantern("Z01_Lantern_North", (-6.8, 5.45, 0.0), col)
    create_vermilion_standing_lantern("Z01_Lantern_South", (-6.8, -5.45, 0.0), col)
    create_kitsune_on_pedestal("Z01_Kitsune_North_Key", (-3.3, 4.95, 1.6), col, holds="key", facing_rot_z=math.pi + 0.18)
    create_kitsune_on_pedestal("Z01_Kitsune_South_Jewel", (-3.3, -4.95, 1.6), col, holds="jewel", facing_rot_z=math.pi - 0.18)

    make_box("Z01_Romon_Podium", (6.8, 12.2, 0.50), (0.0, 0.0, 1.85), "MAT_Granite_Stone_Moss", col)

    xs_col = [-2.6, 0.0, 2.6]
    ys_col = [-5.2, -1.9, 1.9, 5.2]
    for ix, cx in enumerate(xs_col):
        for iy, cy in enumerate(ys_col):
            make_cylinder(f"Z01_Romon_FootStone_{ix}_{iy}", 0.38, 0.35, 0.14, (cx, cy, 2.10), "MAT_Granite_Stone_Moss", col, segments=24)
            make_cylinder(f"Z01_Romon_Nemaki_{ix}_{iy}", 0.33, 0.32, 0.48, (cx, cy, 2.24), "MAT_Black_Lacquer_Nemaki", col, segments=28)
            make_cylinder(f"Z01_Romon_Col_{ix}_{iy}", 0.31, 0.29, 7.65, (cx, cy, 2.24), "MAT_Vermilion_ShuIro", col, segments=28)

    # Recessed Ground-floor Zuijin Alcoves behind green Renji-goshi lattice fences
    for side_s, y_mid in [(-1, -3.55), (1, 3.55)]:
        make_box(f"Z01_Romon_LowWall_{side_s}", (0.45, 3.1, 0.85), (-2.45, y_mid, 2.52), "MAT_Vermilion_ShuIro", col)
        make_box(f"Z01_Romon_Alcove_BackWall_{side_s}", (2.4, 3.1, 3.9), (0.6, y_mid, 4.05), "MAT_White_Shikku_Plaster", col)
        # Seated Zuijin guardian figure silhouette inside the shaded alcove
        make_cylinder(f"Z01_Zuijin_Guardian_{side_s}", 0.36, 0.22, 1.15, (-0.8, y_mid, 2.95), "MAT_Dark_Bronze_Kitsune", col, segments=14)
        make_box(f"Z01_Zuijin_GoldAccent_{side_s}", (0.18, 0.48, 0.45), (-1.05, y_mid, 3.45), "MAT_Gold_Kanagu_Leaf", col)
        for b in range(13):
            by = y_mid - 1.38 + b * 0.23
            make_box(f"Z01_Romon_GreenBar_{side_s}_{b}", (0.06, 0.055, 1.65), (-2.55, by, 3.75), "MAT_Copper_Patina_Green", col)
        make_box(f"Z01_Romon_Shikku1_{side_s}", (5.1, 3.1, 1.35), (0.0, y_mid, 5.45), "MAT_White_Shikku_Plaster", col)
        for z_beam in [4.65, 5.45, 6.15]:
            make_box(f"Z01_Romon_Nageshi_{side_s}_{z_beam:.2f}", (5.45, 3.3, 0.18), (0.0, y_mid, z_beam), "MAT_Vermilion_ShuIro", col)

    # Central archway white Noren curtain with dark blue crests + Pillar Lanterns (Kake-doro)
    make_box("Z01_Romon_Center_Lintel", (5.45, 3.8, 0.32), (0.0, 0.0, 4.95), "MAT_Vermilion_ShuIro", col)
    make_box("Z01_Romon_Center_Shikku", (5.1, 3.6, 1.05), (0.0, 0.0, 5.65), "MAT_White_Shikku_Plaster", col)
    for n_i, ny in enumerate([-1.1, 0.0, 1.1]):
        make_box(f"Z01_Romon_Noren_{n_i}", (0.04, 1.02, 1.25), (-2.55, ny, 4.15), "MAT_White_Shikku_Plaster", col)
        make_cylinder(f"Z01_Romon_NorenCrest_{n_i}", 0.20, 0.20, 0.03, (-2.57, ny, 4.15), "MAT_Blue_Hengaku_Plaque", col, segments=20, rot_xyz=(0, math.pi * 0.5, 0))
    for py_l in [-1.9, 1.9]:
        make_box(f"Z01_Romon_PillarLantern_Frame_{py_l:.1f}", (0.34, 0.34, 0.68), (-2.96, py_l, 4.05), "MAT_Vermilion_ShuIro", col)
        make_box(f"Z01_Romon_PillarLantern_Paper_{py_l:.1f}", (0.28, 0.28, 0.56), (-2.98, py_l, 4.05), "MAT_Lantern_Warm_Glow", col)

    # Complete Second-floor Koran Balcony with intermediate rails, balusters, and support brackets
    make_box("Z01_Romon_Balcony_Deck", (6.6, 11.8, 0.26), (0.0, 0.0, 6.38), "MAT_Vermilion_ShuIro", col)
    for z_rail in [6.65, 6.90, 7.14]:
        make_box(f"Z01_Romon_Balcony_Rail_{z_rail:.2f}", (6.88, 12.08, 0.09), (0.0, 0.0, z_rail), "MAT_Vermilion_ShuIro", col)
    make_box("Z01_Romon_Balcony_GoldTrim", (6.94, 12.14, 0.07), (0.0, 0.0, 7.21), "MAT_Gold_Kanagu_Leaf", col)
    for by_bal in np.linspace(-5.8, 5.8, 25):
        for bx_bal in [-3.40, 3.40]:
            make_box(f"Z01_Baluster_{bx_bal:.1f}_{by_bal:.2f}", (0.07, 0.07, 0.72), (bx_bal, by_bal, 6.76), "MAT_Vermilion_ShuIro", col)
    for gx in [-3.42, 3.42]:
        for gy in [-5.98, -2.0, 2.0, 5.98]:
            make_cylinder(f"Z01_Romon_Giboshi_{gx:.1f}_{gy:.1f}", 0.09, 0.06, 0.92, (gx, gy, 6.45), "MAT_Gold_Kanagu_Leaf", col, segments=14)

    # Balcony support brackets (Z=5.75..6.30m) + Upper-story 3-tier Tokyo bracket clusters
    make_box("Z01_Romon_Upper_Shikku", (4.8, 9.8, 3.1), (0.0, 0.0, 8.15), "MAT_White_Shikku_Plaster", col)
    for z_ub in [7.4, 8.2, 9.0, 9.75]:
        make_box(f"Z01_Romon_UpperBeam_{z_ub:.2f}", (5.15, 10.2, 0.22), (0.0, 0.0, z_ub), "MAT_Vermilion_ShuIro", col)

    for by in [-5.2, -3.5, -1.9, 0.0, 1.9, 3.5, 5.2]:
        for bx in [-2.65, 2.65]:
            # Balcony brackets
            make_box(f"Z01_BalcTokyo1_{bx:.1f}_{by:.1f}", (0.95, 0.48, 0.28), (bx, by, 5.92), "MAT_Vermilion_ShuIro", col)
            make_box(f"Z01_BalcTokyo2_{bx:.1f}_{by:.1f}", (1.35, 0.68, 0.28), (bx, by, 6.20), "MAT_Vermilion_ShuIro", col)
            # Upper roof 3-tier Tokyo brackets + gold bearing blocks
            make_box(f"Z01_Tokyo_Tier1_{bx:.1f}_{by:.1f}", (0.85, 0.55, 0.30), (bx, by, 9.05), "MAT_Vermilion_ShuIro", col)
            make_box(f"Z01_Tokyo_Tier2_{bx:.1f}_{by:.1f}", (1.35, 0.82, 0.32), (bx, by, 9.38), "MAT_Vermilion_ShuIro", col)
            make_box(f"Z01_Tokyo_Tier3_{bx:.1f}_{by:.1f}", (1.85, 1.08, 0.34), (bx, by, 9.72), "MAT_Vermilion_ShuIro", col)
            make_box(f"Z01_Tokyo_GoldMasu_{bx:.1f}_{by:.1f}", (1.92, 0.22, 0.14), (bx, by, 9.90), "MAT_Gold_Kanagu_Leaf", col)

    make_box("Z01_Romon_Hengaku_Gold", (0.18, 1.38, 2.15), (-2.85, 0.0, 8.45), "MAT_Gold_Kanagu_Leaf", col, rot_xyz=(0, 0.12, 0))
    make_box("Z01_Romon_Hengaku_Blue", (0.20, 1.16, 1.92), (-2.89, 0.0, 8.45), "MAT_Blue_Hengaku_Plaque", col, rot_xyz=(0, 0.12, 0))

    create_japanese_roof("Z01_Romon_Roof", width_x=9.8, length_y=15.6, height_z=4.2, loc_xyz=(0.0, 0.0, 9.95), col=col, style="irimoya", gold_crests=5)

    # Flanking North & South Kairo Wings with straw-wrapped Sake Barrels (Komodaru)
    for side_s, ky in [(1, 12.5), (-1, -12.5)]:
        wname = "North" if side_s > 0 else "South"
        make_box(f"Z01_Kairo_{wname}_Base", (4.4, 13.2, 0.45), (0.0, ky, 1.825), "MAT_Granite_Stone_Moss", col)
        make_box(f"Z01_Kairo_{wname}_Wall", (3.8, 12.8, 3.3), (0.0, ky, 3.70), "MAT_White_Shikku_Plaster", col)
        make_box(f"Z01_Kairo_{wname}_Wainscot", (3.95, 12.9, 1.05), (0.0, ky, 2.55), "MAT_Vermilion_ShuIro", col)
        for c_i in range(6):
            cy_p = ky - 6.0 + c_i * 2.4
            make_cylinder(f"Z01_Kairo_{wname}_Col_{c_i}", 0.18, 0.17, 3.4, (-1.92, cy_p, 2.05), "MAT_Vermilion_ShuIro", col, segments=20)
            if c_i < 5:
                wy_m = cy_p + 1.2
                make_box(f"Z01_Kairo_{wname}_WinFrame_{c_i}", (0.14, 1.65, 1.15), (-1.92, wy_m, 3.85), "MAT_Vermilion_ShuIro", col)
                for lb in range(7):
                    make_box(f"Z01_Kairo_{wname}_WinBar_{c_i}_{lb}", (0.16, 0.05, 1.05), (-1.94, wy_m - 0.66 + lb * 0.22, 3.85), "MAT_Copper_Patina_Green", col)
        # Straw-wrapped Komodaru Sake Barrels with dark blue/gold circular front crests
        for row_z in range(3):
            for bar_y in range(3):
                by_s = ky - side_s * (4.8 - bar_y * 0.62)
                bz_s = 2.15 + row_z * 0.56
                make_cylinder(f"Z01_SakeBarrel_{wname}_{row_z}_{bar_y}", 0.25, 0.25, 0.52, (-2.05, by_s, bz_s), "MAT_Straw_Shimenawa", col, segments=16, rot_xyz=(0, math.pi * 0.5, 0))
                make_cylinder(f"Z01_SakeCrest_{wname}_{row_z}_{bar_y}", 0.17, 0.17, 0.04, (-2.56, by_s, bz_s), "MAT_Blue_Hengaku_Plaque", col, segments=16, rot_xyz=(0, math.pi * 0.5, 0))
        create_japanese_roof(f"Z01_Kairo_{wname}_Roof", width_x=5.8, length_y=13.8, height_z=2.15, loc_xyz=(0.0, ky, 5.35), col=col, style="irimoya", gold_crests=3)


def build_z02_gehaiden(col):
    """
    Zone 02 — Ge-haiden with all Specialist 02 fixes:
      - Dense slender vermilion Tamagaki pickets (65+ pickets per side) with flush black caps
      - Inner Koran balustrade with gold corner clasps & Giboshi posts
      - Thin dark-bamboo Sudare blinds with 4 symmetrical white brocade ribbons, top Shimenawa & Shide
      - 12 dark-bronze hexagonal Zodiac lanterns hanging on slender 1.35m rods down to the Sudare hem
    """
    gx, gy, gz = 12.5, 0.0, 1.6

    fx_min, fx_max = gx - 4.8, gx + 4.8
    fy_min, fy_max = -6.7, 6.7
    for ry in [fy_min, fy_max]:
        make_box(f"Z02_Tamagaki_RailY_{ry:.1f}", (9.6, 0.07, 0.10), (gx, ry, gz + 0.98), "MAT_Vermilion_ShuIro", col)
        make_box(f"Z02_Tamagaki_RailY_Low_{ry:.1f}", (9.6, 0.07, 0.10), (gx, ry, gz + 0.25), "MAT_Vermilion_ShuIro", col)
    for rx in [fx_min, fx_max]:
        make_box(f"Z02_Tamagaki_RailX_{rx:.1f}", (0.07, 13.4, 0.10), (rx, gy, gz + 0.98), "MAT_Vermilion_ShuIro", col)
        make_box(f"Z02_Tamagaki_RailX_Low_{rx:.1f}", (0.07, 13.4, 0.10), (rx, gy, gz + 0.25), "MAT_Vermilion_ShuIro", col)

    # Dense slender pickets (65 along X, 85 along Y)
    for px in np.linspace(fx_min, fx_max, 58):
        for py in [fy_min, fy_max]:
            make_box(f"Z02_Picket_X_{px:.2f}_{py:.1f}", (0.065, 0.065, 1.22), (px, py, gz + 0.61), "MAT_Vermilion_ShuIro", col, bevel=0.005)
            make_box(f"Z02_PicketCap_X_{px:.2f}_{py:.1f}", (0.068, 0.068, 0.07), (px, py, gz + 1.25), "MAT_Black_Lacquer_Nemaki", col, bevel=0.003)
    for py in np.linspace(fy_min, fy_max, 78):
        for px in [fx_min, fx_max]:
            make_box(f"Z02_Picket_Y_{px:.1f}_{py:.2f}", (0.065, 0.065, 1.22), (px, py, gz + 0.61), "MAT_Vermilion_ShuIro", col, bevel=0.005)
            make_box(f"Z02_PicketCap_Y_{px:.1f}_{py:.2f}", (0.068, 0.068, 0.07), (px, py, gz + 1.25), "MAT_Black_Lacquer_Nemaki", col, bevel=0.003)

    # Podium & Inner Koran Balustrade with Gold Giboshi Finials
    make_box("Z02_Gehaiden_Podium", (7.6, 11.2, 0.68), (gx, gy, gz + 0.34), "MAT_Granite_Stone_Moss", col)
    make_box("Z02_Gehaiden_Floor", (7.2, 10.8, 0.16), (gx, gy, gz + 0.74), "MAT_Vermilion_ShuIro", col)
    make_box("Z02_Gehaiden_Verandah_Rail", (7.4, 11.0, 0.09), (gx, gy, gz + 1.35), "MAT_Vermilion_ShuIro", col)
    make_box("Z02_Gehaiden_Verandah_MidRail", (7.4, 11.0, 0.07), (gx, gy, gz + 1.08), "MAT_Vermilion_ShuIro", col)
    make_box("Z02_Gehaiden_Verandah_Gold", (7.48, 11.08, 0.06), (gx, gy, gz + 1.42), "MAT_Gold_Kanagu_Leaf", col)
    for vx in [gx - 3.7, gx + 3.7]:
        for vy in [gy - 5.5, gy - 1.8, gy + 1.8, gy + 5.5]:
            make_cylinder(f"Z02_Giboshi_{vx:.1f}_{vy:.1f}", 0.07, 0.05, 0.68, (vx, vy, gz + 0.80), "MAT_Gold_Kanagu_Leaf", col, segments=12)

    g_xs = np.linspace(gx - 3.2, gx + 3.2, 4)
    g_ys = np.linspace(gy - 5.0, gy + 5.0, 6)
    for ix, cx in enumerate(g_xs):
        for iy, cy in enumerate(g_ys):
            if ix in (0, 3) or iy in (0, 5):
                make_cylinder(f"Z02_Nemaki_{ix}_{iy}", 0.23, 0.22, 0.42, (cx, cy, gz + 0.80), "MAT_Black_Lacquer_Nemaki", col, segments=24)
                make_cylinder(f"Z02_Col_{ix}_{iy}", 0.21, 0.20, 4.55, (cx, cy, gz + 0.80), "MAT_Vermilion_ShuIro", col, segments=24)

    make_box("Z02_Upper_Shikku_Core", (6.3, 9.9, 1.35), (gx, gy, gz + 4.55), "MAT_White_Shikku_Plaster", col)
    make_box("Z02_Nageshi_Beam_Top", (6.65, 10.25, 0.22), (gx, gy, gz + 5.15), "MAT_Vermilion_ShuIro", col)
    make_box("Z02_Nageshi_Beam_Mid", (6.65, 10.25, 0.20), (gx, gy, gz + 3.85), "MAT_Vermilion_ShuIro", col)

    # Sudare blinds on all 4 sides with 4 symmetrical white brocade ribbons & top Shide
    for iy in range(5):
        by_c = gy - 4.0 + iy * 2.0
        for sx in [gx - 3.18, gx + 3.18]:
            make_box(f"Z02_Sudare_Y_{iy}_{sx:.1f}", (0.025, 1.82, 1.18), (sx, by_c, gz + 3.20), "MAT_Sudare_Bamboo_Blind", col, bevel=0.002)
            for strip in [-0.62, -0.22, 0.22, 0.62]:
                make_box(f"Z02_Brocade_Y_{iy}_{sx:.1f}_{strip:.2f}", (0.035, 0.08, 1.19), (sx, by_c + strip, gz + 3.20), "MAT_White_Shikku_Plaster", col, bevel=0.002)
            for sh in [-0.65, -0.22, 0.22, 0.65]:
                make_box(f"Z02_Shide_Y_{iy}_{sx:.1f}_{sh:.2f}", (0.045, 0.11, 0.32), (sx, by_c + sh, gz + 3.70), "MAT_White_Shikku_Plaster", col, bevel=0.002)

    for ix in range(3):
        bx_c = gx - 2.13 + ix * 2.13
        for sy in [gy - 4.98, gy + 4.98]:
            make_box(f"Z02_Sudare_X_{ix}_{sy:.1f}", (1.92, 0.025, 1.18), (bx_c, sy, gz + 3.20), "MAT_Sudare_Bamboo_Blind", col, bevel=0.002)
            for strip in [-0.62, -0.22, 0.22, 0.62]:
                make_box(f"Z02_Brocade_X_{ix}_{sy:.1f}_{strip:.2f}", (0.08, 0.035, 1.19), (bx_c + strip, sy, gz + 3.20), "MAT_White_Shikku_Plaster", col, bevel=0.002)

    # 12 Hanging Zodiac Lanterns on slender 1.35m rods down to Z = gz + 2.7m
    for iy, cy in enumerate(g_ys):
        create_hanging_lantern_tsuridoro(f"Z02_ZodiacLantern_W_{iy}", (gx - 3.65, cy, gz + 5.10), col, rod_len=1.35, scale=1.0)
        create_hanging_lantern_tsuridoro(f"Z02_ZodiacLantern_E_{iy}", (gx + 3.65, cy, gz + 5.10), col, rod_len=1.35, scale=1.0)

    create_japanese_roof("Z02_Gehaiden_Roof", width_x=10.4, length_y=14.2, height_z=3.65, loc_xyz=(gx, gy, gz + 5.25), col=col, style="irimoya", gold_crests=5)


def build_z03_honden_complex(col):
    """
    Zone 03 — Nai-haiden & 1499 Honden with all Specialist 02 fixes:
      - Open Sanctuary Tamagaki front across Y=[-5.5..+5.5] so Sanctuary_Stairs are 100% unobstructed
      - Flanking Vermilion Standing Lanterns at the base of Sanctuary_Stairs (X=20.0, Y=+-5.2, Z=1.6)
      - Open front colonnade bay on Nai-haiden behind giant Shimenawa rope & 5 white Shide zigzags
      - Oxidized verdigris copper roof (MAT_Copper_Patina_Green) on the Nai-haiden Karahafu gable
        contrasting with the hiwada-buki cypress bark roof on the 1499 Honden
    """
    sz = 3.2

    # Flanking Standing Lanterns at base of Sanctuary Stairs (visible in Cam_02 & ref_cam_02)
    create_vermilion_standing_lantern("Z03_StairLantern_South", (19.8, -5.2, 1.6), col, scale=0.88)
    create_vermilion_standing_lantern("Z03_StairLantern_North", (19.8, 5.2, 1.6), col, scale=0.88)

    # Open Sanctuary Tamagaki Fence (open across Y=[-5.5, 5.5] at X=23.8)
    make_box("Z03_Tamagaki_North", (17.7, 0.22, 1.65), (32.65, 10.5, sz + 0.825), "MAT_Vermilion_ShuIro", col)
    make_box("Z03_Tamagaki_South", (17.7, 0.22, 1.65), (32.65, -10.5, sz + 0.825), "MAT_Vermilion_ShuIro", col)
    make_box("Z03_Tamagaki_East", (0.22, 21.0, 1.65), (41.5, 0.0, sz + 0.825), "MAT_Vermilion_ShuIro", col)
    for y_seg in [-8.0, 8.0]:
        make_box(f"Z03_Tamagaki_West_{y_seg:.1f}", (0.22, 5.0, 1.65), (23.8, y_seg, sz + 0.825), "MAT_Vermilion_ShuIro", col)
        make_box(f"Z03_Tamagaki_WestCap_{y_seg:.1f}", (0.28, 5.0, 0.12), (23.8, y_seg, sz + 1.70), "MAT_Black_Lacquer_Nemaki", col)

    # 1. NAI-HAIDEN (X=26.2, Y=0.0, Z=3.2) — Open front colonnade + Copper-roofed Karahafu Gable
    nx_c = 26.2
    make_box("Z03_Naihaiden_Podium", (6.2, 11.6, 0.72), (nx_c, 0.0, sz + 0.36), "MAT_Granite_Stone_Moss", col)
    # Recessed inner sanctuary wall so front colonnade is open & shaded
    make_box("Z03_Naihaiden_InnerCore", (3.2, 9.8, 3.6), (nx_c + 0.8, 0.0, sz + 2.52), "MAT_Vermilion_ShuIro", col)
    make_box("Z03_Naihaiden_Shikku", (3.4, 9.6, 1.35), (nx_c + 0.8, 0.0, sz + 3.65), "MAT_White_Shikku_Plaster", col)
    # Front colonnade columns along X = nx_c - 2.4
    for ny_c in [-4.8, -2.4, 0.0, 2.4, 4.8]:
        make_cylinder(f"Z03_Naihaiden_FrontCol_{ny_c:.1f}", 0.24, 0.22, 3.85, (nx_c - 2.35, ny_c, sz + 0.72), "MAT_Vermilion_ShuIro", col, segments=20)
    make_box("Z03_Naihaiden_FrontLintel", (0.35, 10.6, 0.28), (nx_c - 2.35, 0.0, sz + 4.15), "MAT_Vermilion_ShuIro", col)

    # Giant Sacred Shimenawa Rope across front lintel with 7 large white Shide streamers
    make_cylinder("Z03_Naihaiden_Shimenawa", 0.22, 0.15, 7.6, (nx_c - 2.65, -3.8, sz + 3.72), "MAT_Straw_Shimenawa", col, segments=16, rot_xyz=(-math.pi * 0.5, 0, 0))
    for sh_i in range(7):
        shy = -3.0 + sh_i * 1.0
        make_box(f"Z03_Naihaiden_Shide_{sh_i}", (0.06, 0.22, 0.65), (nx_c - 2.75, shy, sz + 3.25), "MAT_White_Shikku_Plaster", col)

    # Nai-haiden Roof clad in Oxidized Verdigris Copper (MAT_Copper_Patina_Green) with Karahafu Front Gable
    create_japanese_roof("Z03_Naihaiden_Roof", width_x=8.4, length_y=13.8, height_z=3.15, loc_xyz=(nx_c, 0.0, sz + 4.55), col=col, style="irimoya", gold_crests=3, karahafu_front=True, roof_mat="MAT_Copper_Patina_Green")
    make_box("Z03_Naihaiden_Karahafu_Gold", (0.32, 2.4, 0.48), (nx_c - 4.15, 0.0, sz + 5.65), "MAT_Gold_Kanagu_Leaf", col)

    # 2. HONDEN (1499 Main Sanctuary, X=34.0, Y=0.0, Z=3.2, 5-Bay Inari-zukuri)
    hx_c = 34.0
    make_box("Z03_Honden_Podium", (10.8, 14.4, 1.15), (hx_c, 0.0, sz + 0.575), "MAT_Granite_Stone_Moss", col)
    make_box("Z03_Honden_Verandah", (9.8, 13.4, 0.22), (hx_c, 0.0, sz + 1.25), "MAT_Vermilion_ShuIro", col)
    make_box("Z03_Honden_Verandah_Gold", (10.0, 13.6, 0.10), (hx_c, 0.0, sz + 1.95), "MAT_Gold_Kanagu_Leaf", col)

    make_box("Z03_Honden_Core_Shikku", (8.6, 12.2, 4.8), (hx_c, 0.0, sz + 3.65), "MAT_White_Shikku_Plaster", col)
    for z_hb in [2.2, 3.6, 4.9, 5.95]:
        make_box(f"Z03_Honden_Beam_{z_hb:.2f}", (8.9, 12.5, 0.24), (hx_c, 0.0, sz + z_hb), "MAT_Vermilion_ShuIro", col)
    for by in np.linspace(-6.0, 6.0, 6):
        for bx in np.linspace(hx_c - 4.3, hx_c + 4.3, 4):
            if abs(bx - hx_c) > 4.0 or abs(by) > 5.8:
                make_cylinder(f"Z03_Honden_Col_{bx:.1f}_{by:.1f}", 0.28, 0.26, 4.95, (bx, by, sz + 1.15), "MAT_Vermilion_ShuIro", col, segments=24)

    make_box("Z03_Honden_GoldDoors", (8.85, 2.4, 2.65), (hx_c, 0.0, sz + 3.05), "MAT_Vermilion_ShuIro", col)
    make_box("Z03_Honden_GoldDoorFittings", (8.92, 2.1, 1.85), (hx_c, 0.0, sz + 3.15), "MAT_Gold_Kanagu_Leaf", col)
    for wy_win in [-3.8, 3.8]:
        make_box(f"Z03_Honden_GreenWin_{wy_win:.1f}", (8.88, 1.95, 1.15), (hx_c, wy_win, sz + 3.55), "MAT_Copper_Patina_Green", col)

    create_japanese_roof("Z03_Honden_Roof", width_x=13.8, length_y=17.4, height_z=5.35, loc_xyz=(33.4, 0.0, sz + 5.85), col=col, style="nagare", gold_crests=5, karahafu_front=True)


def build_z04_senbon_torii(col):
    """
    Zone 04 — Senbon Torii Approach, Fork Plaza & Twin Parallel Tunnels with all Specialist 03 & 04 fixes:
      - 7 Approach Torii compressed into X=42.2..47.0m so Fork Plaza (X=47.4..53.4m) is open for Cam_04
      - V-split flagstone walkways with dark stone curbs, central vermilion directional signpost + white plaque,
        two vermilion post lanterns at the tunnel mouths, two pairs of mossy Ishi-doro stone lanterns,
        and stepped rubble-stone retaining walls with wayside Hokora shrines & miniature Torii
      - 38 tightly spaced Myojin Torii per tunnel (pitch 0.50m) with smooth 7% sloped flagstone ramp,
        submerged StoneBases in dark river pebble (jari) borders, and right-hand curve closing off background sky!
    """
    # 1. 7 Grand Approach Torii (X=42.2..47.0m)
    for i in range(7):
        t = i / 6.0
        tx = 42.2 + i * 0.80
        ty = 1.4 + t * 2.6
        tz = 3.2 + t * 1.15
        create_myojin_torii(f"Z04_Approach_Torii_{i:02d}", (tx, ty, tz), span_y=3.5, height_z=4.3, col_radius=0.18, col=col, rot_z=0.12, has_plaque=(i == 0), use_kanji_mat=True)

    # 2. Open Fork Plaza (X=47.4..53.4m, Y=4.0m, Z=4.35..4.65m)
    for s_i in range(8):
        u_p = s_i / 7.0
        px = 47.6 + s_i * 0.72
        pz = 4.35 + u_p * 0.30
        make_box(f"Z04_Fork_CenterPath_{s_i}", (0.76, 2.2, 0.14), (px, 4.0, pz), "MAT_Flagstone_Walkway", col)
        for cb in [-1.18, 1.18]:
            make_box(f"Z04_Fork_CenterCurb_{s_i}_{cb:.2f}", (0.76, 0.12, 0.16), (px, 4.0 + cb, pz + 0.01), "MAT_Granite_Stone_Moss", col)

    # V-split diagonal stone branches into North (Y=6.2) and South (Y=1.8) tunnels
    for br_s, y_target in [(1, 6.2), (-1, 1.8)]:
        for b_i in range(5):
            ub = b_i / 4.0
            bx = 51.2 + b_i * 0.55
            by = 4.0 + ub * (y_target - 4.0)
            bz = 4.55 + ub * 0.12
            ang_z = math.atan2(y_target - 4.0, 2.2)
            make_box(f"Z04_Fork_Branch_{br_s}_{b_i}", (0.65, 1.85, 0.14), (bx, by, bz), "MAT_Flagstone_Walkway", col, rot_xyz=(0, 0, ang_z))

    # Central Vermilion Signpost + White Directional Signboard between the Twin Tunnels (Fixes Specialist 04 Defect 4)
    make_cylinder("Z04_Fork_SignPost", 0.06, 0.06, 1.48, (53.25, 4.0, 4.65), "MAT_Vermilion_ShuIro", col, segments=12)
    make_box("Z04_Fork_SignBoard", (0.06, 0.38, 0.56), (53.20, 4.0, 5.75), "MAT_White_Shikku_Plaster", col)
    make_box("Z04_Fork_SignBorder", (0.05, 0.42, 0.60), (53.21, 4.0, 5.75), "MAT_Vermilion_ShuIro", col)
    for sh_x in [53.8, 54.6, 55.4]:
        make_foliage_dome(f"Z04_Fork_CenterShrub_{sh_x:.1f}", (0.65, 0.75, 0.55), (sh_x, 4.0, 4.85), "MAT_Foliage_Canopy", col, seed=int(sh_x * 10))

    # Two Vermilion Post Lanterns at the Tunnel Mouths + Two Pairs of Mossy Ishi-doro Stone Lanterns inside Cam_04 frustum
    create_vermilion_standing_lantern("Z04_Fork_VermilionLantern_N", (52.7, 7.25, 4.62), col, scale=0.62)
    create_vermilion_standing_lantern("Z04_Fork_VermilionLantern_S", (52.7, 0.75, 4.62), col, scale=0.62)
    create_stone_lantern_ishidoro("Z04_Fork_Lantern_N1", (50.8, 6.75, 4.52), col, scale=0.95)
    create_stone_lantern_ishidoro("Z04_Fork_Lantern_S1", (50.8, 1.25, 4.52), col, scale=0.95)
    create_stone_lantern_ishidoro("Z04_Fork_Lantern_N2", (48.6, 6.15, 4.42), col, scale=0.95)
    create_stone_lantern_ishidoro("Z04_Fork_Lantern_S2", (48.6, 1.85, 4.42), col, scale=0.95)

    # Stepped Rubble-Stone Retaining Walls & Wayside Hokora Shrines + Miniature Torii on Left/Right Flanks (clearly visible in Cam_04)
    for side_s, oy in [(1, 7.65), (-1, 0.35)]:
        make_box(f"Z04_RetainingWall_{side_s}", (4.8, 1.15, 0.92), (49.8, oy, 4.82), "MAT_Granite_Stone_Moss", col)
        make_box(f"Z04_Otsuka_Base_{side_s}", (1.35, 1.10, 0.62), (49.9, oy + side_s * 0.12, 5.50), "MAT_Granite_Stone_Moss", col)
        make_box(f"Z04_Otsuka_Chamber_{side_s}", (0.95, 0.82, 0.70), (49.9, oy + side_s * 0.12, 6.12), "MAT_Cedar_Trunk_Bark", col)
        create_japanese_roof(f"Z04_Otsuka_Roof_{side_s}", width_x=1.62, length_y=1.42, height_z=0.56, loc_xyz=(49.9, oy + side_s * 0.12, 6.48), col=col, style="irimoya", gold_crests=0)
        # Miniature votive Torii in front of wayside hokora shrine
        create_myojin_torii(f"Z04_Mini_Torii_{side_s}", (48.7, oy - side_s * 0.35, 5.20), span_y=0.68, height_z=0.95, col_radius=0.045, col=col, rot_z=0.0, has_plaque=False, use_kanji_mat=False, submerge_stone_base=True)

    # 3. Twin Parallel Senbon Torii Tunnels (38 tightly spaced gates, smooth 7% sloped ramp, right-hand curve closing off background sky)
    n_gates = 38
    pitch_x = 0.49
    for t_name, y_base in [("North", 6.2), ("South", 1.8)]:
        for i in range(n_gates):
            u = i / float(n_gates - 1)
            tx = 53.4 + i * pitch_x
            # Straight at portal entrance (u < 0.12) for symmetric Cam_04 view, then steady right-hand curve (-Y) to close off Cam_03 background sky!
            u_curve = max(0.0, (u - 0.12) / 0.88)
            curve_y = -2.55 * (u_curve ** 1.50)
            dcurve_dx = (-2.55 * 1.50 * (u_curve ** 0.50) / (0.88 * n_gates * pitch_x)) if u > 0.12 else 0.0
            rot_z = math.atan(dcurve_dx)
            ty = y_base + curve_y
            tz = 4.65 + u * 1.38
            pitch_y = -math.atan2(1.38, n_gates * pitch_x)

            # Continuous sloped flagstone ramp & dark river pebble (jari) borders (zero stair steps!)
            make_box(f"Z04_{t_name}_PebbleBed_{i:02d}", (0.56, 2.45, 0.14), (tx, ty, tz - 0.05), "MAT_Pebble_Jari_Dark", col, rot_xyz=(0, pitch_y, rot_z), bevel=0.0)
            make_box(f"Z04_{t_name}_Flagstone_{i:02d}", (0.52, 1.32, 0.14), (tx, ty, tz - 0.02), "MAT_Flagstone_Walkway", col, rot_xyz=(0, pitch_y, rot_z), bevel=0.008)
            for curb_s in [-0.71, 0.71]:
                make_box(f"Z04_{t_name}_Curb_{i:02d}_{curb_s:.2f}", (0.52, 0.09, 0.145), (tx, ty + curb_s * math.cos(rot_z), tz - 0.018), "MAT_Flagstone_Walkway", col, rot_xyz=(0, pitch_y, rot_z), bevel=0.006)

            create_myojin_torii(
                f"Z04_Senbon_{t_name}_{i:02d}",
                (tx, ty, tz),
                span_y=1.96,
                height_z=2.88,
                col_radius=0.128,
                col=col,
                rot_z=rot_z,
                has_plaque=False,
                use_kanji_mat=True,
                submerge_stone_base=True,
            )

            # Refined Hanging Bronze Tunnel Lantern at gate i=9 (~4.4m ahead of Cam_03) and i=23
            if i in (9, 23):
                create_hanging_lantern_tsuridoro(f"Z04_{t_name}_TunnelLantern_{i:02d}", (tx, ty - 0.20, tz + 2.42), col, rod_len=0.32, scale=0.74)
                if t_name == "North":
                    ldata = bpy.data.lights.new(name=f"Z04_LanternGlow_{i:02d}", type="POINT")
                    ldata.energy = 85.0
                    ldata.color = (1.0, 0.68, 0.32)
                    ldata.shadow_soft_size = 0.25
                    lobj = bpy.data.objects.new(name=f"Z04_LanternGlow_{i:02d}", object_data=ldata)
                    lobj.location = (tx, ty - 0.20, tz + 1.82)
                    link_to_collection(lobj, col)

            # Dedicated Komorebi Sun-Slash Spotlights slicing through the South-West inter-column gaps onto the North tunnel flagstones and right-hand kanji columns
            if t_name == "North" and (i in (2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35)):
                sdata = bpy.data.lights.new(name=f"Z04_Komorebi_Slash_{i:02d}", type="SPOT")
                sdata.energy = 950.0
                sdata.color = (1.0, 0.74, 0.40)
                sdata.spot_size = math.radians(32.0)
                sdata.spot_blend = 0.40
                sdata.shadow_soft_size = 0.06
                sobj = bpy.data.objects.new(name=f"Z04_Komorebi_Slash_{i:02d}", object_data=sdata)
                sloc = Vector((tx + 0.22, ty - 1.38, tz + 1.75))
                stgt = Vector((tx + 0.34, ty + 0.35, tz + 0.35))
                sobj.location = sloc
                sobj.rotation_euler = (stgt - sloc).to_track_quat("-Z", "Y").to_euler()
                link_to_collection(sobj, col)

    # Background foliage cluster closing off the curved tunnel horizon in Cam_03
    for bg_i, (bgx, bgy, bgz) in enumerate([(72.4, 3.6, 6.8), (72.8, 2.4, 7.2), (72.4, 4.8, 7.0), (72.6, -0.8, 6.8)]):
        make_foliage_dome(f"Z04_TunnelExit_Foliage_{bg_i}", (2.4, 2.4, 2.2), (bgx, bgy, bgz), "MAT_Foliage_Canopy", col, seed=300 + bg_i)


def build_forest_and_studio_polish(col):
    """
    Mount Inari Cedar & Bamboo Forest + Stage 04 Studio Polish with all Specialist 01-04 fixes:
      - Organic clustered icosphere cedar foliage domes (no 10-sided toy cones!)
      - Lush Mount Inari hillside foliage backdrop behind Nai-haiden/Honden (Y=+10..+24m) for Cam_02
      - Unobstructed Fork Plaza sightline with dense bamboo grove on North flank, cedar trunks on South flank, and overhead canopy arch
      - Camera-invisible Light_Gobo_Canopy slats + dedicated Komorebi Sun angle casting diagonal sun stripes across Senbon Torii flagstones
      - Calibrated MULTIPLE_SCATTERING sky, Sun energy, exposure (-1.65 EV), and ultra-low single-scatter Volume Box
    """
    cedar_positions = [
        (-8.0, 21.0, 1.6, 15.0), (-8.0, -21.0, 1.6, 14.5),
        (6.0, 18.5, 1.6, 16.0), (6.0, -18.5, 1.6, 15.5),
        (18.0, 14.5, 2.4, 16.5), (24.0, 13.5, 3.2, 17.5),
        (30.0, 14.0, 3.2, 18.0), (36.0, 14.5, 3.2, 18.5),
        (36.0, -15.5, 3.2, 16.5), (42.0, 13.0, 3.6, 18.0),
        # Fork Plaza & Senbon Torii framing trees (kept outside Y=[-0.8, +8.8] corridor!)
        (48.5, 9.8, 4.4, 17.5), (48.5, -1.8, 4.4, 17.0),
        (52.5, 10.2, 4.6, 18.0), (52.5, -2.0, 4.6, 17.5),
        # South flank cedars shifted to Y=-5.8m so sunlight enters North tunnel slits unobstructed!
        (57.5, 10.4, 5.0, 18.0), (57.5, -5.8, 5.0, 17.0),
        (62.5, 10.2, 5.4, 18.5), (62.5, -5.8, 5.4, 17.5),
        (67.5, 9.8, 5.8, 18.0), (67.5, -5.5, 5.8, 17.5),
        # Background forest closing behind the twin tunnels at X=72..75m
        (73.0, 6.5, 6.2, 17.5), (73.5, 3.2, 6.2, 18.0), (73.0, 0.0, 6.2, 17.0),
    ]
    for idx, (tx, ty, tz, th) in enumerate(cedar_positions):
        make_cylinder(f"Env_Cedar_Trunk_{idx:02d}", 0.44, 0.18, th * 0.78, (tx, ty, tz), "MAT_Cedar_Trunk_Bark", col, segments=14)
        # Organic clustered foliage domes instead of cones
        for cl_i, (ox, oy, oz, rx, ry, rz) in enumerate([
            (0.0, 0.0, th * 0.62, 3.2, 3.2, 2.4),
            (1.1, 0.8, th * 0.74, 2.6, 2.5, 2.1),
            (-1.0, -0.7, th * 0.78, 2.5, 2.6, 2.0),
            (0.0, 0.0, th * 0.90, 2.1, 2.1, 1.8),
        ]):
            make_foliage_dome(f"Env_Cedar_Crown_{idx:02d}_{cl_i}", (rx, ry, rz), (tx + ox, ty + oy, tz + oz), "MAT_Foliage_Canopy", col, seed=idx * 7 + cl_i)

    # Overhead Mount Inari Canopy Arch across the Fork Plaza (X=51..64m, Y=1..7m, Z=9.2..11.8m) so Cam_04 top border is lush green foliage
    for arch_i, (ax, ay, az) in enumerate([
        (51.5, 7.2, 9.4), (51.5, 4.0, 9.8), (51.5, 0.8, 9.4),
        (55.5, 6.8, 9.6), (55.5, 4.0, 10.2), (55.5, 1.2, 9.6),
        (60.0, 6.2, 10.0), (60.0, 3.8, 10.5), (60.0, 1.4, 10.0),
    ]):
        make_foliage_dome(f"Env_Canopy_Arch_{arch_i:02d}", (2.6, 2.8, 1.65), (ax, ay, az), "MAT_Foliage_Canopy", col, seed=500 + arch_i)

    # Dense Bamboo Grove along the North slope of the Fork Plaza & Tunnel (Y = 8.8..12.2m)
    for b_i in range(44):
        bx = 47.5 + (b_i % 22) * 1.10
        by = 8.9 + (b_i % 4) * 0.55
        bz = 4.4 + ((bx - 47.5) / 24.0) * 1.6
        make_cylinder(f"Env_Bamboo_Culm_{b_i:02d}", 0.06, 0.045, 9.8, (bx, by, bz), "MAT_Bamboo_Culm_Green", col, segments=10, rot_xyz=(0.04 * ((b_i % 3) - 1), 0, 0))
        if b_i % 2 == 0:
            make_foliage_dome(f"Env_Bamboo_Leaves_{b_i:02d}", (1.1, 1.1, 0.85), (bx, by - 0.4, bz + 7.2 + (b_i % 3) * 0.6), "MAT_Foliage_Canopy", col, seed=b_i + 100)

    # Category 1: Camera-invisible Light_Gobo_Canopy slats casting diagonal Komorebi sun stripes (Fixes Specialist 03 & 04)
    for s_i in range(26):
        sx = 53.6 + s_i * 0.72
        sz = 8.2 + (s_i / 26.0) * 1.5
        slat = make_box(f"Light_Gobo_Canopy_Slat_{s_i:02d}", (0.22, 8.5, 0.05), (sx, 5.2, sz), "MAT_Foliage_Canopy", col, rot_xyz=(0, 0, 0.38))
        slat.visible_camera = False

    # Category 5: Global_Atmosphere_Volume_Box (Single-scattering, ultra-low density 0.00045)
    vol_mat = bpy.data.materials.new("MAT_Global_Atmosphere_Volume")
    vol_mat.use_nodes = True
    vnodes = vol_mat.node_tree.nodes
    vlinks = vol_mat.node_tree.links
    vnodes.clear()
    v_out = vnodes.new("ShaderNodeOutputMaterial")
    v_vol = vnodes.new("ShaderNodeVolumePrincipled")
    v_vol.inputs["Color"].default_value = (0.85, 0.80, 0.72, 1.0)
    v_vol.inputs["Density"].default_value = 0.00045
    v_vol.inputs["Anisotropy"].default_value = 0.70
    vlinks.new(v_vol.outputs["Volume"], v_out.inputs["Volume"])

    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= 120.0
        v.co.y *= 75.0
        v.co.z *= 32.0
    vmesh = bpy.data.meshes.new("Global_Atmosphere_Volume_Box")
    bm.to_mesh(vmesh)
    bm.free()
    vobj = bpy.data.objects.new("Global_Atmosphere_Volume_Box", vmesh)
    vobj.location = (25.0, 0.0, 14.0)
    vmesh.materials.append(vol_mat)
    link_to_collection(vobj, col)

    # Calibrated Sun Light (angled from South-Southwest so it illuminates West facades AND slices through Senbon Torii slits!)
    sun_data = bpy.data.lights.new(name="Sun_Kyoto_GoldenHour", type="SUN")
    sun_data.energy = 3.2
    sun_data.angle = math.radians(0.65)
    sun_data.color = (1.0, 0.92, 0.78)
    sun_obj = bpy.data.objects.new(name="Sun_Kyoto_GoldenHour", object_data=sun_data)
    sun_obj.location = (-10.0, -25.0, 35.0)
    # Rays enter from South-Southwest (-Y, -X) at ~44 deg elevation so they illuminate West facades AND pass through the 0.24m Torii column gaps onto the North tunnel flagstones
    sun_obj.rotation_euler = Euler((math.radians(45.0), math.radians(-16.0), math.radians(-18.0)), "XYZ")
    link_to_collection(sun_obj, col)

    world = bpy.data.worlds.new("World_Fushimi_Inari")
    bpy.context.scene.world = world
    world.use_nodes = True
    wnodes = world.node_tree.nodes
    wlinks = world.node_tree.links
    wnodes.clear()
    w_out = wnodes.new("ShaderNodeOutputWorld")
    w_bg = wnodes.new("ShaderNodeBackground")
    w_sky = wnodes.new("ShaderNodeTexSky")
    sky_enums = [e.identifier for e in w_sky.bl_rna.properties["sky_type"].enum_items]
    w_sky.sky_type = "MULTIPLE_SCATTERING" if "MULTIPLE_SCATTERING" in sky_enums else sky_enums[0]
    if hasattr(w_sky, "sun_elevation"):
        w_sky.sun_elevation = math.radians(38.0)
    if hasattr(w_sky, "sun_rotation"):
        w_sky.sun_rotation = math.radians(205.0)
    if hasattr(w_sky, "air_density"):
        w_sky.air_density = 1.2
    if hasattr(w_sky, "dust_density"):
        w_sky.dust_density = 1.2
    w_bg.inputs["Strength"].default_value = 0.14
    wlinks.new(w_sky.outputs["Color"], w_bg.inputs["Color"])
    wlinks.new(w_bg.outputs["Background"], w_out.inputs["Surface"])


def setup_physical_cameras(col):
    for cam_name, ccfg in SPEC["cameras"].items():
        cam_data = bpy.data.cameras.new(cam_name)
        cam_data.sensor_fit = "HORIZONTAL"
        cam_data.sensor_width = float(ccfg["sensor_width_mm"])
        cam_data.lens = float(ccfg["focal_length_mm"])
        cam_data.clip_start = 0.1
        cam_data.clip_end = 500.0

        tgt_name = f"Focus_Target_{cam_name}"
        tgt_empty = bpy.data.objects.new(tgt_name, None)
        tgt_empty.empty_display_type = "PLAIN_AXES"
        tgt_empty.location = Vector(ccfg["target"])
        link_to_collection(tgt_empty, col)

        cam_data.dof.use_dof = True
        cam_data.dof.focus_object = tgt_empty
        cam_data.dof.aperture_fstop = float(ccfg["f_stop"])

        cam_obj = bpy.data.objects.new(cam_name, cam_data)
        cam_obj.location = Vector(ccfg["location"])
        direction = Vector(ccfg["target"]) - cam_obj.location
        cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        link_to_collection(cam_obj, col)


def setup_compositor_and_render_settings():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = (d.type in ("OPTIX", "CUDA"))
    scene.cycles.device = "GPU"
    scene.cycles.samples = 112
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.volume_bounces = 0  # Single scattering prevents milky fog washout (Specialist 04 fix)

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX" if "AgX" in [v.name for v in scene.view_settings.bl_rna.properties["view_transform"].enum_items] else "Filmic"
    scene.view_settings.look = "Medium High Contrast" if "Medium High Contrast" in [v.name for v in scene.view_settings.bl_rna.properties["look"].enum_items] else "None"
    scene.view_settings.exposure = -1.65  # Calibrated exposure (Specialists 01-04 fix)

    try:
        scene.use_nodes = True
        tree = scene.node_tree
        if tree:
            cnodes = tree.nodes
            clinks = tree.links
            cnodes.clear()
            rl = cnodes.new("CompositorNodeRLayers")
            rl.location = (-300, 0)
            comp = cnodes.new("CompositorNodeComposite")
            comp.location = (500, 0)

            glare = cnodes.new("CompositorNodeGlare")
            glare.location = (100, 0)
            if hasattr(glare, "glare_type"):
                glare.glare_type = "FOG_GLOW"
            if hasattr(glare, "threshold"):
                glare.threshold = 1.15
            if "Threshold" in glare.inputs:
                glare.inputs["Threshold"].default_value = 1.15
            if "Strength" in glare.inputs:
                glare.inputs["Strength"].default_value = 0.25

            clinks.new(rl.outputs["Image"], glare.inputs["Image"])
            clinks.new(glare.outputs["Image"], comp.inputs["Image"])
    except Exception as e:
        print("Compositor setup notice:", e)


def export_modular_assets():
    glb_full = os.path.join(MODEL_DIR, "Fushimi_Inari_Full_Complex.glb")
    try:
        bpy.ops.export_scene.gltf(filepath=glb_full, export_format="GLB", use_selection=False)
        print("Exported Full 3D Complex GLB:", glb_full)
    except Exception as e:
        print("GLB export warning:", e)


def render_six_diagnostic_views(round_tag="round02"):
    scene = bpy.context.scene
    r_dir = os.path.join(OUT_DIR, round_tag)
    os.makedirs(r_dir, exist_ok=True)

    # Calibrated Midtone Clay Material (Specialist 01 fix: 0.36 neutral clay so steps & brackets show crisp relief)
    clay_mat = bpy.data.materials.new("MAT_Diagnostic_Clay")
    clay_mat.use_nodes = True
    bsdf = clay_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.34, 0.32, 0.30, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.68

    cam_list = [
        "Cam_01_Romon_Approach",
        "Cam_02_Gehaiden_Honden_Court",
        "Cam_03_Senbon_Torii_Tunnel",
        "Cam_04_Senbon_Fork_And_Sanctuary",
        "Cam_05_Master_Overview",
    ]

    vol_box = bpy.data.objects.get("Global_Atmosphere_Volume_Box")

    # 1. Render Clay Views (Cams 01..05)
    scene.cycles.samples = 56
    if vol_box:
        vol_box.hide_render = True
    scene.view_layers[0].material_override = clay_mat
    for cname in cam_list:
        scene.camera = bpy.data.objects[cname]
        scene.render.filepath = os.path.join(r_dir, f"{cname}_clay.png")
        bpy.ops.render.render(write_still=True)
        print("Rendered Clay:", cname)

    # 2. Render Beauty Views (Cams 01..05)
    scene.view_layers[0].material_override = None
    if vol_box:
        vol_box.hide_render = False
    scene.cycles.samples = 112
    for cname in cam_list:
        scene.camera = bpy.data.objects[cname]
        scene.render.filepath = os.path.join(r_dir, f"{cname}_beauty.png")
        bpy.ops.render.render(write_still=True)
        print("Rendered Beauty:", cname)

    # Save master .blend BEFORE destructive section cut
    blend_path = os.path.join(BASE_DIR, "fushimi_inari_master.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("Saved Master Blend:", blend_path)

    # 3. Render Cam_06_Section_AA_Cutaway using real world-space BMesh bisect_plane at Y = 0.0m
    plane_co = Vector((0.0, 0.0, 0.0))
    plane_no = Vector((0.0, 1.0, 0.0))
    for obj in list(bpy.data.objects):
        if obj.type != "MESH" or obj.name == "Global_Atmosphere_Volume_Box":
            continue
        mw = obj.matrix_world.copy()
        mw_inv = mw.inverted_safe()
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.transform(bm, matrix=mw, verts=bm.verts[:])
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, dist=0.0001, plane_co=plane_co, plane_no=plane_no, clear_inner=True, clear_outer=False)
        bmesh.ops.transform(bm, matrix=mw_inv, verts=bm.verts[:])
        bm.to_mesh(obj.data)
        bm.free()

    if vol_box:
        vol_box.hide_render = True
    scene.camera = bpy.data.objects["Cam_06_Section_AA_Cutaway"]
    scene.view_layers[0].material_override = clay_mat
    scene.cycles.samples = 56
    scene.render.filepath = os.path.join(r_dir, "Cam_06_Section_AA_Cutaway_clay.png")
    bpy.ops.render.render(write_still=True)

    scene.view_layers[0].material_override = None
    scene.cycles.samples = 96
    scene.render.filepath = os.path.join(r_dir, "Cam_06_Section_AA_Cutaway_beauty.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered Section A-A Cutaway (Clay & Beauty)")


def main():
    clear_scene()
    init_materials()

    col_site = get_or_create_collection("00_Site_Terraces")
    col_z01 = get_or_create_collection("01_Z01_Romon_Gate")
    col_z02 = get_or_create_collection("02_Z02_Gehaiden")
    col_z03 = get_or_create_collection("03_Z03_Honden_Complex")
    col_z04 = get_or_create_collection("04_Z04_Senbon_Torii")
    col_env = get_or_create_collection("05_Environment_Forest_Lighting")
    col_cam = get_or_create_collection("06_Cameras_And_Focus")

    build_site_terraces_and_stairs(col_site)
    build_z01_romon_gate(col_z01)
    build_z02_gehaiden(col_z02)
    build_z03_honden_complex(col_z03)
    build_z04_senbon_torii(col_z04)
    build_forest_and_studio_polish(col_env)
    setup_physical_cameras(col_cam)
    setup_compositor_and_render_settings()
    export_modular_assets()
    render_six_diagnostic_views("round02")


if __name__ == "__main__":
    main()
