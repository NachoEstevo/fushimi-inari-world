import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r"d:\GithubProjects\3Dexploration\fushimi_inari"
TEX_DIR = os.path.join(BASE_DIR, "assets", "textures")
OUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(TEX_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)


def fbm_noise(shape, scales=(4, 8, 16, 32, 64), weights=(0.35, 0.25, 0.20, 0.12, 0.08), seed=42):
    rng = np.random.default_rng(seed)
    h, w = shape
    acc = np.zeros((h, w), dtype=np.float32)
    for sc, wt in zip(scales, weights):
        gh, gw = max(2, h // sc), max(2, w // sc)
        grid = rng.random((gh, gw), dtype=np.float32)
        grid[-1, :] = grid[0, :]
        grid[:, -1] = grid[:, 0]
        img = Image.fromarray((grid * 255).astype(np.uint8)).resize((w, h), Image.Resampling.BICUBIC)
        acc += (np.asarray(img, dtype=np.float32) / 255.0) * wt
    acc = (acc - acc.min()) / max(1e-6, (acc.max() - acc.min()))
    return acc


def height_to_normal(height_map, strength=2.5):
    dzdx = (np.roll(height_map, -1, axis=1) - np.roll(height_map, 1, axis=1)) * 0.5 * strength
    dzdy = (np.roll(height_map, -1, axis=0) - np.roll(height_map, 1, axis=0)) * 0.5 * strength
    nx = -dzdx
    ny = dzdy
    nz = np.ones_like(height_map)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / norm, ny / norm, nz / norm
    rgb = np.stack([(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, (nz * 0.5 + 0.5) * 255], axis=-1)
    return rgb.clip(0, 255).astype(np.uint8)


def save_5channel_pbr(name, base_rgb, rough, metal, height, normal_strength=2.5):
    p_dir = os.path.join(TEX_DIR, name)
    os.makedirs(p_dir, exist_ok=True)
    normal = height_to_normal(height, strength=normal_strength)

    Image.fromarray(base_rgb.clip(0, 255).astype(np.uint8), "RGB").save(os.path.join(p_dir, f"{name}_BaseColor.png"))
    Image.fromarray((rough.clip(0, 1) * 255).astype(np.uint8), "L").save(os.path.join(p_dir, f"{name}_Roughness.png"))
    Image.fromarray((metal.clip(0, 1) * 255).astype(np.uint8), "L").save(os.path.join(p_dir, f"{name}_Metallic.png"))
    Image.fromarray(normal, "RGB").save(os.path.join(p_dir, f"{name}_Normal.png"))
    Image.fromarray((height.clip(0, 1) * 255).astype(np.uint8), "L").save(os.path.join(p_dir, f"{name}_Height.png"))
    print(f"Saved 5-channel PBR set: {name}")
    return p_dir


def build_all_pbr_sets(size=1024):
    y, x = np.mgrid[0:size, 0:size].astype(np.float32) / size

    # 1. MAT_Vermilion_ShuIro (Deep authentic Fushimi Inari mercury-vermilion #C8260E with subtle hinoki woodgrain)
    n1 = fbm_noise((size, size), scales=(4, 8, 16, 32), weights=(0.4, 0.3, 0.2, 0.1), seed=101)
    grain = np.sin((x * 64.0 + n1 * 2.5) * 2 * math.pi) * 0.5 + 0.5
    height_v = 0.5 + 0.16 * (grain - 0.5) + 0.14 * (n1 - 0.5)
    base_v = np.zeros((size, size, 3), dtype=np.float32)
    base_v[..., 0] = 198 + 16 * (grain - 0.5) - 18 * (1 - n1)
    base_v[..., 1] = 36 + 8 * (grain - 0.5) - 6 * (1 - n1)
    base_v[..., 2] = 12 + 4 * (grain - 0.5)
    rough_v = 0.26 + 0.16 * (1.0 - grain) + 0.10 * n1
    metal_v = np.zeros((size, size), dtype=np.float32)
    save_5channel_pbr("Vermilion_ShuIro", base_v, rough_v, metal_v, height_v, normal_strength=2.2)

    # 2. MAT_Torii_Kanji_Column (1024x1024 with bold vertical Kanji centered on u=0.50 camera-facing -X face & inward angles)
    img_col = Image.fromarray(base_v.clip(0, 255).astype(np.uint8), "RGB")
    draw = ImageDraw.Draw(img_col)
    # Bottom 24% is deep satin black Nemaki sleeve (aligned with 24% 3D Nemaki cylinder)
    nemaki_top = int(size * 0.76)
    draw.rectangle([0, nemaki_top, size, size], fill=(10, 10, 12))
    draw.rectangle([0, nemaki_top - 4, size, nemaki_top + 2], fill=(28, 26, 24))

    font_sz = int(size * 0.055)
    try:
        font_k = ImageFont.truetype("C:/Windows/Fonts/YuGothB.ttc", font_sz)
    except Exception:
        font_k = ImageFont.load_default()

    # Place vertical kanji columns around u=0.50 (-X face towards Cam_03/Cam_04) and u=0.36 / u=0.64 (inward-turned tunnel sides)
    inscriptions = [
        (int(size * 0.47), "平成二十七年十月吉日建之"),
        (int(size * 0.34), "京都市伏見区 稲荷講社奉納"),
        (int(size * 0.60), "平成二十九年三月吉日建之"),
        (int(size * 0.18), "大阪市中央区 奉納講社建之"),
        (int(size * 0.80), "東京都千代田区 奉納吉日建"),
    ]
    mask_kanji = Image.new("L", (size, size), 0)
    draw_m = ImageDraw.Draw(mask_kanji)
    for xpos, text in inscriptions:
        yy = int(size * 0.06)
        for ch in text:
            if ch != " " and yy < nemaki_top - font_sz:
                draw.text((xpos, yy), ch, fill=(10, 8, 8), font=font_k, stroke_width=1, stroke_fill=(10, 8, 8))
                draw_m.text((xpos, yy), ch, fill=235, font=font_k, stroke_width=1, stroke_fill=235)
            yy += int(font_sz * 1.06)

    kanji_arr = np.asarray(mask_kanji, dtype=np.float32) / 255.0
    col_rgb = np.asarray(img_col, dtype=np.float32)
    rough_col = rough_v.copy()
    rough_col[nemaki_top:, :] = 0.30
    rough_col = np.clip(rough_col - 0.10 * kanji_arr, 0.14, 0.9)
    metal_col = np.zeros((size, size), dtype=np.float32)
    metal_col[nemaki_top:, :] = 0.18
    height_col = height_v - 0.22 * kanji_arr
    height_col[nemaki_top:, :] = 0.58
    save_5channel_pbr("Torii_Kanji_Column", col_rgb, rough_col, metal_col, height_col, normal_strength=3.2)

    # 3. MAT_Hiwadabuki_Bark_Roof (Deep charcoal-umber weathered cypress bark shingles)
    n_roof = fbm_noise((size, size), scales=(4, 8, 16, 32), weights=(0.3, 0.3, 0.25, 0.15), seed=202)
    courses = np.mod(y * 42.0 + 0.04 * np.sin(x * 18 * math.pi), 1.0)
    fiber = np.sin(x * 200.0 * math.pi + n_roof * 6.0) * 0.5 + 0.5
    height_r = 0.35 + 0.45 * courses + 0.12 * fiber + 0.08 * n_roof
    base_r = np.zeros((size, size, 3), dtype=np.float32)
    base_r[..., 0] = 24 + 12 * courses + 7 * n_roof
    base_r[..., 1] = 19 + 9 * courses + 5 * n_roof
    base_r[..., 2] = 16 + 7 * courses + 4 * n_roof
    rough_r = 0.78 + 0.15 * (1.0 - courses)
    metal_r = np.zeros((size, size), dtype=np.float32)
    save_5channel_pbr("Hiwadabuki_Bark_Roof", base_r, rough_r, metal_r, height_r, normal_strength=4.5)

    # 4. MAT_Granite_Stone_Moss (Crisp neutral Kyoto grey granite ashlar with subtle crevice moss)
    n_stone = fbm_noise((size, size), scales=(4, 8, 16, 32, 64), weights=(0.3, 0.25, 0.2, 0.15, 0.1), seed=303)
    n_moss = fbm_noise((size, size), scales=(8, 16, 32), weights=(0.5, 0.3, 0.2), seed=404)
    gx = np.abs(np.mod(x * 4.0 + 0.5 * (np.floor(y * 8.0) % 2), 1.0) - 0.5)
    gy = np.abs(np.mod(y * 8.0, 1.0) - 0.5)
    joint = np.maximum((gx > 0.475).astype(np.float32), (gy > 0.47).astype(np.float32))
    moss_mask = np.clip((n_moss - 0.72) * 2.2 + joint * 0.28, 0.0, 0.65)
    height_g = np.clip(0.55 + 0.35 * (n_stone - 0.5) - 0.35 * joint, 0.0, 1.0)
    base_g = np.zeros((size, size, 3), dtype=np.float32)
    gran_val = 96 + 38 * (n_stone - 0.5) - 32 * joint
    base_g[..., 0] = gran_val * (1 - moss_mask) + 38 * moss_mask
    base_g[..., 1] = (gran_val - 1) * (1 - moss_mask) + 58 * moss_mask
    base_g[..., 2] = (gran_val - 3) * (1 - moss_mask) + 32 * moss_mask
    rough_g = 0.78 + 0.15 * (1.0 - n_stone) + 0.06 * moss_mask
    metal_g = np.zeros((size, size), dtype=np.float32)
    save_5channel_pbr("Granite_Stone_Moss", base_g, rough_g, metal_g, height_g, normal_strength=3.8)

    # 5. MAT_Gold_Kanagu_Leaf
    n_gold = fbm_noise((size, size), scales=(8, 16, 32), weights=(0.5, 0.3, 0.2), seed=505)
    radial = np.sin(np.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) * 28.0 * math.pi) * 0.5 + 0.5
    height_au = 0.5 + 0.25 * radial + 0.15 * (n_gold - 0.5)
    base_au = np.zeros((size, size, 3), dtype=np.float32)
    base_au[..., 0] = 238 - 20 * (1 - n_gold)
    base_au[..., 1] = 184 - 18 * (1 - n_gold)
    base_au[..., 2] = 52 + 12 * radial
    rough_au = 0.18 + 0.14 * (1.0 - n_gold)
    metal_au = np.full((size, size), 0.94, dtype=np.float32)
    save_5channel_pbr("Gold_Kanagu_Leaf", base_au, rough_au, metal_au, height_au, normal_strength=2.6)

    # Update 5-channel PBR verification sheet
    sets = ["Vermilion_ShuIro", "Torii_Kanji_Column", "Hiwadabuki_Bark_Roof", "Granite_Stone_Moss", "Gold_Kanagu_Leaf"]
    channels = ["BaseColor", "Roughness", "Metallic", "Normal", "Height"]
    thumb = 180
    sheet = Image.new("RGB", (thumb * 5 + 160, thumb * len(sets) + 90), (14, 20, 28))
    sdraw = ImageDraw.Draw(sheet)
    sdraw.text((20, 15), "STAGE 02/03 — CALIBRATED 1024x1024 5-CHANNEL PBR MATERIAL SETS (UVMap_Metric_1m COMPLIANT)", fill=(240, 246, 252))
    for ci, ch in enumerate(channels):
        sdraw.text((150 + ci * thumb, 45), ch.upper(), fill=(140, 180, 216))
    for ri, sname in enumerate(sets):
        sdraw.text((15, 70 + ri * thumb + thumb // 2), sname.replace("_", "\n"), fill=(255, 210, 125))
        for ci, ch in enumerate(channels):
            im = Image.open(os.path.join(TEX_DIR, sname, f"{sname}_{ch}.png")).convert("RGB").resize((thumb - 8, thumb - 8))
            sheet.paste(im, (145 + ci * thumb, 68 + ri * thumb))

    out_sheet = os.path.join(OUT_DIR, "stage02_pbr_5channel_sheet.png")
    sheet.save(out_sheet)
    print("Saved updated 5-channel PBR verification sheet:", out_sheet)


if __name__ == "__main__":
    build_all_pbr_sets()
