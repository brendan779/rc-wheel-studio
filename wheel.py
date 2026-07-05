#!/usr/bin/env python3
"""
Parametric RC plane wheel — two-part: PLA-Tough rim + TPU-95A tyre.

ONE script, ONE run, ALL files:
    python wheel.py                      -> smooth tyre
    python wheel.py --tread offroad      -> chevron-lug tyre
    python wheel.py --tread tarmac       -> ribbed + siped tyre
    python wheel.py --od 70 --width 16 --axle 5 --tread offroad

Each run writes three files (named after the size, e.g. D55xW12):
    Rim_D55xW12.stl            print in PLA-Tough
    Tyre_offroad_D55xW12.stl   print in TPU-95A
    Wheel_offroad_D55xW12.3mf  both parts as separate objects ->
                               open in your slicer and assign a
                               material to each part

Requires:  pip install build123d

Print notes:
    Rim  : PLA-Tough, 3-4 perimeters, 30-50% infill.
    Tyre : TPU-95A, 2 perimeters, 6-12% gyroid infill (lower = softer),
           0 top/bottom layers for a pneumatic feel.
"""

import argparse
import json
import math
import re
import zipfile
from dataclasses import dataclass, fields

# build123d is imported lazily inside the build functions so that
# tools which only need Params (e.g. wheel_gui.py) start instantly.
def _b3d():
    import build123d as b
    return b


def _spoke_outer_radius(hub_od, width):
    """Largest radius a flat-ended spoke/blade box can reach without its
    corners poking past the tyre bead seat (hub_od/2) — a flat end means
    the corners (at +/-width/2 off the centreline) sit farther out than
    the centreline itself, at sqrt(r^2 + (width/2)^2)."""
    return math.sqrt(max(0.0, (hub_od / 2 - 0.2) ** 2 - (width / 2) ** 2))


# ----------------------------------------------------------------
#  Parameters (all mm; override the main ones from the CLI)
# ----------------------------------------------------------------
@dataclass
class Params:
    # main dimensions
    tyre_od: float = 55.0     # tyre outer diameter
    width: float = 12.0       # wheel width
    hub_od: float = 30.0      # rim barrel diameter (tyre bead seat)
    flange_ext: float = 3.0   # flange diameter, as an offset added to hub_od
    axle_d: float = 4.0       # axle hole diameter

    # rim details
    flange_t: float = 1.5     # end-flange thickness
    barrel_wall: float = 2.0  # barrel wall thickness
    web_t: float = 2.0        # centre web thickness
    boss_wall: float = 2.5    # wall around the axle hole

    # rim style: "solid" | "holes" | "spoked" | "sport3"
    rim_style: str = "solid"
    spoke_count: int = 6      # spoked style
    spoke_w: float = 3.0      # spoke width (spoked style)
    blade_w: float = 7.0      # blade width (sport3 style)
    hole_count: int = 6       # lightening-holes style

    # print rim as two glued halves (avoids overhang/supports under thin
    # spokes/blades) instead of one piece
    split_rim: bool = False

    # tyre details
    shoulder_r: float = 3.0   # edge rounding radius
    tyre_fit: float = -0.3    # bore interference (negative = grip)
    pocket_clear: float = 0.4 # flange pocket clearance
    tread_depth: float = 1.8

    # offroad tread
    lug_count: int = 16
    lug_groove_w: float = 3.2
    chevron_ang: float = 25.0 # degrees, 0 = straight across

    # tarmac tread
    rib_grooves: int = 3
    rib_groove_w: float = 1.4
    sipe_count: int = 40
    sipe_w: float = 0.7
    sipe_depth: float = 0.8

    def check(self):
        assert self.flange_ext > 0, "flange_ext must be positive"
        assert self.hub_od - 2 * self.barrel_wall > self.axle_d + 2 * self.boss_wall, \
            "barrel too small for axle boss"
        assert self.tyre_od / 2 - (self.hub_od + self.flange_ext) / 2 > self.tread_depth + 1, \
            "tread deeper than tyre wall"
        boss_r = self.axle_d / 2 + self.boss_wall
        barrel_id = self.hub_od - 2 * self.barrel_wall
        if self.rim_style in ("spoked", "sport3"):
            width = self.spoke_w if self.rim_style == "spoked" else self.blade_w
            label = "spoke_w" if self.rim_style == "spoked" else "blade_w"
            assert width <= 2 * boss_r, f"{label} too wide for the hub boss"
            assert _spoke_outer_radius(self.hub_od, width) > barrel_id / 2 + 0.5, \
                f"{label} too wide to reach the barrel wall"


