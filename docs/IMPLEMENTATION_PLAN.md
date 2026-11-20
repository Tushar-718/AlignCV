# AlignCV — Implementation Plan

> **AlignCV** — align your CV to every role.
> **Owner:** you (React Native → Full Stack developer)
> **Last updated:** 2026-11-20 (v2: JWT auth, base → tailored resume model)
> **Status:** Planning complete → Phase 0 (setup) next
> **Live URL (planned):** `https://aligncv.vercel.app` (check availability) — this link goes on my resume, so it **must always work**.

---

## 0. How to use this document

- This file is the **single source of truth** for AlignCV. Read it at the start of every work session (human or AI).
- Any change in scope, stack or architecture **must** be recorded in [§3 Decision Log](#3-decision-log) with the reason. Superseded decisions stay in the log (marked ⛔) so history is preserved.
- If a task conflicts with this document, **this document wins** until it is consciously updated.
- AI assistants: never introduce a new service, a library with a paid tier, or a feature outside the current phase without flagging it first.

---

## 1. Golden Rules (non-negotiable)

1. **$0 development cost and $0 deployment cost. Always.**
   - No service that requires a credit card to function.
   - No feature whose normal use can create a bill (pay-as-you-go traps included).
   - Every external service is listed in [§5](#5-free-tier-budget--limits) with its limits.
2. **The live demo must always work.** It is linked on my resume. A recruiter must be able to see the core feature in under 60 seconds, without signing up, even if AI free tiers are exhausted (see [§13 Recruiter-Proof Deployment](#13-recruiter-proof-deployment)).
3. **Ship early.** Phase 1 (MVP) is deployed before anything from Phase 2 starts.
4. **Scope discipline.** New ideas go to [§16 Future Scope](#16-future-scope-parking-lot), not into the current phase.
5. **AI never fabricates.** It may rephrase and surface the user's _real_ experience. It never invents skills, employers, dates or metrics. Every change is accepted or rejected by the user, one at a time.
6. **Scores are computed by code, not by an LLM.** Reproducible and explainable.
7. **Privacy first.** Uploaded files are never stored. Resume text is never logged.
8. **Production-grade habits:** migrations, typed validation, tests on core logic, CI, error handling, structured logs.

---

## 2. Product

### Core concept: base resume → tailored resume

- **Base resume** = the user's master resume (e.g. "Full Stack Resume"), uploaded once, editable anytime as their career changes. A user can have a few (e.g. Full Stack, Mobile).
- **Tailored resume** = a version of a base resume optimized for one target (a role or a specific job description). Created by the optimizer. Saved only if the user chooses to.
- **Visual templates/themes are NOT in scope** — one clean, ATS-friendly PDF layout. Themes are future scope (§16).

### Main user flow (the optimizer)

1. User uploads a **base resume** (PDF; images in Phase 2) → AI parses it to JSON → user reviews/corrects → saved.
2. User opens **Resume Optimizer** and chooses a target:
   - **a role from a dropdown** (Frontend, Backend, Full Stack, React Native, …), **or**
   - **pastes a job description** (e.g. a company's Frontend role).
3. AlignCV **automatically picks the best-matching base resume** (highest score against the target). The user can switch it. No base resume yet → prompt to upload one.
4. AlignCV shows the **ATS score** and **fitness score**, plus a list of **AI suggestions**.
5. The user goes through suggestions **one by one: Accept / Reject / Edit-then-accept** (and can undo).
6. A **side-by-side view** (base on the left, tailored on the right with changes highlighted) updates **instantly** after each decision; the tailored JSON and both scores update live.
7. When done, two actions:
   - **Save** → stores the tailored resume in the DB (re-verified server-side).
   - **Download** → generates the PDF in the browser and downloads it **immediately** (no save required).

### Personal goals

- Portfolio piece proving **backend** skills: Node.js, Postgres, migrations, Redis, BullMQ, Docker, JWT auth, OAuth, RBAC, CI.
- Practical **AI integration**: structured LLM output, provider abstraction, rate-limit handling, caching, cost awareness.
- Use it for my own job hunt.

---

## 3. Decision Log

| #   | Decision                                                                                                                                                                                          | Status                | Reason                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| D1  | Project = AI resume optimizer & job matcher, named **AlignCV**                                                                                                                                    | ✅                    | Helps own job hunt + covers backend + AI                                          |
| D2  | No "bring your own Claude API key" job search                                                                                                                                                     | ❌ Rejected (for now) | Claude Pro ≠ API key; most users lack API credits; complexity. Parked in §16      |
| D3  | No LinkedIn / Naukri scraping by the app                                                                                                                                                          | ❌ Rejected           | ToS violations, IP blocking, fragile                                              |
| D4  | No Cloudinary / file storage                                                                                                                                                                      | ❌ Rejected           | Resume stored as JSON (~5–15 KB); PDF regenerated on demand                       |
| D5  | Uploaded file is parsed then discarded                                                                                                                                                            | ✅                    | Privacy + zero storage                                                            |
| D6  | Resume format = JSON based on **JSON Resume** schema                                                                                                                                              | ✅                    | Open standard, editable, diffable                                                 |
| D7  | AI suggestions = **JSON Patch (RFC 6902)** ops, one per suggestion                                                                                                                                | ✅                    | Granular accept/reject, diffable                                                  |
| D8  | ATS + fitness scores = deterministic code in `packages/shared`                                                                                                                                    | ✅                    | Reproducible; runs in browser (live) and server (verification)                    |
| D9  | PDF generation in the browser (`@react-pdf/renderer`)                                                                                                                                             | ✅                    | Puppeteer won't fit Render free RAM; instant download                             |
| D10 | Separate **Express API** (not Next.js API routes)                                                                                                                                                 | ✅                    | Showcases backend separately                                                      |
| D11 | **Drizzle ORM** + drizzle-kit migrations                                                                                                                                                          | ✅                    | Lightweight, SQL-like, real migration files                                       |
| D12 | Better Auth for authentication                                                                                                                                                                    | ⛔ Superseded by D20  | —                                                                                 |
| D13 | BullMQ worker runs inside the API process                                                                                                                                                         | ✅                    | Render free tier has no background worker                                         |
| D14 | Next.js rewrites proxy `/api/*` → Render                                                                                                                                                          | ✅                    | First-party cookies (refresh token)                                               |
| D15 | Groq primary, Gemini fallback, behind `AIProvider`                                                                                                                                                | ✅                    | Both free; one 429s → try the other                                               |
| D16 | Job search cache in Redis keyed by query, TTL 30–60 min                                                                                                                                           | ✅ (Phase 3)          | Shared across users → protects free API quotas                                    |
| D17 | Email via Nodemailer + Gmail SMTP (app password)                                                                                                                                                  | ✅                    | Free, no custom domain needed                                                     |
| D18 | User-selectable visual templates                                                                                                                                                                  | ⛔ Superseded by D22  | —                                                                                 |
| D19 | Draft + immutable version history                                                                                                                                                                 | ⛔ Superseded by D21  | Too complex for MVP                                                               |
| D20 | **Hand-written JWT auth**: short-lived access token (memory) + rotating refresh token (httpOnly cookie, hashed in DB, reuse detection). OAuth via `arctic` (Google now, GitHub Phase 2). Own RBAC | ✅                    | Shows real auth/security knowledge; full control                                  |
| D21 | **Base resume (editable) → tailored resume (saved snapshot)** model                                                                                                                               | ✅                    | Matches how people actually use resumes; simpler than full versioning             |
| D22 | One ATS-friendly PDF layout in MVP; themes = future scope                                                                                                                                         | ✅                    | Focus on the optimizer                                                            |
| D23 | Optimizer target = **predefined role profile** (static JSON, no AI call) **or pasted JD** (AI extraction, cached)                                                                                 | ✅                    | Role dropdown is free and instant; JD path is more precise                        |
| D24 | **Auto-pick base resume** = highest deterministic score vs target; user can override                                                                                                              | ✅                    | Explainable, no extra AI call                                                     |
| D25 | Accept/reject happens **client-side** with live scoring; **Save** is verified server-side (re-apply accepted patches to base, recompute scores)                                                   | ✅                    | Instant UX + never trust client-computed data                                     |
| D26 | Uploads: **PDF** in MVP; **images (JPG/PNG/WebP)** in Phase 2 via **in-browser OCR (`tesseract.js`)** then the same text pipeline                                                                 | ✅                    | OCR in browser = $0 and no vision-model quotas; user reviews parsed result anyway |
| D27 | **Demo mode** with pre-computed sample data (no AI calls) + keep-warm pinger                                                                                                                      | ✅                    | Live link on resume must always work (Rule 2)                                     |

---

## 4. Tech Stack

| Layer                   | Choice                                                                         | Host                                  | Notes                                                      |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------- |
| Monorepo                | pnpm workspaces                                                                | —                                     | `apps/web`, `apps/api`, `packages/shared`                  |
| Frontend                | Next.js (App Router) + TypeScript                                              | **Vercel (Hobby)**                    | Tailwind, shadcn/ui, TanStack Query, react-hook-form + zod |
| Backend                 | Node.js + Express + TypeScript                                                 | **Render (Free web service, Docker)** | Single service: HTTP API + BullMQ worker                   |
| Database                | PostgreSQL                                                                     | **Neon (Free)**                       | Pooled connection string                                   |
| ORM / migrations        | Drizzle ORM + drizzle-kit                                                      | —                                     | Migrations committed, never edited after merge             |
| Cache / queue           | Redis + BullMQ                                                                 | **Upstash (Free)**                    | TLS, `maxRetriesPerRequest: null`, eviction disabled       |
| Auth                    | JWT via `jose`; passwords via `@node-rs/argon2` (argon2id); OAuth via `arctic` | —                                     | See §11                                                    |
| AI                      | Groq (primary), Gemini (fallback)                                              | Free tiers                            | JSON / structured output                                   |
| PDF text extraction     | `unpdf` (server)                                                               | —                                     | Text-based PDFs                                            |
| Image / scanned PDF OCR | `tesseract.js` (+ `pdfjs-dist` to rasterize) in **browser**                    | —                                     | Phase 2                                                    |
| PDF generation          | `@react-pdf/renderer` (browser)                                                | —                                     | One ATS-friendly layout                                    |
| JSON Patch              | `fast-json-patch`                                                              | —                                     | Shared front + back                                        |
| Diff highlighting       | `jsondiffpatch` or custom                                                      | —                                     | Side-by-side view                                          |
| Email                   | Nodemailer + Gmail SMTP                                                        | —                                     | Password reset                                             |
| Validation              | zod (shared schemas)                                                           | —                                     | Same schema front + back                                   |
| Logging                 | pino                                                                           | —                                     | Never log resume content or secrets                        |
| Testing                 | Vitest + Supertest                                                             | —                                     | Scorers, patching, auth, API flows                         |
| CI                      | GitHub Actions                                                                 | Free (public repo)                    | Lint, typecheck, test, build                               |
| Keep-warm               | UptimeRobot or cron-job.org (free)                                             | —                                     | Pings `/health` every ~10 min                              |
| Local dev               | docker-compose (Postgres + Redis)                                              | —                                     | Mirrors prod                                               |

---

## 5. Free-Tier Budget & Limits

> Verified 2026-11-20. Free tiers change — re-check before relying on a number.

| Service                        | Free limits (key ones)                                          | Gotchas / how we stay under                                                                                                                                                                  |
| ------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Render**                     | Free web service, ~512 MB RAM, 750 hrs/month                    | Sleeps after 15 min idle → 30–60 s cold start (keep-warm pinger; one 24/7 service fits in 750 h). No free background workers. **Render free Postgres expires after 30 days → don't use it.** |
| **Vercel Hobby**               | Free for personal/non-commercial                                | Fine for portfolio. Frontend is always fast                                                                                                                                                  |
| **Neon**                       | 1 GB storage/project, 100 CU-hours/project/month, scale-to-zero | Resume JSON is tiny. Keep-warm pings should hit `/health` _without_ a DB query most of the time (see §13) to save CU-hours                                                                   |
| **Upstash Redis**              | 256 MB, 500K commands/month                                     | BullMQ polling: raise `drainDelay`, `stalledInterval`; few queues; short TTLs                                                                                                                |
| **Groq**                       | Free, rate-limited per org/model (429, never billed)            | Queue + backoff; per-user daily quota                                                                                                                                                        |
| **Gemini API**                 | Free tier heavily reduced in 2025–26                            | Fallback only; check AI Studio for live limits                                                                                                                                               |
| **Gmail SMTP**                 | Daily sending cap                                               | Transactional mail only                                                                                                                                                                      |
| **GitHub Actions**             | Free for public repos                                           | Keep repo public                                                                                                                                                                             |
| **UptimeRobot / cron-job.org** | Free monitors                                                   | 1 monitor on `/health`                                                                                                                                                                       |
| **Adzuna** (Phase 3)           | 25/min, 250/day, 1,000/week, 2,500/month                        | Trial terms — read licence. Query-keyed Redis cache                                                                                                                                          |
| **Jooble** (Phase 3)           | Free API key, 60+ countries incl. India                         | Apply links route via Jooble                                                                                                                                                                 |

**Never:** add a credit card to Upstash/Neon/Render, enable paid instances, start auto-converting trials.

### App-level caps (protect free tiers)

| Cap                             | Value                                                 |
| ------------------------------- | ----------------------------------------------------- |
| PDF upload                      | ≤ 2 MB, ≤ 3 pages, text-based (MVP)                   |
| Image upload (Phase 2)          | JPG/PNG/WebP, ≤ 4 MB each, ≤ 3 images (pages)         |
| Extracted text                  | ≤ 20,000 chars (else reject: "too long for a resume") |
| Pasted job description          | ≤ 10,000 chars                                        |
| Base resumes per user           | 5                                                     |
| Saved tailored resumes per user | 50                                                    |
| AI parses per user/day          | 5                                                     |
| AI optimizations per user/day   | 10                                                    |
| Unsaved optimization sessions   | auto-deleted after 7 days                             |

---

## 6. Architecture

```
┌────────────────────────────────┐        ┌────────────────────────────────────────┐
│  Next.js (Vercel)              │        │  Express API (Render, Docker)          │
│  - UI, side-by-side view       │ /api/* │  ┌──────────────┐  ┌────────────────┐  │
│  - live scoring (shared pkg)   ├───────▶│  │ HTTP routes  │  │ BullMQ worker  │  │
│  - JSON Patch apply (shared)   │rewrite │  │ JWT, RBAC,   │  │ parse-resume   │  │
│  - PDF download (react-pdf)    │        │  │ validation   │  │ optimize       │  │
│  - OCR (tesseract.js, Ph. 2)   │        │  └──────┬───────┘  │ send-email     │  │
└────────────────────────────────┘        │         │          └───────┬────────┘  │
                                          └─────────┼──────────────────┼───────────┘
                     ┌──────────────────────┬───────┼──────────┬───────┴─────┐
                     ▼                      ▼                  ▼             ▼
               Neon Postgres          Upstash Redis       Groq / Gemini   Gmail SMTP
               (users, resumes,       (queues, cache,     (AIProvider)
                optimizations,         rate limits,
                refresh tokens)        quotas)
```

`packages/shared` contains: zod schemas (resume, API DTOs), role profiles, **ATS scorer, fitness scorer**, JSON Patch helpers, skill synonym map. Used by both web (live UX) and API (source of truth).

### Key flows

**A. Upload base resume**

1. Client validates type/size → `POST /base-resumes/upload` (multipart PDF).
2. Server re-validates (magic bytes, size, page count) → `unpdf` extracts text in memory → length check.
3. Enqueue `parse-resume` → `202 { jobId }`. Frontend polls `GET /jobs/:id`.
4. Worker: LLM → JSON Resume (zod-validated, one repair retry) → saved as base resume with `status = needs_review`.
5. User reviews/corrects in a form editor → `PUT /base-resumes/:id` → `status = ready`. File and raw text discarded.
6. _(Phase 2, images)_ Browser OCRs images with `tesseract.js` → sends **text** to `POST /base-resumes/from-text` → same steps 3–5.

**B. Edit base resume (day-to-day)**

- Form editor → `PUT /base-resumes/:id` (optimistic concurrency via `updated_at`). Base resumes are simply updated; tailored resumes keep their own saved content, so editing a base never changes past tailored resumes.

**C. Optimize (core)**

1. `POST /optimizations { target: { type: 'role', roleKey } | { type: 'jd', text }, baseResumeId? }`.
2. Requirements:
   - role → load static role profile from `packages/shared/roles` (no AI).
   - JD → Redis cache `jd:{sha256(text)}` → miss → LLM extraction → cache 7 days.
3. Base selection: if `baseResumeId` missing → score every `ready` base resume of the user → pick highest; return ranked list so UI can offer "switch". No base resumes → `409 NO_BASE_RESUME` → UI prompts upload.
4. Check per-user quota (Redis) → enqueue `optimize` → `202 { optimizationId }`.
5. Worker: compute **ATS + fitness scores** (code) → LLM generates suggestions as JSON Patch ops with reasons → validate each op path against the base → drop invalid ones → store `optimization` + `suggestion` rows. Cache by `sha256(baseContent + requirements)`.
6. Client loads `GET /optimizations/:id` (base JSON, requirements, scores, suggestions).

**D. Review suggestions (client-side, instant)**

- One suggestion card at a time: **Accept / Reject / Edit & accept / Undo**.
- On each decision the client re-applies all accepted patches to the base JSON (shared helper) → re-renders the right-hand preview with highlights → recomputes ATS + fitness scores locally.
- Suggestions flagged `requiresConfirmation` (e.g. adding a skill) ask: _"Do you actually have experience with X?"_ before accepting.
- Decisions are kept in client state (and `localStorage` as a crash backup) until Save/Download.

**E. Save or Download**

- **Download:** browser renders tailored JSON with `@react-pdf/renderer` → file downloads immediately. No server call.
- **Save:** `POST /tailored-resumes { optimizationId, decisions: [{suggestionId, status, editedValue?}], title }` → server re-applies accepted patches to the **stored base snapshot** → zod-validates → recomputes scores → stores the tailored resume. Client-computed content/scores are never trusted.

**F. Share (Phase 2)**

- `POST /tailored-resumes/:id/share` → random 22-char slug; public read-only page `/r/:slug`; revocable; view count via Redis `INCR`.

---

## 7. Data Model (Drizzle / Postgres)

```
user
  id UUID PK, email CITEXT UNIQUE, email_verified BOOL DEFAULT false,
  password_hash TEXT NULL                  -- null for OAuth-only users
  name TEXT, avatar_url TEXT NULL,
  role ENUM('user','admin') DEFAULT 'user',
  headline TEXT NULL, location TEXT NULL, years_experience INT NULL,
  created_at, updated_at, deleted_at NULL

oauth_account
  id UUID PK, user_id FK, provider ENUM('google','github'),
  provider_user_id TEXT, created_at
  UNIQUE(provider, provider_user_id)

refresh_token
  id UUID PK, user_id FK, family_id UUID, token_hash CHAR(64) UNIQUE,
  expires_at, revoked_at NULL, replaced_by_id UUID NULL,
  user_agent TEXT NULL, ip_hash CHAR(64) NULL, created_at
  INDEX(user_id), INDEX(family_id)

password_reset_token
  id UUID PK, user_id FK, token_hash CHAR(64) UNIQUE, expires_at, used_at NULL

base_resume
  id UUID PK, user_id FK, title TEXT ("Full Stack Resume"),
  content JSONB NOT NULL                   -- JSON Resume
  status ENUM('needs_review','ready'),
  source ENUM('pdf','image','manual'),
  created_at, updated_at, deleted_at NULL
  INDEX(user_id)

job_description
  id UUID PK, user_id FK, title TEXT NULL, company TEXT NULL,
  raw_text TEXT, text_hash CHAR(64), requirements JSONB, created_at
  INDEX(user_id, text_hash)

optimization                               -- one optimizer session
  id UUID PK, user_id FK, base_resume_id FK,
  base_snapshot JSONB NOT NULL             -- base content at optimization time
  target_type ENUM('role','jd'), role_key TEXT NULL, job_description_id FK NULL,
  requirements JSONB NOT NULL,
  ats_score INT, fitness_score INT, breakdown JSONB,
  status ENUM('queued','processing','done','failed'), error TEXT NULL,
  ai_provider TEXT, model TEXT, prompt_version TEXT,
  created_at, expires_at                   -- unsaved sessions cleaned after 7 days

suggestion
  id UUID PK, optimization_id FK, position INT,
  op JSONB                                 -- single JSON Patch op
  reason TEXT, category ENUM('skill','bullet','summary','section','keyword'),
  requires_confirmation BOOL

tailored_resume
  id UUID PK, user_id FK, base_resume_id FK NULL (SET NULL on base delete),
  optimization_id FK, title TEXT ("Frontend – Acme"),
  content JSONB NOT NULL,
  decisions JSONB NOT NULL                 -- [{suggestionId, status, editedValue?}]
  ats_score INT, fitness_score INT, breakdown JSONB,
  created_at, updated_at, deleted_at NULL
  INDEX(user_id)

share_link              (Phase 2)
  id UUID PK, tailored_resume_id FK, slug TEXT UNIQUE, is_active BOOL,
  view_count INT DEFAULT 0, created_at, revoked_at NULL

job_listing / job_match (Phase 3) — see §15
```

**Rules:** UUID PKs; timestamps everywhere; FK indexes; soft delete for user content; ownership (`user_id`) enforced on every query; JSONB validated by zod before insert; tokens stored only as SHA-256 hashes.

---

## 8. Scoring (deterministic, in `packages/shared`)

Inputs: resume JSON + requirements `{ requiredSkills[], preferredSkills[], minYears, seniority, responsibilities[] }`.
Skill names normalized via a synonym map (`react.js → react`, `postgres → postgresql`, `node → node.js`).

### ATS score — _"Will an ATS / recruiter skim pick this up?"_

| Component                                                  | Weight | How                                                                |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| Required keywords present (skills + bullets + summary)     | 40     | matched / required                                                 |
| Preferred keywords present                                 | 15     | matched / preferred                                                |
| Keywords used in experience bullets (not only skills list) | 15     | required skills appearing in highlights                            |
| Section completeness                                       | 15     | contact, summary, experience, education, skills                    |
| Parse-ability & length                                     | 15     | standard headings, parseable dates, sane length, no empty sections |

### Fitness score — _"How well does this candidate actually match?"_

| Component                            | Weight | How                                                    |
| ------------------------------------ | ------ | ------------------------------------------------------ |
| Required skills backed by experience | 40     | required skills that appear in work/project highlights |
| Experience years vs required         | 25     | capped ratio                                           |
| Seniority / title alignment          | 15     | title keywords vs target seniority                     |
| Responsibility overlap               | 10     | responsibilities vs bullets (token overlap)            |
| Impact / quantified bullets          | 10     | % bullets with numbers                                 |

> Honest by design: accepting rephrasing suggestions raises the **ATS** score a lot; the **fitness** score only rises when real, confirmed experience is surfaced. The UI explains this difference.

Both return `score (0–100)` + `breakdown` (matched/missing lists per component). Weights in one config file. Unit tested with fixtures. Same code runs in browser (live) and server (verification).

### Role profiles (`packages/shared/roles/*.json`)

Initial set: Frontend, Backend, Full Stack, React Native / Mobile, DevOps, Data Analyst. Each: `requiredSkills`, `preferredSkills`, `typicalResponsibilities`, `seniorityLevels`. Hand-curated, versioned in git, no AI cost.

---

## 9. AI Design

### Provider abstraction

```ts
interface AIProvider {
  name: string;
  generateJSON<T>(opts: { system: string; user: string; schema: ZodSchema<T>; maxTokens?: number }): Promise<T>;
}
// GroqProvider, GeminiProvider; AIRouter tries primary → fallback on 429/5xx
```

### AI tasks

| Task                     | Input                                      | Output (zod-validated)                                                                    |
| ------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `parseResume`            | extracted text (PDF or OCR)                | JSON Resume                                                                               |
| `extractJobRequirements` | JD text                                    | `{ title, requiredSkills[], preferredSkills[], minYears, seniority, responsibilities[] }` |
| `suggestImprovements`    | base JSON + requirements + score breakdown | `[{ op, reason, category, requiresConfirmation }]` (max ~15)                              |

### Guardrails

- System prompts: **never invent** experience, employers, dates, metrics or skills. New skills only as `requiresConfirmation: true`.
- Every op path validated against the base; ops touching contact info/dates/employer names rejected.
- zod parse; one repair retry; else job fails gracefully with a user-friendly message.
- `prompt_version` + model stored on each optimization.

### Cost & rate-limit control

- BullMQ: 3 attempts, exponential backoff (respect `retry-after`), queue concurrency 2.
- Per-user daily quotas in Redis (§5).
- Caches: JD requirements by `sha256(JD)` (7 days); optimization by `sha256(base + requirements)` (24 h).
- If all providers are exhausted → clear message ("AI is busy, try again in a few minutes") — never a blank error. Demo mode is unaffected (§13).

---

## 10. API Endpoints (v1)

Base: `/api/v1`. JSON. Errors: `{ error: { code, message, details? } }`. Cursor pagination on lists.

| Method               | Path                                             | Phase | Notes                                                 |
| -------------------- | ------------------------------------------------ | ----- | ----------------------------------------------------- |
| POST                 | `/auth/register`                                 | 1     | email + password                                      |
| POST                 | `/auth/login`                                    | 1     | → access token + refresh cookie                       |
| POST                 | `/auth/refresh`                                  | 1     | rotate refresh token                                  |
| POST                 | `/auth/logout`                                   | 1     | revoke current refresh family                         |
| POST                 | `/auth/logout-all`                               | 1     | revoke all sessions                                   |
| GET                  | `/auth/google` → `/auth/google/callback`         | 1     | OAuth (PKCE + state)                                  |
| GET                  | `/auth/github` → `/auth/github/callback`         | 2     | OAuth                                                 |
| POST                 | `/auth/forgot-password` / `/auth/reset-password` | 1     | email token                                           |
| GET / PATCH / DELETE | `/me`                                            | 1     | profile; delete = all data                            |
| GET                  | `/roles`                                         | 1     | role profiles for dropdown                            |
| GET                  | `/base-resumes`                                  | 1     | list                                                  |
| POST                 | `/base-resumes/upload`                           | 1     | PDF → 202 + jobId                                     |
| POST                 | `/base-resumes/from-text`                        | 2     | OCR text → 202 + jobId                                |
| GET / PUT / DELETE   | `/base-resumes/:id`                              | 1     | view / edit / soft delete                             |
| POST                 | `/optimizations`                                 | 1     | target + optional base → 202 (or 409 NO_BASE_RESUME)  |
| GET                  | `/optimizations/:id`                             | 1     | base, requirements, scores, suggestions, ranked bases |
| GET                  | `/jobs/:id`                                      | 1     | background job status                                 |
| GET                  | `/tailored-resumes`                              | 1     | list                                                  |
| POST                 | `/tailored-resumes`                              | 1     | save (server re-verifies)                             |
| GET / PATCH / DELETE | `/tailored-resumes/:id`                          | 1     | view / rename / soft delete                           |
| POST                 | `/tailored-resumes/:id/share`                    | 2     | create/revoke share link                              |
| GET                  | `/public/r/:slug`                                | 2     | public read-only                                      |
| GET                  | `/demo/optimization`                             | 1     | static pre-computed demo data (no auth, no AI)        |
| GET                  | `/me/github/contributions`                       | 2     | GitHub GraphQL, cached 6 h                            |
| GET / PATCH          | `/admin/users[/:id]`                             | 2     | admin only                                            |
| GET                  | `/admin/queues`                                  | 2     | admin only                                            |
| GET                  | `/job-search`                                    | 3     | cached by query                                       |
| GET                  | `/health`                                        | 1     | liveness (no DB); `/health/ready` checks DB + Redis   |

---

## 11. Auth (JWT, hand-written), RBAC & Security

### Tokens

| Token   | Format                                                          | Lifetime                       | Storage (client)                                               | Storage (server)                |
| ------- | --------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------- | ------------------------------- |
| Access  | JWT (`jose`, HS256), claims: `sub`, `role`, `iat`, `exp`, `jti` | 15 min                         | **memory only** (not localStorage)                             | none (stateless)                |
| Refresh | 256-bit random opaque string                                    | 7 days (30 with "remember me") | **httpOnly, Secure, SameSite=Lax cookie**, `Path=/api/v1/auth` | SHA-256 hash in `refresh_token` |

- **Rotation:** every `/auth/refresh` issues a new refresh token and revokes the old one (`replaced_by_id`).
- **Reuse detection:** if a revoked refresh token is presented → revoke the **whole family** (likely theft) → force re-login.
- **CSRF:** refresh/logout require `Origin` check + custom header (`X-Requested-With: aligncv`); cookies are first-party via the Next.js rewrite.
- On page load the client calls `/auth/refresh` to get an access token (silent login).
- Role changes take effect at next refresh (≤ 15 min); admin endpoints additionally re-read the role from DB.

### Passwords & OAuth

- argon2id (`@node-rs/argon2`); min 8 chars; check against a small common-passwords list.
- Login rate limiting per IP + per email (Redis); generic error messages (no user enumeration).
- Google OAuth via `arctic`: Authorization Code + PKCE + `state` (stored in short-lived signed cookie).
- **Account linking:** OAuth email matches an existing user **and** the provider says it is verified → link `oauth_account` to that user. (GitHub: fetch `/user/emails`, use primary verified email.)
- Password reset: single-use hashed token, 30 min expiry, all refresh tokens revoked after reset.

### RBAC

```ts
export const PERMISSIONS = {
  user: ["resume:own", "optimization:own", "share:own", "profile:own"],
  admin: [
    "resume:own",
    "optimization:own",
    "share:own",
    "profile:own",
    "admin:users:read",
    "admin:users:write",
    "admin:queues:read",
  ],
} as const;
// authenticate (verify JWT) → authorize('admin:users:read')
// ownership enforced in repositories: WHERE user_id = ctx.userId
```

### Security checklist

- helmet, strict CORS, body size limits, file magic-byte checks, zod on every input, parameterized queries.
- Redis rate limits: auth (per IP/email), AI endpoints (per user), public pages (per IP).
- Secrets only in env; `.env.example` maintained; JWT secret ≥ 32 bytes.
- No resume content, JD text, tokens or passwords in logs.
- Share pages: `noindex`, revocable, unguessable slugs.
- Delete account → hard delete of all user data.

---

## 12. Frontend (Next.js)

| Route                                                         | Phase | Purpose                                                                                                                                     |
| ------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                           | 1     | Landing: what it does + **"Try the demo" (no signup)** + sign in                                                                            |
| `/demo`                                                       | 1     | Full optimizer experience on sample data (§13)                                                                                              |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | 1     | Auth                                                                                                                                        |
| `/dashboard`                                                  | 1     | Base resumes, recent tailored resumes, "Optimize" CTA                                                                                       |
| `/base-resumes/new`                                           | 1     | Upload (PDF; images Phase 2) with size/type hints                                                                                           |
| `/base-resumes/[id]`                                          | 1     | Review / edit form + preview                                                                                                                |
| `/optimize`                                                   | 1     | Choose target (role dropdown or paste JD) → auto-picked base (switchable) → progress                                                        |
| `/optimize/[id]`                                              | 1     | **Side-by-side review**: suggestion card (accept/reject/edit/undo), live ATS + fitness scores, highlighted changes, **Save** / **Download** |
| `/tailored-resumes` & `/tailored-resumes/[id]`                | 1     | List, view, download, rename, delete                                                                                                        |
| `/profile`                                                    | 1     | Profile, connected accounts, sessions (logout all), delete account                                                                          |
| `/r/[slug]`                                                   | 2     | Public shared resume                                                                                                                        |
| `/admin`                                                      | 2     | Users, roles, quotas, queue health                                                                                                          |
| `/jobs`                                                       | 3     | Job search + fitness %                                                                                                                      |

UX rules: skeletons; toasts for background job completion; "This may take a moment" on first optimization; "Waking up server…" message if the API is cold; keyboard shortcuts in review (A = accept, R = reject); mobile-responsive (side-by-side becomes tabs).

---

## 13. Recruiter-Proof Deployment

The link is on my resume, so:

1. **Demo mode (no signup, no AI calls):** `/demo` loads a sample base resume, a sample Frontend JD, and **pre-computed** suggestions from static JSON. The full accept/reject/side-by-side/download experience works even if Groq/Gemini are down or out of quota.
2. **Seeded demo account** (`demo@aligncv.app` / password in README) with saved tailored resumes; reset nightly by a repeatable job. Demo account has AI quota 0 (prevents abuse) → uses cached results only.
3. **Keep-warm:** free UptimeRobot/cron-job.org ping to `/health` (no DB hit) every ~10 min → no 60 s cold start for visitors. Frontend on Vercel is always instant.
4. **Graceful degradation:** every external failure (AI 429, Redis down, DB cold) shows a clear message, never a blank page.
5. **README:** live link, demo credentials, 60-second GIF/video, architecture diagram, free-tier design explanation, tech decisions. If the live site is ever down, the GIF still shows it works.
6. **Smoke test after every deploy** (CI step or manual checklist): `/health/ready`, `/demo`, sign in, one optimization.
7. **Monitoring:** UptimeRobot email alert if the site is down.

---

## 14. Background Jobs (BullMQ)

| Queue                   | Jobs                                                                                     | Retries         | Concurrency    |
| ----------------------- | ---------------------------------------------------------------------------------------- | --------------- | -------------- |
| `ai`                    | `parse-resume`, `optimize`                                                               | 3, exp. backoff | 2              |
| `email`                 | `send-email`                                                                             | 5, exp. backoff | 2              |
| `maintenance`           | delete expired optimizations, expired refresh/reset tokens; reset demo account (nightly) | 1               | 1 (repeatable) |
| `jobs-ingest` (Phase 3) | fetch job APIs on cache miss                                                             | 2               | 1              |

- Worker started in the same process as Express. Graceful shutdown on `SIGTERM`.
- Upstash tuning: higher `drainDelay` / `stalledInterval`; `removeOnComplete` / `removeOnFail` with age limits.
- Failed jobs kept 7 days (visible in admin, Phase 2).

---

## 15. Phases & Checklists

### Phase 0 — Setup (2–3 days)

- [ ] pnpm monorepo: `apps/web`, `apps/api`, `packages/shared`
- [ ] TypeScript strict, ESLint, Prettier, Husky + lint-staged, conventional commits
- [ ] docker-compose (Postgres + Redis); `apps/api/Dockerfile` (multi-stage, non-root)
- [ ] Drizzle setup + first migration (`user`, `refresh_token`)
- [ ] Express skeleton: zod-validated env config, pino, error handler, `/health`
- [ ] Next.js skeleton + rewrites to API + shadcn/ui
- [ ] GitHub Actions: lint, typecheck, test, build
- [ ] Accounts: Neon, Upstash, Render, Vercel, Groq, Google AI Studio, Google Cloud OAuth client, UptimeRobot
- [ ] Deploy "hello world" to Vercel + Render (deploy early!)
- [ ] `CLAUDE.md` + project rules (next discussion)

### Phase 1 — MVP (≈ 3 weeks) → **deploy + put link on resume**

- [ ] JWT auth: register, login, refresh rotation + reuse detection, logout / logout-all, forgot/reset password
- [ ] Google OAuth + account linking
- [ ] RBAC middleware + ownership checks + tests
- [ ] Profile (view/edit, sessions, delete account)
- [ ] Base resume: PDF upload (caps) → parse job → review/edit → ready; list/edit/delete
- [ ] Role profiles (6 roles) + `GET /roles`
- [ ] JD requirement extraction + cache
- [ ] ATS + fitness scorers in `packages/shared` + unit tests
- [ ] Auto-pick base resume + switch
- [ ] Optimization job: scores + AI suggestions (JSON Patch) + validation
- [ ] Side-by-side review UI: accept/reject/edit/undo, live scores, highlights, confirmation for new skills
- [ ] Download PDF (client) + Save (server-verified)
- [ ] Tailored resumes: list/view/rename/delete/download
- [ ] Redis: quotas, caches, rate limits
- [ ] Demo mode + seeded demo account + keep-warm + UptimeRobot alert
- [ ] README (live link, demo creds, GIF, architecture, decisions)
- [ ] Production deploy + smoke test → **add AlignCV to my resume**

### Phase 2 — Polish (1–2 weeks)

- [ ] Image upload + scanned PDF via in-browser OCR (`tesseract.js`)
- [ ] GitHub OAuth + contribution graph on profile
- [ ] Share links (revoke, view count)
- [ ] Admin panel: users, roles, quota overrides, queue health / failed jobs
- [ ] Email verification
- [ ] OpenAPI docs + Swagger UI
- [ ] Integration tests for main API flows

### Phase 3 — Jobs (1–2 weeks)

- [ ] `JobProvider` interface: Adzuna, Jooble (+ Remotive/Arbeitnow)
- [ ] Normalize + dedupe + store `job_listing`
- [ ] Query-keyed Redis cache (TTL 30–60 min), "first search may take a moment" UX
- [ ] Fitness % per job vs selected base resume (reuse §8)
- [ ] "Optimize for this job" → feeds JD into the optimizer

---

## 16. Future Scope (parking lot — not in any phase)

- **Visual templates / themes**: upload or choose a theme; same JSON content renders in the selected design.
- Claude "Deep Search" with user's own API key (D2); MCP server for Claude integration.
- React Native app on the same API.
- Cover letter generator from tailored resume + JD.
- Application tracker (saved → applied → interview → offer) with BullMQ delayed reminders.
- pgvector embeddings for semantic job matching.
- DOCX upload (`mammoth`).
- Version history for base resumes.

---

## 17. Engineering Conventions (summary — full rules file next)

- **API layering:** `routes → controllers → services → repositories`; no DB calls in controllers.
- **Feature folders:** `src/modules/{auth,users,base-resumes,optimizations,tailored-resumes,roles,share,admin,jobs}`.
- **Validation:** zod at boundaries; shared schemas in `packages/shared`.
- **Errors:** typed `AppError(code, status)`; central error middleware; no stack traces in prod responses.
- **Migrations:** drizzle-kit generated, reviewed, committed, never edited after merge; run on deploy.
- **Git:** feature branches, PRs (even solo), conventional commits, squash merge.
- **Tests (must-have):** scorers, patch application + save verification, token rotation/reuse detection, RBAC.
- **Config:** env validated at boot; app refuses to start on invalid config.

### Upcoming discussions

1. **Senior-developer PR review Claude skill** — reviews the current diff for bugs, future risks, security, performance, conventions; outputs a structured review.
2. **Project rules files** — architecture rules, coding style, production standards (`CLAUDE.md` + rules).

---

## 18. Environment Variables

```
# apps/api
NODE_ENV=
PORT=
DATABASE_URL=                # Neon pooled
REDIS_URL=                   # Upstash (rediss://)
JWT_ACCESS_SECRET=           # ≥ 32 random bytes
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
WEB_ORIGIN=                  # https://aligncv.vercel.app
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GITHUB_CLIENT_ID=            # Phase 2
GITHUB_CLIENT_SECRET=        # Phase 2
GROQ_API_KEY=
GEMINI_API_KEY=
SMTP_USER=
SMTP_APP_PASSWORD=
AI_DAILY_OPTIMIZATIONS_PER_USER=10
AI_DAILY_PARSES_PER_USER=5
ADZUNA_APP_ID=               # Phase 3
ADZUNA_APP_KEY=              # Phase 3
JOOBLE_API_KEY=              # Phase 3

# apps/web
API_URL=                     # Render URL (server-side, used by rewrites)
NEXT_PUBLIC_APP_URL=
```

---

## 19. Open Questions

- [x] Project name → **AlignCV**
- [x] Auth → **hand-written JWT** (D20)
- [x] Templates → one ATS layout now; themes future (D22)
- [ ] Final list of roles in dropdown (initial 6 in §8 — confirm/extend)
- [ ] Check `aligncv.vercel.app` availability (fallback: `aligncv-app.vercel.app`)
- [ ] Target job markets for Phase 3 (India / remote / both)
