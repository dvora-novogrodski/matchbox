---
name: git-workflow
description: Matchbox git conventions: one branch per feature, Conventional Commits, and exactly one commit per feature on master. Never squash different features into one commit. Use when creating a branch, committing, merging, finishing a feature, or when the user mentions git, commit, branch, squash, or merge.
---

# Matchbox git workflow

Default branch: `master`. The rule that everything else serves: **one feature = one commit on `master`**. Two features are never combined into one commit, even if they were developed together.

A feature is a change that can be described, reviewed, and reverted on its own: a package, an app capability, a docs set, a dependency upgrade, a file move. Examples of separate features: "add design system package", "add i18n to web", "add coding conventions", "move design docs".

## 1. Start a feature

Branch from an up-to-date `master`. Never work on `master` directly.

```bash
git switch master && git pull --ff-only
git switch -c <type>/<short-kebab-name>
```

Branch name: `<type>/<short-kebab-name>`, e.g. `feat/career-profile`, `fix/status-category`, `chore/monorepo-scaffold`.
Prefer one HLD feature or milestone item per branch (F2, F4, M0 schema, ...).

If the user asks for an unrelated change while a feature branch is open, start a new branch for it from `master` (or, if it is already mixed into the working tree, keep it as a separate commit as in section 2).

## 2. Commit

Format:

```
<type>(<scope>): <imperative subject, lowercase, no period, <= 72 chars>
```

- **type**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `build`, `perf`
- **scope** (optional): `web`, `api`, `ai`, `ui`, `shared`, `infra`, `docs`, or a feature id like `f2`
- Only commit when the user asks, or when the plan says to. Never commit `.env` or secrets.
- Never use `--no-verify`, never amend or force-push commits that were already pushed.

When the working tree holds more than one feature, split it: one commit per feature, staging only that feature's files. If one file has changes for several features (READMEs, `package.json`), stage only the relevant lines. Shared generated files that cannot be split (`package-lock.json`) go with the feature that needs them most; say so to the user.

Small work-in-progress commits inside one feature are fine; they get squashed in section 3.

## 3. Merge into master

First decide which case applies, by reading `git log master..<branch>`:

**A. The branch holds one feature** (possibly in many WIP commits): squash it into one commit.

```bash
git switch master && git pull --ff-only
git merge --squash <branch>
git commit -m "<type>(<scope>): <feature name>"
git branch -D <branch>        # -D is needed because squash merges are not "merged" to git
```

**B. The branch holds several features**, each already one commit (as produced by section 2): keep the commits. Never squash them together.

```bash
git switch master && git pull --ff-only
git rebase master <branch>    # only if master moved; skip if the branch is already on top
git switch master
git merge --ff-only <branch>
git branch -d <branch>
```

**C. The branch holds several features spread over WIP commits**: tidy the branch first so each feature is exactly one commit (`git reset --soft master`, then re-commit per feature as in section 2), then merge as in case B. If the branch was already pushed, ask the user before rewriting it.

Message of each commit that lands on `master`:

```
<type>(<scope>): <feature name>

<optional body: what and why, a few lines, plus "Refs: F2, M1" if relevant>
```

If unsure whether two changes are one feature or two, treat them as two, or ask.

Push, PR creation, and remote branch deletion only when the user asks. If a PR is used: one feature per PR merged with **Squash and merge** (PR title = commit message), or, for a multi-feature branch, **Rebase and merge**. Never **Squash and merge** a multi-feature PR.

## Checklist before merging

- [ ] Tests/lint for the touched deployables pass
- [ ] `git status` is clean, no stray files
- [ ] `git log master..<branch>` shows exactly one commit per feature
- [ ] Each commit message names its feature, not the last small step
