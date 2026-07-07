# Chess UI

Front-end for the egg-chess app — a skeleton built with **React**, **TypeScript**,
and **Vite**.

## Prerequisites

- Node.js 20+ (developed against Node 22)
- The [`egg-chess-service`](../egg-chess-service) running locally on port `8180`
  (optional — only needed for API calls such as login)

## Getting started

```bash
npm install
npm run dev
```

The dev server starts on http://localhost:5173. Requests to `/api/*` are proxied
to the service at `http://localhost:8180` (configured in [vite.config.ts](vite.config.ts)).

## Scripts

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR        |
| `npm run build`     | Type-check and produce a production build  |
| `npm run preview`   | Preview the production build locally       |
| `npm run typecheck` | Run the TypeScript compiler with no emit   |

## Configuration

Copy `.env.example` to `.env` and adjust as needed. `VITE_API_BASE_URL` overrides
the API base URL for production builds; leave it empty in development to use the
dev proxy.

## Project structure

```
src/
  api/          API client and typed service calls
  components/   Reusable UI (Layout, ChessBoard)
  pages/        Route-level views (Home, Play, Login, NotFound)
  App.tsx       Route definitions
  main.tsx      App entry point
```

This is a skeleton: the chess board renders a static starting position and the
login form posts to the service, but game logic and session handling are not yet
wired up.
