# apps/web

React + TypeScript, built as static files. Talks only to `apps/api` (D2).

```
src/
  app/          Router, providers, layout shell
  features/     One folder per product area
    auth/       Login/sign-up screens, Firebase client SDK (F1)
    profile/    Career items and base CV (F2)
    pipeline/   Board and table views (F4)
    job/        Job page tabs: Overview, Match, CV, Kit, Timeline (F5)
    today/      Prioritized action list (F10)
    discover/   Review queue for found jobs (F9)
    companies/  Company registry (F19)
    settings/   GitHub, search prefs, custom statuses (F14)
  components/   Shared UI components
  lib/api/      API client
```
