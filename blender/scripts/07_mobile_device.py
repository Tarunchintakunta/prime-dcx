"""Mobile trading device — machined phone body standing upright, live chart face.

The device is built in the XZ plane (width X, height Z, depth Y) so it faces the
camera, and every UI element is placed through `ui()` in normalised screen space
so nothing can drift off the glass.
"""
import bpy, math, random, sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dcx_common import *  # noqa

SLUG = "mobile_device"
random.seed(31)
reset_scene()
col = new_collection("MobileDevice")

W, H, D = 0.74, 1.54, 0.048          # body: width, height, depth
SW, SH = W * 0.925 * 0.5, H * 0.950 * 0.5   # screen half-extents
FACE = -D * 0.5 - 0.004               # glass plane, facing -Y (toward camera)

m_body = mat("DCX_PhoneBody", (0.055, 0.060, 0.070, 1.0), metallic=1.0, roughness=0.30)
m_rail = mat("DCX_PhoneRail", PALETTE["steel"], metallic=1.0, roughness=0.14)
m_screen = mat("DCX_PhoneScreen", (0.006, 0.009, 0.013, 1.0), metallic=0.0, roughness=0.09,
               emission=(0.009, 0.028, 0.040, 1.0), emission_strength=0.30)
m_up = mat("DCX_PhoneUp", (0.02, 0.10, 0.07, 1.0), metallic=0.0, roughness=0.2,
           emission=(0.07, 0.68, 0.38, 1.0), emission_strength=1.6)
m_dn = mat("DCX_PhoneDn", (0.11, 0.03, 0.04, 1.0), metallic=0.0, roughness=0.2,
           emission=(0.75, 0.18, 0.20, 1.0), emission_strength=1.35)
m_ui = mat("DCX_PhoneUI", (0.02, 0.08, 0.11, 1.0), metallic=0.0, roughness=0.2,
           emission=(0.06, 0.60, 0.76, 1.0), emission_strength=1.3)
m_dim = mat("DCX_PhoneDim", (0.05, 0.056, 0.065, 1.0), metallic=0.0, roughness=0.3,
            emission=(0.20, 0.23, 0.27, 1.0), emission_strength=0.45)


def ui(name, u, v, w, h, material, depth=0.0032):
    """Place a UI slab in normalised screen space: u,v and w,h are in [-1,1]."""
    obj_x = u * SW
    obj_z = v * SH
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(obj_x, FACE - depth * 0.5, obj_z))
    o = bpy.context.object
    o.name = name
    o.scale = (max(w, 0.002) * SW, depth, max(h, 0.002) * SH)
    apply(o, material, shade_smooth=False)
    link(o, col)
    return o


# ---- Body -----------------------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
body = bpy.context.object
body.name = "PhoneBody"
body.scale = (W, D, H)
apply(body, m_body, shade_smooth=False)
bevel(body, width=0.032, segments=6, angle=math.radians(60))
link(body, col)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
rail = bpy.context.object
rail.name = "PhoneRail"
rail.scale = (W * 1.014, D * 0.88, H * 1.010)
apply(rail, m_rail, shade_smooth=False)
bevel(rail, width=0.028, segments=5, angle=math.radians(60))
link(rail, col)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, FACE + 0.002, 0))
screen = bpy.context.object
screen.name = "PhoneScreen"
screen.scale = (SW * 2, 0.006, SH * 2)
apply(screen, m_screen, shade_smooth=False)
bevel(screen, width=0.018, segments=4, angle=math.radians(60))
link(screen, col)

# side buttons
for z in (0.34, 0.16, -0.04):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(W * 0.51, 0, z))
    btn = bpy.context.object
    btn.name = "SideBtn_%s" % str(z).replace(".", "").replace("-", "n")
    btn.scale = (0.014, D * 0.5, 0.09 if z > 0.3 else 0.06)
    apply(btn, m_rail, shade_smooth=False)
    link(btn, col)

