import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';
import type { ReactElement } from 'react';

import { google } from '../tokens';

export function GoogleIcon(props: SvgIconProps): ReactElement {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path
                d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.45a5.52 5.52 0 0 1-2.39 3.52v2.93h3.87c2.27-2.09 3.56-5.17 3.56-8.69z"
                fill={google.blue}
            />
            <path
                d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3A7.2 7.2 0 0 1 5.36 14.3H1.37v3.09A12 12 0 0 0 12 24z"
                fill={google.green}
            />
            <path d="M5.36 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.37a12 12 0 0 0 0 10.78l3.99-3.09z" fill={google.yellow} />
            <path
                d="M12 4.77a6.53 6.53 0 0 1 4.6 1.8l3.44-3.44A11.55 11.55 0 0 0 12 0 12 12 0 0 0 1.37 6.61L5.36 9.7A7.15 7.15 0 0 1 12 4.77z"
                fill={google.red}
            />
        </SvgIcon>
    );
}
