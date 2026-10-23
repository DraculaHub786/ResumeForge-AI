# ResumeForge AI — Production‑Level Master Plan (BLUPRINT)

> A live, AI‑powered resume builder & editor. User‑first visual editor with a
> structured, ATS‑safe data model, multi‑format export (PDF / DOCX / PNG / LaTeX),
> real AI enhancement, and production‑grade deployability.

---

## 0. Vision & Goals

| Goal | Description |
|------|-------------|
| Live editing | WYSIWYG resume editor with **real‑time live preview** that updates on every keystroke. |
| AI‑assisted | AI rewrite/coach for every section (summary, experience, skills, projects, education). Built on **OpenRouter** with a local rule‑based fallback. |
| ATS‑safe export | **Selectable, tagged PDF** + DOCX. Export pipeline passes the copy‑paste‑into‑Notepad ATS test (single column, standard fonts, text layer). |
| Multi‑template | 12+ recruiter‑approved templates (2‑column, single‑column, executive, technical). Theme editor for colors/fonts. |
| Structured data | Resume stored as a typed, validated JSON document (shared Zod schema). |
| Production ready | Monorepo (pnpm + Turborepo), TypeScript strict, ESLint, Prettier, Docker, CI/CD, tests, observability hooks. |

---

## 1. Architecture Design

### 1.1 High‑Level Overview

```
            ┌─────────────────────────────────────────┐
            │  Browser (Next.js 16 App Router)        │
            │  ─ Editor UI (React 19)                 │
            │  ─ Live HTML preview (render-to-print)  │
            │  ─ Zustand resume store (local-first)   │
            │  ─ TanStack Query for server state      │
            │  ─ shadcn‑style UI component library    │
            └──────────────┬─────────────┬────────────┘
                           │ REST API    │           AI streaming (SSE)
            ┌──────────────▼─────────────▼────────────┐
            │  Server (Node 22 + Express + TS)        │
            │  ┌──────────────┐ ┌──────────────────┐  │
            │  │ Auth (Better │ │ DB (PostgreSQL   │  │
            │  │  Auth)       │ │  + Drizzle)      │  │
            │  └──────┬───────┘ └────────┬─────────┘  │
            │         │ Resume CRUD        │          │
            │         │        ┌───────────▼───────┐  │
            │         │        │ Export svc        │  │
            │         │        │ (pdf / docx / png/│  │
            │         │        │  latex)           │  │
            │  ┌──────▼──────┐ └─────────────┬─────┘  │
            │  │             │         ┌─────▼─────┐  │
            │  │ AI svc      │         │ OpenRouter│  │
            │  │ (prompts,   │         │ API       │  │
            │  │  streaming) │         └───────────┘  │
            │  └─────────────┘                        │
            └─────────────────────────────────────────┘
```

### 1.2 Key Principles

- **Monorepo** (pnpm workspaces + Turborepo). Single source of truth for types.
- **Shared types first**: `@resume-builder/types` exports the canonical Resume JSON
  schema, Zod parsers, and template definitions. The frontend validates against the
  same schema the backend enforces.
- **Runtime/edge boundaries**: `@resume-builder/pdf` exports distinct
  `@/pdf/browser` and `@/pdf/server` subpaths (mirrors Reactive Resume pattern).
- **Local‑first, cloud‑optional**: All editing data lives in Zustand + localStorage
  so the editor works offline; server persists on sign‑in.
- **Stateless API**: JWT/session auth via Better Auth; each resume is owned by a
  user; no session affinity required → horizontal scaling.
- **Typed API contracts**: shared `@resume-builder/types` used by both client and
  server. The web app consumes OpenAPI‑typed endpoints.

### 1.3 Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Monorepo | pnpm + Turborevo | Fast, disk‑efficient, cacheable pipelines |
| Backend | Node 22 LTS + Express + TypeScript | Mature, minimal, great DX |
| ORM | Drizzle ORM + PostgreSQL (dev: SQLite) | Type‑safe SQL, migrations, fast |
| Auth | Better Auth | Passkeys, OAuth, 2FA, sessionless JWT |
| Frontend | Next.js 16 App Router + React 19 | SSR/SSG + SPA editor hybrid |
| Styling | Tailwind CSS v4 + Radix UI + shadcn/ui | Consistent, accessible design system |
| State | Zustand (client) + TanStack Query (server) | Local resume state, async caching |
| Forms | React Hook Form + Zod | Type‑safe, performant forms |
| Drag/Drop | @dnd-kit/core | Section reordering |
| AI | OpenRouter API + `@resume-builder/ai` prompts package | State‑of‑the‑art models, streaming |
| PDF | `@react-pdf/renderer` (client) + Forme/lw‑pdf (server) | ATS‑safe selectable text |
| DOCX | `docx` npm lib | Editable Word output |
| PNG | html2canvas (client) | Shareable social image |
| i18n | next‑intl | Future‑proof localization |
| Testing | Vitest + React Testing Library + Playwright | Unit → e2e coverage |
| Lint/Format | ESLint (flat) + Prettier | Consistent code style |
| Container | Docker + docker‑compose | One‑click deploy |
| CI/CD | GitHub Actions | Auto lint/test/build on PR |
| Observability | Helmet + CORS + rate‑limit | Security headers, DoS protection |

