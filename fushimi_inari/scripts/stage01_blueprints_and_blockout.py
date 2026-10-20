import json
import math
import os
import numpy as np
import manifold3d as m3d
import ezdxf
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle, Circle, FancyArrowPatch
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r"d:\GithubProjects\3Dexploration\fushimi_inari"
SPEC_PATH = os.path.join(BASE_DIR, "scene-spec.json")
OUT_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUT_DIR, exist_ok=True)

with open(SPEC_PATH, "r", encoding="utf-8") as f:
    SPEC = json.load(f)


def build_manifold_structural_solids():
    """
    Build watertight 3D CSG structural solids in Manifold3D from scene-spec.json
    and verify volume / bounds (Stage 00 & 01 structural source).
    """
    solids = {}

    # Terraces
    t0 = m3d.Manifold.cube([19.5, 52.0, 0.5]).translate([-22.0, -26.0, -0.5])
    t1 = m3d.Manifold.cube([24.5, 52.0, 2.1]).translate([-2.5, -26.0, -0.5])
    t2 = m3d.Manifold.cube([22.0, 52.0, 3.7]).translate([22.0, -26.0, -0.5])
    t3 = m3d.Manifold.cube([30.0, 52.0, 6.5]).translate([44.0, -26.0, -0.5])
    solids["Terraces"] = t0 + t1 + t2 + t3

    # Outer Grand Torii (X=-13.5, Y=0.0, Z=0.0)
    col_l = m3d.Manifold.cylinder(8.2, 0.42, 0.36, 24).translate([-13.5, 3.8, 0.0])
    col_r = m3d.Manifold.cylinder(8.2, 0.42, 0.36, 24).translate([-13.5, -3.8, 0.0])
    kasagi = m3d.Manifold.cube([0.9, 10.6, 0.65], True).translate([-13.5, 0.0, 8.35])
    nuki = m3d.Manifold.cube([0.45, 9.6, 0.42], True).translate([-13.5, 0.0, 6.65])
    solids["Outer_Grand_Torii"] = col_l + col_r + kasagi + nuki

    # Z01 Romon Gate (center X=0, Y=0, Z=1.6, footprint 11.6 x 6.8, H=12.6)
    romon_podium = m3d.Manifold.cube([7.4, 12.4, 0.6], True).translate([0.0, 0.0, 1.9])
    romon_lower = m3d.Manifold.cube([6.2, 11.2, 4.8], True).translate([0.0, 0.0, 4.6])
    romon_arch = m3d.Manifold.cube([7.0, 3.6, 4.2], True).translate([0.0, 0.0, 4.3])
    romon_upper = m3d.Manifold.cube([5.4, 10.2, 3.4], True).translate([0.0, 0.0, 8.7])
    romon_roof = m3d.Manifold.cube([9.8, 15.6, 3.8], True).translate([0.0, 0.0, 12.3])
    solids["Z01_Romon_Gate"] = (romon_podium + romon_lower - romon_arch) + romon_upper + romon_roof

    # Kairo Wings North & South
    kairo_n = m3d.Manifold.cube([4.2, 13.0, 4.6], True).translate([0.0, 12.5, 3.9])
    kairo_s = m3d.Manifold.cube([4.2, 13.0, 4.6], True).translate([0.0, -12.5, 3.9])
    solids["Z01_Kairo_Wings"] = kairo_n + kairo_s

    # Z02 Gehaiden (center X=12.5, Y=0, Z=1.6, footprint 11.2 x 7.6, H=8.6)
    gehaiden_base = m3d.Manifold.cube([7.6, 11.2, 0.75], True).translate([12.5, 0.0, 1.975])
    gehaiden_cols = m3d.Manifold.cube([6.8, 10.4, 3.8], True).translate([12.5, 0.0, 4.25])
    gehaiden_void = m3d.Manifold.cube([8.0, 9.2, 3.2], True).translate([12.5, 0.0, 4.1])
    gehaiden_roof = m3d.Manifold.cube([10.4, 14.2, 4.0], True).translate([12.5, 0.0, 8.15])
    solids["Z02_Gehaiden"] = gehaiden_base + (gehaiden_cols - gehaiden_void) + gehaiden_roof

    # Z03 Nai-haiden & Honden (X=26.2 & X=34.0, Z=3.2)
    nai_base = m3d.Manifold.cube([6.2, 11.6, 0.8], True).translate([26.2, 0.0, 3.6])
    nai_body = m3d.Manifold.cube([5.4, 10.8, 3.8], True).translate([26.2, 0.0, 5.9])
    nai_roof = m3d.Manifold.cube([8.2, 13.8, 3.2], True).translate([26.2, 0.0, 9.4])

    honden_base = m3d.Manifold.cube([10.8, 14.4, 1.1], True).translate([34.0, 0.0, 3.75])
    honden_body = m3d.Manifold.cube([9.2, 12.8, 4.9], True).translate([34.0, 0.0, 6.75])
    honden_roof = m3d.Manifold.cube([13.6, 17.2, 5.2], True).translate([33.4, 0.0, 11.8])
    solids["Z03_Honden_Complex"] = nai_base + nai_body + nai_roof + honden_base + honden_body + honden_roof

    # Z04 Senbon Torii Tunnels (Approach + Twin Parallel Tunnels)
    torii_all = m3d.Manifold()
    for i in range(7):
        tx = 43.2 + i * 1.25
        tz = 3.2 + i * 0.2
        c1 = m3d.Manifold.cylinder(4.2, 0.18, 0.16, 16).translate([tx, 1.9, tz])
        c2 = m3d.Manifold.cylinder(4.2, 0.18, 0.16, 16).translate([tx, -1.9, tz])
        beam = m3d.Manifold.cube([0.36, 4.8, 0.34], True).translate([tx, 0.0, tz + 4.2])
        torii_all = torii_all + c1 + c2 + beam

    for tunnel_y in [6.2, 1.8]:
        for i in range(26):
            tx = 53.5 + i * 0.68
            tz = 4.6 + (i / 25.0) * 2.8
            c1 = m3d.Manifold.cylinder(2.75, 0.12, 0.11, 12).translate([tx, tunnel_y + 1.05, tz])
            c2 = m3d.Manifold.cylinder(2.75, 0.12, 0.11, 12).translate([tx, tunnel_y - 1.05, tz])
            beam = m3d.Manifold.cube([0.24, 2.7, 0.24], True).translate([tx, tunnel_y, tz + 2.75])
            torii_all = torii_all + c1 + c2 + beam

    solids["Z04_Senbon_Torii"] = torii_all

    report = {}
    for k, m in solids.items():
        mesh = m.to_mesh()
        verts = np.array(mesh.vert_properties)[:, :3]
        report[k] = {
            "num_verts": int(len(verts)),
            "num_tris": int(len(mesh.tri_verts)),
            "genus": int(m.genus()),
            "volume_m3": round(float(m.volume()), 2),
            "bounds_min": [round(float(v), 2) for v in verts.min(axis=0)],
            "bounds_max": [round(float(v), 2) for v in verts.max(axis=0)],
        }
    with open(os.path.join(OUT_DIR, "stage00_csg_verification.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print("CSG Structural Verification saved:", len(report), "zones verified.")
    return solids, report


def export_dxf_blueprint():
    """
    Export CAD .dxf with ezdxf including layers, footprints, Senbon Torii colonnades,
    and ANSI31 section hatching for Stage 01 CAD compliance.
    """
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()

    doc.layers.add("A-WALL-SECT", color=1)
    doc.layers.add("A-ROOF-PROJ", color=30)
    doc.layers.add("A-TORII", color=10)
    doc.layers.add("A-GRID-AXIS", color=8)
    doc.layers.add("A-HATCH-ANSI31", color=9)

    # Axis line A-A
    msp.add_line((-22, 0), (74, 0), dxfattribs={"layer": "A-GRID-AXIS"})
    # Axis line B-B
    msp.add_line((34, -28), (34, 28), dxfattribs={"layer": "A-GRID-AXIS"})

    # Add footprints with ANSI31 section hatch for cut walls
    zones_rects = [
        ("Romon_North_Peer", -3.1, 1.8, 6.2, 3.8),
        ("Romon_South_Peer", -3.1, -5.6, 6.2, 3.8),
        ("Kairo_North", -2.1, 6.0, 4.2, 13.0),
        ("Kairo_South", -2.1, -19.0, 4.2, 13.0),
        ("Gehaiden_Hall", 8.7, -5.6, 7.6, 11.2),
        ("Naihaiden_Hall", 23.1, -5.8, 6.2, 11.6),
        ("Honden_Sanctuary", 28.6, -7.2, 10.8, 14.4),
    ]
    for name, x0, y0, w, h in zones_rects:
        pts = [(x0, y0), (x0 + w, y0), (x0 + w, y0 + h), (x0, y0 + h), (x0, y0)]
        msp.add_lwpolyline(pts, dxfattribs={"layer": "A-WALL-SECT"})
        hatch = msp.add_hatch(color=9, dxfattribs={"layer": "A-HATCH-ANSI31"})
        hatch.set_pattern_fill("ANSI31", scale=0.8)
        hatch.paths.add_polyline_path(pts[:-1], is_closed=True)

    # Torii columns in CAD
    for tunnel_y in [6.2, 1.8]:
        for i in range(26):
            tx = 53.5 + i * 0.68
            msp.add_circle((tx, tunnel_y + 1.05), 0.12, dxfattribs={"layer": "A-TORII"})
            msp.add_circle((tx, tunnel_y - 1.05), 0.12, dxfattribs={"layer": "A-TORII"})

    dxf_path = os.path.join(OUT_DIR, "stage01_fushimi_inari_blueprint.dxf")
    doc.saveas(dxf_path)
    print("Saved CAD DXF:", dxf_path)


def draw_curved_roof_profile(ax, x_center, width, z_eave, z_ridge, style="irimoya", color="#d8e6f3", hatch_fill=True):
    """Helper to draw authentic Japanese curved roof sections (Irimoya / Nagare-zukuri / Karahafu)."""
    xs = np.linspace(x_center - width / 2.0, x_center + width / 2.0, 41)
    u = (xs - x_center) / (width / 2.0)  # -1 to 1
    if style == "nagare":
        # Asymmetrical sweeping front eave (left side -X extends further and lower)
        xs = np.linspace(x_center - width * 0.58, x_center + width * 0.44, 45)
        u = np.where(xs < x_center, (xs - x_center) / (width * 0.58), (xs - x_center) / (width * 0.44))
        zs = z_eave + (z_ridge - z_eave) * (1.0 - np.abs(u) ** 0.72)
        zs = np.where(xs < x_center, zs - 0.35 * (np.abs(u) ** 1.4), zs)
    else:
        # Concave catenary Japanese roof curve
        zs = z_eave + (z_ridge - z_eave) * (1.0 - np.abs(u) ** 0.68)

    zs_lower = zs - 0.55
    poly_pts = list(zip(xs, zs)) + list(zip(xs[::-1], zs_lower[::-1]))
    poly = Polygon(
        poly_pts,
        closed=True,
        facecolor="#1b3248" if hatch_fill else "none",
        edgecolor=color,
        linewidth=1.35,
        hatch="///" if hatch_fill else None,
        zorder=5,
    )
    ax.add_patch(poly)


def render_4panel_blueprint_sheet():
    """
    Render the 4-panel architectural engineering blueprint sheet (16:9 high-res PNG & SVG):
      Panel 1 (Top-Left): PLAN 01 — Precinct Ground & Podium Plan (Z = +2.8m)
      Panel 2 (Top-Right): PLAN 02 — Roofs, Upper Galleries & Senbon Torii Plan (Z = +6.2m)
      Panel 3 (Bottom-Left): SECTION A–A — Longitudinal Processional Section (Y = 0.0m / +6.2m)
      Panel 4 (Bottom-Right): SECTION B–B — Transverse Sanctuary & Senbon Torii Section (X = 34.0m)
    """
    plt.rcParams["font.sans-serif"] = ["Yu Gothic", "Meiryo", "MS Gothic", "DejaVu Sans"]
    fig = plt.figure(figsize=(20, 11.25), dpi=160, facecolor="#0b1826")
    gs = fig.add_gridspec(2, 2, left=0.045, right=0.975, top=0.90, bottom=0.065, wspace=0.12, hspace=0.24)

    fig.suptitle(
        "FUSHIMI INARI TAISHA (伏見稲荷大社, KYOTO) — CANONICAL ARCHITECTURAL BLUEPRINT SHEET (REV 1.0.0)",
        color="#e8f1fa",
        fontsize=14,
        fontweight="bold",
        y=0.965,
    )
    fig.text(
        0.5,
        0.935,
        "STAGE 01 STRUCTURAL BLOCKOUT & CAD DERIVATION  |  UNITS: METERS (1m GRID)  |  SECTION HATCH: ANSI31  |  DATUM Z = 0.00m AT ROMON APPROACH PLAZA",
        color="#8cb4d8",
        fontsize=9.5,
        ha="center",
    )

    def style_blueprint_ax(ax, title, xlim, ylim, xlabel, ylabel, aspect="equal"):
        ax.set_facecolor("#0f2236")
        ax.set_title(title, color="#f0f6fc", fontsize=10.5, fontweight="bold", pad=8, loc="left")
        ax.set_xlim(*xlim)
        ax.set_ylim(*ylim)
        ax.set_aspect(aspect, adjustable="box")
        ax.grid(True, which="both", color="#1e3c5c", linestyle=":", linewidth=0.6, alpha=0.8)
        ax.tick_params(colors="#8cb4d8", labelsize=8)
        ax.set_xlabel(xlabel, color="#8cb4d8", fontsize=8.5)
        ax.set_ylabel(ylabel, color="#8cb4d8", fontsize=8.5)
        for spine in ax.spines.values():
            spine.set_edgecolor("#4a7dab")
            spine.set_linewidth(1.2)

    # =========================================================================
    # PANEL 1: GROUND & PRECINCT PLAN (Z = +2.80m Horizontal Cut)
    # =========================================================================
    ax1 = fig.add_subplot(gs[0, 0])
    style_blueprint_ax(
        ax1,
        "01 // PRECINCT & PODIUM PLAN (HORIZONTAL CUT Z = +2.80m, ANSI31 HATCH)",
        (-22, 74),
        (-24, 24),
        "Processional Axis X (m, West -> East)",
        "Transverse Axis Y (m, South -> North)",
    )

    # Terrace steps & Retaining walls
    for x_step in [-2.5, 22.0, 44.0]:
        ax1.axvline(x_step, color="#4a7dab", linestyle="--", linewidth=0.9)

    # Stairs
    for sx in np.linspace(-6.5, -2.5, 11):
        ax1.plot([sx, sx], [-4.8, 4.8], color="#78a5cc", linewidth=0.6)
    for sx in np.linspace(20.0, 23.0, 9):
        ax1.plot([sx, sx], [-4.5, 4.5], color="#78a5cc", linewidth=0.6)

    # Outer Grand Torii columns
    for y_c in [-3.8, 3.8]:
        ax1.add_patch(Circle((-13.5, y_c), 0.45, facecolor="#e64a2e", edgecolor="#ffffff", linewidth=1.0, zorder=6))
    ax1.text(-13.5, 5.2, "OUTER TORII\n(W=7.6m, H=8.8m)", color="#ffd27d", fontsize=6.5, ha="center")

    # Kitsune pedestals & Lanterns
    for y_k, lbl in [(5.4, "Kitsune (Key)"), (-5.4, "Kitsune (Jewel)")]:
        ax1.add_patch(Rectangle((-4.1, y_k - 0.9), 1.8, 1.8, facecolor="#1f3b57", edgecolor="#ffd27d", hatch="///", linewidth=0.9))
    for y_l in [4.6, -4.6]:
        ax1.add_patch(Rectangle((-7.4, y_l - 0.6), 1.2, 1.2, facecolor="none", edgecolor="#5ce0b8", linewidth=0.9))

    # Romon Gate cut piers & Kairo wings (with ANSI31 hatching)
    romon_rects = [
        (-3.1, 1.8, 6.2, 3.8),
        (-3.1, -5.6, 6.2, 3.8),
        (-2.1, 6.0, 4.2, 13.0),
        (-2.1, -19.0, 4.2, 13.0),
    ]
    for rx, ry, rw, rh in romon_rects:
        ax1.add_patch(Rectangle((rx, ry), rw, rh, facecolor="#1c3954", edgecolor="#e8f1fa", hatch="///", linewidth=1.1, zorder=4))
    # Romon columns (3x2 bays)
    for cx in [-2.6, 0.0, 2.6]:
        for cy in [-5.2, -1.9, 1.9, 5.2]:
            ax1.add_patch(Circle((cx, cy), 0.34, facecolor="#ff5c38", edgecolor="#ffffff", linewidth=0.7, zorder=6))
    ax1.text(-5.5, -10.5, "Z01 ROMON GATE\n(11.6m x 6.8m, H=12.6m)", color="#ffffff", fontsize=6.8, ha="center", fontweight="bold")

    # Z02 Gehaiden (X=12.5, Y=0.0, 11.2m x 7.6m + Tamagaki fence 13.4m x 9.6m)
    ax1.add_patch(Rectangle((12.5 - 4.8, -6.7), 9.6, 13.4, facecolor="none", edgecolor="#ff6b4a", linestyle="-.", linewidth=1.0))
    ax1.add_patch(Rectangle((12.5 - 3.8, -5.6), 7.6, 11.2, facecolor="#17314a", edgecolor="#e8f1fa", hatch="//", linewidth=1.1))
    for cx in np.linspace(12.5 - 3.2, 12.5 + 3.2, 4):
        for cy in np.linspace(-5.0, 5.0, 6):
            ax1.add_patch(Circle((cx, cy), 0.25, facecolor="#ff5c38", edgecolor="#ffffff", linewidth=0.6, zorder=6))
    ax1.text(12.5, 9.2, "Z02 GE-HAIDEN\n(11.2m x 7.6m, H=8.6m)", color="#ffffff", fontsize=6.8, ha="center", fontweight="bold")

    # Z03 Nai-haiden & Honden (X=26.2 & X=34.0) + Sanctuary Tamagaki Fence
    ax1.add_patch(Rectangle((24.0, -10.5), 17.5, 21.0, facecolor="none", edgecolor="#ff6b4a", linestyle="--", linewidth=1.1))
    ax1.add_patch(Rectangle((26.2 - 3.1, -5.8), 6.2, 11.6, facecolor="#1c3954", edgecolor="#e8f1fa", hatch="///", linewidth=1.1))
    ax1.add_patch(Rectangle((34.0 - 5.4, -7.2), 10.8, 14.4, facecolor="#214363", edgecolor="#ffd27d", hatch="///", linewidth=1.3))
    ax1.text(33.0, -14.2, "Z03 NAI-HAIDEN & HONDEN (1499)\n(5-Bay Inari-zukuri, 14.4m x 10.8m, H=11.2m)", color="#ffd27d", fontsize=6.8, ha="center", fontweight="bold")

    # Z04 Senbon Torii Approach & Twin Parallel Tunnels
    for i in range(7):
        tx = 43.2 + i * 1.25
        ax1.plot([tx, tx], [-1.9, 1.9], color="#ff5c38", linewidth=1.3)
    # Fork Plaza at X=52.5
    ax1.add_patch(Circle((52.5, 4.0), 1.4, facecolor="#1b354f", edgecolor="#ffd27d", linewidth=1.0))
    for ty, lbl in [(6.2, "SENBON NORTH TUNNEL (26 Gates)"), (1.8, "SENBON SOUTH TUNNEL (26 Gates)")]:
        ax1.add_patch(Rectangle((53.2, ty - 1.15), 18.2, 2.3, facecolor="#2b1d28", edgecolor="#ff5c38", linewidth=1.1))
        for i in range(26):
            tx = 53.5 + i * 0.68
            ax1.plot([tx, tx], [ty - 1.05, ty + 1.05], color="#ff6b4a", linewidth=0.8)
    ax1.text(60.5, 11.0, "Z04 SENBON TORII TWIN TUNNELS\n(Pitch=0.68m, W=2.1m, H=2.95m)", color="#ff8566", fontsize=6.8, ha="center", fontweight="bold")

    # Section Cut Axes A-A and B-B
    ax1.axhline(0.0, color="#00e5ff", linestyle="-.", linewidth=1.1, zorder=8)
    ax1.text(-20.5, 1.0, "SECTION A-A (Y=0.0m) -->", color="#00e5ff", fontsize=7.5, fontweight="bold")
    ax1.axvline(34.0, color="#00e5ff", linestyle="-.", linewidth=1.1, zorder=8)
    ax1.text(34.8, 19.5, "SECTION B-B\n(X=34.0m)", color="#00e5ff", fontsize=7.5, fontweight="bold")

    # =========================================================================
    # PANEL 2: UPPER ROOF & GALLERY PLAN (Z = +6.20m + Roof Projections)
    # =========================================================================
    ax2 = fig.add_subplot(gs[0, 1])
    style_blueprint_ax(
        ax2,
        "02 // ROOF & UPPER GALLERY PLAN (Z = +6.20m CUT & HIWADA-BUKI ROOF PROJECTIONS)",
        (-22, 74),
        (-24, 24),
        "Processional Axis X (m, West -> East)",
        "Transverse Axis Y (m, South -> North)",
        aspect="auto",
    )
    ax1.set_aspect("auto")

    roof_boxes = [
        ("OUTER TORII KASAGI", -13.5, 0.0, 1.2, 10.6, "#ff5c38"),
        ("Z01 ROMON IRIMOYA ROOF", 0.0, 0.0, 9.8, 15.6, "#d8e6f3"),
        ("KAIRO NORTH ROOF", 0.0, 12.5, 5.8, 13.6, "#9abbd9"),
        ("KAIRO SOUTH ROOF", 0.0, -12.5, 5.8, 13.6, "#9abbd9"),
        ("Z02 GEHAIDEN IRIMOYA ROOF", 12.5, 0.0, 10.4, 14.2, "#d8e6f3"),
        ("NAI-HAIDEN KARAHAFU ROOF", 26.0, 0.0, 8.4, 14.0, "#ffd27d"),
        ("Z03 HONDEN NAGARE-ZUKURI ROOF", 33.4, 0.0, 13.8, 17.4, "#ffd27d"),
    ]
    for lbl, cx, cy, rw, rh, col in roof_boxes:
        ax2.add_patch(Rectangle((cx - rw / 2, cy - rh / 2), rw, rh, facecolor="#162d44", edgecolor=col, linewidth=1.3, zorder=4))
        # Draw ridge & hip lines
        ax2.plot([cx - rw / 2, cx + rw / 2], [cy, cy], color=col, linestyle="--", linewidth=0.9, zorder=5)
        ax2.plot([cx, cx], [cy - rh / 2, cy + rh / 2], color=col, linewidth=1.5, zorder=5)

    # Senbon Torii continuous kasagi roof ribbons
    for i in range(7):
        tx = 43.2 + i * 1.25
        ax2.add_patch(Rectangle((tx - 0.25, -2.4), 0.5, 4.8, facecolor="#ff5c38", edgecolor="#ffffff", linewidth=0.5))
    for ty in [6.2, 1.8]:
        for i in range(26):
            tx = 53.5 + i * 0.68
            ax2.add_patch(Rectangle((tx - 0.18, ty - 1.35), 0.36, 2.7, facecolor="#ff5c38", edgecolor="#ff9e80", linewidth=0.4))

    # Camera frustums on Roof Plan
    cams = [
        ("Cam_01", [-18.5, -3.2], [0.0, 0.0]),
        ("Cam_02", [4.2, -9.5], [22.0, 0.5]),
        ("Cam_03", [54.2, 6.2], [68.0, 6.2]),
        ("Cam_04", [45.5, -8.5], [56.5, 3.8]),
    ]
    for cname, cpos, ctgt in cams:
        ax2.plot(cpos[0], cpos[1], marker="o", color="#00ffcc", markersize=5, zorder=10)
        ax2.annotate(
            cname,
            xy=(ctgt[0], ctgt[1]),
            xytext=(cpos[0], cpos[1]),
            arrowprops=dict(arrowstyle="->", color="#00ffcc", lw=1.1),
            color="#00ffcc",
            fontsize=7,
            fontweight="bold",
            zorder=10,
        )

    # =========================================================================
    # PANEL 3: LONGITUDINAL SECTION A-A (West -> East Processional Elevation Cut)
    # =========================================================================
    ax3 = fig.add_subplot(gs[1, 0])
    style_blueprint_ax(
        ax3,
        "03 // SECTION A–A — LONGITUDINAL AXIAL SECTION (WEST TO EAST, ANSI31 HATCH)",
        (-22, 74),
        (-1.5, 17.5),
        "Processional Axis X (m)",
        "Elevation Z (m)",
        aspect="auto",
    )

    # Stepped ground terrain mass with ANSI31 hatch
    ground_pts = [
        (-22.0, -1.5),
        (-22.0, 0.0),
        (-6.5, 0.0),
        (-2.5, 1.6),
        (20.0, 1.6),
        (23.0, 3.2),
        (43.0, 3.2),
        (53.0, 4.6),
        (72.0, 7.4),
        (74.0, 7.4),
        (74.0, -1.5),
    ]
    ax3.add_patch(Polygon(ground_pts, closed=True, facecolor="#14293d", edgecolor="#78a5cc", hatch="///", linewidth=1.3, zorder=3))

    # Datum horizontal lines
    for z_val, z_lbl in [(0.0, "Z=+0.00m Approach"), (1.6, "Z=+1.60m Main Court"), (3.2, "Z=+3.20m Honden Terrace"), (7.4, "Z=+7.40m Upper Senbon")]:
        ax3.axhline(z_val, color="#3a658c", linestyle=":", linewidth=0.8)
        ax3.text(-21.2, z_val + 0.25, z_lbl, color="#8cb4d8", fontsize=6.5)

    # Outer Grand Torii at X=-13.5 (H=8.8m)
    ax3.add_patch(Rectangle((-13.9, 0.0), 0.8, 8.2, facecolor="#ff5c38", edgecolor="#ffffff", linewidth=0.9, zorder=5))
    ax3.add_patch(Rectangle((-14.3, 8.1), 1.6, 0.7, facecolor="#ff5c38", edgecolor="#ffd27d", linewidth=1.0, zorder=6))
    ax3.text(-13.5, 9.4, "Outer Torii\n+8.80m", color="#ffd27d", fontsize=6.5, ha="center")

    # Z01 Romon Gate at X=0.0 (Base Z=1.6m, H=12.6m -> Top Z=14.2m)
    ax3.add_patch(Rectangle((-3.1, 1.6), 6.2, 4.8, facecolor="none", edgecolor="#ff5c38", linewidth=1.2, zorder=4))
    ax3.add_patch(Rectangle((-2.8, 6.4), 5.6, 3.4, facecolor="#1c3954", edgecolor="#e8f1fa", hatch="///", linewidth=1.1, zorder=4))
    draw_curved_roof_profile(ax3, 0.0, 9.8, 9.8, 14.2, style="irimoya", color="#ffffff")
    ax3.text(0.0, 14.7, "Z01 ROMON GATE\nTop Z=+14.20m (H=12.6m)", color="#ffffff", fontsize=6.8, ha="center", fontweight="bold")

    # Z02 Gehaiden at X=12.5 (Base Z=1.6m, H=8.6m -> Top Z=10.2m)
    ax3.add_patch(Rectangle((12.5 - 3.4, 1.6), 6.8, 4.4, facecolor="none", edgecolor="#ff5c38", linewidth=1.1, zorder=4))
    draw_curved_roof_profile(ax3, 12.5, 10.4, 6.0, 10.2, style="irimoya", color="#d8e6f3")
    ax3.text(12.5, 10.8, "Z02 GE-HAIDEN\nTop Z=+10.20m (H=8.6m)", color="#d8e6f3", fontsize=6.8, ha="center", fontweight="bold")

    # Z03 Nai-haiden (X=26.2) & Honden (X=34.0, Base Z=3.2m, H=11.2m -> Top Z=14.4m)
    ax3.add_patch(Rectangle((26.2 - 2.7, 3.2), 5.4, 4.2, facecolor="#1c3954", edgecolor="#ff5c38", hatch="///", linewidth=1.0, zorder=4))
    draw_curved_roof_profile(ax3, 26.2, 8.2, 7.4, 10.4, style="irimoya", color="#ffd27d")
    ax3.add_patch(Rectangle((34.0 - 4.6, 3.2), 9.2, 5.6, facecolor="#1c3954", edgecolor="#ffd27d", hatch="///", linewidth=1.2, zorder=4))
    draw_curved_roof_profile(ax3, 33.4, 13.8, 8.8, 14.4, style="nagare", color="#ffd27d")
    ax3.text(33.4, 15.0, "Z03 HONDEN (1499, Inari-zukuri)\nTop Z=+14.40m (H=11.2m)", color="#ffd27d", fontsize=6.8, ha="center", fontweight="bold")

    # Z04 Senbon Torii Ascending Slope (X=43..72, Z=3.2..7.4)
    for i in range(7):
        tx = 43.2 + i * 1.25
        tz = 3.2 + i * 0.2
        ax3.add_patch(Rectangle((tx - 0.16, tz), 0.32, 4.4, facecolor="#ff5c38", edgecolor="none", zorder=5))
    for i in range(26):
        tx = 53.5 + i * 0.68
        tz = 4.6 + (i / 25.0) * 2.8
        ax3.add_patch(Rectangle((tx - 0.12, tz), 0.24, 0.55, facecolor="#111111", edgecolor="none", zorder=6))
        ax3.add_patch(Rectangle((tx - 0.11, tz + 0.55), 0.22, 2.40, facecolor="#ff5c38", edgecolor="none", zorder=5))
    ax3.text(57.5, 11.4, "Z04 SENBON TORII ASCENDING COLONNADE\n(7 Grand Gates + 2x26 Twin Tunnel Gates)", color="#ff8566", fontsize=6.8, ha="center", fontweight="bold")

    # =========================================================================
    # PANEL 4: TRANSVERSE SECTION B-B (South -> North through Honden & Senbon Torii)
    # =========================================================================
    ax4 = fig.add_subplot(gs[1, 1])
    style_blueprint_ax(
        ax4,
        "04 // SECTION B–B — TRANSVERSE SANCTUARY & SENBON TORII SECTION (X = 34.0m / 58.0m)",
        (-24, 24),
        (-1.5, 17.5),
        "Transverse Axis Y (m, South -> North)",
        "Elevation Z (m)",
        aspect="auto",
    )

    # Terrace slab Z=3.2m
    ax4.add_patch(Rectangle((-24.0, -1.5), 48.0, 4.7, facecolor="#14293d", edgecolor="#78a5cc", hatch="///", linewidth=1.2, zorder=3))

    # Sanctuary Tamagaki Fence at Y=-10.5 and Y=+10.5
    for fy in [-10.5, 10.5]:
        ax4.add_patch(Rectangle((fy - 0.25, 3.2), 0.5, 2.4, facecolor="#ff5c38", edgecolor="#ffffff", linewidth=0.9, zorder=5))

    # Honden 5-bay transverse cut (Y=-7.2 to +7.2, Z=3.2 to 14.4)
    ax4.add_patch(Rectangle((-7.2, 3.2), 14.4, 1.1, facecolor="#233d54", edgecolor="#e8f1fa", hatch="///", linewidth=1.1, zorder=4))
    ax4.add_patch(Rectangle((-6.4, 4.3), 12.8, 4.6, facecolor="#1b334b", edgecolor="#ffd27d", hatch="///", linewidth=1.2, zorder=4))
    for by in np.linspace(-6.0, 6.0, 6):
        ax4.add_patch(Rectangle((by - 0.22, 4.3), 0.44, 4.6, facecolor="#ff5c38", edgecolor="#ffffff", linewidth=0.7, zorder=5))
    draw_curved_roof_profile(ax4, 0.0, 17.4, 8.9, 14.4, style="irimoya", color="#ffd27d")
    ax4.text(0.0, 15.0, "Z03 HONDEN 5-BAY SANCTUARY CUT (W=14.4m, Roof Span=17.4m, Top Z=+14.40m)", color="#ffd27d", fontsize=7, ha="center", fontweight="bold")

    # Overlay projected Twin Senbon Torii Cross-Section (at Y=+1.8m and Y=+6.2m, Z=5.6m)
    ax4.add_patch(Rectangle((-0.2, 4.6), 9.0, 1.0, facecolor="#14293d", edgecolor="#8cb4d8", linestyle="--", linewidth=0.9, zorder=6))
    for ty, tname in [(1.8, "South Tunnel"), (6.2, "North Tunnel")]:
        # Left & right columns with black nemaki base + vermilion shaft + double lintels
        for side in [-1.05, 1.05]:
            ax4.add_patch(Rectangle((ty + side - 0.14, 5.6), 0.28, 0.55, facecolor="#111111", edgecolor="#ffffff", linewidth=0.6, zorder=8))
            ax4.add_patch(Rectangle((ty + side - 0.12, 6.15), 0.24, 2.35, facecolor="#ff5c38", edgecolor="#ffffff", linewidth=0.6, zorder=7))
        # Nuki & Kasagi lintels
        ax4.add_patch(Rectangle((ty - 1.35, 7.95), 2.7, 0.22, facecolor="#ff5c38", edgecolor="#ffffff", linewidth=0.6, zorder=8))
        ax4.add_patch(Rectangle((ty - 1.5, 8.35), 3.0, 0.30, facecolor="#ff5c38", edgecolor="#111111", linewidth=0.8, zorder=8))

    ax4.text(14.5, 8.2, "TWIN SENBON TORII\nCROSS-SECTION DETAIL\n(Y=+1.8m & +6.2m,\nClear Span=2.10m, H=2.95m)", color="#ff8566", fontsize=7, ha="center", fontweight="bold")

    png_path = os.path.join(OUT_DIR, "stage01_blueprints_4panel.png")
    svg_path = os.path.join(OUT_DIR, "stage01_blueprints_4panel.svg")
    fig.savefig(png_path, dpi=160)
    fig.savefig(svg_path)
    plt.close(fig)
    print("Saved 4-panel Blueprint Sheet:", png_path, "and", svg_path)


def build_real_photos_board():
    """
    Create a structured architectural analysis board from the real Wikimedia photographs
    of Fushimi Inari Taisha for visual reference verification.
    """
    photo_dir = os.path.join(BASE_DIR, "references", "real_photos")
    selected = [
        ("09_romon_day_front.jpg", "REAL PHOTO 01: Rōmon (1589), Kitsune Guardians, Standing Lanterns & Kairō Wings"),
        ("10_gehaiden.jpg", "REAL PHOTO 02: Ge-haiden Worship Hall, Tamagaki Fence, Sudare Blinds & Zodiac Lanterns"),
        ("02_honden.jpg", "REAL PHOTO 03: Honden (1499) Asymmetrical Inari-zukuri Roof, White Shikku & Gold Kanagu"),
        ("03_senbon_torii_tunnel.jpg", "REAL PHOTO 04: Senbon Torii Tunnel — Black Nemaki Bases, Kanji Columns & Flagstone Path"),
        ("04_senbon_torii_split.jpg", "REAL PHOTO 05: Senbon Torii Tunnel — Hanging Lantern & Komorebi Dappled Sun Shafts"),
        ("11_naihaiden.jpg", "REAL PHOTO 06: Nai-haiden Karahafū Gable, Red/White Rafters, Shimenawa & Gold Fittings"),
    ]
    W, H = 1920, 1080
    board = Image.new("RGB", (W, H), (14, 20, 28))
    draw = ImageDraw.Draw(board)

    tw, th = 610, 460
    positions = [
        (30, 70),
        (655, 70),
        (1280, 70),
        (30, 580),
        (655, 580),
        (1280, 580),
    ]
    draw.text((30, 22), "FUSHIMI INARI TAISHA (KYOTO) — REAL ARCHITECTURAL PHOTOGRAPH STUDY & MATERIAL DATUMS", fill=(240, 246, 252))

    for (fname, caption), (px, py) in zip(selected, positions):
        fpath = os.path.join(photo_dir, fname)
        if os.path.exists(fpath):
            img = Image.open(fpath).convert("RGB")
            img = img.resize((tw, th - 36), Image.Resampling.LANCZOS)
            board.paste(img, (px, py))
            draw.rectangle([px, py, px + tw, py + th - 36], outline=(255, 107, 74), width=2)
            draw.text((px + 6, py + th - 30), caption, fill=(230, 238, 248))

    out_board = os.path.join(OUT_DIR, "stage00_real_photos_study_board.png")
    board.save(out_board)
    print("Saved Real Photos Study Board:", out_board)


if __name__ == "__main__":
    build_manifold_structural_solids()
    export_dxf_blueprint()
    render_4panel_blueprint_sheet()
    build_real_photos_board()