# ---- Status + tab strip ---------------------------------------------------
ui("PhoneStatus", -0.62, 0.945, 0.30, 0.012, m_dim)
ui("PhoneBattery", 0.72, 0.945, 0.16, 0.012, m_dim)
for i in range(3):
    ui("PhoneTab_%d" % i, -0.60 + i * 0.42, 0.855, 0.30, 0.026,
       m_ui if i == 0 else m_dim)

# ---- Symbol header --------------------------------------------------------
ui("PhoneSymbol", -0.46, 0.735, 0.44, 0.040, m_dim)
ui("PhoneLast", 0.52, 0.735, 0.36, 0.040, m_up)
ui("PhoneChange", 0.52, 0.665, 0.24, 0.020, m_up)

# ---- Chart ----------------------------------------------------------------
price = 0.0
for i in range(24):
    price += random.uniform(-0.30, 0.30) - price * 0.16
    h = abs(random.gauss(0.10, 0.045)) + 0.025
    ui("PhoneCandle_%02d" % i, -0.86 + i * 0.075, 0.34 + price * 0.09,
       0.030, h, m_up if random.random() > 0.42 else m_dn)

curve = bpy.data.curves.new("PhoneTrend", "CURVE")
curve.dimensions = "3D"
curve.bevel_depth = 0.004
sp = curve.splines.new("POLY")
sp.points.add(32)
for i in range(33):
    t = i / 32
    sp.points[i].co = ((-0.88 + t * 1.76) * SW, FACE - 0.006,
                       (0.30 + math.sin(t * 4.6) * 0.13 + t * 0.14) * SH, 1.0)
trend = bpy.data.objects.new("PhoneTrendLine", curve)
bpy.context.scene.collection.objects.link(trend)
apply(trend, m_ui, shade_smooth=False)
link(trend, col)

# ---- Depth ladder ---------------------------------------------------------
for i in range(8):
    w = 0.16 + abs(math.sin(i * 0.8)) * 0.42
    ui("PhoneDepth_%02d" % i, -0.88 + w, -0.10 - i * 0.075, w, 0.024,
       m_up if i > 3 else m_dn)
    ui("PhoneDepthPx_%02d" % i, 0.72, -0.10 - i * 0.075, 0.16, 0.014, m_dim)

# ---- Order buttons + nav --------------------------------------------------
ui("PhoneBuy", -0.44, -0.79, 0.66, 0.075, m_up, depth=0.005)
ui("PhoneSell", 0.44, -0.79, 0.66, 0.075, m_dn, depth=0.005)
for i in range(4):
    ui("PhoneNav_%d" % i, -0.66 + i * 0.44, -0.93, 0.16, 0.022,
       m_ui if i == 1 else m_dim)

# ---- Presentation: tilt the whole device on a pivot ----------------------
pivot = bpy.data.objects.new("DevicePivot", None)
bpy.context.scene.collection.objects.link(pivot)
for obj in list(col.objects):
    obj.parent = pivot
    obj.matrix_parent_inverse = pivot.matrix_world.inverted()
pivot.rotation_euler = (math.radians(6), math.radians(-17), math.radians(3))
bpy.context.view_layer.update()

studio_light(key_energy=380.0, rim_energy=300.0, fill_energy=110.0,
             world_color=(0.007, 0.009, 0.013, 1.0), world_strength=0.26)
bpy.data.objects["KeyLight"].location = (2.2, -2.8, 2.4)
bpy.data.objects["KeyLight"].rotation_euler = (math.radians(42), 0, math.radians(38))
bpy.data.objects["RimLight"].location = (-2.6, -1.2, 1.4)
bpy.data.objects["RimLight"].rotation_euler = (math.radians(74), 0, math.radians(-56))
camera_framed((0.16, -0.97, 0.16), lens=64.0, margin=1.03)
finish(SLUG)
