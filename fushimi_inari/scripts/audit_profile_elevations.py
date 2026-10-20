"""Compare all unresolved profiles with current GSI DEM5A PNG tiles; never modify the scene."""
import math, json, hashlib, io, urllib.request, urllib.error
from pathlib import Path
from PIL import Image
from build_geography import latlon
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'outputs'/'dem5a-audit';CACHE.mkdir(parents=True,exist_ok=True)
features=json.loads((ROOT/'geography/features.json').read_text(encoding='utf8'))
reviews=json.loads((ROOT/'integrated-world/stair-review.json').read_text(encoding='utf8'))['profiles']
paths={p['id']:p for p in features['paths']};tiles={};sources={}
def elevation(x,z):
    lat,lon=latlon(x,z);size=256*2**15
    px=(lon+180)/360*size;py=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*size
    ix,iy=math.floor(px),math.floor(py);fx,fy=px-ix,py-iy;total=0
    for dx,dy,w in [(0,0,(1-fx)*(1-fy)),(1,0,fx*(1-fy)),(0,1,(1-fx)*fy),(1,1,fx*fy)]:
        gx,gy=ix+dx,iy+dy;key=(gx//256,gy//256)
        if key not in tiles:
            url=f'https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/15/{key[0]}/{key[1]}.png';path=CACHE/f'{key[0]}-{key[1]}.png'
            try:
                if not path.exists():
                    with urllib.request.urlopen(url,timeout=15) as r: path.write_bytes(r.read())
                data=path.read_bytes();tiles[key]=Image.open(io.BytesIO(data)).convert('RGB');sources[url]=hashlib.sha256(data).hexdigest()
            except (urllib.error.URLError,TimeoutError) as e: tiles[key]=None;sources[url]=str(e)
        if tiles[key] is None:return None
        r,g,b=tiles[key].getpixel((gx%256,gy%256));v=r*65536+g*256+b
        if v==8388608:return None
        total+=(v if v<8388608 else v-16777216)*.01*w
    return round(total,3)
results=[]
for review in reviews:
    path=paths[review['id']];a,b=path['points'][0],path['points'][-1]
    samples=[]
    for i in range(1,len(path['points'])):
        p,q=path['points'][i-1:i+1];n=max(1,math.ceil(math.hypot(q[0]-p[0],q[2]-p[2])/2.5))
        for j in range(n):
            f=j/n;x=p[0]+(q[0]-p[0])*f;z=p[2]+(q[2]-p[2])*f;samples.append([round(x,3),elevation(x,z),round(z,3)])
    samples.append([b[0],elevation(b[0],b[2]),b[2]])
    heights=[p[1] for p in samples];complete=all(v is not None for v in heights)
    results.append({'id':path['id'],'nearestAnchor':review['nearestAnchor'],'nearPilgrimage':review['nearPilgrimage'],'sceneRise':round(review['endHeight']-review['startHeight'],3),'dem5aRise':round(heights[-1]-heights[0],3) if complete else None,'dem5aRange':round(max(heights)-min(heights),3) if complete else None,'mappedCount':review['mappedCount'],'localGrading':review['adaptedGround'],'samples':samples,'status':'elevation-evidence-only; step heights and landing positions unverified'})
out={'revision':14,'source':'GSI DEM5A PNG, zoom 15, retrieved 2026-10-20','specification':'https://maps.gsi.go.jp/development/demtile.html','warning':'5 m elevation model, not measured stair geometry. No automatic scene replacement. Original geographic source preserved.','tileHashes':sources,'profiles':results}
(ROOT/'integrated-world/profile-evidence-r14.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Reviewed',len(results),'available',sum(p['dem5aRise'] is not None for p in results),'tiles',len(tiles),flush=True)
for p in results:
    if p['nearestAnchor']['distance']<100: print(p['id'],p['nearestAnchor']['label'],'scene',p['sceneRise'],'DEM5A',p['dem5aRise'],'range',p['dem5aRange'],flush=True)
