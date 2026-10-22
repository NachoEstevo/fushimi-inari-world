import bpy,json
from mathutils import Vector
from pathlib import Path
base=Path(__file__).resolve().parents[2]/'.tmp'/'r91-shinme'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=960;s.render.resolution_y=720;s.render.resolution_percentage=100;s.world.color=(.5,.5,.5)
for k,item in enumerate(json.loads((base/'after.json').read_text())):
 verts=[(v[0],-v[2],v[1]) for v in item['vertices']];faces=[list(range(i,i+3)) for i in range(0,len(verts),3)]
 mesh=bpy.data.meshes.new(str(k));mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(str(k),mesh);s.collection.objects.link(obj)
 mat=bpy.data.materials.new(str(k));mat.use_nodes=True;mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*item['color'],1);obj.data.materials.append(mat)
bpy.ops.mesh.primitive_plane_add(size=100);bpy.context.object.location.z=-.055
m=bpy.data.materials.new('floor');m.diffuse_color=(.5,.49,.46,1);bpy.context.object.data.materials.append(m)
bpy.ops.object.light_add(type='AREA',location=(-3,6,11));bpy.context.object.data.energy=1500;bpy.context.object.data.size=7
bpy.ops.object.camera_add();cam=bpy.context.object;s.camera=cam;cam.data.lens=48
for name,pos,target in [('front',(0,14,3.7),(0,0,2.5)),('oblique',(10,12,6),(0,0,2.5))]:
 cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=str(base/(name+'.png'));bpy.ops.render.render(write_still=True)
