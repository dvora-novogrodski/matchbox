---
name: git-workflow
description: Matchbox git conventions: one branch per feature, many small commits, then squash into master under a single Conventional Commit message. Use when creating a branch, committing, merging, finishing a feature, or when the user mentions git, commit, branch, squash, or merge.
---

# Matchbox git workflow

Default branch: `master`. One feature = one branch = one squashed commit on `master`.

## 1. Start a feature

Branch from an up-to-date `master`. Never work on `master` directly.

```bash
git switch master && git pull --ff-only
git switch -c <type>/<short-kebab-name>
```

Branch name: `<type>/<short-kebab-name>`, e.g. `feat/career-profile`, `fix/status-category`, `chore/monorepo-scaffold`.
Prefer one HLD feature or milestone item per branch (F2, F4, M0 schema, ...).

## 2. Commit as often as needed

Branch commits are working history and will be squashed, so keep them small and frequent, but still use the format:

```
<type>(<scope>): <imperative subject, lowercase, no period, <= 72 chars>
```

- **type**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `build`, `perf`
- **scope** (optional): `web`, `api`, `ai`, `shared`, `infra`, `docs`, or a feature id like `f2`
- Only commit when the user asks, or when the plan says to. Never commit `.env` or secrets.
- Never use `--no-verify`, never amend or force-push commits that were already pushed.

## 3. Finish: squash into master

The squashed commit is the feature's name. Its message:

```
<type>(<scope>): <feature name>

<optional body: what and why, a few lines, plus "Refs: F2, M1" if relevant>
```

Default: squash locally.

```bash
git switch master && git pull --ff-only
git merge --squash <branch>
git commit -m "<type>(<scope>): <feature name>"
git branch -D <branch>        # -D is needed because squash merges are not "merged" to git
```

Push, PR creation, and remote branch deletion only when the user asks. If a PR is used, merge it with **Squash and merge** and use the same message as the PR title.

## Checklist before squashing

- [ ] Tests/lint for the touched deployable pass
- [ ] `git status` is clean, no stray files
- [ ] Squash message names the feature, not the last small step
