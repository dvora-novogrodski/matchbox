import type { Components, Theme } from '@mui/material/styles';

export const MuiCard: Components<Theme>['MuiCard'] = {
    defaultProps: {
        elevation: 0,
    },
    styleOverrides: {
        root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 12,
            boxShadow: 'none',
            '&[data-clickable="true"]:hover': {
                borderColor: theme.palette.surface[500],
            },
        }),
    },
};
