# Review checklist

Apply each item that is relevant to the changed code. Skip a section when nothing in the
diff touches it. Problems that the automated checks already reported are out of scope here.

## 1. General

**Bugs and edge cases**
- Off-by-one errors, wrong comparisons (`==`, `<` vs `<=`), inverted conditions, wrong
  variable used.
- Empty, null and undefined inputs; empty arrays; very long strings; unicode; duplicate
  entries.
- Async: a missing `await`, a floating promise, `forEach` with an async callback, a race
  between concurrent requests, a stale closure.
- Dates and timezones: comparing local and UTC, parsing dates without a format.
- State that can drift: two sources of truth for the same value.

**Error handling**
- Every `await` on I/O (DB, Redis, HTTP, AI provider) has a failure path that matches the
  layer: services throw `AppError`, and the central middleware formats it.
- No empty `catch`, and no `catch` that logs and continues as if the call succeeded.
- External calls have timeouts. AI provider calls fall back (Groq → Gemini) as the plan
  describes.
- The user sees a useful message, never a stack trace or raw provider error.

**DRY**
- The same logic in two places, especially a component or route that re-implements what
  `packages/shared` already exports (scorers, schemas, patch helpers, role profiles), or
  a hook, or a sibling module.
- A zod schema duplicated between web and api instead of imported from `packages/shared`.
- Copy-pasted blocks that differ only in a literal. Extract a function or a map.

**Dead code**
- Unused variables, params, imports, exports and files; commented-out code; unreachable
  branches; leftover `console.log`.

**Naming**
- Names say what the thing is or does (`computeAtsScore`, not `calc`). Booleans read as
  questions (`isExpired`, `hasConsent`). There are no misleading names (`getX` that
  writes).
- Names follow the existing conventions in that module.

**Minimal and clean logic**
- It's the simplest code that works: no needless abstraction, no premature generalization,
  no flag parameters that switch between two functions, early returns instead of deep
  nesting.

**Scope**
- Only items from the current phase's checklist (§15). Flag code, stubs, routes or TODOs for
  later phases. Ideas belong in §16, not in code.

**$0 cost**
- No new external service, API or SDK unless it's listed in plan §4/§5.
- Every new dependency in a `package.json` was approved in this session or the plan.
  Report its license, whether it has a paid tier, and its install size if you can find
  them. A dependency for `packages/shared` must run in the browser and in Node.
- No pay-as-you-go tiers, auto-converting trials or paid instance sizes in config (Render,
  Vercel, Neon, Upstash, Docker, GitHub Actions).
- §5 app-level caps (upload size, text length, quotas) are enforced, and none was raised
  without a Decision Log entry.

**Project rules and plan**
- The change follows CLAUDE.md and the loaded `.claude/rules/*.md` files. Cite the rule.
- A change to an env var updates `.env.example` and plan §18. No `.env*` file other than
  `.env.example` is committed.
- A change to the stack, architecture, a service or a cap has a Decision Log row (§3).

## 2. TypeScript

- No `any`. Use `unknown` and narrow it (a zod `parse`, a type guard, `instanceof`, `in`).
  Fix example: `catch (e: unknown) { const msg = e instanceof Error ? e.message : 'unknown'; }`
- No unsafe `as` casts. `as` that bypasses validation (`req.body as CreateX`,
  `JSON.parse(x) as T`) has to become `schema.parse(...)`. `as const` and casts the
  compiler can't prove but that are obviously safe are fine with a comment.
- No non-null `!` without a justification comment that explains why the value can't be
  missing. Prefer a guard that throws an `AppError` or returns early.
- Types come from zod (`z.infer<typeof schema>`) rather than being hand-written twice.
- Discriminated unions get an exhaustive `switch` with a `never` check.
- Exported functions have explicit return types.

## 3. React / Next.js (`apps/web`)

**Component responsibility**
- A component either renders UI or does one specific job. Fetching, mutations,
  derived-state logic and effects belong in a custom hook:
  - feature-specific hooks go in that feature's `hooks/` folder
  - hooks that are shared across features go in `src/hooks/`
- No business logic, such as scoring or patch application, in components. Import it from
  `packages/shared`.
- Server and Client components: `'use client'` appears only where it's needed (state,
  effects, browser APIs), and nothing server-only is imported into a client component.

**Re-renders (evidence required)**
- Flag a re-render only when you can name the cause: a new object, array or function
  created on each render and passed to a memoized child or used as an effect or query
  dependency; context value not memoized; state lifted too high so that unrelated
  siblings re-render.
- Also flag an **unnecessary** `useMemo`/`useCallback`: one around a cheap computation,
  a callback passed only to a non-memoized DOM element, or one with dependencies that
  change on every render anyway.
