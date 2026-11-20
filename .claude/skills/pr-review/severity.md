# Severity levels

Give every finding exactly one level. **If you are unsure between two levels, choose the
lower one** and say why in "Why it matters" (for example, "Medium rather than High: only
reachable when X").

## Critical: must not merge

The change can cause real harm in production.

- Security hole: injection, XSS, SSRF, path traversal, secrets committed, CORS or cookie
  misconfiguration that exposes sessions.
- Auth bypass: a route that should be authenticated isn't, a broken JWT or refresh token
  check, an RBAC check missing on an admin route.
- Data loss or leak: one user can read or change another user's data; resume content, JD
  text, tokens or passwords are logged or returned; an uploaded file or raw extracted text
  is persisted; a destructive migration has no safe path.
- Crash: an unhandled rejection or throw in a normal path that takes down the process (the
  API and the BullMQ worker share one process).
- The $0 rule is broken: a paid service, a pay-as-you-go tier or a credit-card-only API; a
  dependency with a paid tier added without approval; a §5 app-level cap removed or raised.
- A project invariant is broken: an LLM call in a scoring path, `/demo` or `/health` doing
  AI work (or `/health` querying the DB or Redis), the server trusting client-sent content or
  scores on save, or a patch that can touch contact info, dates or employer names.

## High: request changes

Wrong in normal use, or a required safeguard is missing.

- A bug that a normal user hits on the happy path.
- A missing zod validation on a route's body, params or query.
- A missing authentication or ownership (`user_id`) check where the data isn't
  cross-user exposed yet. If it is exposed, it's Critical.
- `any` in TypeScript, explicit or implicit (lint `no-explicit-any` failures count).
- A failing typecheck or failing tests.
- A dependency added without approval (no paid tier, but unapproved).
- Errors swallowed or thrown as plain `Error` on a request path, so the client gets the
  wrong status.
- A migration edited after it was merged.

## Medium: should fix

- A bug that appears only in an edge case: empty, null, very large input, concurrency,
  retries, timezone.
- A performance problem with evidence: N+1 queries, a missing index on a filtered or joined
  column, a needless re-render caused by an identified prop, state or dependency.
- A DRY violation: the same logic in two places (for example, a component re-implementing a
  `packages/shared` helper), or a jscpd hit.
- Missing tests for core logic: `packages/shared` scorers or patch helpers, auth, token
  rotation, RBAC, save verification.
- A missing transaction where several writes must succeed or fail together.
- A BullMQ job with no `attempts`/`backoff` or no failure handling.
- An unsafe `as` cast or a non-null `!` without justification, when the value really can be
  missing.
- Scope creep: code, stubs or TODOs for a later phase.

## Low: nice to fix, doesn't block

- Naming, readability, a small structural issue (logic in the wrong layer that works).
- Dead code, unused exports, unused deps (knip).
- Magic values that belong in constants, and raw hex or arbitrary Tailwind values.
- An unnecessary `useMemo`/`useCallback`.
- Formatting failures (Prettier).

## Nice-to-have: optional

- An improvement that a good reviewer would suggest but wouldn't block on: a clearer
  abstraction, an extra test case, a better error message, a small type refinement.

## Verdict

| Highest severity present             | Verdict                    |
| ------------------------------------ | -------------------------- |
| Critical or High                     | ❌ Request changes         |
| Medium or Low                        | ⚠️ Approve with comments   |
| Nice-to-have only, or no findings    | ✅ Approve                 |
