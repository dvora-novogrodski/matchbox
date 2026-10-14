import type { Components, Theme } from '@mui/material/styles';

export const MuiDrawer: Components<Theme>['MuiDrawer'] = {
    styleOverrides: {
        paper: {
            borderRadius: 0,
        },
    },
};