# ----------------------------------------------------------------
#  Rim (PLA-Tough)
# ----------------------------------------------------------------
def make_rim(p: Params):
    b = _b3d()
    MIN = (b.Align.CENTER, b.Align.CENTER, b.Align.MIN)
    Cylinder, Pos, Rot, Box = b.Cylinder, b.Pos, b.Rot, b.Box
    W = p.width
    barrel_id = p.hub_od - 2 * p.barrel_wall
    boss_r = p.axle_d / 2 + p.boss_wall

    flange_od = p.hub_od + p.flange_ext

    barrel = Cylinder(p.hub_od / 2, W, align=MIN) \
           - Cylinder(barrel_id / 2, W, align=MIN)
    flange_ring = Cylinder(flange_od / 2, p.flange_t, align=MIN) \
                - Cylinder(barrel_id / 2, p.flange_t, align=MIN)
    flanges = flange_ring + Pos(0, 0, W - p.flange_t) * flange_ring
    boss = Cylinder(boss_r, W, align=MIN)

    # ---- centre structure, per rim style ----
    def disc():
        return Pos(0, 0, W / 2 - p.web_t / 2) * \
               Cylinder(p.hub_od / 2, p.web_t, align=MIN)

    def hub_collar():
        # The boss spans the full width (so the axle is supported its whole
        # length) but the spoke/blade web is only web_t thick at the centre
        # — without this, the boss reads as a bare cylinder with a thin bar
        # sliced through it ("spokes clipping through the hub"). A short,
        # slightly larger-radius collar exactly at the web's height gives
        # the spokes a proper flange to root into, like a real hub flange.
        collar_r = boss_r + min(1.5, p.web_t)
        return Pos(0, 0, W / 2 - p.web_t / 2) * Cylinder(collar_r, p.web_t, align=MIN)

    def spokes(n, width):
        # Root the box at the rotation axis (not at the boss surface): a
        # box's inner end is flat, so a wide spoke rooted right at boss_r
        # has corners that land outside the round boss (sqrt(boss_r^2 +
        # (width/2)^2) > boss_r) and visibly pokes through it. Starting at
        # the centre guarantees every corner stays inside the boss as long
        # as width/2 <= boss_r, which check() now enforces.
        # The outer end is capped the same way: a flat-ended box reaching
        # all the way to hub_od/2 has corners that poke past it, radially
        # proud of the barrel's outer surface — exactly the surface the
        # tyre's bore grips. _spoke_outer_radius keeps those corners inside.
        outer_r = _spoke_outer_radius(p.hub_od, width)
        one = Pos(outer_r / 2, 0, W / 2) * Box(outer_r, width, p.web_t)
        out = None
        for i in range(n):
            s = Rot(0, 0, i * 360 / n) * one
            out = s if out is None else out + s
        return out

    if p.rim_style == "solid":
        centre = disc()
    elif p.rim_style == "holes":
        centre = disc()
        mid_r = (boss_r + barrel_id / 2) / 2       # hole circle radius
        hole_d = min(0.55 * (barrel_id / 2 - boss_r),
                     0.8 * 2 * mid_r * 3.14159 / p.hole_count)
        hole = Cylinder(hole_d / 2, W, align=MIN)
        for i in range(p.hole_count):
            centre -= Rot(0, 0, i * 360 / p.hole_count) * Pos(mid_r, 0, 0) * hole
    elif p.rim_style == "spoked":
        centre = spokes(p.spoke_count, p.spoke_w) + hub_collar()
    elif p.rim_style == "sport3":
        centre = spokes(3, p.blade_w) + hub_collar()
    else:
        raise ValueError(f"unknown rim_style: {p.rim_style}")

    rim = barrel + flanges + centre + boss
    rim -= Cylinder(p.axle_d / 2, W, align=MIN)   # axle bore
    rim.label = "Rim_PLA"
    return rim


