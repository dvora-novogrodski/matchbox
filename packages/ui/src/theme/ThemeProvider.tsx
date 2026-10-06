import '@fontsource-variable/dm-sans';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';

import { createMatchboxTheme } from './create-theme';

export type ColorScheme = 'auto' | 'light' | 'dark';

export type ThemeProviderProps = {
    children: ReactNode;
    colorScheme?: ColorScheme;
};

const theme = createMatchboxTheme();

export function ThemeProvider({ children, colorScheme = 'auto' }: ThemeProviderProps) {
    return (
        <MuiThemeProvider theme={theme} defaultMode={colorScheme === 'auto' ? 'system' : colorScheme}>
            <CssBaseline />
            {children}
        </MuiThemeProvider>
    );
}
