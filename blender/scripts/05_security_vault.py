"""Security vault — layered protection shells, door ring, verification lattice."""
import bpy, math, sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dcx_common import *  # noqa

SLUG = "security_vault"
reset_scene()
col = new_collection("SecurityVault")

m_body = mat("DCX_VaultBody", (0.055, 0.060, 0.068, 1.0), metallic=1.0, roughness=0.34)
m_steel = mat("DCX_VaultSteel", PALETTE["steel"], metallic=1.0, roughness=0.18)
m_dark = mat("DCX_VaultDark", (0.020, 0.023, 0.028, 1.0), metallic=0.9, roughness=0.48)
m_seal = mat("DCX_Seal", (0.02, 0.09, 0.12, 1.0), metallic=0.1, roughness=0.22,
             emission=(0.05, 0.46, 0.58, 1.0), emission_strength=1.5)
m_ok = mat("DCX_Verified", (0.02, 0.10, 0.06, 1.0), metallic=0.1, roughness=0.22,
           emission=PALETTE["green"], emission_strength=2.0)
m_hold = mat("DCX_Hold", (0.12, 0.08, 0.02, 1.0), metallic=0.1, roughness=0.22,
             emission=PALETTE["amber"], emission_strength=1.6)
m_glass = mat("DCX_VaultGlass", (0.02, 0.03, 0.04, 1.0), metallic=0.0, roughness=0.06,
              alpha=0.22, transmission=0.85)

# ---- Vault door: concentric machined discs -------------------------------
DISCS = [(2.05, 0.34, m_body), (1.66, 0.40, m_dark), (1.24, 0.46, m_body), (0.78, 0.52, m_steel)]
for i, (r, d, material) in enumerate(DISCS):
    bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=r, depth=d,
                                        location=(0, 0, i * 0.05),
                                        rotation=(math.radians(90), 0, 0))
    disc = bpy.context.object
    disc.name = "VaultDisc_%d" % i
    apply(disc, material, shade_smooth=False)
    bevel(disc, width=0.018, segments=3)
    link(disc, col)

# ---- Protection layer rings (account / encryption / withdrawal) ----------
LAYERS = [(2.42, m_seal, "Encryption"), (2.72, m_ok, "AccountShield"), (3.02, m_hold, "Withdrawal")]
for r, material, label in LAYERS:
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.020,
                                     major_segments=192, minor_segments=8,
                                     location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
    ring = bpy.context.object
    ring.name = "Layer_" + label
    apply(ring, material)
    link(ring, col)

    # segmented armour plates riding each layer
    segments = 16
    for i in range(segments):
        a = (i / segments) * math.tau
        bpy.ops.mesh.primitive_cube_add(size=1.0,
                                        location=(math.cos(a) * r, 0.0, math.sin(a) * r),
                                        rotation=(0, -a, 0))
        plate = bpy.context.object
        plate.name = "Plate_%s_%02d" % (label, i)
        plate.scale = (0.055, 0.16, 0.30)
        apply(plate, m_dark, shade_smooth=False)
        bevel(plate, width=0.008, segments=2)
        link(plate, col)

# ---- Locking bolts radiating from the door -------------------------------
for i in range(8):
    a = (i / 8) * math.tau + math.radians(22)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.075, depth=1.10,
                                        location=(math.cos(a) * 1.85, 0.10, math.sin(a) * 1.85),
                                        rotation=(0, math.radians(90) - a, 0))
    bolt = bpy.context.object
    bolt.name = "Bolt_%02d" % i
    apply(bolt, m_steel, shade_smooth=False)
    bevel(bolt, width=0.010, segments=2)
    link(bolt, col)

# ---- Central seal + spokes -----------------------------------------------
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.30, depth=0.62,
                                    location=(0, -0.10, 0), rotation=(math.radians(90), 0, 0))
hub = bpy.context.object
hub.name = "SealHub"
apply(hub, m_seal, shade_smooth=False)
bevel(hub, width=0.014, segments=3)
link(hub, col)

for i in range(6):
    a = (i / 6) * math.tau
    bpy.ops.mesh.primitive_cube_add(size=1.0,
                                    location=(math.cos(a) * 0.50, -0.30, math.sin(a) * 0.50),
                                    rotation=(0, -a, 0))
    spoke = bpy.context.object
    spoke.name = "Spoke_%02d" % i
    spoke.scale = (0.44, 0.075, 0.055)
    apply(spoke, m_steel, shade_smooth=False)
    bevel(spoke, width=0.008, segments=2)
    link(spoke, col)

# ---- Verification lattice floating in front of the door ------------------
for i in range(5):
    for j in range(5):
        if (i + j) % 2:
            continue
        bpy.ops.mesh.primitive_cube_add(
            size=1.0, location=(-1.6 + i * 0.80, -1.55, -1.6 + j * 0.80))
        cell = bpy.context.object
        cell.name = "Verify_%d%d" % (i, j)
        cell.scale = (0.13, 0.020, 0.13)
        apply(cell, m_ok if (i * j) % 3 else m_seal, shade_smooth=False)
        link(cell, col)

# ---- Chamber housing ------------------------------------------------------
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=3.35, depth=1.9,
                                    location=(0, 1.05, 0), rotation=(math.radians(90), 0, 0))
housing = bpy.context.object
housing.name = "Chamber"
apply(housing, m_dark, shade_smooth=False)
sol = housing.modifiers.new("Shell", "SOLIDIFY")
sol.thickness = 0.06
link(housing, col)

studio_light(key_energy=1300.0, rim_energy=900.0, fill_energy=200.0,
             world_color=(0.006, 0.008, 0.012, 1.0), world_strength=0.26)
bpy.data.objects["KeyLight"].location = (4.2, -5.6, 4.0)
bpy.data.objects["RimLight"].location = (-5.4, -1.4, 1.6)
hide_for_render("Chamber")
camera_framed((0.26, -0.95, 0.14), lens=62.0, margin=1.02)
finish(SLUG)