---

## 2. System Design

### 2.1 Data Model — Resume JSON Schema

The resume is a single typed document. Stored in DB as JSON column (PostgreSQL
`jsonb`) and indexed by owner. Canonical shape:

```ts
interface Resume {
  id: string;            // UUID
  slug: string;          // URL slug
  userId: string;
  title: string;         // "My Software Engineer Resume"
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    template: string;    // template id
    theme: Theme;        // color + font config
    fontSize: number;
    lineHeight: number;
    pageMargin: number;
  };
  content: ResumeContent; // the actual resume
}

interface ResumeContent {
  profile: Personal;     // name, email, phone, location, links
  summary?: string;      // professional summary
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  // ... optional custom sections
  achievements?: string[];
  certifications?: CertificationItem[];
  publications?: PublicationItem[];
  awards?: string[];
  languages?: LanguageItem[];
  interests?: string[];
  customSections?: CustomSection[];
}
```

**Validation**: Every field is parsed/validated server‑side with a Zod schema in
`@resume-builder/types`. Invalid payloads are rejected with a 400 and a typed
error. This guarantees data integrity for export pipelines.

### 2.2 API Contract (REST + OpenAPI)

```
GET    /api/v1/health                     → health check
POST   /api/v1/auth/*                     → Better Auth (delegated)

GET    /api/v1/resumes                    → list user's resumes
POST   /api/v1/resumes                    → create new resume
GET    /api/v1/resumes/:id                → get resume
PATCH  /api/v1/resumes/:id                → partial update (autosave)
DELETE /api/v1/resumes/:id                → delete
GET    /api/v1/resumes/:id/export/pdf     → PDF stream
GET    /api/v1/resumes/:id/export/docx    → DOCX stream
GET    /api/v1/resumes/:id/export/png     → PNG stream
GET    /api/v1/resumes/:id/export/latex   → LaTeX source

POST   /api/v1/ai/enhance                 → enhance text (streamed, SSE)
POST   /api/v1/ai/rewrite-summary         → smart summary rewrite
POST   /api/v1/ai/achievement-generator   → generate bullets from job title
POST   /api/v1/ai/ats-check               → score & keyword analysis
```

**AI streaming**: Long‑running prompts are streamed back via `text/event-stream`
(Server‑Sent Events) so the UI shows tokens as they’re produced. The `@resume-builder/ai`
package owns the prompt templates (system + user). The backend wraps the OpenRouter
SDK, applies the shared prompt, and yields tokens. If no OpenRouter key is
configured, a deterministic rule‑based fallback (same as today’s simple enhancer)
keeps the feature working in local/dev.

### 2.3 Client Architecture

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # login, register, forgot
│   ├── (dashboard)/             # list, create resume cards
│   ├── (builder)/               # /builder/:id — the live editor
│   │   └── [id]/page.tsx
│   ├── api/                     # route handlers (SSR data)
│   └── layout.tsx               # root layout + providers
├── components/
│   ├── builder/                 # editor: SectionList, SectionEditor, Field, ...
│   ├── preview/                 # ATS‑safe print rendering components
│   ├── templates/               # template gallery + theme picker
│   ├── export/                  # ExportModal, format toggles
│   ├── ai/                      # AIEnhanceButton, ATSAnalyzer
│   └── ui/                      # shadcn primitives
├── stores/                      # Zustand: resumeBuilderStore
├── hooks/                       # useResume, useAutosave, useAI
├── lib/                         # api client, pdf, utils
├── i18n/
└── styles/
```

**Live preview**: The editor and preview share the **same React component tree**
(`ResumePreview`). The preview is mounted in an iframe‑free `<div class="page">`
with print CSS that mirrors the exported PDF layout. Because it's real React DOM,
"compile" is instantaneous — no LaTeX subprocess on the client. Server‑side LaTeX
remains available for power users via the export endpoint (the legacy feature).

**Autosave**: On every mutation, `useAutosave` debounces a PATCH to the server and
optimistically updates the local Zustand store. While offline, changes stay local
and sync on reconnection.

### 2.4 Export Pipeline

```
Editor (JSON resume)
   │
   ├── PDF  → @react-pdf/renderer (client)  → text‑based, ATS‑safe
   ├── DOCX → docx npm (client)              → editable Word
   ├── PNG  → html2canvas (client)          → social preview
   └── LaTeX→ generateLatexFromResume()      → source for pdflatex
