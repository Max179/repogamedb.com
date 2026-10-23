import bpy, sys, math, os, mathutils
argv = sys.argv[sys.argv.index('--')+1:]
obj_path, tex_path, out_png = argv[0], argv[1], argv[2]

bpy.ops.wm.read_factory_settings(use_empty=True)
try:
    bpy.ops.import_scene.obj(filepath=obj_path)
except Exception as e:
    print('OBJ import failed:', e); sys.exit(1)

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes:
    print('no mesh imported'); sys.exit(1)
bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active

bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
vs = [v.co for v in obj.data.vertices]
xs=[p.x for p in vs]; ys=[p.y for p in vs]; zs=[p.z for p in vs]
cx=(min(xs)+max(xs))/2; cy=(min(ys)+max(ys))/2; cz=(min(zs)+max(zs))/2
dim=max(max(xs)-min(xs), max(ys)-min(ys), max(zs)-min(zs))
if dim <= 0: dim = 1.0
s = 2.0/dim
for v in obj.data.vertices:
    v.co = mathutils.Vector(((v.co.x-cx)*s, (v.co.y-cy)*s, (v.co.z-cz)*s))

mat = bpy.data.materials.new('albedo'); mat.use_nodes = True
nt = mat.node_tree
bsdf = None
for n in nt.nodes:
    if n.type == 'BSDF_PRINCIPLED': bsdf = n
tex = nt.nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(tex_path)
nt.links.new(bsdf.inputs['Base Color'], tex.outputs['Color'])
try: bsdf.inputs['Roughness'].default_value = 0.75
except Exception: pass
try: bsdf.inputs['Specular'].default_value = 0.25
except Exception: pass
obj.data.materials.clear(); obj.data.materials.append(mat)
if not obj.data.uv_layers:
    print('WARNING: no UV layer on mesh')

cam_data = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_data)
bpy.context.scene.collection.objects.link(cam); bpy.context.scene.camera = cam
cam_data.lens = 50
d = mathutils.Vector((1.0, -1.0, 0.55)).normalized()
cam.location = d * 3.6
cam.rotation_euler = (-d).to_track_quat('-Z','Y').to_euler()

key_l = bpy.data.lights.new('key','SUN'); key_l.energy = 4.0
key_o = bpy.data.objects.new('key', key_l); bpy.context.scene.collection.objects.link(key_o)
key_o.rotation_euler = (math.radians(55), 0, math.radians(40))
fill_l = bpy.data.lights.new('fill','SUN'); fill_l.energy = 1.6
fill_o = bpy.data.objects.new('fill', fill_l); bpy.context.scene.collection.objects.link(fill_o)
fill_o.rotation_euler = (math.radians(65), 0, math.radians(-130))

world = bpy.data.worlds.new('w'); bpy.context.scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs[0].default_value = (0.05, 0.05, 0.06, 1.0)
bg.inputs[1].default_value = 0.5

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = 64
sc.cycles.use_denoising = False
sc.cycles.device = 'CPU'
sc.render.resolution_x = 512; sc.render.resolution_y = 512
sc.render.resolution_percentage = 100
sc.render.film_transparent = False
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = out_png
bpy.ops.render.render(write_still=True)
print('RENDERED', out_png, os.path.getsize(out_png) if os.path.exists(out_png) else 'missing')
