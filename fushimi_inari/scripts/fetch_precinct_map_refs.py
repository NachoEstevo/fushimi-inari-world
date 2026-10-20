import urllib.request
import urllib.parse
import json
import os

out_dir = r"d:\GithubProjects\3Dexploration\fushimi_inari\references\real_photos_precinct_map"
os.makedirs(out_dir, exist_ok=True)

queries = [
    ("09_jr_inari_station_front", "Inari Station JR"),
    ("10_omotesando_avenue", "Fushimi Inari-taisha Torii approach"),
    ("11_honden_full", "Fushimi Inari-taisha Honden"),
    ("12_gonden_side", "Fushimi Inari-taisha Gonden"),
]

for slug, q in queries:
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="
        + urllib.parse.quote(q)
        + "&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json"
    )
    req = urllib.request.Request(api, headers={"User-Agent": "FushimiInariResearch/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            d = json.loads(r.read().decode("utf-8"))
        pages = d.get("query", {}).get("pages", {})
        for pid, p in pages.items():
            ii = p.get("imageinfo", [{}])[0]
            img_url = ii.get("thumburl") or ii.get("url")
            if img_url and any(ext in img_url.lower() for ext in [".jpg", ".jpeg", ".png"]):
                dest = os.path.join(out_dir, slug + ".jpg")
                req_img = urllib.request.Request(img_url, headers={"User-Agent": "FushimiInariResearch/1.0"})
                with urllib.request.urlopen(req_img, timeout=12) as ir:
                    open(dest, "wb").write(ir.read())
                print("Downloaded:", slug, "<-", p.get("title"), os.path.getsize(dest))
                break
    except Exception as e:
        print("Err", slug, e)
