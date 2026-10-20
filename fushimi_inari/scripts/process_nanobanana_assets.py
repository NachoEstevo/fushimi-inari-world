import os
import shutil
import numpy as np
from PIL import Image, ImageFilter

BRAIN_DIR = r"C:\Users\nacho\.gemini\antigravity\brain\37041f40-ad5d-4456-a48f-d653e330c06a"
BASE_DIR = r"d:\GithubProjects\3Dexploration\fushimi_inari"
OUT_DIR = os.path.join(BASE_DIR, "outputs")
TEX_DIR = os.path.join(BASE_DIR, "assets", "textures", "nanobanana")
STAGE02_TEX_DIR = os.path.join(BASE_DIR, "assets", "textures")

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(TEX_DIR, exist_ok=True)

ARTIFACTS = {
    "nanobanana_upper_trail_2x2.png": "nanobanana_upper_trail_2x2_1792449064539.jpg",
    "nanobanana_precinct_details_2x2.png": "nanobanana_precinct_details_2x2_1792449058390.jpg",
    "nanobanana_foliage_and_surface_atlas.png": "nanobanana_foliage_and_surface_atlas_1792449057358.jpg",
    "nanobanana_prop_textures_2x2.png": "nanobanana_prop_textures_2x2_1792449290011.jpg",
    "nanobanana_weathered_torii_and_understory_2x2.png": "nanobanana_weathered_torii_and_understory_2x2_1792455896768.jpg",
    "nanobanana_nobori_and_trail_realism_2x2.png": "nanobanana_nobori_and_trail_realism_2x2_1792455897927.jpg",
    "nanobanana_seamless_architecture_pbr_2x2.png": "nanobanana_seamless_architecture_pbr_2x2_1792458813372.jpg",
    "nanobanana_seamless_ground_and_masonry_2x2.png": "nanobanana_seamless_ground_and_masonry_2x2_1792458815000.jpg",
    "nanobanana_pure_foliage_sprigs_2x2.png": "nanobanana_pure_foliage_sprigs_2x2_clean_1792458840415.jpg",
}

for dst_name, src_name in ARTIFACTS.items():
    src_path = os.path.join(BRAIN_DIR, src_name)
    dst_path = os.path.join(OUT_DIR, dst_name)
    if os.path.exists(src_path):
        img = Image.open(src_path).convert("RGB")
        img.save(dst_path)
        print(f"Saved {dst_path} ({img.size})")


