# RC Wheel Studio

Desktop app (Electron + TypeScript) for designing two-part 3D-printable RC
plane wheels: a rigid rim (PLA-Tough) and a stretch-on tyre (TPU-95A).
The geometry engine already exists and is finished — `wheel.py` (Python,
build123d/OCCT). **Do not rewrite the geometry in TypeScript.** The app is a
UI shell: parameter controls, live 3D preview, export.

## Repo layout

- `wheel.py` — geometry engine. Finished and verified. Treat as read-only
  unless a task explicitly concerns geometry.
- `wheel_gui.py` — old tkinter GUI. Reference only; superseded by this app.
- `DESIGN_BRIEF.md` — the app spec: features, architecture, UI design,
  milestones. Read it before starting any feature work.
- `app/` — the Electron app (to be created).

## Engine API (wheel.py)

```python
from wheel import Params, generate
p = Params()               # dataclass, all dimensions in mm
p.tyre_od = 70             # see Params definition for all ~25 fields
p.rim_style = "spoked"     # "solid" | "holes" | "spoked" | "sport3"
files = generate(p, tread="offroad", outdir="/tmp/out")
# tread: "smooth" | "offroad" | "tarmac"
# returns [Rim_*.stl, Tyre_<tread>_*.stl, Wheel_<tread>_*.3mf]
```

CLI equivalent: `python3 wheel.py --tread offroad --rim spoked --od 70
--width 16 --axle 5 --hub 38 --flange 4 --outdir /tmp/out`
(`--flange` is an offset added to `--hub`, not an absolute diameter — see
`flange_ext` below)

- `Params.check()` raises `AssertionError` with a human-readable message for
  invalid combinations — surface these in the UI, don't crash.
- `import wheel` is instant; build123d loads lazily on first `generate()`
  (~2 s) and each generate takes ~3–15 s. Always run it off the UI thread.
- The 3MF contains two named objects (`Rim_PLA`, `Tyre_TPU`) so slicers can
  assign a material per part. Don't break `name_3mf_objects()`.

## Engine invariants (hard-won, keep intact)

- Tyre bore = `hub_od + tyre_fit` (default −0.3 mm interference so TPU grips).
- Tyre has internal pockets that snap over the rim flanges
  (`hub_od + flange_ext + pocket_clear`).
- Rim end flanges are rings, not discs — avoids trapped-air cavities.
- Default geometry matches a proven reference wheel: D55×W12, hub Ø30,
  flange Ø33, axle Ø4, for a ~4 kg plane.

## Dev environment

- Python deps: `python3 -m venv venv && venv/bin/pip install build123d`.
  The app must locate a working Python; see DESIGN_BRIEF for strategy.
- Sanity-check the engine: `venv/bin/python wheel.py --tread smooth` should
  write three files.

## Conventions

- TypeScript strict mode; no `any` unless unavoidable.
- Electron: context isolation on, no `nodeIntegration` in the renderer; all
  engine calls go through a typed IPC bridge in `preload`.
- Three.js for the viewport (STL loading, orbit controls).
- Keep engine subprocess calls cancellable — a newer preview request
  supersedes an in-flight one.

## Verification

- After engine-related changes: build all 3 treads × 4 rim styles (12 combos)
  and check each STL is non-empty and manifold.
- After UI changes: `npm run lint && npm run typecheck`.
- Manual smoke test: change tyre OD → preview updates; invalid input (e.g.
  spoke width too wide for the hub boss) → inline error, no crash; export
  writes 3 files (4 with split-rim enabled).
