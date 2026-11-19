from pathlib import Path
import gzip,json,subprocess,sys
from PIL import Image
root=Path('fushimi_inari');textures=root/'assets/textures'
# Tiers share one encoding policy. Data maps (normal/roughness/metallic/height)
# stay lossless; colour maps, including alpha-tested foliage sprigs (RGBA), are
# lossy WebP with alpha kept. Content-addressed precinct-shared PNGs are GLB
# image URIs and stay as shipped originals. Originals are never overwritten.
TIERS={'balanced':dict(edge=512,quality=88),'high':dict(edge=None,quality=90)}
# Architectural library colours are tiled at close range from a smaller Balanced copy.
ARCHITECTURAL=dict(edge=256,quality=82)
def sources():return sorted(p for p in textures.rglob('*') if p.is_file() and p.suffix.lower() in {'.png','.webp'} and not {'balanced','high','precinct-shared'}.intersection(p.relative_to(textures).parts))
def is_data(p):return any(k in p.stem.lower() for k in ['normal','roughness','metallic','height'])
def balanced_spec(rel):return ARCHITECTURAL if rel.parts[0]=='architectural-r1' else TIERS['balanced']
def encode(p,out,edge,quality):
 im=Image.open(p)
 if edge:im.thumbnail((edge,edge),Image.Resampling.LANCZOS) # thumbnail never upscales
 out.parent.mkdir(parents=True,exist_ok=True);im.save(out,format='WEBP',lossless=is_data(p),quality=quality,method=6)
# Copper is 484 square: both production tiers use the complete level-zero map.
# This isolated bake writes candidate mip levels next to each other for review.
def copper_mips(out):
 from array import array
 from math import sqrt
 normal_path=textures/'nanobanana/roof_copper_patina_normal.png'
 rough_path=textures/'nanobanana/roof_copper_patina_roughness.png'
 with Image.open(normal_path) as source:normal=source.convert('RGB')
 with Image.open(rough_path) as source:rough=source.convert('L')
 if normal.size!=rough.size:raise ValueError('Copper normal and roughness must have matching dimensions')
 # Material factors from the copper finish. GGX uses alpha = roughness squared.
 roughness_scale=.44;normal_scale=1.1
 def pixels(im):return im.get_flattened_data() if hasattr(im,'get_flattened_data') else im.getdata()
 channels=[array('f') for _ in range(4)]
 for (r,g,b),value in zip(pixels(normal),pixels(rough)):
  x,y,z=(r/127.5-1)*normal_scale,(g/127.5-1)*normal_scale,b/127.5-1
  length=sqrt(x*x+y*y+z*z)
  if length<1e-8:x,y,z,length=0,0,1,1
  for channel,component in zip(channels,(x/length,y/length,z/length,(value/255*roughness_scale)**4)):
   channel.append(component)
 fields=[Image.frombytes('F',normal.size,channel.tobytes()) for channel in channels]
 width,height=normal.size;result=[]
 out.mkdir(parents=True,exist_ok=True)
 while width>1 or height>1:
  width,height=max(1,width//2),max(1,height//2);size=(width,height)
  # Every level sees all original normals. Re-filtering a previously normalized
  # direction would discard the subpixel variance accumulated at finer levels.
  means=[field.resize(size,Image.Resampling.BOX) for field in fields]
  normals=bytearray();roughness=bytearray();variance_sum=0
  for x,y,z,alpha_sq in zip(*(pixels(field) for field in means)):
   length=min(1,sqrt(x*x+y*y+z*z))
   # Estimate unresolved angular variance from the length of the mean direction.
   variance=(1-length)/max(length,1e-6);variance_sum+=variance
   roughness.append(round(255*min(1,(alpha_sq+variance)**.25/roughness_scale)))
   # Undo the runtime normalScale before encoding the normalized direction.
   x/=normal_scale;y/=normal_scale;length=sqrt(x*x+y*y+z*z)
   if length<1e-8:x,y,z,length=0,0,1,1
   normals.extend(round(127.5*(1+max(-1,min(1,component/length)))) for component in (x,y,z))
  normal_file=out/f'normal-{width}x{height}.webp';rough_file=out/f'roughness-{width}x{height}.webp'
  Image.frombytes('RGB',size,bytes(normals)).save(normal_file,lossless=True,method=6)
  Image.frombytes('L',size,bytes(roughness)).save(rough_file,lossless=True,method=6)
  result.append(dict(width=width,height=height,normalBytes=normal_file.stat().st_size,
                     roughnessBytes=rough_file.stat().st_size,meanAngularVariance=variance_sum/(width*height),
                     meanRoughness=sum(roughness)/len(roughness)/255*roughness_scale))
 return result

if sys.argv[1:2]==['copper-mips']:
 if len(sys.argv)!=3:sys.exit('usage: prepare-web-assets.py copper-mips OUTPUT_DIRECTORY')
 print(json.dumps(copper_mips(Path(sys.argv[2])),indent=2))
 sys.exit()

# A PNG and a WebP original with one stem would overwrite each other's tier file.
outputs={}
for p in sources():
 rel=p.relative_to(textures);out=rel.with_suffix('.webp')
 if out in outputs:raise ValueError(f'Texture output collision: {outputs[out]} and {rel} both map to {out}')
 outputs[out]=rel
def tier(name):
 items=[];base=textures/name
 for p in sources():
  rel=p.relative_to(textures);spec=balanced_spec(rel) if name=='balanced' else TIERS[name]
  # High exists only for PNG originals holding more than their Balanced copy;
  # elsewhere (and for WebP originals) the runtime requests the Balanced URL in both tiers.
  if name=='high' and (p.suffix.lower()!='.png' or max(Image.open(p).size)<=balanced_spec(rel)['edge']):continue
  out=base/rel.with_suffix('.webp');encode(p,out,spec['edge'],spec['quality'])
  items.append(dict(original=rel.as_posix(),**{name:out.relative_to(textures).as_posix()},bytes=out.stat().st_size,originalBytes=p.stat().st_size))
 (base/'manifest.json').write_text(json.dumps(items,indent=2))
 print('Textures',name,sum(i['originalBytes'] for i in items),sum(i['bytes'] for i in items),len(items))
 return items
balanced=tier('balanced');high=tier('high')
# Bundled by the runtime: the streaming loader maps a texture to its High URL
# without probing the network. texture-streaming.test.mjs checks it against disk.
listing=json.dumps([i['original'] for i in high],indent=1)
tiers=root/'integrated-world/texture-tiers.mjs';tiers.parent.mkdir(parents=True,exist_ok=True)
tiers.write_text('// Generated by scripts/prepare-web-assets.py from assets/textures/high/manifest.json; do not edit.\n// Originals (relative to assets/textures/) that have a High WebP above their Balanced tier.\nexport const HIGH_TEXTURES=new Set('+listing+');\n',newline='\n')
if 'textures' in sys.argv[1:]:sys.exit()
for p in (root/'integrated-world').glob('*.glb'):
 data=p.read_bytes();out=p.with_suffix('.glb.gz');out.write_bytes(gzip.compress(data,compresslevel=9,mtime=0));assert gzip.decompress(out.read_bytes())==data;print(p.name,len(data),out.stat().st_size)

# Repack deferred precinct transports using byte-identical, content-addressed PNGs.
subprocess.run(['node', str(Path(__file__).with_name('share-precinct-images.mjs'))], check=True)
