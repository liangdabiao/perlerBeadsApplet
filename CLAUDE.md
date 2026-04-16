# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Perler Bead Pixel Art mini-program (拼豆像素画小程序) — a creative tool for designing pixel-style bead patterns on mobile. Users draw on a grid, manage artworks, and browse templates. Built with Taro 4 + Vue 3 + TypeScript, primarily targeting WeChat mini-programs.

## Commands

```bash
# Install dependencies (pnpm preferred)
pnpm install

# Development (WeChat mini-program with watch mode)
npm run dev:weapp

# Production build (auto-bumps version)
npm run build:weapp

# Other platforms: dev:alipay, dev:swan, dev:tt, dev:qq, dev:h5

# Lint
npx eslint src/
npx stylelint "src/**/*.scss"
```

After building, open the project root in WeChat Developer Tools. The `appid` in `project.config.json` must be set to your own AppID.

## Architecture

### Framework & Tooling
- **Taro 4.1.11** cross-platform framework with **Vite 4** compiler
- **Vue 3** Composition API with **Pinia** state management
- **Sass** for styles, **TypeScript** throughout
- Path alias: `@/` maps to `src/`, `@components/` maps to `src/components/`

### Page Routing (`src/app.config.ts`)
Pages: `editor` (pixel art editor), `profile` (artwork gallery), `home` (templates, currently commented out), `saveForm`, `settings`, `detail`, `debug`. Custom tab bar with two tabs: profile and editor.

### State Management (`src/stores/`)
- `editorTemp` — temporary editor state (grid data, tool selections)
- `user` — user authentication and profile data

### Key Utilities (`src/utils/`)
- `pixelArt.ts` — core pixel art logic (grid manipulation, color operations)
- `request/` — API service factory with typed REST service generators, interceptors
- `storage.ts` — local storage wrappers
- `base64.ts`, `filedata.ts` — file encoding utilities

### Components
- `MIcon` — Material Design Icons wrapper component

## Conventions
- Design width is 750px with automatic px-to-rpx transformation via Taro's postcss plugin
- Version is auto-incremented by `scripts/bump-version.js` during production builds
- Output goes to `dist/` directory
- The UI language is Chinese
