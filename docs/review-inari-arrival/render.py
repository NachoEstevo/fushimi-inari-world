"""Actual integrated geometry, diagnostic palette. CPU only; root schedules execution.
blender --background --python outputs/inari-arrival-review/render.py -- --region door
No native Three/WebGL material equivalence is claimed.
"""
import bpy,json,math,argparse,sys,gc
from pathlib import Path
from mathutils import Vector
base=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--region',choices=['moving','door','platform','gates','frontage','crossing','overview','section','shops','handoff']);p.add_argument('--view');opt=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
# Source Three world coordinates (Y up); ground camera height 1.65 above sampled route.
shots=json.loads((base/'cameras.json').read_text())
def point(v):return Vector((v[0],-v[2],v[1]))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=12;s.cycles.seed=95;s.cycles.use_denoising=True
s.render.resolution_x=960;s.render.resolution_y=640;s.render.resolution_percentage=100;s.render.threads_mode='FIXED';s.render.threads=6
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.64,.69,.73,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.65
s.view_settings.view_transform='Standard'
for region,views in shots.items():
 if opt.region and region!=opt.region:continue
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for collection in [bpy.data.meshes,bpy.data.materials]:
  for item in list(collection):
   if item.users==0:collection.remove(item)
 data=json.loads((base/(region+'.json')).read_text());palette={}
 merged={}
 for record in data['meshes']:
  key=tuple(round(c,4) for c in record['color'])+(record.get('opacity',1),);merged.setdefault(key,[]).extend(record['positions'])
 del data;gc.collect()
 records=({'positions':positions[start:start+90000],'color':color[:3],'opacity':color[3],'name':'Integrated material batch'} for color,positions in merged.items() for start in range(0,len(positions),90000))
 for i,record in enumerate(records):
  flat=record['positions'];verts=[(flat[j],-flat[j+2],flat[j+1]) for j in range(0,len(flat),3)]
  mesh=bpy.data.meshes.new(str(i));mesh.from_pydata(verts,[],[(j,j+1,j+2) for j in range(0,len(verts),3)]);mesh.update()
  obj=bpy.data.objects.new(record['name'],mesh);bpy.context.collection.objects.link(obj)
  key=tuple(round(c,4) for c in record['color'])+(record.get('opacity',1),)
  if key not in palette:
   mat=bpy.data.materials.new(str(key));mat.diffuse_color=key;mat.use_nodes=True;bs=mat.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=key;bs.inputs['Roughness'].default_value=.85;palette[key]=mat

  if key[3]<1:
   mat=palette[key];bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Alpha'].default_value=key[3]
  mesh.materials.append(palette[key])
 del merged;gc.collect()
 bpy.ops.object.light_add(type='SUN');sun=bpy.context.object;sun.rotation_euler=(.45,-.4,-.55);sun.data.energy=2;sun.data.angle=.12
 bpy.ops.object.camera_add();camera=bpy.context.object;s.camera=camera;camera.data.clip_end=1000
 for view,cfg in views.items():
  if opt.view and view not in opt.view.split(','):continue
  camera.data.type='ORTHO' if 'ortho' in cfg else 'PERSP';camera.data.ortho_scale=cfg.get('ortho',100);camera.data.lens=cfg['lens'];camera.location=point(cfg['position']);camera.rotation_euler=(point(cfg['target'])-camera.location).to_track_quat('-Z','Y').to_euler()
  s.render.filepath=str(base/(region+'-'+view+'.png'));bpy.ops.render.render(write_still=True);print('INARI_VISUAL',region,view,flush=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(base/(region+'.blend')))
