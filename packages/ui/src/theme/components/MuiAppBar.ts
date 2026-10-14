import type { Components, Theme } from '@mui/material/styles';

export const MuiAppBar: Components<Theme>['MuiAppBar'] = {
    defaultProps: {
        color: 'inherit',
        elevation: 0,
    },
    styleOverrides: {
        root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
            '&[data-floating="true"]': {
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.spacing(1.5),
                boxShadow: theme.shadows[1],
                margin: theme.spacing(2, 'auto', 0),
                maxWidth: theme.breakpoints.values.xl,
                top: theme.spacing(2),
                width: `calc(100% - ${theme.spacing(8)})`,
            },
            [theme.breakpoints.down('sm')]: {
                '&[data-floating="true"]': {
                    marginTop: theme.spacing(1),
                    top: theme.spacing(1),
                    width: `calc(100% - ${theme.spacing(2)})`,
                },
            },
        }),
    },
};
