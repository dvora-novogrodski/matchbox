import type { Components, Theme } from '@mui/material/styles';

export const MuiBadge: Components<Theme>['MuiBadge'] = {
    styleOverrides: {
        badge: {
            minWidth: 18,
            height: 18,
            paddingInline: 4,
        },
    },
};
