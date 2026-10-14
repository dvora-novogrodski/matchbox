import '@mui/material/styles';
import '@mui/material/Badge';
import '@mui/material/Button';
import '@mui/material/Chip';
import '@mui/material/SvgIcon';

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
        accentTint: string;
        accentText: string;
        primaryTint: string;
        status: StatusPalette;
        surface: SurfaceScale;
    }

    interface PaletteOptions {
        accent?: PaletteOptions['primary'];
        accentTint?: string;
        accentText?: string;
        primaryTint?: string;
        status?: StatusPalette;
        surface?: SurfaceScale;
    }
}

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/Badge' {
    interface BadgePropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/Chip' {
    interface ChipPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/SvgIcon' {
    interface SvgIconPropsColorOverrides {
        accent: true;
    }
}