```

- **PDF/DOCX/PNG** are generated **client‑side** from the live preview DOM/JSON so
  there is no Chromium dependency — fast, cheap, offline‑capable.
- **LaTeX** source is still emitted (keeps the legacy value proposition) and the
  backend can compile it to a real PDF if a user prefers LaTeX typesetting.

### 2.5 Security & Compliance

- All inputs validated via Zod (shared schema).
- CORS allowlisted; Helmet sets security headers.
- Rate limiting on auth + AI endpoints (prevent abuse of paid model calls).
- Auth sessions: httpOnly, SameSite=Strict cookies.
- GDPR‑ready: `DELETE /account` purges all user data; privacy policy endpoint.
- Secrets via environment variables only; `.env.example` documents every key.

### 2.6 Performance & Scaling

- Turborepo task pipeline caches: `build`, `lint`, `test` cached per package.
- Resume JSON is small (KB). Server reads/writes JSONB — no joins for editor.
- AI streaming keeps HTTP connections short; prompts are batched/optimized.
- Frontend uses RSC + Suspense + TanStack Query cache (no waterfalls).
- Static assets on CDN (Next.js Image optimization / Vercel Edge).

---

## 3. File / Folder Structure

```
resume-builder/
├── Todo.md                          # ← this blueprint
├── package.json                     # root workspace manifest
├── pnpm-workspace.yaml              # workspace globs
├── turbo.json                       # task pipeline + caching
├── tsconfig.json                    # base config (extends)
├── eslint.config.mjs                # flat ESLint config
├── prettier.config.js
├── .gitignore / .npmrc / .env.example
│
├── apps/
│   ├── web/                         # ── Next.js 16 frontend ──
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── package.json
│   │   ├── public/                  # favicon, og images
│   │   └── src/
│   │       ├── app/                 # App Router
│   │       │   ├── (auth)/
│   │       │   ├── (dashboard)/
│   │       │   ├── (builder)/[id]/
│   │       │   ├── layout.tsx
│   │       │   └── page.tsx
│   │       ├── components/
│   │       │   ├── builder/         # editor components
│   │       │   ├── preview/         # resume render tree
│   │       │   ├── templates/       # gallery
│   │       │   ├── export/
│   │       │   ├── ai/
│   │       │   └── ui/              # shadcn primitives
│   │       ├── stores/              # Zustand
│   │       ├── hooks/               # app hooks
│   │       ├── lib/                 # api client, utils
│   │       └── styles/
│   │
│   └── server/                      # ── Express backend ──
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts             # entry (http.listen)
│           ├── app.ts               # Express() + middleware
│           ├── config/              # env, logger
│           ├── auth/                # Better Auth config + routes
│           ├── db/
│           │   ├── schema.ts
│           │   ├── index.ts
│           │   └── migrations/
│           ├── modules/
│           │   ├── resumes/         # controller/service/routes
│           │   ├── exports/         # pdf/docx/png/latex services
│           │   └── ai/
│           │       ├── controller.ts
│           │       ├── openrouter.ts
│           │       ├── prompts.ts
│           │       ├── fallback.ts
│           │       └── routes.ts
│           ├── middleware/
│           └── utils/
│
├── packages/
│   ├── types/                       # ── shared types ──
│   │   ├── package.json
│   │   └── src/
│   │       ├── resume.ts            # Resume + ResumeContent interfaces
│   │       ├── schemas.ts           # Zod schemas + validation
│   │       ├── templates.ts         # template + theme definitions
│   │       ├── ai.ts                # AI prompt/result types
│   │       └── index.ts             # re-export
│   │
│   ├── ui/                          # ── shared React components ──
│   │   ├── package.json
│   │   └── src/
│   │       ├── components/          # Card, Modal, Button, FormField, ...
│   │       ├── hooks/               # useToast, useKeyboard
│   │       ├── lib/                 # helpers
│   │       └── index.ts
│   │
│   ├── ai/                          # ── AI integration ──
│   │   ├── package.json
│   │   └── src/
│   │       ├── client.ts            # OpenRouter SDK wrapper
│   │       ├── prompts.ts           # system/user prompt templates
│   │       ├── types.ts
│   │       └── index.ts
│   │
│   └── pdf/                         # ── dual-runtime PDF export ──
│       ├── package.json
│       └── src/
│           ├── browser.ts           # @react-pdf/renderer
│           ├── server.ts            # PDFKit / Forme
│           └── index.ts             # re-export per runtime tag
│
├── docker/
│   ├── Dockerfile.web               # multi-stage (nginx static)
│   ├── Dockerfile.server            # node:alpine
│   └── docker-compose.yml           # web + server + postgres
│
├── .github/workflows/
│   ├── ci.yml                       # lint, type-check, test
│   └── cd.yml                       # build + push on release
│
└── docs/
    ├── architecture.md              # expanded design notes
    └── api.md                       # API reference
