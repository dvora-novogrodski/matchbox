import { Box, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

type MatchboxWordmarkProps = {
    variant?: 'h5' | 'h6';
};

export function MatchboxWordmark({ variant = 'h5' }: MatchboxWordmarkProps) {
    const { t } = useTranslation('common');

    return (
        <Typography
            component="span"
            sx={{ fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}
            variant={variant}
        >
            <Box component="span" sx={{ color: 'primary.main' }}>{t('app.titleMatch')}</Box>
            <Box component="span" sx={{ color: 'accent.main' }}>{t('app.titleBox')}</Box>
        </Typography>
    );
}
