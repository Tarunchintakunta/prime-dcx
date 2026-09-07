"""Market data tunnel — candlesticks, order-book depth walls, volatility ribs."""
import bpy, math, random, sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dcx_common import *  # noqa

SLUG = "market_tunnel"
random.seed(1104)
reset_scene()
col = new_collection("MarketTunnel")

m_up = mat("DCX_Up", (0.02, 0.11, 0.07, 1.0), metallic=0.15, roughness=0.28,
           emission=(0.06, 0.62, 0.34, 1.0), emission_strength=1.15)
m_down = mat("DCX_Down", (0.13, 0.03, 0.04, 1.0), metallic=0.15, roughness=0.28,
             emission=(0.72, 0.16, 0.18, 1.0), emission_strength=1.05)
m_wick = mat("DCX_Wick", (0.30, 0.34, 0.38, 1.0), metallic=0.9, roughness=0.30)
m_bid = mat("DCX_Bid", (0.02, 0.09, 0.07, 1.0), metallic=0.2, roughness=0.35,
            emission=(0.10, 0.62, 0.38, 1.0), emission_strength=1.0)
m_ask = mat("DCX_Ask", (0.10, 0.03, 0.04, 1.0), metallic=0.2, roughness=0.35,
            emission=(0.70, 0.22, 0.24, 1.0), emission_strength=0.9)
m_rib = mat("DCX_Rib", PALETTE["steel_dark"], metallic=1.0, roughness=0.34)
m_flow = mat("DCX_Flow", (0.02, 0.09, 0.12, 1.0), metallic=0.1, roughness=0.22,
             emission=PALETTE["cyan"], emission_strength=2.4)

# ---- Candlestick series running down the tunnel floor ---------------------
N = 46
price = 0.0
for i in range(N):
    # mean-reverting walk keeps the series inside the tunnel instead of
    # drifting out of frame
    drift = random.uniform(-0.32, 0.32) - price * 0.18
    body = abs(random.gauss(0.34, 0.16)) + 0.08
    up = drift >= 0
    price += drift * 0.45
    y = -i * 0.44 + 8.0
    z = price * 0.42

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, y, z))
    c = bpy.context.object
    c.name = "Candle_%02d" % i
    c.scale = (0.115, 0.145, body * 0.5)
    apply(c, m_up if up else m_down, shade_smooth=False)
    bevel(c, width=0.010, segments=2)
    link(c, col)

    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.014,
                                        depth=body + random.uniform(0.20, 0.55),
                                        location=(0.0, y, z))
    w = bpy.context.object
    w.name = "Wick_%02d" % i
    apply(w, m_wick, shade_smooth=False)
    link(w, col)

# ---- Order book depth walls ----------------------------------------------
LEVELS = 30
for side, sign, material in (("Bid", -1, m_bid), ("Ask", 1, m_ask)):
    for i in range(LEVELS):
        depth = 0.30 + abs(math.sin(i * 0.42)) * 1.15 + random.uniform(0, 0.25)
        y = -i * 0.66 + 8.0
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * (1.55 + depth * 0.5), y, -0.55))
        b = bpy.context.object
        b.name = "%s_%02d" % (side, i)
        b.scale = (depth * 0.5, 0.22, 0.055)
        apply(b, material, shade_smooth=False)
        link(b, col)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sign * (1.55 + depth * 0.5), y, 0.95))
        t = bpy.context.object
        t.name = "%sTop_%02d" % (side, i)
        t.scale = (depth * 0.42, 0.22, 0.040)
        apply(t, material, shade_smooth=False)
        link(t, col)

# ---- Structural ribs shaping the tunnel ----------------------------------
for i in range(14):
    y = -i * 1.5 + 8.0
    bpy.ops.mesh.primitive_torus_add(major_radius=3.15, minor_radius=0.030,
                                     major_segments=8, minor_segments=6,
                                     location=(0, y, 0.10),
                                     rotation=(math.radians(90), math.radians(22.5), 0))
    r = bpy.context.object
    r.name = "Rib_%02d" % i
    apply(r, m_rib, shade_smooth=False)
    link(r, col)

# ---- Bid/ask flow particles ----------------------------------------------
for i in range(64):
    a = random.uniform(0, math.tau)
    rad = random.uniform(1.9, 2.85)
    y = random.uniform(-12.0, 8.0)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.020, 0.042),
                                          location=(math.cos(a) * rad, y, math.sin(a) * rad * 0.62 + 0.1))
    p = bpy.context.object
    p.name = "Flow_%02d" % i
    apply(p, m_flow)
    link(p, col)

# ---- Volatility waves along the walls ------------------------------------
for side, sign in (("L", -1), ("R", 1)):
    curve = bpy.data.curves.new("Vol_" + side, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.018
    curve.bevel_resolution = 2
    sp = curve.splines.new("POLY")
    steps = 90
    sp.points.add(steps)
    for i in range(steps + 1):
        t = i / steps
        y = 8.0 - t * 21.0
        sp.points[i].co = (sign * 2.95, y, math.sin(t * 15.0) * 0.42 + 1.55, 1.0)
    o = bpy.data.objects.new("VolWave_" + side, curve)
    bpy.context.scene.collection.objects.link(o)
    apply(o, m_flow, shade_smooth=False)
    link(o, col)

studio_light(key_energy=900.0, rim_energy=700.0, fill_energy=160.0,
             world_color=(0.006, 0.008, 0.011, 1.0), world_strength=0.22)
bpy.data.objects["KeyLight"].location = (3.4, 6.0, 4.4)
bpy.data.objects["RimLight"].location = (-4.6, -2.0, 1.6)
camera((0.0, 10.6, 1.15), look_at=(0.0, -4.0, -0.10), lens=32.0)
finish(SLUG)
