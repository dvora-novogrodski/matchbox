import type { Components, Theme } from '@mui/material/styles';

export const MuiToolbar: Components<Theme>['MuiToolbar'] = {
    styleOverrides: {
        root: ({ theme }) => ({
            minHeight: theme.spacing(8),
            [theme.breakpoints.up('sm')]: {
                minHeight: theme.spacing(8),
            },
        }),
    },
};
