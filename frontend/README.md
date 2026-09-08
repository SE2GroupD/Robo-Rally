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
