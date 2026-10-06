# Frontend conventions (React, `apps/web`)

## 1. Stack

- Vite, React 19, TypeScript strict.
- `@matchbox/ui` (see [design-system.md](./design-system.md)) for all UI. No Tailwind, no CSS frameworks, no direct `@mui/*` imports in `apps/web`.
- TanStack Query for server state, React Router for routing, react-hook-form + Zod for forms, Axios for HTTP, i18next for text, Firebase client SDK for sign-in.
- No global state library. TanStack Query plus URL state covers a single-user SPA.

## 2. Folder structure

Matchbox has many distinct features (HLD section 4), so the top level is organized by feature, with layer folders inside each feature.

```
apps/web/src/
  main.tsx
  app/
    App.tsx                    # providers + RouterProvider
    router.tsx                 # route table, lazy feature routes
    query-client.ts
    providers/AppProviders.tsx # ThemeProvider, QueryClientProvider, AuthProvider
  features/
    <feature>/                 # today, discover, pipeline, job, profile, companies, settings, auth
      pages/
        PipelinePage/
          PipelinePage.tsx
          PipelinePage.test.tsx
      components/
        ApplicationCard/
          ApplicationCard.tsx
          ApplicationCard.test.tsx
          index.ts
      hooks/
        usePipelineFilters.ts
      api/
        applications.api.ts    # typed calls to the API
        applications.queries.ts # query keys + useQuery/useMutation hooks
      types/
        pipeline.types.ts
      pipeline.constants.ts
      index.ts                 # public surface of the feature: routes and anything other features may use
  components/                  # app-level shared components (AppShell, PageHeader, AiUnavailable)
  hooks/                       # app-level shared hooks
  i18n/
    i18n.ts                    # i18next setup, SUPPORTED_LANGUAGES
    i18next.d.ts               # typed translation keys
    locales/
      en/
        common.json
        <feature>.json
  lib/
    env.ts                     # validated VITE_* values
    http/                      # Axios instance, interceptors, ApiError
    firebase/
  utils/
  test/                        # test setup, render helpers, builders
```

Rules:

- A feature imports another feature only through that feature's `index.ts`. No deep imports across features.
- Shared code moves to `src/components/` or `src/hooks/` only once a second feature needs it.
- A component that is generic (no Matchbox domain knowledge) belongs in `@matchbox/ui`, not in `src/components/`.

## 3. Components

```tsx
type ApplicationCardProps = {
    application: Application;
    onOpen: (applicationId: string) => void;
};

export function ApplicationCard({ application, onOpen }: ApplicationCardProps) {
    const { t } = useTranslation('pipeline');

    return (
        <Card data-test={`pipeline-application-card-${application.id}`}>
            <Button onClick={() => onOpen(application.id)}>{t('card.open')}</Button>
        </Card>
    );
}
```

- Function declarations with named exports. No default exports, including pages; React Router's `lazy` reads a named `Component` export from the feature's route module. Named exports keep renames and refactors safe.
- Props are a `type` named `<Component>Props`, declared just above the component and exported only when another file needs it.
- One exported component per file. Small private subcomponents may share the file.
- Component files and folders are PascalCase. Hooks are `useXxx.ts`. Everything else is kebab-case with a role suffix: `applications.api.ts`, `pipeline.types.ts`, `date.utils.ts`.
- Order inside a component: hooks, derived values, handlers, early returns, JSX.
- Styling goes through `@matchbox/ui` variants and props. `sx` is for layout only (spacing, flex, grid). If a visual style is needed twice, it becomes a variant in the design system.

## 4. Server state and HTTP

- All API calls go through the Axios instance in `lib/http/`. Its request interceptor adds the Firebase ID token and an `x-request-id`; its response interceptor converts error bodies into `ApiError` (`statusCode`, `code`, `message`, `requestId`), matching the backend error shape.
- Each feature has an `*.api.ts` module with plain typed functions, and an `*.queries.ts` module with a query key factory and hooks. The key factory keeps invalidation correct when features share data (Pipeline, Today, Job page).

```typescript
export const applicationKeys = {
    all: ['applications'] as const,
    list: (filters: ApplicationFilters) => [...applicationKeys.all, 'list', filters] as const,
    detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
};

export function useApplications(filters: ApplicationFilters) {
    return useQuery({
        queryKey: applicationKeys.list(filters),
        queryFn: () => applicationsApi.list(filters),
    });
}

export function useSaveJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: applicationsApi.saveJob,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
    });
}
```

- Hook names: `useXxx` for queries, `use<Verb><Noun>` for mutations (`useSaveJob`, `useAcceptCvChange`).
- Components never call `*.api.ts` directly; they use the hooks.
- `QueryClient` defaults: `refetchOnWindowFocus: false`, `retry: 1` for queries, no retry for mutations, and a global `onError` on the mutation cache that shows a toast.
- Async tasks (Discover runs, re-indexing; HLD D3) are polled with `refetchInterval` until the task reaches a final state.
- **AI-dependent UI must handle degradation (D6).** A `503` with code `AI_UNAVAILABLE` or a `429` budget error renders the shared `AiUnavailable` state inside the affected panel. The page around it keeps working.

