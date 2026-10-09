import bpy, bmesh
from pathlib import Path
root=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(root.parent/'drone-matrice4td/Matrice4TD_Platform.blend'))
for ob in list(bpy.data.objects):
    if ob.type in ('LIGHT','CAMERA'): bpy.data.objects.remove(ob,do_unlink=True)
for ob in list(bpy.context.selected_objects): ob.select_set(False)
for ob in list(bpy.data.objects):
    if ob.type not in ('MESH','CURVE'): continue
    bpy.context.view_layer.objects.active=ob; ob.select_set(True)
    if ob.type=='CURVE': bpy.ops.object.convert(target='MESH')
    if ob.type=='MESH' and len(ob.data.polygons)>20000:
        bm=bmesh.new();bm.from_mesh(ob.data)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000006)
        bm.to_mesh(ob.data);bm.free()
        dec=ob.modifiers.new('Web preview surface reduction','DECIMATE')
        dec.ratio=.13 if 'Airframe' in ob.name else .08
        bpy.ops.object.modifier_apply(modifier=dec.name)
    for mod in list(ob.modifiers):
        if mod.type=='SUBSURF': mod.levels=1;mod.render_levels=1
    ob.select_set(False)
# Keep the supplied texture. The web material handles its background mask.
logo=bpy.data.materials.get('Platform logo • supplied purple and blue artwork')
if logo:
    bs=logo.node_tree.nodes.get('Principled BSDF')
    for link in list(logo.node_tree.links):
        if link.to_socket==bs.inputs['Alpha']: logo.node_tree.links.remove(link)
    bs.inputs['Alpha'].default_value=1; logo.blend_method='OPAQUE'
bpy.ops.export_scene.gltf(filepath=str(root/'public/assets/drone.glb'),export_format='GLB',export_apply=True,export_cameras=False,export_lights=False,export_animations=False,export_extras=True)
print('WEB MODEL EXPORTED',flush=True)
