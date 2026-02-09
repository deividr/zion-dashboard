# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zion Dashboard is an ERP/CRM system for LaBuonapasta (Italian food business). It manages customers, products, orders, and delivery logistics. The frontend is a Next.js 15 App Router application that communicates with a separate backend API (`NEXT_PUBLIC_HOST_API`).

**Language**: The project uses Portuguese (pt-BR) for UI text, comments, and commit messages.

## Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint (next lint)
pnpm dev:docker       # Dev with Docker (http://localhost:3001)
pnpm commit           # Conventional commit via git-cz
```

Add shadcn/ui components:
```bash
pnpm dlx shadcn@latest add <component-name>
```

No test framework is configured.

## Architecture

### Stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (new-york style, zinc base color, CSS variables)
- **Zustand** for global state, **React Hook Form** + **Zod** for forms
- **Clerk** for authentication (middleware in `src/middleware.ts`)
- **TanStack Table** for data tables
- **date-fns** for date handling, **Lucide React** for icons

### Key Architecture Patterns

**API Communication**: All authenticated API calls go through `useFetchClient()` hook (`src/lib/fetch-client.ts`), which wraps fetch with Clerk JWT tokens and automatic error toasts. The backend URL comes from `src/env.ts` (`API_URL`).

**Repository Pattern**: API endpoint URLs are defined in `src/repository/*Repository.ts` files (e.g., `customerEndpoints.list(page, search)`). These are URL builders, not data-fetching abstractions.

**Domain Schemas**: Zod schemas and inferred TypeScript types live in `src/domains/`. All are re-exported from `src/domains/index.ts`. Every form uses `zodResolver` with these schemas.

**Page Structure**: List pages follow: `src/app/<entity>/page.tsx` (list + search + pagination) + `columns.tsx` (TanStack column defs). Detail/edit pages: `src/app/<entity>/[id]/page.tsx` with form components.

**UI Components**: shadcn/ui components are in `src/components/ui/` with a barrel export at `src/components/ui/index.ts`. Import from `@/components/ui` (barrel), not individual files. Custom shared components (DataTable, FullPagination, Combobox, etc.) are in `src/components/`.

**Global State**: Single Zustand store (`src/stores/header-store.ts`) manages breadcrumb titles via `useHeaderStore`. Pages call `setTitle(["Section", "Page"])` on mount.

**Layout**: Root layout (`src/app/layout.tsx`) conditionally renders sidebar + header when authenticated. Sidebar state persists via cookie.

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Conventions

- **Files**: kebab-case (`customer-form.tsx`). **Components**: PascalCase. **Hooks**: `use*`. **Stores**: `*Store`.
- Use `"use client"` only when needed (state, events, browser APIs). Prefer Server Components.
- Use CSS variables for colors (`bg-primary`, not `bg-blue-500`). Use `cn()` from `@/lib/utils` for conditional classes.
- Never modify files in `src/components/ui/` directly — use shadcn CLI to add/update.
- Pagination default: 10 items per page.
- Currency values are stored in centavos (integer). Use `formatCurrency()` from `src/lib/utils.ts` for display.
- Phone and CEP formatting utilities are in `src/lib/utils.ts` (`formatPhone`, `formatCep`, `fetchCepData`).
- Distance calculation uses Google Routes API via `calculateDistanceFromStore()` in `src/lib/utils.ts`.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_HOST_API=http://localhost:8000/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...  # for distance calculation
```

## Deployment

Production deploys to **Fly.io** (region: gig/Brazil). Docker build uses standalone output mode. Config in `fly.toml` and `Dockerfile`.