## 5. Client state

- Server data lives only in TanStack Query. Do not copy it into context or component state.
- Filter, sort, view mode (board or table), and selected tab live in the URL search params, so views are linkable.
- React context only for app-wide concerns: auth session and toasts.

## 6. Routing

- React Router in data mode (`createBrowserRouter`), defined in `app/router.tsx`.
- Each feature exposes its routes from its `index.ts`, lazy-loaded so each feature is its own chunk.
- Paths are kebab-case and mirror the API resources: `/today`, `/discover`, `/pipeline`, `/jobs/:jobId/:tab?`, `/profile`, `/companies`, `/settings`.
- Authenticated routes sit under one layout route that redirects to `/login` when there is no session.

## 7. Forms

- react-hook-form with `zodResolver`. The schema comes from `@matchbox/shared` whenever the form submits to the API, so the client and server validate with the same rules.
- Use the design system form components, connected with `Controller`. Show field errors under the field and the API error at the top of the form.
- Validation messages are translation keys, resolved with `t()` when shown.

## 8. Text and i18n

English is the only language today. All text still goes through i18next, so adding a language later means adding translation files, not touching components.

- Setup lives in `src/i18n/i18n.ts`: `i18next` + `react-i18next`, `SUPPORTED_LANGUAGES = ['en']`, English resources bundled with the app.
- **Every user-visible string goes through `t()`**: labels, buttons, headings, placeholders, `aria-label`, toasts, empty states, page titles. Enforced with `eslint-plugin-i18next` (`no-literal-string` in JSX).
- Not translated: user data (job titles, company names, CV content, custom status names), log messages, `data-test` values, and API error `code` values.
- Namespaces: `common` for text shared across the app (app shell, generic actions, system status names, error messages) and one namespace per feature, named like the feature folder (`pipeline`, `job`, `profile`). A feature reads its own namespace: `useTranslation('pipeline')`.
- Files: `src/i18n/locales/<language>/<namespace>.json`. Each new namespace is also registered in `resources` in `i18n.ts`.
- Keys are camelCase, nested by area, and describe the purpose rather than the wording: `board.emptyColumn`, `card.open`, not `noApplicationsYet`.
- **Keys are typed.** `src/i18n/i18next.d.ts` declares the English resources as the key type, so a missing or misspelled key is a compile error. Dynamic keys must be built from typed unions (for example `statuses.${SystemStatusKey}`), never from free strings.
- Never concatenate translated fragments. Use interpolation (`"Applied {{days}} days ago"`), plurals with `count` (`_one` / `_other` suffixes), and `<Trans>` when a sentence contains markup.
- API errors are shown by code: the UI looks up `errors.<CODE>` in `common` and falls back to `errors.generic`. The server's `message` is for logs and debugging, not for display.
- Dates, numbers, and relative times use `Intl` with `i18n.language`, through helpers in `utils/format.utils.ts`. No hard-coded date formats.
- Tests initialize i18n with the real English resources (`src/test-setup.ts`), so tests assert the English text a user sees.

Adding a language later:

1. Add `src/i18n/locales/<language>/` with the same files as `en/`.
2. Add the language to `SUPPORTED_LANGUAGES`, add `i18next-browser-languagedetector` and a language switcher in Settings, and lazy-load non-English resources.
3. For a right-to-left language such as Hebrew, set `dir` on `<html>` from the language and enable RTL support in the design system.

## 9. Environment

- Only `VITE_*` variables reach the browser. They are read in one place, `lib/env.ts`, validated with Zod at startup. No `import.meta.env` anywhere else.
- No secrets in `VITE_*` variables. Firebase web config is public by design; anything else stays on the API.

## 10. Test ids and accessibility

- Use `data-test`, with the pattern `<feature>-<context>-<element>`: `pipeline-board-column-applied`, `job-tailor-cv-button`, `profile-career-item-delete-button-${itemId}`.
- Required on buttons, inputs, dialogs, tabs, and loading states. Not needed on text, icons, or layout boxes.
- Never rename an existing `data-test` value without updating every test that uses it.
- Semantic HTML first: real buttons and links, labelled inputs, headings in order. Tests prefer `getByRole` and `getByLabelText`; `data-test` is the fallback.

## 11. Changes needed in the current scaffold

- `src/lib/api/client.ts` reads `import.meta.env` directly and uses `fetch`. Replace it with `lib/env.ts` and `lib/http/`.
- `App.tsx` uses inline styles and `data-testid`. Move to `@matchbox/ui` and `data-test`, and configure Testing Library's `testIdAttribute`.
- Add React Router, TanStack Query, react-hook-form, and `@matchbox/ui`.
