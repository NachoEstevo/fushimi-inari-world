import os
import sys
from PIL import Image, ImageDraw

BASE_DIR = r"d:\GithubProjects\3Dexploration\fushimi_inari"
OUT_DIR = os.path.join(BASE_DIR, "outputs")

CAM_ORDER = [
    ("Cam_01_Romon_Approach", "CAM 01 // ROMON GATE & KITSUNE APPROACH"),
    ("Cam_02_Gehaiden_Honden_Court", "CAM 02 // GE-HAIDEN & NAI-HAIDEN COURTYARD"),
    ("Cam_03_Senbon_Torii_Tunnel", "CAM 03 // SENBON TORII TUNNEL INTERIOR"),
    ("Cam_04_Senbon_Fork_And_Sanctuary", "CAM 04 // SENBON TORII FORK PLAZA (TWIN TUNNELS)"),
    ("Cam_05_Master_Overview", "CAM 05 // MASTER PRECINCT AERIAL OVERVIEW"),
    ("Cam_06_Section_AA_Cutaway", "CAM 06 // WORLD-SPACE SECTION A-A CUTAWAY (BMESH BISECT)"),
]


def compose_6view_sheet(round_tag="round01", mode="beauty"):
    r_dir = os.path.join(OUT_DIR, round_tag)
    tw, th = 640, 360
    W, H = tw * 3 + 80, th * 2 + 130
    sheet = Image.new("RGB", (W, H), (12, 18, 26))
    draw = ImageDraw.Draw(sheet)

    title = f"FUSHIMI INARI TAISHA — {round_tag.upper()} 6-CAMERA DIAGNOSTIC SHEET ({mode.upper()} MODE)"
    draw.text((25, 18), title, fill=(240, 246, 252))

    positions = [
        (20, 55), (20 + tw + 20, 55), (20 + (tw + 20) * 2, 55),
        (20, 55 + th + 40), (20 + tw + 20, 55 + th + 40), (20 + (tw + 20) * 2, 55 + th + 40),
    ]

    for (cname, label), (px, py) in zip(CAM_ORDER, positions):
        img_path = os.path.join(r_dir, f"{cname}_{mode}.png")
        if os.path.exists(img_path):
            im = Image.open(img_path).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
            sheet.paste(im, (px, py))
        draw.rectangle([px, py, px + tw, py + th], outline=(255, 107, 74) if mode == "beauty" else (140, 180, 216), width=2)
        draw.text((px + 6, py + th + 8), label, fill=(220, 232, 245))

    out_path = os.path.join(OUT_DIR, f"{round_tag}_6view_{mode}_sheet.png")
    sheet.save(out_path)
    print("Saved 6-view sheet:", out_path)
    return out_path


def compose_before_after_matrix(before_tag="round01", after_tag="round02"):
    b_dir = os.path.join(OUT_DIR, before_tag)
    a_dir = os.path.join(OUT_DIR, after_tag)
    tw, th = 460, 258
    cols = 4
    rows = 3  # Row 0: Reference, Row 1: Round 01 (Before), Row 2: Round 02 (After Final Polish)
    W = tw * cols + 100
    H = th * rows + 150
    sheet = Image.new("RGB", (W, H), (12, 18, 26))
    draw = ImageDraw.Draw(sheet)

    draw.text(
        (25, 16),
        "FUSHIMI INARI TAISHA — FIXED-CAMERA BEFORE / AFTER GAUNTLET MATRIX (REF vs ROUND 01 vs FINAL POLISH)",
        fill=(240, 246, 252),
    )

    ref_files = [
        ("Cam_01_Romon_Approach", os.path.join(OUT_DIR, "refs", "ref_cam_01.png")),
        ("Cam_02_Gehaiden_Honden_Court", os.path.join(OUT_DIR, "refs", "ref_cam_02.png")),
        ("Cam_03_Senbon_Torii_Tunnel", os.path.join(OUT_DIR, "refs", "ref_cam_03.png")),
        ("Cam_04_Senbon_Fork_And_Sanctuary", os.path.join(OUT_DIR, "refs", "ref_cam_04.png")),
    ]

    for ci, (cname, rpath) in enumerate(ref_files):
        px = 25 + ci * (tw + 18)
        # Row 0: Stage 02 Reference
        if os.path.exists(rpath):
            im = Image.open(rpath).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
            sheet.paste(im, (px, 55))
        draw.rectangle([px, 55, px + tw, 55 + th], outline=(255, 210, 125), width=2)
        draw.text((px + 6, 55 + th + 5), f"REF // {cname}", fill=(255, 210, 125))

        # Row 1: Before (Round 01)
        bpath = os.path.join(b_dir, f"{cname}_beauty.png")
        py1 = 55 + th + 30
        if os.path.exists(bpath):
            im = Image.open(bpath).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
            sheet.paste(im, (px, py1))
        draw.rectangle([px, py1, px + tw, py1 + th], outline=(140, 180, 216), width=2)
        draw.text((px + 6, py1 + th + 5), f"BEFORE ({before_tag.upper()}) // {cname}", fill=(140, 180, 216))

        # Row 2: After (Round 02 Final Studio Polish)
        apath = os.path.join(a_dir, f"{cname}_beauty.png")
        py2 = py1 + th + 30
        if os.path.exists(apath):
            im = Image.open(apath).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
            sheet.paste(im, (px, py2))
        draw.rectangle([px, py2, px + tw, py2 + th], outline=(92, 224, 184), width=2)
        draw.text((px + 6, py2 + th + 5), f"AFTER ({after_tag.upper()} POLISH) // {cname}", fill=(92, 224, 184))

    out_path = os.path.join(OUT_DIR, "stage05_before_after_matrix.png")
    sheet.save(out_path)
    print("Saved Before/After Matrix:", out_path)
    return out_path


if __name__ == "__main__":
    tag = sys.argv[1] if len(sys.argv) > 1 else "round01"
    compose_6view_sheet(tag, "clay")
    compose_6view_sheet(tag, "beauty")
    if tag != "round01":
        compose_before_after_matrix("round01", tag)
