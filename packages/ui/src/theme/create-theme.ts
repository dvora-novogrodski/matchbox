import { alpha, createTheme } from '@mui/material/styles';
import { borderRadius, borderRadiusMultipliers } from '../tokens';
import { components } from './components';
import { darkPalette, lightPalette } from './palette';
import { typography } from './typography';
import { zIndex } from './z-index';

export function createMatchboxTheme() {
    return createTheme({
        cssVariables: { colorSchemeSelector: 'class' },
        colorSchemes: {
            light: { palette: lightPalette },
            dark: { palette: darkPalette },
        },
        shape: { borderRadius, borderRadiusMultipliers },
        typography,
        zIndex,
        components,
    });
}

/** Per-color disabled state (38% alpha of main), for use outside MUI's built-in disabled handling. */
export const disabledOf = (color: string) => alpha(color, 0.38);
