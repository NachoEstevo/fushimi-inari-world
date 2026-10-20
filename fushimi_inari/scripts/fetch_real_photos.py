import urllib.request
import urllib.parse
import os

out_dir = r"d:\GithubProjects\3Dexploration\fushimi_inari\references\real_photos"
os.makedirs(out_dir, exist_ok=True)

headers = {"User-Agent": "TestBot/1.0"}

files = [
    ("01_romon_day.jpg", "20100714 Kyoto Fushimi Inari 1655.jpg"),
    ("02_honden.jpg", "Hushimi-inari-taisha honden.jpg"),
    ("03_senbon_torii_tunnel.jpg", "Fushimi-Inari-Shrine-Senbon-Torii-2016-Luka-Peternel.jpg"),
    ("04_senbon_torii_split.jpg", "Fushimi-Inari-Shrine-Senbon-Torii-2018-Luka-Peternel.jpg"),
    ("05_shrine_precinct.jpg", "Fushimi-Inari-taisha 4.jpg"),
    ("06_kitsune_key.jpg", "Inari-kitsune fox in front of an Inari shrine with a key in its mouth.jpg"),
    ("07_romon_torii.jpg", "2026-06-29 kyoto-fushimi-inari torii-romon night.jpg"),
    ("08_shrine_buildings.jpg", "20181110 Fushimi Inari shrine 9.jpg"),
]

for local_name, wiki_name in files:
    encoded = urllib.parse.quote(wiki_name)
    url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{encoded}?width=1024"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            dest = os.path.join(out_dir, local_name)
            with open(dest, "wb") as f:
                f.write(resp.read())
            print("Downloaded:", local_name, os.path.getsize(dest), "bytes")
    except Exception as e:
        print("Error on", local_name, e)
