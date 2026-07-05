# RC Wheel Studio

A desktop app for designing two-part 3D-printable RC plane wheels: a rigid
**PLA-Tough rim** and a stretch-on **TPU-95A tyre**, with a live 3D preview
and one-click export to print-ready files.

Built for the ~4 kg RC plane class. Adjust dimensions with sliders, watch
the wheel rebuild in real time, pick a tread pattern and rim style, then
export STLs (and a combined 3MF for multi-material slicers) straight from
the app.

**macOS only**, currently source-build only (no prebuilt release yet).

## Features

- Full parametric control over ~25 dimensions: tyre/hub/flange diameters,
  wall thicknesses, axle bore, tyre fit, tread depth, and more
- **3 tread patterns**: smooth, offroad (chevron lugs), tarmac (ribs + sipes)
- **4 rim styles**: solid, lightening holes, spoked, 3-spoke sport
- **Split-rim printing**: print spoked/sport rims as two flat halves with
  no overhangs or supports, aligned with the axle rod during glue-up
- Live 3D viewport (Three.js) with assembled/exploded, section-cut, and
  wireframe views
- Inline validation — invalid dimension combinations are caught and
  explained before you try to export
- One-click export: `Rim_*.stl`, `Tyre_*.stl`, and a `Wheel_*.3mf` with the
  rim and tyre as separately named, colorable objects for multi-material
  slicers (Bambu Studio, PrusaSlicer, etc.)
- Presets, so you can save and return to known-good wheel sizes

## Repo layout

| Path | What it is |
|---|---|
| `wheel.py` | The geometry engine (Python, [build123d](https://github.com/gumyr/build123d)/OpenCascade). CLI + `generate()` API. This is the source of truth for all wheel geometry. |
| `wheel_gui.py` | An earlier tkinter GUI. Kept for reference; superseded by the Electron app. |
| `app/` | The Electron + TypeScript desktop app — the actual UI described above. |
| `CLAUDE.md` | Engine API reference, invariants, and conventions (written for AI-assisted development, but a good technical reference for anyone). |
| `DESIGN_BRIEF.md` | The original spec for the app's architecture and UI. |

## Requirements

- macOS (Apple Silicon)
- [Node.js](https://nodejs.org/) 18+ and npm
- A `python3` on your `PATH`. Check with `python3 --version` in Terminal —
  if that fails, install it via `xcode-select --install` (Xcode Command
  Line Tools) or from [python.org](https://www.python.org/downloads/).
  You do **not** need to install [build123d](https://github.com/gumyr/build123d)
  yourself — the app detects it's missing on first launch and installs it
  into a local virtual environment automatically. It only needs `python3`
  itself to already be there to build that environment from.

## Building and running

```bash
git clone https://github.com/brendan779/rc-wheel-studio.git
cd rc-wheel-studio

cd app
npm install
npm run dev          # launch in development mode
```

To build a standalone `.app` you can install locally, run this instead of
`npm run dev` (from the same `app/` directory):

```bash
npm run build:mac    # outputs app/dist/RC Wheel Studio-*.dmg and .zip
```

On first launch, if no working Python + build123d environment is found,
the app walks you through setting one up (creates a venv next to the repo
and installs build123d — takes a minute or two).

## Development

```bash
cd app
npm run lint
npm run typecheck
```

The engine (`wheel.py`) can also be run standalone:

```bash
python3 -m venv venv
venv/bin/pip install build123d
venv/bin/python wheel.py --tread offroad --rim spoked
```

## Design facts worth knowing

- Tyre grips the rim barrel with a small interference fit and snaps its
  internal pockets over the rim's end flanges.
- Rim prints in PLA-Tough (3–4 perimeters, 30–50% infill); tyre in TPU-95A
  (2 perimeters, 6–12% gyroid, 0 top/bottom layers for a pneumatic feel).
- The combined 3MF's two objects are named `Rim_PLA` and `Tyre_TPU` so
  slicers can assign materials automatically.
- Default geometry matches a proven reference wheel: D55×W12, hub Ø30,
  flange +3mm, axle Ø4, for a ~4kg plane.

## License

MIT — see [LICENSE](LICENSE).
