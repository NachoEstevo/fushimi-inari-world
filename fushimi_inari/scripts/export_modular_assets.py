import bpy
import os

BASE_DIR = r"d:\GithubProjects\3Dexploration\fushimi_inari"
BLEND_PATH = os.path.join(BASE_DIR, "fushimi_inari_master.blend")
MODEL_DIR = os.path.join(BASE_DIR, "assets", "models")
os.makedirs(MODEL_DIR, exist_ok=True)


def export_collection_subset(prefix_list, out_name):
    bpy.ops.object.select_all(action="DESELECT")
    count = 0
    for obj in bpy.data.objects:
        if obj.type == "MESH" and any(obj.name.startswith(p) for p in prefix_list):
            obj.select_set(True)
            count += 1
    if count == 0:
        print("No objects matched for", out_name)
        return
    glb_path = os.path.join(MODEL_DIR, f"{out_name}.glb")
    fbx_path = os.path.join(MODEL_DIR, f"{out_name}.fbx")
    bpy.ops.export_scene.gltf(filepath=glb_path, export_format="GLB", use_selection=True)
    bpy.ops.export_scene.fbx(filepath=fbx_path, use_selection=True, path_mode="COPY", embed_textures=True)
    print(f"Exported {out_name} ({count} meshes) -> .glb & .fbx")


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
    exports = [
        (["Z01_Outer_Grand_Torii"], "Asset_01_Grand_Myojin_Torii"),
        (["Z01_Kitsune_North_Key"], "Asset_02_Kitsune_Guardian_Key"),
        (["Z01_Lantern_North"], "Asset_03_Vermilion_Toro_Lantern"),
        (["Z01_Romon_", "Z01_Tokyo_"], "Asset_04_Romon_Gate_1589"),
        (["Z01_Kairo_North", "Z01_SakeBarrel_North"], "Asset_05_Kairo_Corridor_Wing"),
        (["Z02_"], "Asset_06_Gehaiden_Worship_Hall"),
        (["Z03_Naihaiden_"], "Asset_07_Naihaiden_Karahafu_Hall"),
        (["Z03_Honden_"], "Asset_08_Honden_1499_Sanctuary"),
        (["Z04_Senbon_North_00", "Z04_North_Flagstone_00", "Z04_North_PebbleBed_00"], "Asset_09_Senbon_Torii_Modular_Segment"),
        (["Z04_"], "Asset_10_Senbon_Torii_Twin_Tunnels_Full"),
    ]
    for prefixes, out_name in exports:
        export_collection_subset(prefixes, out_name)


if __name__ == "__main__":
    main()
