# Design system conventions (`packages/ui`, `@matchbox/ui`)

## 1. Principles

- **Built on MUI.** `@mui/material` with Emotion supplies behavior and accessibility; Matchbox supplies the tokens, the theme, and a small set of components.
- **The visual system lives in the theme**, not in components. Colors, typography, radii, and per-component styles are theme configuration; components stay thin.
- **Only what the app needs.** A component enters `@matchbox/ui` only when `apps/web` needs it. There is no attempt to mirror MUI's catalog.
- **One package, no build step.** Tokens, theme, components, and icons are folders in one package that ships TypeScript source, like `@matchbox/shared`. Vite compiles it as part of the web app.

## 2. Structure

```
packages/ui/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts                 # public barrel: ThemeProvider, hooks, components, icons
    tokens/                  # primitives: no MUI imports
      colors.ts              # raw scales: teal, coral, warm
      typography.ts          # font family
      shape.ts               # border radius and multipliers
      index.ts
    theme/
      palette.ts             # light and dark semantic palettes built from tokens
      typography.ts          # typography variants
      z-index.ts             # layering values
      components/            # one style config per MUI component
        MuiButtonBase.ts
        index.ts
      create-theme.ts        # createMatchboxTheme(), disabledOf()
      augmentations.ts       # module augmentation: custom palette keys, shape keys, color overrides
      ThemeProvider.tsx
      index.ts
    components/              # one folder per component, added on demand
      Button/
        Button.tsx           # only when the API differs from MUI; otherwise index.ts re-exports
        Button.test.tsx
        index.ts
    icons/                   # one file per icon, added on demand
```

## 3. Color

Two layers, based on Happy Hues palette #8:

1. **Raw scales** in `src/tokens/colors.ts`: `teal` (50–900), `coral` (100–600), and `warm` neutrals (0–900).
2. **Semantic palettes** in `src/theme/palette.ts`, one for light and one for dark. One-off semantic values (feedback colors, dark-mode shades, status chips) are written there directly.

| Key | Light main | Dark main | Use |
| --- | --- | --- | --- |
| `primary` | teal 500 `#078080`, white text | `#4DB8B8`, dark text | Main actions, links, selected state |
| `secondary` | warm 800 `#232323` | `#DFD8D0` | Secondary actions |
| `accent` | coral 500 `#F45D48`, dark text | coral 400 | Signature accent only: highlights, illustration, the "flame" |
| `error` | `#B42318` | `#EE7B6F` | A deeper crimson, so it never reads as the decorative coral |
| `warning` / `info` / `success` | `#9A5F0E` / `#3B6E9E` / `#2E7D46` | `#E0A85A` / `#86AACB` / `#6FBF8A` | Feedback |
| `text` | primary warm 800, secondary warm 700, tertiary warm 600, disabled warm 500 | `#F2EFEC` to `#6E6A66` | `text.tertiary` is a custom key |
| `background` | default warm 100, paper warm 0 | `#1A1917` / `#22211F` | |
| `surface` | 50–500 from the warm scale | `#22211F` to `#413E3A` | Layered surfaces (board columns, panels) |
| `status` | `{ bg, fg }` for `applied`, `interview`, `offer`, `closed` | Dark equivalents | Pipeline status chips. `closed` ("Not this time") is neutral, not red |
| `grey` | The warm scale | The warm scale | So MUI components that use `grey` stay warm |
| `action`, `divider` | Warm 800 and teal at low alpha | Light text and dark-mode teal at low alpha | Hover, selected, focus, disabled |

- Light-mode `main` colors used with white text have at least 4.5:1 contrast: teal 4.8:1, error 6.6:1, warning 5.2:1, info 5.4:1, success 5.1:1. Coral takes dark text (4.9:1). The same `main` can therefore be used for text and for filled backgrounds.
- `disabledOf(color)` returns a color at 38% alpha, for disabled states outside MUI's built-in handling.
- **No hex values outside `src/tokens/` and `src/theme/palette.ts`.** Components read colors from the theme (`theme.palette.primary.main` or `theme.vars.palette.primary.main`).

