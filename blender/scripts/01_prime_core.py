"""Prime Core — the Market Engine.

A machined financial engine: a dense emissive core, three concentric gimbal
rings on different axes, a radial stator of machined blades, and data channels
that carry light outward. Named objects drive the R3F animation.
"""
import bpy, math, sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dcx_common import *  # noqa

SLUG = "prime_core"
reset_scene()
col = new_collection("PrimeCore")

m_steel = mat("DCX_Steel", PALETTE["steel"], metallic=1.0, roughness=0.22)
m_dark = mat("DCX_SteelDark", PALETTE["steel_dark"], metallic=1.0, roughness=0.38)
m_graphite = mat("DCX_Graphite", PALETTE["graphite"], metallic=0.55, roughness=0.52)
m_core = mat("DCX_CoreGlow", (0.006, 0.030, 0.044, 1.0), metallic=0.0, roughness=0.30,
             emission=(0.045, 0.34, 0.47, 1.0), emission_strength=1.35)
m_cyan = mat("DCX_Cyan", (0.02, 0.09, 0.12, 1.0), metallic=0.2, roughness=0.25,
             emission=PALETTE["cyan"], emission_strength=2.4)
m_green = mat("DCX_Green", (0.02, 0.10, 0.06, 1.0), metallic=0.2, roughness=0.25,
              emission=PALETTE["green"], emission_strength=2.0)

# ---- Core -----------------------------------------------------------------
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=0.62, location=(0, 0, 0))
core = bpy.context.object
core.name = "Core"
apply(core, m_core)
link(core, col)

# faceted shell around the core, slightly larger, machined graphite
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.80, location=(0, 0, 0))
shell = bpy.context.object
shell.name = "CoreShell"
apply(shell, m_dark, shade_smooth=False)
w = shell.modifiers.new("Wire", "WIREFRAME")
w.thickness = 0.035
w.use_replace = True
w.use_even_offset = True
link(shell, col)

# ---- Gimbal rings ---------------------------------------------------------
RINGS = [
    ("RingA", 1.18, 0.030, (0.0, 0.0, 0.0), m_steel),
    ("RingB", 1.52, 0.026, (math.radians(64), 0.0, math.radians(22)), m_dark),
    ("RingC", 1.92, 0.022, (math.radians(-38), math.radians(18), 0.0), m_steel),
]
for name, major, minor, rot, material in RINGS:
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                     major_segments=128, minor_segments=12,
                                     location=(0, 0, 0), rotation=rot)
    ring = bpy.context.object
    ring.name = name
    apply(ring, material)
    link(ring, col)

    # inlaid light channel riding inside each ring
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor * 0.34,
                                     major_segments=128, minor_segments=8,
                                     location=(0, 0, 0), rotation=rot)
    inlay = bpy.context.object
    inlay.name = name + "_Inlay"
    apply(inlay, m_cyan if name != "RingB" else m_green)
    link(inlay, col)

# ---- Stator: radial machined blades ---------------------------------------
BLADES = 24
for i in range(BLADES):
    a = (i / BLADES) * math.tau
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(math.cos(a) * 1.02, math.sin(a) * 1.02, 0))
    blade = bpy.context.object
    blade.name = "Blade_%02d" % i
    blade.scale = (0.42, 0.042, 0.30)
    blade.rotation_euler = (0, 0, a + math.radians(14))
    apply(blade, m_graphite, shade_smooth=False)
    bevel(blade, width=0.008, segments=2)
    link(blade, col)

# ---- Data channels: light conduits leaving the engine ---------------------
CHANNELS = 8
for i in range(CHANNELS):
    a = (i / CHANNELS) * math.tau + math.radians(11)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.017, depth=1.55,
                                        location=(math.cos(a) * 2.42, math.sin(a) * 2.42, 0),
                                        rotation=(0, math.radians(90), a))
    ch = bpy.context.object
    ch.name = "Channel_%02d" % i
    apply(ch, m_cyan if i % 3 else m_green)
    link(ch, col)

    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.075, depth=0.10,
                                        location=(math.cos(a) * 3.20, math.sin(a) * 3.20, 0),
                                        rotation=(0, math.radians(90), a))
    node = bpy.context.object
    node.name = "ChannelNode_%02d" % i
    apply(node, m_steel)
    bevel(node, width=0.012, segments=2)
    link(node, col)

# ---- Base plinth ----------------------------------------------------------
m_deck = mat("DCX_Deck", (0.020, 0.023, 0.027, 1.0), metallic=0.25, roughness=0.62)
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=4.60, depth=0.10, location=(0, 0, -3.15))
base = bpy.context.object
base.name = "BasePlate"
apply(base, m_deck, shade_smooth=False)
bevel(base, width=0.02, segments=3)
link(base, col)

for idx, (rad, thick) in enumerate(((4.30, 0.010), (3.70, 0.006), (2.95, 0.006))):
    bpy.ops.mesh.primitive_torus_add(major_radius=rad, minor_radius=thick,
                                     major_segments=192, minor_segments=8,
                                     location=(0, 0, -3.09))
    ringlight = bpy.context.object
    ringlight.name = "BaseRing_%d" % idx
    apply(ringlight, mat("DCX_BaseRing", (0.01, 0.05, 0.07, 1.0), metallic=0.1,
                         roughness=0.3, emission=PALETTE["cyan"], emission_strength=0.9))
    link(ringlight, col)

# machined hub the rings are seated on
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.34, depth=2.10, location=(0, 0, -1.55))
hub = bpy.context.object
hub.name = "Hub"
apply(hub, m_dark, shade_smooth=False)
bevel(hub, width=0.02, segments=3)
link(hub, col)
for i, r in enumerate((0.44, 0.40, 0.36)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=r, depth=0.07,
                                        location=(0, 0, -0.72 - i * 0.30))
    collar = bpy.context.object
    collar.name = "HubCollar_%d" % i
    apply(collar, m_steel, shade_smooth=False)
    bevel(collar, width=0.012, segments=2)
    link(collar, col)

studio_light(key_energy=1500.0, rim_energy=850.0, fill_energy=220.0,
             world_color=(0.006, 0.009, 0.013, 1.0), world_strength=0.30)
bpy.data.objects["RimLight"].location = (-6.4, 2.2, 0.9)
bpy.data.objects["RimLight"].rotation_euler = (math.radians(94), 0, math.radians(-118))
hide_for_render("BasePlate", "BaseRing", "Hub")
camera_framed((0.62, -0.74, 0.22), lens=70.0, margin=1.03,
              focus=("Ring", "Core", "Blade", "Channel"))
finish(SLUG)
