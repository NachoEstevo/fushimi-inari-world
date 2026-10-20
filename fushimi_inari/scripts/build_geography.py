"""Reproducible, offline-after-fetch geographical base. Standard library only."""
import argparse
import datetime
import hashlib
import json
import math
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "geography"
RAW = OUT / "sources"
BBOX = (34.959, 135.765, 34.981, 135.793)  # south, west, north, east; study extent, NOT property boundary
ORIGIN = (34.96714, 135.77267)  # local reference only; not a surveyed landmark
R = 6378137.0
ZOOM = 14


def xy(lat, lon):
    """Local equirectangular meters: x east, z south. Max extent < 3 km."""
    return (R * math.radians(lon - ORIGIN[1]) * math.cos(math.radians(ORIGIN[0])),
            -R * math.radians(lat - ORIGIN[0]))


def latlon(x, z):
    return (ORIGIN[0] - math.degrees(z / R),
            ORIGIN[1] + math.degrees(x / (R * math.cos(math.radians(ORIGIN[0])))))


def pixel(lat, lon):
    size = 256 * 2**ZOOM
    return ((lon + 180) / 360 * size,
            (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * size)


def fetch(url, path, data=None):
    if path.exists():
        return path.read_bytes()
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "FushimiGeographyStudy/1.0"})
    with urllib.request.urlopen(req, timeout=75) as response:
        content = response.read()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    print("Saved", path.name, len(content), flush=True)
    return content


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--offline", action="store_true")
    args = parser.parse_args()
    OUT.mkdir(exist_ok=True)
    RAW.mkdir(exist_ok=True)
    box = ",".join(map(str, BBOX))
    query = f"""[out:json][timeout:60];(
way["highway"]({box});way["building"]({box});
way["natural"="water"]({box});way["waterway"]({box});
nwr["historic"]({box});nwr["amenity"="place_of_worship"]({box});
nwr["natural"="peak"]({box});nwr["tourism"="viewpoint"]({box});
nwr["railway"="station"]({box});
);out body;>;out skel qt;"""
    (RAW / "query.overpassql").write_text(query, encoding="utf-8")
    osm_path = RAW / "osm.json"
    if args.offline and not osm_path.exists():
        raise RuntimeError("Missing cached OSM data")
    osm = json.loads(osm_path.read_text(encoding="utf-8")) if osm_path.exists() else json.loads(
        fetch("https://overpass-api.de/api/interpreter", osm_path,
              urllib.parse.urlencode({"data": query}).encode()))
    named_path = RAW / "named-nodes.json"
    named_query = f'[out:json][timeout:40];node["name"]({box});out body;'
    (RAW / "named-nodes.overpassql").write_text(named_query, encoding="utf-8")
    if args.offline and not named_path.exists():
        raise RuntimeError("Missing named-node cache")
    named = json.loads(named_path.read_text(encoding="utf-8")) if named_path.exists() else json.loads(
        fetch("https://overpass-api.de/api/interpreter", named_path,
              urllib.parse.urlencode({"data": named_query}).encode()))
    # Overpass recursion may repeat elements; retain the tagged version.
    elements = {}
    for element in osm["elements"] + named["elements"]:
        key = (element["type"], element["id"])
        if key not in elements or element.get("tags"):
            elements[key] = element
    nodes = {e["id"]: e for e in elements.values() if e["type"] == "node"}

    west, south = xy(BBOX[0], BBOX[1])
    east, north = xy(BBOX[2], BBOX[3])
    # Explicit 10 m sampling, no vertical exaggeration.
    step = 10
    xmin, zmin = math.floor(west / step) * step, math.floor(north / step) * step
    cols = math.ceil((east - xmin) / step) + 1
    rows = math.ceil((south - zmin) / step) + 1
    tiles = {}
    used_urls = {}

    def tile(tx, ty):
        key = tx, ty
        if key not in tiles:
            path = RAW / f"gsi-dem-{ZOOM}-{tx}-{ty}.txt"
            url = f"https://cyberjapandata.gsi.go.jp/xyz/dem/{ZOOM}/{tx}/{ty}.txt"
            if args.offline and not path.exists():
                raise RuntimeError(f"Missing cached tile: {path}")
            text = path.read_text() if path.exists() else fetch(url, path).decode()
            values = [[None if v == "e" else float(v) for v in row.split(",")] for row in text.strip().splitlines()]
            if len(values) != 256 or any(len(row) != 256 for row in values):
                raise ValueError(f"Invalid GSI tile {key}")
            tiles[key] = values
            used_urls[path.name] = url
        return tiles[key]

    def elevation(lat, lon):
        px, py = pixel(lat, lon)
        ix, iy = math.floor(px), math.floor(py)
        fx, fy = px - ix, py - iy
        total = 0
        for dx, dy, weight in ((0, 0, (1-fx)*(1-fy)), (1, 0, fx*(1-fy)),
                               (0, 1, (1-fx)*fy), (1, 1, fx*fy)):
            gx, gy = ix+dx, iy+dy
            val = tile(gx//256, gy//256)[gy % 256][gx % 256]
            if val is None:
                raise ValueError(f"Missing elevation at {lat},{lon}; refusing invented terrain")
            total += val * weight
        return round(total, 2)

    heights = [elevation(*latlon(xmin+c*step, zmin+r*step)) for r in range(rows) for c in range(cols)]
    terrain = {"xmin": xmin, "zmin": zmin, "step": step, "cols": cols, "rows": rows, "heights": heights}

    # Features outside the study rectangle are rejected: no extrapolated roads/buildings at edges.
    def inside(lat, lon):
        return BBOX[0] <= lat <= BBOX[2] and BBOX[1] <= lon <= BBOX[3]

    def coord(node):
        x, z = xy(node["lat"], node["lon"])
        return [round(x, 3), elevation(node["lat"], node["lon"]), round(z, 3)]

    paths, buildings, waters, pois = [], [], [], []
    omitted_crossing = 0
    for e in elements.values():
        tags = e.get("tags", {})
        if e["type"] == "way":
            ns = [nodes[n] for n in e["nodes"] if n in nodes]
            if len(ns) < 2:
                continue
            if not all(inside(n["lat"], n["lon"]) for n in ns):
                omitted_crossing += 1
                continue
            points = [coord(n) for n in ns]
            base = {"id": f"way/{e['id']}", "tags": tags, "points": points}
            if "highway" in tags:
                paths.append({**base, "nodeIds": e["nodes"], "lengthM": round(sum(
                    math.dist(a, b) for a, b in zip(points, points[1:])), 2)})
            if "building" in tags and len(points) > 3 and e["nodes"][0] == e["nodes"][-1]:
                buildings.append(base)
            if tags.get("natural") == "water" or "waterway" in tags:
                waters.append(base)
        if (tags.get("amenity") == "place_of_worship" or "historic" in tags
                or tags.get("natural") == "peak" or tags.get("tourism") == "viewpoint"
                or tags.get("railway") == "station" or tags.get("building") == "shrine"
                or tags.get("religion") == "shinto" or tags.get("natural") == "water"
                or any(k in tags.get("name", "") for k in ["四ツ辻", "四つ辻", "四辻", "三ツ辻"])):
            if e["type"] == "node":
                center = e
            elif e["type"] == "way":
                ns = [nodes[n] for n in e["nodes"][:-1] if n in nodes]
                if not ns:
                    continue
                center = {"lat": sum(n["lat"] for n in ns)/len(ns), "lon": sum(n["lon"] for n in ns)/len(ns)}
            else:
                continue  # Relations need assembled geometry, not a guessed centroid.
            if inside(center["lat"], center["lon"]):
                pois.append({"id": f"{e['type']}/{e['id']}", "tags": tags, "point": coord(center),
                             "lat": center["lat"], "lon": center["lon"]})

    files = ["osm.json", "named-nodes.json", *used_urls]
    manifest = {
        "schemaVersion": 1, "title": "Fushimi Inari — base geográfica",
        "builtAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "osmTimestamp": osm.get("osm3s", {}).get("timestamp_osm_base"),
        "bbox": BBOX, "bboxMeaning": "Study rectangle including surroundings; NOT the legal shrine estate boundary",
        "origin": {"lat": ORIGIN[0], "lon": ORIGIN[1], "elevationOffset": 0},
        "coordinates": {"units": "meters", "x": "east", "y": "GSI elevation meters above sea level", "z": "south",
                        "projection": "local equirectangular R=6378137; cos(origin latitude)",
                        "blenderTransform": "[x, -z, y]", "verticalExaggeration": 1},
        "sources": {"osm": "https://www.openstreetmap.org/copyright",
                    "osmQueryEndpoint": "https://overpass-api.de/api/interpreter",
                    "gsi": "https://maps.gsi.go.jp/development/demtile.html",
                    "gsiAttribution": "国土地理院 標高タイルを加工して作成 / derived from GSI elevation tiles",
                    "gsiTiles": used_urls, "officialCrossCheck": "https://inari.jp/trip/map01/"},
        "uncertainties": ["OSM completeness and positional accuracy vary; not a cadastral survey",
                          "GSI DEM10B does not resolve individual steps, terrace edges or retaining walls",
                          "Building footprints sourced; heights without OSM height are explicitly inferred",
                          "Path width without OSM width is inferred; public access is not implied",
                          "No invented connection between disconnected paths",
                          "OSM relations are not assembled; relation-only features may be absent"],
        "counts": {"paths": len(paths), "buildings": len(buildings), "water": len(waters), "pois": len(pois),
                   "omittedBoundaryCrossingWays": omitted_crossing},
        "sha256": {name: hashlib.sha256((RAW/name).read_bytes()).hexdigest() for name in files}
    }
    save("terrain.json", terrain)
    save("features.json", {"paths": paths, "buildings": buildings, "water": waters, "pois": pois})
    save("manifest.json", manifest)
    print(json.dumps(manifest["counts"]), "DEM", min(heights), max(heights), cols, rows, flush=True)


if __name__ == "__main__":
    main()
