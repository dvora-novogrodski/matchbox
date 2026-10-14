import type { Components, Theme } from '@mui/material/styles';

export const MuiPaper: Components<Theme>['MuiPaper'] = {
    defaultProps: {
        elevation: 0,
    },
    styleOverrides: {
        root: ({ theme }) => ({
            borderRadius: theme.spacing(1.5),
            '&[data-surface="muted"]': {
                backgroundColor: theme.palette.surface[100],
            },
        }),
    },
};
