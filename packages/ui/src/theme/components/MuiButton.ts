import type { Components, Theme } from '@mui/material/styles';

export const MuiButton: Components<Theme>['MuiButton'] = {
    defaultProps: {
        disableElevation: true,
    },
    styleOverrides: {
        root: ({ theme }) => ({
            '&[data-nav="true"]': {
                alignSelf: 'stretch',
                color: theme.palette.text.secondary,
                minWidth: 0,
                position: 'relative',
            },
            '&[data-nav="true"][data-active="true"]': {
                color: theme.palette.primary.main,
            },
            '&[data-nav="true"][data-active="true"]::after': {
                backgroundColor: theme.palette.primary.main,
                bottom: 0,
                content: '""',
                height: 2,
                left: theme.spacing(1),
                position: 'absolute',
                right: theme.spacing(1),
            },
        }),
        outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
        }),
    },
};
