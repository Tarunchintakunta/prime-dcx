"""Trading cockpit — desk, curved multi-screen array, order + depth panels."""
import bpy, math, random, sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dcx_common import *  # noqa

SLUG = "trading_cockpit"
random.seed(77)
reset_scene()
col = new_collection("TradingCockpit")

m_desk = mat("DCX_Desk", (0.028, 0.031, 0.036, 1.0), metallic=0.30, roughness=0.42)
m_frame = mat("DCX_Frame", (0.075, 0.082, 0.092, 1.0), metallic=1.0, roughness=0.28)
m_trim = mat("DCX_Trim", PALETTE["steel"], metallic=1.0, roughness=0.18)
m_screen = mat("DCX_Screen", (0.006, 0.009, 0.012, 1.0), metallic=0.0, roughness=0.11,
               emission=(0.010, 0.030, 0.042, 1.0), emission_strength=0.30)
m_chart_up = mat("DCX_ChartUp", (0.02, 0.10, 0.07, 1.0), metallic=0.0, roughness=0.2,
                 emission=(0.07, 0.66, 0.36, 1.0), emission_strength=1.5)
m_chart_dn = mat("DCX_ChartDn", (0.11, 0.03, 0.04, 1.0), metallic=0.0, roughness=0.2,
                 emission=(0.74, 0.17, 0.19, 1.0), emission_strength=1.3)
m_ui = mat("DCX_UI", (0.02, 0.08, 0.11, 1.0), metallic=0.0, roughness=0.2,
           emission=PALETTE["cyan"], emission_strength=1.5)
m_ui_dim = mat("DCX_UIDim", (0.06, 0.07, 0.08, 1.0), metallic=0.0, roughness=0.3,
               emission=(0.24, 0.27, 0.31, 1.0), emission_strength=0.6)
m_amber = mat("DCX_Amber", (0.12, 0.08, 0.02, 1.0), metallic=0.0, roughness=0.2,
              emission=PALETTE["amber"], emission_strength=1.4)

# ---- Desk -----------------------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.35, -0.05))
desk = bpy.context.object
desk.name = "DeskTop"
desk.scale = (5.6, 1.9, 0.09)
apply(desk, m_desk, shade_smooth=False)
bevel(desk, width=0.014, segments=3)
link(desk, col)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.35, -0.115))
lip = bpy.context.object
lip.name = "DeskLip"
lip.scale = (5.4, 1.82, 0.010)
apply(lip, m_ui, shade_smooth=False)
link(lip, col)

for sx in (-2.35, 2.35):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0.35, -0.72))
    leg = bpy.context.object
    leg.name = "DeskLeg_%s" % ("L" if sx < 0 else "R")
    leg.scale = (0.16, 1.5, 1.30)
    apply(leg, m_frame, shade_smooth=False)
    bevel(leg, width=0.010, segments=2)
    link(leg, col)


def panel(name, width, height, angle_deg, x, z, y=-0.55, screen_mat=m_screen):
    """A bezelled screen: frame slab plus an inset emissive display face."""
    rot = (math.radians(-76), 0.0, math.radians(angle_deg))
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y, z), rotation=rot)
    frame = bpy.context.object
    frame.name = name + "_Bezel"
    frame.scale = (width, height, 0.045)
    apply(frame, m_frame, shade_smooth=False)
    bevel(frame, width=0.008, segments=2)
    link(frame, col)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y, z), rotation=rot)
    face = bpy.context.object
    face.name = name + "_Screen"
    face.scale = (width * 0.955, height * 0.945, 0.050)
    apply(face, screen_mat, shade_smooth=False)
    link(face, col)
    return frame, face


# ---- Screen array: main chart flanked by watchlist and depth --------------
panel("Main", 1.72, 1.06, 0.0, 0.0, 1.20)
panel("WatchL", 0.94, 1.00, 21.0, -2.42, 1.14)
panel("DepthR", 0.94, 1.00, -21.0, 2.42, 1.14)
panel("OrderPad", 0.86, 0.44, 0.0, 1.95, 0.16, y=0.05)