```

---

## 4. Implementation Phases & Milestones

> Each phase produces a committable, buildable increment. The master list below is
> mirrored into the in‑code task tracker (`TodoWrite`) during implementation.

### Phase 0 — Foundation
- [x] Root monorepo (`pnpm-workspace.yaml`, root `package.json`, `turbo.json`)
- [x] TypeScript shared configs (`tsconfig/base.json`)
- [x] ESLint (flat) + Prettier + `.gitignore` + `.env.example`
- [x] `Todo.md` blueprint written

### Phase 1 — Shared Packages
- [x] `@resume-builder/types` — Resume schema, Zod parsers, templates
- [x] `@resume-builder/ui` — component primitives (shadcn/ui base)
- [x] `@resume-builder/ai` — OpenRouter client + prompt templates + fallback
- [x] `@resume-builder/pdf` — browser + server PDF export stubs

### Phase 2 — Backend (`apps/server`)
- [x] Express app + Helmet/CORS/rate-limit middleware
- [x] Drizzle ORM + schema (SQLite dev default, PostgreSQL production)
- [x] Better Auth routes (`/auth/*`)
- [x] Resume CRUD module (create/get/update/delete/list)
- [x] AI module (enhance/rewrite/ats-check) w/ streaming SSE
- [x] Export module (pdf, docx, png, latex)
- [x] Health check + error-handler + structured logger

### Phase 3 — Frontend (`apps/web`)
- [x] Root layout + providers (QueryClient, Zustand, Theme)
- [x] Auth pages (login/register) via Better Auth
- [x] Dashboard (list/create/delete resumes)
- [x] Live builder editor: sidebar sections + live preview
- [x] Field editors (personal, summary, experience, education, skills, projects, …)
- [x] Template gallery (12 templates) + theme editor
- [x] AI enhancement panel w/ streaming + fallback
- [x] Export modal (PDF/DOCX/PNG/LaTeX) with ATS preview
- [x] Real‑time autosave (debounce PATCH)

### Phase 4 — Testing
- [x] Vitest unit tests (types, schemas, prompts, latex generator)
- [x] React Testing Library component tests
- [x] Playwright E2E (auth → create → edit → export)

### Phase 5 — DevOps
- [x] Dockerfiles + `docker-compose.yml`
- [x] `.github/workflows/ci.yml` (lint, typecheck, test, build)
- [x] `.github/workflows/cd.yml` (Docker publish on release)

### Phase 6 — Polish & Release
- [x] i18n (next‑intl) scaffolding
- [x] SEO + OG image generation
- [x] Production smoke test (build → run → export PDF)
- [x] `package.json` `version` tagging for release

---

## 5. Definition of “Production Ready” (this build)

By completing Phases 0‑6 the project delivers:

1. ✅ A working monorepo that **builds and runs locally** with a single
   `pnpm dev`.
2. ✅ A structured resume editor with **live preview** and **12+ templates**.
3. ✅ **AI enhancement** via OpenRouter, with a working offline fallback.
4. ✅ **ATS‑safe** PDF/DOCX/LaTeX/PNG export.
5. ✅ **Auth** and per‑user resume persistence (SQLite out‑of‑the‑box;
   PostgreSQL via env).
6. ✅ **Tests** (unit + e2e) and **CI** that blocks on red.
7. ✅ **Docker** single‑node deployment.

> Extended features (real‑time collaboration, versioning, team workspaces,
> advanced analytics) are designed into the architecture but delivered as
> post‑MVP modules — see `docs/architecture.md`.

---

## 6. Reference Sources

- **Reactive Resume** — `reactive-resume/reactive-resume` (monorepo + PDF/DOCX
  dual‑runtime exports, Turborepo boundary enforcement).
- **Rezumerai** — `zomeru/rezumerai` (Next.js 16 App Router + embedded Elysia API,
  OpenRouter + pgvector, Better Auth, Prisma).
- ATS export checklist — copy‑paste‑into‑Notepad test for ATS compatibility
  (single‑column, standard fonts, selectable text).
