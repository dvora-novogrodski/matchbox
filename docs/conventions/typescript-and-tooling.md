# TypeScript and tooling conventions

Applies to every TypeScript package: `apps/api`, `apps/web`, `packages/*`.

## 1. Formatting

One Prettier config and one `.editorconfig` at the repo root:

```json
{
    "printWidth": 120,
    "singleQuote": true,
    "trailingComma": "all"
}
```

```ini
root = true

[*]
indent_style = space
indent_size = 4
charset = utf-8
insert_final_newline = true
end_of_line = lf

[*.{yml,yaml,json,md}]
indent_size = 2
```

The same style applies to frontend and backend code, so there is one way to format TypeScript in the repo.

## 2. TypeScript

- `strict: true` everywhere, plus `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
- `any` is an ESLint error. When it is unavoidable, use `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- <reason>`. Prefer `unknown` and narrow it.
- Use `type`, not `interface`, except for module augmentation (which requires `interface`). No `I` prefix.
- No TypeScript `enum`. Use a Zod enum, or a `const` array or object with a derived union, as `@matchbox/shared` already does:

```typescript
export const STATUS_CATEGORIES = ['open', 'active', 'interviewing', 'offer', 'closed'] as const;
export type StatusCategory = (typeof STATUS_CATEGORIES)[number];
```

- Inline type imports: `import { type Application, toApplicationResponse } from './applications.mapper';`
- Explicit return types are optional. Add one when inference would produce a wide type or leak an implementation type, and on every function exported from `packages/*`.
- Prefer `async`/`await` over `.then` chains. Every promise is awaited, returned, or explicitly marked with `void`.
- Prefer small, single-purpose functions. A helper with side effects belongs in a service, not a `*.utils.ts` file.

## 3. Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Backend files | kebab-case with role suffix | `career-items.service.ts`, `cv-change.mapper.ts` |
| React components | PascalCase folder and file | `ApplicationCard/ApplicationCard.tsx` |
| Hooks | camelCase `use` prefix | `useSaveJob.ts` |
| Other frontend files | kebab-case with role suffix | `applications.queries.ts` |
| Classes, types, components | PascalCase | `ApplicationsService`, `CvChange` |
| Functions, variables | camelCase | `toApplicationResponse` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_TAILOR_CHANGES` |
| Ports and repositories (DI tokens) | Abstract class, PascalCase; implementation prefixed by technology | `TaskQueue` / `CloudTasksQueue`, `ApplicationsRepository` / `PrismaApplicationsRepository` |
| Env vars | `SCREAMING_SNAKE_CASE`; browser-visible ones start with `VITE_` | `AI_TIMEOUT_MS`, `VITE_API_URL` |
| Booleans | `is`, `has`, `can`, `should` prefix | `isBaseCv` |
| Unused parameters | `_` prefix | `_context` |

Role suffixes: `.module`, `.controller`, `.service`, `.repository`, `.mapper`, `.dto`, `.types`, `.errors`, `.constants`, `.guard`, `.decorator`, `.filter`, `.interceptor`, `.client`, `.port`, `.utils`, `.api`, `.queries`, `.spec`, `.test`, `.e2e-spec`.

## 4. Imports

- Order: Node built-ins and external packages, then `@matchbox/*`, then `src/...`, then relative. Enforced with `eslint-plugin-simple-import-sort`.
- `apps/api` imports across features with `src/...`; relative paths only inside a feature folder.
- `apps/web` uses the same `src/...` alias, configured in both `tsconfig.json` and Vite.
- No barrels inside `apps/api/src`. In `apps/web`, each feature's `index.ts` is its public surface. Each package has one root `index.ts`.

## 5. ESLint

One flat config, `eslint.config.mjs`, at the root, with overrides per package:

- All TypeScript: typescript-eslint `recommended-type-checked`, `eslint-config-prettier`, `no-unused-vars` (except `_`-prefixed names), `require-await`, `no-floating-promises`, `no-misused-promises`, `no-explicit-any`, `consistent-type-imports`, `no-console`, and `simple-import-sort`.
- `apps/web` and `packages/ui`: `react-hooks`, `jsx-a11y`.
- `apps/web`: `no-restricted-imports` for `@mui/*` (use `@matchbox/ui`), and for other features' internals; `i18next/no-literal-string` for JSX text.
- `apps/api`: `no-restricted-imports` for `**/dto/**` in `*.service.ts` and `*.repository.ts`, and for `@prisma/client` and `PrismaService` outside `prisma-*.repository.ts` and `src/common/prisma/`.

## 6. Scripts

Every package exposes the same script names so the root can run them with `--workspaces --if-present`:

| Script | Purpose |
| --- | --- |
| `build` | Production build |
| `dev` / `start:dev` | Watch mode |
| `lint` | ESLint with `--fix` |
| `lint:ci` | ESLint without fixing, used in CI |
| `typecheck` | `tsc --noEmit` |
| `test` | Unit tests with coverage |
| `test:e2e` | API end-to-end tests |
| `format` | Prettier write |

## 7. Git hooks

- Husky `pre-commit`: `lint-staged` runs `eslint --fix` and `prettier --write` on staged files.
- Husky `commit-msg`: commitlint with `@commitlint/config-conventional`, matching the [git-workflow skill](../../.cursor/skills/git-workflow/SKILL.md). Scopes are `web`, `api`, `ai`, `ui`, `shared`, `infra`, `docs`, or a feature id.

## 8. Node and dependencies

- Node 24 LTS, recorded in `.nvmrc` and `engines`.
- npm workspaces, one root `package-lock.json`. `^` ranges, with Renovate opening grouped weekly updates.
- Shared libraries in a single version across the monorepo (one React, one Zod, one TypeScript). Run `npm dedupe` after upgrades.
- `@matchbox/shared` is imported by both the web app and the API. Vite compiles its TypeScript source directly, but the API runs compiled JavaScript, so `shared` needs a build step (`tsc` to `dist/` with `exports` pointing at it) before the API first imports it.

## 9. Comments

- Comments explain constraints or reasons the code cannot show. Do not narrate the code.
- JSDoc on exported functions in `packages/*` and on non-obvious helpers. Reference HLD ids (`F8`, `D6`) where a rule comes from the design.

## 10. Changes needed in the current scaffold

- Add the root `.prettierrc`, `.editorconfig`, `eslint.config.mjs`, `.nvmrc`, Husky, lint-staged, and commitlint.
- Reformat existing files from 2-space to 4-space indentation.
- Add `lint`, `lint:ci`, and `typecheck` scripts to `apps/api`, `apps/web`, and `packages/shared`.
- Give `@matchbox/shared` a build step before the API imports it.