# ---- Monitor arms ---------------------------------------------------------
for name, x, z_top, tilt in (("Main", 0.0, 0.66, 0.0), ("WatchL", -2.42, 0.62, 21.0),
                             ("DepthR", 2.42, 0.62, -21.0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.045, depth=z_top,
                                        location=(x, -0.42, z_top * 0.5 + 0.02))
    post = bpy.context.object
    post.name = "Arm_" + name
    apply(post, m_frame, shade_smooth=False)
    link(post, col)

    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.17, depth=0.045,
                                        location=(x, -0.42, 0.045))
    foot = bpy.context.object
    foot.name = "ArmFoot_" + name
    apply(foot, m_trim, shade_smooth=False)
    bevel(foot, width=0.010, segments=3)
    link(foot, col)


# ---- Main screen content: candles + a moving-average ribbon --------------
price = 0.0
for i in range(34):
    price += random.uniform(-0.26, 0.28)
    body = abs(random.gauss(0.26, 0.11)) + 0.05
    x = -0.76 + i * 0.046
    z = 1.22 + price * 0.10
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, -0.60, z),
                                    rotation=(math.radians(-76), 0, 0))
    c = bpy.context.object
    c.name = "MainCandle_%02d" % i
    c.scale = (0.024, body * 0.34, 0.006)
    apply(c, m_chart_up if random.random() > 0.42 else m_chart_dn, shade_smooth=False)
    link(c, col)

curve = bpy.data.curves.new("MA", "CURVE")
curve.dimensions = "3D"
curve.bevel_depth = 0.006
sp = curve.splines.new("POLY")
sp.points.add(40)
for i in range(41):
    t = i / 40
    sp.points[i].co = (-0.78 + t * 1.56, -0.615,
                       1.20 + math.sin(t * 5.2) * 0.13 + t * 0.10, 1.0)
ma = bpy.data.objects.new("MA_Line", curve)
bpy.context.scene.collection.objects.link(ma)
apply(ma, m_ui, shade_smooth=False)
link(ma, col)

# ---- Watchlist rows -------------------------------------------------------
for i in range(11):
    z = 1.55 - i * 0.083
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-2.44, -0.585, z),
                                    rotation=(math.radians(-76), 0, math.radians(21)))
    row = bpy.context.object
    row.name = "WatchRow_%02d" % i
    row.scale = (0.78, 0.034, 0.005)
    apply(row, m_ui_dim if i % 3 else m_ui, shade_smooth=False)
    link(row, col)

# ---- Depth ladder ---------------------------------------------------------
for i in range(14):
    z = 1.56 - i * 0.078
    w = 0.24 + abs(math.sin(i * 0.6)) * 0.5
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.44 - (0.80 - w) * 0.18, -0.585, z),
                                    rotation=(math.radians(-76), 0, math.radians(-21)))
    row = bpy.context.object
    row.name = "DepthRow_%02d" % i
    row.scale = (w, 0.026, 0.005)
    apply(row, m_chart_up if i > 6 else m_chart_dn, shade_smooth=False)
    link(row, col)

# ---- Order pad controls ---------------------------------------------------
for i, m in enumerate((m_chart_up, m_chart_dn, m_amber, m_ui_dim)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.62 + i * 0.22, 0.035, 0.18),
                                    rotation=(math.radians(-76), 0, 0))
    btn = bpy.context.object
    btn.name = "OrderBtn_%d" % i
    btn.scale = (0.085, 0.10, 0.008)
    apply(btn, m, shade_smooth=False)
    link(btn, col)

# ---- Keyboard slab and desk instruments ----------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.35, 0.62, 0.02))
kb = bpy.context.object
kb.name = "Keyboard"
kb.scale = (1.30, 0.42, 0.030)
apply(kb, m_frame, shade_smooth=False)
bevel(kb, width=0.006, segments=2)
link(kb, col)

bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.115, depth=0.055,
                                    location=(0.95, 0.68, 0.02))
dial = bpy.context.object
dial.name = "Dial"
apply(dial, m_trim, shade_smooth=False)
bevel(dial, width=0.008, segments=2)
link(dial, col)

studio_light(key_energy=520.0, rim_energy=420.0, fill_energy=140.0,
             world_color=(0.007, 0.009, 0.013, 1.0), world_strength=0.24)
bpy.data.objects["KeyLight"].location = (3.6, -3.4, 3.4)
bpy.data.objects["RimLight"].location = (-4.4, 2.6, 2.2)
camera_framed((0.10, -0.95, 0.26), lens=48.0, margin=1.02, look_offset=(0, 0, 0.10),
              focus=("Main", "WatchL", "DepthR", "Desk", "Order", "Arm", "Keyboard", "Dial"))
finish(SLUG)
