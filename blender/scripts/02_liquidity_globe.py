"""Global liquidity globe — dark earth, six market nodes, great-circle routes."""
import bpy, math, sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dcx_common import *  # noqa
from mathutils import Vector, Quaternion

SLUG = "liquidity_globe"
R = 2.0
reset_scene()
col = new_collection("LiquidityGlobe")

m_globe = mat("DCX_GlobeShell", (0.016, 0.020, 0.026, 1.0), metallic=0.35, roughness=0.55)
m_grid = mat("DCX_GlobeGrid", (0.02, 0.07, 0.09, 1.0), metallic=0.4, roughness=0.30,
             emission=(0.05, 0.30, 0.40, 1.0), emission_strength=1.1)
m_node = mat("DCX_Node", (0.02, 0.10, 0.13, 1.0), metallic=0.1, roughness=0.20,
             emission=PALETTE["cyan"], emission_strength=3.0)
m_node_ring = mat("DCX_NodeRing", PALETTE["steel"], metallic=1.0, roughness=0.22)
m_arc = mat("DCX_Arc", (0.02, 0.09, 0.12, 1.0), metallic=0.1, roughness=0.25,
            emission=(0.10, 0.72, 0.90, 1.0), emission_strength=2.2)
m_arc_g = mat("DCX_ArcGreen", (0.02, 0.10, 0.06, 1.0), metallic=0.1, roughness=0.25,
              emission=PALETTE["green"], emission_strength=1.8)

# ---- Globe body -----------------------------------------------------------
bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=R)
globe = bpy.context.object
globe.name = "GlobeShell"
apply(globe, m_globe)
link(globe, col)

# graticule: latitude + longitude rings sitting just above the shell
for i, lat in enumerate(range(-60, 61, 20)):
    r = R * math.cos(math.radians(lat)) * 1.004
    z = R * math.sin(math.radians(lat)) * 1.004
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.0045,
                                     major_segments=128, minor_segments=6,
                                     location=(0, 0, z))
    o = bpy.context.object
    o.name = "Lat_%02d" % i
    apply(o, m_grid)
    link(o, col)

for i in range(12):
    bpy.ops.mesh.primitive_torus_add(major_radius=R * 1.004, minor_radius=0.0038,
                                     major_segments=128, minor_segments=6,
                                     location=(0, 0, 0),
                                     rotation=(math.radians(90), 0, i * math.pi / 12))
    o = bpy.context.object
    o.name = "Lon_%02d" % i
    apply(o, m_grid)
    link(o, col)

# ---- Market centres -------------------------------------------------------
MARKETS = [
    ("NewYork", 40.71, -74.01),
    ("London", 51.51, -0.13),
    ("Dubai", 25.20, 55.27),
    ("Mumbai", 19.08, 72.88),
    ("Singapore", 1.35, 103.82),
    ("Tokyo", 35.68, 139.69),
]


def latlon(lat, lon, radius=R):
    la, lo = math.radians(lat), math.radians(lon)
    return Vector((radius * math.cos(la) * math.cos(lo),
                   radius * math.cos(la) * math.sin(lo),
                   radius * math.sin(la)))


def align(obj, direction):
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.normalized().to_track_quat("Z", "Y")


for name, lat, lon in MARKETS:
    p = latlon(lat, lon, R * 1.006)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.055, depth=0.03, location=p)
    pad = bpy.context.object
    pad.name = "Node_" + name
    align(pad, p)
    apply(pad, m_node)
    link(pad, col)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.115, minor_radius=0.008,
                                     major_segments=48, minor_segments=6,
                                     location=latlon(lat, lon, R * 1.004))
    halo = bpy.context.object
    halo.name = "NodeRing_" + name
    align(halo, p)
    apply(halo, m_node_ring)
    link(halo, col)

    # vertical marker pin so the city reads at a distance
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.010, depth=0.34,
                                        location=latlon(lat, lon, R * 1.09))
    pin = bpy.context.object
    pin.name = "NodePin_" + name
    align(pin, p)
    apply(pin, m_node)
    link(pin, col)

# ---- Great-circle liquidity routes ---------------------------------------
ROUTES = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (0, 5), (1, 4), (0, 2)]


def arc_curve(a, b, name, lift=0.34, steps=64):
    va, vb = latlon(*a[1:]), latlon(*b[1:])
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.012
    curve.bevel_resolution = 3
    curve.use_fill_caps = True
    spline = curve.splines.new("POLY")
    spline.points.add(steps)
    omega = va.angle(vb)
    for i in range(steps + 1):
        t = i / steps
        if omega < 1e-4:
            p = va.lerp(vb, t)
        else:
            s = math.sin(omega)
            p = (va * (math.sin((1 - t) * omega) / s)) + (vb * (math.sin(t * omega) / s))
        bulge = 1.0 + lift * math.sin(math.pi * t)
        p = p.normalized() * (R * bulge)
        spline.points[i].co = (p.x, p.y, p.z, 1.0)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    return obj


for i, (a, b) in enumerate(ROUTES):
    o = arc_curve(MARKETS[a], MARKETS[b], "Route_%02d" % i,
                  lift=0.22 + 0.05 * (i % 3))
    apply(o, m_arc if i % 3 else m_arc_g, shade_smooth=False)
    link(o, col)

# ---- Orbital containment ring --------------------------------------------
bpy.ops.mesh.primitive_torus_add(major_radius=R * 1.42, minor_radius=0.016,
                                 major_segments=192, minor_segments=8,
                                 location=(0, 0, 0), rotation=(math.radians(76), 0, math.radians(18)))
orbit = bpy.context.object
orbit.name = "OrbitRing"
apply(orbit, m_node_ring)
link(orbit, col)

studio_light(key_energy=1400.0, rim_energy=1100.0, fill_energy=180.0,
             world_color=(0.006, 0.009, 0.014, 1.0), world_strength=0.28)
bpy.data.objects["RimLight"].location = (-6.0, 3.0, 1.2)
camera_framed((0.60, -0.72, 0.30), lens=66.0, margin=1.02)
finish(SLUG)
