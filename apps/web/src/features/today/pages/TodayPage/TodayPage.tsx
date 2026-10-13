import type { Today } from '@matchbox/shared';
import { Alert, Box, CircularProgress, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

import { useToday } from '../../api/today.queries';
import { TodayApplicationCard, TodayMatchCard } from '../../components/TodayCard';

export function TodayPage() {
    const { t } = useTranslation('today');
    const today = useToday();

    return (
        <Box component="main" sx={{ mx: 'auto', maxWidth: 720, p: 4 }}>
            <Stack spacing={3}>
                <Stack spacing={1}>
                    <Typography component="h1" variant="h3">
                        {t('page.title')}
                    </Typography>
                    <Typography color="text.secondary">{t('page.description')}</Typography>
                </Stack>
                {today.isPending ? (
                    <CircularProgress data-test="today-loading" />
                ) : today.isError ? (
                    <Alert severity="error">{t('errors.loadFailed')}</Alert>
                ) : (
                    <TodayLists today={today.data} />
                )}
            </Stack>
        </Box>
    );
}

function TodayLists({ today }: { today: Today }) {
    const { t } = useTranslation('today');
    const caughtUp = today.matches.length === 0 && today.toTailor.length === 0 && today.followUps.length === 0;

    return (
        <Stack spacing={3}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }} useFlexGap>
                <Typography variant="body2">{t('stats.matches', { count: today.stats.matches })}</Typography>
                <Typography variant="body2">{t('stats.toTailor', { count: today.stats.toTailor })}</Typography>
                <Typography variant="body2">{t('stats.followUps', { count: today.stats.followUps })}</Typography>
                <Typography variant="body2">{t('stats.inProgress', { count: today.stats.inProgress })}</Typography>
            </Stack>
            {caughtUp ? <Typography>{t('empty')}</Typography> : null}
            {today.matches.length > 0 ? (
                <Stack spacing={1}>
                    <Typography component="h2" variant="h5">
                        {t('sections.matches')}
                    </Typography>
                    {today.matches.map((item) => (
                        <TodayMatchCard item={item} key={item.jobId} />
                    ))}
                </Stack>
            ) : null}
            {today.toTailor.length > 0 ? (
                <Stack spacing={1}>
                    <Typography component="h2" variant="h5">
                        {t('sections.toTailor')}
                    </Typography>
                    {today.toTailor.map((item) => (
                        <TodayApplicationCard item={item} key={item.applicationId} kind="tailor" />
                    ))}
                </Stack>
            ) : null}
            {today.followUps.length > 0 ? (
                <Stack spacing={1}>
                    <Typography component="h2" variant="h5">
                        {t('sections.followUps')}
                    </Typography>
                    {today.followUps.map((item) => (
                        <TodayApplicationCard item={item} key={item.applicationId} kind="follow-up" />
                    ))}
                </Stack>
            ) : null}
        </Stack>
    );
}