- `useEffect` used to derive state that could be computed during render. Effects that are
  missing dependencies or have no cleanup (listeners, timers, AbortController).

**Styling**
- No raw hex, rgb or hsl colors and no arbitrary Tailwind values (`bg-[#123456]`,
  `w-[437px]`, `text-[13px]`). Use theme tokens or shadcn CSS variables (`bg-primary`,
  `text-muted-foreground`). If a token is missing, add it to the theme.

**Constants**
- Limits, routes, TanStack Query keys, error codes, roles and storage keys live in
  constants files (shared ones in `packages/shared`), never as inline string or number
  literals scattered around the code.
- Query keys come from one key factory, and invalidations use the same factory.

**Data and UX**
- TanStack Query handles loading, error and empty states, with skeletons per the §12 UX
  rules.
- Forms use react-hook-form with the shared zod schema.
- No tokens in `localStorage`. Auth relies on the first-party cookies through the
  `/api/*` rewrite.

## 4. Backend (`apps/api`)

**Layering**
- The order is routes → controllers → services → repositories. Controllers don't call the
  DB. Repositories have no business logic. Feature code lives in `src/modules/<feature>`.

**Validation**
- Every route validates `body`, `params` and `query` with zod (shared schema when the web
  app uses it too) before the controller runs. Unknown keys are stripped or rejected.
- Size and length caps from §5 are enforced at the boundary (upload size, JD length,
  resume text length).

**Authentication and ownership**
- Every non-public route has the auth middleware.
- Every query on user data filters by `user_id` from the verified token, never by a user
  id taken from the request. Fix example: `where(and(eq(t.id, id), eq(t.userId,
  req.user.id)))`.
- A missing record and a record owned by someone else both return the same 404 (no
  existence leak).
- Role checks for admin routes follow §11 RBAC.

**Errors**
- Throw `AppError(code, status)` with a code from the shared error-code constants. No
  `res.status(500).json(...)` scattered through controllers. No stack traces in prod
  responses.

**Logging and privacy**
- The pino logger never receives resume content, JD text, extracted text, tokens,
  passwords, cookies or auth headers, even inside an error object or `req`. Check that
  redaction is configured where `req`/`res` are logged.
- Uploaded files and raw extracted text are never persisted (to the DB, disk or Redis job
  data that's kept after completion).

**Database**
- N+1: a query inside a loop or `Promise.all(map(...))` that could be one query with
  `inArray` or a join.
- A missing transaction: several writes that must succeed together (for example,
  refresh-token rotation, or saving a tailored resume with its metadata).
- A missing index on a column used in `where`, `join` or `orderBy` for a hot path
  (`user_id`, foreign keys, token hash lookups).
- Migrations are generated by drizzle-kit. **A migration file that was already merged to
  `main` must never be edited.** Check with `git log <base> -- <file>`. A schema change has
  a matching new migration.
- Destructive migrations (drop or rename a column) have a safe plan.

**BullMQ jobs**
- Jobs set `attempts` and `backoff`, and set `removeOnComplete`/`removeOnFail` so free-tier
  Redis doesn't fill up.
- A failure handler (`failed` event or catch) updates the job's DB status and doesn't
  crash the shared process.
- Jobs are idempotent (safe to retry), and the job payload holds IDs, not resume content.
- The Redis connection uses `maxRetriesPerRequest: null`.

**Project invariants (CLAUDE.md)**
- Scores are computed only by deterministic functions in `packages/shared`. There's no LLM
  call anywhere in a scoring path.
- An AI suggestion that adds a skill has `requiresConfirmation: true`. Validation rejects
  patch ops that touch contact info, dates or employer names.
- `POST /tailored-resumes` re-applies the accepted patches to the stored `base_snapshot` and
  recomputes scores. Client-sent content and scores are never stored.
- `/demo` and `GET /health` make no AI calls. `/health` makes no DB or Redis query.

## 5. `packages/shared`

- No Node-only APIs (`fs`, `path`, `Buffer`, `process`, `crypto` from node). It must run in
  the browser and in Node.
- Scorers are pure and deterministic: no `Date.now()`, no `Math.random()`, no I/O.

## 6. Tests

- New or changed logic in `packages/shared` (scorers, patch helpers, schemas with
  refinements) has Vitest tests, including edge cases.
- Auth, token rotation and reuse detection, RBAC and save verification have tests for the
  happy path **and** the rejection paths.
- Tests assert behavior, not implementation details. No `.only` or `.skip` is left in. No
  real network calls (mock the AI provider).
- A bug fix comes with a test that would have caught it.
