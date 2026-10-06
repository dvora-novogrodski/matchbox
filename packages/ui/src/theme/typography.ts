import type { TypographyVariantsOptions } from '@mui/material/styles';
import { fontFamily } from '../tokens';

// Variants not listed keep MUI's defaults.
export const typography: TypographyVariantsOptions = {
    fontFamily,
    button: { textTransform: 'none' },
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontSize: '2.75rem', fontWeight: 700 },
    h4: { fontSize: '2rem', fontWeight: 700 },
    h5: { fontWeight: 700 },
    subtitle1: { fontWeight: 500, lineHeight: 1.3 },
    subtitle2: { lineHeight: 1.3 },
};
