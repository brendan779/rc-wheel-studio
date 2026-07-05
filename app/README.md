# RC Wheel Studio (app/)

The Electron + TypeScript desktop app. See the [repo root README](../README.md)
for what this app does; this file just covers the dev commands.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build (macOS)

```bash
npm run build:mac
```

Outputs a `.dmg` and `.zip` to `dist/`. Windows/Linux targets aren't
currently configured in `electron-builder.yml` — this app is macOS-only
for now.
