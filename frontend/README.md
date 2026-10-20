# Robo Rally Frontend

Frontend for the Robo Rally web project, built with React, TypeScript, Vite, and Tailwind CSS.

## Run Locally

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server starts at:

```text
http://localhost:5173
```

## Scripts

Run these commands from the `frontend` folder.

- `npm run dev` - start the development server
- `npm run build` - type-check and build for production
- `npm run preview` - preview the production build
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode
- `npm run lint` - run Oxlint
- `npm run format` - format with Prettier
- `npm run check` - run format check, lint, tests, and build

## Project Structure

```text
frontend/
  public/                 Static files
  src/
    assets/               Images
    features/             Page features
    foundation/           Basic reusable UI
    shared/               Shared components
    tests/                Test setup and unit tests
    App.tsx               Main app component
    main.ts               React entry point
```

## Board layout components

`MapLayout` renders a supplied arrangement of board blocks independently of the current live backend map:

```tsx
import { MapLayout } from './features/game/components/map/MapLayout';
import { defaultMapLayout } from './features/game/data/mapLayouts';

<MapLayout layout={defaultMapLayout} />;
```

Each entry in `layout.boards` has a unique `id`, a `kind` (`start` or `game`), integer `x`/`y` placement, a clockwise `rotation` (`0`, `90`, `180`, or `270`), and local `tiles`. Placement is the top-left of the rotated block; tile coordinates describe the original, unrotated block. Negative placement coordinates are supported.

A layout needs exactly one 3 × 10 start board and at least one 10 × 10 game board. The start exit faces right before rotation. Boards must connect through tile edges without overlap; only the exit edge may touch game boards. Connections can cover as little as one tile. Blank positions inside boards become floor tiles; space outside boards remains empty.

`validateMapLayout` in `features/game/data/boardGeometry.ts` returns validation messages. `MapLayout` displays an accessible error for invalid layouts. `offsetMapLayout` demonstrates rotated and offset boards. These examples use illustrative tile contents, not official course reproductions. The live game still renders the existing backend grid through `TileGrid`; no backend migration or editor is included.