def make_rim_halves(p: Params):
    """Split the rim into two halves at its mid-width so spoked/sport3
    styles print flat (cut face down) with no overhangs — the parting line
    runs through the thin centre web, exactly where a spoke/blade would
    otherwise need supports. No locating pins: a pin would have to
    protrude from the same face that needs to sit flat on the print bed,
    which isn't printable in that orientation. Both halves share the same
    axle bore, so threading the axle rod through during glue-up keeps them
    concentric and square without any printed alignment feature."""
    b = _b3d()
    MIN = (b.Align.CENTER, b.Align.CENTER, b.Align.MIN)
    Cylinder, Pos = b.Cylinder, b.Pos
    W = p.width
    rim = make_rim(p)

    big_r = (p.hub_od + p.flange_ext) / 2 + 5
    half_a = rim & Cylinder(big_r, W / 2, align=MIN)
    half_b = rim & (Pos(0, 0, W / 2) * Cylinder(big_r, W / 2, align=MIN))

    half_a.label = "Rim_A_PLA"
    half_b.label = "Rim_B_PLA"
    return half_a, half_b


# ----------------------------------------------------------------
#  Tyre (TPU-95A)
# ----------------------------------------------------------------
def make_tyre(p: Params, tread: str):
    b = _b3d()
    MIN = (b.Align.CENTER, b.Align.CENTER, b.Align.MIN)
    Cylinder, Pos, Rot, Box = b.Cylinder, b.Pos, b.Rot, b.Box
    GeomType, Plane = b.GeomType, b.Plane
    fillet, mirror = b.fillet, b.mirror
    R, W = p.tyre_od / 2, p.width
    bore_d = p.hub_od + p.tyre_fit
    pocket_d = p.hub_od + p.flange_ext + p.pocket_clear
    pocket_h = p.flange_t + p.pocket_clear / 2

    # body: cylinder with rounded outer edges
    body = Cylinder(R, W, align=MIN)
    circles = body.edges().filter_by(GeomType.CIRCLE)
    body = fillet(circles.filter_by(lambda e: abs(e.radius - R) < 1e-6), p.shoulder_r)

    # bore + flange pockets
    body -= Cylinder(bore_d / 2, W, align=MIN)
    body -= Cylinder(pocket_d / 2, pocket_h, align=MIN)
    body -= Pos(0, 0, W - pocket_h) * Cylinder(pocket_d / 2, pocket_h, align=MIN)

    cut_len = p.tread_depth + p.shoulder_r + 2  # radial reach of cutters

    if tread == "offroad":
        half = (Pos(R - p.tread_depth, 0, 0)
                * Rot(p.chevron_ang, 0, 0)
                * Pos(cut_len / 2, 0, W / 2 - 1)
                * Box(cut_len, p.lug_groove_w, W))
        groove = half + mirror(half, Plane.XY)          # V shape
        cutters = [Rot(0, 0, i * 360 / p.lug_count) * Pos(0, 0, W / 2) * groove
                   for i in range(p.lug_count)]
        for c in cutters:
            body -= c

    elif tread == "tarmac":
        # circumferential grooves
        ring = Cylinder(R + 2, p.rib_groove_w, align=MIN) \
             - Cylinder(R - p.tread_depth, p.rib_groove_w, align=MIN)
        for i in range(1, p.rib_grooves + 1):
            z = i * W / (p.rib_grooves + 1) - p.rib_groove_w / 2
            body -= Pos(0, 0, z) * ring
        # fine transverse sipes
        sipe = (Pos(R - p.sipe_depth + cut_len / 2, 0, W / 2)
                * Box(cut_len, p.sipe_w, W + 2))
        for i in range(p.sipe_count):
            body -= Rot(0, 0, i * 360 / p.sipe_count) * sipe

    elif tread != "smooth":
        raise ValueError(f"unknown tread: {tread}")

    body.label = "Tyre_TPU"
    return body


# ----------------------------------------------------------------
#  Helpers
# ----------------------------------------------------------------
def name_3mf_objects(path, names):
    """Add name attributes to the mesh objects in a 3MF so slicers
    show 'Rim_PLA' / 'Tyre_TPU' instead of 'Object 1 / 2'."""
    with zipfile.ZipFile(path) as z:
        entries = {n: z.read(n) for n in z.namelist()}
    model = [n for n in entries if n.endswith(".model")][0]
    xml = entries[model].decode()
    it = iter(names)
    xml = re.sub(r'<object (id="\d+" type="model")',
                 lambda m: '<object %s name="%s"' % (m.group(1), next(it, "")),
                 xml, count=len(names))
    entries[model] = xml.encode()
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for n, data in entries.items():
            z.writestr(n, data)


