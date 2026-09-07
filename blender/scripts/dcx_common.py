"""Prime DCX — shared Blender helpers.

Every model script imports this. It provides scene reset, a small institutional
material palette (graphite / steel / glass / emissive accents), studio lighting,
GLB export and reference-frame rendering.
"""
import bpy
import math
import os
from mathutils import Vector

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
MODEL_DIR = os.path.join(ROOT, "public", "assets", "models")
SCENE_DIR = os.path.join(ROOT, "blender", "scenes")
REF_DIR = os.path.join(ROOT, "blender", "exports", "refs")

for d in (MODEL_DIR, SCENE_DIR, REF_DIR):
    os.makedirs(d, exist_ok=True)

# Prime DCX palette (linear-ish sRGB values used directly as base colours)
PALETTE = {
    "graphite": (0.055, 0.060, 0.068, 1.0),
    "steel": (0.360, 0.385, 0.415, 1.0),
    "steel_dark": (0.140, 0.152, 0.168, 1.0),
    "white": (0.880, 0.900, 0.920, 1.0),
    "cyan": (0.070, 0.720, 0.880, 1.0),
    "green": (0.130, 0.820, 0.470, 1.0),
    "amber": (0.950, 0.660, 0.230, 1.0),
    "red": (0.900, 0.270, 0.290, 1.0),
    "glass": (0.030, 0.040, 0.050, 1.0),
}


def reset_scene():
    """Wipe the file down to an empty scene with sane render settings."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.resolution_x = 2560
    scene.render.resolution_y = 1440
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    eevee = scene.eevee
    for attr, value in (
        ("taa_render_samples", 128),
        ("use_bloom", True),
        ("bloom_intensity", 0.035),
        ("use_gtao", True),
        ("gtao_distance", 0.6),
        ("use_raytracing", True),
    ):
        if hasattr(eevee, attr):
            try:
                setattr(eevee, attr, value)
            except Exception:
                pass
    scene.view_settings.view_transform = "AgX" if "AgX" in [
        v.name for v in scene.view_settings.bl_rna.properties["view_transform"].enum_items
    ] else "Filmic"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    return scene


def mat(name, color, metallic=0.9, roughness=0.28, emission=None, emission_strength=0.0,
        alpha=1.0, transmission=0.0, ior=1.45):
    """Create (or reuse) a Principled BSDF material that survives glTF export."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = ior
    if emission is not None:
        for key in ("Emission Color", "Emission"):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = emission
                break
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND" if hasattr(m, "blend_method") else m.blend_method
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            pass
    if transmission > 0.0 and "Transmission Weight" in bsdf.inputs:
        bsdf.inputs["Transmission Weight"].default_value = transmission
    return m


def apply(obj, material, shade_smooth=True, angle=math.radians(38)):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    if shade_smooth and obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True
        mod = obj.modifiers.new("SmoothByAngle", "SMOOTH_BY_ANGLE") if "SMOOTH_BY_ANGLE" in [
            i.identifier for i in bpy.types.Modifier.bl_rna.properties["type"].enum_items
        ] else None
        if mod is None and hasattr(obj.data, "use_auto_smooth"):
            obj.data.use_auto_smooth = True
            obj.data.auto_smooth_angle = angle
    return obj


