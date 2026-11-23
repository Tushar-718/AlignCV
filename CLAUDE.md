# AlignCV

## Project summary
AlignCV tailors a user's base resume to a target role or job description. The AI suggests
edits as JSON Patch ops, the user accepts or rejects each one, ATS and fitness scores update
live, and the tailored resume downloads as a PDF. It is a portfolio project for a backend
job hunt, and the live demo URL goes on the owner's resume, so it must always work.

**Current phase: 0 (setup).** Update this line when a phase is complete.

## Source of truth
- `docs/IMPLEMENTATION_PLAN.md` is the source of truth. Read the sections relevant to the
  task before starting. Don't work from memory of the plan.
- If a request conflicts with the plan, stop and name the conflicting section. The plan wins
  until I change it.
- Rules for each area live in `.claude/rules/`.

## Non-negotiable rules
1. **$0 cost.** Never add a dependency, external service or API with a paid tier, or one
   that needs a credit card, without my explicit OK in this session.
2. **Scores are code.** Only the deterministic functions in `packages/shared` compute ATS
   and fitness scores. No LLM call may appear anywhere in a scoring code path.
3. **AI never fabricates.** A suggestion that adds a skill must have
   `requiresConfirmation: true`. Patch ops that touch contact info, dates or employer names
   are rejected during validation.
4. **Never trust the client.** `POST /tailored-resumes` re-applies the accepted patches to
   the stored `base_snapshot` and recomputes scores. Client content and scores are never
   stored.
5. **Privacy.** Never persist uploaded files or raw extracted text. Never pass resume
   content, JD text, tokens or passwords to the logger.
6. **Demo always works.** `/demo` and `GET /health` make no AI calls. `GET /health` makes no
   DB or Redis query.

## How to work with me
- I'm a React Native developer moving to full stack. I know the backend concepts but have
  little hands-on practice with them.
- **You write:** config, boilerplate, wiring, scaffolding, UI plumbing.
  **I write:** auth and token logic, scorers, patch apply and save verification, AI
  provider and prompts, RBAC.
- For core logic I write: create the types, function signatures and failing Vitest tests,
  then stop. I implement it. You review it when I ask.
- Explain backend concepts by comparing them to React or React Native (for example,
  middleware is like a chain of HOCs around a request). Keep it to a few sentences.
- **Ask before:** adding a dependency, creating or changing a schema or migration, touching
  auth or security code, deleting files, or editing the plan. Otherwise go ahead.
- If you think the plan is wrong, stop the task, explain the problem and your alternative,
  and wait for my decision. Don't touch the Decision Log until I decide.
- **Git:** never run git commands that change state (commit, branch, checkout, stash,
  reset, push). Read-only commands (status, diff, log) are fine. At the end of a task,
  suggest a conventional commit message.
- **Replies:** keep them short: what changed, why, how I can verify it, and the next step.

## Repo map
- `apps/web`: Next.js App Router. Rewrites `/api/*` to the API so cookies are first-party.
- `apps/api`: Express. Layers are routes → controllers → services → repositories, with
  feature modules in `src/modules/*`. The BullMQ worker runs in the same process.
- `packages/shared`: zod schemas, role profiles, scorers and JSON Patch helpers. Both apps
  import it, so it must run in the browser and in Node (no Node-only APIs).
- `docs/`: the implementation plan. `.claude/skills/pr-review`: the PR review skill.

## Commands
- `pnpm install`: install all workspaces
- `pnpm dev`: run web and api in parallel. TODO: verify once the apps exist
- `pnpm test` / `pnpm typecheck` / `pnpm build`: run across all workspaces
- TODO: start local Postgres and Redis (docker compose)
- TODO: generate a migration / apply migrations (drizzle-kit)
- TODO: run a single test file
- `pnpm lint` / `pnpm lint:fix`: ESLint across the repo (one root `eslint.config.mjs`)
- `pnpm format` / `pnpm format:check`: Prettier (docs/, CLAUDE.md and .claude/ are ignored)
- Git hooks (Husky): pre-commit runs lint-staged; commit-msg runs commitlint