# ----------------------------------------------------------------
#  Generation (used by CLI and by wheel_gui.py)
# ----------------------------------------------------------------
def generate(p: Params, tread: str, outdir: str = ".", preview: bool = False):
    """Build rim + tyre and write the STLs (and, unless preview=True, the
    combined 3MF). preview=True uses a coarser tessellation tolerance and
    skips the 3MF for fast live-preview rebuilds; export always uses
    preview=False for full print quality.
    Returns the list of files written."""
    p.check()
    tag = f"D{p.tyre_od:g}xW{p.width:g}"
    rim_tag = tag if p.rim_style == "solid" else f"{p.rim_style}_{tag}"

    tyre = make_tyre(p, tread)
    tyre_f = f"{outdir}/Tyre_{tread}_{tag}.stl"

    b = _b3d()
    tol, ang_tol = (0.05, 0.3) if preview else (0.001, 0.1)
    b.export_stl(tyre, tyre_f, tolerance=tol, angular_tolerance=ang_tol)

    if p.split_rim:
        rim_a, rim_b = make_rim_halves(p)
        rim_a_f = f"{outdir}/Rim_{rim_tag}_A.stl"
        rim_b_f = f"{outdir}/Rim_{rim_tag}_B.stl"
        b.export_stl(rim_a, rim_a_f, tolerance=tol, angular_tolerance=ang_tol)
        b.export_stl(rim_b, rim_b_f, tolerance=tol, angular_tolerance=ang_tol)
        rim_files, rim_shapes, rim_names = [rim_a_f, rim_b_f], [rim_a, rim_b], ["Rim_A_PLA", "Rim_B_PLA"]
    else:
        rim = make_rim(p)
        rim_f = f"{outdir}/Rim_{rim_tag}.stl"
        b.export_stl(rim, rim_f, tolerance=tol, angular_tolerance=ang_tol)
        rim_files, rim_shapes, rim_names = [rim_f], [rim], ["Rim_PLA"]

    if preview:
        return rim_files + [tyre_f]

    both_f = f"{outdir}/Wheel_{tread}_{tag}.3mf"
    m = b.Mesher()
    for shape in rim_shapes:
        m.add_shape(shape)
    m.add_shape(tyre)
    m.write(both_f)
    name_3mf_objects(both_f, rim_names + ["Tyre_TPU"])
    return rim_files + [tyre_f, both_f]


# ----------------------------------------------------------------
#  Main
# ----------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tread", default=None,
                    choices=["smooth", "offroad", "tarmac"])
    ap.add_argument("--rim", default=None,
                    choices=["solid", "holes", "spoked", "sport3"],
                    help="rim centre style")
    ap.add_argument("--od", type=float, help="tyre outer diameter (mm)")
    ap.add_argument("--width", type=float, help="wheel width (mm)")
    ap.add_argument("--hub", type=float, help="rim barrel diameter (mm)")
    ap.add_argument("--flange", type=float, help="flange extension beyond hub Ø (mm)")
    ap.add_argument("--axle", type=float, help="axle hole diameter (mm)")
    ap.add_argument("--outdir", default=".", help="output folder")
    ap.add_argument("--preview", action="store_true",
                    help="fast STL-only mode (coarser mesh, no 3MF)")
    ap.add_argument("--split-rim", action="store_true",
                    help="print the rim as two glued halves (no supports "
                    "under spokes/blades)")
    ap.add_argument("--params-json", help="path to a JSON file of Params "
                    "field overrides (used by the desktop app for full "
                    "parametric control; CLI flags above win if both given)")
    a = ap.parse_args()

    p = Params()
    if a.params_json:
        with open(a.params_json) as f:
            overrides = json.load(f)
        valid = {f.name for f in fields(Params)}
        for key, value in overrides.items():
            if key in valid:
                setattr(p, key, value)
    if a.od:     p.tyre_od = a.od
    if a.width:  p.width = a.width
    if a.hub:    p.hub_od = a.hub
    if a.flange: p.flange_ext = a.flange
    if a.axle:   p.axle_d = a.axle
    if a.rim:    p.rim_style = a.rim
    if a.split_rim: p.split_rim = True
    tread = a.tread or "smooth"

    print(f"Building D{p.tyre_od:g}xW{p.width:g}, tread={tread}, rim={p.rim_style} ...")
    files = generate(p, tread, a.outdir, preview=a.preview)
    print("Wrote:")
    for f in files:
        print("  ", f)
    print("Open the .3mf in your slicer -> two objects -> "
          "assign PLA to the rim, TPU to the tyre.")


if __name__ == "__main__":
    main()
