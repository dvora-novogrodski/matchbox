import type { Status } from '@matchbox/shared';
import { Box, Stack, Typography, useTheme } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

import { statusDotColor } from '../../status-dot-color';
import { statusLabel } from '../../status-label';

type StatusDotLabelProps = {
    status: Status;
};

export function StatusDotLabel({ status }: StatusDotLabelProps) {
    const { t: tCommon } = useTranslation('common');
    const theme = useTheme();
    const color = statusDotColor(status, theme);

    return (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box
                aria-hidden
                sx={{ bgcolor: color, borderRadius: '50%', flexShrink: 0, height: 8, width: 8 }}
            />
            <Typography color="text.primary" component="span" variant="body2">
                {statusLabel(status, tCommon)}
            </Typography>
        </Stack>
    );
}