## 4. Typography, shape, and layout

- **Font:** DM Sans for every role (headings, subtitles, body, buttons), with Roboto as the fallback, self-hosted with `@fontsource-variable/dm-sans`.
- **Variants:** h1, h2, h5 weight 700; h3 `2.75rem` / 700; h4 `2rem` / 700; subtitle1 weight 500, line height 1.3; subtitle2 line height 1.3; `button.textTransform: 'none'`. All other variants keep MUI's defaults.
- **Shape:** `borderRadius: 4`. `shape.borderRadiusMultipliers` (`[0, 1, 1, 1, 1]`) gives radius steps 0–4 for style configs that need larger radii: `theme.shape.borderRadius * theme.shape.borderRadiusMultipliers[2]`.
- **Spacing:** MUI's default 8 px unit.
- **z-index:** app bar 1100, drawer 1200, modal 1300, snackbar 1400, tooltip 1500.
- **Shadows and breakpoints:** MUI defaults.
- **Global component defaults:** `MuiButtonBase.defaultProps.disableRipple = true`. Component sizes default to MUI's `medium`.

## 5. Theme and provider

- `createMatchboxTheme()` builds one MUI theme with both color schemes (`colorSchemes.light` and `colorSchemes.dark`) and CSS variables switched by a class on the root element (`colorSchemeSelector: 'class'`).
- `<ThemeProvider colorScheme="auto">`, where `colorScheme` is `'auto' | 'light' | 'dark'`. It also renders `CssBaseline`.
- RTL is not wired. If a right-to-left language is added (see the i18n section of [frontend-react.md](./frontend-react.md)), add a `DirectionProvider` that sets the theme direction and an Emotion cache with `stylis-plugin-rtl`.

## 6. Adding a component

1. Confirm that `apps/web` needs it, and that it is generic (no Matchbox domain knowledge). A `JobCard` belongs in `apps/web`; a `Card` belongs here.
2. Define its look in the theme first: create `theme/components/Mui<Name>.ts` with `defaultProps`, `styleOverrides`, and `variants`, and register it in `theme/components/index.ts`. Use theme values only: palette keys, `theme.spacing`, `theme.shape`, typography variants. Related MUI parts get their own file (`MuiInputBase` and `MuiOutlinedInput` for `TextField`).
3. Create `components/<Name>/index.ts`:
   - If the MUI API is enough, re-export it: `export { default as Button } from '@mui/material/Button'; export type { ButtonProps } from '@mui/material/Button';`
   - If the API needs to change (a new prop or restricted props), write `<Name>.tsx` as a function component that wraps the MUI component. In React 19, `ref` is a regular prop, so `forwardRef` is not needed.
4. Add custom colors, sizes, or variants to `theme/augmentations.ts` so TypeScript accepts them (for example `ButtonPropsColorOverrides { accent: true }`).
5. Export it from `src/index.ts`.
6. Add a test when the component has its own logic. Pure re-exports need no test.
7. The design system contains no user-visible text. Any text a component needs (a close button's `aria-label`, an empty-state message) is a prop, so the app passes it through `t()`.

Storybook is added together with the first components, with a story per component and a toolbar switch for light and dark mode.

## 7. Rules for consumers

- `apps/web` imports UI only from `@matchbox/ui`, never from `@mui/*`. This is enforced with ESLint `no-restricted-imports`.
- If something is missing, add it to the design system instead of styling around it in the app.
- `sx` in the app is for layout only (see [frontend-react.md](./frontend-react.md)).

## 8. Icons

- Start from `@mui/icons-material`, re-exported by name from `src/icons/index.ts` so that only used icons are listed and the app never imports the icon library directly.
- Custom icons: an `SvgIcon` wrapper, 24×24 viewBox, no `fill` on paths (so the icon takes the text color), one file per icon, named `<Name>Icon`.
