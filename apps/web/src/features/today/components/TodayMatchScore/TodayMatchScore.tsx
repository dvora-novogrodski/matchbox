import { AIIcon, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

type TodayMatchScoreProps = {
    score: number;
};

export function TodayMatchScore({ score }: TodayMatchScoreProps) {
    const { t } = useTranslation('today');

    return (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
            <AIIcon aria-hidden color="accent" fontSize="small" />
            <Typography sx={{ color: 'accentText', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {t('card.score', { score })}
            </Typography>
        </Stack>
    );
}
