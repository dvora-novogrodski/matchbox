import '@mui/material/styles';
import '@mui/material/Button';
import '@mui/material/Chip';

export type StatusToken = { bg: string; fg: string };

export type StatusPalette = {
    applied: StatusToken;
    interview: StatusToken;
    offer: StatusToken;
    closed: StatusToken;
};

export type SurfaceScale = { 50: string; 100: string; 200: string; 300: string; 400: string; 500: string };

declare module '@mui/material/styles' {
    interface Shape {
        borderRadiusMultipliers: [number, number, number, number, number];
    }

    interface ShapeOptions {
        borderRadiusMultipliers?: [number, number, number, number, number];
    }

    interface TypeText {
        tertiary: string;
    }

    interface Palette {
        accent: Palette['primary'];
        status: StatusPalette;
        surface: SurfaceScale;
    }

    interface PaletteOptions {
        accent?: PaletteOptions['primary'];
        status?: StatusPalette;
        surface?: SurfaceScale;
    }
}

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/Chip' {
    interface ChipPropsColorOverrides {
        accent: true;
    }
}
