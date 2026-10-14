import type { TypographyVariantsOptions } from '@mui/material/styles';

import { fontFamily } from '../tokens';

export const typography: TypographyVariantsOptions = {
    fontFamily,
    button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' },
    h1: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem', fontWeight: 400 },
    body2: { fontSize: '0.8125rem', fontWeight: 400 },
    caption: { fontSize: '0.75rem', fontWeight: 400 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.3 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.3 },
};
