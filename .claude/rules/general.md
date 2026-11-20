# General rules (all files)

## $0 cost
- Use only services listed in plan §4/§5; a new external service needs a §5 row with its free limits before any code uses it.
- Never use or suggest a feature that can create a bill: pay-as-you-go tiers, auto-converting trials, paid instance sizes.
- Never use Render's free Postgres (expires after 30 days); the database is Neon.
- When proposing a dependency, state its license, whether it has a paid tier, and its install size.
- A dependency for `packages/shared` must run in both the browser and Node.
- Prefer the libraries named in §4 over alternatives; swapping one needs a Decision Log entry.
- Enforce the app-level caps in §5 (upload size, text length, quotas); never raise one without a Decision Log entry.
- Re-check a free-tier number on the provider's site before relying on it; §5 can go stale.

## Scope discipline
- Build only items from the current phase's checklist in §15.
- Put ideas outside the current phase in §16 Future Scope (after asking), not in code.
- Don't scaffold, stub or leave TODOs for later-phase features or endpoints.
- Ship Phase 1 to production before starting any Phase 2 item.
- When a phase's checklist is complete, tick its boxes in §15 and update "Current phase" in CLAUDE.md.

## Git conventions
- Branch names: `<type>/<short-kebab-desc>`, e.g. `feat/jwt-refresh-rotation`, `chore/docker-compose`.
- Commits: Conventional Commits `type(scope): subject`; types feat, fix, refactor, test, docs, chore, ci, build, perf; scopes api, web, shared, db, infra, docs.
- Subject: imperative, lowercase, ≤ 72 chars, no trailing period.
- One logical change per commit; migrations get their own commit.
- Every change goes through a PR and squash merge, even solo; never push directly to `main`.
- Never commit `.env*` files except `.env.example`; update `.env.example` and plan §18 whenever an env var changes.

## Decision Log
- Any change to stack, scope, architecture, a free-tier service or a cap gets a new `D<n>` row in §3 (decision, status, reason).
- Never edit or delete an old decision; mark it ⛔ "Superseded by D<n>" and add a new row.
- Bump the plan's "Last updated" date whenever §3 changes.
- Draft the Decision Log row in chat; write it only after approval.
