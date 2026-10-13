import type { TodayApplication, TodayMatch } from '@matchbox/shared';
import { Button, Card, Chip, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { formatRelativeTime } from 'src/utils/format.utils';

type TodayMatchCardProps = {
    item: TodayMatch;
};

export function TodayMatchCard({ item }: TodayMatchCardProps) {
    const { t } = useTranslation('today');

    return (
        <Card data-test={`today-match-${item.jobId}`} variant="outlined">
            <Stack spacing={1} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography component="h3" variant="subtitle1">
                        {item.companyName}
                    </Typography>
                    <Chip label={t('card.score', { score: item.score })} size="small" />
                </Stack>
                <Typography variant="body1">{item.title}</Typography>
                <Button
                    aria-label={t('actions.reviewLabel', { title: item.title })}
                    component={RouterLink}
                    data-test={`today-review-${item.jobId}`}
                    size="small"
                    to="/discover"
                    variant="contained"
                >
                    {t('actions.review')}
                </Button>
            </Stack>
        </Card>
    );
}

type TodayApplicationCardProps = {
    item: TodayApplication;
    kind: 'tailor' | 'follow-up';
};

export function TodayApplicationCard({ item, kind }: TodayApplicationCardProps) {
    const { t, i18n } = useTranslation('today');
    const when = formatRelativeTime(item.lastActivityAt, i18n.language);
    const to = kind === 'tailor' ? `/jobs/${item.jobId}/cv` : `/jobs/${item.jobId}/timeline`;
    const label =
        kind === 'tailor' ? t('actions.tailorLabel', { title: item.title }) : t('actions.openLabel', { title: item.title });

    return (
        <Card data-test={`today-${kind}-${item.applicationId}`} variant="outlined">
            <Stack spacing={1} sx={{ p: 2 }}>
                <Typography component="h3" variant="subtitle1">
                    {item.companyName}
                </Typography>
                <Typography variant="body1">{item.title}</Typography>
                <Typography color="text.secondary" variant="body2">
                    {t('card.lastActivity', { when })}
                </Typography>
                <Button
                    aria-label={label}
                    component={RouterLink}
                    data-test={`today-${kind}-button-${item.applicationId}`}
                    size="small"
                    to={to}
                    variant="contained"
                >
                    {t(kind === 'tailor' ? 'actions.tailor' : 'actions.open')}
                </Button>
            </Stack>
        </Card>
    );
}
