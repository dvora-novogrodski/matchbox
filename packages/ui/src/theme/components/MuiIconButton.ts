import type { Components, Theme } from '@mui/material/styles';

export const MuiIconButton: Components<Theme>['MuiIconButton'] = {
    styleOverrides: {
        root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
        }),
    },
};
