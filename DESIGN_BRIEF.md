# RC Wheel Studio — Design Brief

A polished desktop app for designing two-part RC plane wheels (PLA rim +
TPU tyre), replacing a functional-but-basic tkinter GUI. The user is a
hobbyist who wants to dial in dimensions visually, see a real 3D preview,
pick tread and rim styles, and export print-ready files.

## What the app does

The user adjusts wheel parameters and immediately sees the result as an
interactive 3D model. When happy, one click exports `Rim_*.stl`,
`Tyre_*.stl`, and a combined `Wheel_*.3mf` in which the two parts are named
objects (Rim_PLA / Tyre_TPU) so a multi-material slicer can assign filaments
directly.

## Architecture

- Electron + TypeScript + Vite. Renderer: Three.js viewport + UI (React or
  vanilla — implementer's choice, favour simplicity).
- Geometry: the existing Python engine `wheel.py` (build123d). The main
  process spawns it as a child process; the renderer never touches Node APIs
  (context isolation, typed IPC bridge in preload).
- Preview pipeline: on parameter change (debounced ~400 ms) → main process
  runs `generate()` into a temp dir → renderer loads the two STLs with
  Three.js STLLoader. Cache results keyed by a hash of (params, tread, rim
  style); cancel superseded in-flight builds. Builds take 3–15 s: show a
  subtle building indicator, never block interaction, keep showing the last
  good model until the new one lands.
- Add a `--preview` flag to wheel.py if needed: STL-only, no 3MF, and it may
  drop tarmac sipes/lower tessellation for speed. Full quality on export.
- Python discovery: look for `venv/` next to the app, then `python3` on
  PATH; verify `import build123d` at startup. If missing, show a friendly
  first-run setup screen that creates the venv and installs it, with
  progress.

## Layout

Three zones:

1. **Left sidebar (~300 px, scrollable)** — parameter groups as collapsible
   sections: Main (tyre Ø, width, hub Ø, flange Ø, axle Ø), Rim, Tyre fit,
   Tread details, Rim style details. Each parameter: label, slider +
   numeric field combo, mm unit shown. Sensible slider ranges (e.g. tyre Ø
   30–120 mm) but the numeric field accepts anything; engine validation
   errors appear inline in red under the offending group.
2. **Centre — 3D viewport** (the hero, gets all remaining space). Orbit /
   pan / zoom, soft studio lighting, subtle ground grid + contact shadow.
   Rim in orange (PLA), tyre in dark grey (TPU), slight roughness, no
   plasticky gloss. Toggle buttons floating top-right of the viewport:
   assembled / exploded view, section view (clip plane through the axle —
   great for checking the flange pockets), wireframe.
3. **Bottom bar** — big segmented pickers for **Tread** (Smooth / Offroad /
   Tarmac) and **Rim style** (Solid / Holes / Spoked / Sport-3), each with a
   tiny icon; output folder picker; primary **Export** button with progress
   and a "Reveal in Finder" link when done.

Presets: a dropdown in the sidebar header with a few built-ins (55×12
trainer default, plus room for user-saved presets stored in app data as
JSON). Save/load included in v1 if cheap, else v1.1.

## Visual design

- Dark theme: near-black background (#141517), light text, one accent
  colour used sparingly (suggest the PLA orange, #f4a259, for the export
  button and active states). Viewport background a very dark gradient so
  the orange/grey model pops.
- Typography: system font stack, clear hierarchy — group titles small caps,
  values monospaced.
- Feels like a small pro tool (think a focused slice of a slicer app), not
  a settings dialog. Generous viewport, quiet chrome, no decoration that
  competes with the model.
- Window: min 1100×720, remember size/position.

## Milestones

1. **Skeleton** — electron-vite TS scaffold, IPC bridge, engine runs and
   returns file paths, hardcoded params, STLs visible in viewport.
2. **Parameters** — full sidebar bound to Params, debounce + cache + cancel,
   validation surfaced inline.
3. **Viewport polish** — materials, lighting, exploded/section/wireframe
   toggles, smooth model swap (no flicker).
4. **Export + presets** — output folder, export with progress, presets.
5. **Packaging** — electron-builder for macOS (arm64), first-run Python
   setup flow, app icon.

## Acceptance criteria

- Changing any parameter updates the preview without freezing the UI.
- Invalid combos (e.g. flange ≤ hub) show a readable inline message; the
  app never crashes on input.
- Export produces the three files; the 3MF opens in Bambu Studio /
  PrusaSlicer as two named objects.
- All 3 treads × 4 rim styles preview and export correctly.
- Cold start to interactive preview < 10 s on Apple Silicon.

## Out of scope (v1)

- In-app slicing, printing, or filament profiles.
- Editing the geometry engine's design (treads/styles beyond the existing
  3 × 4).
- Windows/Linux packaging (keep the code portable, but ship macOS first).
