# @matchbox/ui

Matchbox design system: MUI with Matchbox tokens, theme, and a small set of components added as the web app needs them.

```tsx
import { ThemeProvider } from '@matchbox/ui';

<ThemeProvider colorScheme="auto">
    <App />
</ThemeProvider>;
```

- `src/tokens/` color scales, type scale, radii. The only place hex values appear.
- `src/theme/` palettes, typography, per-component style configs, `createMatchboxTheme`, `ThemeProvider`.
- `src/components/` one folder per component.
- `src/icons/` icons used by the app.

Conventions and how to add a component: [docs/conventions/design-system.md](../../docs/conventions/design-system.md).
