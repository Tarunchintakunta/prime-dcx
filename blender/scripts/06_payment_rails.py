"""Payment rails — bank / card / UPI / crypto lanes converging on the ledger."""
import bpy, math, sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dcx_common import *  # noqa

SLUG = "payment_rails"
reset_scene()
col = new_collection("PaymentRails")

m_deck = mat("DCX_RailDeck", (0.014, 0.016, 0.019, 1.0), metallic=0.10, roughness=0.78)
m_steel = mat("DCX_RailSteel", PALETTE["steel"], metallic=1.0, roughness=0.20)
m_dark = mat("DCX_RailDark", (0.045, 0.050, 0.058, 1.0), metallic=1.0, roughness=0.36)
LANE_COLORS = [
    ("Bank", PALETTE["cyan"]),
    ("Card", (0.55, 0.78, 0.95, 1.0)),
    ("UPI", PALETTE["green"]),
    ("Crypto", PALETTE["amber"]),
    ("Local", (0.72, 0.78, 0.86, 1.0)),
]

# ---- Lanes: each rail sweeps in from the edge and converges on the hub ----
for idx, (name, colr) in enumerate(LANE_COLORS):
    glow = mat("DCX_Lane_" + name, (colr[0] * 0.12, colr[1] * 0.12, colr[2] * 0.12, 1.0),
               metallic=0.1, roughness=0.24, emission=colr, emission_strength=2.2)
    offset = (idx - 2) * 1.28
    curve = bpy.data.curves.new("RailCurve_" + name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.030
    curve.bevel_resolution = 3
    sp = curve.splines.new("NURBS")
    pts = [(-8.5, offset, 0.0), (-4.2, offset, 0.0), (-1.6, offset * 0.55, 0.16),
           (0.0, 0.0, 0.30), (1.6, offset * 0.55, 0.16), (4.2, offset, 0.0), (8.5, offset, 0.0)]
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p[0], p[1], p[2], 1.0)
    sp.use_endpoint_u = True
    sp.order_u = 4
    rail = bpy.data.objects.new("Rail_" + name, curve)
    bpy.context.scene.collection.objects.link(rail)
    apply(rail, glow, shade_smooth=False)
    link(rail, col)

    # channel the rail sits in
    guide = bpy.data.curves.new("GuideCurve_" + name, "CURVE")
    guide.dimensions = "3D"
    guide.bevel_depth = 0.055
    guide.bevel_resolution = 3
    gs = guide.splines.new("NURBS")
    gs.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        gs.points[i].co = (p[0], p[1], p[2] - 0.055, 1.0)
    gs.use_endpoint_u = True
    gs.order_u = 4
    gobj = bpy.data.objects.new("Guide_" + name, guide)
    bpy.context.scene.collection.objects.link(gobj)
    apply(gobj, m_dark, shade_smooth=False)
    link(gobj, col)

    # terminal pads at both ends: deposit in, withdrawal out
    for sign, tag in ((-1, "In"), (1, "Out")):
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.42, depth=0.10,
                                            location=(sign * 7.6, offset, 0.0))
        pad = bpy.context.object
        pad.name = "Pad_%s_%s" % (name, tag)
        apply(pad, m_dark, shade_smooth=False)
        bevel(pad, width=0.014, segments=3)
        link(pad, col)

        bpy.ops.mesh.primitive_torus_add(major_radius=0.42, minor_radius=0.014,
                                         major_segments=64, minor_segments=6,
                                         location=(sign * 7.6, offset, 0.055))
        halo = bpy.context.object
        halo.name = "PadRing_%s_%s" % (name, tag)
        apply(halo, glow)
        link(halo, col)

    # value packets travelling the rail
    for k in range(4):
        t = -6.0 + k * 3.1 + idx * 0.4
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(t, offset * (1.0 - abs(t) / 12.0), 0.075))
        pk = bpy.context.object
        pk.name = "Packet_%s_%d" % (name, k)
        pk.scale = (0.10, 0.055, 0.055)
        apply(pk, glow, shade_smooth=False)
        link(pk, col)

# ---- Settlement hub -------------------------------------------------------
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.30, depth=0.22, location=(0, 0, 0.10))
hub = bpy.context.object
hub.name = "SettlementHub"
apply(hub, m_dark, shade_smooth=False)
bevel(hub, width=0.020, segments=3)
link(hub, col)

for i, r in enumerate((1.16, 0.94, 0.70)):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.016,
                                     major_segments=128, minor_segments=8,
                                     location=(0, 0, 0.22))
    ring = bpy.context.object
    ring.name = "HubRing_%d" % i
    apply(ring, mat("DCX_HubRing", (0.02, 0.09, 0.12, 1.0), metallic=0.1, roughness=0.22,
                    emission=PALETTE["cyan"], emission_strength=2.0 - i * 0.4))
    link(ring, col)

for i, (r, h, z) in enumerate(((0.34, 0.30, 0.36), (0.26, 0.26, 0.64), (0.18, 0.22, 0.88))):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r, depth=h, location=(0, 0, z))
    tier = bpy.context.object
    tier.name = "HubPylon_%d" % i
    apply(tier, m_steel if i % 2 == 0 else m_dark, shade_smooth=False)
    bevel(tier, width=0.014, segments=3)
    link(tier, col)

# ---- Ledger deck ----------------------------------------------------------
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.16))
deck = bpy.context.object
deck.name = "RailDeck"
deck.scale = (18.0, 8.4, 0.10)
apply(deck, m_deck, shade_smooth=False)
link(deck, col)

studio_light(key_energy=900.0, rim_energy=700.0, fill_energy=180.0,
             world_color=(0.006, 0.008, 0.012, 1.0), world_strength=0.24)
bpy.data.objects["KeyLight"].location = (5.0, -6.4, 5.4)
bpy.data.objects["RimLight"].location = (-7.0, 5.0, 3.4)
bpy.data.objects["RimLight"].data.energy = 420.0
camera_framed((0.40, -0.70, 0.42), lens=58.0, margin=1.02, look_offset=(0, 0, 0.10),
              focus=("Rail_", "Guide_", "Pad_", "Hub", "Packet"))
finish(SLUG)
