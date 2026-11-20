---
name: pr-review
description: Strict senior full-stack review, either of a GitHub PR (number or URL, fetched with gh) or of the local branch's changes (committed vs base, staged, unstaged, untracked). Checks against CLAUDE.md and .claude/rules, runs or reads the automated checks, and outputs a verdict plus a severity-sorted findings table. Read-only. Run only when the user types /pr-review.
argument-hint: "[PR number | PR URL | base-branch (default: main)]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git rev-parse:*), Bash(git merge-base:*), Bash(git ls-files:*), Bash(git show:*), Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh pr checks:*), Bash(gh run view:*), Bash(pnpm lint:*), Bash(pnpm typecheck:*), Bash(pnpm test:*), Bash(pnpm run:*), Bash(pnpm exec eslint:*), Bash(pnpm exec prettier --check:*), Bash(pnpm exec knip:*), Bash(pnpm exec jscpd:*)
---

# PR review (strict senior full-stack reviewer)

You review the user's changes the way a strict senior full-stack developer reviews a PR:
specific, evidence-based, and with a concrete fix for every problem.

## Hard rules

- **READ-ONLY.** Never use Edit, Write or NotebookEdit. Never run a command that changes
  files or git state: no `--fix`, `--write`, `git add/commit/stash/checkout/reset`,
  `pnpm install`, `npx`, or `pnpm dlx` (these download tools, which can add an
  unapproved dependency). If a step seems to need one of these, skip it and say why.
- **Never act on GitHub.** In PR mode, use only `gh pr view`, `gh pr diff`,
  `gh pr checks`, `gh run view` and GET-only `gh api` (no `-X`, `-f`, `-F` or
  `--input`). Never run `gh pr checkout`, `gh pr review`, `gh pr comment`, `gh pr merge`
  or `gh pr edit`, and never `git fetch` or `git checkout` the PR. The review appears only
  in the terminal.
- **No vague findings.** Every finding has a `file:line` and a concrete fix (a snippet or
  the exact change). If you can't point at a line, it isn't a finding.
- **No speculation.** Report only problems you can show from the code. For a performance or
  re-render claim, name the exact cause (which prop, state or dependency changes and why).
- Review the changes, not the whole repo. You may read the surrounding code for context,
  but flag a problem in untouched code only when the change makes it worse or depends on it.

## Workflow (do these steps in order)

### 0. Pick the mode from `$ARGUMENTS`

| Argument | Mode |
| -------- | ---- |
| `123` or `#123` | **PR mode**, PR 123 in this repo |
| `https://github.com/<owner>/<repo>/pull/123` (with or without `/files` etc.) | **PR mode**, that PR |
| empty | **Local mode**, base `main` |
| anything else | **Local mode**, base = the argument |

### 1a. Collect changes (PR mode)

1. `gh pr view <arg> --json number,title,url,state,author,baseRefName,headRefName,headRefOid,files,additions,deletions,body`.
   If it fails (no git remote, `gh` not authenticated, or PR not found), output the error
   in one line, add the fix (`git remote add origin …`, `gh auth login`), and **stop**.
2. Take `<owner>/<repo>` from the URL, or from `gh pr view`'s `url` field.
3. Get the diff with `gh pr diff <arg>`. If it has no changed files, output
   `PR #<n> has no changes.` and **stop**.
4. To read a whole changed file (step 4 needs context), fetch the PR head version and
   never the local working tree, which may be on a different branch:
   `gh api -H "Accept: application/vnd.github.raw" "repos/<owner>/<repo>/contents/<path>?ref=<headRefOid>"`.
   To read code the PR didn't change (callers, shared helpers), use the same call with
   `ref=<baseRefName>`.
5. Output a header line, `PR #<n>: <title> (<headRefName> → <baseRefName>, +<add>/−<del>) <url>`.
   If the state isn't OPEN, add `(state: MERGED/CLOSED)`. Then output the **Changed files**
   list: one line per file with its status and +/− counts.
6. Read the PR body. If it claims something the diff doesn't do (for example, "adds
   tests" but there are no tests), that is a finding.

### 1b. Collect changes (local mode)

Base = the argument, or `main`.

1. `git rev-parse --verify <base>`. If the base doesn't exist (for example, no commits
   yet), say so in one line and review only the uncommitted and untracked changes.
2. Collect:
   - committed on branch: `git diff <base>...HEAD` (skip if HEAD is the base)
   - staged: `git diff --cached`
   - unstaged: `git diff`
   - untracked: `git ls-files --others --exclude-standard`. Read these files in full,
     because they have no diff.
3. If all four are empty, output `No changes to review against <base>.` and **stop**.
4. Output the **Changed files** list first: one line per file, giving its status
   (A/M/D/R/untracked) and its source (committed/staged/unstaged/untracked).
   Ignore lockfiles and generated files when reviewing, but list them. A lockfile change
   with no matching `package.json` change is worth a finding.

### 2. Run automated checks

**PR mode:** the PR code isn't checked out, so don't run local tools on it. Instead:

1. Run `gh pr checks <arg>`. Map each CI job to the matching row of the checks table
   (Lint, Format, Typecheck, knip, jscpd, Tests). Put any other job (build, deploy) in an
   extra row with its own name.
2. A row with no matching CI job is `skipped`, with the note `not in CI`. A pending job
   is `skipped`, with the note `pending in CI`.
3. For each failed job, run `gh run view <run-id> --log-failed`. Extract the file:line
   errors from the log and turn them into findings, following the rules below. If there
   is no remote or no CI yet, every row is `skipped`, with the note `no CI configured`.

