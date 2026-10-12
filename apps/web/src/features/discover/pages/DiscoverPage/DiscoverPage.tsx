import { Alert, Box, CircularProgress, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

import { useDiscover, useSaveDiscoveredJob, useSkipDiscoveredJob } from '../../api/discover.queries';
import { DiscoverCard } from '../../components/DiscoverCard';

export function DiscoverPage() {
    const { t } = useTranslation('discover');
    const discover = useDiscover();
    const save = useSaveDiscoveredJob();
    const skip = useSkipDiscoveredJob();
    const pendingJobId = save.isPending ? save.variables : skip.isPending ? skip.variables : undefined;

    return (
        <Box component="main" sx={{ mx: 'auto', maxWidth: 720, p: 4 }}>
            <Stack spacing={3}>
                <Stack spacing={1}>
                    <Typography component="h1" variant="h3">
                        {t('page.title')}
                    </Typography>
                    <Typography color="text.secondary">{t('page.description')}</Typography>
                </Stack>
                {save.isError ? <Alert severity="error">{t('errors.saveFailed')}</Alert> : null}
                {skip.isError ? <Alert severity="error">{t('errors.skipFailed')}</Alert> : null}
                {discover.isPending ? (
                    <CircularProgress data-test="discover-loading" />
                ) : discover.isError ? (
                    <Alert severity="error">{t('errors.loadFailed')}</Alert>
                ) : discover.data.items.length === 0 ? (
                    <Typography>{t('empty')}</Typography>
                ) : (
                    <Stack spacing={2}>
                        {discover.data.items.map((item) => (
                            <DiscoverCard
                                isPending={pendingJobId === item.jobId}
                                item={item}
                                key={item.jobId}
                                onSave={() => {
                                    save.mutate(item.jobId);
                                }}
                                onSkip={() => {
                                    skip.mutate(item.jobId);
                                }}
                            />
                        ))}
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
