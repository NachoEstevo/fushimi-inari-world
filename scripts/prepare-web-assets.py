from pathlib import Path
import gzip,json,subprocess
from PIL import Image
root=Path('fushimi_inari');items=[]
for p in (root/'assets/textures').rglob('*.png'):
 if 'balanced' in p.parts or 'precinct-shared' in p.parts:continue
 rel=p.relative_to(root/'assets/textures');out=root/'assets/textures/balanced'/rel.with_suffix('.webp');out.parent.mkdir(parents=True,exist_ok=True)
 im=Image.open(p);im.thumbnail((512,512),Image.Resampling.LANCZOS)
 data=any(k in p.stem.lower() for k in ['normal','roughness','metallic','height']);im.save(out,format='WEBP',lossless=data,quality=88,method=6)
 items.append(dict(original=str(rel).replace('\\','/'),balanced=str(out.relative_to(root/'assets/textures')).replace('\\','/'),bytes=out.stat().st_size,originalBytes=p.stat().st_size))
(root/'assets/textures/balanced/manifest.json').write_text(json.dumps(items,indent=2))
print('Textures',sum(i['originalBytes'] for i in items),sum(i['bytes'] for i in items),len(items))
for p in (root/'integrated-world').glob('*.glb'):
 data=p.read_bytes();out=p.with_suffix('.glb.gz');out.write_bytes(gzip.compress(data,compresslevel=9,mtime=0));assert gzip.decompress(out.read_bytes())==data;print(p.name,len(data),out.stat().st_size)

# Repack deferred precinct transports using byte-identical, content-addressed PNGs.
subprocess.run(['node', str(Path(__file__).with_name('share-precinct-images.mjs'))], check=True)