def make_seamless_tileable(img_rgb, blend_ratio=0.22):
    """
    Create a 100% seamless tileable texture from an orthographic crop by
    toroidal offset blending with a smooth raised-cosine (Hann) window so
    opposite edges match with zero visible grid lines.
    """
    arr = np.array(img_rgb, dtype=np.float32)
    h, w, _ = arr.shape
    # Shift by half width/height
    shifted_x = np.roll(arr, w // 2, axis=1)
    shifted_xy = np.roll(shifted_x, h // 2, axis=0)

    # Create smooth distance-from-center weight mask in [0, 1]
    u = np.linspace(-1.0, 1.0, w, dtype=np.float32)
    v = np.linspace(-1.0, 1.0, h, dtype=np.float32)
    uu, vv = np.meshgrid(u, v)

    # Raised cosine weights near the borders
    border_x = np.clip((1.0 - np.abs(uu)) / blend_ratio, 0.0, 1.0)
    border_y = np.clip((1.0 - np.abs(vv)) / blend_ratio, 0.0, 1.0)
    wx = 0.5 - 0.5 * np.cos(np.pi * border_x)
    wy = 0.5 - 0.5 * np.cos(np.pi * border_y)

    # Blend horizontal seam first, then vertical seam
    blend_h = arr * wx[:, :, None] + shifted_x * (1.0 - wx[:, :, None])
    shifted_y = np.roll(blend_h, h // 2, axis=0)
    out = blend_h * wy[:, :, None] + shifted_y * (1.0 - wy[:, :, None])
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), mode="RGB")


def save_normal_and_roughness(rgb_img, prefix, out_folder=TEX_DIR, strength=3.2, rough_base=0.65, rough_contrast=0.35, invert_rough=False):
    gray = np.array(rgb_img.convert("L"), dtype=np.float32) / 255.0
    gx = np.roll(gray, -1, axis=1) - np.roll(gray, 1, axis=1)
    gy = np.roll(gray, -1, axis=0) - np.roll(gray, 1, axis=0)
    nx = -gx * strength
    ny = gy * strength
    nz = np.ones_like(gray)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / norm, ny / norm, nz / norm
    norm_rgb = np.stack([(nx * 0.5 + 0.5) * 255.0, (ny * 0.5 + 0.5) * 255.0, (nz * 0.5 + 0.5) * 255.0], axis=-1).astype(np.uint8)
    Image.fromarray(norm_rgb, mode="RGB").save(os.path.join(out_folder, f"{prefix}_normal.png"))

    g_centered = (1.0 - gray) if not invert_rough else gray
    rough = np.clip(rough_base + (g_centered - 0.5) * rough_contrast, 0.06, 0.98)
    rough_u8 = (rough * 255.0).astype(np.uint8)
    Image.fromarray(rough_u8, mode="L").save(os.path.join(out_folder, f"{prefix}_roughness.png"))


def extract_clean_foliage_sprig(quad_rgb, out_name):
    """
    Extract a clean RGBA botanical sprig from a pitch-black (#050507) studio background
    with iterative RGB edge color decontamination (de-fringing) so zero dark/white
    halos ever appear on 3D alpha-cutout or alpha-to-coverage leaf cards.
    """
    arr = np.array(quad_rgb, dtype=np.float32)
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    # Sample background from the 4 corners
    corners = np.concatenate([
        arr[:20, :20].reshape(-1, 3),
        arr[:20, -20:].reshape(-1, 3),
        arr[-20:, :20].reshape(-1, 3),
        arr[-20:, -20:].reshape(-1, 3),
    ], axis=0)
    bg_color = np.median(corners, axis=0)

    dist = np.sqrt(np.sum((arr - bg_color) ** 2, axis=-1))
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    chroma = np.maximum(r, np.maximum(g, b)) - np.minimum(r, np.minimum(g, b))

    # Signal combines distance from dark background, chroma saturation, and luma
    signal = np.maximum(dist, luma * 0.9 + chroma * 0.85)
    alpha = np.clip((signal - 18.0) / 26.0, 0.0, 1.0)

    # Zero out outer 6px frame to guarantee no edge clamping artifacts
    alpha[:6, :] = 0.0
    alpha[-6:, :] = 0.0
    alpha[:, :6] = 0.0
    alpha[:, -6:] = 0.0

    # Slight morphological cleanup & soft anti-aliased edge
    alpha_img = Image.fromarray((alpha * 255.0).astype(np.uint8), mode="L")
    alpha_img = alpha_img.filter(ImageFilter.MedianFilter(size=3))
    alpha_clean = np.array(alpha_img, dtype=np.float32) / 255.0

    # Iterative RGB Color Decontamination (De-fringing):
    # Replace dark background-contaminated edge pixels with pure interior leaf RGB
    rgb_clean = arr.copy()
    core_mask = (alpha_clean > 0.72).astype(np.float32)
    for _ in range(8):
        # Dilate valid RGB outward by averaging 3x3 neighbors weighted by core_mask
        num_r = np.zeros_like(r)
        num_g = np.zeros_like(g)
        num_b = np.zeros_like(b)
        den = np.zeros_like(r)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                w_m = np.roll(np.roll(core_mask, dy, axis=0), dx, axis=1)
                num_r += np.roll(np.roll(rgb_clean[:, :, 0], dy, axis=0), dx, axis=1) * w_m
                num_g += np.roll(np.roll(rgb_clean[:, :, 1], dy, axis=0), dx, axis=1) * w_m
                num_b += np.roll(np.roll(rgb_clean[:, :, 2], dy, axis=0), dx, axis=1) * w_m
                den += w_m
        valid = (core_mask < 0.5) & (den > 0.01)
        rgb_clean[:, :, 0] = np.where(valid, num_r / np.maximum(den, 1e-4), rgb_clean[:, :, 0])
        rgb_clean[:, :, 1] = np.where(valid, num_g / np.maximum(den, 1e-4), rgb_clean[:, :, 1])
        rgb_clean[:, :, 2] = np.where(valid, num_b / np.maximum(den, 1e-4), rgb_clean[:, :, 2])
        core_mask = np.where(den > 0.01, 1.0, core_mask)

    rgba = np.dstack([
        np.clip(rgb_clean, 0, 255).astype(np.uint8),
        (alpha_clean * 255.0).astype(np.uint8),
    ])
    out_img = Image.fromarray(rgba, mode="RGBA")
    out_img.save(os.path.join(TEX_DIR, out_name))

    # Also generate a leaf normal map for crisp specular relief on leaves
    prefix = out_name.replace(".png", "")
    save_normal_and_roughness(Image.fromarray(np.clip(rgb_clean, 0, 255).astype(np.uint8), mode="RGB"), prefix, strength=2.6, rough_base=0.48, rough_contrast=0.25)
    print(f"Extracted de-fringed foliage sprig: {out_name}")


# 1. Process Pure 3D Foliage Sprigs (nanobanana_pure_foliage_sprigs_2x2.png)
sprigs_path = os.path.join(OUT_DIR, "nanobanana_pure_foliage_sprigs_2x2.png")
if os.path.exists(sprigs_path):
    sp = Image.open(sprigs_path).convert("RGB")
    w, h = sp.size
    hw, hh = w // 2, h // 2
    pad = 8
    extract_clean_foliage_sprig(sp.crop((pad, pad, hw - pad, hh - pad)), "foliage_sugi_cedar.png")
    extract_clean_foliage_sprig(sp.crop((hw + pad, pad, w - pad, hh - pad)), "foliage_momiji_maple.png")
    extract_clean_foliage_sprig(sp.crop((pad, hh + pad, hw - pad, h - pad)), "foliage_bamboo_fern.png")
    extract_clean_foliage_sprig(sp.crop((hw + pad, hh + pad, w - pad, h - pad)), "foliage_yatsude_aoki_fern.png")


# 2. Process Seamless Architecture PBR Atlas (nanobanana_seamless_architecture_pbr_2x2.png)
arch_path = os.path.join(OUT_DIR, "nanobanana_seamless_architecture_pbr_2x2.png")
if os.path.exists(arch_path):
    ar = Image.open(arch_path).convert("RGB")
    w, h = ar.size
    hw, hh = w // 2, h // 2
    pad = 14

    # Top-Left: Hiwada-buki Cypress Bark Roof
    q_roof = make_seamless_tileable(ar.crop((pad, pad, hw - pad, hh - pad)), blend_ratio=0.20)
    q_roof.save(os.path.join(TEX_DIR, "roof_hiwadabuki_bark_color.png"))
    save_normal_and_roughness(q_roof, "roof_hiwadabuki_bark", strength=4.2, rough_base=0.78, rough_contrast=0.28)

    # Also update Stage-02 Hiwadabuki_Bark_Roof folder for Blender GLB export
    s02_roof_dir = os.path.join(STAGE02_TEX_DIR, "Hiwadabuki_Bark_Roof")
    os.makedirs(s02_roof_dir, exist_ok=True)
    q_roof.save(os.path.join(s02_roof_dir, "Hiwadabuki_Bark_Roof_BaseColor.png"))
    shutil.copyfile(os.path.join(TEX_DIR, "roof_hiwadabuki_bark_normal.png"), os.path.join(s02_roof_dir, "Hiwadabuki_Bark_Roof_Normal.png"))
    shutil.copyfile(os.path.join(TEX_DIR, "roof_hiwadabuki_bark_roughness.png"), os.path.join(s02_roof_dir, "Hiwadabuki_Bark_Roof_Roughness.png"))

    # Top-Right: Cut Granite Flagstone Paving (Ishidatami / Mikage-ishi)
    q_pave = make_seamless_tileable(ar.crop((hw + pad, pad, w - pad, hh - pad)), blend_ratio=0.18)
    q_pave.save(os.path.join(TEX_DIR, "stone_flagstone_paving_color.png"))
    save_normal_and_roughness(q_pave, "stone_flagstone_paving", strength=3.8, rough_base=0.72, rough_contrast=0.32)

    # Also update Stage-02 Granite_Stone_Moss folder for Blender GLB export
    s02_stone_dir = os.path.join(STAGE02_TEX_DIR, "Granite_Stone_Moss")
    os.makedirs(s02_stone_dir, exist_ok=True)
    q_pave.save(os.path.join(s02_stone_dir, "Granite_Stone_Moss_BaseColor.png"))
    shutil.copyfile(os.path.join(TEX_DIR, "stone_flagstone_paving_normal.png"), os.path.join(s02_stone_dir, "Granite_Stone_Moss_Normal.png"))
    shutil.copyfile(os.path.join(TEX_DIR, "stone_flagstone_paving_roughness.png"), os.path.join(s02_stone_dir, "Granite_Stone_Moss_Roughness.png"))

    # Bottom-Left: Vermilion Shu-iro Lacquered Hinoki Wood
    q_verm = make_seamless_tileable(ar.crop((pad, hh + pad, hw - pad, h - pad)), blend_ratio=0.22)
    q_verm.save(os.path.join(TEX_DIR, "wood_vermilion_shuiro_color.png"))
    save_normal_and_roughness(q_verm, "wood_vermilion_shuiro", strength=2.4, rough_base=0.30, rough_contrast=0.22)

    # Update Stage-02 Vermilion_ShuIro folder for Blender GLB export
    s02_verm_dir = os.path.join(STAGE02_TEX_DIR, "Vermilion_ShuIro")
    os.makedirs(s02_verm_dir, exist_ok=True)
    q_verm.save(os.path.join(s02_verm_dir, "Vermilion_ShuIro_BaseColor.png"))
    shutil.copyfile(os.path.join(TEX_DIR, "wood_vermilion_shuiro_normal.png"), os.path.join(s02_verm_dir, "Vermilion_ShuIro_Normal.png"))
    shutil.copyfile(os.path.join(TEX_DIR, "wood_vermilion_shuiro_roughness.png"), os.path.join(s02_verm_dir, "Vermilion_ShuIro_Roughness.png"))

    # Bottom-Right: Verdigris Green Copper Roof Shingles (Roku-sho)
    q_cop = make_seamless_tileable(ar.crop((hw + pad, hh + pad, w - pad, h - pad)), blend_ratio=0.20)
    q_cop.save(os.path.join(TEX_DIR, "roof_copper_patina_color.png"))
    save_normal_and_roughness(q_cop, "roof_copper_patina", strength=3.4, rough_base=0.46, rough_contrast=0.28)
    print("Processed seamless architectural PBR textures.")


# 3. Process Seamless Ground & Masonry PBR Atlas (nanobanana_seamless_ground_and_masonry_2x2.png)
gnd_path = os.path.join(OUT_DIR, "nanobanana_seamless_ground_and_masonry_2x2.png")
if os.path.exists(gnd_path):
    gn = Image.open(gnd_path).convert("RGB")
    w, h = gn.size
    hw, hh = w // 2, h // 2
    pad = 14

    # Top-Left: Forest Soil, Cedar Needles & Sugigoke Moss (seamless, no repeating red leaf grid!)
    q_soil = make_seamless_tileable(gn.crop((pad, pad, hw - pad, hh - pad)), blend_ratio=0.25)
    q_soil.save(os.path.join(TEX_DIR, "surface_forest_soil_leaves.png"))
    save_normal_and_roughness(q_soil, "surface_forest_soil_leaves", strength=3.8, rough_base=0.86, rough_contrast=0.22)

    # Top-Right: Courtyard Dark Gravel (Jari)
    q_grav = make_seamless_tileable(gn.crop((hw + pad, pad, w - pad, hh - pad)), blend_ratio=0.25)
    q_grav.save(os.path.join(TEX_DIR, "surface_courtyard_gravel_color.png"))
    save_normal_and_roughness(q_grav, "surface_courtyard_gravel", strength=4.2, rough_base=0.84, rough_contrast=0.20)

    # Bottom-Left: Pure Orthographic Ishigaki Stone Retaining Wall
    q_wall = make_seamless_tileable(gn.crop((pad, hh + pad, hw - pad, h - pad)), blend_ratio=0.22)
    q_wall.save(os.path.join(TEX_DIR, "stone_ishigaki_moss_leaves_color.png"))
    q_wall.save(os.path.join(TEX_DIR, "surface_mossy_granite.png"))
    save_normal_and_roughness(q_wall, "stone_ishigaki_moss_leaves", strength=4.6, rough_base=0.78, rough_contrast=0.30)

    # Bottom-Right: Woven Dark Bamboo Sudare Screen (keep non-rolled for framed blinds, plus seamless version)
    q_sudare = gn.crop((hw + pad, hh + pad, w - pad, h - pad))
    q_sudare.save(os.path.join(TEX_DIR, "prop_sudare_bamboo_blind.png"))
    save_normal_and_roughness(q_sudare, "prop_sudare_bamboo_blind", strength=3.2, rough_base=0.68, rough_contrast=0.25)
    print("Processed seamless ground & masonry PBR textures.")


# 4. Re-verify Weathered Torii, Bark, Ema, Otsuka, Nobori from previous sheets
weath_path = os.path.join(OUT_DIR, "nanobanana_weathered_torii_and_understory_2x2.png")
if os.path.exists(weath_path):
    wt = Image.open(weath_path).convert("RGB")
    w, h = wt.size
    hw, hh = w // 2, h // 2
    pad = 12
    q_torii = wt.crop((pad, pad, hw - pad, hh - pad))
    q_torii.save(os.path.join(TEX_DIR, "torii_weathered_kanji_color.png"))
    save_normal_and_roughness(q_torii, "torii_weathered_kanji", strength=3.8, rough_base=0.62, rough_contrast=0.42)

    q_bark = make_seamless_tileable(wt.crop((hw + pad, pad, w - pad, hh - pad)), blend_ratio=0.22)
    q_bark.save(os.path.join(TEX_DIR, "bark_mossy_roots_color.png"))
    q_bark.save(os.path.join(TEX_DIR, "bark_sugi_cedar_moss.png"))
    save_normal_and_roughness(q_bark, "bark_mossy_roots", strength=4.2, rough_base=0.84, rough_contrast=0.28)

print("All Nano Banana PBR textures & de-fringed foliage sprigs processed successfully!")
