# NeuroVault

Enterprise AI memory infrastructure landing page — a marketing site showcasing decentralized intelligence and persistent cognitive storage features.

## Run & Operate
- `npm run dev` — start development server (Express + Vite, port 5000)
- `npm run build` — production build via `script/build.ts`
- `npm run start` — serve production build
- `npm run check` — TypeScript type check
- `npm run db:push` — push Drizzle schema to Postgres

Required env vars: `DATABASE_URL` (Postgres, provided by Replit)

## Stack
- **Runtime**: Node.js 20, TypeScript 5.6
- **Frontend**: React 18, Vite 7, Wouter, TanStack Query, Tailwind CSS 3, Radix UI (shadcn/ui-style), Framer Motion
- **Backend**: Express 5
- **ORM**: Drizzle ORM + `pg` (Postgres)
- **Build**: `tsx` + `esbuild` via custom `script/build.ts`

## Where things live
- `server/` — Express server, routes, static serving, Vite dev middleware
- `client/src/pages/` — page components and landing section components
- `client/src/components/ui/` — reusable Radix-based UI primitives
- `client/src/lib/` — React Query client, utilities
- `shared/schema.ts` — Drizzle + Zod schema (source of truth for DB)
- `vite.config.ts` — Vite config with Replit plugins

## Architecture decisions
- Express serves both the API (`/api/*`) and the client (SPA fallback) on a single port (5000)
- In development, Vite runs as middleware inside Express; in production, static files from `dist/public` are served
- Storage is in-memory (`MemStorage`) for the user entity — Drizzle/Postgres schema exists but routes aren't wired to it yet
- Replit-specific Vite plugins (`cartographer`, `dev-banner`, `runtime-error-modal`) are conditionally loaded

## Product
- Marketing landing page (`/`) with smooth-scroll nav and CTAs into the app
- Authenticated app pages (mock data, no real auth wired yet):
  - `/auth`, `/login`, `/signup` — sign-in / sign-up with OAuth buttons
  - `/dashboard` — workspace overview, stats, recent runs, top agents
  - `/agents/new` — 4-step agent creation wizard
  - `/marketplace` — agent catalog with category filter + search
  - `/memory` — memory clusters, semantic search, eviction
  - `/copilot` — chat-style AI copilot with suggestions
  - `/integrations` — toggleable integration grid (Slack, GitHub, Stripe, …)
  - `/billing` — usage breakdown, payment methods, invoices
  - `/privacy` — security toggles, API keys, sessions, audit log
  - `/admin` — member management, system health, workspace settings
- Shared `DashboardLayout` (sidebar + topbar) wraps all app pages
- Backend scaffolding with user schema ready for future feature expansion

## User preferences
_Populate as you build_

## Gotchas
- The Vite cartographer plugin logs a harmless warning about `tailwind.config.ts` using CommonJS `module` — this does not affect the app
- `@assets` alias resolves to `attached_assets/` for local image references

## Pointers
- Replit workflows skill: `.local/skills/workflows`
- Environment secrets skill: `.local/skills/environment-secrets`
- Database skill: `.local/skills/database`
