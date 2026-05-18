# growth-tracker-react

A minimal React + TypeScript + Vite starter, preconfigured with Tailwind CSS v4, shadcn/ui, the React Compiler, ESLint, and Prettier.

## Stack

- **React 19** with [React Compiler](https://react.dev/learn/react-compiler) enabled via `babel-plugin-react-compiler`
- **TypeScript**
- **Vite** for dev server and build
- **Tailwind CSS v4** via the official `@tailwindcss/vite` plugin
- **shadcn/ui** initialized with the `@/` path alias; components live in `src/components/ui`
- **React Router v7** (`react-router-dom`) with `BrowserRouter` wrapping the app and routes defined in `App.tsx`
- **ESLint** (flat config) with `typescript-eslint`, `react-hooks`, and `react-refresh`
- **Prettier** with format-on-save (semicolons + single quotes)

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Project layout

```
src/
  App.tsx              # root component, defines <Routes>
  main.tsx             # entry, mounts <App /> inside <BrowserRouter>
  index.css            # Tailwind entry + shadcn theme tokens
  pages/               # route-level components (Home, Login, Signup)
  components/ui/       # shadcn components (e.g. button.tsx)
  lib/utils.ts         # cn() helper used by shadcn components
public/
  favicon.svg
```

## Tailwind

Tailwind v4 is loaded via `@import "tailwindcss"` in `src/index.css` and the `tailwindcss()` plugin in `vite.config.ts`. Use utility classes directly in JSX — no `tailwind.config.js` is required.

## shadcn/ui

shadcn is wired up via `components.json`, with the `@/*` alias pointing to `src/*` (configured in `tsconfig.json`, `tsconfig.app.json`, and `vite.config.ts`).

Add a component:

```bash
npx shadcn@latest add button
```

Then import from the alias:

```tsx
import { Button } from '@/components/ui/button';
```

## Routing

React Router v7 is wired in `src/main.tsx` (`<BrowserRouter>` wraps `<App />`) and routes are declared in `src/App.tsx`. Page components live in `src/pages/` and are imported via the `@/pages/*` alias.

Add a route by creating a component under `src/pages/` and registering it:

```tsx
<Route path="/dashboard" element={<Dashboard />} />
```

## Formatting

Prettier is configured in `.prettierrc.json` (`semi: true`, `singleQuote: true`). VS Code is set to format on save via `.vscode/settings.json` — install the **Prettier - Code formatter** (`esbenp.prettier-vscode`) extension to enable it.

---


## Learner Guides

Implementation guides for each feature live in [`packages/docs/`](../docs/):

| Guide | Description |
|---|---|
| [`signup-form.md`](../docs/signup-form.md) | Signup form — 8 form patterns with explanations |
