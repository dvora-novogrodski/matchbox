import type { Components, Theme } from '@mui/material/styles';

export const MuiTableCell: Components<Theme>['MuiTableCell'] = {
    styleOverrides: {
        root: ({ theme }) => ({
            borderColor: theme.palette.divider,
            padding: theme.spacing(1.25, 2),
        }),
        head: ({ theme }) => ({
            ...theme.typography.subtitle2,
            backgroundColor: theme.palette.surface[50],
            color: theme.palette.text.secondary,
            fontWeight: 500,
            whiteSpace: 'nowrap',
        }),
    },
};
