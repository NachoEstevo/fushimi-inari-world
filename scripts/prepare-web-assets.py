from pathlib import Path
import gzip,json,subprocess
from PIL import Image
root=Path('fushimi_inari');items=[]
textures=root/'assets/textures'
sources=sorted(p for p in textures.rglob('*') if p.is_file() and p.suffix.lower() in {'.png','.webp'} and not {'balanced','precinct-shared'}.intersection(p.relative_to(textures).parts))
outputs={}
for p in sources:
 rel=p.relative_to(textures);out=rel.with_suffix('.webp')
 if out in outputs:raise ValueError(f'Texture output collision: {outputs[out]} and {rel} both map to {out}')
 outputs[out]=rel
for p in sources:
 rel=p.relative_to(textures);out=textures/'balanced'/rel.with_suffix('.webp');out.parent.mkdir(parents=True,exist_ok=True)
 architectural=rel.parts[0]=='architectural-r1'
 im=Image.open(p);im.thumbnail((256,256) if architectural else (512,512),Image.Resampling.LANCZOS)
 data=any(k in p.stem.lower() for k in ['normal','roughness','metallic','height']);im.save(out,format='WEBP',lossless=data,quality=82 if architectural else 88,method=6)
 items.append(dict(original=str(rel).replace('\\','/'),balanced=str(out.relative_to(root/'assets/textures')).replace('\\','/'),bytes=out.stat().st_size,originalBytes=p.stat().st_size))
(root/'assets/textures/balanced/manifest.json').write_text(json.dumps(items,indent=2))
print('Textures',sum(i['originalBytes'] for i in items),sum(i['bytes'] for i in items),len(items))
for p in (root/'integrated-world').glob('*.glb'):
 data=p.read_bytes();out=p.with_suffix('.glb.gz');out.write_bytes(gzip.compress(data,compresslevel=9,mtime=0));assert gzip.decompress(out.read_bytes())==data;print(p.name,len(data),out.stat().st_size)

# Repack deferred precinct transports using byte-identical, content-addressed PNGs.
subprocess.run(['node', str(Path(__file__).with_name('share-precinct-images.mjs'))], check=True)
