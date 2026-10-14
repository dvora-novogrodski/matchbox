import type { Components, Theme } from '@mui/material/styles';

export const MuiTableRow: Components<Theme>['MuiTableRow'] = {
    styleOverrides: {
        root: ({ theme }) => ({
            '&[data-clickable="true"]:hover': {
                backgroundColor: theme.palette.action.hover,
            },
        }),
    },
};