def bevel(obj, width=0.006, segments=2, angle=math.radians(50)):
    m = obj.modifiers.new("Bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = angle
    m.harden_normals = True
    return obj


def new_collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col


def link(obj, collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def studio_light(key_energy=900.0, rim_energy=600.0, fill_energy=220.0,
                 world_color=(0.012, 0.016, 0.022, 1.0), world_strength=0.5):
    """Institutional three-point rig: cool key, cyan rim, soft fill."""
    world = bpy.data.worlds.new("DCX_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = world_color
    bg.inputs[1].default_value = world_strength

    def area(name, loc, rot, energy, color, size):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.color = color
        data.size = size
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        obj.rotation_euler = rot
        bpy.context.scene.collection.objects.link(obj)
        return obj

    area("KeyLight", (4.5, -5.0, 5.2), (math.radians(48), 0, math.radians(42)),
         key_energy, (0.92, 0.96, 1.0), 9.0)
    area("RimLight", (-5.6, 3.4, 2.6), (math.radians(78), 0, math.radians(-128)),
         rim_energy, (0.30, 0.80, 1.0), 7.0)
    area("FillLight", (-2.2, -4.4, 1.4), (math.radians(74), 0, math.radians(-24)),
         fill_energy, (0.75, 0.82, 0.95), 8.0)


def camera(location, look_at=(0, 0, 0), lens=52.0, name="RefCam"):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    cam = bpy.data.objects.new(name, data)
    cam.location = location
    bpy.context.scene.collection.objects.link(cam)
    target = bpy.data.objects.new("CamTarget", None)
    target.location = look_at
    bpy.context.scene.collection.objects.link(target)
    con = cam.constraints.new("TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    bpy.context.scene.camera = cam
    return cam


def _visible_corners(focus=None):
    """World-space bounding-box corners of everything that will render."""
    pts = []
    deps = bpy.context.evaluated_depsgraph_get()
    for obj in bpy.data.objects:
        if obj.type not in ("MESH", "CURVE") or obj.hide_render:
            continue
        if focus and not any(obj.name.startswith(f) for f in focus):
            continue
        try:
            ev = obj.evaluated_get(deps)
            pts.extend(obj.matrix_world @ Vector(c) for c in ev.bound_box)
        except Exception:
            continue
    return pts


def camera_framed(direction, lens=52.0, margin=1.04, look_offset=(0, 0, 0),
                  name="RefCam", aspect=(2560, 1440), focus=None):
    """Frame the scene exactly.

    Projects every visible bounding-box corner onto the camera axes and solves
    for the smallest distance that still contains them all, so shots are tight
    without cropping. `margin` is a straight multiplier on that distance and
    `focus` restricts framing to objects whose names start with those prefixes.
    """
    pts = _visible_corners(focus)
    if not pts:
        pts = _visible_corners(None) or [Vector((0, 0, 0))]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    centre = (lo + hi) * 0.5 + Vector(look_offset)

    d = Vector(direction).normalized()
    up_hint = Vector((0, 0, 1))
    if abs(d.dot(up_hint)) > 0.985:
        up_hint = Vector((0, 1, 0))
    right = d.cross(up_hint).normalized()
    up = right.cross(d).normalized()

    sensor = 36.0
    tan_h = sensor * 0.5 / lens
    tan_v = (sensor * (aspect[1] / aspect[0])) * 0.5 / lens

    dist = 0.0
    for p in pts:
        v = p - centre
        along = v.dot(d)
        dist = max(dist, abs(v.dot(right)) / tan_h + along,
                         abs(v.dot(up)) / tan_v + along)
    dist = max(dist, 1e-3) * margin
    return camera(tuple(centre + d * dist), look_at=tuple(centre), lens=lens, name=name)


def poly_count():
    total = 0
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            total += len(obj.data.polygons)
    return total


def export(slug, exclude=("LIGHT", "CAMERA", "EMPTY")):
    """Export every mesh in the scene to an optimised GLB."""
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type not in exclude:
            obj.select_set(True)
    path = os.path.join(MODEL_DIR, slug + ".glb")
    kwargs = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
    try:
        bpy.ops.export_scene.gltf(**kwargs)
    except TypeError:
        kwargs.pop("export_normals", None)
        bpy.ops.export_scene.gltf(**kwargs)
    size = os.path.getsize(path) / 1024.0
    return path, size


def save_blend(slug):
    path = os.path.join(SCENE_DIR, slug + ".blend")
    bpy.ops.wm.save_as_mainfile(filepath=path)
    return path


def render_ref(slug, width=2560, height=1440):
    scene = bpy.context.scene
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.compression = 15
    path = os.path.join(REF_DIR, slug + ".png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path


def hide_for_render(*names):
    """Keep an object in the GLB but drop it from the reference frame."""
    for n in names:
        for obj in bpy.data.objects:
            if obj.name == n or obj.name.startswith(n):
                obj.hide_render = True


def finish(slug, ref=True, ref_size=(2560, 1440)):
    glb, kb = export(slug)
    blend = save_blend(slug)
    out = {"slug": slug, "glb": glb, "glb_kb": round(kb, 1), "blend": blend,
           "tris": poly_count()}
    if ref:
        out["ref"] = render_ref(slug, *ref_size)
    print("DCX_RESULT " + repr(out))
    return out
