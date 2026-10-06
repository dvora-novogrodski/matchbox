import './augmentations';

import type { PaletteOptions } from '@mui/material/styles';

import { coral, teal, warm, white } from '../tokens';

const { 0: _paper, ...greyScale } = warm;

export const lightPalette: PaletteOptions = {
    text: { primary: warm[800], secondary: warm[700], tertiary: warm[600], disabled: warm[500] },

    // White on teal 500 passes AA (4.8:1); warm 800 on teal 500 does not (3.3:1).
    primary: { light: teal[400], main: teal[500], dark: teal[600], contrastText: white },
    secondary: { light: warm[700], main: warm[800], dark: warm[900], contrastText: white },
    // Coral is the signature accent only (highlights, illustration, the "flame"), with dark text.
    accent: { light: coral[400], main: coral[500], dark: coral[600], contrastText: warm[800] },

    // Error is a deeper crimson so it never reads as the decorative coral.
    error: { light: '#D9483B', main: '#B42318', dark: '#912018', contrastText: white },
    warning: { light: '#B7791F', main: '#9A5F0E', dark: '#7C4B0A', contrastText: white },
    info: { light: '#5A89B5', main: '#3B6E9E', dark: '#2D5880', contrastText: white },
    success: { light: '#3F9159', main: '#2E7D46', dark: '#23633A', contrastText: white },

    grey: greyScale,
    action: {
        active: 'rgba(35, 35, 35, 0.56)',
        hover: 'rgba(35, 35, 35, 0.04)',
        selected: 'rgba(7, 128, 128, 0.08)',
        focus: 'rgba(7, 128, 128, 0.12)',
        disabled: 'rgba(35, 35, 35, 0.26)',
        disabledBackground: 'rgba(35, 35, 35, 0.12)',
    },
    divider: 'rgba(35, 35, 35, 0.12)',
    background: { default: warm[100], paper: warm[0] },
    surface: { 50: warm[50], 100: warm[100], 200: warm[200], 300: warm[300], 400: warm[400], 500: '#D3CBC2' },

    status: {
        applied: { bg: '#E7EEF5', fg: '#2D5880' },
        interview: { bg: '#FBEFD9', fg: '#7C4B0A' },
        offer: { bg: '#E1F1E6', fg: '#23633A' },
        // "Not this time": neutral, not red.
        closed: { bg: '#EFEBE7', fg: '#6E6A66' },
    },
};

export const darkPalette: PaletteOptions = {
    text: { primary: '#F2EFEC', secondary: '#CFCAC5', tertiary: '#A9A39D', disabled: '#6E6A66' },
    primary: { light: '#7FCFCF', main: '#4DB8B8', dark: '#2E9E9E', contrastText: '#0B2222' },
    secondary: { light: '#F2EFEC', main: '#DFD8D0', dark: '#A19C97', contrastText: warm[800] },
    accent: { light: coral[300], main: coral[400], dark: coral[500], contrastText: warm[800] },
    error: { light: '#F4A097', main: '#EE7B6F', dark: '#D9483B', contrastText: '#2A0B08' },
    warning: { light: '#EBC07E', main: '#E0A85A', dark: '#C98A2E', contrastText: '#24180A' },
    info: { light: '#A8C4DE', main: '#86AACB', dark: '#5A89B5', contrastText: '#0E1A26' },
    success: { light: '#92D1A6', main: '#6FBF8A', dark: '#4FA06C', contrastText: '#0E2416' },

    grey: greyScale,
    action: {
        active: 'rgba(242, 239, 236, 0.64)',
        hover: 'rgba(242, 239, 236, 0.06)',
        selected: 'rgba(77, 184, 184, 0.14)',
        focus: 'rgba(77, 184, 184, 0.20)',
        disabled: 'rgba(242, 239, 236, 0.30)',
        disabledBackground: 'rgba(242, 239, 236, 0.12)',
    },
    divider: 'rgba(242, 239, 236, 0.12)',
    background: { default: '#1A1917', paper: '#22211F' },
    surface: { 50: '#22211F', 100: '#272624', 200: '#2D2B29', 300: '#33312E', 400: '#3A3734', 500: '#413E3A' },

    status: {
        applied: { bg: '#22303D', fg: '#B5C9DE' },
        interview: { bg: '#3A2E17', fg: '#EBC88A' },
        offer: { bg: '#1F3526', fg: '#A6D6B3' },
        closed: { bg: '#2F2C29', fg: '#CFCAC5' },
    },
};