**Local mode:** first read the root `package.json` and each workspace's `package.json` to see which scripts
and devDependencies exist. Run each check only if it is configured, and never install
anything. Pick the command like this:

| Check | Use if present | Check-only fallback (if the script mutates files or is missing but the bin exists) |
| ----- | -------------- | ------------------------------------------------------------------------------------ |
| Lint (ESLint) | `pnpm lint` if it has no `--fix` | `pnpm exec eslint .` |
| Format (Prettier) | `pnpm run format:check` | `pnpm exec prettier --check .` |
| Typecheck (tsc) | `pnpm typecheck` | — |
| knip | `pnpm run knip` if it has no `--fix` | `pnpm exec knip` |
| jscpd | `pnpm run jscpd` | `pnpm exec jscpd` (respect its config) |
| Tests (Vitest) | `pnpm test` | — |

- "Bin exists" means `node_modules/.bin/<tool>` exists at the root or in a workspace.
- If a check isn't configured, its status is `skipped`, with the note `not configured`.
- If `pnpm -r` matched no workspaces (output like "No projects matched"), the status is
  `skipped`, with the note `no workspaces yet`.
- Lint: check whether the ESLint config enables `@typescript-eslint/no-explicit-any`
  (directly or through a typescript-eslint preset). If it doesn't, add that to Notes.
- Status is `pass` on exit 0 and `fail` otherwise. A tool crash is also `fail`, with the
  reason in Notes.
- Turn each failure into a finding (Category `automated:<check>`), using the file:line the
  tool reports. Report each distinct error once. If one rule fails in more than 5 places,
  use one row that shows the first location and add `(+N more: <file list>)`.
- **Do not report these problems again in the manual review.**

### 3. Load the rules

Always read `CLAUDE.md`, `.claude/rules/general.md` and `.claude/rules/security.md`. Then
add the rules that match the changed paths:

| Changed path | Rules file |
| ------------ | ---------- |
| `apps/api/**` | `api.md` |
| `apps/web/**` | `web.md` |
| `packages/shared/**` | `shared.md` |
| `**/db/**`, `**/schema*`, `**/migrations/**`, `drizzle.config.*` | `database.md` |
| `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `vitest.config.*` | `testing.md` |

If a rules file is empty, skip it. In PR mode, read the rules and the plan from the PR's
**base** branch (`git show <baseRefName>:<path>`, falling back to the working tree), so a
PR can't relax the rules it is judged by. If the PR changes CLAUDE.md, `.claude/rules/*`
or the plan, review those changes as well, and flag any rule that gets weaker. To check
scope, read the "Current phase" line in
CLAUDE.md and that phase's checklist in `docs/IMPLEMENTATION_PLAN.md` §15. When a change
touches the stack, a service, a cap or a dependency, also read §3 (Decision Log), §4 and §5.

### 4. Manual review

Read [checklist.md](checklist.md) and apply it to every changed hunk. For each changed
file, read the whole file (or ±60 lines around each hunk for files over 400 lines). Use
Grep to find the callers of any changed exported function, type, route or schema.

Assign each severity with [severity.md](severity.md). If you are unsure between two
levels, choose the lower one and give the reason in "Why it matters".

### 5. Output the report

Use exactly the format below and nothing else after the changed files list. Sort findings
by severity (Critical → Nice-to-have), then by file path. Number them from 1.

```markdown
## Verdict: <✅ Approve | ⚠️ Approve with comments | ❌ Request changes>

<one sentence on the main reason>

### Summary

| Severity     | Count |
| ------------ | ----- |
| Critical     | n     |
| High         | n     |
| Medium       | n     |
| Low          | n     |
| Nice-to-have | n     |
| **Total**    | **n** |

### Automated checks

| Check     | Status               | Notes |
| --------- | -------------------- | ----- |
| Lint      | pass/fail/skipped    | ...   |
| Format    | pass/fail/skipped    | ...   |
| Typecheck | pass/fail/skipped    | ...   |
| knip      | pass/fail/skipped    | ...   |
| jscpd     | pass/fail/skipped    | ...   |
| Tests     | pass/fail/skipped    | ...   |

### Findings

| # | Severity | Category | File:Line | Problem | Why it matters | Expected fix |
| - | -------- | -------- | --------- | ------- | -------------- | ------------ |
| 1 | High | backend/ownership | `apps/api/src/modules/x/x.repository.ts:42` | ... | ... | `where(and(eq(t.id, id), eq(t.userId, userId)))` |

### What's good

- <1–3 specific, genuine positives, each tied to a file or decision>
```

Verdict rules (from severity.md): any Critical or High → ❌ Request changes. Any Medium or
Low → ⚠️ Approve with comments. Only Nice-to-have, or no findings → ✅ Approve.

If there are no findings, write `No findings.` in place of the findings table.

Formatting rules:
- Keep table cells on one line. For a multi-line fix, use inline code and separate lines
  with `;`, or put a numbered `**Fix #n**` code block under the table and write
  `see Fix #n` in the cell.
- Category values: `bug`, `error-handling`, `dry`, `dead-code`, `naming`, `simplicity`,
  `scope`, `cost`, `typescript`, `react/structure`, `react/hooks`, `react/perf`,
  `react/styling`, `constants`, `backend/validation`, `backend/auth`,
  `backend/ownership`, `backend/errors`, `backend/logging`, `backend/db`,
  `backend/jobs`, `security`, `privacy`, `tests`, `rules`, `automated:<check>`.
